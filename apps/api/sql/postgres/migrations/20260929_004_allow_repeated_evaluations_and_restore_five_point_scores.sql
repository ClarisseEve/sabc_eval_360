ALTER TABLE evaluations
  DROP CONSTRAINT IF EXISTS unq_evaluation_acteurs_periode_type;

UPDATE evaluations
SET note_globale = ROUND(note_globale / 4, 2)
WHERE note_globale > 5 AND note_globale <= 20;

INSERT INTO regles_evaluation (
  nom_regle,
  description,
  criteres_evaluation_json,
  est_active,
  role_evaluateur,
  role_evalue,
  type_evaluation
)
SELECT
  'DR vers CDV',
  'Evaluation descendante des CDV',
  source.criteres_evaluation_json,
  source.est_active,
  'DR',
  'CDV',
  'descendante'
FROM regles_evaluation AS source
WHERE source.role_evaluateur = 'DR'
  AND source.role_evalue = 'CDS'
  AND source.type_evaluation = 'descendante'
  AND source.est_active = true
ON CONFLICT (role_evaluateur, role_evalue, type_evaluation) DO NOTHING;