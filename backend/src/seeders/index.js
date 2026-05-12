/**
 * seeders/index.js
 * Datos de prueba para desarrollo local.
 * Crea un conjunto demo con apartamentos y residentes de prueba.
 *
 * SOLO para desarrollo — nunca ejecutar en producción.
 */

require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });

const { Pool } = require('pg');
const bcrypt   = require('bcryptjs');

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function seed() {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    console.log('\n🌱 ResidenciasPro — Seeder de desarrollo\n');

    // ── 1. Crear conjunto demo en schema public ───────────────
    const conjuntoRes = await client.query(`
      INSERT INTO public.conjuntos
        (nombre, nit, direccion, ciudad, telefono, email_admin, schema_name, cuota_base, num_torres, num_aptos)
      VALUES
        ('Conjunto Bello Horizonte', '900123456-1', 'Calle 45 # 23-10',
         'Pasto', '6027550000', 'admin@bellohorizonte.co', 'conjunto_1', 210000, 2, 48)
      ON CONFLICT (schema_name) DO UPDATE SET nombre = EXCLUDED.nombre
      RETURNING id, schema_name
    `);
    const conjunto = conjuntoRes.rows[0];
    console.log(`  ✅ Conjunto creado: ID ${conjunto.id} → ${conjunto.schema_name}`);

    // ── 2. Crear admin del conjunto ───────────────────────────
    const adminHash = await bcrypt.hash('Admin2025!', 10);
    await client.query(`
      INSERT INTO public.conjunto_admins
        (conjunto_id, email, password_hash, nombre, telefono)
      VALUES ($1, 'admin@bellohorizonte.co', $2, 'Carlos Administrador', '3145550000')
      ON CONFLICT (conjunto_id, email) DO NOTHING
    `, [conjunto.id, adminHash]);
    console.log(`  ✅ Administrador creado: admin@bellohorizonte.co / Admin2025!`);

    // ── 3. Crear schema del tenant si no existe ───────────────
    await client.query(`CREATE SCHEMA IF NOT EXISTS ${conjunto.schema_name}`);
    await client.query(`SET search_path TO ${conjunto.schema_name}, public`);
    console.log(`  ✅ Search path → ${conjunto.schema_name}`);

    // ── 4. Torres ─────────────────────────────────────────────
    await client.query(`
      INSERT INTO torres (nombre, num_pisos) VALUES
        ('A', 4), ('B', 4)
      ON CONFLICT DO NOTHING
    `);
    const torresRes = await client.query('SELECT id, nombre FROM torres ORDER BY nombre');
    const torres = {};
    torresRes.rows.forEach(t => { torres[t.nombre] = t.id; });
    console.log(`  ✅ Torres: A (id ${torres['A']}), B (id ${torres['B']})`);

    // ── 5. Apartamentos ───────────────────────────────────────
    const aptos = [];
    for (const [tNombre, tId] of Object.entries(torres)) {
      for (let piso = 1; piso <= 4; piso++) {
        for (let num = 1; num <= 6; num++) {
          const numero  = `${piso}0${num}`;
          const codigo  = `${tNombre}-${numero}`;
          aptos.push([tId, numero, codigo, piso]);
        }
      }
    }
    for (const [tId, numero, codigo, piso] of aptos) {
      await client.query(`
        INSERT INTO apartamentos (torre_id, numero, codigo, piso)
        VALUES ($1, $2, $3, $4)
        ON CONFLICT (codigo) DO NOTHING
      `, [tId, numero, codigo, piso]);
    }
    console.log(`  ✅ ${aptos.length} apartamentos creados`);

    // ── 6. Residentes de prueba ───────────────────────────────
    const aptosRes = await client.query(
      "SELECT id, codigo FROM apartamentos WHERE codigo IN ('A-101','A-202','B-104','B-305','A-401','B-201','A-301','B-402')"
    );
    const aptoMap = {};
    aptosRes.rows.forEach(a => { aptoMap[a.codigo] = a.id; });

    const resHash = await bcrypt.hash('Residente2025!', 10);
    const residentes = [
      [aptoMap['A-101'], 'María López',  '52001234', 'CC', 'Propietario',  '3145551234', 'm.lopez@mail.com'],
      [aptoMap['A-202'], 'Sandra Pérez', '39005678', 'CC', 'Arrendatario', '3215555678', 's.perez@mail.com'],
      [aptoMap['B-104'], 'Jhon Ramírez', '80009012', 'CC', 'Propietario',  '3005559012', 'j.ramirez@mail.com'],
      [aptoMap['B-305'], 'Luis Torres',  '79003456', 'CC', 'Propietario',  '3105553456', 'l.torres@mail.com'],
      [aptoMap['A-401'], 'Clara Muñoz',  '43007890', 'CC', 'Arrendatario', '3155557890', 'c.munoz@mail.com'],
      [aptoMap['B-201'], 'Pedro Vargas', '91002345', 'CC', 'Propietario',  '3185552345', 'p.vargas@mail.com'],
      [aptoMap['A-301'], 'Ana Gómez',    '55004567', 'CC', 'Propietario',  '3125554567', 'a.gomez@mail.com'],
      [aptoMap['B-402'], 'Carlos Nieto', '71006789', 'CC', 'Arrendatario', '3165556789', 'c.nieto@mail.com'],
    ];

    for (const [aId, nombre, doc, tipoDoc, tipoRes, tel, email] of residentes) {
      await client.query(`
        INSERT INTO residentes
          (apartamento_id, nombre, documento, tipo_documento, tipo_residente, telefono, email, password_hash, fecha_ingreso)
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8, CURRENT_DATE)
        ON CONFLICT (documento) DO NOTHING
      `, [aId, nombre, doc, tipoDoc, tipoRes, tel, email, resHash]);
    }
    console.log(`  ✅ ${residentes.length} residentes creados (contraseña: Residente2025!)`);

    // ── 7. Período de prueba (Febrero 2025) ───────────────────
    await client.query(`
      INSERT INTO periodos (anio, mes, cuota_base, fecha_vence, tasa_mora)
      VALUES (2025, 2, 210000, '2025-02-05', 0.0150)
      ON CONFLICT (anio, mes) DO NOTHING
    `);
    console.log(`  ✅ Período Feb 2025 creado`);

    await client.query('COMMIT');
    console.log('\n✅ Seeder completado exitosamente.\n');
    console.log('  Credenciales de prueba:');
    console.log('  Admin:    admin@bellohorizonte.co / Admin2025!');
    console.log('  Residente: m.lopez@mail.com / Residente2025!\n');

  } catch (err) {
    await client.query('ROLLBACK');
    console.error('❌ Error en seeder:', err.message);
    console.error(err.stack);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

seed();
