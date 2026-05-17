// backend/scripts/crear-conjunto-nuevo.js
require('dotenv').config({
  path: require('path').resolve(__dirname, '../.env'),
});

const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function crearConjuntoNuevo() {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    console.log('\n🏗️  Creando nuevo conjunto residencial...\n');

    // 1. Crear registro del conjunto en public
    const conjRes = await client.query(`
      INSERT INTO public.conjuntos
        (nombre, nit, direccion, ciudad, telefono, email_admin, schema_name, cuota_base, num_torres, num_aptos)
      VALUES
        ($1, $2, $3, $4, $5, $6, 'conjunto_placeholder', $7, $8, $9)
      RETURNING id
    `, [
      'Conjunto Residencial Nuevo',
      '900654321-2',
      'Calle Principal # 50-20',
      'Pasto',
      '6027551234',
      'admin@conjuntonuevo.co',
      250000,  // cuota base
      2,       // torres
      0        // apartamentos (empezamos en 0)
    ]);

    const conjuntoId = conjRes.rows[0].id;
    const schemaName = `conjunto_${conjuntoId}`;

    // 2. Actualizar el conjunto con el schema_name real
    await client.query(
      'UPDATE public.conjuntos SET schema_name = $1 WHERE id = $2',
      [schemaName, conjuntoId]
    );
    console.log(`✅ Conjunto creado: ID ${conjuntoId} → ${schemaName}`);

    // 3. Crear el schema en PostgreSQL
    await client.query(`CREATE SCHEMA IF NOT EXISTS ${schemaName}`);
    console.log(`✅ Schema PostgreSQL creado: ${schemaName}`);

    // 4. Aplicar migraciones de tenant (tablas vacías)
    await client.query(`SET search_path TO ${schemaName}, public`);
    
    const tenantSql = fs.readFileSync(
      path.join(__dirname, '../src/migrations/002_tenant_schema.sql'),
      'utf8'
    );
    await client.query(tenantSql);
    console.log(`✅ Tablas de tenant creadas (vacías)`);

    // 5. Reset search_path
    await client.query('SET search_path TO public');

    // 6. Crear admin para el conjunto
    const adminEmail = 'admin@conjuntonuevo.co';
    const adminPass = 'Admin_Nuevo_2025';
    const adminHash = await bcrypt.hash(adminPass, 10);

    await client.query(`
      INSERT INTO public.conjunto_admins
        (conjunto_id, email, password_hash, nombre, telefono, activo, created_at)
      VALUES
        ($1, $2, $3, $4, $5, TRUE, NOW())
    `, [
      conjuntoId,
      adminEmail.toLowerCase().trim(),
      adminHash,
      'Administrador Nuevo Conjunto',
      '3105556789',
    ]);
    console.log(`✅ Admin creado: ${adminEmail} / ${adminPass}`);

    await client.query('COMMIT');

    console.log('\n✅ Nuevo conjunto creado exitosamente.\n');
    console.log('📋 Datos del nuevo conjunto:');
    console.log(`   - ID: ${conjuntoId}`);
    console.log(`   - Schema: ${schemaName}`);
    console.log(`   - Admin: ${adminEmail}`);
    console.log(`   - Contraseña: ${adminPass}`);
    console.log(`   - Cuota base: $250.000`);
    console.log('\n💡 Ahora puedes empezar a registrar residentes desde el panel del admin.\n');

  } catch (err) {
    await client.query('ROLLBACK');
    console.error('❌ Error creando conjunto:', err.message);
    console.error(err.stack);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

crearConjuntoNuevo();