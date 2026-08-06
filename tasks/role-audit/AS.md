# Audit rôle AS — Assistant Sponsoring

**Verdict global : OK**

**Résumé** : `/as/dashboard` n'est plus une coquille vide : c'est un vrai dashboard individuel (`RoleIndividualDashboardPage`) branché sur l'API — évaluations reçues/à compléter, score global, évolution, benchmarks, axes et recommandations — avec skeleton, empty states et ErrorBoundary. Le choix du gabarit « individuel » est cohérent avec le référentiel serveur (AS niveau 4, `peut_evaluer_subordonnes:false`, rattaché à un SS). Les anciennes coquilles `Events.tsx`/`Reports.tsx` restent en code mort non routé ; la sidebar AS ne montre aucune action qu'il ne peut pas exécuter.

## 1. Routage & guards

- Route dashboard : `apps/web/src/App.tsx:256` — `<Route path="/as/dashboard" element={<R role="AS"><ASDashboard /></R>} />`. Guard `R` (App.tsx:161-163) → `AuthGuard requiredRoles={['AS']}`.
- Alias : `/as/events` et `/as/reports` (App.tsx:278-279) → `Navigate replace` vers `/as/dashboard` sous guard AS. **Pas des liens morts déguisés** : aucun lien interne ne les cible (seules occurrences dans App.tsx).
- `DashboardRedirect` (App.tsx:135-143) : `/` → `/as/dashboard`.

## 2. Navigation / Sidebar

Config : `apps/web/src/config/nav.tsx` ; filtrage `Sidebar.tsx:113-126`. Entrées visibles pour AS :

| Entrée | Cible | État |
|---|---|---|
| Tableau de bord | `/as/dashboard` | Écran réel |
| Évaluations → Mes évaluations | `/evaluations/mine` (App.tsx:283) | Écran réel |
| Évaluations → À compléter | `/evaluations/pending` (App.tsx:284) | Écran réel |
| Évaluations → Historique | `/evaluations/historique` (App.tsx:288) | Écran réel |
| Axes d'amélioration | `/axes-amelioration` (App.tsx:307) | Écran réel |

Correctement absents pour AS : « À valider » (AS ∉ `VALIDATION_QUEUE_ROLES`, nav.tsx:36) et « Mon équipe » (AS ∉ `ROLES_WITH_POTENTIAL_REPORTS`, nav.tsx:35) — cohérent avec un rôle sans subordonnés (`seed.ts:284` `subordonnes:false`). Aucun bouton visible ne mène à un 403.

## 3. Dashboard

`apps/web/src/pages/AS/Dashboard/index.tsx:9-13` → `RoleIndividualDashboardPage` (fallbackRole="AS"), ErrorBoundary + Suspense/`DashboardSkeleton`.

- **Données réelles** : `useRoleDashboardData('individual', …)` (useRoleDashboards.ts:358-444) — scores/axes/recommandations self, historique (dont dérivées « reçues » et « données », lignes 428-429), évaluations en attente, règles publiées. Aucun appel hiérarchie (scope individuel, ligne 386) : pas de requêtes inutiles.
- **Cartes analytiques conditionnelles** : `EvolutionCard` et `BenchmarksCard` ne sont rendues — et leurs requêtes `GET /analytics/evolution/:matricule`, `GET /analytics/benchmarks/:matricule` déclenchées — que si `canSeeSelfScore` (règles publiées où AS est évalué, RoleIndividualDashboardPage.tsx:47-59 `enabled:`, 175-189). Sinon la carte Score affiche « Non applicable / Score masqué pour ce rôle » (lignes 86-95). Logique propre.
- **États** : skeleton Suspense ; `EmptyState` sur chaque section (lignes 111-112, 151-152, 206-207, 235-236) ; `isLoading` sur Benchmarks/Evolution (BenchmarksCard.tsx:54-57, EvolutionCard.tsx:49-52).
- **KPI cohérents** : « Évaluations à faire », « reçues », score global/pondéré, progression + taux de complétion personnel calculé depuis `GET /dashboard` (lignes 62-64).

## 4. Constats

| Sévérité | Fichier:ligne | Constat | Recommandation |
|---|---|---|---|
| P1 | apps/api/src/analytics/analytics.controller.ts:64-72 | `GET /analytics/region/:idRegion` et `/classement` sans `@Roles` ni contrôle de périmètre : même un AS (bas de la hiérarchie) peut lire les analytics agrégées et le classement de n'importe quelle région. Non consommé par ses écrans, mais exposé. | Restreindre à ADMIN ou au périmètre de l'appelant. |
| P2 | apps/web/src/Components/Dashboard/RoleDashboardShared.tsx:58-60 | `navigateTo` = `window.location.href` : « Actions rapides » (RoleIndividualDashboardPage.tsx:260-267) et « Consulter » (ligne 135) provoquent un full reload de la SPA. Idem liens `<a href>` du hub évaluations (pages/Common/Evaluations/index.tsx:172, 197-199). | `useNavigate`/`Link` react-router. |
| P2 | apps/web/src/Components/Auth/AuthGuard.tsx:33-38 + App.tsx:139 | Comparaison brute `(role_nom \|\| role).toUpperCase() === 'AS'` — fonctionne car le seed met le code dans `role_nom` (seed.ts:890) ; casserait si `role_nom` devenait un libellé (« Assistant sponsoring »). `resolveKnownRole` (rbac.ts:111-114, avec l'ordre AS/SS déjà géré) existe pour ça. | Unifier via `resolveKnownRole`. |
| P3 | apps/web/src/pages/AS/Events.tsx + apps/web/src/pages/AS/Reports.tsx | Coquilles vides historiques (« Aucun événement… » statiques) non routées : code mort. | Supprimer. |
| P3 | apps/web/src/config/nav.tsx:57-63 + Sidebar.tsx:266-302 | `badge: 'notifications'` de « À compléter » jamais rendu (seul le badge « À valider » existe — que l'AS ne voit pas). | Brancher le badge sur `en_attente` ou retirer la propriété. |

## 5. Écrans partagés

- `/evaluations/*` : l'éligibilité AS (auto + pairs, flags DB `peut_auto_evaluer`/`peut_evaluer_pairs`, seed.ts:282-283) est calculée serveur via `GET /evaluations/eligibles` ; le CTA « Démarrer » du hub est désactivé avec motif si aucune règle applicable (index.tsx:40-45). Pas de bouton menant à un 403.
- `/evaluations/validate` accessible par URL directe (guard `G` seulement) : file `a_valider` scopée `manager_matricule` (evaluations.service.ts:589-604) → vide pour AS ; `validate` serveur refuse (ForbiddenException, lignes 507-523). Pas de fuite.
- `/equipe/*` par URL directe : « Aucun subordonné trouvé » (Overview.tsx:39-42), sans erreur.
- Anti-IDOR analytics : un AS ne peut interroger `scores/axes/benchmarks/evolution` que pour lui-même (`assertCanViewMatricules` = soi + subordonnés, analytics.controller.ts:24-41 ; l'AS n'a pas de subordonnés).
- Profil/paramètres : `/common/settings`, `/settings/*` (App.tsx:313-319) → `PATCH /auth/profile`, `POST /auth/change-password` existent (api.ts:498-514). Notifications : Header autonome (Header.tsx:111-112).

## Endpoints

| Endpoint appelé (écrans AS) | Statut |
|---|---|
| `GET /dashboard` | OK — scopé au matricule (dashboard.controller.ts:16-36) |
| `GET /analytics/scores` / `axes-amelioration` / `recommandations` | OK — self only |
| `GET /analytics/benchmarks/:matricule` / `GET /analytics/evolution/:matricule` | OK — anti-IDOR `assertCanViewMatricule` (analytics.controller.ts:247-258) ; appelés uniquement avec le matricule de l'utilisateur |
| `GET /evaluations` / `historique` / `eligibles` | OK — scopés `req.user.matricule` |
| `GET /regles` | OK — règles actives publiées |
| `GET /notifications` (+ count, read) | OK |
| `PATCH /auth/profile` / `POST /auth/change-password` | OK (auth) |
| `GET /analytics/region/:idRegion` (+ `/classement`) | **Sans RBAC** — exposé à tout authentifié, y compris AS (voir P1) |

Aucun endpoint appelé par les écrans AS n'est manquant côté API.
