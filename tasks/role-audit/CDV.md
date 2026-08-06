# Audit rôle CDV — Chef District Vente

**Verdict global : OK** (avec réserves mineures)

Le parcours CDV est fonctionnel de bout en bout : route `/cdv/dashboard` gardée par `R role="CDV"`, dashboard manager entièrement branché sur l'API (React Query + Suspense + ErrorBoundary), équipe réelle (les CSC reportent aux CDV dans le seed), états loading/empty/error présents. Les réserves portent sur des points transverses : navigation en dur (`window.location.href`) dans les actions rapides, deux endpoints analytics région exposés sans RBAC côté serveur, et du code mort hérité (pages mock non routées).

## Routage & guards

- `apps/web/src/app.tsx:250` — `/cdv/dashboard` → `<R role="CDV"><CDVDashboard /></R>`. Le guard (`AuthGuard.tsx:33-37`) redirige vers `/403` si le rôle ne correspond pas (admin toujours autorisé).
- `apps/web/src/app.tsx:266-267` — alias `/cdv/performance` et `/cdv/sectors` : `Navigate` vers `/cdv/dashboard`. Aucun lien interne ne pointe vers ces alias (vérifié par grep sur tout `apps/web/src`) : ce ne sont pas des liens morts déguisés côté UI, seulement un filet pour anciens favoris. Les pages qu'ils remplaçaient (`pages/CDV/Performance.tsx`, `pages/CDV/Sectors.tsx`, données mock) sont du code mort non importé.
- `apps/web/src/app.tsx:135-143` — `DashboardRedirect` construit `/${role.toLowerCase()}/dashboard` à partir de `role_nom || role`. Fonctionne car le seed met le code (« CDV ») dans `role_nom` (`apps/api/prisma/seed.ts:890`), mais fragile (voir constats).

## Navigation / Sidebar (entrées visibles pour CDV)

Config data-driven : `apps/web/src/config/nav.tsx`, filtrée par `Sidebar.tsx:113-126`.

| Entrée | Cible | État |
|---|---|---|
| Tableau de bord | `/cdv/dashboard` (résolu via `resolveHref`, nav.tsx:41) | Écran réel |
| Évaluations → Mes évaluations | `/evaluations/mine` | Écran réel (app.tsx:283) |
| Évaluations → À compléter | `/evaluations/pending` | Écran réel (app.tsx:284) |
| Évaluations → À valider | `/evaluations/validate` | Écran réel, affiché seulement si subordonnés directs ou file non vide (`Sidebar.tsx:69-84`) |
| Évaluations → Historique | `/evaluations/historique` | Écran réel (app.tsx:288) |
| Mon équipe → Subordonnés / Évaluations équipe | `/equipe/subordonnes`, `/equipe/evaluations` | Écrans réels ; section affichée uniquement si l'API `/hierarchy/subordonnes` renvoie des rattachements (`requiresDirectReports`, nav.tsx:110-111 + Sidebar.tsx:69-70) |
| Axes d'amélioration | `/axes-amelioration` | Écran réel — variante « manager » (CDV ∈ `MANAGER_ROLES`, `pages/Common/AxesAmelioration/index.tsx:67`) |

Tous les liens utilisent le `Link` du shim (navigation SPA, `lib/inertia-shim.tsx:335-345`). Aucun placeholder ni dead link dans la sidebar CDV.

## Dashboard

`pages/CDV/Dashboard/index.tsx` → `RoleManagerDashboardPage` (`Components/Dashboard/RoleManagerDashboardPage.tsx`) :
- **Données réelles** via `useRoleDashboardData('manager')` (`Hooks/queries/useRoleDashboards.ts:358-443`) : scores/axes/recommandations self, historique, file en attente/à valider, règles publiées, subordonnés directs, analytics d'équipe en 2 requêtes batch, heatmap équipe en 1 requête agrégée (`RoleManagerDashboardPage.tsx:89-95`).
- **États** : skeleton (`DashboardSkeleton` en fallback Suspense), `ErrorBoundary` local, `EmptyState` sur chaque carte (score par type l.142-143, heatmap, tableau équipe l.190, alertes l.203).
- **KPI cohérents** : « Actions à traiter » = en_attente + a_valider ; « Score moyen équipe » et « Taux de couverture » calculés sur les membres notés ; « Mon score global » masqué si aucune règle ne cible le rôle en évalué (`canSeeSelfScore`, useRoleDashboards.ts:419).
- Aucune donnée factice détectée dans ce composant.

## Tableau des constats

| Sévérité | Fichier:ligne | Constat | Recommandation |
|---|---|---|---|
| P1 | apps/api/src/analytics/analytics.controller.ts:64-72 | `GET /analytics/region/:idRegion` et `GET /analytics/region/:idRegion/classement` sont accessibles à tout utilisateur authentifié (JWT seul, ni `RolesGuard` ni `assertCanViewMatricules`). Un CDV peut lire les agrégats (score moyen, distribution) de n'importe quelle région, hors de son périmètre. Non appelés par les écrans CDV (le hook `useRegionAnalytics` n'est utilisé nulle part), mais exposés. | Ajouter un contrôle : ADMIN, ou utilisateur rattaché à la région demandée (comparaison `req.user.id_region`). |
| P2 | apps/web/src/Components/Dashboard/RoleDashboardShared.tsx:58-60 | `navigateTo` = `window.location.href` : les « Actions rapides » (RoleManagerDashboardPage.tsx:262-277) et le bouton « Examiner » (l.242) provoquent un full reload au lieu d'une navigation SPA, alors que le routeur (`lib/inertia-shim` / react-router `navigate`) est disponible. | Remplacer par le `navigate` du shim (déjà initialisé par `useInitRouter`). |
| P2 | apps/web/src/Components/Auth/AuthGuard.tsx:34 + apps/web/src/app.tsx:139-142 | Le guard et la redirection comparent `role_nom \|\| role` brut aux codes (`CDV`). Ça marche parce que le seed copie le code dans `role_nom` ; si `role_nom` devenait un libellé (« Chef District Vente »), le CDV serait éjecté en /403 et la redirection viserait une URL invalide. `resolveKnownRole` (config/rbac.ts:100-116) gère déjà les deux formes mais n'est pas utilisé ici. | Normaliser via `resolveKnownRole` dans `AuthGuard` et `DashboardRedirect`. |
| P3 | apps/web/src/config/nav.tsx:57-63 | `badge: 'notifications'` déclaré sur « À compléter » mais jamais rendu : la Sidebar n'affiche un badge que pour `/evaluations/validate` (Sidebar.tsx:266-268). | Implémenter le badge « à compléter » ou retirer la déclaration. |
| P3 | apps/web/src/pages/CDV/Performance.tsx, pages/CDV/Sectors.tsx, pages/CDV/Dashboard.tsx | Code mort : pages mock non routées (les routes redirigent), `Dashboard.tsx` simple ré-export de `Dashboard/index`. | Supprimer ces fichiers. |

## Endpoints consommés par les écrans CDV

| Endpoint | Statut |
|---|---|
| `GET /dashboard` | OK — JWT, scope self (dashboard.controller.ts:16-36) |
| `GET /analytics/scores` | OK — self (`req.user.matricule`, analytics.controller.ts:229-232) |
| `GET /analytics/axes-amelioration` | OK — self (l.74-77) |
| `GET /analytics/recommandations` | OK — self (l.218-221) |
| `POST /analytics/scores/batch` | OK — anti-IDOR via `assertCanViewMatricules` (l.234-238) |
| `POST /analytics/axes-amelioration/batch` | OK — anti-IDOR (l.79-83) |
| `POST /analytics/team-heatmap` | OK — anti-IDOR (l.261-265) |
| `GET /evaluations` (en_attente + a_valider) | OK — self (evaluations.controller.ts:14-22) |
| `GET /evaluations/historique` | OK — self (l.41-58) |
| `GET /evaluations/eligibles`, `GET /evaluations/periodes-actives` | OK — self (l.31-39) ; création protégée par le service d'éligibilité (evaluations.service.ts:276-279) |
| `GET /regles` | OK — JWT, règles publiées (regles.controller.ts:15) |
| `GET /hierarchy/subordonnes` | OK — self (hierarchy.controller.ts:33-36) |
| `GET /periodes` (filtres Historique) | OK — JWT (periodes.controller.ts:13) |
| `GET /notifications`, `/notifications/count`, `POST .../read` | OK — self (notifications.controller.ts) |
| `GET /analytics/region/:idRegion`, `.../classement` | **Sans RBAC** — non appelés par les écrans CDV mais accessibles avec un token CDV (voir P1) |

## Écrans partagés

- **À valider** (`/evaluations/validate`) : la file serveur `getAValider` est bornée aux subordonnés du manager (evaluations.service.ts:589-604) et `validate()` revérifie l'autorisation (l.507-523, ForbiddenException) — un CDV ne voit ni ne valide hors périmètre. Cohérent.
- **Mes évaluations / À compléter** : cibles fournies par `/evaluations/eligibles` (piloté par les règles serveur) — pas de bouton menant à un 403.
- **Mon équipe** : `useSubordonnes` self-scopé ; la section n'apparaît que si l'API confirme des rattachements. Cohérent.
- **Axes d'amélioration** : variante manager avec drill-down limité aux subordonnés (les requêtes par matricule passent par les endpoints protégés anti-IDOR) + carte « Mes propres axes » (AxesAmelioration/index.tsx:390-393). Cohérent.
