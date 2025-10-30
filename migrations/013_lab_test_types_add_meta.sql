BEGIN TRANSACTION;

ALTER TABLE lab_test_types ADD COLUMN updated_at TEXT;

UPDATE lab_test_types
SET updated_at = COALESCE(updated_at, created_at);

CREATE INDEX IF NOT EXISTS idx_lab_test_types_name ON lab_test_types(name);

COMMIT;
