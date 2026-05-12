/**
 * models/Residente.js
 * Acceso a datos de la tabla residentes dentro del schema del tenant.
 * Todas las operaciones reciben el schema_name para operar en el conjunto correcto.
 */

const { pool } = require('../config/database');

const Residente = {

  /**
   * Listar todos los residentes del conjunto, con código de apartamento incluido.
   */
  async findAll(schema) {
    const client = await pool.connect();
    try {
      await client.query(`SET search_path TO ${schema}, public`);
      const res = await client.query(`
        SELECT r.*, a.codigo AS apto_codigo, a.piso, t.nombre AS torre_nombre
        FROM residentes r
        JOIN apartamentos a ON a.id = r.apartamento_id
        JOIN torres t ON t.id = a.torre_id
        WHERE r.activo = TRUE
        ORDER BY a.codigo
      `);
      return res.rows;
    } finally { client.release(); }
  },

  /**
   * Buscar por id.
   */
  async findById(schema, id) {
    const client = await pool.connect();
    try {
      await client.query(`SET search_path TO ${schema}, public`);
      const res = await client.query(`
        SELECT r.*, a.codigo AS apto_codigo, t.nombre AS torre_nombre
        FROM residentes r
        JOIN apartamentos a ON a.id = r.apartamento_id
        JOIN torres t ON t.id = a.torre_id
        WHERE r.id = $1 AND r.activo = TRUE
      `, [id]);
      return res.rows[0] || null;
    } finally { client.release(); }
  },

  /**
   * Buscar por documento — usado para validar unicidad.
   * @param {string} schema
   * @param {string} documento
   * @param {number|null} excludeId — excluir este id (para edición)
   */
  async findByDocumento(schema, documento, excludeId = null) {
    const client = await pool.connect();
    try {
      await client.query(`SET search_path TO ${schema}, public`);
      const query = excludeId
        ? `SELECT id FROM residentes WHERE documento = $1 AND id != $2 AND activo = TRUE`
        : `SELECT id FROM residentes WHERE documento = $1 AND activo = TRUE`;
      const params = excludeId ? [documento, excludeId] : [documento];
      const res = await client.query(query, params);
      return res.rows[0] || null;
    } finally { client.release(); }
  },

  /**
   * Buscar apartamento por código dentro del conjunto.
   */
  async findApartamento(schema, codigo) {
    const client = await pool.connect();
    try {
      await client.query(`SET search_path TO ${schema}, public`);
      const res = await client.query(
        `SELECT id, codigo FROM apartamentos WHERE codigo = $1`, [codigo.toUpperCase()]
      );
      return res.rows[0] || null;
    } finally { client.release(); }
  },

  /**
   * Crear residente.
   */
  async create(schema, data) {
    const client = await pool.connect();
    try {
      await client.query(`SET search_path TO ${schema}, public`);
      const res = await client.query(`
        INSERT INTO residentes
          (apartamento_id, nombre, documento, tipo_documento, tipo_residente,
           telefono, email, fecha_ingreso)
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
        RETURNING *
      `, [
        data.apartamento_id,
        data.nombre,
        data.documento,
        data.tipo_documento || 'CC',
        data.tipo_residente || 'Propietario',
        data.telefono || null,
        data.email,
        data.fecha_ingreso || null,
      ]);
      return res.rows[0];
    } finally { client.release(); }
  },

  /**
   * Actualizar residente.
   */
  async update(schema, id, data) {
    const client = await pool.connect();
    try {
      await client.query(`SET search_path TO ${schema}, public`);

      const allowed  = ['nombre','documento','tipo_documento','tipo_residente','telefono','email','fecha_ingreso','apartamento_id'];
      const fields   = [];
      const values   = [];
      let i = 1;

      for (const key of allowed) {
        if (data[key] !== undefined) {
          fields.push(`${key} = $${i++}`);
          values.push(data[key]);
        }
      }
      if (fields.length === 0) return this.findById(schema, id);

      values.push(id);
      const res = await client.query(`
        UPDATE residentes SET ${fields.join(', ')}, updated_at = NOW()
        WHERE id = $${i} AND activo = TRUE
        RETURNING *
      `, values);
      return res.rows[0] || null;
    } finally { client.release(); }
  },

  /**
   * Soft-delete: marca activo = FALSE, no borra el registro.
   * Preserva el historial de pagos.
   */
  async delete(schema, id) {
    const client = await pool.connect();
    try {
      await client.query(`SET search_path TO ${schema}, public`);
      const res = await client.query(`
        UPDATE residentes SET activo = FALSE, updated_at = NOW()
        WHERE id = $1 AND activo = TRUE
        RETURNING id, nombre
      `, [id]);
      return res.rows[0] || null;
    } finally { client.release(); }
  },
};

module.exports = Residente;