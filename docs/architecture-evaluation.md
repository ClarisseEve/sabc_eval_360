# Architecture — Evaluation Domain

## Overview

Le domaine `evaluation` est implémenté dans `apps/api/src/evaluations`.

## Responsabilités

- création d’évaluations
- mise à jour des notations
- soumission
- validation
- historique
- éligibilité

## Surface API active

- `GET /api/evaluations`
- `POST /api/evaluations`
- `GET /api/evaluations/:id`
- `PUT /api/evaluations/:id`
- `POST /api/evaluations/:id/submit`
- `POST /api/evaluations/:id/validate`
- `GET /api/evaluations/periodes-actives`
- `GET /api/evaluations/eligibles`
- `GET /api/evaluations/historique`

## Stockage

- PostgreSQL pour les données métier
- MySQL pour l’identité et la hiérarchie
- les jointures inter-bases sont gérées côté application

## Sécurité

- JWT stateless
- validation DTO
- guards NestJS
- filtre d’exception global
