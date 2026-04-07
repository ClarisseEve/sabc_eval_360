# Admin Analytics Hub

Le hub analytics admin est désormais servi par le frontend `apps/web` et branché sur les endpoints NestJS de `apps/api`.

## Endpoints actifs

- `GET /api/analytics/dashboard`
- `GET /api/analytics/evaluations`
- `GET /api/analytics/performances`
- `GET /api/analytics/region/:id`
- `GET /api/analytics/region/:id/classement`
- `GET /api/analytics/anomalies`

## Frontend concerné

- `apps/web/src/pages/Admin/Analytics/Index.tsx`

## Note

Les références à `resources/js` et au microservice Go historique ne sont plus d’actualité pour l’architecture active.
