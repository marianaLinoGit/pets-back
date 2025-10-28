CREATE TABLE IF NOT EXISTS glycemic_curve_sessions (
  id TEXT PRIMARY KEY,
  pet_id TEXT NOT NULL,
  session_date TEXT NOT NULL,              -- 'YYYY-MM-DD'
  notes TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (pet_id) REFERENCES pets (id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_gly_sess_pet_date
  ON glycemic_curve_sessions (pet_id, session_date DESC);

CREATE TABLE IF NOT EXISTS glycemic_curve_points (
  id TEXT PRIMARY KEY,
  session_id TEXT NOT NULL,
  idx INTEGER NOT NULL,                    -- 1..5
  expected_at TEXT NOT NULL,               -- ISO datetime
  glucose_mgdl INTEGER,                    -- nullable
  measured_at TEXT,                        -- ISO datetime, nullable
  warn_minutes_before INTEGER NOT NULL DEFAULT 10,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (session_id) REFERENCES glycemic_curve_sessions (id) ON DELETE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_gly_points_sid_idx
  ON glycemic_curve_points (session_id, idx);

CREATE INDEX IF NOT EXISTS idx_gly_points_sid
  ON glycemic_curve_points (session_id);
