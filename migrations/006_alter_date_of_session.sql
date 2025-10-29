UPDATE glycemic_curve_sessions
SET session_date = substr(session_date, 1, 10)
WHERE length(session_date) > 10;