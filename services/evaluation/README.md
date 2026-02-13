# SABC Evaluation Microservice

Service Go dédié à la gestion des évaluations 360° pour SABC Eval360.

## Architecture

```
services/evaluation/
├── api/
│   ├── openapi/          # Spécification OpenAPI 3.1
│   └── proto/            # Définitions Protocol Buffers (gRPC)
├── cmd/
│   └── server/           # Point d'entrée de l'application
├── config/               # Configuration
├── internal/
│   ├── domain/           # Entités métier et logique
│   ├── handler/          # Handlers HTTP/gRPC
│   ├── middleware/       # Auth, logging, etc.
│   ├── repository/       # Accès aux données
│   └── service/          # Logique métier
├── migrations/           # Scripts SQL
├── Dockerfile
└── go.mod
```

## Prérequis

- Go 1.23+
- PostgreSQL 16+
- Redis 7+
- Docker & Docker Compose

## Démarrage rapide

### Avec Docker Compose (recommandé)

```bash
# Depuis la racine du projet
make up

# Le service est accessible sur:
# - HTTP: http://localhost:8081
# - gRPC: localhost:50051
```

### Développement local

```bash
cd services/evaluation

# Télécharger les dépendances
go mod download

# Lancer le service
go run ./cmd/server

# Ou avec hot-reload (air)
air
```

## Configuration

Variables d'environnement:

| Variable | Description | Default |
|----------|-------------|---------|
| `EVAL_SERVER_HTTP_PORT` | Port HTTP | 8080 |
| `EVAL_SERVER_GRPC_PORT` | Port gRPC | 50051 |
| `EVAL_DATABASE_HOST` | Host PostgreSQL | postgres |
| `EVAL_DATABASE_PORT` | Port PostgreSQL | 5432 |
| `EVAL_DATABASE_DATABASE` | Nom de la base | sabc_business |
| `EVAL_REDIS_HOST` | Host Redis | redis |
| `EVAL_AUTH_JWT_SECRET` | Secret JWT | - |
| `EVAL_TRACING_ENABLED` | Activer Jaeger | true |

## API Endpoints

### REST API (v2)

```
GET    /health                        # Health check
GET    /api/v2/evaluations            # Liste des évaluations
POST   /api/v2/evaluations            # Créer une évaluation
GET    /api/v2/evaluations/:id        # Détails d'une évaluation
PUT    /api/v2/evaluations/:id        # Mettre à jour les notes
POST   /api/v2/evaluations/:id/submit # Soumettre pour validation
POST   /api/v2/evaluations/:id/validate # Valider/rejeter

GET    /api/v2/periodes               # Périodes d'évaluation
GET    /api/v2/scores/:matricule      # Scores utilisateur
```

### gRPC

Voir `api/proto/evaluation.proto` pour la définition complète.

## Strangler Pattern

Ce service implémente le pattern Strangler pour une migration progressive:

1. **Phase 1**: Service déployé en parallèle du monolithe
2. **Phase 2**: Traefik route `/api/v2/*` vers le microservice
3. **Phase 3**: Laravel utilise `EvaluationServiceProxy` avec feature flags
4. **Phase 4**: Migration complète, suppression du code legacy

### Feature Flags Laravel

```env
EVALUATION_MICROSERVICE_ENABLED=true
EVAL_FEATURE_CREATE=true
EVAL_FEATURE_GET=true
EVAL_FEATURE_SUBMIT=true
...
```

## Tests

```bash
# Tests unitaires
go test ./...

# Tests avec couverture
go test -cover ./...

# Tests d'intégration
go test -tags=integration ./...
```

## Monitoring

- **Métriques**: `/metrics` (Prometheus)
- **Health**: `/health`
- **Traces**: Jaeger UI http://localhost:16686

## Calcul des Scores

Formule SABC:
```
Score Global = (Auto × 20%) + (Pairs × 40%) + (Manager × 40%)
```

## Workflow d'évaluation

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│  Brouillon  │────▶│   Soumis    │────▶│   Validé    │     │   Rejeté    │
│   (draft)   │     │ (submitted) │     │ (validated) │     │ (rejected)  │
└─────────────┘     └──────┬──────┘     └─────────────┘     └──────┬──────┘
                           │                                       │
                           └───────────────────────────────────────┘
                                    Retour en brouillon
```

## Licence

Propriétaire - SABC Cameroun
