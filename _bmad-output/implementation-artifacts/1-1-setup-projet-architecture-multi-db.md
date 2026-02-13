# Story 1.1: Setup Projet & Architecture Multi-DB

Status: ready-for-dev

## Story

En tant que développeur,
Je veux configurer l'architecture multi-bases de données du monorepo existant,
Afin que le système puisse gérer séparément les données core, business et analytics.

## Acceptance Criteria

**Given** le monorepo Laravel + Inertia + React existe
**When** je configure les connexions aux 3 bases de données
**Then** MySQL (sabc_core), PostgreSQL (sabc_business) et ClickHouse (sabc_analytics) sont opérationnels
**And** les Strangler proxies (EvaluationServiceProxy, AnalyticsServiceProxy) sont configurés avec feature flags
**And** les services Go (Evaluation, Analytics) sont accessibles via `/api/v2`
**And** la synchronisation MySQL → PostgreSQL (scheduled) et PostgreSQL → ClickHouse (daily) est configurée
**And** les tests de connexion (`php artisan db:test-connections`) passent avec succès

## Tasks / Subtasks

- [ ] Configuration Multi-Database Laravel (AC: 1, 2)
  - [ ] Configurer `config/database.php` avec 3 connexions (mysql, pgsql, clickhouse)
  - [ ] Ajouter variables `.env` pour chaque DB (host, port, database, username, password)
  - [ ] Créer les bases de données : `sabc_core`, `sabc_business`, `sabc_analytics`
  - [ ] Tester les connexions avec `php artisan db:test-connections`

- [ ] Configuration Services Go (AC: 3)
  - [ ] Vérifier structure `cmd/evaluation-service` et `cmd/analytics-service`
  - [ ] Configurer connexions PostgreSQL (evaluation) et ClickHouse (analytics)
  - [ ] Exposer endpoints `/api/v2/evaluations` et `/api/v2/analytics`
  - [ ] Ajouter health checks `/health` et métriques `/metrics`

- [ ] Strangler Proxies Laravel (AC: 2)
  - [ ] Créer `app/Services/EvaluationServiceProxy.php` avec feature flags
  - [ ] Créer `app/Services/AnalyticsServiceProxy.php` avec feature flags
  - [ ] Implémenter fallback vers Laravel si service Go indisponible
  - [ ] Ajouter JWT signing pour inter-service auth

- [ ] Synchronisation Données (AC: 4)
  - [ ] Créer `app/Services/DatabaseSyncService.php`
  - [ ] Scheduled Job MySQL → PostgreSQL (toutes les 15 minutes)
  - [ ] Scheduled Job PostgreSQL → ClickHouse (quotidien/hebdomadaire)
  - [ ] Logger les erreurs de sync dans `logs_administration`

- [ ] Tests & Validation (AC: 5)
  - [ ] Créer commande Artisan `db:test-connections`
  - [ ] Tester chaque connexion DB avec query simple
  - [ ] Vérifier accessibilité services Go via HTTP
  - [ ] Valider feature flags des proxies

## Dev Notes

### Architecture Multi-DB

**Stratégie de séparation :**
- **MySQL (sabc_core)** : Authentification, utilisateurs, rôles, permissions, logs admin
- **PostgreSQL (sabc_business)** : Évaluations, règles, périodes, notifications, hiérarchie
- **ClickHouse (sabc_analytics)** : Données historiques, métriques, agrégats

**Synchronisation :**
- MySQL → PostgreSQL : Scheduled (15 min) pour users/roles/regions
- PostgreSQL → ClickHouse : Batch quotidien/hebdomadaire pour analytics

### Strangler Pattern

**Principe :**
- Les proxies Laravel interceptent les requêtes
- Feature flags contrôlent le routing (Laravel vs Go service)
- Fallback automatique si service Go indisponible
- Migration progressive sans breaking changes

**Configuration feature flags :**
```php
// config/services.php
'evaluation_service' => [
    'enabled' => env('EVALUATION_SERVICE_ENABLED', false),
    'url' => env('EVALUATION_SERVICE_URL', 'http://localhost:8081'),
],
'analytics_service' => [
    'enabled' => env('ANALYTICS_SERVICE_ENABLED', false),
    'url' => env('ANALYTICS_SERVICE_URL', 'http://localhost:8082'),
],
```

### Services Go

**Structure attendue :**
```
cmd/
  evaluation-service/
    main.go
  analytics-service/
    main.go
internal/
  evaluation/
    handler/
    service/
    repository/
  analytics/
    handler/
    service/
    repository/
```

**Endpoints requis :**
- Evaluation Service : `POST /api/v2/evaluations`, `GET /api/v2/evaluations/{id}`
- Analytics Service : `GET /api/v2/analytics/kpis`, `GET /api/v2/analytics/trends`
- Health : `GET /health` (tous les services)
- Metrics : `GET /metrics` (Prometheus format)

### Inter-Service Authentication

**JWT Signing :**
- Générer secret partagé dans `.env` : `INTER_SERVICE_SECRET`
- Laravel signe les requêtes vers Go avec JWT
- Services Go valident le JWT avant traitement
- Header : `Authorization: Bearer {jwt_token}`
- Payload : `{"service": "laravel-app", "request_id": "uuid"}`

### Configuration Base de Données

**MySQL (sabc_core) :**
```env
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=sabc_core
DB_USERNAME=sabc_user
DB_PASSWORD=secret
```

**PostgreSQL (sabc_business) :**
```env
DB_PGSQL_HOST=127.0.0.1
DB_PGSQL_PORT=5432
DB_PGSQL_DATABASE=sabc_business
DB_PGSQL_USERNAME=sabc_user
DB_PGSQL_PASSWORD=secret
```

**ClickHouse (sabc_analytics) :**
```env
CLICKHOUSE_HOST=127.0.0.1
CLICKHOUSE_PORT=9000
CLICKHOUSE_DATABASE=sabc_analytics
CLICKHOUSE_USERNAME=admin
CLICKHOUSE_PASSWORD=secret
```

### Commande Test Connexions

**Implémentation `php artisan db:test-connections` :**
```php
// app/Console/Commands/TestDatabaseConnections.php
public function handle()
{
    $connections = ['mysql', 'pgsql', 'clickhouse'];
    foreach ($connections as $connection) {
        try {
            DB::connection($connection)->getPdo();
            $this->info("✅ {$connection} : Connexion réussie");
        } catch (\Exception $e) {
            $this->error("❌ {$connection} : {$e->getMessage()}");
        }
    }
}
```

### Project Structure Notes

**Fichiers à créer/modifier :**
- `config/database.php` : Ajouter connexions pgsql et clickhouse
- `.env.example` : Ajouter toutes les variables DB
- `app/Services/EvaluationServiceProxy.php` : Nouveau
- `app/Services/AnalyticsServiceProxy.php` : Nouveau
- `app/Services/DatabaseSyncService.php` : Nouveau
- `app/Console/Commands/TestDatabaseConnections.php` : Nouveau
- `app/Console/Kernel.php` : Ajouter scheduled jobs sync

**Respect des règles SABC :**
- Utiliser pnpm (pas npm/yarn) pour le frontend
- TypeScript strict mode activé
- API JSON en `snake_case`, UI en `camelCase`
- Inertia pages uniquement dans `resources/js/Pages`

### References

- [Source: architecture.md#Starter Template Evaluation] - Monorepo existant Laravel + Inertia/React
- [Source: architecture.md#Core Architectural Decisions] - Multi-DB strategy (MySQL, PostgreSQL, ClickHouse)
- [Source: architecture.md#API & Service Patterns] - Strangler pattern avec feature flags
- [Source: project-context.md#Technology Stack] - Versions PHP 8.2, Laravel 12, Go 1.23.12
- [Source: project-context.md#Critical Implementation Rules] - pnpm, TypeScript strict, API snake_case
- [Source: epics.md#Epic 1 Story 1.1] - Acceptance criteria complets

## Dev Agent Record

### Agent Model Used

_À remplir par le dev agent_

### Debug Log References

_À remplir par le dev agent_

### Completion Notes List

_À remplir par le dev agent_

### File List

_À remplir par le dev agent_
