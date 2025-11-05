PRAGMA foreign_keys=ON;

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
