PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS vet_visits (
  id TEXT PRIMARY KEY,
  pet_id TEXT NOT NULL REFERENCES pets(id) ON DELETE CASCADE,
  visited_at TEXT NOT NULL,
  is_emergency INTEGER NOT NULL DEFAULT 0,
  visit_type TEXT,
  reason TEXT,
  weight_kg REAL,
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
  clinic TEXT,
  vet_name TEXT,
  cost_total REAL,
  paid_total REAL,
  payment_method TEXT,
  notes TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  deleted_at TEXT
);

CREATE INDEX IF NOT EXISTS idx_vet_visits_pet ON vet_visits(pet_id, visited_at);

CREATE TABLE IF NOT EXISTS vet_visit_vaccines (
  id TEXT PRIMARY KEY,
  visit_id TEXT NOT NULL REFERENCES vet_visits(id) ON DELETE CASCADE,
  vaccine_application_id TEXT NOT NULL REFERENCES vaccine_applications(id) ON DELETE CASCADE,
  created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_vvv_visit ON vet_visit_vaccines(visit_id);
CREATE INDEX IF NOT EXISTS idx_vvv_app ON vet_visit_vaccines(vaccine_application_id);

CREATE TABLE IF NOT EXISTS vet_visit_labs (
  id TEXT PRIMARY KEY,
  visit_id TEXT NOT NULL REFERENCES vet_visits(id) ON DELETE CASCADE,
  lab_result_id TEXT NOT NULL REFERENCES lab_results(id) ON DELETE CASCADE,
  created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_vvl_visit ON vet_visit_labs(visit_id);
CREATE INDEX IF NOT EXISTS idx_vvl_lab ON vet_visit_labs(lab_result_id);

CREATE TABLE IF NOT EXISTS lab_orders (
  id TEXT PRIMARY KEY,
  visit_id TEXT NOT NULL REFERENCES vet_visits(id) ON DELETE CASCADE,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS lab_order_items (
  id TEXT PRIMARY KEY,
  order_id TEXT NOT NULL REFERENCES lab_orders(id) ON DELETE CASCADE,
  lab_type_id TEXT NOT NULL REFERENCES lab_types(id) ON DELETE RESTRICT,
  notes TEXT,
  created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_lab_order_items_order ON lab_order_items(order_id);
