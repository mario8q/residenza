-- =============================================================
-- MIGRACIÓN 004 — RBAC: agregar rol 'residente'
-- Amplía el CHECK de rol en usuarios y crea tabla de usuarios
-- del portal del residente dentro del schema del conjunto.
-- =============================================================

-- 1. Ampliar roles en tabla de usuarios globales
ALTER TABLE public.usuarios
  DROP CONSTRAINT IF EXISTS usuarios_rol_check;

ALTER TABLE public.usuarios
  ADD CONSTRAINT usuarios_rol_check
  CHECK (rol IN ('superadmin'));

-- 2. Tabla de usuarios para el portal del residente (en schema del tenant)
-- Se aplica via runner.js tenant para cada conjunto.
-- Aquí dejamos la definición para referencia; se crea en 002_tenant_schema.sql
-- si se vuelve a ejecutar, o manualmente en cada schema existente:

-- Ejecutar en cada schema de conjunto ya existente:
-- CREATE TABLE IF NOT EXISTS portal_usuarios (
--   id            SERIAL      PRIMARY KEY,
--   residente_id  INTEGER     NOT NULL REFERENCES residentes(id) ON DELETE CASCADE,
--   email         VARCHAR(150) NOT NULL UNIQUE,
--   password_hash VARCHAR(255) NOT NULL,
--   activo        BOOLEAN     NOT NULL DEFAULT TRUE,
--   ultimo_login  TIMESTAMPTZ,
--   created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
-- );

-- 3. Documentar los 3 roles del sistema en una tabla de referencia
CREATE TABLE IF NOT EXISTS public.roles_referencia (
  rol         VARCHAR(30) PRIMARY KEY,
  descripcion VARCHAR(200)
);

INSERT INTO public.roles_referencia (rol, descripcion) VALUES
  ('superadmin', 'Administrador de la plataforma ResidenciasPro. Acceso total.'),
  ('admin',      'Administrador de un conjunto residencial específico. Acceso a su conjunto.'),
  ('residente',  'Residente de un apartamento. Acceso de solo lectura a su información.')
ON CONFLICT (rol) DO NOTHING;