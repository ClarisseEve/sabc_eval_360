# Audit rôle CDTT — Chef Département Trade

**Verdict global : Dégradé**

**Résumé.** Le CDTT partage l'architecture « director » du DR : mêmes routes guardées, même sidebar RBAC, même dashboard branché sur l'API réelle, avec en plus une bascule par domaine (commercial/marketing/sponsoring) purement locale et correctement bornée. Il hérite donc des deux mêmes problèmes majeurs : échecs analytics avalés silencieusement (KPI à zéro trompeurs) et endpoints `analytics/region/*` sans contrôle de rôle. La portée de validation régionale DR/CDTT est correctement implémentée côté serveur ; les défauts restants sont des full-reloads et des libellés.

## 1. Routage & guards

- `apps/web/src/App.tsx:248` — `/cdtt/dashboard` sous `<R role="CDTT">` : OK.
- `apps/web/src/App.tsx:262-263` — alias `/cdtt/commercial` et `/cdtt/marketing` → redirection vers `/cdtt/dashboard`. Pas des liens morts déguisés (rien ne pointe vers eux dans `config/nav.tsx`), mais l'intention « vue commercial » / « vue marketing » est perdue alors que le dashboard possède justement une bascule domaine : la redirection pourrait présélectionner le filtre (query param), elle ne le fait pas.
- `apps/web/src/App.tsx:135-143` — `DashboardRedirect` : même fragilité que DR (dépend de `role_nom` = code, garanti par le seed `apps/api/prisma/seed.ts:890`).

## 2. Navigation / Sidebar (entrées visibles pour CDTT)

Identiques à DR (`config/nav.tsx` : CDTT présent dans `ALL_OPERATIONAL`, `ROLES_WITH_POTENTIAL_REPORTS`, `VALIDATION_QUEUE_ROLES`) :

| Entrée | Cible | Écran réel ? |
|---|---|---|
| Tableau de bord | `/cdtt/dashboard` | OK — `pages/CDTT/Dashboard/index.tsx` |
| Évaluations → Mes évaluations / À compléter / À valider / Historique | `/evaluations/*` | OK — écrans réels ; « À valider » toujours affiché pour CDTT (`Sidebar.tsx:71`, portée régionale), cohérent avec `validation-manager.service.ts:52-56` |
| Mon équipe → Subordonnés / Évaluations équipe | `/equipe/*` | OK — conditionné aux subordonnés réels retournés par l'API |
| Axes d'amélioration | `/axes-amelioration` | OK — scope « director » (`AxesAmelioration/index.tsx:68,1068`) |

Aucun placeholder, aucun dead link, navigation sidebar client-side.

## 3. Dashboard CDTT

`pages/CDTT/Dashboard/index.tsx` → `RoleDirectorDashboardPage` avec `enableDomaineToggle` (`RoleDirectorDashboardPage.tsx:190-225`). Données réelles via `useRoleDashboardData('director', 'CDTT')`. Spécificités vérifiées :

- Bascule domaine : filtre **local** (`filterByDomaine`, `apps/web/src/config/rbac.ts:156-162`) sur le périmètre déjà chargé — pas de requête supplémentaire ; `getDomaine` résout aussi bien les codes (`RTM`) que les libellés (`Regional Trade Marketing`) via `resolveKnownRole` (`rbac.ts:100-116`). Un domaine sans effectif est désactivé (`RoleDirectorDashboardPage.tsx:217`). Correct.
- Pas de KPI « Mon score » : CDTT dans `NON_EVALUATED_ROLES` (`useRoleDashboards.ts:130`), conforme à `canSelfEvaluate:false`.
- Loading (DashboardSkeleton), empty states et ErrorBoundary présents ; aucune donnée factice.

## Tableau des constats

| Sévérité | Fichier:ligne | Constat | Recommandation |
|---|---|---|---|
| P1 | apps/web/src/Hooks/queries/useRoleDashboards.ts:369-407 | `Promise.allSettled` sans remontée d'erreur : un échec de `/hierarchy/tous-subordonnes` ou des batchs analytics (throttle 30 req/min, `analytics.controller.ts:12`) affiche un périmètre Trade vide et « Couverture 0% » sans signal d'erreur. | Afficher un état d'erreur partiel par bloc. |
| P1 | apps/api/src/analytics/analytics.controller.ts:64-72 | `GET /analytics/region/:idRegion` + `/classement` accessibles à tout utilisateur authentifié, sans `@Roles` ni vérification que la région demandée est celle du CDTT. Fuite potentielle de données d'autres périmètres régionaux. | Restreindre à ADMIN + DR/CDTT de la région concernée. |
| P2 | apps/web/src/Components/Dashboard/RoleDirectorDashboardPage.tsx:268 ; RoleDashboardShared.tsx:58-60,294-314 | « Examiner » et « Actions rapides » en `window.location.href` → full reload à chaque clic. | `useNavigate()`/`Link` react-router. |
| P2 | apps/api/src/evaluations/eligibility.service.ts:145-151 vs 58-69 | Cible « auto » retournée au CDTT par `/evaluations/eligibles` alors que `peut_auto_evaluer` sera refusé à la création (403). Bouton seulement neutralisé si aucune règle `auto` publiée ne matche (`Mine.tsx:195-219`). | Filtrer les groupes selon les flags du rôle côté serveur. |
| P2 | apps/web/src/Hooks/queries/useEvaluationWorkflow.ts:19-31 | Jusqu'à 100 requêtes séquentielles pour charger tous les rejets à chaque page évaluations. | Endpoint agrégé ou limite. |
| P3 | apps/web/src/App.tsx:262-263 | `/cdtt/commercial` et `/cdtt/marketing` redirigent vers le dashboard sans présélectionner la bascule domaine correspondante. | Rediriger avec un query param (`?domaine=commercial`) lu par le toggle. |
| P3 | apps/web/src/Components/Dashboard/RoleDirectorDashboardPage.tsx:245 | « Soumises par vos subordonnés directs » inexact : la file du CDTT couvre sa région (`evaluations.service.ts:603-608`, `validation-manager.service.ts:58-63`). | Corriger le libellé. |
| P3 | apps/web/src/Components/Dashboard/RoleDirectorDashboardPage.tsx:291-292 | Actions rapides vers les routes legacy `/common/evaluations/*` au lieu de `/evaluations/*`. | Normaliser. |
| P3 | apps/web/src/Components/Layout/app/Sidebar.tsx:74-82 | Compteur « À valider » obtenu en rechargeant la liste complète `GET /evaluations`. | Endpoint de comptage. |

## Endpoints consommés par les écrans CDTT

| Endpoint | Statut |
|---|---|
| GET /dashboard | OK |
| GET /analytics/scores, /axes-amelioration, /recommandations (self) | OK |
| POST /analytics/scores/batch, /axes-amelioration/batch | OK — `assertCanViewMatricules` (`analytics.controller.ts:24-41`) limite aux subordonnés du CDTT |
| GET /hierarchy/subordonnes, /tous-subordonnes, /chaine | OK — scopés `req.user` |
| GET /evaluations, /historique, /eligibles, /periodes-actives | OK |
| GET/PUT /evaluations/:id, POST /evaluations/:id/submit | OK — contrôles objet (`evaluations.service.ts:311-358`) |
| POST /evaluations/:id/validate | OK — portée régionale CDTT vérifiée serveur (`validation-manager.service.ts:52-63`) |
| GET /regles | OK |
| GET /notifications, /count, POST :id/read, read-all | OK |
| GET /analytics/region/:idRegion, /classement | **Sans RBAC** (voir P1) — non appelé par les écrans CDTT actuels |

## 5. Écrans partagés

- `/evaluations/validate` : file serveur = manager direct **ou** portée régionale CDTT → tout ce qui est affiché est actionnable, pas de 403 latent ; deep-link `?id=` géré (`ToValidate.tsx:52-60`).
- `/evaluations/mine` : groupe « Auto-évaluation » affiché à tort pour CDTT (voir P2). Les groupes « Pairs » sont contraints serveur à même niveau + même région (`eligibility.service.ts:94-102`) — cohérent.
- `/equipe/subordonnes`, `/equipe/evaluations`, `/axes-amelioration` : données réelles, pas d'action admin exposée, RAS.
