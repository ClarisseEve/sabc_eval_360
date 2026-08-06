# Audit rôle TMO — Trade Marketing Operator

**Verdict global : OK** (avec réserves mineures)

Contrairement au soupçon, le dashboard TMO **n'est pas une coquille vide** : `/tmo/dashboard` rend `RoleIndividualDashboardPage`, entièrement branché sur l'API (scores, évaluations reçues/à compléter, évolution par période, benchmarks région, axes, recommandations, règles actives) avec skeleton, ErrorBoundary et empty states. Les vraies coquilles (« Contenu à implémenter » dans `pages/TMO/Activities.tsx`, mock dans `pages/TMO/Performance.tsx`) sont du code mort non routé : les anciennes URLs redirigent vers le dashboard. Restent des réserves transverses (full reload des actions rapides, endpoints analytics région sans RBAC) et une incohérence de config nav (TMO déclaré « rôle à équipe potentielle » alors que son dashboard est individuel).

## Routage & guards

- `apps/web/src/app.tsx:252` — `/tmo/dashboard` → `<R role="TMO"><TMODashboard /></R>` ; guard OK (`AuthGuard.tsx:33-37`).
- `apps/web/src/app.tsx:270-271` — alias `/tmo/activities` et `/tmo/performance` : `Navigate` vers `/tmo/dashboard` sous guard TMO. Aucun lien interne ne pointe vers ces alias (grep sur `apps/web/src`) : filets pour anciens favoris, pas des liens morts exposés dans l'UI.

## Navigation / Sidebar (entrées visibles pour TMO)

| Entrée | Cible | État |
|---|---|---|
| Tableau de bord | `/tmo/dashboard` | Écran réel |
| Évaluations → Mes évaluations | `/evaluations/mine` | Écran réel |
| Évaluations → À compléter | `/evaluations/pending` | Écran réel |
| Évaluations → À valider | `/evaluations/validate` | Affiché seulement si l'API confirme des subordonnés directs ou une file non vide (`Sidebar.tsx:69-84`) — en pratique masqué pour TMO (personne ne reporte à un TMO dans le seed) |
| Évaluations → Historique | `/evaluations/historique` | Écran réel |
| Mon équipe | `/equipe/subordonnes`, `/equipe/evaluations` | TMO ∈ `ROLES_WITH_POTENTIAL_REPORTS` (nav.tsx:35) mais la section n'apparaît que si `/hierarchy/subordonnes` renvoie des rattachements — masquée en pratique. Voir constat P3. |
| Axes d'amélioration | `/axes-amelioration` | Écran réel — variante « individual » (TMO ∉ MANAGER_ROLES/DIRECTOR_ROLES, `AxesAmelioration/index.tsx:67-68,117-123`) |

Tous les liens sont des navigations SPA valides ; aucun placeholder atteignable.

## Dashboard

`pages/TMO/Dashboard/index.tsx` → `RoleIndividualDashboardPage` (`Components/Dashboard/RoleIndividualDashboardPage.tsx`) :
- **Données réelles** : `useRoleDashboardData('individual')` (scores/axes/recommandations self, historique filtré reçu/donné, en_attente, règles) + 2 requêtes dédiées `benchmarks` et `evolution` activées uniquement si le rôle est évalué par une règle publiée (`canSeeSelfScore`, l.47-59 ; `useRoleDashboards.ts:419`) — pas d'appel inutile ni de carte trompeuse si le rôle n'est pas noté.
- **États** : `DashboardSkeleton` en fallback Suspense (`pages/TMO/Dashboard/index.tsx:8-9`), `ErrorBoundary`, `EmptyState` sur chaque bloc (reçues l.111-112, à compléter l.151-152, axes l.206-207, recommandations l.235-236, règles), skeleton `animate-pulse` dans `BenchmarksCard`/`EvolutionCard` pendant le chargement.
- **KPI cohérents** : « Évaluations à faire » = en_attente self ; « Score global » affiche « Non applicable » si masqué par les règles ; « Progression récente » + taux de complétion personnel dérivés de `/dashboard` (champs `evaluations_total`/`evaluations_en_attente` réellement renvoyés par `dashboard.service.ts:103-107`).
- Aucune donnée factice dans l'écran routé.

## Tableau des constats

| Sévérité | Fichier:ligne | Constat | Recommandation |
|---|---|---|---|
| P1 | apps/api/src/analytics/analytics.controller.ts:64-72 | `GET /analytics/region/:idRegion` et `.../classement` accessibles à tout token authentifié (JWT seul) : un TMO peut lire les agrégats de performance de n'importe quelle région. Non appelés par les écrans TMO, mais exposés. | Restreindre à ADMIN ou à la région de l'utilisateur. |
| P2 | apps/web/src/Components/Dashboard/RoleDashboardShared.tsx:58-60 | `navigateTo` = `window.location.href` : les « Actions rapides » (RoleIndividualDashboardPage.tsx:260-267) et le bouton « Consulter » des évaluations reçues (l.135) font un full reload au lieu d'une navigation SPA. | Utiliser le `navigate` du shim react-router. |
| P2 | apps/web/src/Components/Auth/AuthGuard.tsx:34 + apps/web/src/app.tsx:139-142 | Guard et redirection comparent `role_nom \|\| role` brut au code `TMO` ; fragile si `role_nom` contient un libellé (« Trade Marketing Operator ») — `resolveKnownRole` (config/rbac.ts:109) n'est pas utilisé ici. | Normaliser via `resolveKnownRole`. |
| P3 | apps/web/src/config/nav.tsx:35 | TMO ∈ `ROLES_WITH_POTENTIAL_REPORTS` : si un TMO se voyait un jour attribuer des subordonnés, la sidebar afficherait « Mon équipe » et « À valider » alors que son dashboard (`RoleIndividualDashboardPage`) n'a aucune vue équipe — incohérence gabarit/navigation. | Soit retirer TMO de la liste, soit prévoir la bascule du dashboard sur le gabarit manager quand des rattachements existent. |
| P3 | apps/web/src/pages/TMO/Activities.tsx:25 ; pages/TMO/Performance.tsx:18-25 | Code mort : `Activities.tsx` est la coquille vide (« Contenu à implémenter »), `Performance.tsx` contient un graphique 100 % mock. Non importés, non routés (redirects en place). | Supprimer ces fichiers pour lever toute ambiguïté. |
| P3 | apps/web/src/config/nav.tsx:57-63 | Badge « notifications » déclaré sur « À compléter » mais jamais rendu par la Sidebar (badge uniquement pour `/evaluations/validate`, Sidebar.tsx:266-268). | Implémenter ou retirer. |

## Endpoints consommés par les écrans TMO

| Endpoint | Statut |
|---|---|
| `GET /dashboard` | OK — self (dashboard.controller.ts:16-36) |
| `GET /analytics/scores` / `axes-amelioration` / `recommandations` | OK — self (analytics.controller.ts:229, 74, 218) |
| `GET /analytics/benchmarks/:matricule` | OK — anti-IDOR `assertCanViewMatricule` (l.247-251) ; appelé avec le matricule self |
| `GET /analytics/evolution/:matricule` | OK — anti-IDOR (l.254-258) |
| `GET /evaluations` (en_attente + a_valider) | OK — self (evaluations.controller.ts:14-22) |
| `GET /evaluations/historique` | OK — self (l.41-58) |
| `GET /evaluations/eligibles`, `/evaluations/periodes-actives` | OK — self ; création contrôlée par l'éligibilité serveur (evaluations.service.ts:276-279) |
| `GET /regles` | OK — JWT, règles publiées (regles.controller.ts:15) |
| `GET /periodes` (filtres Historique/Reçues/Données) | OK — JWT (periodes.controller.ts:13) |
| `GET /evaluations/recues`, `/evaluations/donnees` (+ stats) | OK — self (evaluations-consultation.controller.ts:10-38) ; enregistré avant `@Get(':id')` pour éviter le shadowing (evaluations.module.ts:14-22) |
| `GET /notifications`, `/notifications/count`, `POST .../read` | OK — self |
| `GET /analytics/region/:idRegion`, `.../classement` | **Sans RBAC** (voir P1) — non appelés par les écrans TMO |

## Écrans partagés

- **Mes évaluations / À compléter** : cibles issues de `/evaluations/eligibles` (auto, pairs, ascendante pour TMO selon les règles) — aucun bouton menant à un 403.
- **À valider** : masqué de la sidebar (pas de subordonnés) ; par URL directe la file est vide et toute validation hors périmètre est rejetée serveur (evaluations.service.ts:507-523).
- **Axes d'amélioration** : variante individuelle (`IndividualAxesPage`, AxesAmelioration/index.tsx:162) — uniquement des données self, cohérent.
- **Équipe** par URL directe (`/equipe/subordonnes`) : listes vides self-scopées, pas d'erreur.
- **Profil / Paramètres / Notifications** : `PATCH /auth/profile`, `POST /auth/change-password`, endpoints notifications présents côté API — rien à signaler.
