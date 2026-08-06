# Audit rôle CDS — Chef de Secteur

**Verdict global : Dégradé**

Le routage, les guards et la sidebar CDS sont sains, et tous les endpoints appelés existent et sont correctement scopés côté serveur. Le problème est un choix de gabarit : CDS reçoit le **dashboard « manager »** et la **page Axes « équipe »** alors qu'un CDS n'a aucun subordonné (personne ne reporte à un CDS dans le seed, `canEvaluateSubs: false` dans le RBAC front, exclu de `ROLES_WITH_POTENTIAL_REPORTS`). Résultat : plus de la moitié de son écran principal est constituée de cartes structurellement vides, et il perd les vues individuelles (évolution, benchmarks, recommandations) réservées au gabarit « individual ».

## Routage & guards

- `apps/web/src/app.tsx:251` — `/cds/dashboard` → `<R role="CDS"><CDSDashboard /></R>` ; guard OK (`AuthGuard.tsx:33-37`, /403 sinon).
- `apps/web/src/app.tsx:264-265` — alias `/cds/objectives` et `/cds/performance` : `Navigate` vers `/cds/dashboard`, sous guard CDS. Aucun lien interne ne pointe vers ces alias (grep sur `apps/web/src`) — filets pour anciens favoris, pas des liens morts exposés. Les pages d'origine (`pages/CDS/Objectives.tsx`, `pages/CDS/Performance.tsx`, mock) sont du code mort non importé.

## Navigation / Sidebar (entrées visibles pour CDS)

| Entrée | Cible | État |
|---|---|---|
| Tableau de bord | `/cds/dashboard` | Écran réel mais gabarit inadapté (voir constats) |
| Évaluations → Mes évaluations | `/evaluations/mine` | Écran réel |
| Évaluations → À compléter | `/evaluations/pending` | Écran réel |
| Évaluations → À valider | `/evaluations/validate` | CDS ∈ `VALIDATION_QUEUE_ROLES` (nav.tsx:36) mais l'entrée n'apparaît que si la file serveur est non vide (`Sidebar.tsx:69-84` : pas de scope régional, pas de subordonnés → seul `validationCount > 0` l'affiche). Pas de lien mort. |
| Évaluations → Historique | `/evaluations/historique` | Écran réel |
| Axes d'amélioration | `/axes-amelioration` | Écran réel mais variante « équipe » inadaptée (voir constats) |

« Mon équipe » n'est pas proposé à CDS (`ROLES_WITH_POTENTIAL_REPORTS` exclut CDS, nav.tsx:35) — cohérent avec le RBAC (`rbac.ts:66-71`). Tous les liens sont des navigations SPA valides.

## Dashboard

`pages/CDS/Dashboard/index.tsx` → `RoleManagerDashboardPage` avec `fallbackRole="CDS"`, `teamTitle="Équipe du secteur"`. Données réelles via API, skeleton/ErrorBoundary/empty states présents (mêmes mécanismes que CDV). Mais pour un CDS :
- `hierarchyApi.getSubordonnes()` renvoie `[]` (aucun utilisateur n'a un CDS pour manager — seed `apps/api/prisma/seed.ts:385-388` : CDS reporte au DR, personne ne reporte au CDS) ;
- donc `teamMembers = []` → « Score moyen équipe » = « — », « Taux de couverture » = 0 %, « Score moyen par type », « Axes dominants », heatmap (requête désactivée, `RoleManagerDashboardPage.tsx:90-95`), tableau « Équipe du secteur » et « Alertes équipe » affichent tous leur empty state en permanence ;
- et le gabarit manager n'inclut ni `EvolutionCard`, ni `BenchmarksCard`, ni les cartes axes/recommandations personnelles présentes dans `RoleIndividualDashboardPage.tsx:175-258` — alors que le CDS est lui-même évalué (`canSelfEvaluate: true`).

## Tableau des constats

| Sévérité | Fichier:ligne | Constat | Recommandation |
|---|---|---|---|
| P1 | apps/web/src/pages/CDS/Dashboard/index.tsx:9-14 | CDS reçoit `RoleManagerDashboardPage` alors qu'il n'a jamais de subordonnés (`rbac.ts:66-71` `canEvaluateSubs: false`, `nav.tsx:35` exclu des rôles à équipe, seed sans rattachement). 6 des 9 blocs du dashboard sont des empty states permanents, et les vues individuelles (évolution, benchmarks, recommandations, axes personnels) sont absentes. | Basculer CDS sur `RoleIndividualDashboardPage` (comme TMO/AS), en conservant la carte « Validations reçues » si la file `a_valider` peut être non vide. |
| P1 | apps/api/src/analytics/analytics.controller.ts:64-72 | `GET /analytics/region/:idRegion` et `.../classement` accessibles à tout token authentifié (JWT seul, sans RolesGuard ni contrôle de périmètre) : un CDS peut lire les agrégats de n'importe quelle région. Non appelés par les écrans CDS, mais exposés. | Restreindre à ADMIN ou à la région de l'utilisateur. |
| P2 | apps/web/src/pages/Common/AxesAmelioration/index.tsx:67,121 | CDS ∈ `MANAGER_ROLES` → la page « Axes d'amélioration » rend `ManagerAxesPage` (« Axes d'amélioration équipe ») avec un périmètre vide : filtres, drill-down, top axes équipe et coupe hiérarchique sans contenu. Seule la carte « Mes propres axes » (l.390-393) est utile. | Retirer CDS de `MANAGER_ROLES` pour qu'il tombe sur `IndividualAxesPage` (l.162), centrée sur ses propres axes. |
| P2 | apps/web/src/Components/Dashboard/RoleDashboardShared.tsx:58-60 | `navigateTo` = `window.location.href` : les « Actions rapides » du dashboard CDS font un full reload au lieu d'une navigation SPA. | Utiliser le `navigate` du shim react-router. |
| P2 | apps/web/src/Components/Auth/AuthGuard.tsx:34 + apps/web/src/app.tsx:139-142 | Guard et redirection comparent `role_nom \|\| role` brut au code `CDS` ; fragile si `role_nom` contient un libellé (« Chef de Secteur ») — `resolveKnownRole` (config/rbac.ts:107) gère ce cas mais n'est pas utilisé ici. | Normaliser via `resolveKnownRole`. |
| P3 | apps/web/src/config/nav.tsx:57-63 | Badge « notifications » déclaré sur « À compléter » mais jamais rendu (Sidebar ne badge que `/evaluations/validate`, Sidebar.tsx:266-268). | Implémenter ou retirer. |
| P3 | apps/web/src/pages/CDS/Objectives.tsx, pages/CDS/Performance.tsx, pages/CDS/Dashboard.tsx | Code mort : deux pages 100 % mock non routées + un ré-export inutile. | Supprimer. |

## Endpoints consommés par les écrans CDS

| Endpoint | Statut |
|---|---|
| `GET /dashboard` | OK — self (dashboard.controller.ts:16-36) |
| `GET /analytics/scores` / `axes-amelioration` / `recommandations` | OK — self (analytics.controller.ts:229, 74, 218) |
| `POST /analytics/scores/batch` / `axes-amelioration/batch` / `team-heatmap` | OK — anti-IDOR `assertCanViewMatricules` (l.24-41) ; appelés avec une liste vide pour CDS (requêtes batch neutres, heatmap désactivée) |
| `GET /evaluations` (en_attente + a_valider) | OK — self ; `a_valider` borné aux subordonnés (evaluations.service.ts:589-604) → vide pour CDS |
| `GET /evaluations/historique` | OK — self (evaluations.controller.ts:41-58) |
| `GET /evaluations/eligibles`, `/evaluations/periodes-actives` | OK — self, piloté par les règles (auto/pairs/ascendante pour CDS) |
| `GET /regles` | OK — JWT (regles.controller.ts:15) |
| `GET /hierarchy/subordonnes` | OK — self (hierarchy.controller.ts:33-36), renvoie `[]` |
| `GET /periodes` | OK — JWT |
| `GET /notifications*` | OK — self |
| `GET /analytics/region/:idRegion`, `.../classement` | **Sans RBAC** (voir P1) — non appelés par les écrans CDS |

## Écrans partagés

- **À valider** : accessible par URL directe (`app.tsx:285`, guard `G` seulement) mais la file serveur est vide pour un CDS et `validate()` rejette toute tentative hors périmètre (evaluations.service.ts:507-523) — écran vide, pas d'action 403.
- **Mes évaluations / À compléter** : les cibles viennent de `/evaluations/eligibles` ; un CDS ne se verra pas proposer d'évaluation descendante (pas de subordonnés) — aucun bouton voué au 403.
- **Équipe** (`/equipe/subordonnes`, `/equipe/evaluations`) : non proposés dans la sidebar CDS ; par URL directe ils rendent des listes vides (self-scopé), sans erreur.
- **Profil / Notifications** : endpoints existants et self-scopés, rien à signaler.
