/**
 * controllers/authController.js
 * Lógica de login, refresh y logout.
 *
 * Flujo de tokens:
 *  - Access token:  vida corta (8h), viaja en Authorization header
 *  - Refresh token: vida larga (7d), viaja en HttpOnly cookie
 */

const bcrypt = require('bcryptjs');
const jwt    = require('jsonwebtoken');
const { query } = require('../config/database');

const ACCESS_TTL  = process.env.JWT_EXPIRES_IN         || '8h';
const REFRESH_TTL = process.env.JWT_REFRESH_EXPIRES_IN || '7d';

// ── Helpers ───────────────────────────────────────────────────

function generateTokens(payload) {
  const access = jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: ACCESS_TTL,
  });
  const refresh = jwt.sign(
    { id: payload.id, type: 'refresh' },
    process.env.JWT_SECRET,
    { expiresIn: REFRESH_TTL }
  );
  return { access, refresh };
}

function setRefreshCookie(res, token) {
  res.cookie('refreshToken', token, {
    httpOnly: true,
    secure:   process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge:   7 * 24 * 60 * 60 * 1000, // 7 días en ms
  });
}

// ── Login ─────────────────────────────────────────────────────

async function login(req, res, next) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email y contraseña son requeridos.' });
    }

    // Buscar admin del conjunto
    const result = await query(
      `SELECT ca.id, ca.email, ca.nombre, ca.password_hash, ca.conjunto_id, ca.activo,
              c.schema_name, c.nombre AS conjunto_nombre
       FROM public.conjunto_admins ca
       JOIN public.conjuntos c ON c.id = ca.conjunto_id
       WHERE ca.email = $1`,
      [email.toLowerCase().trim()]
    );

    const admin = result.rows[0];

    // Mismo mensaje para usuario no encontrado o contraseña incorrecta (seguridad)
    if (!admin) {
      return res.status(401).json({ error: 'Credenciales inválidas.' });
    }

    if (!admin.activo) {
      return res.status(401).json({ error: 'Usuario inactivo. Contacta al administrador.' });
    }

    const passwordOk = await bcrypt.compare(password, admin.password_hash);
    if (!passwordOk) {
      return res.status(401).json({ error: 'Credenciales inválidas.' });
    }

    // Actualizar último login
    await query(
      'UPDATE public.conjunto_admins SET ultimo_login = NOW() WHERE id = $1',
      [admin.id]
    );

    // Generar tokens
    const payload = {
      id:         admin.id,
      email:      admin.email,
      nombre:     admin.nombre,
      rol:        'admin',
      conjuntoId: admin.conjunto_id,
      schema:     admin.schema_name,
    };

    const { access, refresh } = generateTokens(payload);
    setRefreshCookie(res, refresh);

    return res.json({
      accessToken: access,
      user: {
        id:              admin.id,
        email:           admin.email,
        nombre:          admin.nombre,
        rol:             'admin',
        conjuntoId:      admin.conjunto_id,
        conjuntoNombre:  admin.conjunto_nombre,
      },
    });
  } catch (err) {
    next(err);
  }
}

// ── Refresh ───────────────────────────────────────────────────

async function refresh(req, res, next) {
  try {
    const token = req.cookies?.refreshToken;

    if (!token) {
      return res.status(401).json({ error: 'Refresh token no encontrado.' });
    }

    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch {
      return res.status(401).json({ error: 'Refresh token inválido o expirado.' });
    }

    if (decoded.type !== 'refresh') {
      return res.status(401).json({ error: 'Token inválido.' });
    }

    // Obtener datos actualizados del admin
    const result = await query(
      `SELECT ca.id, ca.email, ca.nombre, ca.activo, ca.conjunto_id, c.schema_name
       FROM public.conjunto_admins ca
       JOIN public.conjuntos c ON c.id = ca.conjunto_id
       WHERE ca.id = $1`,
      [decoded.id]
    );

    const admin = result.rows[0];
    if (!admin || !admin.activo) {
      return res.status(401).json({ error: 'Usuario no encontrado o inactivo.' });
    }

    const payload = {
      id:         admin.id,
      email:      admin.email,
      nombre:     admin.nombre,
      rol:        'admin',
      conjuntoId: admin.conjunto_id,
      schema:     admin.schema_name,
    };

    const { access, refresh: newRefresh } = generateTokens(payload);
    setRefreshCookie(res, newRefresh);

    return res.json({ accessToken: access });
  } catch (err) {
    next(err);
  }
}

// ── Logout ────────────────────────────────────────────────────

function logout(_req, res) {
  res.clearCookie('refreshToken');
  return res.json({ message: 'Sesión cerrada correctamente.' });
}

// ── Login Residente ───────────────────────────────────────────

async function loginResidente(req, res, next) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email y contraseña son requeridos.' });
    }

    // Obtener todos los conjuntos activos
    const conjuntosRes = await query(
      'SELECT id, schema_name, nombre FROM public.conjuntos WHERE activo = TRUE'
    );
    const conjuntos = conjuntosRes.rows;

    // Buscar el residente en todos los conjuntos
    let residente = null;
    let conjuntoInfo = null;

    for (const conjunto of conjuntos) {
      const { conjuntoQuery } = require('../config/database');
      const resRes = await conjuntoQuery(
        conjunto.schema_name,
        `SELECT r.id, r.email, r.nombre, r.password_hash, r.activo, r.apartamento_id,
                a.codigo AS apto_codigo, t.nombre AS torre_nombre
         FROM residentes r
         JOIN apartamentos a ON a.id = r.apartamento_id
         JOIN torres t ON t.id = a.torre_id
         WHERE r.email = $1`,
        [email.toLowerCase().trim()]
      );

      if (resRes.rows.length > 0) {
        residente = resRes.rows[0];
        conjuntoInfo = conjunto;
        break;
      }
    }

    if (!residente) {
      return res.status(401).json({ error: 'Credenciales inválidas.' });
    }

    if (!residente.activo) {
      return res.status(401).json({ error: 'Usuario inactivo. Contacta al administrador.' });
    }

    // Validar contraseña
    const passwordOk = await bcrypt.compare(password, residente.password_hash);
    if (!passwordOk) {
      return res.status(401).json({ error: 'Credenciales inválidas.' });
    }

    // Actualizar último login (en el schema del conjunto)
    const { getConjuntoClient } = require('../config/database');
    const client = await getConjuntoClient(conjuntoInfo.schema_name);
    try {
      await client.query(
        'UPDATE residentes SET ultimo_login = NOW() WHERE id = $1',
        [residente.id]
      );
    } finally {
      client.release();
    }

    // Generar tokens
    const payload = {
      id:          residente.id,
      email:       residente.email,
      nombre:      residente.nombre,
      rol:         'residente',
      conjuntoId:  conjuntoInfo.id,
      schema:      conjuntoInfo.schema_name,
      apartamento: residente.apto_codigo,
    };

    const { access, refresh } = generateTokens(payload);
    setRefreshCookie(res, refresh);

    return res.json({
      accessToken: access,
      user: {
        id:              residente.id,
        email:           residente.email,
        nombre:          residente.nombre,
        rol:             'residente',
        conjuntoId:      conjuntoInfo.id,
        conjuntoNombre:  conjuntoInfo.nombre,
        apartamento:     residente.apto_codigo,
        torre:           residente.torre_nombre,
      },
    });
  } catch (err) {
    next(err);
  }
}

// ── Registro Residente ────────────────────────────────────────

async function registerResidente(req, res, next) {
  try {
    const { nombre, documento, tipo_documento, email, apto_codigo, password, passwordConfirm } = req.body;

    // Validaciones
    if (!nombre || !documento || !email || !apto_codigo || !password || !passwordConfirm) {
      return res.status(400).json({ error: 'Todos los campos son requeridos.' });
    }

    if (password !== passwordConfirm) {
      return res.status(400).json({ error: 'Las contraseñas no coinciden.' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'La contraseña debe tener al menos 6 caracteres.' });
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ error: 'Formato de email inválido.' });
    }

    // Obtener todos los conjuntos activos para encontrar el apartamento
    const { conjuntoQuery } = require('../config/database');
    const conjuntosRes = await query(
      'SELECT id, schema_name, nombre FROM public.conjuntos WHERE activo = TRUE'
    );
    const conjuntos = conjuntosRes.rows;

    let apartamento = null;
    let conjuntoInfo = null;

    // Buscar el apartamento en todos los conjuntos
    for (const conjunto of conjuntos) {
      const aptRes = await conjuntoQuery(
        conjunto.schema_name,
        `SELECT id, codigo, torre_id FROM apartamentos WHERE codigo = $1`,
        [apto_codigo.toUpperCase()]
      );

      if (aptRes.rows.length > 0) {
        apartamento = aptRes.rows[0];
        conjuntoInfo = conjunto;
        break;
      }
    }

    if (!apartamento) {
      return res.status(404).json({ error: `Apartamento ${apto_codigo} no encontrado en ningún conjunto.` });
    }

    // Verificar que el email no exista en el conjunto
    const { conjuntoQuery: conjuntoQuery2 } = require('../config/database');
    const emailRes = await conjuntoQuery2(
      conjuntoInfo.schema_name,
      `SELECT id FROM residentes WHERE email = $1 AND activo = TRUE`,
      [email.toLowerCase().trim()]
    );

    if (emailRes.rows.length > 0) {
      return res.status(409).json({ error: 'Este email ya está registrado en el sistema.' });
    }

    // Verificar que el documento no exista en el conjunto
    const docRes = await conjuntoQuery2(
      conjuntoInfo.schema_name,
      `SELECT id FROM residentes WHERE documento = $1 AND activo = TRUE`,
      [documento]
    );

    if (docRes.rows.length > 0) {
      return res.status(409).json({ error: `Ya existe un residente con el documento ${documento} en este conjunto.` });
    }

    // Hashear contraseña
    const password_hash = await bcrypt.hash(password, 10);

    // Crear residente
    const { getConjuntoClient } = require('../config/database');
    const client = await getConjuntoClient(conjuntoInfo.schema_name);
    try {
      const createRes = await client.query(`
        INSERT INTO residentes
          (apartamento_id, nombre, documento, tipo_documento, email, password_hash, activo, fecha_ingreso)
        VALUES ($1, $2, $3, $4, $5, $6, TRUE, NOW())
        RETURNING id, nombre, email
      `, [
        apartamento.id,
        nombre,
        documento,
        tipo_documento || 'CC',
        email.toLowerCase().trim(),
        password_hash,
      ]);

      const nuevoResidente = createRes.rows[0];

      // Generar tokens automáticamente después del registro
      const payload = {
        id:          nuevoResidente.id,
        email:       nuevoResidente.email,
        nombre:      nuevoResidente.nombre,
        rol:         'residente',
        conjuntoId:  conjuntoInfo.id,
        schema:      conjuntoInfo.schema_name,
        apartamento: apto_codigo.toUpperCase(),
      };

      const { access, refresh } = generateTokens(payload);
      setRefreshCookie(res, refresh);

      return res.status(201).json({
        accessToken: access,
        user: {
          id:              nuevoResidente.id,
          email:           nuevoResidente.email,
          nombre:          nuevoResidente.nombre,
          rol:             'residente',
          conjuntoId:      conjuntoInfo.id,
          conjuntoNombre:  conjuntoInfo.nombre,
          apartamento:     apto_codigo.toUpperCase(),
        },
        message: 'Registro completado. Bienvenido!',
      });
    } finally {
      client.release();
    }
  } catch (err) {
    next(err);
  }
}

// ── Cambiar Contraseña ────────────────────────────────────────

async function cambiarPassword(req, res, next) {
  try {
    const { passwordActual, passwordNueva } = req.body;
    const userId = req.user.id;
    const userRol = req.user.rol;

    if (!passwordActual || !passwordNueva) {
      return res.status(400).json({ error: 'Contraseña actual y nueva requeridas.' });
    }

    if (passwordNueva.length < 6) {
      return res.status(400).json({ error: 'La contraseña debe tener al menos 6 caracteres.' });
    }

    let tabla, campo = 'id';
    if (userRol === 'admin') {
      tabla = 'public.conjunto_admins';
      campo = 'id';
    } else if (userRol === 'residente') {
      tabla = 'residentes'; // en el schema del conjunto
      campo = 'id';
    } else {
      return res.status(403).json({ error: 'Rol no válido.' });
    }

    // Obtener password actual
    let result;
    if (userRol === 'admin') {
      result = await query(`SELECT password_hash FROM ${tabla} WHERE id = $1`, [userId]);
    } else {
      const { getConjuntoClient } = require('../config/database');
      const client = await getConjuntoClient(req.user.schema);
      try {
        const queryResult = await client.query(`SELECT password_hash FROM residentes WHERE id = $1`, [userId]);
        result = queryResult;
      } finally {
        client.release();
      }
    }

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Usuario no encontrado.' });
    }

    const passwordOk = await bcrypt.compare(passwordActual, result.rows[0].password_hash);
    if (!passwordOk) {
      return res.status(401).json({ error: 'Contraseña actual incorrecta.' });
    }

    // Hashear nueva contraseña
    const nuevoHash = await bcrypt.hash(passwordNueva, 10);

    // Actualizar
    if (userRol === 'admin') {
      await query(`UPDATE ${tabla} SET password_hash = $1 WHERE id = $2`, [nuevoHash, userId]);
    } else {
      const { getConjuntoClient } = require('../config/database');
      const client = await getConjuntoClient(req.user.schema);
      try {
        await client.query(`UPDATE residentes SET password_hash = $1 WHERE id = $2`, [nuevoHash, userId]);
      } finally {
        client.release();
      }
    }

    return res.json({ message: 'Contraseña cambiada correctamente.' });
  } catch (err) {
    next(err);
  }
}

module.exports = { login, loginResidente, registerResidente, cambiarPassword, refresh, logout };