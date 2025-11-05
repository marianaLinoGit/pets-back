PRAGMA foreign_keys = OFF;

DROP TABLE IF EXISTS glycemic_curve_points_new;
DROP TABLE IF EXISTS glycemic_curve_sessions_new;

CREATE TABLE IF NOT EXISTS glycemic_curve_sessions_new (
  id TEXT PRIMARY KEY,
  pet_id TEXT NOT NULL,
  session_date TEXT NOT NULL,
  notes TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

INSERT INTO glycemic_curve_sessions_new (id, pet_id, session_date, notes, created_at, updated_at)
SELECT id, pet_id, session_date, notes, created_at, updated_at
FROM glycemic_curve_sessions;

CREATE TABLE IF NOT EXISTS glycemic_curve_points_new (
  id TEXT PRIMARY KEY,
  session_id TEXT NOT NULL,
  idx INTEGER NOT NULL,
  expected_at TEXT NOT NULL,
  glucose_mgdl REAL,
  glucose_str TEXT,
  measured_at TEXT,
  warn_minutes_before INTEGER,
  dosage_clicks INTEGER,
  notes TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (session_id) REFERENCES glycemic_curve_sessions(id) ON DELETE CASCADE
);

INSERT INTO glycemic_curve_points_new (
  id, session_id, idx, expected_at, glucose_mgdl, glucose_str, measured_at,
  warn_minutes_before, dosage_clicks, notes, created_at, updated_at
)
SELECT
  id, session_id, idx, expected_at, glucose_mgdl, glucose_str, measured_at,
  warn_minutes_before, dosage_clicks, notes, created_at, updated_at
FROM glycemic_curve_points;

DROP TABLE IF EXISTS glycemic_curve_points;
DROP TABLE IF EXISTS glycemic_curve_sessions;

ALTER TABLE glycemic_curve_sessions_new RENAME TO glycemic_curve_sessions;
ALTER TABLE glycemic_curve_points_new RENAME TO glycemic_curve_points;

PRAGMA foreign_keys = ON;
