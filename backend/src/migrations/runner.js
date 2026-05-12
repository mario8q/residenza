/**
 * migrations/runner.js
 * Ejecutor de migraciones con soporte multi-tenant.
 *
 * Uso:
 *   node src/migrations/runner.js up           → aplica migraciones pendientes (schema public)
 *   node src/migrations/runner.js down         → revierte última migración del schema public
 *   node src/migrations/runner.js tenant <id>  → crea schema para el conjunto con ese id
 *
 * El runner lleva un registro de qué migraciones ya se aplicaron
 * en la tabla public.migrations_log.
 */

require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });

const fs   = require('fs');
const path = require('path');
const { Pool } = require('pg');

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

// ── Tabla de control de migraciones ──────────────────────────
async function ensureMigrationsTable(client) {
  await client.query(`
    CREATE TABLE IF NOT EXISTS public.migrations_log (
      id          SERIAL      PRIMARY KEY,
      filename    VARCHAR(200) NOT NULL UNIQUE,
      applied_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);
}

// ── Leer migraciones ya aplicadas ────────────────────────────
async function getApplied(client) {
  const res = await client.query('SELECT filename FROM public.migrations_log ORDER BY id');
  return res.rows.map(r => r.filename);
}

// ── Aplicar migraciones del schema public ────────────────────
async function runUp() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await ensureMigrationsTable(client);
    const applied = await getApplied(client);

    const migrationsDir = path.join(__dirname);
    const files = fs.readdirSync(migrationsDir)
      .filter(f => f.endsWith('.sql') && f.startsWith('00'))
      .sort();

    let count = 0;
    for (const file of files) {
      if (applied.includes(file)) {
        console.log(`  ⏭  Ya aplicada: ${file}`);
        continue;
      }
      const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf8');
      console.log(`  ▶  Aplicando: ${file}`);
      await client.query(sql);
      await client.query(
        'INSERT INTO public.migrations_log (filename) VALUES ($1)',
        [file]
      );
      count++;
    }

    await client.query('COMMIT');
    console.log(`\n✅ Migraciones completadas: ${count} nuevas aplicadas.\n`);
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('❌ Error en migración:', err.message);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

// ── Revertir última migración ────────────────────────────────
async function runDown() {
  const client = await pool.connect();
  try {
    await ensureMigrationsTable(client);
    const res = await client.query(
      'SELECT filename FROM public.migrations_log ORDER BY id DESC LIMIT 1'
    );
    if (res.rows.length === 0) {
      console.log('No hay migraciones aplicadas para revertir.');
      return;
    }
    const last = res.rows[0].filename;
    console.log(`⚠️  Revirtiendo: ${last}`);
    console.log('   (Undo manual requerido — edita la BD directamente para revertir cambios de schema)');
    await client.query('DELETE FROM public.migrations_log WHERE filename = $1', [last]);
    console.log('✅ Registro eliminado del log. Aplica el SQL de reversión manualmente si es necesario.');
  } finally {
    client.release();
    await pool.end();
  }
}

// ── Crear schema para un nuevo conjunto (multi-tenancy) ───────
async function createTenantSchema(conjuntoId) {
  if (!conjuntoId) {
    console.error('❌ Uso: node runner.js tenant <conjunto_id>');
    process.exit(1);
  }

  const schemaName = `conjunto_${conjuntoId}`;
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // 1. Verificar que el conjunto existe
    const check = await client.query(
      'SELECT id, nombre, schema_name FROM public.conjuntos WHERE id = $1',
      [conjuntoId]
    );
    if (check.rows.length === 0) {
      throw new Error(`No existe el conjunto con id ${conjuntoId}`);
    }
    const conjunto = check.rows[0];
    console.log(`\n📦 Creando schema para: ${conjunto.nombre} (${schemaName})`);

    // 2. Crear el schema si no existe
    await client.query(`CREATE SCHEMA IF NOT EXISTS ${schemaName}`);
    console.log(`  ✅ Schema creado: ${schemaName}`);

    // 3. Establecer search_path al schema del tenant
    await client.query(`SET search_path TO ${schemaName}, public`);

    // 4. Ejecutar la migración de tablas del tenant
    const tenantSql = fs.readFileSync(
      path.join(__dirname, '002_tenant_schema.sql'),
      'utf8'
    );
    await client.query(tenantSql);
    console.log(`  ✅ Tablas del tenant creadas en ${schemaName}`);

    // 5. Actualizar schema_name en el registro del conjunto
    await client.query(
      'UPDATE public.conjuntos SET schema_name = $1 WHERE id = $2',
      [schemaName, conjuntoId]
    );

    await client.query('COMMIT');
    console.log(`\n✅ Schema ${schemaName} listo para operar.\n`);
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('❌ Error creando schema del tenant:', err.message);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

// ── Punto de entrada CLI ──────────────────────────────────────
const [,, command, arg] = process.argv;

console.log('\n🔧 ResidenciasPro — Migrations Runner\n');

switch (command) {
  case 'up':
    runUp();
    break;
  case 'down':
    runDown();
    break;
  case 'tenant':
    createTenantSchema(arg);
    break;
  default:
    console.log('Uso:');
    console.log('  node runner.js up              → Aplica migraciones pendientes');
    console.log('  node runner.js down            → Revierte última migración');
    console.log('  node runner.js tenant <id>     → Crea schema para el conjunto <id>');
    process.exit(0);
}
