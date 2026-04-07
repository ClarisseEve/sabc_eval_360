# API Contracts — Active API

## Overview

L’application active consomme exclusivement l’API NestJS sous le préfixe `/api`.

## Auth

- `POST /api/auth/login`
- `GET /api/auth/me`
- `POST /api/auth/logout`
- `PUT /api/auth/profile`
- `PUT /api/auth/password`

## Dashboard

- `GET /api/dashboard`
- `GET /api/dashboard/stats`
- `GET /api/dashboard/admin`

## Evaluations

- `GET /api/evaluations`
- `POST /api/evaluations`
- `GET /api/evaluations/:id`
- `PUT /api/evaluations/:id`
- `POST /api/evaluations/:id/submit`
- `POST /api/evaluations/:id/validate`
- `GET /api/evaluations/periodes-actives`
- `GET /api/evaluations/eligibles`
- `GET /api/evaluations/historique`

## Analytics

- `GET /api/analytics/dashboard`
- `GET /api/analytics/evaluations`
- `GET /api/analytics/performances`
- `GET /api/analytics/region/:idRegion`
- `GET /api/analytics/region/:idRegion/classement`
- `GET /api/analytics/anomalies`

## Admin

- `GET|POST|PUT|DELETE /api/admin/roles`
- `GET|POST|PUT|PATCH /api/admin/roles/regles/evaluation`
- `GET|POST|PUT|DELETE /api/admin/structure/regions`
- `GET|POST|PUT|DELETE /api/admin/structure/services`
- `GET|POST|PUT|DELETE /api/admin/structure/districts`
- `GET|POST|PUT|DELETE /api/admin/structure/secteurs`
- `GET|POST|PUT|DELETE /api/admin/utilisateurs`

## Remplacements

- `GET /api/remplacements/actifs`
- `GET /api/remplacements/a-venir`
- `GET /api/remplacements/historique`
- `GET /api/remplacements/par-utilisateur`
- `GET /api/remplacements/:id`
- `POST /api/remplacements`
- `PUT /api/remplacements/:id`
- `POST /api/remplacements/:id/terminer`

## Notifications

- `GET /api/notifications`
- `GET /api/notifications/count`
- `POST /api/notifications/send-bulk`
- `POST /api/notifications/:id/lire`
- `POST /api/notifications/lire-tout`
