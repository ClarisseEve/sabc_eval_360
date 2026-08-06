# Audit rôle DR — Directeur Régional

**Verdict global : Dégradé**

**Résumé.** Le parcours DR est fonctionnel de bout en bout : routage guardé, sidebar RBAC data-driven, dashboard branché sur l'API réelle (React Query + Suspense), validation régionale correctement portée côté serveur. Deux problèmes majeurs subsistent : les échecs d'appels analytics sont avalés silencieusement (KPI à zéro présentés comme des données réelles) et deux endpoints analytics région restent accessibles sans contrôle de rôle ni de périmètre. Aucune donnée factice détectée ; le reste relève de full-reloads SPA et d'incohérences de libellés.

## 1. Routage & guards

- `apps/web/src/App.tsx:247` — `/dr/dashboard` sous `<R role="DR">` (AuthGuard `requiredRoles=['DR']`, bypass admin) : OK.
- `apps/web/src/App.tsx:260-261` — alias `/dr/teams` et `/dr/performance` → `Navigate` vers `/dr/dashboard`. Ce ne sont **pas** des liens morts déguisés : aucun lien de la sidebar (`apps/web/src/config/nav.tsx`) ne pointe vers eux ; ce sont des redirections d'URLs héritées (anciennes pages de démo supprimées). L'intention utilisateur (« mes équipes ») est toutefois perdue sans message.
- `apps/web/src/App.tsx:135-143` — `DashboardRedirect` construit `/${role.toLowerCase()}/dashboard` depuis `role_nom || role`. Fonctionne car le seed stocke le code (`role_nom: user.role`, `apps/api/prisma/seed.ts:890`), mais fragile si `role_nom` devenait un libellé long (« Directeur Régional » → 404).

## 2. Navigation / Sidebar (entrées visibles pour DR)

Filtrage : `apps/web/src/Components/Layout/app/Sidebar.tsx:113-126` sur `apps/web/src/config/nav.tsx`.

| Entrée | Cible | Écran réel ? |
|---|---|---|
| Tableau de bord | `/dr/dashboard` (resolveHref `:role`) | OK — `pages/DR/Dashboard/index.tsx` |
| Évaluations → Mes évaluations | `/evaluations/mine` | OK — `Mine.tsx` |
| Évaluations → À compléter | `/evaluations/pending` | OK — `Pending.tsx` |
| Évaluations → À valider (badge) | `/evaluations/validate` | OK — `ToValidate.tsx` ; toujours affiché pour DR (`Sidebar.tsx:71` portée régionale), cohérent avec le backend |
| Évaluations → Historique | `/evaluations/historique` | OK — `Historique.tsx` (loading/error gérés) |
| Mon équipe → Subordonnés / Évaluations équipe | `/equipe/subordonnes`, `/equipe/evaluations` | OK — affiché seulement si l'API confirme des subordonnés directs (`requiresDirectReports`, `Sidebar.tsx:59-70`) |
| Axes d'amélioration | `/axes-amelioration` | OK — scope « director » dédié (`pages/Common/AxesAmelioration/index.tsx:1068-1069`) |

Aucun placeholder ni lien mort dans la sidebar DR. La navigation sidebar utilise le `Link` du shim (client-side), pas de full-reload.

## 3. Dashboard DR

`pages/DR/Dashboard/index.tsx` → `RoleDirectorDashboardPage` (`apps/web/src/Components/Dashboard/RoleDirectorDashboardPage.tsx`), données via `useRoleDashboardData('director', 'DR')` (`apps/web/src/Hooks/queries/useRoleDashboards.ts:358-444`) : scores/axes/recommandations personnels, historique, file `a_valider`, règles publiées, subordonnés directs + hiérarchie complète + chaîne, analytics batch par membre. **Aucune donnée hardcodée** (`benchmarks-data.ts`, `evolution-data.ts` sont de purs transformateurs testés). Loading = `DashboardSkeleton` (Suspense), erreurs fatales = `ErrorBoundary`, empty states systématiques (`EmptyState`). KPI cohérents avec le rôle (pas de « Mon score » : DR dans `NON_EVALUATED_ROLES`, `useRoleDashboards.ts:130`, conforme au RBAC `canSelfEvaluate:false`).

## Tableau des constats

| Sévérité | Fichier:ligne | Constat | Recommandation |
|---|---|---|---|
| P1 | apps/web/src/Hooks/queries/useRoleDashboards.ts:369-407 | `Promise.allSettled` avale tous les échecs : si `/analytics/scores`, `/hierarchy/tous-subordonnes`, etc. échouent (500, 429 throttling à 30 req/min), le dashboard affiche « 0 évaluations », « Couverture 0% » comme si c'étaient des données réelles. Aucun état d'erreur partiel. | Propager au moins un indicateur d'erreur par bloc (bandeau « données indisponibles ») quand un `status === 'rejected'`. |
| P1 | apps/api/src/analytics/analytics.controller.ts:64-72 | `GET /analytics/region/:idRegion` et `GET /analytics/region/:idRegion/classement` n'ont ni `@Roles` ni contrôle de périmètre (contrairement aux batchs protégés par `assertCanViewMatricules`). Tout utilisateur authentifié — un DR sur une autre région, ou n'importe quel agent — peut lire les agrégats et le classement nominatif de n'importe quelle région. | Ajouter un contrôle : ADMIN, ou DR/CDTT dont `id_region` correspond au paramètre. |
| P2 | apps/web/src/Components/Dashboard/RoleDirectorDashboardPage.tsx:268 ; apps/web/src/Components/Dashboard/RoleDashboardShared.tsx:58-60,294-314 | Bouton « Examiner » et toutes les « Actions rapides » naviguent par `window.location.href` → full reload (perte du cache React Query et de l'état SPA). | Utiliser `useNavigate()`/`Link` de react-router. |
| P2 | apps/api/src/evaluations/eligibility.service.ts:145-151 vs 58-69 | `getEligibleTargets` renvoie toujours la cible `auto` (et les `pairs`) sans vérifier `peut_auto_evaluer`/`peut_evaluer_pairs`, alors que `canEvaluate` la refusera (403) à la création pour un DR. Le DR voit un groupe « Auto-évaluation » sur `/evaluations/mine` ; le bouton n'est désactivé que si aucune règle `auto` publiée ne matche (`Mine.tsx:195-219`) — une règle mal configurée rend l'action cliquable puis 403. | Filtrer les groupes retournés par `/evaluations/eligibles` selon les flags du rôle. |
| P2 | apps/web/src/Hooks/queries/useEvaluationWorkflow.ts:19-31 | `loadAllRejectedEvaluations` boucle jusqu'à 100 requêtes séquentielles `/evaluations/historique?statut=rejete` à chaque montage des pages évaluations (index, Mine, Pending, ToValidate). | Un endpoint dédié ou un seul appel avec limite serveur. |
| P3 | apps/web/src/App.tsx:260-261 | Alias `/dr/teams` et `/dr/performance` redirigent silencieusement vers le dashboard : l'intention (vue équipes / performance) est perdue. | Rediriger vers `/equipe/subordonnes` (teams) et conserver dashboard pour performance, ou afficher un toast. |
| P3 | apps/web/src/Components/Dashboard/RoleDirectorDashboardPage.tsx:245 | Description « Évaluations soumises par vos subordonnés directs » inexacte pour un DR : la file `a_valider` couvre toute la région (apps/api/src/evaluations/evaluations.service.ts:603-608). | Adapter le libellé (« de votre périmètre régional »). |
| P3 | apps/web/src/Components/Dashboard/RoleDirectorDashboardPage.tsx:291-292 | Actions rapides pointant vers `/common/evaluations/pending` et `/common/evaluations/mine` (routes legacy) au lieu des routes canoniques `/evaluations/...`. Fonctionnel (alias App.tsx:294-295) mais duplique les URLs. | Normaliser sur les routes canoniques. |
| P3 | apps/web/src/Components/Layout/app/Sidebar.tsx:74-82 | Le badge « À valider » recharge la liste complète `GET /evaluations` (payload entier enrichi) juste pour un compteur. | Endpoint de comptage léger. |
| P3 | apps/web/src/Hooks/queries/useDashboardQuery.ts:32-37 | `useRegionAnalytics` (GET /analytics/region/:id) n'est consommé par aucun écran : code mort qui entretient l'endpoint non protégé ci-dessus. | Supprimer le hook ou brancher un écran DR avec RBAC serveur. |

## Endpoints consommés par les écrans DR

| Endpoint | Statut |
|---|---|
| GET /dashboard | OK (`dashboard.controller.ts:16`, scope utilisateur) |
| GET /analytics/scores, /axes-amelioration, /recommandations | OK (self, JWT) |
| POST /analytics/scores/batch, /axes-amelioration/batch | OK — RBAC objet `assertCanViewMatricules` (`analytics.controller.ts:24-41`) : IDOR bloqué |
| GET /hierarchy/subordonnes, /tous-subordonnes, /chaine | OK — scopés sur `req.user.matricule` (`hierarchy.controller.ts:33-46`) |
| GET /evaluations, /evaluations/historique, /evaluations/eligibles, /evaluations/periodes-actives | OK (scope utilisateur) |
| GET /evaluations/:id, PUT /evaluations/:id, POST /evaluations/:id/submit | OK — `assertCanViewEvaluation` / `assertEvaluationOwner` (`evaluations.service.ts:311-358`) |
| POST /evaluations/:id/validate | OK — `peutValider` : manager direct ou DR/CDTT même région (`validation-manager.service.ts:41-63`) |
| GET /regles | OK (JWT ; règles publiées, lecture volontairement large) |
| GET /notifications, /notifications/count, POST /notifications/:id/read, /notifications/read-all | OK (`notifications.controller.ts`) |
| GET /analytics/region/:idRegion, /region/:idRegion/classement | **Sans RBAC** (JWT seul, aucun contrôle de rôle ni de région) — non appelé par les écrans DR actuels mais exposé |

## 5. Écrans partagés

- `/evaluations/validate` : deep-link `?id=` du dashboard correctement géré (`ToValidate.tsx:52-60`) ; la file affichée = exactement ce que le DR peut valider (même service serveur). Pas de bouton voué au 403.
- `/evaluations/mine` : groupe « Auto-évaluation » listé pour DR alors que la création serait refusée (voir P2 ci-dessus) ; bouton « Évaluer » désactivé tant qu'aucune règle applicable — mitigation partielle, dépendante des règles publiées.
- `/equipe/subordonnes`, `/equipe/evaluations` : données réelles (`hierarchyApi.getSubordonnes`), pas d'action d'écriture, RAS.
- `/axes-amelioration` : scope « director » réel (drill-down hiérarchique), aucun appel `adminApi` hors scope admin — pas de 403 latent.
