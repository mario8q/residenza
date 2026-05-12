-- =============================================================
-- MIGRACIÓN 001 — Schema PUBLIC
-- Tablas globales: conjuntos residenciales y usuarios del sistema.
-- Estas tablas son compartidas y viven en el schema "public".
-- Cada conjunto luego tiene su propio schema aislado.
-- =============================================================

-- ── Conjuntos residenciales ───────────────────────────────────
-- Un "conjunto" es la unidad de multi-tenancy del sistema.
-- Cada conjunto tiene su propio schema en PostgreSQL.
CREATE TABLE IF NOT EXISTS public.conjuntos (
  id            SERIAL        PRIMARY KEY,
  nombre        VARCHAR(200)  NOT NULL,
  nit           VARCHAR(20)   UNIQUE,
  direccion     VARCHAR(300),
  ciudad        VARCHAR(100),
  telefono      VARCHAR(20),
  email_admin   VARCHAR(150),
  -- Schema de PostgreSQL asignado a este conjunto
  schema_name   VARCHAR(63)   NOT NULL UNIQUE,  -- e.g. 'conjunto_1'
  cuota_base    NUMERIC(12,2) NOT NULL DEFAULT 0,
  -- Configuración
  num_torres    INTEGER       NOT NULL DEFAULT 1,
  num_aptos     INTEGER       NOT NULL DEFAULT 0,
  -- Auditoría
  activo        BOOLEAN       NOT NULL DEFAULT TRUE,
  created_at    TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.conjuntos IS 'Catálogo de conjuntos residenciales. Cada fila origina un schema propio.';
COMMENT ON COLUMN public.conjuntos.schema_name IS 'Nombre del schema PostgreSQL de este conjunto. Formato: conjunto_<id>.';

-- ── Usuarios del sistema ──────────────────────────────────────
-- Superadministradores de la plataforma.
-- Los administradores y residentes de cada conjunto
-- viven en el schema del conjunto correspondiente.
CREATE TABLE IF NOT EXISTS public.usuarios (
  id            SERIAL        PRIMARY KEY,
  email         VARCHAR(150)  NOT NULL UNIQUE,
  password_hash VARCHAR(255)  NOT NULL,
  nombre        VARCHAR(200)  NOT NULL,
  rol           VARCHAR(30)   NOT NULL DEFAULT 'superadmin'
                              CHECK (rol IN ('superadmin')),
  activo        BOOLEAN       NOT NULL DEFAULT TRUE,
  ultimo_login  TIMESTAMPTZ,
  created_at    TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.usuarios IS 'Usuarios superadministradores de la plataforma ResidenciasPro.';

-- ── Relación conjunto ↔ administrador ────────────────────────
-- Un administrador puede gestionar varios conjuntos.
-- Esta tabla vive en public para cruzar ambas entidades.
CREATE TABLE IF NOT EXISTS public.conjunto_admins (
  id            SERIAL        PRIMARY KEY,
  conjunto_id   INTEGER       NOT NULL REFERENCES public.conjuntos(id) ON DELETE CASCADE,
  email         VARCHAR(150)  NOT NULL,
  password_hash VARCHAR(255)  NOT NULL,
  nombre        VARCHAR(200)  NOT NULL,
  telefono      VARCHAR(20),
  activo        BOOLEAN       NOT NULL DEFAULT TRUE,
  ultimo_login  TIMESTAMPTZ,
  created_at    TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  UNIQUE(conjunto_id, email)
);

COMMENT ON TABLE public.conjunto_admins IS 'Administradores de conjuntos. Un admin puede gestionar un solo conjunto.';

-- ── Índices ───────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_conjuntos_schema ON public.conjuntos(schema_name);
CREATE INDEX IF NOT EXISTS idx_conjunto_admins_email ON public.conjunto_admins(email);
CREATE INDEX IF NOT EXISTS idx_conjunto_admins_conjunto ON public.conjunto_admins(conjunto_id);

-- ── Trigger: updated_at automático ───────────────────────────
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_conjuntos_updated_at
  BEFORE UPDATE ON public.conjuntos
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER trg_conjunto_admins_updated_at
  BEFORE UPDATE ON public.conjunto_admins
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
