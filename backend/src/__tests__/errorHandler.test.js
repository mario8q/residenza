/**
 * Tests para middlewares/errorHandler.js
 * Ruta: backend/src/__tests__/errorHandler.test.js
 */

// Mock del logger para que no imprima nada en los tests
jest.mock('../config/logger', () => ({
  error: jest.fn(),
  warn:  jest.fn(),
  info:  jest.fn(),
}));

const {
  errorHandler,
  AppError,
  NotFoundError,
  ValidationError,
  UnauthorizedError,
  ForbiddenError,
  ConflictError,
} = require('../middlewares/errorHandler');

// ── Helpers ───────────────────────────────────────────────────

function mockReq(method = 'GET', path = '/api/test') {
  return { method, path };
}

function mockRes() {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json   = jest.fn().mockReturnValue(res);
  return res;
}

// ── Clases de error ───────────────────────────────────────────

describe('Clases de AppError', () => {
  test('AppError guarda statusCode y marca isOperational = true', () => {
    const err = new AppError('algo falló', 422);
    expect(err.message).toBe('algo falló');
    expect(err.statusCode).toBe(422);
    expect(err.isOperational).toBe(true);
    expect(err).toBeInstanceOf(Error);
  });

  test('AppError usa statusCode 500 por defecto', () => {
    const err = new AppError('error sin código');
    expect(err.statusCode).toBe(500);
  });

  test('NotFoundError tiene statusCode 404', () => {
    const err = new NotFoundError();
    expect(err.statusCode).toBe(404);
    expect(err.message).toBe('Recurso no encontrado');
    expect(err.isOperational).toBe(true);
  });

  test('NotFoundError acepta mensaje personalizado', () => {
    const err = new NotFoundError('Residente no encontrado.');
    expect(err.message).toBe('Residente no encontrado.');
    expect(err.statusCode).toBe(404);
  });

  test('ValidationError tiene statusCode 400', () => {
    const err = new ValidationError('El campo nombre es obligatorio.');
    expect(err.statusCode).toBe(400);
    expect(err.message).toBe('El campo nombre es obligatorio.');
  });

  test('UnauthorizedError tiene statusCode 401 y mensaje por defecto', () => {
    const err = new UnauthorizedError();
    expect(err.statusCode).toBe(401);
    expect(err.message).toBe('No autorizado');
  });

  test('ForbiddenError tiene statusCode 403 y mensaje por defecto', () => {
    const err = new ForbiddenError();
    expect(err.statusCode).toBe(403);
    expect(err.message).toBe('Acceso denegado');
  });

  test('ConflictError tiene statusCode 409', () => {
    const err = new ConflictError('El documento ya existe.');
    expect(err.statusCode).toBe(409);
    expect(err.message).toBe('El documento ya existe.');
  });
});

// ── Conversión de errores PostgreSQL ──────────────────────────

describe('errorHandler — conversión de errores PostgreSQL', () => {
  beforeEach(() => process.env.NODE_ENV = 'test');

  test('23505 unique_violation → ConflictError 409', () => {
    const pgErr = { code: '23505', detail: '(documento)=(12345) ya existe.' };
    const res   = mockRes();

    errorHandler(pgErr, mockReq(), res, jest.fn());

    expect(res.status).toHaveBeenCalledWith(409);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      error: expect.stringContaining('Ya existe un registro'),
    }));
  });

  test('23503 foreign_key_violation → ValidationError 400', () => {
    const pgErr = { code: '23503' };
    const res   = mockRes();

    errorHandler(pgErr, mockReq(), res, jest.fn());

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      error: 'Referencia inválida: el registro relacionado no existe.',
    });
  });

  test('23502 not_null_violation → ValidationError 400 con nombre del campo', () => {
    const pgErr = { code: '23502', column: 'email' };
    const res   = mockRes();

    errorHandler(pgErr, mockReq(), res, jest.fn());

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      error: 'El campo "email" es obligatorio.',
    });
  });

  test('22P02 invalid_text_representation → ValidationError 400', () => {
    const pgErr = { code: '22P02' };
    const res   = mockRes();

    errorHandler(pgErr, mockReq(), res, jest.fn());

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      error: 'Tipo de dato inválido en la solicitud.',
    });
  });

  test('código de PostgreSQL desconocido → usa el error original sin convertir', () => {
    const pgErr = { code: '99999', message: 'error raro de BD', statusCode: undefined };
    const res   = mockRes();

    errorHandler(pgErr, mockReq(), res, jest.fn());

    // Sin statusCode propio → 500
    expect(res.status).toHaveBeenCalledWith(500);
  });
});

// ── errorHandler con AppError ─────────────────────────────────

describe('errorHandler — respuestas con AppError', () => {
  beforeEach(() => process.env.NODE_ENV = 'test');

  test('responde con statusCode y mensaje del AppError operacional', () => {
    const err = new NotFoundError('Residente no encontrado.');
    const res = mockRes();

    errorHandler(err, mockReq('GET', '/api/residentes/99'), res, jest.fn());

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      error: 'Residente no encontrado.',
    }));
  });

  test('responde 500 con mensaje real en entorno test (no producción)', () => {
    const err = new Error('Error interno inesperado');
    const res = mockRes();

    errorHandler(err, mockReq('POST', '/api/pagos'), res, jest.fn());

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      error: 'Error interno inesperado',
    }));
  });

  test('en producción oculta el mensaje real de errores no operacionales', () => {
    process.env.NODE_ENV = 'production';
    const err = new Error('detalle interno sensible');
    const res = mockRes();

    errorHandler(err, mockReq(), res, jest.fn());

    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ error: 'Error interno del servidor.' })
    );
    // Restaurar
    process.env.NODE_ENV = 'test';
  });

  test('en producción muestra el mensaje de AppError operacional aunque sea 500', () => {
    process.env.NODE_ENV = 'production';
    const err = new AppError('Error de negocio conocido', 500);
    const res = mockRes();

    errorHandler(err, mockReq(), res, jest.fn());

    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ error: 'Error de negocio conocido' })
    );
    process.env.NODE_ENV = 'test';
  });

  test('en development incluye stack trace en la respuesta', () => {
    process.env.NODE_ENV = 'development';
    const err = new AppError('Error con stack', 400);
    const res = mockRes();

    errorHandler(err, mockReq(), res, jest.fn());

    const respuesta = res.json.mock.calls[0][0];
    expect(respuesta).toHaveProperty('stack');
    process.env.NODE_ENV = 'test';
  });

  test('NO incluye stack trace en producción', () => {
    process.env.NODE_ENV = 'production';
    const err = new AppError('Error', 400);
    const res = mockRes();

    errorHandler(err, mockReq(), res, jest.fn());

    const respuesta = res.json.mock.calls[0][0];
    expect(respuesta).not.toHaveProperty('stack');
    process.env.NODE_ENV = 'test';
  });
});

// ── Logger ────────────────────────────────────────────────────

describe('errorHandler — logging', () => {
  const logger = require('../config/logger');

  beforeEach(() => {
    jest.clearAllMocks();
    process.env.NODE_ENV = 'test';
  });

  test('errores 5xx llaman a logger.error', () => {
    const err = new AppError('Error de servidor', 500);
    errorHandler(err, mockReq('GET', '/api/test'), mockRes(), jest.fn());
    expect(logger.error).toHaveBeenCalled();
  });

  test('errores 4xx llaman a logger.warn', () => {
    const err = new ValidationError('Campo inválido');
    errorHandler(err, mockReq('POST', '/api/residentes'), mockRes(), jest.fn());
    expect(logger.warn).toHaveBeenCalled();
    expect(logger.error).not.toHaveBeenCalled();
  });
});