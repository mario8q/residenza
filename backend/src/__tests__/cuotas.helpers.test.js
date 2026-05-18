/**
 * Tests para las funciones helper de cuotas (getOrCreatePeriodo, getOrCreateObligacion)
 * extraídas como módulo testeable.
 * Ruta: backend/src/__tests__/cuotas.helpers.test.js
 */

// Simulamos el client de pg
function makeClient(queryResults = []) {
  let callIndex = 0;
  return {
    query: jest.fn(() => {
      const result = queryResults[callIndex] || { rows: [] };
      callIndex++;
      return Promise.resolve(result);
    }),
  };
}

// Copias inline de los helpers de cuotas.js para testearlos aislados
async function getOrCreatePeriodo(client, anio, mes, cuotaBase) {
  const ex = await client.query(
    `SELECT id FROM periodos WHERE anio=$1 AND mes=$2`, [anio, mes]
  );
  if (ex.rows.length > 0) return ex.rows[0].id;
  const fechaVence = `${anio}-${String(mes).padStart(2,'0')}-05`;
  const ins = await client.query(
    `INSERT INTO periodos (anio, mes, cuota_base, fecha_vence, tasa_mora) VALUES ($1,$2,$3,$4,0.0150) RETURNING id`,
    [anio, mes, cuotaBase, fechaVence]
  );
  return ins.rows[0].id;
}

async function getOrCreateObligacion(client, periodoId, apartamentoId, monto) {
  const ex = await client.query(
    `SELECT id FROM obligaciones WHERE periodo_id=$1 AND apartamento_id=$2`,
    [periodoId, apartamentoId]
  );
  if (ex.rows.length > 0) return ex.rows[0].id;
  const ins = await client.query(
    `INSERT INTO obligaciones (periodo_id, apartamento_id, monto_base) VALUES ($1,$2,$3) RETURNING id`,
    [periodoId, apartamentoId, monto]
  );
  return ins.rows[0].id;
}

// ── getOrCreatePeriodo ────────────────────────────────────────

describe('getOrCreatePeriodo', () => {
  test('retorna el id existente si el período ya existe', async () => {
    const client = makeClient([{ rows: [{ id: 42 }] }]);

    const id = await getOrCreatePeriodo(client, 2025, 2, 210000);

    expect(id).toBe(42);
    expect(client.query).toHaveBeenCalledTimes(1); // solo SELECT, no INSERT
  });

  test('crea el período y retorna el nuevo id si no existe', async () => {
    const client = makeClient([
      { rows: [] },           // SELECT devuelve vacío
      { rows: [{ id: 99 }] } // INSERT devuelve nuevo id
    ]);

    const id = await getOrCreatePeriodo(client, 2025, 3, 210000);

    expect(id).toBe(99);
    expect(client.query).toHaveBeenCalledTimes(2);
  });

  test('genera la fecha de vencimiento correcta (día 5 del mes)', async () => {
    const client = makeClient([
      { rows: [] },
      { rows: [{ id: 1 }] }
    ]);

    await getOrCreatePeriodo(client, 2025, 6, 210000);

    // Verificar que el INSERT recibió la fecha correcta
    const insertCall = client.query.mock.calls[1];
    expect(insertCall[1][3]).toBe('2025-06-05');
  });

  test('formatea correctamente meses de un dígito (ej: marzo → 03)', async () => {
    const client = makeClient([{ rows: [] }, { rows: [{ id: 1 }] }]);

    await getOrCreatePeriodo(client, 2025, 3, 210000);

    const insertCall = client.query.mock.calls[1];
    expect(insertCall[1][3]).toBe('2025-03-05'); // 03 con cero a la izquierda
  });
});

// ── getOrCreateObligacion ─────────────────────────────────────

describe('getOrCreateObligacion', () => {
  test('retorna el id existente si la obligación ya existe', async () => {
    const client = makeClient([{ rows: [{ id: 77 }] }]);

    const id = await getOrCreateObligacion(client, 1, 5, 210000);

    expect(id).toBe(77);
    expect(client.query).toHaveBeenCalledTimes(1);
  });

  test('crea la obligación y retorna el nuevo id si no existe', async () => {
    const client = makeClient([
      { rows: [] },
      { rows: [{ id: 88 }] }
    ]);

    const id = await getOrCreateObligacion(client, 1, 5, 210000);

    expect(id).toBe(88);
    expect(client.query).toHaveBeenCalledTimes(2);
  });

  test('inserta con el monto_base correcto', async () => {
    const client = makeClient([{ rows: [] }, { rows: [{ id: 1 }] }]);

    await getOrCreateObligacion(client, 10, 20, 315000);

    const insertCall = client.query.mock.calls[1];
    expect(insertCall[1]).toEqual([10, 20, 315000]);
  });
});