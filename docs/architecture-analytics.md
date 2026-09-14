# Architecture — Analytics Domain

## Overview

Le domaine analytics est servi par `apps/api/src/analytics`.

## Surface API active

- `GET /api/analytics/dashboard`
- `GET /api/analytics/evaluations`
- `GET /api/analytics/performances`
- `GET /api/analytics/region/:idRegion`
- `GET /api/analytics/region/:idRegion/classement`
- `GET /api/analytics/anomalies`
- `GET /api/analytics/admin/export-evaluations?format=csv|xlsx`
- `GET /api/analytics/scores`
- `GET /api/analytics/recommandations`
- `GET /api/analytics/axes-amelioration`

## Sources de données

- PostgreSQL business pour les évaluations, périodes, règles et agrégats
- MySQL core pour les utilisateurs, rôles, régions et structure

## Runtime

- agrégations calculées côté NestJS
- cache applicatif sur les endpoints lourds
- exposition directe à `apps/web` via `analyticsApi`

L’export administrateur produit une ligne par compétence notée et par évaluation,
avec les identités, la structure organisationnelle, le type d’évaluation, le
score et le niveau d’acquisition. Le filtre de période sélectionné dans
l’interface est transmis à l’API. Le CSV est encodé en UTF-8 avec séparateur
point-virgule pour Excel ; le format XLSX est généré nativement par ExcelJS.
