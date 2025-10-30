BEGIN TRANSACTION;
ALTER TABLE lab_test_types ADD COLUMN species TEXT DEFAULT 'other';
UPDATE lab_test_types SET species = COALESCE(species, 'other');
COMMIT;