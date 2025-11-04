PRAGMA foreign_keys=OFF;

BEGIN TRANSACTION;

/* 1) Nova tabela vaccine_types (sem UNIQUE em name) */
CREATE TABLE IF NOT EXISTS vaccine_types_new (
  id           TEXT PRIMARY KEY,
  name         TEXT NOT NULL,
  name_biz     TEXT NOT NULL,
  species      TEXT NOT NULL CHECK (species IN ('dog','cat','other')),
  total_doses  INTEGER NOT NULL CHECK (total_doses >= 1),
  brand        TEXT,
  description  TEXT,
  notes        TEXT,
  created_at   TEXT NOT NULL,
  updated_at   TEXT NOT NULL
);

/* Copia dados da tabela atual (usa total_doses existente; nada de totalDoses) */
INSERT INTO vaccine_types_new (
  id, name, name_biz, species, total_doses, brand, description, notes, created_at, updated_at
)
SELECT
  id,
  COALESCE(name, name_biz, '')                      AS name,
  COALESCE(name_biz, name, '')                      AS name_biz,
  species,
  COALESCE(total_doses, 1)                          AS total_doses,
  brand,
  description,
  notes,
  COALESCE(created_at, datetime('now'))             AS created_at,
  COALESCE(updated_at, COALESCE(created_at, datetime('now'))) AS updated_at
FROM vaccine_types;

/* 2) Reconstrói vaccine_applications ANTES de derrubar a antiga vaccine_types */
CREATE TABLE IF NOT EXISTS vaccine_applications_new (
  id               TEXT PRIMARY KEY,
  pet_id           TEXT NOT NULL,
  vaccine_type_id  TEXT NOT NULL,
  dose_number      INTEGER NOT NULL,
  administered_at  TEXT NOT NULL,
  administered_by  TEXT,
  clinic           TEXT,
  next_dose_at     TEXT,
  notes            TEXT,
  brand            TEXT,
  created_at       TEXT NOT NULL
  -- A FK será recriada após o rename das tabelas, para evitar validação agora
);

/* Copia todos os registros (sem validar FK durante a cópia) */
INSERT INTO vaccine_applications_new (
  id, pet_id, vaccine_type_id, dose_number, administered_at, administered_by,
  clinic, next_dose_at, notes, brand, created_at
)
SELECT
  id, pet_id, vaccine_type_id, dose_number, administered_at, administered_by,
  clinic, next_dose_at, notes, brand, created_at
FROM vaccine_applications;

/* 3) DROP na tabela referenciadora primeiro, depois na referenciada */
DROP TABLE vaccine_applications;
DROP TABLE vaccine_types;

/* 4) RENAME das novas para os nomes definitivos */
ALTER TABLE vaccine_types_new RENAME TO vaccine_types;
ALTER TABLE vaccine_applications_new RENAME TO vaccine_applications;

/* 5) Índices/constraints finais */
-- Índice único (espécie + nome de negócio + marca normalizada)
CREATE UNIQUE INDEX IF NOT EXISTS ux_vt_species_namebiz_brand_norm
  ON vaccine_types (species, name_biz, COALESCE(brand,''));

CREATE INDEX IF NOT EXISTS idx_vt_name_biz ON vaccine_types(name_biz);
CREATE INDEX IF NOT EXISTS idx_vt_species  ON vaccine_types(species);
CREATE INDEX IF NOT EXISTS idx_vt_brand    ON vaccine_types(brand);

-- FK agora que os nomes definitivos já existem
CREATE INDEX IF NOT EXISTS idx_va_vt ON vaccine_applications(vaccine_type_id);
-- Se quiser FK materializada (opcional em D1, mas costuma funcionar):
-- Atenção: SQLite não permite adicionar FK com ALTER simples; então recriamos a constraint via CHECK-like ou deixamos sem.
-- Caso sua base original já tivesse FK e você faça questão de mantê-la, troque a criação da applications_new
-- por um CREATE TABLE ... com "FOREIGN KEY (vaccine_type_id) REFERENCES vaccine_types(id) ON DELETE RESTRICT"
-- (aqui deixamos sem FK física para não reativar validação durante o swap).

COMMIT;

PRAGMA foreign_keys=ON;
