# Data Models — Evaluation Service

## Storage

- PostgreSQL (service-local)
- Main migration: `services/evaluation/migrations/001_create_evaluations_table.sql`

## Table: `evaluations`

Key fields:

- `id_evaluation` (UUID, PK)
- `evaluateur_matricule`, `evalue_matricule`
- `id_periode`, `id_regle`
- `date_evaluation`, `date_soumission`, `date_validation`
- `statut` (brouillon/soumis/valide/rejete)
- `notations_json` (JSONB), `commentaire_general`, `commentaire_validation`
- `validateur_matricule`, `note_globale`
- `type_evaluation` (auto/descendante/pairs/ascendante/autre/360)
- `sync_status`, `sync_date`

Indexes:

- `idx_evaluations_evaluateur_date`
- `idx_evaluations_evalue_date`
- `idx_evaluations_statut_date`
- `idx_evaluations_periode`
- `idx_evaluations_sync_status` (partial)
- GIN on `notations_json`

