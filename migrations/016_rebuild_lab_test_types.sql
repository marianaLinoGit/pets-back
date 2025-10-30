BEGIN TRANSACTION;

CREATE TABLE lab_test_types_new (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  species TEXT NOT NULL CHECK (species IN ('dog','cat','other')) DEFAULT 'other',
  unit TEXT NULL,
  ref_low REAL NULL,
  ref_high REAL NULL,
  category TEXT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  UNIQUE(name, species)
);

INSERT INTO lab_test_types_new (id, name, species, unit, ref_low, ref_high, category, created_at, updated_at)
SELECT
  id,
  COALESCE(name, ''),
  COALESCE(species, 'other'),
  unit,
  ref_low,
  ref_high,
  category,
  COALESCE(created_at, datetime('now')),
  COALESCE(updated_at, datetime('now'))
FROM lab_test_types;

DROP TABLE lab_test_types;
ALTER TABLE lab_test_types_new RENAME TO lab_test_types;

CREATE INDEX IF NOT EXISTS idx_lab_test_types_name ON lab_test_types(name);
CREATE INDEX IF NOT EXISTS idx_lab_test_types_species ON lab_test_types(species);

COMMIT;
