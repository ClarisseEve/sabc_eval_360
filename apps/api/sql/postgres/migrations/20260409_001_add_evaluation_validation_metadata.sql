ALTER TABLE evaluations
  ADD COLUMN IF NOT EXISTS validateur_matricule VARCHAR(5),
  ADD COLUMN IF NOT EXISTS date_validation TIMESTAMPTZ NULL,
  ADD COLUMN IF NOT EXISTS commentaire_validation TEXT NULL;

CREATE INDEX IF NOT EXISTS idx_evaluations_validateur_matricule
  ON evaluations(validateur_matricule);

CREATE INDEX IF NOT EXISTS idx_evaluations_date_validation
  ON evaluations(date_validation);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'evaluations_validateur_matricule_fkey'
  ) THEN
    IF to_regclass('public.utilisateurs') IS NOT NULL THEN
      ALTER TABLE evaluations
        ADD CONSTRAINT evaluations_validateur_matricule_fkey
        FOREIGN KEY (validateur_matricule)
        REFERENCES utilisateurs(matricule)
        ON DELETE SET NULL
        ON UPDATE CASCADE;
    ELSIF to_regclass('public.utilisateurs_ref') IS NOT NULL THEN
      ALTER TABLE evaluations
        ADD CONSTRAINT evaluations_validateur_matricule_fkey
        FOREIGN KEY (validateur_matricule)
        REFERENCES utilisateurs_ref(matricule)
        ON DELETE SET NULL
        ON UPDATE CASCADE;
    END IF;
  END IF;
END $$;
