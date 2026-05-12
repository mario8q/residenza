/**
 * models/Conjunto.js
 * Acceso a datos de la tabla public.conjuntos.
 * Incluye la lógica de creación del schema multi-tenant.
 */

const { query, pool } = require('../config/database');
const fs   = require('fs');
const path = require('path');

const Conjunto = {

  /**
   * Obtener todos los conjuntos activos.
   */
  async findAll() {
    const res = await query(
      'SELECT id, nombre, nit, ciudad, schema_name, cuota_base, num_torres, num_aptos, activo, created_at FROM public.conjuntos ORDER BY nombre'
    );
    return res.rows;
  },

  /**
   * Buscar conjunto por id.
   */
  async findById(id) {
    const res = await query(
      'SELECT * FROM public.conjuntos WHERE id = $1',
      [id]
    );
    return res.rows[0] || null;
  },

  /**
   * Buscar conjunto por schema_name (usado en el middleware de tenant).
   */
  async findBySchema(schemaName) {
    const res = await query(
      'SELECT * FROM public.conjuntos WHERE schema_name = $1 AND activo = TRUE',
      [schemaName]
    );
    return res.rows[0] || null;
  },

  /**
   * Crear un nuevo conjunto Y su schema de base de datos.
   * Opera en una transacción: si el schema falla, no se crea el registro.
   *
   * @param {Object} data - { nombre, nit, direccion, ciudad, telefono, email_admin, cuota_base, num_torres, num_aptos }
   * @returns {Object} conjunto creado con su schema_name
   */
  async create(data) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // 1. Insertar registro del conjunto (sin schema_name aún)
      const insertRes = await client.query(`
        INSERT INTO public.conjuntos
          (nombre, nit, direccion, ciudad, telefono, email_admin, schema_name, cuota_base, num_torres, num_aptos)
        VALUES ($1,$2,$3,$4,$5,$6,'conjunto_placeholder',$7,$8,$9)
        RETURNING id
      `, [
        data.nombre, data.nit || null, data.direccion || null,
        data.ciudad || null, data.telefono || null, data.email_admin || null,
        data.cuota_base || 0, data.num_torres || 1, data.num_aptos || 0,
      ]);

      const id = insertRes.rows[0].id;
      const schemaName = `conjunto_${id}`;

      // 2. Actualizar con el schema_name real
      await client.query(
        'UPDATE public.conjuntos SET schema_name = $1 WHERE id = $2',
        [schemaName, id]
      );

      // 3. Crear el schema en PostgreSQL
      await client.query(`CREATE SCHEMA IF NOT EXISTS ${schemaName}`);

      // 4. Aplicar migración de tablas del tenant
      await client.query(`SET search_path TO ${schemaName}, public`);
      const tenantSql = fs.readFileSync(
        path.join(__dirname, '../migrations/002_tenant_schema.sql'),
        'utf8'
      );
      await client.query(tenantSql);

      // 5. Reset search_path
      await client.query('SET search_path TO public');

      await client.query('COMMIT');

      return this.findById(id);
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  },

  /**
   * Actualizar datos básicos del conjunto (no migra schema).
   */
  async update(id, data) {
    const fields = [];
    const values = [];
    let i = 1;

    const allowed = ['nombre','nit','direccion','ciudad','telefono','email_admin','cuota_base','num_torres','num_aptos','activo'];
    for (const key of allowed) {
      if (data[key] !== undefined) {
        fields.push(`${key} = $${i++}`);
        values.push(data[key]);
      }
    }
    if (fields.length === 0) return this.findById(id);

    values.push(id);
    const res = await query(
      `UPDATE public.conjuntos SET ${fields.join(', ')}, updated_at = NOW() WHERE id = $${i} RETURNING *`,
      values
    );
    return res.rows[0] || null;
  },
};

module.exports = Conjunto;
