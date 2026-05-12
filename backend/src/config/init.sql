-- init.sql
-- Se ejecuta una sola vez cuando Docker crea el contenedor por primera vez.
-- Instala extensiones necesarias en la base de datos.

-- UUID v4 para IDs únicos sin autoincrement
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Funciones de cifrado (para contraseñas en caso de necesitar pgcrypto)
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Texto completo en español (útil para búsqueda de residentes)
-- Los diccionarios de idioma vienen incluidos en postgres:16-alpine
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_ts_config WHERE cfgname = 'spanish'
  ) THEN
    CREATE TEXT SEARCH CONFIGURATION spanish (COPY = pg_catalog.spanish);
  END IF;
END
$$;
