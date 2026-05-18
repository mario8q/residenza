/**
 * Tests unitarios para controllers/authController.js
 * Ruta: backend/src/__tests__/auth.controller.test.js
 *
 * Se mockea la BD completamente — no necesita PostgreSQL corriendo.
 */

process.env.JWT_SECRET      = 'test_secret_residenciaspro';
process.env.JWT_EXPIRES_IN  = '8h';
process.env.NODE_ENV        = 'test';

// Mock de la BD antes de importar el controller
jest.mock('../config/database', () => ({
  query: jest.fn(),
  conjuntoQuery: jest.fn(),
  getConjuntoClient: jest.fn(),
}));

const bcrypt     = require('bcryptjs');
const jwt        = require('jsonwebtoken');
const {
  query,
  conjuntoQuery,
  getConjuntoClient,
} = require('../config/database');

const {
  login,
  logout,
  refresh,
  loginResidente,
  registerResidente,
  cambiarPassword,
} = require('../controllers/authController');

function mockRes() {
  const res = {};
  res.status  = jest.fn().mockReturnValue(res);
  res.json    = jest.fn().mockReturnValue(res);
  res.cookie  = jest.fn().mockReturnValue(res);
  res.clearCookie = jest.fn().mockReturnValue(res);
  return res;
}

// ── login ─────────────────────────────────────────────────────

describe('login', () => {
  const passwordHash = bcrypt.hashSync('Admin2025!', 10);

  const adminRow = {
    id:              1,
    email:           'admin@bellohorizonte.co',
    nombre:          'Carlos Admin',
    password_hash:   passwordHash,
    conjunto_id:     1,
    activo:          true,
    schema_name:     'conjunto_1',
    conjunto_nombre: 'Bello Horizonte',
  };

  beforeEach(() => jest.clearAllMocks());

  test('retorna 400 si faltan email o password', async () => {
    const req  = { body: { email: '', password: '' } };
    const res  = mockRes();
    const next = jest.fn();

    await login(req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: 'Email y contraseña son requeridos.' });
  });

  test('retorna 401 si el usuario no existe en la BD', async () => {
    query.mockResolvedValueOnce({ rows: [] });

    const req  = { body: { email: 'noexiste@test.co', password: '1234' } };
    const res  = mockRes();
    const next = jest.fn();

    await login(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ error: 'Credenciales inválidas.' });
  });

  test('retorna 401 si la contraseña es incorrecta', async () => {
    query.mockResolvedValueOnce({ rows: [adminRow] });

    const req  = { body: { email: 'admin@bellohorizonte.co', password: 'wrongpassword' } };
    const res  = mockRes();
    const next = jest.fn();

    await login(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ error: 'Credenciales inválidas.' });
  });

  test('retorna 401 si el usuario está inactivo', async () => {
    query.mockResolvedValueOnce({ rows: [{ ...adminRow, activo: false }] });

    const req  = { body: { email: 'admin@bellohorizonte.co', password: 'Admin2025!' } };
    const res  = mockRes();
    const next = jest.fn();

    await login(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ error: 'Usuario inactivo. Contacta al administrador.' });
  });

  test('retorna accessToken y datos del usuario con credenciales correctas', async () => {
    // Primera query: buscar admin. Segunda query: actualizar ultimo_login
    query
      .mockResolvedValueOnce({ rows: [adminRow] })
      .mockResolvedValueOnce({ rows: [] });

    const req  = { body: { email: 'admin@bellohorizonte.co', password: 'Admin2025!' } };
    const res  = mockRes();
    const next = jest.fn();

    await login(req, res, next);

    expect(res.cookie).toHaveBeenCalledWith('refreshToken', expect.any(String), expect.any(Object));
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      accessToken: expect.any(String),
      user: expect.objectContaining({
        email:  'admin@bellohorizonte.co',
        rol:    'admin',
        nombre: 'Carlos Admin',
      }),
    }));

    // Verificar que el accessToken es un JWT válido
    const { accessToken } = res.json.mock.calls[0][0];
    const decoded = jwt.verify(accessToken, process.env.JWT_SECRET);
    expect(decoded.rol).toBe('admin');
    expect(decoded.conjuntoId).toBe(1);
  });

  test('llama a next(err) si la BD lanza un error', async () => {
    query.mockRejectedValueOnce(new Error('DB connection failed'));

    const req  = { body: { email: 'admin@bellohorizonte.co', password: 'Admin2025!' } };
    const res  = mockRes();
    const next = jest.fn();

    await login(req, res, next);

    expect(next).toHaveBeenCalledWith(expect.any(Error));
  });

  test('normaliza el email a minúsculas antes de buscar', async () => {
    query
      .mockResolvedValueOnce({ rows: [adminRow] })
      .mockResolvedValueOnce({ rows: [] });

    const req = { body: { email: 'ADMIN@BELLOHORIZONTE.CO', password: 'Admin2025!' } };
    const res = mockRes();

    await login(req, res, jest.fn());

    // Verificar que la query recibió el email en minúsculas
    expect(query).toHaveBeenCalledWith(
      expect.any(String),
      ['admin@bellohorizonte.co']
    );
  });
});

// ── logout ────────────────────────────────────────────────────

describe('logout', () => {
  test('limpia la cookie refreshToken y retorna mensaje de éxito', () => {
    const req = {};
    const res = mockRes();

    logout(req, res);

    expect(res.clearCookie).toHaveBeenCalledWith('refreshToken');
    expect(res.json).toHaveBeenCalledWith({ message: 'Sesión cerrada correctamente.' });
  });
});

// ── refresh ───────────────────────────────────────────────────

describe('refresh', () => {
  beforeEach(() => jest.clearAllMocks());

  test('retorna 401 si no hay cookie refreshToken', async () => {
    const req  = { cookies: {} };
    const res  = mockRes();
    const next = jest.fn();

    await refresh(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ error: 'Refresh token no encontrado.' });
  });

  test('retorna 401 si el refresh token tiene firma inválida', async () => {
    const badToken = jwt.sign({ id: 1, type: 'refresh' }, 'clave_incorrecta');
    const req  = { cookies: { refreshToken: badToken } };
    const res  = mockRes();
    const next = jest.fn();

    await refresh(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ error: 'Refresh token inválido o expirado.' });
  });

  test('retorna 401 si el token no es de tipo refresh', async () => {
    // Token de acceso normal, no refresh
    const accessToken = jwt.sign({ id: 1, type: 'access', rol: 'admin' }, process.env.JWT_SECRET);
    const req  = { cookies: { refreshToken: accessToken } };
    const res  = mockRes();
    const next = jest.fn();

    await refresh(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ error: 'Token inválido.' });
  });

  test('retorna nuevo accessToken con refresh token válido', async () => {
    const refreshToken = jwt.sign({ id: 1, type: 'refresh' }, process.env.JWT_SECRET, { expiresIn: '7d' });
    query.mockResolvedValueOnce({
      rows: [{
        id: 1, email: 'admin@test.co', nombre: 'Admin', activo: true,
        conjunto_id: 1, schema_name: 'conjunto_1',
      }]
    });

    const req  = { cookies: { refreshToken } };
    const res  = mockRes();
    const next = jest.fn();

    await refresh(req, res, next);

    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      accessToken: expect.any(String),
    }));
    expect(res.cookie).toHaveBeenCalledWith('refreshToken', expect.any(String), expect.any(Object));
  });
});

// ─────────────────────────────────────────────────────────────
// loginResidente
// ─────────────────────────────────────────────────────────────

describe('loginResidente', () => {
  beforeEach(() => jest.clearAllMocks());

  const residenteHash = bcrypt.hashSync('Residente2025!', 10);

  const conjunto = {
    id: 1,
    schema_name: 'conjunto_1',
    nombre: 'Bello Horizonte',
  };

  const residente = {
    id: 10,
    email: 'residente@test.co',
    nombre: 'Juan Residente',
    password_hash: residenteHash,
    activo: true,
    apto_codigo: 'A101',
    torre_nombre: 'Torre 1',
  };

  test('retorna 400 si faltan datos', async () => {
    const req = { body: {} };
    const res = mockRes();

    await loginResidente(req, res, jest.fn());

    expect(res.status).toHaveBeenCalledWith(400);
  });

  test('retorna 401 si el residente no existe', async () => {
    query.mockResolvedValueOnce({ rows: [conjunto] });

    conjuntoQuery.mockResolvedValueOnce({ rows: [] });

    const req = {
      body: {
        email: 'noexiste@test.co',
        password: '123456',
      },
    };

    const res = mockRes();

    await loginResidente(req, res, jest.fn());

    expect(res.status).toHaveBeenCalledWith(401);
  });

  test('retorna 401 si el residente está inactivo', async () => {
    query.mockResolvedValueOnce({ rows: [conjunto] });

    conjuntoQuery.mockResolvedValueOnce({
      rows: [{ ...residente, activo: false }],
    });

    const req = {
      body: {
        email: 'residente@test.co',
        password: 'Residente2025!',
      },
    };

    const res = mockRes();

    await loginResidente(req, res, jest.fn());

    expect(res.status).toHaveBeenCalledWith(401);
  });

  test('retorna 401 si password incorrecta', async () => {
    query.mockResolvedValueOnce({ rows: [conjunto] });

    conjuntoQuery.mockResolvedValueOnce({
      rows: [residente],
    });

    const req = {
      body: {
        email: 'residente@test.co',
        password: 'incorrecta',
      },
    };

    const res = mockRes();

    await loginResidente(req, res, jest.fn());

    expect(res.status).toHaveBeenCalledWith(401);
  });

  test('login exitoso residente', async () => {
    query.mockResolvedValueOnce({ rows: [conjunto] });

    conjuntoQuery.mockResolvedValueOnce({
      rows: [residente],
    });

    const fakeClient = {
      query: jest.fn(),
      release: jest.fn(),
    };

    getConjuntoClient.mockResolvedValueOnce(fakeClient);

    const req = {
      body: {
        email: 'residente@test.co',
        password: 'Residente2025!',
      },
    };

    const res = mockRes();

    await loginResidente(req, res, jest.fn());

    expect(res.cookie).toHaveBeenCalled();

    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        accessToken: expect.any(String),
      })
    );

    expect(fakeClient.release).toHaveBeenCalled();
  });
});

// ─────────────────────────────────────────────────────────────
// registerResidente
// ─────────────────────────────────────────────────────────────

describe('registerResidente', () => {
  beforeEach(() => jest.clearAllMocks());

  const conjunto = {
    id: 1,
    schema_name: 'conjunto_1',
    nombre: 'Bello Horizonte',
  };

  const apartamento = {
    id: 20,
    codigo: 'A101',
  };

  test('retorna 400 si faltan campos', async () => {
    const req = {
      body: {},
    };

    const res = mockRes();

    await registerResidente(req, res, jest.fn());

    expect(res.status).toHaveBeenCalledWith(400);
  });

  test('retorna 400 si passwords no coinciden', async () => {
    const req = {
      body: {
        nombre: 'Juan',
        documento: '123',
        email: 'a@test.co',
        telefono: '3001234567',
        apto_codigo: 'A101',
        password: '123456',
        passwordConfirm: '654321',
      },
    };

    const res = mockRes();

    await registerResidente(req, res, jest.fn());

    expect(res.status).toHaveBeenCalledWith(400);
  });

  test('retorna 404 si apartamento no existe', async () => {
    query.mockResolvedValueOnce({
      rows: [conjunto],
    });

    conjuntoQuery.mockResolvedValueOnce({
      rows: [],
    });

    const req = {
      body: {
        nombre: 'Juan',
        documento: '123',
        email: 'a@test.co',
        telefono: '3001234567',
        apto_codigo: 'A101',
        password: '123456',
        passwordConfirm: '123456',
      },
    };

    const res = mockRes();

    await registerResidente(req, res, jest.fn());

    expect(res.status).toHaveBeenCalledWith(404);
  });

  test('retorna 409 si email ya existe', async () => {
    query.mockResolvedValueOnce({
      rows: [conjunto],
    });

    conjuntoQuery
      .mockResolvedValueOnce({ rows: [apartamento] })
      .mockResolvedValueOnce({ rows: [{ id: 1 }] });

    const req = {
      body: {
        nombre: 'Juan',
        documento: '123',
        email: 'a@test.co',
        telefono: '3001234567',
        apto_codigo: 'A101',
        password: '123456',
        passwordConfirm: '123456',
      },
    };

    const res = mockRes();

    await registerResidente(req, res, jest.fn());

    expect(res.status).toHaveBeenCalledWith(409);
  });

  test('registro exitoso', async () => {
    query.mockResolvedValueOnce({
      rows: [conjunto],
    });

    conjuntoQuery
      .mockResolvedValueOnce({ rows: [apartamento] })
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [] });

    const fakeClient = {
      query: jest.fn().mockResolvedValueOnce({
        rows: [{
          id: 50,
          nombre: 'Juan',
          email: 'juan@test.co',
          telefono: '3001234567',
        }],
      }),
      release: jest.fn(),
    };

    getConjuntoClient.mockResolvedValueOnce(fakeClient);

    const req = {
      body: {
        nombre: 'Juan',
        documento: '123',
        email: 'juan@test.co',
        telefono: '3001234567',
        apto_codigo: 'A101',
        password: '123456',
        passwordConfirm: '123456',
      },
    };

    const res = mockRes();

    await registerResidente(req, res, jest.fn());

    expect(res.status).toHaveBeenCalledWith(201);

    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        accessToken: expect.any(String),
      })
    );

    expect(fakeClient.release).toHaveBeenCalled();
  });
});

// ─────────────────────────────────────────────────────────────
// cambiarPassword
// ─────────────────────────────────────────────────────────────

describe('cambiarPassword', () => {
  beforeEach(() => jest.clearAllMocks());

  const oldHash = bcrypt.hashSync('Vieja123', 10);

  test('retorna 400 si faltan campos', async () => {
    const req = {
      body: {},
      user: {
        id: 1,
        rol: 'admin',
      },
    };

    const res = mockRes();

    await cambiarPassword(req, res, jest.fn());

    expect(res.status).toHaveBeenCalledWith(400);
  });

  test('retorna 403 si el rol es inválido', async () => {
    const req = {
      body: {
        passwordActual: '123',
        passwordNueva: '123456',
      },
      user: {
        id: 1,
        rol: 'hackerman',
      },
    };

    const res = mockRes();

    await cambiarPassword(req, res, jest.fn());

    expect(res.status).toHaveBeenCalledWith(403);
  });

  test('retorna 404 si el usuario no existe', async () => {
    query.mockResolvedValueOnce({
      rows: [],
    });

    const req = {
      body: {
        passwordActual: '123456',
        passwordNueva: 'Nueva123',
      },
      user: {
        id: 1,
        rol: 'admin',
      },
    };

    const res = mockRes();

    await cambiarPassword(req, res, jest.fn());

    expect(res.status).toHaveBeenCalledWith(404);
  });

  test('retorna 401 si la contraseña actual es incorrecta', async () => {
    query.mockResolvedValueOnce({
      rows: [{
        password_hash: oldHash,
      }],
    });

    const req = {
      body: {
        passwordActual: 'incorrecta',
        passwordNueva: 'Nueva123',
      },
      user: {
        id: 1,
        rol: 'admin',
      },
    };

    const res = mockRes();

    await cambiarPassword(req, res, jest.fn());

    expect(res.status).toHaveBeenCalledWith(401);
  });

  test('cambia correctamente la contraseña admin', async () => {
    query
      .mockResolvedValueOnce({
        rows: [{
          password_hash: oldHash,
        }],
      })
      .mockResolvedValueOnce({});

    const req = {
      body: {
        passwordActual: 'Vieja123',
        passwordNueva: 'Nueva123',
      },
      user: {
        id: 1,
        rol: 'admin',
      },
    };

    const res = mockRes();

    await cambiarPassword(req, res, jest.fn());

    expect(res.json).toHaveBeenCalledWith({
      message: 'Contraseña cambiada correctamente.',
    });
  });
});