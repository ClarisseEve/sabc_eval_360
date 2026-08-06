# Audit rôle RTM — Regional Trade Marketing

**Verdict global : OK (avec réserves)**

**Résumé** : `/rtm/dashboard` n'est plus une coquille vide : c'est un dashboard manager réel (mêmes composants partagés que SS), alimenté par l'API avec skeleton/empty/error states. Les anciennes sous-pages `Campaigns.tsx`/`Operators.tsx` subsistent en code mort non routé ; leurs URLs redirigent vers le dashboard et rien n'y pointe. Le point notable propre au RTM est la divergence de capacités entre le RBAC front (`canEvaluatePeers:false`, `canCrossBranch:false`) et le référentiel rôle serveur (`pairs:true`, `crossBranch:true`).

## 1. Routage & guards

- Route dashboard : `apps/web/src/App.tsx:254` — `<Route path="/rtm/dashboard" element={<R role="RTM"><RTMDashboard /></R>} />`. Guard `R` (App.tsx:161-163) → `AuthGuard requiredRoles={['RTM']}`.
- Alias : `/rtm/campaigns` et `/rtm/operators` (App.tsx:274-275) → `Navigate` vers `/rtm/dashboard` sous guard RTM. **Pas des liens morts déguisés** : aucun lien de l'app ne cible ces URLs (seules occurrences dans App.tsx) ; redirections de compatibilité uniquement.
- `DashboardRedirect` (App.tsx:135-143) : `/` → `/rtm/dashboard` pour un RTM.

## 2. Navigation / Sidebar

Config : `apps/web/src/config/nav.tsx` ; filtrage `Sidebar.tsx:113-126`. Entrées visibles pour RTM :

| Entrée | Cible | État |
|---|---|---|
| Tableau de bord | `/rtm/dashboard` | Écran réel |
| Évaluations → Mes évaluations / À compléter / Historique | `/evaluations/mine`, `/evaluations/pending`, `/evaluations/historique` (App.tsx:283-288) | Écrans réels |
| Évaluations → À valider | `/evaluations/validate` — RTM ∈ `VALIDATION_QUEUE_ROLES` (nav.tsx:35-36), affiché seulement si subordonnés directs réels ou file `a_valider` non vide (Sidebar.tsx:69-84) | Écran réel |
| Mon équipe → Subordonnés / Évaluations équipe | `/equipe/subordonnes`, `/equipe/evaluations` (App.tsx:305-306) — data-driven ; le seed rattache TMO **et** SRMO au RTM (`apps/api/prisma/seed.ts:396-399`) donc visible en pratique | Écrans réels |
| Axes d'amélioration | `/axes-amelioration` (App.tsx:307) | Écran réel |

Liens sidebar en navigation SPA (`Link` react-router via `inertia-shim.tsx:345`). Aucun `window.location.href` dans la sidebar.

## 3. Dashboard

`apps/web/src/pages/RTM/Dashboard/index.tsx:9-14` → `RoleManagerDashboardPage` (fallbackRole="RTM") sous ErrorBoundary + Suspense/`DashboardSkeleton`.

- **Données réelles** : `useRoleDashboardData('manager', …)` (useRoleDashboards.ts:358-444) : scores/axes/recommandations self, historique, évaluations en attente/à valider, règles publiées, subordonnés directs, puis batchs équipe (`scores/batch`, `axes-amelioration/batch`) et heatmap (`RoleManagerDashboardPage.tsx:90-95`). Zéro donnée factice.
- **États** : Suspense skeleton, `EmptyState` par carte (lignes 142-143, 174, 190, 204), `Promise.allSettled` tolérant aux pannes partielles, `TeamHeatmapCard` avec état `isLoading` (TeamHeatmapCard.tsx:40-59).
- **KPI cohérents** : le périmètre est bien limité aux subordonnés **directs** (`hierarchyApi.getSubordonnes`, scope 'manager', useRoleDashboards.ts:386, 399) — conforme au `directSubsOnly: true` déclaré pour RTM (rbac.ts:47-53).

## 4. Constats

| Sévérité | Fichier:ligne | Constat | Recommandation |
|---|---|---|---|
| P1 | apps/api/src/analytics/analytics.controller.ts:64-72 | `GET /analytics/region/:idRegion` et `/classement` sans `@Roles` ni contrôle de périmètre : un RTM peut lire les analytics de n'importe quelle région (au-delà de la sienne). Non consommé par les écrans RTM, mais exposé. | Restreindre à ADMIN ou au périmètre régional/hiérarchique de l'appelant. |
| P2 | apps/web/src/config/rbac.ts:47-53 vs apps/api/prisma/seed.ts:231-233 | Divergence front/serveur : rbac front RTM = `canEvaluatePeers:false`, `canCrossBranch:false` alors que le rôle DB (R0006) = `peut_evaluer_pairs:true`, `peut_cross_branch:true`. Le serveur (EligibilityService, eligibility.service.ts:71-86) est la source de vérité pour les évaluations : le front pourrait masquer/afficher des affordances incohérentes si d'autres capacités que `canEvaluateSubs` étaient consommées demain. | Exposer les capacités du rôle via l'API et supprimer la duplication en dur. |
| P2 | apps/web/src/Components/Dashboard/RoleDashboardShared.tsx:58-60 | `navigateTo` = `window.location.href` : « Actions rapides » (RoleManagerDashboardPage.tsx:262-277) et « Examiner » (240-246) déclenchent un full reload de la SPA. | Passer par `useNavigate`/`Link` react-router. |
| P2 | apps/web/src/Components/Auth/AuthGuard.tsx:33-38 + App.tsx:139 | Comparaison brute `(role_nom \|\| role).toUpperCase() === 'RTM'` : fonctionne car le seed met le code dans `role_nom` (seed.ts:890) ; casserait (403 + redirect `/regional trade marketing/dashboard` → 404) si `role_nom` devenait un libellé. `resolveKnownRole` (rbac.ts:108) sait pourtant résoudre « REGIONAL TRADE MARKETING ». | Utiliser `resolveKnownRole` dans AuthGuard et DashboardRedirect. |
| P3 | apps/web/src/pages/RTM/Campaigns.tsx + apps/web/src/pages/RTM/Operators.tsx | Coquilles vides historiques non routées (code mort, mêmes gabarits placeholder que SS/Assistants). | Supprimer. |
| P3 | apps/web/src/config/nav.tsx:57-63 + Sidebar.tsx:266-302 | `badge: 'notifications'` de « À compléter » jamais rendu (seul `/evaluations/validate` a un badge). | Brancher ou retirer. |

## 5. Écrans partagés

- `/evaluations/*` : pilotés par le serveur ; l'éligibilité (auto/pairs/subordonnés) est décidée par `GET /evaluations/eligibles` + `EligibilityService` (flags `peut_evaluer_*` du rôle en DB), donc pas de bouton « évaluer » menant à un 403 pour RTM — les cibles proposées sont déjà filtrées.
- `/evaluations/validate` : file `a_valider` scopée `manager_matricule` côté serveur (evaluations.service.ts:589-604) ; `validate` protégé par `ForbiddenException` (lignes 507-523). RTM voit ses TMO/SRMO, rien d'autre.
- `/equipe/*` : lecture des subordonnés réels, empty state si aucun.
- Notifications : Header autonome (`Header.tsx:111-112`), endpoints présents.

## Endpoints

| Endpoint appelé (écrans RTM) | Statut |
|---|---|
| `GET /dashboard` | OK — scopé au matricule |
| `GET /analytics/scores` / `axes-amelioration` / `recommandations` | OK — self only |
| `POST /analytics/scores/batch` / `axes-amelioration/batch` / `team-heatmap` | OK — anti-IDOR (soi + subordonnés, analytics.controller.ts:24-41) |
| `GET /evaluations` / `GET /evaluations/historique` / `GET /evaluations/eligibles` | OK — scopés `req.user.matricule` |
| `GET /regles` | OK — lecture des règles actives publiées |
| `GET /hierarchy/subordonnes` | OK — scopé (hierarchy.controller.ts:33-36) |
| `GET /notifications` (+ count, read) | OK |
| `GET /analytics/region/:idRegion` (+ `/classement`) | **Sans RBAC** — exposé à tout authentifié (voir P1) |

Aucun endpoint appelé par les écrans RTM n'est manquant côté API.
