# Admin Analytics Hub

## Vue d'ensemble
- Hub mono-page `/admin/analytics` limité au rôle `ADMIN`, structuré en filtres latéraux persistants + zone principale en onglets (Synthèse, Compétences, Démographie, Performance, Alertes & Recos).
- Les filtres globaux (période, rôles ciblés, niveaux hiérarchiques, régions/branches, familles de compétences, sexe, tranche d'âge, ancienneté, statut de formation, canaux d'évaluation, périmètre Tanière/Non-Tanière) sont centralisés dans `AnalyticsFiltersContext` et pilotent l'état partagé dans toute la page.
- Toutes les cartes/graphes affichent la valeur filtrée et, lorsqu'elle est disponible, la référence globale pour faciliter la comparaison.
- Un `UserInsightsDrawer` accessible via les tuiles Synthèse ou la heatmap expose le profil analytique détaillé d'un collaborateur (scores vs cibles, historique, mix d'évaluations, recommandations).

## Onglets et composants
- **Synthèse** : `AnalyticsKpiOverview` (badges Tendance + valeur globale), liste de profils clés ouvrant le tiroir, timeline globale (section Performance).
- **Compétences** : `CompetencyHeatmapSection` alimentée par la matrice, cartes des profils cibles (`ROLE_COMPETENCY_PROFILES`), accès direct au tiroir par rôle.
- **Démographie** : `DemographicInsightsSection` (double histogrammes filtré vs global par sexe, âge, ancienneté).
- **Performance** : `PerformanceInsightsSection` (lignes score/participation et cohorte onboarding) + focus rôle/canal.
- **Alertes & Recos** : `AlertsRecommendationsSection` (impact population, actions suggérées, sévérité colorée).

## Contrats de données (TypeScript)
- `AnalyticsDataset` regroupe KPI, heatmap, ventilations démographiques, tendances temporelles, performance par rôle, distribution des canaux, alertes, top users.
- `UserAnalyticsSummary` fournit : identité, profil socio (sexe, âge, ancienneté), scores par famille, historique récent, répartition Auto/Pairs/Descendante, recommandations priorisées.
- `KpiMetric` expose `value`, `globalValue?`, `variation`, `unit`, `description` afin d'afficher la comparaison filtré vs global + badge Tendance.
- Les filtres globaux sont décrits par `AnalyticsFilters` (période, rôles, régions, branches, niveaux hiérarchiques, familles, sexes, canaux, tranche d'âge, ancienneté, statuts de formation, `structureScope`).

## Référentiel compétences
- `resources/js/constants/competencyMatrix.ts` encode les familles issues de `sample/MATRICE DES COMPETENCES...xlsx` :
  - `COMPETENCY_FAMILIES` (11 familles),
  - `COMPETENCY_DEFINITIONS` (compétences avec description + niveau d'attente),
  - `ROLE_COMPETENCY_PROFILES` (familles clefs + compétences focus + score cible par rôle).
- Structure JSON attendue côté données :
```ts
interface RoleCompetencyScore {
  role: string;
  family: string;
  score: number;      // score observé (0-5)
  target: number;     // score cible de la matrice
}
```

## API Laravel (à implémenter)
**Note** : ces endpoints sont planifiés et ne sont pas encore exposés dans `routes/api.php`.
Le frontend reste alimenté par `MOCK_ANALYTICS_DATA` tant que l'API n'est pas branchée.

- `GET /admin/api/analytics` → retourne `AnalyticsDataset` filtré selon query params (période, rôles, hiérarchie, etc.). S'appuie sur vues/materialized tables `analytics_metrics`, `analytics_demographics`, `analytics_competencies` (ClickHouse recommandé pour agrégations volumétriques).
- `GET /admin/api/analytics/users` → pagination des `UserAnalyticsSummary` pour alimenter la tuile « utilisateurs mis en avant » et la heatmap (filtrable même jeu de paramètres).
- `GET /admin/api/analytics/users/{matricule}` → détail exhaustif pour le tiroir (scores historiques, recommandations dynamiques, positionnement démographique).
- `GET /admin/api/analytics/competencies/matrix` → expose la matrice de référence (peut être mise en cache application/Redis).

## Pipelines & stockage (Airflow)
1. **Ingestion** : extraire évaluations (`evaluations`, `scores_utilisateurs`) + référentiel RH (âge, sexe, ancienneté, hiérarchie, statut formation) + matrice compétences.
2. **Enrichissement** : calculer scores pondérés par rôle/période, participation, backlog, écarts compétences vs cible, indicateurs biais (écarts auto/pairs/descendante).
3. **Agrégation** : alimenter tables `analytics_scores_by_period`, `analytics_competencies_gap`, `analytics_demographics`, `analytics_alerts` (ClickHouse ou MySQL analytique selon volumétrie).
4. **Servir** : vues matérialisées/endpoint Laravel -> cache court terme (Redis) -> front.
5. **Exports** : générer PPT/Excel via worker (reuse assets `sample/Rapport_Sep.pptx`).

## Permissions
- Route protégée par `role:ADMIN`. L'admin peut lancer des évaluations descendantes, mais l'UI empêche auto/pairs (cf. `EvaluationPermissionsSeeder`). Les autres rôles reçoivent `AccessDenied`.

## TODO front/back
- Remplacer `MOCK_ANALYTICS_DATA` par appels API une fois disponibles.
- Ajouter scénarios RWD (panel filtres sticky sur desktop, drawer plein écran mobile).
- Finaliser le mode salle (thème haute visibilité + autorefresh) et enrichir les exports (PNG, JPEG, PDF, Excel déjà disponibles côté client via `useAnalyticsExport`).
- Étendre `useAnalyticsData` pour appliquer filtres côté front tant que l'API n'est pas branchée.
- Brancher la heatmap à la matrice réelle et agréger la densité de gaps (sexe/âge) pour l'infobulle.
