# API Contracts — Evaluation Service

## Overview

Evaluation microservice exposing evaluation lifecycle, periods, and scores. Uses Gin and REST endpoints under `/api/v2`.

## Endpoints

| Method | Path | Auth | Description |
| --- | --- | --- | --- |
| GET | `/health` | None | Service health check |

### Evaluations

| Method | Path | Description |
| --- | --- | --- |
| GET | `/api/v2/evaluations` | List evaluations |
| POST | `/api/v2/evaluations` | Create evaluation |
| GET | `/api/v2/evaluations/pending` | Pending evaluations for user |
| GET | `/api/v2/evaluations/to-validate` | Evaluations to validate |
| GET | `/api/v2/evaluations/:id` | Get evaluation by ID |
| PUT | `/api/v2/evaluations/:id` | Update notes |
| POST | `/api/v2/evaluations/:id/submit` | Submit evaluation |
| POST | `/api/v2/evaluations/:id/validate` | Validate evaluation |

### Periods

| Method | Path | Description |
| --- | --- | --- |
| GET | `/api/v2/periodes` | List evaluation periods |
| GET | `/api/v2/periodes/:id` | Get period by ID |

### Scores

| Method | Path | Description |
| --- | --- | --- |
| GET | `/api/v2/scores/:matricule` | Get user score |

## Request/Response Notes

- Create Evaluation body includes: `evalue_matricule`, `id_periode`, `id_regle` (UUIDs).
- Error responses follow `{ success: false, error: { code, message } }`.

## OpenAPI & Proto

- OpenAPI: `services/evaluation/api/openapi/openapi.yaml`
- Proto: `services/evaluation/api/proto/evaluation.proto`

