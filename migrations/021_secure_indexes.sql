-- ===== Substitua os índices (id, pet_id) por índices iniciando com pet_id =====

-- Glicemia: lista/consulta por pet e ordena por session_date
CREATE INDEX IF NOT EXISTS idx_gly_sessions_pet_date
  ON glycemic_curve_sessions(pet_id, session_date);

-- Já tínhamos session_id/idx para atualizar P1..P5 e expected_at para alerts
CREATE INDEX IF NOT EXISTS idx_gly_points_expected_at
  ON glycemic_curve_points(expected_at);
CREATE INDEX IF NOT EXISTS idx_gly_points_session_idx
  ON glycemic_curve_points(session_id, idx);

-- Vacinas: alerts usam next_dose_at (já tem); listagens e “última aplicada” usam administered_at
CREATE INDEX IF NOT EXISTS idx_vaccine_applications_next_dose_at
  ON vaccine_applications(next_dose_at);
CREATE INDEX IF NOT EXISTS idx_vaccine_applications_pet_next
  ON vaccine_applications(pet_id, next_dose_at);
CREATE INDEX IF NOT EXISTS idx_vaccine_applications_pet_admin
  ON vaccine_applications(pet_id, administered_at);

-- Pets: aniversários por birth_date
CREATE INDEX IF NOT EXISTS idx_pets_birth_date
  ON pets(birth_date);

-- Lab results: listas por pet e ordenação por collected_at
CREATE INDEX IF NOT EXISTS idx_lab_results_pet_date
  ON lab_results(pet_id, collected_at);
-- Valores por resultado (JOIN frequente)
CREATE INDEX IF NOT EXISTS idx_lab_result_values_result
  ON lab_result_values(result_id);

-- Tratamentos: listas por pet e ordenação por administered_at
CREATE INDEX IF NOT EXISTS idx_treatments_pet_date
  ON pet_treatments(pet_id, administered_at);

-- Condições: listas por pet e ordenação por created_at
CREATE INDEX IF NOT EXISTS idx_conditions_pet_created
  ON conditions(pet_id, created_at);

-- Visitas ao vet: listas por pet e ordenação por visited_at
CREATE INDEX IF NOT EXISTS idx_vet_visits_pet_date
  ON vet_visits(pet_id, visited_at);

-- (Opcional) manter um índice simples por pet_id nas tabelas mais acessadas
-- quando você também faz queries sem ordenação específica:
CREATE INDEX IF NOT EXISTS idx_gly_sessions_pet
  ON glycemic_curve_sessions(pet_id);
