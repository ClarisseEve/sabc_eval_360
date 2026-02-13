# Data Models — App (Laravel, Multi-DB)

## Overview

The main application uses a multi-database architecture:

- **MySQL (sabc_core)**: core identity, regions, roles, audit
- **PostgreSQL (sabc_business)**: evaluations, periods, rules, notifications
- **ClickHouse (sabc_analytics)**: analytics tables (via SQL scripts)

See `MULTI_DATABASE_SETUP.md` for operational details.

## MySQL — Core Tables (sabc_core)

### `utilisateurs`
- Key fields: `matricule`, `email`, `id_branche`, `id_region`, `manager_matricule`, `est_actif`, `est_admin`, `niveau_hierarchique`
- Availability flags: `est_indisponible`, `date_debut_indisponibilite`, `date_fin_indisponibilite`, `motif_indisponibilite`

### `regions`
- `id_region`, `nom_region`, `est_taniere`, timestamps

### `branches`
- `id_branche`, `nom_branche`, `description`

### `roles`
- `id_role`, `nom_role`, `id_branche`, `niveau_taniere`, `niveau_non_taniere`
- Permissions: `peut_auto_evaluer`, `peut_evaluer_pairs`, `peut_evaluer_subordonnes`, `peut_cross_branch`, `peut_remplacer_roles`

### `type_evaluations`
- `id_type_evaluation`, `nom_type`, `description`

### `logs_administration`
- `id_log`, `action`, `entite`, `id_entite`, `matricule_utilisateur`, `adresse_ip`, `user_agent`, `details_json`

### `notifications_utilisateurs`
- `id_notification`, `destinataire_matricule`, `expediteur_matricule`, `message`, `titre`, `type`, `donnees_json`, `est_lue`, `date_creation`, `date_lecture`

### Laravel Infra
- `sessions`, `cache`, `cache_locks`, `failed_jobs`, `personal_access_tokens`

## PostgreSQL — Business Tables (sabc_business)

### `evaluations`
- `id_evaluation`, `evaluateur_matricule`, `evalue_matricule`, `id_periode`, `id_regle`
- `statut` (brouillon/soumis/valide/rejete), `notations_json`, `note_globale`, `commentaire_general`
- `sync_status`, `sync_date`

### `regles_evaluation`
- `id_regle`, `nom_regle`, `description`, `criteres_evaluation_json`, `parametres_json`, `est_active`, `date_debut`, `date_fin`

### `periodes_evaluation`
- `id_periode`, `titre`, `description`, `date_debut`, `date_fin`, `statut`, `id_regle`, `parametres_json`

### `scores_utilisateurs`
- `matricule`, `id_periode`, `score_auto`, `score_pairs`, `score_manager`, `score_global`
- `nb_evaluations_donnees`, `nb_evaluations_recues`, `progression_vs_precedente`, `position_equipe`

### `evaluation_permissions`
- `id_permission`, `role_evaluateur`, `role_evalue`, `type_evaluation`, `est_autorise`, `conditions_json`

### `notifications`
- `id_notification`, `destinataire_matricule`, `message`, `titre`, `type_notification`, `priorite`, `statut`, `date_lecture`

### `remplacements_temporaires`
- `id_remplacement`, `utilisateur_remplace_matricule`, `utilisateur_remplacant_matricule`
- `date_debut`, `date_fin`, `statut`, `permissions_temporaires_json`, `approuve_par_matricule`

### Business Templates
- `business_templates`, `business_template_items`, `business_template_evaluator_roles`
- `business_competencies`

### Analytics and Recommendations (Business)
- `logs_anomalies`, `recommandations`

### Reference
- `utilisateurs_ref` (denormalized user snapshot by region/role)

## ClickHouse — Analytics (sabc_analytics)

- Managed via SQL scripts (see `database/clickhouse/create_analytics_tables.sql`)
- Examples (per `MULTI_DATABASE_SETUP.md`): `evaluations_analytics`, `performance_region`, `performance_branche`, `scores_analytics`

