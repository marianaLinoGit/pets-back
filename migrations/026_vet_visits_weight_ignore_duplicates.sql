-- 026_vet_visits_weight_ignore_duplicates.sql
-- Ajusta o gatilho para não falhar quando já existir peso no mesmo dia para o pet.

PRAGMA foreign_keys = ON;

BEGIN TRANSACTION;

-- Remove o gatilho antigo, se existir
DROP TRIGGER IF EXISTS trg_vet_visits_insert_weight;

-- Recria o gatilho usando INSERT OR IGNORE
CREATE TRIGGER trg_vet_visits_insert_weight
AFTER INSERT ON vet_visits
WHEN NEW.weight_kg IS NOT NULL
BEGIN
  INSERT OR IGNORE INTO pet_weights (id, pet_id, measured_at, weight_kg, created_at)
  VALUES (
    lower(hex(randomblob(16))),
    NEW.pet_id,
    substr(NEW.visited_at, 1, 10),
    NEW.weight_kg,
    NEW.created_at
  );
END;

COMMIT;
