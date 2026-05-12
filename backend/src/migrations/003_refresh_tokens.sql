-- Migración 003 — Blacklist de refresh tokens revocados
-- Opcional: permite invalidar tokens antes de que expiren (logout forzado).
-- Si no la aplicas, el logout solo borra la cookie pero el token sigue técnicamente válido
-- hasta su expiración de 7 días.

CREATE TABLE IF NOT EXISTS public.refresh_tokens_blacklist (
  id          SERIAL      PRIMARY KEY,
  token_jti   VARCHAR(36) NOT NULL UNIQUE,  -- JWT ID (agregar jwtid al sign para usarlo)
  revoked_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at  TIMESTAMPTZ NOT NULL
);

-- Índice para limpieza periódica de tokens ya expirados
CREATE INDEX IF NOT EXISTS idx_rtb_expires ON public.refresh_tokens_blacklist(expires_at);

COMMENT ON TABLE public.refresh_tokens_blacklist IS
  'Tokens de refresco revocados explícitamente (logout). Se puede limpiar periódicamente con DELETE WHERE expires_at < NOW().';