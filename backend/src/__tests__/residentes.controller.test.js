/**
 * Tests unitarios para controllers/residentesController.js
 * Ruta: backend/src/__tests__/residentes.controller.test.js
 */

process.env.JWT_SECRET = 'test_secret_residenciaspro';

// Mock completo del modelo Residente
jest.mock('../models/Residente');
const Residente = require('../models/Residente');
const { list, getOne, create, update, remove } = require('../controllers/residentesController');

const SCHEMA = 'conjunto_1';

function mockRes() {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json   = jest.fn().mockReturnValue(res);
  return res;
}

function mockReq(overrides = {}) {
  return {
    tenantSchema: SCHEMA,
    params:       {},
    body:         {},
    ...overrides,
  };
}

beforeEach(() => jest.clearAllMocks());

// ── list ──────────────────────────────────────────────────────

describe('list', () => {
  test('retorna lista de residentes con total', async () => {
    const fakeResidentes = [
      { id: 1, nombre: 'María López', apto_codigo: 'A-101' },
      { id: 2, nombre: 'Luis Torres', apto_codigo: 'B-305' },
    ];
    Residente.findAll.mockResolvedValue(fakeResidentes);

    const req = mockReq();
    const res = mockRes();

    await list(req, res, jest.fn());

    expect(Residente.findAll).toHaveBeenCalledWith(SCHEMA);
    expect(res.json).toHaveBeenCalledWith({ data: fakeResidentes, total: 2 });
  });

  test('llama a next(err) si findAll falla', async () => {
    Residente.findAll.mockRejectedValue(new Error('DB error'));
    const next = jest.fn();

    await list(mockReq(), mockRes(), next);

    expect(next).toHaveBeenCalledWith(expect.any(Error));
  });
});

// ── getOne ────────────────────────────────────────────────────

describe('getOne', () => {
  test('retorna el residente encontrado', async () => {
    const fake = { id: 1, nombre: 'María López', apto_codigo: 'A-101' };
    Residente.findById.mockResolvedValue(fake);

    const req = mockReq({ params: { id: '1' } });
    const res = mockRes();

    await getOne(req, res, jest.fn());

    expect(Residente.findById).toHaveBeenCalledWith(SCHEMA, '1');
    expect(res.json).toHaveBeenCalledWith({ data: fake });
  });

  test('retorna 404 si no existe el residente', async () => {
    Residente.findById.mockResolvedValue(null);

    const req = mockReq({ params: { id: '999' } });
    const res = mockRes();

    await getOne(req, res, jest.fn());

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ error: 'Residente no encontrado.' });
  });
});

// ── create ────────────────────────────────────────────────────

describe('create', () => {
  const bodyValido = {
    nombre:      'Pedro Vargas',
    documento:   '91002345',
    email:       'p.vargas@mail.com',
    apto_codigo: 'B-201',
    tipo_residente: 'Propietario',
  };

  test('retorna 400 si faltan campos requeridos', async () => {
    const req = mockReq({ body: { nombre: 'Pedro' } }); // falta documento, email, apto_codigo
    const res = mockRes();

    await create(req, res, jest.fn());

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      error: 'Campos requeridos: nombre, documento, email, apto_codigo.'
    });
  });

  test('retorna 400 si el email tiene formato inválido', async () => {
    const req = mockReq({ body: { ...bodyValido, email: 'correo-sin-arroba' } });
    const res = mockRes();

    await create(req, res, jest.fn());

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: 'Formato de email inválido.' });
  });

  test('retorna 409 si el documento ya existe en el conjunto', async () => {
    Residente.findByDocumento.mockResolvedValue({ id: 5 }); // duplicado encontrado

    const req = mockReq({ body: bodyValido });
    const res = mockRes();

    await create(req, res, jest.fn());

    expect(res.status).toHaveBeenCalledWith(409);
    expect(res.json).toHaveBeenCalledWith({
      error: `Ya existe un residente con el documento ${bodyValido.documento} en este conjunto.`
    });
  });

  test('retorna 404 si el apartamento no existe', async () => {
    Residente.findByDocumento.mockResolvedValue(null);
    Residente.findApartamento.mockResolvedValue(null);

    const req = mockReq({ body: bodyValido });
    const res = mockRes();

    await create(req, res, jest.fn());

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({
      error: `Apartamento ${bodyValido.apto_codigo} no encontrado en este conjunto.`
    });
  });

  test('crea el residente y retorna 201 con los datos', async () => {
    Residente.findByDocumento.mockResolvedValue(null);
    Residente.findApartamento.mockResolvedValue({ id: 10, codigo: 'B-201' });
    Residente.create.mockResolvedValue({ id: 9, ...bodyValido, apartamento_id: 10 });

    const req = mockReq({ body: bodyValido });
    const res = mockRes();

    await create(req, res, jest.fn());

    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      message: 'Residente registrado correctamente.',
      data:    expect.objectContaining({ apto_codigo: 'B-201' }),
    }));
  });
});

// ── update ────────────────────────────────────────────────────

describe('update', () => {
  const existente = { id: 1, nombre: 'María López', documento: '52001234', email: 'm.lopez@mail.com', apto_codigo: 'A-101' };

  test('retorna 404 si el residente no existe', async () => {
    Residente.findById.mockResolvedValue(null);

    const req = mockReq({ params: { id: '999' }, body: { nombre: 'Nuevo Nombre' } });
    const res = mockRes();

    await update(req, res, jest.fn());

    expect(res.status).toHaveBeenCalledWith(404);
  });

  test('retorna 400 si el nuevo email tiene formato inválido', async () => {
    Residente.findById.mockResolvedValue(existente);

    const req = mockReq({ params: { id: '1' }, body: { email: 'invalido' } });
    const res = mockRes();

    await update(req, res, jest.fn());

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: 'Formato de email inválido.' });
  });

  test('retorna 409 si el nuevo documento ya pertenece a otro residente', async () => {
    Residente.findById.mockResolvedValue(existente);
    Residente.findByDocumento.mockResolvedValue({ id: 5 }); // otro residente con ese doc

    const req = mockReq({ params: { id: '1' }, body: { documento: '99999999' } });
    const res = mockRes();

    await update(req, res, jest.fn());

    expect(res.status).toHaveBeenCalledWith(409);
  });

  test('actualiza correctamente y retorna los datos', async () => {
    Residente.findById.mockResolvedValue(existente);
    Residente.findByDocumento.mockResolvedValue(null);
    Residente.update.mockResolvedValue({ ...existente, nombre: 'María López Actualizada' });

    const req = mockReq({ params: { id: '1' }, body: { nombre: 'María López Actualizada' } });
    const res = mockRes();

    await update(req, res, jest.fn());

    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      message: 'Residente actualizado correctamente.',
    }));
  });
});

// ── remove ────────────────────────────────────────────────────

describe('remove', () => {
  test('retorna 404 si el residente no existe', async () => {
    Residente.delete.mockResolvedValue(null);

    const req = mockReq({ params: { id: '999' } });
    const res = mockRes();

    await remove(req, res, jest.fn());

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ error: 'Residente no encontrado.' });
  });

  test('elimina el residente y retorna mensaje de éxito', async () => {
    Residente.delete.mockResolvedValue({ id: 1, nombre: 'María López' });

    const req = mockReq({ params: { id: '1' } });
    const res = mockRes();

    await remove(req, res, jest.fn());

    expect(res.json).toHaveBeenCalledWith({
      message: 'Residente María López eliminado correctamente.'
    });
  });
});