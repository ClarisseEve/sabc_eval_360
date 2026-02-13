# Safe Gap Remediation Plan - API/Back-end

Generated: 2026-02-13
Scope: planning + implementation artifacts + codebase actuel (Laravel monolith + proxies + services)

## 1) Verdict direct

Le planning PRD est bien oriente brownfield (ameliorer l'existant), mais l'execution via les stories/sprint-status n'est pas synchronisee avec le code reel.

Conclusion: si on lance le backlog "tel quel", il y a un risque reel de re-creer des briques deja en place.

## 2) Preuves cles

### Intentions planning (correctes)

- Brownfield explicite dans `_bmad-output/planning-artifacts/prd.md:76`.
- "Reutilisation maximale de l'existant" dans `_bmad-output/planning-artifacts/prd.md:259`.
- "Aucune re-initialisation; conserver le monorepo existant" dans `_bmad-output/planning-artifacts/epics.md:136`.
- Readiness annonce "Coverage percentage: 100%" dans `_bmad-output/planning-artifacts/implementation-readiness-report-2026-01-29.md:260`.

### Derive execution (risque de re-creation)

- `sprint-status.yaml` utilise une nomenclature differente des fichiers stories (ex: `1-1-authentification-session-utilisateur`) dans `_bmad-output/implementation-artifacts/sprint-status.yaml:51`, alors que le fichier reel est `_bmad-output/implementation-artifacts/1-1-setup-projet-architecture-multi-db.md`.
- Story `1-2` pousse Passport (`_bmad-output/implementation-artifacts/1-2-authentification-session-utilisateur.md:24`), alors que le code tourne deja en Sanctum (`composer.json:19`, `routes/api.php:23`).
- Story `4-1` demande encore de creer la table evaluations (`_bmad-output/implementation-artifacts/4-1-creation-evaluation-utilisateur-eligible.md:25`), alors que la migration existe deja (`database/migrations/2025_07_31_100001_create_business_evaluations_table.php:16`).

### Etat code backend actuel (existant important)

- Evaluations/rules/periodes deja en place:
  - `app/Models/Evaluation.php:9`
  - `app/Models/RegleEvaluation.php:9`
  - `app/Models/PeriodeEvaluation.php:9`
  - `app/Http/Controllers/EvaluationController.php:20`
  - `routes/web.php:85`
- Admin regles/templates/assignations deja en place:
  - `app/Http/Controllers/Admin/ReglesEvaluationController.php:13`
  - `app/Http/Controllers/Admin/TemplatesEvaluationController.php:17`
  - `app/Http/Controllers/Admin/TemplateAssignationsController.php:18`
  - `database/migrations/2026_01_16_000001_create_templates_roles_periodes_table.php:13`
- Automatisation periodes/rappels deja en place:
  - `app/Console/Kernel.php:16`
  - `app/Console/Kernel.php:28`
  - `app/Console/Kernel.php:40`
  - `app/Console/Commands/OuvrirPeriodesAutomatiquement.php:17`
  - `app/Console/Commands/FermerPeriodesAutomatiquement.php:17`
  - `app/Console/Commands/EnvoyerRappelsEvaluations.php:19`
- Strangler + observabilite deja en place:
  - `app/Services/EvaluationServiceProxy.php:24`
  - `app/Services/AnalyticsServiceProxy.php:26`
  - `app/Services/DatabaseSyncService.php:9`
  - `app/Http/Controllers/MetricsController.php:19`
  - `app/Http/Middleware/TraceRequests.php:16`
  - `app/Http/Middleware/TrackMetrics.php:15`
- API contracts/OpenAPI deja presents:
  - `docs/api-contracts-evaluation.md:46`
  - `services/evaluation/api/openapi/openapi.yaml`

## 3) Matrice story-by-story (backend-safe)

Legend:
- `deja-fait`: present en code (pas de recreation)
- `partiel-a-corriger`: existe mais incomplet/derive/non aligne PRD
- `a-creer`: manque reel

### Epic 0

- `0-1-initialisation-du-monorepo-et-environnement` -> `partiel-a-corriger` -> fichier story encore template non resolu (`_bmad-output/implementation-artifacts/0-1-initialisation-du-monorepo-et-environnement.md:1`); garder l'existant, remplacer par checklist de verification.

### Epic 1

- `1-1-setup-projet-architecture-multi-db` -> `deja-fait` -> connexions/migrations/proxies/sync existent; faire uniquement hardening et tests.
- `1-2-authentification-session-utilisateur` -> `partiel-a-corriger` -> ne pas basculer vers Passport; garder Sanctum et fermer les trous session/API.
- `1-3-gestion-roles-permissions-rbac` -> `partiel-a-corriger` -> base RBAC presente; consolider permissions + tests d'autorisation.
- `1-4-structure-organisationnelle-regions-branches` -> `deja-fait` -> controllers/models/routes admin existants; focus coherence data.
- `1-5-gestion-hierarchique-utilisateurs` -> `partiel-a-corriger` -> service hierarchie existe; aligner conventions id + exposition API si necessaire.
- `1-6-profil-utilisateur-champs-restreints` -> `partiel-a-corriger` -> socle present; verrouiller champs editables et policies.
- `1-7-composants-dashboard-reutilisables-dashboards-role` -> `partiel-a-corriger` -> composants nombreux deja presents; converger sur data contract unique.

### Epic 2

- `2-1-creation-regles-evaluation-criteres` -> `deja-fait` -> model/controller/migration et status story deja `completed`.
- `2-2-configuration-eligibilites-evaluation` -> `partiel-a-corriger` -> model `EvaluationPermission` existe; consolider matrice role->role et coverage tests.
- `2-3-gestion-exceptions-roles-dr-cdtt` -> `partiel-a-corriger` -> regles DR/CDTT deja implementees a plusieurs endroits; factoriser.
- `2-4-moteur-validation-permissions-evaluation` -> `partiel-a-corriger` -> middleware + service existent; standardiser la source de verite.

### Epic 3

- `3-1-creation-templates-evaluation` -> `partiel-a-corriger` -> socle templates present; completer validations et parcours admin de bout en bout.
- `3-2-assignation-templates-role-periode` -> `partiel-a-corriger` -> table/service/controller presents; renforcer contraintes metier et tests.
- `3-3-creation-gestion-periodes-evaluation` -> `partiel-a-corriger` -> controller/service/model presents; finir edge cases (stats, chevauchements, UX admin).
- `3-4-ouverture-fermeture-automatique-periodes` -> `deja-fait` -> commandes + scheduler actifs; garder et monitorer.

### Epic 4

- `4-1-creation-evaluation-utilisateur-eligible` -> `partiel-a-corriger` -> flux deja existant, supprimer taches "create table/model/controller" et passer en hardening.
- `4-2-notation-commentaires-criteres` -> `partiel-a-corriger` -> logique presente; verifier regles de notes/comments par role.
- `4-3-validation-soumission-evaluation` -> `partiel-a-corriger` -> transitions presentes; durcir idempotence et verrous de statut.
- `4-4-validation-rejet-evaluation-manager` -> `partiel-a-corriger` -> present; verrouiller authorization + notifications associees.
- `4-5-consultation-evaluations-recues` -> `partiel-a-corriger` -> present; harmoniser filtres/perf et pagination.
- `4-6-consultation-evaluations-donnees` -> `partiel-a-corriger` -> present; harmoniser filtres/perf et pagination.

### Epic 5

- `5-1-notification-ouverture-periode` -> `partiel-a-corriger` -> ouverture auto existe, notification d'ouverture globale a formaliser.
- `5-2-rappels-automatiques-evaluations-retard` -> `deja-fait` -> commande + scheduler + notifications presentes.
- `5-3-notifications-validation-attente-managers` -> `partiel-a-corriger` -> notifications de workflow existent, standardiser templates et declencheurs.
- `5-4-processus-escalade-automatique` -> `a-creer` -> champs/modeles existent partiellement, moteur d'escalade temporelle absent.

### Epic 6 (mix front/back)

- `6-1-dashboard-manager-progression-equipe` -> `partiel-a-corriger` -> endpoints/donnees existent partiellement; stabiliser KPI backend.
- `6-2-dashboard-manager-validations-attente` -> `partiel-a-corriger` -> idem; consolider requetes et contrats.
- `6-3-dashboard-collaborateur-statut-evaluation` -> `partiel-a-corriger` -> idem; verifier coherence des statuts exposes.

### Epic 7

- `7-1-kpis-globaux-region-branche-role` -> `partiel-a-corriger` -> socle analytics/proxy present; fiabiliser sources et perimetres.
- `7-2-detection-signalement-anomalies` -> `partiel-a-corriger` -> base presente, necessite finalisation moteur/regles.
- `7-3-recommandations-actions-formation-mentorat-mobilite` -> `partiel-a-corriger` -> structure presente, recommandations encore a industrialiser.

### Epic 8

- `8-1-report-builder-sections-templatisees` -> `a-creer` -> manque un vrai moteur backend "report builder" versionne.
- `8-2-export-rapports-ppt-excel-graphes` -> `a-creer` -> manque service backend d'export industrialise (historique + files + retries).
- `8-3-logs-audit-tracabilite` -> `deja-fait` -> modele/migration/logs admin deja presents.
- `8-4-corrections-affectations-utilisateurs-support` -> `partiel-a-corriger` -> base admin existe, formaliser workflow support et audit associe.

### Items presents seulement dans sprint-status (Epic 9)

- `9-1-logs-daudit-et-tracabilite` -> `deja-fait` -> doublon fonctionnel avec `8-3`.
- `9-2-corrections-affectations-utilisateurs-support` -> `partiel-a-corriger` -> proche de `8-4`.
- `9-3-observabilite-monitoring-plateforme` -> `partiel-a-corriger` -> metrics/tracing presents, manque SLO/alerting runbook.
- `9-4-standardisation-api-contrats-openapi` -> `partiel-a-corriger` -> OpenAPI present cote evaluation; standardiser pour tout le scope expose.
- `9-5-proxies-fallback-services-strangler` -> `partiel-a-corriger` -> proxies presents; consolider governance flags + tests de fallback.
- `9-6-pipelines-de-sync-multi-db` -> `partiel-a-corriger` -> sync service/commandes existent; industrialiser scheduling/monitoring/reprise.

## 4) Guardrails anti-recreation (a appliquer avant toute story)

1. Interdiction de creer une table/model/controller si l'artefact existe deja.
2. Toute story "create-from-scratch" doit etre reecrite en "gap/hardening" avant dev.
3. Priorite aux tests de non-regression (auth, permissions, transitions statuts, notifications, sync).
4. Mise a jour du `sprint-status.yaml` apres reconciliation des IDs stories, sinon suivi trompeur.

## 5) Ordre d'execution recommande (backend)

1. Reconciliation meta-planning (IDs stories + suppression taches de recreation).
2. Stabilisation socle auth/RBAC/hierarchie (Epic 1 + Epic 2).
3. Durcissement flux evaluation (Epic 3 + Epic 4).
4. Notifications/escalades (Epic 5, en creant seulement le moteur manquant).
5. Observabilite/proxies/sync/contracts (Epic 9).
6. Reporting/exports nouveaux (Epic 8.1/8.2).

## 6) Decision pratique

Oui, le PRD/planning exprime bien une logique d'amelioration de l'existant.
Non, l'etat courant des stories/sprint-status ne garantit pas cette logique sans reconciliation prealable.

Ce plan doit etre la source de verite d'execution pour eviter toute recreation dangereuse.
