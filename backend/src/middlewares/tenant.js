/**
 * middlewares/tenant.js
 * Middleware de multi-tenancy.
 *
 * Lee el conjunto_id del JWT ya verificado y configura
 * req.tenantSchema con el nombre del schema PostgreSQL
 * correspondiente a ese conjunto.
 *
 * También expone req.tenantQuery(text, params) para ejecutar
 * queries directamente en el schema del tenant sin repetir
 * el SET search_path en cada controller.
 *
 * Orden de uso en las rutas:
 *   router.use(verifyToken, setTenant)
 */

const { pool } = require('../config/database');

/**
 * Cache simple en memoria para evitar consultar la BD
 * en cada request (los schemas raramente cambian).
 * TTL: 5 minutos.
 */
const schemaCache = new Map(); // conjuntoId → { schema, expiresAt }
const CACHE_TTL_MS = 5 * 60 * 1000;

async function setTenant(req, res, next) {
  try {
    // El middleware de auth debe haber puesto req.user = { id, conjuntoId, rol }
    const conjuntoId = req.user?.conjuntoId;

    if (!conjuntoId) {
      return res.status(400).json({ error: 'El token no contiene conjunto_id.' });
    }

    // Intentar cache
    const cached = schemaCache.get(conjuntoId);
    if (cached && cached.expiresAt > Date.now()) {
      req.tenantSchema = cached.schema;
    } else {
      // Consultar BD
      const { rows } = await pool.query(
        'SELECT schema_name FROM public.conjuntos WHERE id = $1 AND activo = TRUE',
        [conjuntoId]
      );

      if (rows.length === 0) {
        return res.status(403).json({ error: 'Conjunto no encontrado o inactivo.' });
      }

      req.tenantSchema = rows[0].schema_name;
      schemaCache.set(conjuntoId, {
        schema:    req.tenantSchema,
        expiresAt: Date.now() + CACHE_TTL_MS,
      });
    }

    /**
     * Helper adjunto al request para queries del tenant.
     * Uso en controllers:
     *   const rows = await req.tenantQuery('SELECT * FROM residentes WHERE id=$1', [id]);
     */
    req.tenantQuery = async (text, params) => {
      const client = await pool.connect();
      try {
        await client.query(`SET search_path TO ${req.tenantSchema}, public`);
        const result = await client.query(text, params);
        return result;
      } finally {
        client.release();
      }
    };

    /**
     * Helper para transacciones dentro del tenant.
     * Uso:
     *   const client = await req.tenantClient();
     *   await client.query('BEGIN');
     *   ...
     *   await client.query('COMMIT');
     *   client.release();
     */
    req.tenantClient = async () => {
      const client = await pool.connect();
      await client.query(`SET search_path TO ${req.tenantSchema}, public`);
      return client;
    };

    next();
  } catch (err) {
    next(err);
  }
}

/**
 * Limpia la entrada del cache para un conjunto específico.
 * Llamar cuando se actualiza el schema de un conjunto.
 */
function invalidateTenantCache(conjuntoId) {
  schemaCache.delete(conjuntoId);
}

module.exports = { setTenant, invalidateTenantCache };
