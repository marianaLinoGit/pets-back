-- 025_vet_visits_require_core_fields.sql
-- ATENÇÃO: esta migration recria vet_visits e tabelas relacionadas do zero.
-- Vai apagar dados existentes nessas tabelas.

PRAGMA foreign_keys = OFF;

BEGIN TRANSACTION;

-- 1) Drop das tabelas filhas que referenciam vet_visits (se existirem)
DROP TABLE IF EXISTS vet_visit_vaccines;
DROP TABLE IF EXISTS vet_visit_labs;
DROP TABLE IF EXISTS lab_order_items;
DROP TABLE IF EXISTS lab_orders;

-- 2) Drop da própria vet_visits
DROP TABLE IF EXISTS vet_visits;

-- 3) Cria vet_visits com o schema final esperado pelo código
CREATE TABLE vet_visits (
  id TEXT PRIMARY KEY,
  pet_id TEXT NOT NULL REFERENCES pets(id) ON DELETE CASCADE,
  visited_at TEXT NOT NULL,
  is_emergency INTEGER NOT NULL DEFAULT 0,
  visit_type TEXT NOT NULL,
  reason TEXT,
  weight_kg REAL NOT NULL,
  temp_c REAL,
  heart_rate_bpm INTEGER,
  resp_rate_bpm INTEGER,
  capillary_refill_sec REAL,
  pain_score INTEGER,
  exam_summary TEXT,
  findings TEXT,
  diagnosis TEXT,
  differential_dx TEXT,
  procedures_done TEXT,
  meds_administered TEXT,
  prescriptions TEXT,
  allergies TEXT,
  repro_status TEXT,
  next_visit_at TEXT,
  clinic TEXT NOT NULL,
  vet_name TEXT,
  cost_total REAL,
  paid_total REAL,
  payment_method TEXT,
  notes TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  deleted_at TEXT
);

-- 4) Índice para buscas por pet + data
CREATE INDEX IF NOT EXISTS idx_vet_visits_pet
  ON vet_visits(pet_id, visited_at DESC);

-- 5) Tabelas de relação e ordens de exame (iguais à 024, só que recriadas)

CREATE TABLE vet_visit_vaccines (
  id TEXT PRIMARY KEY,
  visit_id TEXT NOT NULL REFERENCES vet_visits(id) ON DELETE CASCADE,
  vaccine_application_id TEXT NOT NULL REFERENCES vaccine_applications(id) ON DELETE CASCADE,
  created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_vvv_visit
  ON vet_visit_vaccines(visit_id);

CREATE INDEX IF NOT EXISTS idx_vvv_app
  ON vet_visit_vaccines(vaccine_application_id);

CREATE TABLE vet_visit_labs (
  id TEXT PRIMARY KEY,
  visit_id TEXT NOT NULL REFERENCES vet_visits(id) ON DELETE CASCADE,
  lab_result_id TEXT NOT NULL REFERENCES lab_results(id) ON DELETE CASCADE,
  created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_vvl_visit
  ON vet_visit_labs(visit_id);

CREATE INDEX IF NOT EXISTS idx_vvl_lab
  ON vet_visit_labs(lab_result_id);

CREATE TABLE lab_orders (
  id TEXT PRIMARY KEY,
  visit_id TEXT NOT NULL REFERENCES vet_visits(id) ON DELETE CASCADE,
  created_at TEXT NOT NULL
);

CREATE TABLE lab_order_items (
  id TEXT PRIMARY KEY,
  order_id TEXT NOT NULL REFERENCES lab_orders(id) ON DELETE CASCADE,
  lab_type_id TEXT NOT NULL REFERENCES lab_types(id) ON DELETE RESTRICT,
  notes TEXT,
  created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_lab_order_items_order
  ON lab_order_items(order_id);

-- 6) Trigger para criar peso automaticamente a partir da visita
CREATE TRIGGER IF NOT EXISTS trg_vet_visits_insert_weight
AFTER INSERT ON vet_visits
WHEN NEW.weight_kg IS NOT NULL
BEGIN
  INSERT INTO pet_weights (id, pet_id, measured_at, weight_kg, created_at)
  VALUES (
    lower(hex(randomblob(16))),
    NEW.pet_id,
    substr(NEW.visited_at, 1, 10),
    NEW.weight_kg,
    NEW.created_at
  );
END;

COMMIT;

PRAGMA foreign_keys = ON;
