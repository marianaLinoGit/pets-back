PRAGMA foreign_keys = OFF;

CREATE TABLE IF NOT EXISTS conditions (
  id TEXT PRIMARY KEY,
  pet_id TEXT NOT NULL,
  name TEXT NOT NULL,
  curability TEXT NOT NULL DEFAULT 'INDEFINIDO' CHECK (curability IN ('CURÁVEL','NÃO_CURÁVEL','INDEFINIDO')),
  status TEXT NOT NULL DEFAULT 'ATIVA' CHECK (status IN ('ATIVA','RESOLVIDA','EM_MANEJO','DESCARTADA')),
  severity TEXT NOT NULL DEFAULT 'MODERADA' CHECK (severity IN ('BAIXA','MODERADA','ALTA')),
  diagnosed_at TEXT,
  resolved_at TEXT,
  notes TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (pet_id) REFERENCES pets(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_conditions_pet ON conditions(pet_id);
CREATE INDEX IF NOT EXISTS idx_conditions_status ON conditions(status);
CREATE INDEX IF NOT EXISTS idx_conditions_pet_status ON conditions(pet_id, status);
CREATE INDEX IF NOT EXISTS idx_conditions_pet_name ON conditions(pet_id, name);

CREATE TABLE IF NOT EXISTS condition_lab_types (
  condition_id TEXT NOT NULL,
  lab_type_id TEXT NOT NULL,
  PRIMARY KEY (condition_id, lab_type_id),
  FOREIGN KEY (condition_id) REFERENCES conditions(id) ON DELETE CASCADE,
  FOREIGN KEY (lab_type_id) REFERENCES lab_types(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_cond_lab_types__lab ON condition_lab_types(lab_type_id);

CREATE TABLE IF NOT EXISTS condition_lab_results (
  condition_id TEXT NOT NULL,
  lab_result_id TEXT NOT NULL,
  PRIMARY KEY (condition_id, lab_result_id),
  FOREIGN KEY (condition_id) REFERENCES conditions(id) ON DELETE CASCADE,
  FOREIGN KEY (lab_result_id) REFERENCES lab_results(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_cond_lab_results__lab ON condition_lab_results(lab_result_id);

CREATE TABLE IF NOT EXISTS condition_treatments (
  condition_id TEXT NOT NULL,
  treatment_id TEXT NOT NULL,
  PRIMARY KEY (condition_id, treatment_id),
  FOREIGN KEY (condition_id) REFERENCES conditions(id) ON DELETE CASCADE,
  FOREIGN KEY (treatment_id) REFERENCES treatments(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_cond_treatments__treat ON condition_treatments(treatment_id);

CREATE TABLE IF NOT EXISTS condition_notes (
  id TEXT PRIMARY KEY,
  condition_id TEXT NOT NULL,
  content TEXT NOT NULL,
  status_snapshot TEXT NULL CHECK (status_snapshot IN ('ATIVA','RESOLVIDA','EM_MANEJO','DESCARTADA')),
  severity_snapshot TEXT NULL CHECK (severity_snapshot IN ('BAIXA','MODERADA','ALTA')),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (condition_id) REFERENCES conditions(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_condition_notes_condition ON condition_notes(condition_id);
CREATE INDEX IF NOT EXISTS idx_condition_notes_created ON condition_notes(condition_id, created_at DESC);

PRAGMA foreign_keys = ON;
