/**
 * Tests para controllers/apartamentosController.js (torres y apartamentos)
 * Ruta: backend/src/__tests__/apartamentos.controller.test.js
 */

jest.mock('../config/database', () => ({
  pool: { query: jest.fn() },
}));

const { pool } = require('../config/database');
const {
  listTorres, createTorre, deleteTorre,
  listApartamentos, createApartamento, deleteApartamento,
} = require('../controllers/apartamentosController');

const SCHEMA = 'conjunto_1';

function mockReq(overrides = {}) {
  return { tenantSchema: SCHEMA, params: {}, body: {}, ...overrides };
}
function mockRes() {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json   = jest.fn().mockReturnValue(res);
  return res;
}

beforeEach(() => jest.clearAllMocks());

// ── Torres ────────────────────────────────────────────────────

describe('listTorres', () => {
  test('retorna la lista de torres del conjunto', async () => {
    const fakeRows = [{ id: 1, nombre: 'A', num_pisos: 4 }];
    pool.query.mockResolvedValueOnce({ rows: fakeRows });

    const res = mockRes();
    await listTorres(mockReq(), res, jest.fn());

    expect(res.json).toHaveBeenCalledWith({ data: fakeRows });
  });

  test('llama a next(err) si pool.query falla', async () => {
    pool.query.mockRejectedValueOnce(new Error('DB error'));
    const next = jest.fn();

    await listTorres(mockReq(), mockRes(), next);

    expect(next).toHaveBeenCalledWith(expect.any(Error));
  });
});

describe('createTorre', () => {
  test('retorna 400 si falta el nombre', async () => {
    const req = mockReq({ body: { num_pisos: 4 } });
    const res = mockRes();

    await createTorre(req, res, jest.fn());

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: 'El nombre de la torre es requerido.' });
  });

  test('retorna 400 si num_pisos es menor a 1', async () => {
    const req = mockReq({ body: { nombre: 'C', num_pisos: 0 } });
    const res = mockRes();

    await createTorre(req, res, jest.fn());

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: 'Número de pisos debe ser >= 1.' });
  });

  test('retorna 409 si la torre ya existe', async () => {
    pool.query.mockResolvedValueOnce({ rows: [{ id: 1 }] }); // verificación de unicidad

    const req = mockReq({ body: { nombre: 'A', num_pisos: 4 } });
    const res = mockRes();

    await createTorre(req, res, jest.fn());

    expect(res.status).toHaveBeenCalledWith(409);
    expect(res.json).toHaveBeenCalledWith({ error: 'La torre A ya existe.' });
  });

  test('crea la torre y retorna 201', async () => {
    pool.query
      .mockResolvedValueOnce({ rows: [] })  // verificación unicidad: no existe
      .mockResolvedValueOnce({ rows: [{ id: 3, nombre: 'C', num_pisos: 5 }] }); // INSERT

    const req = mockReq({ body: { nombre: 'c', num_pisos: 5 } });
    const res = mockRes();

    await createTorre(req, res, jest.fn());

    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      message: expect.stringContaining('creada'),
    }));
  });
});

describe('deleteTorre', () => {
  test('retorna 400 si la torre tiene apartamentos', async () => {
    pool.query.mockResolvedValueOnce({ rows: [{ count: '3' }] }); // tiene apartamentos

    const req = mockReq({ params: { id: '1' } });
    const res = mockRes();

    await deleteTorre(req, res, jest.fn());

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      error: 'No se puede eliminar una torre que tiene apartamentos.',
    });
  });

  test('retorna 404 si la torre no existe', async () => {
    pool.query
      .mockResolvedValueOnce({ rows: [{ count: '0' }] }) // sin apartamentos
      .mockResolvedValueOnce({ rows: [] });              // DELETE: no encontrado

    const req = mockReq({ params: { id: '99' } });
    const res = mockRes();

    await deleteTorre(req, res, jest.fn());

    expect(res.status).toHaveBeenCalledWith(404);
  });

  test('elimina la torre y retorna mensaje de éxito', async () => {
    pool.query
      .mockResolvedValueOnce({ rows: [{ count: '0' }] })
      .mockResolvedValueOnce({ rows: [{ nombre: 'A' }] });

    const req = mockReq({ params: { id: '1' } });
    const res = mockRes();

    await deleteTorre(req, res, jest.fn());

    expect(res.json).toHaveBeenCalledWith({ message: 'Torre A eliminada.' });
  });
});

// ── Apartamentos ──────────────────────────────────────────────

describe('createApartamento', () => {
  test('retorna 400 si faltan campos requeridos', async () => {
    const req = mockReq({ body: { torre_id: 1 } }); // falta numero y piso
    const res = mockRes();

    await createApartamento(req, res, jest.fn());

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      error: 'Torre, número y piso son requeridos.',
    });
  });

  test('retorna 404 si la torre no existe', async () => {
    pool.query.mockResolvedValueOnce({ rows: [] }); // torre no encontrada

    const req = mockReq({ body: { torre_id: 99, numero: '01', piso: 1 } });
    const res = mockRes();

    await createApartamento(req, res, jest.fn());

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ error: 'Torre no encontrada.' });
  });

  test('retorna 409 si el apartamento ya existe', async () => {
    pool.query
      .mockResolvedValueOnce({ rows: [{ id: 1, nombre: 'A' }] }) // torre existe
      .mockResolvedValueOnce({ rows: [{ id: 5 }] });             // codigo ya existe

    const req = mockReq({ body: { torre_id: 1, numero: '01', piso: 1 } });
    const res = mockRes();

    await createApartamento(req, res, jest.fn());

    expect(res.status).toHaveBeenCalledWith(409);
  });

  test('crea el apartamento y retorna 201 con el código generado', async () => {
    pool.query
      .mockResolvedValueOnce({ rows: [{ id: 1, nombre: 'A' }] }) // torre
      .mockResolvedValueOnce({ rows: [] })                       // no existe
      .mockResolvedValueOnce({ rows: [{ id: 10, codigo: 'A-101', numero: '01', piso: 1 }] }); // INSERT

    const req = mockReq({ body: { torre_id: 1, numero: '1', piso: 1 } });
    const res = mockRes();

    await createApartamento(req, res, jest.fn());

    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      message: expect.stringContaining('creado'),
    }));
  });
});

describe('deleteApartamento', () => {
  test('retorna 400 si el apartamento tiene residente activo', async () => {
    pool.query.mockResolvedValueOnce({ rows: [{ count: '1' }] });

    const req = mockReq({ params: { id: '1' } });
    const res = mockRes();

    await deleteApartamento(req, res, jest.fn());

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      error: 'No se puede eliminar un apartamento que tiene un residente activo.',
    });
  });

  test('retorna 404 si el apartamento no existe', async () => {
    pool.query
      .mockResolvedValueOnce({ rows: [{ count: '0' }] })
      .mockResolvedValueOnce({ rows: [] });

    const req = mockReq({ params: { id: '99' } });
    const res = mockRes();

    await deleteApartamento(req, res, jest.fn());

    expect(res.status).toHaveBeenCalledWith(404);
  });

  test('elimina el apartamento y retorna mensaje de éxito', async () => {
    pool.query
      .mockResolvedValueOnce({ rows: [{ count: '0' }] })
      .mockResolvedValueOnce({ rows: [{ codigo: 'A-101' }] });

    const req = mockReq({ params: { id: '1' } });
    const res = mockRes();

    await deleteApartamento(req, res, jest.fn());

    expect(res.json).toHaveBeenCalledWith({ message: 'Apartamento A-101 eliminado.' });
  });
});

describe('listApartamentos', () => {
  test('retorna lista de apartamentos con información de torre y residente', async () => {
    const fakeRows = [
      { id: 1, codigo: 'A-101', torre: 'A', tiene_residente: true },
      { id: 2, codigo: 'A-102', torre: 'A', tiene_residente: false },
    ];
    pool.query.mockResolvedValueOnce({ rows: fakeRows });

    const res = mockRes();
    await listApartamentos(mockReq(), res, jest.fn());

    expect(res.json).toHaveBeenCalledWith({ data: fakeRows });
  });
});