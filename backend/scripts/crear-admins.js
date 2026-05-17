require('dotenv').config({
  path: require('path').resolve(__dirname, '../.env'),
});

const { Pool } = require('pg');
const bcrypt = require('bcryptjs');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function crearAdmins() {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // Buscar el conjunto
    const conjRes = await client.query(`
      SELECT id
      FROM public.conjuntos
      WHERE schema_name = 'conjunto_1'
      LIMIT 1
    `);

    if (conjRes.rows.length === 0) {
      throw new Error('Conjunto no encontrado.');
    }

    const conjuntoId = conjRes.rows[0].id;

    // ==============================
    // ADMIN 1
    // ==============================

    const admin1Email = 'admin1@residencias.co';
    const admin1Pass = 'Admin_Nuevo_1';

    const admin1Hash = await bcrypt.hash(admin1Pass, 10);

    await client.query(`
      INSERT INTO public.conjunto_admins
        (
          conjunto_id,
          email,
          password_hash,
          nombre,
          telefono,
          activo,
          created_at
        )
      VALUES
        ($1, $2, $3, $4, $5, TRUE, NOW())
      ON CONFLICT (conjunto_id, email)
      DO UPDATE SET
        password_hash = EXCLUDED.password_hash,
        nombre = EXCLUDED.nombre,
        telefono = EXCLUDED.telefono,
        activo = TRUE
    `, [
      conjuntoId,
      admin1Email.toLowerCase().trim(),
      admin1Hash,
      'Nuevo Admin 1',
      '3101234567',
    ]);

    // ==============================
    // ADMIN 2
    // ==============================

    const admin2Email = 'admin2@residencias.co';
    const admin2Pass = 'Admin_Nuevo_2';

    const admin2Hash = await bcrypt.hash(admin2Pass, 10);

    await client.query(`
      INSERT INTO public.conjunto_admins
        (
          conjunto_id,
          email,
          password_hash,
          nombre,
          telefono,
          activo,
          created_at
        )
      VALUES
        ($1, $2, $3, $4, $5, TRUE, NOW())
      ON CONFLICT (conjunto_id, email)
      DO UPDATE SET
        password_hash = EXCLUDED.password_hash,
        nombre = EXCLUDED.nombre,
        telefono = EXCLUDED.telefono,
        activo = TRUE
    `, [
      conjuntoId,
      admin2Email.toLowerCase().trim(),
      admin2Hash,
      'Nuevo Admin 2',
      '3107654321',
    ]);

    await client.query('COMMIT');

    console.log('\n========================================');
    console.log('✅ ADMINS CREADOS / ACTUALIZADOS');
    console.log('========================================\n');

    console.log('Admin 1');
    console.log('Email:    ', admin1Email);
    console.log('Password: ', admin1Pass);
    console.log('');

    console.log('Admin 2');
    console.log('Email:    ', admin2Email);
    console.log('Password: ', admin2Pass);
    console.log('');

    // Verificación rápida
    const verify = await client.query(`
      SELECT
        email,
        activo
      FROM public.conjunto_admins
      WHERE email IN ($1, $2)
    `, [admin1Email, admin2Email]);

    console.log('Verificación en BD:');
    console.table(verify.rows);

  } catch (err) {
    await client.query('ROLLBACK');

    console.error('\n❌ ERROR CREANDO ADMINS');
    console.error(err.message);

  } finally {
    client.release();
    await pool.end();
  }
}

crearAdmins();