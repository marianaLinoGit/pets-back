PRAGMA foreign_keys=ON;

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
