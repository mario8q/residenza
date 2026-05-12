/**
 * middlewares/errorHandler.js
 * Manejador de errores centralizado.
 * Captura todos los errores no manejados en los controllers
 * y devuelve respuestas consistentes.
 */

const logger = require('../config/logger');

/**
 * Clase base para errores operacionales (esperados).
 * Distingue errores de negocio de bugs reales.
 */
class AppError extends Error {
  constructor(message, statusCode = 500) {
    super(message);
    this.statusCode  = statusCode;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

class NotFoundError     extends AppError { constructor(msg = 'Recurso no encontrado') { super(msg, 404); } }
class ValidationError   extends AppError { constructor(msg)                            { super(msg, 400); } }
class UnauthorizedError extends AppError { constructor(msg = 'No autorizado')          { super(msg, 401); } }
class ForbiddenError    extends AppError { constructor(msg = 'Acceso denegado')        { super(msg, 403); } }
class ConflictError     extends AppError { constructor(msg)                            { super(msg, 409); } }

/**
 * Convierte errores de PostgreSQL a AppError con mensajes claros.
 */
function handlePgError(err) {
  switch (err.code) {
    case '23505': // unique_violation
      return new ConflictError(`Ya existe un registro con ese valor: ${err.detail || ''}`);
    case '23503': // foreign_key_violation
      return new ValidationError(`Referencia inválida: el registro relacionado no existe.`);
    case '23502': // not_null_violation
      return new ValidationError(`El campo "${err.column}" es obligatorio.`);
    case '22P02': // invalid_text_representation
      return new ValidationError('Tipo de dato inválido en la solicitud.');
    default:
      return null;
  }
}

/**
 * Middleware de manejo de errores (4 argumentos requeridos por Express).
 */
// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, _next) {
  // Convertir errores de PostgreSQL
  const pgConverted = err.code ? handlePgError(err) : null;
  const error = pgConverted || err;

  const statusCode = error.statusCode || 500;
  const isOperational = error.isOperational || false;

  // Log
  if (statusCode >= 500) {
    logger.error(`[${req.method} ${req.path}] ${statusCode} — ${error.message}`);
    if (!isOperational) logger.error(error.stack);
  } else {
    logger.warn(`[${req.method} ${req.path}] ${statusCode} — ${error.message}`);
  }

  // Respuesta
  res.status(statusCode).json({
    error: isOperational || process.env.NODE_ENV !== 'production'
      ? error.message
      : 'Error interno del servidor.',
    ...(process.env.NODE_ENV === 'development' && { stack: error.stack }),
  });
}

module.exports = {
  errorHandler,
  AppError,
  NotFoundError,
  ValidationError,
  UnauthorizedError,
  ForbiddenError,
  ConflictError,
};
