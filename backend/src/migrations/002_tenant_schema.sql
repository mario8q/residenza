-- =============================================================
-- MIGRACIÓN 002 — Schema del CONJUNTO (Tenant)
-- Este script se ejecuta UNA VEZ por cada conjunto nuevo,
-- dentro del schema específico del conjunto (p.ej. conjunto_1).
-- NO usar nombres de schema explícitos aquí: el runner establece
-- search_path = <schema_del_conjunto> antes de ejecutarlo.
-- =============================================================

-- ── Torres ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS torres (
  id          SERIAL        PRIMARY KEY,
  nombre      VARCHAR(10)   NOT NULL,   -- 'A', 'B', 'C'...
  descripcion VARCHAR(200),
  num_pisos   INTEGER       NOT NULL DEFAULT 1,
  created_at  TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

-- ── Apartamentos ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS apartamentos (
  id          SERIAL        PRIMARY KEY,
  torre_id    INTEGER       NOT NULL REFERENCES torres(id),
  numero      VARCHAR(10)   NOT NULL,   -- '101', '202'...
  codigo      VARCHAR(20)   NOT NULL UNIQUE,  -- 'A-101', 'B-202'
  piso        INTEGER       NOT NULL DEFAULT 1,
  area_m2     NUMERIC(8,2),
  coeficiente NUMERIC(8,6) DEFAULT 1.000000,  -- para cuotas proporcionales
  created_at  TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  UNIQUE(torre_id, numero)
);

-- ── Residentes ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS residentes (
  id              SERIAL        PRIMARY KEY,
  apartamento_id  INTEGER       NOT NULL REFERENCES apartamentos(id),
  nombre          VARCHAR(200)  NOT NULL,
  documento       VARCHAR(30)   NOT NULL UNIQUE,
  tipo_documento  VARCHAR(10)   NOT NULL DEFAULT 'CC'
                                CHECK (tipo_documento IN ('CC','CE','NIT','PAS')),
  tipo_residente  VARCHAR(20)   NOT NULL DEFAULT 'Propietario'
                                CHECK (tipo_residente IN ('Propietario','Arrendatario')),
  telefono        VARCHAR(20),
  email           VARCHAR(150)  NOT NULL,
  fecha_ingreso   DATE,
  -- Credenciales de acceso al portal del residente
  password_hash   VARCHAR(255),
  activo          BOOLEAN       NOT NULL DEFAULT TRUE,
  created_at      TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

COMMENT ON COLUMN residentes.documento IS 'Número de documento único. Impide duplicados dentro del conjunto.';

-- ── Períodos de administración ────────────────────────────────
-- Cada período mensual es una entidad que agrupa las obligaciones de pago.
CREATE TABLE IF NOT EXISTS periodos (
  id          SERIAL        PRIMARY KEY,
  anio        INTEGER       NOT NULL,
  mes         INTEGER       NOT NULL CHECK (mes BETWEEN 1 AND 12),
  cuota_base  NUMERIC(12,2) NOT NULL,
  fecha_vence DATE          NOT NULL,  -- día límite de pago sin interés
  tasa_mora   NUMERIC(5,4)  NOT NULL DEFAULT 0.0150, -- 1.5% mensual por defecto
  cerrado     BOOLEAN       NOT NULL DEFAULT FALSE,
  created_at  TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  UNIQUE(anio, mes)
);

COMMENT ON TABLE periodos IS 'Un período por mes. Define cuota y fecha de vencimiento para el cobro.';

-- ── Obligaciones de pago ──────────────────────────────────────
-- Una obligación por apartamento por período.
-- Se generan automáticamente al crear/cerrar un período.
CREATE TABLE IF NOT EXISTS obligaciones (
  id              SERIAL        PRIMARY KEY,
  periodo_id      INTEGER       NOT NULL REFERENCES periodos(id),
  apartamento_id  INTEGER       NOT NULL REFERENCES apartamentos(id),
  monto_base      NUMERIC(12,2) NOT NULL,
  interes_mora    NUMERIC(12,2) NOT NULL DEFAULT 0,
  total_deuda     NUMERIC(12,2) GENERATED ALWAYS AS (monto_base + interes_mora) STORED,
  UNIQUE(periodo_id, apartamento_id)
);

-- ── Pagos ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS pagos (
  id              SERIAL        PRIMARY KEY,
  obligacion_id   INTEGER       NOT NULL REFERENCES obligaciones(id),
  apartamento_id  INTEGER       NOT NULL REFERENCES apartamentos(id),
  monto           NUMERIC(12,2) NOT NULL CHECK (monto > 0),
  medio_pago      VARCHAR(30)   NOT NULL DEFAULT 'Transferencia'
                                CHECK (medio_pago IN ('Transferencia','Efectivo','PSE','Cheque','Otro')),
  referencia      VARCHAR(100),
  fecha_pago      DATE          NOT NULL,
  numero_recibo   VARCHAR(20)   NOT NULL UNIQUE,  -- 'REC-1042'
  url_recibo_pdf  VARCHAR(500),
  registrado_por  INTEGER,  -- id del admin que registró
  created_at      TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

-- ── Comunicados ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS comunicados (
  id              SERIAL        PRIMARY KEY,
  asunto          VARCHAR(300)  NOT NULL,
  mensaje         TEXT          NOT NULL,
  destinatarios   VARCHAR(50)   NOT NULL DEFAULT 'General'
                                CHECK (destinatarios IN ('General','Torre A','Torre B','Torre C','Torre D','Propietarios','Arrendatarios')),
  prioridad       VARCHAR(20)   NOT NULL DEFAULT 'Normal'
                                CHECK (prioridad IN ('Normal','Urgente')),
  num_enviados    INTEGER       NOT NULL DEFAULT 0,
  num_lecturas    INTEGER       NOT NULL DEFAULT 0,
  enviado_por     INTEGER,
  created_at      TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

-- ── PQR ──────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS pqr (
  id              SERIAL        PRIMARY KEY,
  radicado        VARCHAR(10)   NOT NULL UNIQUE,  -- '#001', '#002'...
  apartamento_id  INTEGER       NOT NULL REFERENCES apartamentos(id),
  tipo            VARCHAR(20)   NOT NULL CHECK (tipo IN ('Petición','Queja','Reclamo')),
  asunto          VARCHAR(300)  NOT NULL,
  descripcion     TEXT,
  prioridad       VARCHAR(10)   NOT NULL DEFAULT 'Baja'
                                CHECK (prioridad IN ('Alta','Media','Baja')),
  estado          VARCHAR(20)   NOT NULL DEFAULT 'Abierto'
                                CHECK (estado IN ('Abierto','En proceso','Cerrado')),
  fecha_cierre    DATE,
  created_at      TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

-- ── Historial de estados PQR ──────────────────────────────────
CREATE TABLE IF NOT EXISTS pqr_historial (
  id          SERIAL       PRIMARY KEY,
  pqr_id      INTEGER      NOT NULL REFERENCES pqr(id) ON DELETE CASCADE,
  estado      VARCHAR(20)  NOT NULL,
  comentario  TEXT,
  changed_by  INTEGER,
  created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- ── Índices de rendimiento ────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_residentes_apartamento  ON residentes(apartamento_id);
CREATE INDEX IF NOT EXISTS idx_residentes_documento    ON residentes(documento);
CREATE INDEX IF NOT EXISTS idx_pagos_apartamento       ON pagos(apartamento_id);
CREATE INDEX IF NOT EXISTS idx_pagos_fecha             ON pagos(fecha_pago);
CREATE INDEX IF NOT EXISTS idx_obligaciones_periodo    ON obligaciones(periodo_id);
CREATE INDEX IF NOT EXISTS idx_obligaciones_apartamento ON obligaciones(apartamento_id);
CREATE INDEX IF NOT EXISTS idx_pqr_estado              ON pqr(estado);
CREATE INDEX IF NOT EXISTS idx_comunicados_fecha       ON comunicados(created_at);

-- ── Triggers updated_at ───────────────────────────────────────
-- La función set_updated_at() ya existe en public, pero dentro
-- del schema del tenant necesitamos crearla también o referenciarla.
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_residentes_updated_at
  BEFORE UPDATE ON residentes
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_pqr_updated_at
  BEFORE UPDATE ON pqr
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
