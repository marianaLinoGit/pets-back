PRAGMA foreign_keys=ON;

DROP TRIGGER IF EXISTS trg_vet_visits_insert_weight;
CREATE TRIGGER trg_vet_visits_insert_weight
AFTER INSERT ON vet_visits
WHEN NEW.weight_kg IS NOT NULL
BEGIN
  INSERT INTO pet_weights (id, pet_id, measured_at, weight_kg, created_at)
  VALUES (
    lower(hex(randomblob(16))),
    NEW.pet_id,
    substr(NEW.visited_at, 1, 10),
    NEW.weight_kg,
    COALESCE(NEW.created_at, datetime('now'))
  );
END;
