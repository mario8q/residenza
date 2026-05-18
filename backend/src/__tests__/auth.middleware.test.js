/**
 * Tests unitarios para middlewares/auth.js
 * Ruta: backend/src/__tests__/auth.middleware.test.js
 */

process.env.JWT_SECRET = 'test_secret_residenciaspro';

const jwt = require('jsonwebtoken');
const { verifyToken, requireRol } = require('../middlewares/auth');

// ── Helpers ───────────────────────────────────────────────────

function mockRes() {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json   = jest.fn().mockReturnValue(res);
  return res;
}

function makeToken(payload, secret = process.env.JWT_SECRET, opts = {}) {
  return jwt.sign(payload, secret, { expiresIn: '1h', ...opts });
}

// ── verifyToken ───────────────────────────────────────────────

describe('verifyToken', () => {
  test('llama next() con token válido y adjunta req.user', () => {
    const payload = { id: 1, email: 'admin@test.co', rol: 'admin', conjuntoId: 1, schema: 'conjunto_1' };
    const token   = makeToken(payload);
    const req     = { headers: { authorization: `Bearer ${token}` } };
    const res     = mockRes();
    const next    = jest.fn();

    verifyToken(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(req.user).toMatchObject({ id: 1, rol: 'admin' });
  });

  test('retorna 401 si no hay header Authorization', () => {
    const req  = { headers: {} };
    const res  = mockRes();
    const next = jest.fn();

    verifyToken(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ error: 'Token requerido.' });
    expect(next).not.toHaveBeenCalled();
  });

  test('retorna 401 si el token está expirado', () => {
    const token = makeToken({ id: 1, rol: 'admin' }, process.env.JWT_SECRET, { expiresIn: '0s' });
    const req   = { headers: { authorization: `Bearer ${token}` } };
    const res   = mockRes();
    const next  = jest.fn();

    // Esperar 1ms para que expire
    return new Promise(resolve => setTimeout(() => {
      verifyToken(req, res, next);
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ error: 'Token expirado.' });
      expect(next).not.toHaveBeenCalled();
      resolve();
    }, 10));
  });

  test('retorna 401 si el token tiene firma inválida', () => {
    const token = makeToken({ id: 1, rol: 'admin' }, 'otra_clave_incorrecta');
    const req   = { headers: { authorization: `Bearer ${token}` } };
    const res   = mockRes();
    const next  = jest.fn();

    verifyToken(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ error: 'Token inválido.' });
  });

  test('retorna 401 si el header no empieza con Bearer', () => {
    const req  = { headers: { authorization: 'Token abc123' } };
    const res  = mockRes();
    const next = jest.fn();

    verifyToken(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ error: 'Token requerido.' });
  });
});

// ── requireRol ────────────────────────────────────────────────

describe('requireRol', () => {
  test('llama next() cuando el rol del usuario está permitido', () => {
    const req  = { user: { rol: 'admin' } };
    const res  = mockRes();
    const next = jest.fn();

    requireRol('admin', 'superadmin')(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
  });

  test('retorna 403 cuando el rol no está en la lista permitida', () => {
    const req  = { user: { rol: 'residente' } };
    const res  = mockRes();
    const next = jest.fn();

    requireRol('admin', 'superadmin')(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({ error: 'No tienes permiso para esta acción.' });
    expect(next).not.toHaveBeenCalled();
  });

  test('retorna 403 cuando req.user es undefined', () => {
    const req  = {};
    const res  = mockRes();
    const next = jest.fn();

    requireRol('admin')(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(next).not.toHaveBeenCalled();
  });

  test('permite acceso a superadmin cuando se requiere admin', () => {
    const req  = { user: { rol: 'superadmin' } };
    const res  = mockRes();
    const next = jest.fn();

    requireRol('admin', 'superadmin')(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
  });
});