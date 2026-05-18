/**
 * Tests para middlewares/tenant.js
 * Ruta: backend/src/__tests__/tenant.middleware.test.js
 */

// Mock del pool de BD antes de importar el módulo
jest.mock('../config/database', () => ({
  pool: {
    query:   jest.fn(),
    connect: jest.fn(),
  },
}));

const { pool }  = require('../config/database');
const { setTenant, invalidateTenantCache } = require('../middlewares/tenant');

// ── Helpers ───────────────────────────────────────────────────

function mockRes() {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json   = jest.fn().mockReturnValue(res);
  return res;
}

// Cliente simulado de pg (para tenantQuery y tenantClient)
function mockPgClient(queryFn = jest.fn().mockResolvedValue({ rows: [] })) {
  return { query: queryFn, release: jest.fn() };
}

beforeEach(() => {
  jest.clearAllMocks();
  // Limpiar el cache interno entre tests
  invalidateTenantCache(1);
  invalidateTenantCache(2);
  invalidateTenantCache(99);
});

// ── setTenant — validaciones básicas ─────────────────────────

describe('setTenant — validaciones de req.user', () => {
  test('retorna 400 si req.user no tiene conjuntoId', async () => {
    const req  = { user: { id: 1, rol: 'admin' } }; // sin conjuntoId
    const res  = mockRes();
    const next = jest.fn();

    await setTenant(req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: 'El token no contiene conjunto_id.' });
    expect(next).not.toHaveBeenCalled();
  });

  test('retorna 400 si req.user es undefined', async () => {
    const req  = {};
    const res  = mockRes();
    const next = jest.fn();

    await setTenant(req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(next).not.toHaveBeenCalled();
  });
});

// ── setTenant — consulta BD ───────────────────────────────────

describe('setTenant — resolución del schema desde BD', () => {
  test('retorna 403 si el conjunto no existe o está inactivo', async () => {
    pool.query.mockResolvedValueOnce({ rows: [] }); // conjunto no encontrado

    const req  = { user: { conjuntoId: 99 } };
    const res  = mockRes();
    const next = jest.fn();

    await setTenant(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({ error: 'Conjunto no encontrado o inactivo.' });
    expect(next).not.toHaveBeenCalled();
  });

  test('asigna req.tenantSchema correctamente desde la BD', async () => {
    pool.query.mockResolvedValueOnce({ rows: [{ schema_name: 'conjunto_1' }] });

    const req  = { user: { conjuntoId: 1 } };
    const res  = mockRes();
    const next = jest.fn();

    await setTenant(req, res, next);

    expect(req.tenantSchema).toBe('conjunto_1');
    expect(next).toHaveBeenCalledTimes(1);
  });

  test('agrega req.tenantQuery como función al request', async () => {
    pool.query.mockResolvedValueOnce({ rows: [{ schema_name: 'conjunto_1' }] });

    const req  = { user: { conjuntoId: 1 } };
    await setTenant(req, mockRes(), jest.fn());

    expect(typeof req.tenantQuery).toBe('function');
  });

  test('agrega req.tenantClient como función al request', async () => {
    pool.query.mockResolvedValueOnce({ rows: [{ schema_name: 'conjunto_1' }] });

    const req  = { user: { conjuntoId: 1 } };
    await setTenant(req, mockRes(), jest.fn());

    expect(typeof req.tenantClient).toBe('function');
  });

  test('llama a next(err) si pool.query lanza un error', async () => {
    pool.query.mockRejectedValueOnce(new Error('DB caída'));

    const req  = { user: { conjuntoId: 1 } };
    const next = jest.fn();

    await setTenant(req, mockRes(), next);

    expect(next).toHaveBeenCalledWith(expect.any(Error));
  });
});

// ── Cache ─────────────────────────────────────────────────────

describe('setTenant — cache de schemas', () => {
  test('no consulta la BD en el segundo request del mismo conjunto', async () => {
    // Primera llamada: resuelve desde BD
    pool.query.mockResolvedValueOnce({ rows: [{ schema_name: 'conjunto_2' }] });

    const req1 = { user: { conjuntoId: 2 } };
    await setTenant(req1, mockRes(), jest.fn());

    // Segunda llamada: debe usar el cache, no la BD
    const req2 = { user: { conjuntoId: 2 } };
    await setTenant(req2, mockRes(), jest.fn());

    // pool.query solo debería haberse llamado una vez (la segunda usa cache)
    expect(pool.query).toHaveBeenCalledTimes(1);
    expect(req2.tenantSchema).toBe('conjunto_2');
  });

  test('invalidateTenantCache elimina la entrada y fuerza reconsulta a BD', async () => {
    pool.query.mockResolvedValue({ rows: [{ schema_name: 'conjunto_1' }] });

    // Primer request: llena el cache
    await setTenant({ user: { conjuntoId: 1 } }, mockRes(), jest.fn());

    // Invalidar
    invalidateTenantCache(1);

    // Segundo request: debe volver a consultar la BD
    await setTenant({ user: { conjuntoId: 1 } }, mockRes(), jest.fn());

    expect(pool.query).toHaveBeenCalledTimes(2);
  });
});

// ── req.tenantQuery ───────────────────────────────────────────

describe('req.tenantQuery', () => {
  test('establece search_path y ejecuta la query en el schema correcto', async () => {
    pool.query.mockResolvedValueOnce({ rows: [{ schema_name: 'conjunto_1' }] });

    const fakeClient = mockPgClient(jest.fn()
      .mockResolvedValueOnce({ rows: [] })            // SET search_path
      .mockResolvedValueOnce({ rows: [{ id: 1 }] })  // query real
    );
    pool.connect.mockResolvedValueOnce(fakeClient);

    const req = { user: { conjuntoId: 1 } };
    await setTenant(req, mockRes(), jest.fn());

    const result = await req.tenantQuery('SELECT * FROM residentes WHERE id=$1', [1]);

    // Verificar que se estableció el search_path
    expect(fakeClient.query).toHaveBeenNthCalledWith(
      1,
      'SET search_path TO conjunto_1, public'
    );
    // Verificar que se ejecutó la query real
    expect(fakeClient.query).toHaveBeenNthCalledWith(
      2,
      'SELECT * FROM residentes WHERE id=$1',
      [1]
    );
    expect(fakeClient.release).toHaveBeenCalled();
    expect(result.rows).toEqual([{ id: 1 }]);
  });

  test('libera el cliente aunque la query falle', async () => {
    pool.query.mockResolvedValueOnce({ rows: [{ schema_name: 'conjunto_1' }] });

    const fakeClient = mockPgClient(jest.fn()
      .mockResolvedValueOnce({ rows: [] })      // SET search_path OK
      .mockRejectedValueOnce(new Error('falla en query'))
    );
    pool.connect.mockResolvedValueOnce(fakeClient);

    const req = { user: { conjuntoId: 1 } };
    await setTenant(req, mockRes(), jest.fn());

    await expect(req.tenantQuery('SELECT 1')).rejects.toThrow('falla en query');
    expect(fakeClient.release).toHaveBeenCalled();
  });
});

// ── req.tenantClient ──────────────────────────────────────────

describe('req.tenantClient', () => {
  test('devuelve un client con search_path ya configurado', async () => {
    pool.query.mockResolvedValueOnce({ rows: [{ schema_name: 'conjunto_1' }] });

    const fakeClient = mockPgClient();
    pool.connect.mockResolvedValueOnce(fakeClient);

    const req = { user: { conjuntoId: 1 } };
    await setTenant(req, mockRes(), jest.fn());

    const client = await req.tenantClient();

    expect(fakeClient.query).toHaveBeenCalledWith('SET search_path TO conjunto_1, public');
    expect(client).toBe(fakeClient);
  });
});