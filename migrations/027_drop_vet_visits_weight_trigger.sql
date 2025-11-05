PRAGMA foreign_keys = ON;

BEGIN TRANSACTION;

-- Remove o gatilho que insere automaticamente na pet_weights
DROP TRIGGER IF EXISTS trg_vet_visits_insert_weight;

COMMIT;
