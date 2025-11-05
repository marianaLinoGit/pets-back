PRAGMA foreign_keys = ON;

PRAGMA foreign_keys = OFF;

-- Remove o gatilho que insere automaticamente na pet_weights
DROP TRIGGER IF EXISTS trg_vet_visits_insert_weight;

PRAGMA foreign_keys = ON;
