/**
 * Tests para models/Residente.js
 * Ruta: backend/src/__tests__/residente.model.test.js
 */

jest.mock('../config/database', () => ({
  pool: {
    connect: jest.fn(),
  },
}));

const { pool } = require('../config/database');
const Residente = require('../models/Residente');

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

describe('Residente.findAll', () => {

  test('retorna todos los residentes activos', async () => {

    const fakeRows = [
      {
        id: 1,
        nombre: 'Juan Pérez',
        apto_codigo: 'A101',
      },
      {
        id: 2,
        nombre: 'María Gómez',
        apto_codigo: 'A102',
      },
    ];

    const client = makeFakeClient();

    client.query
      .mockResolvedValueOnce({ rows: [] }) // SET search_path
      .mockResolvedValueOnce({ rows: fakeRows }); // SELECT

    pool.connect.mockResolvedValueOnce(client);

    const result = await Residente.findAll('conjunto_1');

    expect(result).toEqual(fakeRows);

    expect(client.query).toHaveBeenCalledWith(
      expect.stringContaining('SET search_path TO conjunto_1')
    );

    expect(client.release).toHaveBeenCalled();
  });

});

// ─────────────────────────────────────────────────────────────
// findById
// ─────────────────────────────────────────────────────────────

describe('Residente.findById', () => {

  test('retorna residente existente', async () => {

    const fake = {
      id: 1,
      nombre: 'Juan Pérez',
      apto_codigo: 'A101',
    };

    const client = makeFakeClient();

    client.query
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [fake] });

    pool.connect.mockResolvedValueOnce(client);

    const result = await Residente.findById('conjunto_1', 1);

    expect(result).toEqual(fake);

    expect(client.query).toHaveBeenCalledWith(
      expect.stringContaining('WHERE r.id = $1'),
      [1]
    );
  });

  test('retorna null si no existe', async () => {

    const client = makeFakeClient();

    client.query
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [] });

    pool.connect.mockResolvedValueOnce(client);

    const result = await Residente.findById('conjunto_1', 999);

    expect(result).toBeNull();
  });

});

// ─────────────────────────────────────────────────────────────
// findByDocumento
// ─────────────────────────────────────────────────────────────

describe('Residente.findByDocumento', () => {

  test('retorna residente por documento', async () => {

    const fake = { id: 1 };

    const client = makeFakeClient();

    client.query
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [fake] });

    pool.connect.mockResolvedValueOnce(client);

    const result = await Residente.findByDocumento(
      'conjunto_1',
      '123456'
    );

    expect(result).toEqual(fake);
  });

  test('usa excludeId cuando se envía', async () => {

    const client = makeFakeClient();

    client.query
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [] });

    pool.connect.mockResolvedValueOnce(client);

    await Residente.findByDocumento(
      'conjunto_1',
      '123456',
      5
    );

    expect(client.query).toHaveBeenCalledWith(
      expect.stringContaining('id != $2'),
      ['123456', 5]
    );
  });

  test('retorna null si no existe', async () => {

    const client = makeFakeClient();

    client.query
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [] });

    pool.connect.mockResolvedValueOnce(client);

    const result = await Residente.findByDocumento(
      'conjunto_1',
      '999999'
    );

    expect(result).toBeNull();
  });

});

// ─────────────────────────────────────────────────────────────
// findApartamento
// ─────────────────────────────────────────────────────────────

describe('Residente.findApartamento', () => {

  test('retorna apartamento existente', async () => {

    const fake = {
      id: 10,
      codigo: 'A101',
    };

    const client = makeFakeClient();

    client.query
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [fake] });

    pool.connect.mockResolvedValueOnce(client);

    const result = await Residente.findApartamento(
      'conjunto_1',
      'a101'
    );

    expect(result).toEqual(fake);

    expect(client.query).toHaveBeenCalledWith(
      expect.stringContaining('FROM apartamentos'),
      ['A101']
    );
  });

  test('retorna null si no existe', async () => {

    const client = makeFakeClient();

    client.query
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [] });

    pool.connect.mockResolvedValueOnce(client);

    const result = await Residente.findApartamento(
      'conjunto_1',
      'X999'
    );

    expect(result).toBeNull();
  });

});

// ─────────────────────────────────────────────────────────────
// create
// ─────────────────────────────────────────────────────────────

describe('Residente.create', () => {

  test('crea residente correctamente', async () => {

    const fake = {
      id: 1,
      nombre: 'Juan Pérez',
      email: 'juan@test.com',
    };

    const client = makeFakeClient();

    client.query
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [fake] });

    pool.connect.mockResolvedValueOnce(client);

    const result = await Residente.create('conjunto_1', {
      apartamento_id: 10,
      nombre: 'Juan Pérez',
      documento: '123456',
      email: 'juan@test.com',
    });

    expect(result).toEqual(fake);

    expect(client.query).toHaveBeenCalledWith(
      expect.stringContaining('INSERT INTO residentes'),
      expect.any(Array)
    );

    expect(client.release).toHaveBeenCalled();
  });

});

// ─────────────────────────────────────────────────────────────
// update
// ─────────────────────────────────────────────────────────────

describe('Residente.update', () => {

  test('actualiza campos válidos', async () => {

    const updated = {
      id: 1,
      nombre: 'Nuevo Nombre',
    };

    const client = makeFakeClient();

    client.query
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [updated] });

    pool.connect.mockResolvedValueOnce(client);

    const result = await Residente.update(
      'conjunto_1',
      1,
      {
        nombre: 'Nuevo Nombre',
        telefono: '3001234567',
      }
    );

    expect(result).toEqual(updated);

    const sql = client.query.mock.calls[1][0];

    expect(sql).toContain('UPDATE residentes');
    expect(sql).toContain('nombre');
    expect(sql).toContain('telefono');
  });

  test('retorna residente actual si no hay campos válidos', async () => {

    const fake = {
      id: 1,
      nombre: 'Juan',
    };

    jest.spyOn(Residente, 'findById')
      .mockResolvedValueOnce(fake);

    const client = makeFakeClient();

    client.query
      .mockResolvedValueOnce({ rows: [] });

    pool.connect.mockResolvedValueOnce(client);

    const result = await Residente.update(
      'conjunto_1',
      1,
      {
        campoFake: 'valor',
      }
    );

    expect(result).toEqual(fake);
  });

  test('retorna null si no existe', async () => {

    const client = makeFakeClient();

    client.query
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [] });

    pool.connect.mockResolvedValueOnce(client);

    const result = await Residente.update(
      'conjunto_1',
      999,
      {
        nombre: 'No existe',
      }
    );

    expect(result).toBeNull();
  });

});

// ─────────────────────────────────────────────────────────────
// delete
// ─────────────────────────────────────────────────────────────

describe('Residente.delete', () => {

  test('desactiva residente correctamente', async () => {

    const deleted = {
      id: 1,
      nombre: 'Juan Pérez',
    };

    const client = makeFakeClient();

    client.query
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [deleted] });

    pool.connect.mockResolvedValueOnce(client);

    const result = await Residente.delete(
      'conjunto_1',
      1
    );

    expect(result).toEqual(deleted);

    expect(client.query).toHaveBeenCalledWith(
      expect.stringContaining('activo = FALSE'),
      [1]
    );
  });

  test('retorna null si el residente no existe', async () => {

    const client = makeFakeClient();

    client.query
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [] });

    pool.connect.mockResolvedValueOnce(client);

    const result = await Residente.delete(
      'conjunto_1',
      999
    );

    expect(result).toBeNull();
  });

});