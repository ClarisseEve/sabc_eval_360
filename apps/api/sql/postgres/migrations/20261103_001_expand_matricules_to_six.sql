ALTER TABLE evaluations
  DROP CONSTRAINT IF EXISTS evaluations_validateur_matricule_fkey;

ALTER TABLE utilisateurs_ref
  ALTER COLUMN matricule TYPE VARCHAR(6);

ALTER TABLE evaluations
  ALTER COLUMN evaluateur_matricule TYPE VARCHAR(6),
  ALTER COLUMN evalue_matricule TYPE VARCHAR(6),
  ALTER COLUMN validateur_matricule TYPE VARCHAR(6);

ALTER TABLE scores_utilisateurs
  ALTER COLUMN matricule TYPE VARCHAR(6);

ALTER TABLE logs_anomalies
  ALTER COLUMN matricule TYPE VARCHAR(6);

ALTER TABLE recommandations_admin
  ALTER COLUMN matricule TYPE VARCHAR(6),
  ALTER COLUMN validateur_matricule TYPE VARCHAR(6);

ALTER TABLE rapports
  ALTER COLUMN createur_matricule TYPE VARCHAR(6);

ALTER TABLE historique_exports
  ALTER COLUMN createur_matricule TYPE VARCHAR(6);

ALTER TABLE rating_sheet_configurations
  ALTER COLUMN configurateur_matricule TYPE VARCHAR(6);

ALTER TABLE rating_sheets
  ALTER COLUMN matricule TYPE VARCHAR(6),
  ALTER COLUMN publie_par TYPE VARCHAR(6);

DO $$
BEGIN
  IF to_regclass('utilisateurs') IS NOT NULL THEN
    ALTER TABLE evaluations
      ADD CONSTRAINT evaluations_validateur_matricule_fkey
      FOREIGN KEY (validateur_matricule)
      REFERENCES utilisateurs(matricule)
      ON DELETE SET NULL ON UPDATE CASCADE;
  ELSIF to_regclass('utilisateurs_ref') IS NOT NULL THEN
    ALTER TABLE evaluations
      ADD CONSTRAINT evaluations_validateur_matricule_fkey
      FOREIGN KEY (validateur_matricule)
      REFERENCES utilisateurs_ref(matricule)
      ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;
