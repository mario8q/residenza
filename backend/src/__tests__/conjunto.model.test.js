/**
 * Tests para models/Conjunto.js
 * Ruta: backend/src/__tests__/conjunto.model.test.js
 */

jest.mock('../config/database', () => ({
  query: jest.fn(),
  pool: {
    connect: jest.fn(),
  },
}));

jest.mock('fs', () => ({
  readFileSync: jest.fn().mockReturnValue('-- SQL mock vacío'),
}));

const { query, pool } = require('../config/database');
const Conjunto = require('../models/Conjunto');

// ─────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────

function makeFakeClient() {
  return {
    query: jest.fn(),
    release: jest.fn(),
  };
}

beforeEach(() => {
  jest.clearAllMocks();
});

// ─────────────────────────────────────────────────────────────
// findAll
// ─────────────────────────────────────────────────────────────

describe('Conjunto.findAll', () => {

  test('retorna todos los conjuntos activos', async () => {

    const fakeRows = [
      { id: 1, nombre: 'Bello Horizonte', schema_name: 'conjunto_1' },
      { id: 2, nombre: 'Las Palmas', schema_name: 'conjunto_2' },
    ];

    query.mockResolvedValueOnce({
      rows: fakeRows,
    });

    const result = await Conjunto.findAll();

    expect(result).toEqual(fakeRows);

    expect(query).toHaveBeenCalledTimes(1);

    expect(query).toHaveBeenCalledWith(
      expect.stringContaining('SELECT')
    );
  });

});

// ─────────────────────────────────────────────────────────────
// findById
// ─────────────────────────────────────────────────────────────

describe('Conjunto.findById', () => {

  test('retorna un conjunto existente', async () => {

    const fake = {
      id: 1,
      nombre: 'Bello Horizonte',
      schema_name: 'conjunto_1',
    };

    query.mockResolvedValueOnce({
      rows: [fake],
    });

    const result = await Conjunto.findById(1);

    expect(result).toEqual(fake);

    expect(query).toHaveBeenCalledWith(
      expect.stringContaining('WHERE id = $1'),
      [1]
    );
  });

  test('retorna null si no existe', async () => {

    query.mockResolvedValueOnce({
      rows: [],
    });

    const result = await Conjunto.findById(999);

    expect(result).toBeNull();
  });

});

// ─────────────────────────────────────────────────────────────
// findBySchema
// ─────────────────────────────────────────────────────────────

describe('Conjunto.findBySchema', () => {

  test('retorna conjunto por schema_name', async () => {

    const fake = {
      id: 1,
      nombre: 'Bello Horizonte',
      schema_name: 'conjunto_1',
      activo: true,
    };

    query.mockResolvedValueOnce({
      rows: [fake],
    });

    const result = await Conjunto.findBySchema('conjunto_1');

    expect(result).toEqual(fake);

    expect(query).toHaveBeenCalledWith(
      expect.stringContaining('schema_name'),
      ['conjunto_1']
    );
  });

  test('retorna null si no existe', async () => {

    query.mockResolvedValueOnce({
      rows: [],
    });

    const result = await Conjunto.findBySchema('schema_fake');

    expect(result).toBeNull();
  });

});

// ─────────────────────────────────────────────────────────────
// update
// ─────────────────────────────────────────────────────────────

describe('Conjunto.update', () => {

  test('actualiza campos válidos', async () => {

    const updated = {
      id: 1,
      nombre: 'Nuevo Nombre',
      cuota_base: 250000,
    };

    query.mockResolvedValueOnce({
      rows: [updated],
    });

    const result = await Conjunto.update(1, {
      nombre: 'Nuevo Nombre',
      cuota_base: 250000,
    });

    expect(result).toEqual(updated);

    const sql = query.mock.calls[0][0];

    expect(sql).toContain('nombre');
    expect(sql).toContain('cuota_base');
    expect(sql).toContain('UPDATE');
  });

  test('ignora campos no permitidos', async () => {

    query.mockResolvedValueOnce({
      rows: [
        {
          id: 1,
          nombre: 'Original',
        },
      ],
    });

    await Conjunto.update(1, {
      schema_name: 'hack',
    });

    const sql = query.mock.calls[0][0];

    expect(sql).not.toContain('schema_name');
  });

  test('retorna conjunto original si no hay campos válidos', async () => {

    const existing = {
      id: 1,
      nombre: 'Sin cambios',
    };

    query.mockResolvedValueOnce({
      rows: [existing],
    });

    const result = await Conjunto.update(1, {
      campoFake: 'valor',
    });

    expect(result).toEqual(existing);
  });

  test('retorna null si no existe', async () => {

    query.mockResolvedValueOnce({
      rows: [],
    });

    const result = await Conjunto.update(999, {
      nombre: 'No existe',
    });

    expect(result).toBeNull();
  });

});

// ─────────────────────────────────────────────────────────────
// create
// ─────────────────────────────────────────────────────────────

describe('Conjunto.create', () => {

  test('hace rollback si falla migración SQL', async () => {

    const client = makeFakeClient();

    client.query
      .mockResolvedValueOnce({}) // BEGIN
      .mockResolvedValueOnce({
        rows: [{ id: 5 }]
      }) // INSERT
      .mockResolvedValueOnce({}) // UPDATE schema
      .mockResolvedValueOnce({}) // CREATE SCHEMA
      .mockResolvedValueOnce({}) // SET search_path
      .mockRejectedValueOnce(new Error('SQL migration failed')) // migration
      .mockResolvedValueOnce({}); // ROLLBACK

    pool.connect.mockResolvedValueOnce(client);

    await expect(
      Conjunto.create({
        nombre: 'Test',
        cuota_base: 210000,
      })
    ).rejects.toThrow('SQL migration failed');

    const calls = client.query.mock.calls.map(c => c[0]);

    expect(calls).toContain('ROLLBACK');

    expect(client.release).toHaveBeenCalled();
  });

  test('libera cliente aunque falle inmediatamente', async () => {

    const client = makeFakeClient();

    client.query.mockRejectedValueOnce(
      new Error('Falla inmediata')
    );

    pool.connect.mockResolvedValueOnce(client);

    await expect(
      Conjunto.create({
        nombre: 'Test',
      })
    ).rejects.toThrow('Falla inmediata');

    expect(client.release).toHaveBeenCalled();
  });

  test('hace commit cuando todo sale bien', async () => {

    const client = makeFakeClient();

    client.query
      .mockResolvedValueOnce({}) // BEGIN
      .mockResolvedValueOnce({
        rows: [{ id: 10 }]
      }) // INSERT
      .mockResolvedValueOnce({}) // UPDATE schema
      .mockResolvedValueOnce({}) // CREATE SCHEMA
      .mockResolvedValueOnce({}) // SET search_path
      .mockResolvedValueOnce({}) // migration SQL
      .mockResolvedValueOnce({}); // COMMIT

    pool.connect.mockResolvedValueOnce(client);

    await Conjunto.create({
      nombre: 'Nuevo Conjunto',
      cuota_base: 210000,
    });

    const calls = client.query.mock.calls.map(c => c[0]);

    expect(calls).toContain('COMMIT');

    expect(client.release).toHaveBeenCalled();
  });

});