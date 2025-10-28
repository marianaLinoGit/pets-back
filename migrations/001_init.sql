PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS pets (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  species TEXT NOT NULL CHECK (species IN ('dog','cat','other')),
  breed TEXT,
  birth_year INTEGER,
  birth_month INTEGER CHECK (birth_month BETWEEN 1 AND 12),
  birth_day INTEGER CHECK (birth_day BETWEEN 1 AND 31),
  gender TEXT CHECK (gender IN ('M','F','N')),
  coat TEXT,
  microchip TEXT,
  adoption_date TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_pets_name ON pets(name);
CREATE INDEX IF NOT EXISTS idx_pets_birthday ON pets(birth_month, birth_day);
CREATE INDEX IF NOT EXISTS idx_pets_microchip ON pets(microchip);

CREATE TABLE IF NOT EXISTS pet_weights (
  id TEXT PRIMARY KEY,
  pet_id TEXT NOT NULL,
  measured_at TEXT NOT NULL,
  weight_kg REAL NOT NULL CHECK (weight_kg >= 0),
  created_at TEXT NOT NULL,
  FOREIGN KEY (pet_id) REFERENCES pets(id) ON DELETE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_pet_weights_pet_date ON pet_weights(pet_id, measured_at);
CREATE INDEX IF NOT EXISTS idx_pet_weights_measured_at ON pet_weights(measured_at);

CREATE TABLE IF NOT EXISTS glycemic_curve_sessions (
  id TEXT PRIMARY KEY,
  pet_id TEXT NOT NULL,
  session_date TEXT NOT NULL,
  notes TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (pet_id) REFERENCES pets(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_gcs_pet_date ON glycemic_curve_sessions(pet_id, session_date);

CREATE TABLE IF NOT EXISTS glycemic_curve_points (
  id TEXT PRIMARY KEY,
  session_id TEXT NOT NULL,
  idx INTEGER NOT NULL CHECK (idx BETWEEN 1 AND 5),
  expected_at TEXT NOT NULL,
  glucose_mgdl REAL,
  measured_at TEXT,
  warn_minutes_before INTEGER NOT NULL DEFAULT 10,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (session_id) REFERENCES glycemic_curve_sessions(id) ON DELETE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_gcp_session_idx ON glycemic_curve_points(session_id, idx);
CREATE INDEX IF NOT EXISTS idx_gcp_expected_at ON glycemic_curve_points(expected_at);

CREATE TABLE IF NOT EXISTS lab_test_types (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL UNIQUE COLLATE NOCASE,
  unit TEXT,
  ref_low REAL,
  ref_high REAL,
  category TEXT,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS lab_results (
  id TEXT PRIMARY KEY,
  pet_id TEXT NOT NULL,
  collected_at TEXT NOT NULL,
  lab_name TEXT,
  vet_name TEXT,
  notes TEXT,
  created_at TEXT NOT NULL,
  FOREIGN KEY (pet_id) REFERENCES pets(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_lab_results_pet_date ON lab_results(pet_id, collected_at);

CREATE TABLE IF NOT EXISTS lab_result_values (
  id TEXT PRIMARY KEY,
  result_id TEXT NOT NULL,
  test_type_id TEXT NOT NULL,
  value REAL NOT NULL,
  unit TEXT,
  created_at TEXT NOT NULL,
  FOREIGN KEY (result_id) REFERENCES lab_results(id) ON DELETE CASCADE,
  FOREIGN KEY (test_type_id) REFERENCES lab_test_types(id) ON DELETE RESTRICT
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_lrv_result_test ON lab_result_values(result_id, test_type_id);

CREATE TABLE IF NOT EXISTS vaccine_types (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL UNIQUE COLLATE NOCASE,
  total_doses INTEGER DEFAULT 1,
  description TEXT,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS vaccine_applications (
  id TEXT PRIMARY KEY,
  pet_id TEXT NOT NULL,
  vaccine_type_id TEXT NOT NULL,
  dose_number INTEGER NOT NULL CHECK (dose_number >= 1),
  administered_at TEXT NOT NULL,
  administered_by TEXT,
  clinic TEXT,
  next_dose_at TEXT,
  notes TEXT,
  created_at TEXT NOT NULL,
  FOREIGN KEY (pet_id) REFERENCES pets(id) ON DELETE CASCADE,
  FOREIGN KEY (vaccine_type_id) REFERENCES vaccine_types(id) ON DELETE RESTRICT
);

CREATE INDEX IF NOT EXISTS idx_vacc_app_pet_vac ON vaccine_applications(pet_id, vaccine_type_id);
CREATE INDEX IF NOT EXISTS idx_vacc_app_next ON vaccine_applications(next_dose_at);

CREATE TABLE IF NOT EXISTS pet_treatments (
  id TEXT PRIMARY KEY,
  pet_id TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('dewormer','flea')),
  product_name TEXT,
  administered_at TEXT NOT NULL,
  next_due_at TEXT,
  dose_info TEXT,
  notes TEXT,
  created_at TEXT NOT NULL,
  FOREIGN KEY (pet_id) REFERENCES pets(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_treatments_type_next ON pet_treatments(type, next_due_at);
CREATE INDEX IF NOT EXISTS idx_treatments_pet_date ON pet_treatments(pet_id, administered_at);

CREATE TABLE IF NOT EXISTS vet_visits (
  id TEXT PRIMARY KEY,
  pet_id TEXT NOT NULL,
  visited_at TEXT NOT NULL,
  is_emergency INTEGER NOT NULL DEFAULT 0 CHECK (is_emergency IN (0,1)),
  vet_name TEXT,
  clinic TEXT,
  notes TEXT,
  created_at TEXT NOT NULL,
  FOREIGN KEY (pet_id) REFERENCES pets(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_vet_visits_pet_date ON vet_visits(pet_id, visited_at);
