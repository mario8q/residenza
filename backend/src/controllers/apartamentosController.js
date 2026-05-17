const { pool } = require('../config/database');

// ── TORRES ────────────────────────────────────────────────────
async function listTorres(req, res, next) {
  try {
    const { rows } = await pool.query(`
      SELECT id, nombre, num_pisos, created_at 
      FROM ${req.tenantSchema}.torres 
      ORDER BY nombre ASC
    `);
    res.json({ data: rows });
  } catch (err) { next(err); }
}

async function createTorre(req, res, next) {
  try {
    const { nombre, num_pisos } = req.body;

    if (!nombre) return res.status(400).json({ error: 'El nombre de la torre es requerido.' });
    if (!num_pisos || num_pisos < 1) return res.status(400).json({ error: 'Número de pisos debe ser >= 1.' });

    // Verificar que el nombre sea único
    const existente = await pool.query(
      `SELECT id FROM ${req.tenantSchema}.torres WHERE UPPER(nombre) = UPPER($1)`,
      [nombre]
    );
    if (existente.rows.length > 0) {
      return res.status(409).json({ error: `La torre ${nombre} ya existe.` });
    }

    const { rows } = await pool.query(`
      INSERT INTO ${req.tenantSchema}.torres (nombre, num_pisos)
      VALUES ($1, $2)
      RETURNING id, nombre, num_pisos, created_at
    `, [nombre.toUpperCase().trim(), parseInt(num_pisos)]);

    res.status(201).json({ data: rows[0], message: `Torre ${nombre} creada exitosamente.` });
  } catch (err) { next(err); }
}

async function deleteTorre(req, res, next) {
  try {
    const { id } = req.params;

    // Verificar si tiene apartamentos
    const apartamentos = await pool.query(
      `SELECT COUNT(*) as count FROM ${req.tenantSchema}.apartamentos WHERE torre_id = $1`,
      [id]
    );
    if (apartamentos.rows[0].count > 0) {
      return res.status(400).json({ error: 'No se puede eliminar una torre que tiene apartamentos.' });
    }

    const { rows } = await pool.query(
      `DELETE FROM ${req.tenantSchema}.torres WHERE id = $1 RETURNING *`,
      [id]
    );

    if (rows.length === 0) return res.status(404).json({ error: 'Torre no encontrada.' });
    res.json({ message: `Torre ${rows[0].nombre} eliminada.` });
  } catch (err) { next(err); }
}

// ── APARTAMENTOS ──────────────────────────────────────────────
async function listApartamentos(req, res, next) {
  try {
    const { rows } = await pool.query(`
      SELECT 
        a.id, a.codigo, a.numero, a.piso, a.area_m2, a.coeficiente,
        t.nombre AS torre, t.id as torre_id,
        COUNT(r.id) > 0 AS tiene_residente
      FROM ${req.tenantSchema}.apartamentos a
      JOIN ${req.tenantSchema}.torres t ON t.id = a.torre_id
      LEFT JOIN ${req.tenantSchema}.residentes r ON r.apartamento_id = a.id AND r.activo = TRUE
      GROUP BY a.id, t.id
      ORDER BY t.nombre, a.piso, a.numero
    `);
    res.json({ data: rows });
  } catch (err) { next(err); }
}

async function createApartamento(req, res, next) {
  try {
    const { torre_id, numero, piso, area_m2, coeficiente } = req.body;

    if (!torre_id || !numero || !piso) {
      return res.status(400).json({ error: 'Torre, número y piso son requeridos.' });
    }

    // Verificar que la torre existe
    const torre = await pool.query(
      `SELECT id, nombre FROM ${req.tenantSchema}.torres WHERE id = $1`,
      [torre_id]
    );
    if (torre.rows.length === 0) return res.status(404).json({ error: 'Torre no encontrada.' });

    const codigo = `${torre.rows[0].nombre}-${piso}${numero.padStart(2, '0')}`;

    // Verificar unicidad del código
    const existente = await pool.query(
      `SELECT id FROM ${req.tenantSchema}.apartamentos WHERE codigo = $1`,
      [codigo]
    );
    if (existente.rows.length > 0) {
      return res.status(409).json({ error: `El apartamento ${codigo} ya existe.` });
    }

    const { rows } = await pool.query(`
      INSERT INTO ${req.tenantSchema}.apartamentos (torre_id, numero, codigo, piso, area_m2, coeficiente)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING id, codigo, numero, piso, area_m2, coeficiente
    `, [torre_id, numero, codigo, piso, area_m2 || null, coeficiente || 1.0]);

    res.status(201).json({ data: rows[0], message: `Apartamento ${codigo} creado.` });
  } catch (err) { next(err); }
}

async function deleteApartamento(req, res, next) {
  try {
    const { id } = req.params;

    // Verificar si tiene residente
    const residente = await pool.query(
      `SELECT COUNT(*) as count FROM ${req.tenantSchema}.residentes WHERE apartamento_id = $1 AND activo = TRUE`,
      [id]
    );
    if (residente.rows[0].count > 0) {
      return res.status(400).json({ error: 'No se puede eliminar un apartamento que tiene un residente activo.' });
    }

    const { rows } = await pool.query(
      `DELETE FROM ${req.tenantSchema}.apartamentos WHERE id = $1 RETURNING *`,
      [id]
    );

    if (rows.length === 0) return res.status(404).json({ error: 'Apartamento no encontrado.' });
    res.json({ message: `Apartamento ${rows[0].codigo} eliminado.` });
  } catch (err) { next(err); }
}

module.exports = { listTorres, createTorre, deleteTorre, listApartamentos, createApartamento, deleteApartamento };