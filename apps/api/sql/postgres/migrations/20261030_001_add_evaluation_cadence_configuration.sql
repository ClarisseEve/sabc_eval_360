CREATE TABLE IF NOT EXISTS periodes_evaluation_cadences (
  annee INTEGER PRIMARY KEY CHECK (annee BETWEEN 1900 AND 2200),
  cadence VARCHAR(20) NOT NULL CHECK (cadence IN ('trimestrielle', 'semestrielle')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
