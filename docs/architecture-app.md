# Architecture App

## Frontend

Le frontend actif est `apps/web`, une SPA React avec:

- React Router
- React Query
- Suspense
- layout applicatif unifié

## Backend

Le backend actif est `apps/api`, une API NestJS avec:

- auth JWT
- services métier par domaine
- validation DTO
- throttling et logging HTTP

## Données

- MySQL pour le core
- PostgreSQL pour le métier

Les anciens points d’entrée Laravel/Inertia ne font plus partie de l’architecture active.
