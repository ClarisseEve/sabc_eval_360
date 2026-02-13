# Suivi Claude – SABC Eval360

## Changements réalisés
- Alignement des routes Inertia et sécurisation des pages admin (utilisateurs) avec des méthodes `store/edit/update` + normalisation des routes utilisées côté front.
- Suppression du routing React Router (archivé) et des doublons de dashboards (archivés).
- Correction de la résolution Inertia pour `Common/*` et suppression de la page `auth-debug`.
- Ajout des pages `/register` et `/forgot-password` (inscription désactivée + support IT).
- Mise à jour des docs (versions réelles, licence propriétaire, auth, multi‑DB, analytics) et du config DB (suppression `mysql_core`).
- Ajout de tests Pest (pages auth + service SecureLoggingService).
- Déclaration des dépendances Python de base pour le pipeline.
- Normalisation du casing (Hooks, Layouts, Pages/Auth/Errors/Settings) + mise à jour des imports et des `Inertia::render`.
- Resolver Inertia et imports front alignés sur `resources/js/pages` (racine en minuscule, sous‑dossiers PascalCase).
- Nettoyage du doublon `useTheme.tsx` (conserver `useTheme.ts`) et correction d’import dans `resources/js/app.tsx`.
- Centralisation des compétences d’évaluation via `resources/js/Components/Forms/evaluationSkillsConfig.ts` + composant paramétré `RoleEvaluationForm` utilisé dans les pages d’évaluation.
- Archivage des anciens `*EvaluationForm.tsx` (remplacés par `RoleEvaluationForm`) et ajout d’index manquants dans `resources/js/Components/UI`.
- Harmonisation UI: dossier `RadioGroup` + import corrigé dans `resources/js/Components/appearance-tabs.tsx`.
- Dashboard DR refactorisé pour utiliser `resources/js/Components/Dashboard/DirectorDashboard.tsx`.
- Nettoyage des services vides (front/back) déplacés en archives + `docker/python/requirements.txt` aligné sur le pipeline.
- Tests corrigés: composants Inertia en `Auth/*`, redirection racine vers login, et guard `app()->environment` dans `SecureLoggingService`.
- `.DS_Store` ignoré globalement dans `.gitignore` (macOS).
- Phase 3: création du microservice Analytics (Go) avec endpoint `/api/v2/analytics`, mapping dataset Analytics et queries ClickHouse.
- Proxy Laravel `AnalyticsServiceProxy` + injection du `dataset` dans `/admin/analytics` (fallback sur mock si service off).
- Docker Compose: service `analytics-service` + job `clickhouse-init`, variables analytics côté `core-app`.
- ClickHouse SQL: ajout des tables `scores_utilisateurs`, `logs_anomalies`, `recommandations` + `CREATE DATABASE IF NOT EXISTS`.
- Prometheus: activation des scrapes `evaluation-service` et `analytics-service`.
- Observability: metrics Laravel enrichies (histogrammes HTTP/DB), corrections des alertes Prometheus, scrape ClickHouse sur 9363, ajout redis_exporter, plugin Grafana ClickHouse.
- Tracing Jaeger end-to-end: middleware Laravel + propagation headers vers services Go + init tracer côté Go.
- go.sum générés (Go 1.23) pour `services/evaluation` et `services/analytics`; `composer.lock` mis à jour pour Jaeger (version `jonahgeorge/jaeger-client-php` fixée à `^1.5.2`).
- Phase 5: alignement schéma evaluation (microservice) sur `notations_json`/`note_globale`, compatibilité JSON notes (legacy array ↔ struct), suppression hard delete côté repo.

## Archives
- `archives/resources/js/routes.tsx`
- `archives/resources/js/Pages/*/routes.tsx`
- `archives/resources/js/Pages/Dashboard/*`
- `archives/resources/js/Pages/dashboard.tsx`
- `archives/resources/js/Pages/Common/auth-debug.tsx`
- `archives/database/migrations/clickhouse/*`
- `archives/resources/js/Components/Forms/*EvaluationForm.tsx`
- `archives/resources/js/Services/*`
- `archives/app/Services/*`

## Découvertes (app/ + resources/)
- Layouts existants : `resources/js/Components/Layout/app/AppLayout.tsx` + réexport dans `resources/js/Layouts/index.ts` (éviter de recréer des layouts).
- Layouts auth disponibles dans `resources/js/Components/Layout/auth/*`.
- Dashboards : base déjà en place avec `resources/js/Components/Dashboard/DashboardLayout.tsx` + dashboards spécialisés (Director/Manager/Operational/etc.).
- Formulaires d’évaluation : hook `resources/js/Hooks/useEvaluationForms.ts` + services API `resources/js/Services/{api}/evaluationForms.ts`.
- Couche services front : `resources/js/Services/{api}/*` utilisée, fichiers `resources/js/Services/auth.ts`, `cache.ts`, `utils.ts` vides.
- Couche services backend : `app/Services/*` contient des services actifs (Evaluation/Hierarchy/Replacement/...) et des placeholders vides (Analytics/Notification/Report/RulesEngine).
- UI kit riche sous `resources/js/Components/UI/*` ; dossier `radio-group` encore en kebab‑case.
- Duplication détectée : deux pages `RoleSpecificEvaluation` quasi identiques (`resources/js/Pages/Common/Evaluations` et `resources/js/Pages/Evaluation`).
- `docker/traefik/traefik.yml` est référencé par `docker-compose.yml` mais le fichier n'existe pas encore.

## Migration microservices (axes & étapes)
- Axes: découpage domaine (Auth/Identité, Utilisateurs/Structure, Evaluations/Regles, Analytics/Reporting, Notifications/Exports).
- Axes: données par service (MySQL core, ClickHouse analytics) + contrats API versionnés.
- Axes: communication (REST/gRPC + events) et gateway (Kong/Traefik/Nginx) + auth service-to-service.
- Axes: observabilité (logs, traces, métriques) + CI/CD par service.
- Étapes: cartographier routes/services + usages front (`routes/*`, `app/Services/*`, `resources/js/Services/{api}`).
- Étapes: extraire Analytics en premier (service dédié + ClickHouse Docker, ingestion asynchrone).
- Étapes: introduire gateway/BFF, brancher le front sur l’API gateway.
- Étapes: extraire Notifications/Reporting, puis Evaluations/Regles, en mode strangler.

## Prochaines actions recommandées
1. Mettre à jour `pnpm-lock.yaml` après retrait de `react-router-dom`.
2. Compléter les formulaires utilisateurs (Create/Edit) pour poster vers `admin.utilisateurs.store/update`.
3. Valider si les anciens `*EvaluationForm.tsx` archivés doivent être supprimés définitivement ou conservés.
4. Implémenter les endpoints Analytics côté API et brancher le front.
5. Vérifier la cohérence des routes “team” dans la navigation (actuellement non exposées en backend).
6. Lancer les tests:
   - `php artisan test`
7. Générer `go.sum` pour `services/analytics` (run `go mod tidy`) quand Go est disponible.
