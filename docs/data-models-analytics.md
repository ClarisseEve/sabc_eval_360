# Data Models — Analytics

## Storage

Les analytics actifs ne reposent plus sur un microservice Go dédié.

## Sources de vérité

- PostgreSQL business pour les évaluations, périodes, règles et historiques
- MySQL core pour les utilisateurs, rôles, régions et structure

## Exposition

- agrégations calculées dans `apps/api/src/analytics/analytics.service.ts`
- consommation principale dans `apps/web/src/pages/Admin/Analytics/Index.tsx`
