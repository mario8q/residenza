-- Migración 005 — Agregar columna ultimo_login a residentes
ALTER TABLE residentes
  ADD COLUMN IF NOT EXISTS ultimo_login TIMESTAMPTZ;