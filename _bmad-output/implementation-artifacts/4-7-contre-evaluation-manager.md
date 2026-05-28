# Story 4.7: Contre-Évaluation Manager

Status: done

## Story

En tant que manager,
Je veux déclencher une contre-évaluation sur une évaluation validée suspecte,
Afin de corriger des anomalies et maintenir l'intégrité du processus 360°.

## Acceptance Criteria

**Given** je suis manager et j'ai validé une évaluation
**When** je déclenche une contre-évaluation
**Then** une nouvelle évaluation est créée avec `type_evaluation = 'descendante'`, `statut = 'brouillon'`
**And** la nouvelle évaluation est liée à l'originale via `evaluation_parent_id`
**And** je suis l'évaluateur de la contre-évaluation, l'évalué est le même
**And** une seule contre-évaluation par évaluation originale est autorisée
**And** seul le manager validateur ou le manager direct peut déclencher la contre-évaluation
**And** le workflow brouillon → soumis → validé s'applique normalement

## Tasks / Subtasks

- [x] Migration PostgreSQL (AC: 1, 2)
  - [x] Ajouter colonne `evaluation_parent_id UUID NULL` dans table `evaluations`
  - [x] Index sur `evaluation_parent_id`
  - [x] Contrainte FK auto-référente

- [x] Service ContreEvaluationService (AC: 1, 2, 3, 4, 5)
  - [x] Méthode `canCreateContreEvaluation()` — vérifie permissions et unicité
  - [x] Méthode `createContreEvaluation()` — crée la contre-évaluation liée
  - [x] Méthode `getContreEvaluations()` — liste les contre-évaluations d'une évaluation

- [x] Controller ContreEvaluationController (AC: 1, 2)
  - [x] `POST /evaluations/:id/contre-evaluation`
  - [x] `GET /evaluations/:id/contre-evaluations`

- [x] Tests unitaires (12+ cas)

## Dev Notes

### Règles Métier
- Seule une évaluation avec `statut = 'valide'` peut être contre-évaluée
- Le déclencheur doit être `validateur_matricule` de l'évaluation ou le `manager_matricule` de l'évalué
- Une seule contre-évaluation par évaluation originale (contrainte applicative)
- La contre-évaluation suit le même workflow (brouillon → soumis → valide)
- Déclenchement automatique via anomalies (Epic 7) : DIFFÉRÉ

### Dépendance Epic 7
Le déclenchement automatique basé sur la détection d'anomalies (Story 7.4) est différé.
Seul le déclenchement manuel par le manager est implémenté dans cette story.

## Dev Agent Record

### Agent Model Used
claude-sonnet-4-6

### Completion Notes
- Service, Controller et Spec créés
- Migration SQL créée: `20260528_002_add_evaluation_parent_motif_rejet.sql`
