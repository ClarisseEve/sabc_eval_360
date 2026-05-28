-- Migration: Add evaluation_parent_id (contre-évaluation) and motif_rejet columns
-- Epic 4 — Stories 4.4 (motif_rejet) and 4.7 (contre-évaluation)

ALTER TABLE evaluations
  ADD COLUMN IF NOT EXISTS motif_rejet TEXT NULL,
  ADD COLUMN IF NOT EXISTS evaluation_parent_id UUID NULL;

CREATE INDEX IF NOT EXISTS idx_evaluations_motif_rejet
  ON evaluations(id_evaluation) WHERE motif_rejet IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_evaluations_parent_id
  ON evaluations(evaluation_parent_id);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'evaluations_parent_fkey'
  ) THEN
    ALTER TABLE evaluations
      ADD CONSTRAINT evaluations_parent_fkey
      FOREIGN KEY (evaluation_parent_id)
      REFERENCES evaluations(id_evaluation)
      ON DELETE SET NULL;
  END IF;
END $$;
