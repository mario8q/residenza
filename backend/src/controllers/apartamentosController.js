/**
 * controllers/apartamentosController.js
 * CRUD para torres y apartamentos de cada conjunto.
 */

const { conjuntoQuery } = require('../config/database');

// ════════════════════════════════════════════════════════════════
// TORRES
// ════════════════════════════════════════════════════════════════

async function listTorres(req, res, next) {
  try {
    const result = await conjuntoQuery(
      req.tenantSchema,
      `SELECT id, nombre, num_pisos, created_at 
       FROM torres 
       ORDER BY nombre ASC`
    );
    res.json({ data: result.rows });
  } catch (err) { 
    console.error('Error listando torres:', err);
    next(err); 
  }
}

async function createTorre(req, res, next) {
  try {
    const { nombre, num_pisos } = req.body;

    if (!nombre || !nombre.trim()) {
      return res.status(400).json({ error: 'El nombre de la torre es requerido.' });
    }

    if (!num_pisos || parseInt(num_pisos) < 1) {
      return res.status(400).json({ error: 'Número de pisos debe ser >= 1.' });
    }

    // Verificar unicidad del nombre
    const existente = await conjuntoQuery(
      req.tenantSchema,
      `SELECT id FROM torres WHERE UPPER(nombre) = UPPER($1)`,
      [nombre.trim()]
    );

    if (existente.rows.length > 0) {
      return res.status(409).json({ error: `La torre ${nombre} ya existe.` });
    }

    // Crear torre
    const result = await conjuntoQuery(
      req.tenantSchema,
      `INSERT INTO torres (nombre, num_pisos)
       VALUES ($1, $2)
       RETURNING id, nombre, num_pisos, created_at`,
      [nombre.toUpperCase().trim(), parseInt(num_pisos)]
    );

    res.status(201).json({ 
      data: result.rows[0], 
      message: `Torre ${nombre.toUpperCase()} creada exitosamente.` 
    });
  } catch (err) { 
    console.error('Error creando torre:', err);
    next(err); 
  }
}

async function deleteTorre(req, res, next) {
  try {
    const { id } = req.params;

    // Verificar si tiene apartamentos
    const countRes = await conjuntoQuery(
      req.tenantSchema,
      `SELECT COUNT(*) as count FROM apartamentos WHERE torre_id = $1`,
      [parseInt(id)]
    );

    if (parseInt(countRes.rows[0].count) > 0) {
      return res.status(400).json({ error: 'No se puede eliminar una torre que tiene apartamentos.' });
    }

    // Eliminar torre
    const result = await conjuntoQuery(
      req.tenantSchema,
      `DELETE FROM torres WHERE id = $1 RETURNING *`,
      [parseInt(id)]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Torre no encontrada.' });
    }

    res.json({ message: `Torre ${result.rows[0].nombre} eliminada.` });
  } catch (err) { 
    console.error('Error eliminando torre:', err);
    next(err); 
  }
}

// ════════════════════════════════════════════════════════════════
// APARTAMENTOS
// ════════════════════════════════════════════════════════════════

async function listApartamentos(req, res, next) {
  try {
    const result = await conjuntoQuery(
      req.tenantSchema,
      `SELECT 
        a.id, a.codigo, a.numero, a.piso, a.area_m2, a.coeficiente,
        t.nombre AS torre, t.id as torre_id,
        (SELECT COUNT(*) FROM residentes WHERE apartamento_id = a.id AND activo = TRUE) > 0 AS tiene_residente
      FROM apartamentos a
      JOIN torres t ON t.id = a.torre_id
      ORDER BY t.nombre ASC, a.piso ASC, a.numero ASC`
    );
    res.json({ data: result.rows });
  } catch (err) { 
    console.error('Error listando apartamentos:', err);
    next(err); 
  }
}

async function createApartamento(req, res, next) {
  try {
    const { torre_id, numero, piso, area_m2, coeficiente } = req.body;

    // Validaciones
    if (!torre_id || !numero || !piso) {
      return res.status(400).json({ error: 'Torre, número y piso son requeridos.' });
    }

    // Verificar que la torre existe
    const torreRes = await conjuntoQuery(
      req.tenantSchema,
      `SELECT id, nombre FROM torres WHERE id = $1`,
      [parseInt(torre_id)]
    );

    if (torreRes.rows.length === 0) {
      return res.status(404).json({ error: 'Torre no encontrada.' });
    }

    const torre = torreRes.rows[0];
    const numeroFormato = numero.padStart(2, '0');
    const codigo = `${torre.nombre}-${piso}${numeroFormato}`;

    // Verificar unicidad del código
    const existente = await conjuntoQuery(
      req.tenantSchema,
      `SELECT id FROM apartamentos WHERE codigo = $1`,
      [codigo]
    );

    if (existente.rows.length > 0) {
      return res.status(409).json({ error: `El apartamento ${codigo} ya existe.` });
    }

    // Crear apartamento
    const result = await conjuntoQuery(
      req.tenantSchema,
      `INSERT INTO apartamentos (torre_id, numero, codigo, piso, area_m2, coeficiente)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, codigo, numero, piso, area_m2, coeficiente`,
      [
        parseInt(torre_id),
        numeroFormato,
        codigo,
        parseInt(piso),
        area_m2 ? parseFloat(area_m2) : null,
        coeficiente ? parseFloat(coeficiente) : 1.0
      ]
    );

    res.status(201).json({ 
      data: result.rows[0], 
      message: `Apartamento ${codigo} creado.` 
    });
  } catch (err) { 
    console.error('Error creando apartamento:', err);
    next(err); 
  }
}

async function deleteApartamento(req, res, next) {
  try {
    const { id } = req.params;

    // Verificar si tiene residente
    const resRes = await conjuntoQuery(
      req.tenantSchema,
      `SELECT COUNT(*) as count FROM residentes WHERE apartamento_id = $1 AND activo = TRUE`,
      [parseInt(id)]
    );

    if (parseInt(resRes.rows[0].count) > 0) {
      return res.status(400).json({ error: 'No se puede eliminar un apartamento que tiene un residente activo.' });
    }

    // Eliminar apartamento
    const result = await conjuntoQuery(
      req.tenantSchema,
      `DELETE FROM apartamentos WHERE id = $1 RETURNING *`,
      [parseInt(id)]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Apartamento no encontrado.' });
    }

    res.json({ message: `Apartamento ${result.rows[0].codigo} eliminado.` });
  } catch (err) { 
    console.error('Error eliminando apartamento:', err);
    next(err); 
  }
}

module.exports = { 
  listTorres, 
  createTorre, 
  deleteTorre, 
  listApartamentos, 
  createApartamento, 
  deleteApartamento 
};