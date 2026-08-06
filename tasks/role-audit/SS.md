# Audit rôle SS — Superviseur Sponsoring

**Verdict global : OK (avec réserves mineures)**

**Résumé** : Le soupçon de « coquille vide » est obsolète : `/ss/dashboard` rend un vrai dashboard manager branché sur l'API (React Query, Suspense + skeleton, ErrorBoundary, EmptyState partout). Les anciennes coquilles (`Assistants.tsx`, `Events.tsx`, avec le commentaire « Contenu à implémenter ») existent encore comme fichiers mais ne sont plus routées — leurs URLs redirigent proprement vers le dashboard et aucun lien de l'app n'y pointe. Les endpoints consommés existent tous côté NestJS et sont protégés (auth + contrôle IDOR sur les batchs analytics) ; reste un endpoint analytics région sans contrôle de rôle côté serveur.

## 1. Routage & guards

- Route dashboard : `apps/web/src/App.tsx:253` — `<Route path="/ss/dashboard" element={<R role="SS"><SSDashboard /></R>} />`. Guard `R` (App.tsx:161-163) → `AuthGuard requiredRoles={['SS']}`.
- Alias : `/ss/assistants` et `/ss/events` (App.tsx:272-273) → `<Navigate to="/ss/dashboard" replace />` sous guard SS. **Ce ne sont pas des liens morts déguisés** : aucun composant ne génère de lien vers ces URLs (grep exhaustif : seules occurrences dans App.tsx) ; elles n'existent que pour absorber d'anciens favoris.
- `DashboardRedirect` (App.tsx:135-143) : `/` et `/dashboard` → `/ss/dashboard` pour un SS (via `(role_nom || role).toUpperCase()`).

## 2. Navigation / Sidebar

Config data-driven : `apps/web/src/config/nav.tsx`, filtrage RBAC dans `apps/web/src/Components/Layout/app/Sidebar.tsx:113-126`. Entrées visibles pour SS :

| Entrée | Cible | État |
|---|---|---|
| Tableau de bord | `/ss/dashboard` (nav.tsx:41 + `resolveHref`) | Écran réel |
| Évaluations → Mes évaluations | `/evaluations/mine` (App.tsx:283) | Écran réel |
| Évaluations → À compléter | `/evaluations/pending` (App.tsx:284) | Écran réel |
| Évaluations → À valider | `/evaluations/validate` (App.tsx:285) — conditionnel : SS ∈ `VALIDATION_QUEUE_ROLES` (nav.tsx:36) + vérif data-driven Sidebar.tsx:69-84 (subordonnés réels ou file `a_valider` non vide) | Écran réel |
| Évaluations → Historique | `/evaluations/historique` (App.tsx:288) | Écran réel |
| Mon équipe → Subordonnés / Évaluations équipe | `/equipe/subordonnes`, `/equipe/evaluations` (App.tsx:305-306) — affiché seulement si `/hierarchy/subordonnes` retourne des membres (nav.tsx:35 + Sidebar.tsx:59-70) ; le seed rattache les AS aux SS (`apps/api/prisma/seed.ts:400-403`) donc visible en pratique | Écrans réels |
| Axes d'amélioration | `/axes-amelioration` (App.tsx:307) | Écran réel |

Tous les liens utilisent le `Link` du shim (`react-router` sous le capot, `apps/web/src/lib/inertia-shim.tsx:12,345`) — navigation SPA, pas de full reload **dans la sidebar**.

## 3. Dashboard

`apps/web/src/pages/SS/Dashboard/index.tsx:9-14` → `RoleManagerDashboardPage` (fallbackRole="SS") sous `ErrorBoundary` + `Suspense fallback={<DashboardSkeleton />}`.

- **Données réelles** : `useRoleDashboardData('manager', …)` (`apps/web/src/Hooks/queries/useRoleDashboards.ts:358-444`) agrège 7 appels API réels (scores, axes, recommandations, historique, évaluations en attente, règles, subordonnés directs) + 2 batchs analytics équipe (`scores/batch`, `axes-amelioration/batch`, useRoleDashboards.ts:232-259) + heatmap agrégée (`RoleManagerDashboardPage.tsx:90-95`). Aucune donnée factice/hardcodée.
- **États** : skeleton via Suspense ; `EmptyState` sur chaque carte (ex. RoleManagerDashboardPage.tsx:142-143, 190, 204) ; erreurs réseau absorbées par `Promise.allSettled` + ErrorBoundary.
- **KPI cohérents** : « Actions à traiter » = brouillons + validations ; « Score moyen équipe » calculé sur membres notés ; « Taux de couverture » = part des membres avec score consolidé ; alertes dérivées des données (`buildManagerAlerts`, lignes 48-76).

## 4. Constats

| Sévérité | Fichier:ligne | Constat | Recommandation |
|---|---|---|---|
| P1 | apps/api/src/analytics/analytics.controller.ts:64-72 | `GET /analytics/region/:idRegion` et `GET /analytics/region/:idRegion/classement` n'ont ni `@Roles` ni contrôle de périmètre : un SS authentifié peut lire les analytics agrégées (scores, classement nominatif) de n'importe quelle région, hors de son périmètre sponsoring. Non consommé par les écrans SS, mais exposé. | Ajouter un contrôle : ADMIN, ou utilisateur rattaché à la région (`user.id_region === idRegion`), ou manager dont la chaîne couvre la région. |
| P2 | apps/web/src/Components/Dashboard/RoleDashboardShared.tsx:58-60 | `navigateTo` = `window.location.href` : les boutons « Actions rapides » (RoleManagerDashboardPage.tsx:262-277) et « Examiner » (lignes 240-246) provoquent un rechargement complet de la SPA (perte du cache React Query, flash). | Remplacer par `useNavigate()`/`Link` de react-router (le shim `router.visit` existe déjà). |
| P2 | apps/web/src/Components/Auth/AuthGuard.tsx:33-38 + apps/web/src/App.tsx:139 | Le guard compare `(user.role_nom \|\| user.role).toUpperCase()` brut à `'SS'`. Ça fonctionne car le seed écrit le code dans `role_nom` (seed.ts:890 `role_nom: user.role`), mais si `role_nom` devient un libellé (« Superviseur sponsoring », colonne VarChar(50) prévue pour ça), tout SS serait envoyé sur `/403` et `DashboardRedirect` produirait `/superviseur sponsoring/dashboard` → 404. La Sidebar, elle, passe par `normalizeRole`/`resolveKnownRole` (rbac.ts:100-116). | Utiliser `resolveKnownRole` dans `AuthGuard` et `DashboardRedirect` pour unifier la résolution de rôle. |
| P3 | apps/web/src/pages/SS/Assistants.tsx:26 + apps/web/src/pages/SS/Events.tsx | Coquilles vides historiques (« Contenu à implémenter », props Inertia `auth.user` obsolètes) non routées : code mort. | Supprimer les deux fichiers (et leurs équivalents des autres rôles). |
| P3 | apps/web/src/config/nav.tsx:57-63 + Sidebar.tsx:266-302 | `badge: 'notifications'` déclaré sur « À compléter » n'est jamais rendu : `renderLeafItem` ne gère un badge que pour `/evaluations/validate`. | Brancher le badge sur le compteur `en_attente`, ou retirer la propriété. |
| P3 | apps/web/src/config/rbac.ts:78-83 vs apps/api/prisma/seed.ts:270-272 | Divergence référentiel : front SS `canCrossBranch:false` vs rôle DB `peut_cross_branch:true` (et `pairs` idem). Sans effet aujourd'hui (seul `canEvaluateSubs` est consommé côté front), mais deux sources de vérité divergentes. | Servir les capacités du rôle via l'API (`roles`) plutôt que les dupliquer en dur côté front. |

## 5. Écrans partagés

- `/evaluations/*` : entièrement pilotés par les données serveur (`/evaluations` renvoie `en_attente`/`a_valider` scopés au matricule, evaluations.controller.ts:14-22 ; création force `evaluateur_matricule = req.user.matricule`, lignes 24-29). Le CTA « Démarrer » du hub est désactivé si aucune règle applicable (`pages/Common/Evaluations/index.tsx:28-45`) → pas de bouton menant à un 403.
- `/evaluations/validate` : le deep-link `?id=` posé par le dashboard est bien lu (`ToValidate.tsx:50-52`) ; côté serveur `getAValider` filtre par `manager_matricule` et `validate` lève `ForbiddenException` si non autorisé (evaluations.service.ts:507-604). Cohérent.
- `/equipe/*` : lecture seule des subordonnés réels (`pages/Common/Team/Overview.tsx:11-12`), empty state propre si aucun.
- Notifications : le Header interroge lui-même `/notifications` + `/notifications/count` (Header.tsx:111-112) ; le `notifications={[]}` passé par `DashboardPageFrame` (RoleDashboardShared.tsx:166) n'est qu'une valeur initiale.

## Endpoints

| Endpoint appelé (écrans SS) | Statut |
|---|---|
| `GET /dashboard` | OK — JwtAuthGuard, scopé au matricule (dashboard.controller.ts:16-36) |
| `GET /analytics/scores` / `GET /analytics/axes-amelioration` / `GET /analytics/recommandations` | OK — self only (analytics.controller.ts:74-77, 218-232) |
| `POST /analytics/scores/batch` / `POST /analytics/axes-amelioration/batch` / `POST /analytics/team-heatmap` | OK — anti-IDOR `assertCanViewMatricules` (soi + subordonnés, analytics.controller.ts:24-41) |
| `GET /evaluations` / `GET /evaluations/historique` | OK — scopés `req.user.matricule` (evaluations.controller.ts:14-22, 41-57) |
| `GET /regles` | OK — règles actives publiées, lecture ouverte à tout authentifié (regles.controller.ts:15-18), mutations réservées ADMIN |
| `GET /hierarchy/subordonnes` | OK — scopé au matricule (hierarchy.controller.ts:33-36) |
| `GET /notifications` / `GET /notifications/count` / `POST /notifications/:id/read` | OK (notifications.controller.ts) |
| `GET /analytics/region/:idRegion` (+ `/classement`) | **Sans RBAC** — accessible à tout authentifié, non consommé par les écrans SS mais exposé (voir P1) |

Aucun endpoint appelé par les écrans SS n'est manquant côté API.
