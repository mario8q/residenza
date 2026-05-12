/**
 * config/database.js
 * Pool de conexiones a PostgreSQL.
 * Soporta multi-tenancy por schema: cada request puede operar
 * en el schema del conjunto residencial correspondiente.
 */

const { Pool } = require('pg');

// Pool principal (schema public – usuarios y conjuntos)
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 20,                  // máximo de conexiones concurrentes
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
});

pool.on('error', (err) => {
  console.error('PostgreSQL pool error:', err.message);
});

/**
 * Ejecuta una query en el schema público.
 * @param {string} text   - SQL parametrizado
 * @param {Array}  params - Parámetros
 */
async function query(text, params) {
  const start = Date.now();
  const res = await pool.query(text, params);
  const duration = Date.now() - start;
  if (process.env.NODE_ENV === 'development') {
    console.debug(`[DB] ${duration}ms — ${text.slice(0, 80)}`);
  }
  return res;
}

/**
 * Obtiene un cliente del pool con el search_path configurado
 * al schema del conjunto indicado.
 * Usar para transacciones multi-paso dentro de un conjunto.
 *
 * @param {string} conjuntoSchema  - p.ej. 'conjunto_1'
 * @returns {pg.PoolClient}
 */
async function getConjuntoClient(conjuntoSchema) {
  const client = await pool.connect();
  // Aísla el cliente al schema del conjunto
  await client.query(`SET search_path TO ${conjuntoSchema}, public`);
  return client;
}

/**
 * Ejecuta una query dentro del schema de un conjunto específico.
 * Para queries individuales (sin transacción explícita).
 *
 * @param {string} conjuntoSchema
 * @param {string} text
 * @param {Array}  params
 */
async function conjuntoQuery(conjuntoSchema, text, params) {
  const client = await pool.connect();
  try {
    await client.query(`SET search_path TO ${conjuntoSchema}, public`);
    return await client.query(text, params);
  } finally {
    client.release();
  }
}

/**
 * Verifica que la conexión a la base de datos esté activa.
 * Llamada al arrancar el servidor.
 */
async function testConnection() {
  try {
    const res = await pool.query('SELECT NOW() AS now, current_database() AS db');
    console.log(`✅ PostgreSQL conectado — DB: ${res.rows[0].db} — ${res.rows[0].now}`);
    return true;
  } catch (err) {
    console.error('❌ Error conectando a PostgreSQL:', err.message);
    return false;
  }
}

module.exports = { query, getConjuntoClient, conjuntoQuery, testConnection, pool };
