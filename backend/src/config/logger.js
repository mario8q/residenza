/**
 * config/logger.js
 * Logger centralizado con Winston.
 * Niveles: error > warn > info > http > debug
 */

const { createLogger, format, transports } = require('winston');
const { combine, timestamp, colorize, printf, json } = format;

const isDev = process.env.NODE_ENV !== 'production';

// Formato legible para consola en desarrollo
const devFormat = combine(
  colorize(),
  timestamp({ format: 'HH:mm:ss' }),
  printf(({ level, message, timestamp: ts }) => `${ts} [${level}] ${message}`)
);

// Formato JSON estructurado para producción
const prodFormat = combine(
  timestamp(),
  json()
);

const logger = createLogger({
  level: process.env.LOG_LEVEL || (isDev ? 'debug' : 'info'),
  format: isDev ? devFormat : prodFormat,
  transports: [
    new transports.Console(),
    // En producción agregar transport a archivo o servicio externo:
    // new transports.File({ filename: 'logs/error.log', level: 'error' }),
    // new transports.File({ filename: 'logs/combined.log' }),
  ],
});

module.exports = logger;
