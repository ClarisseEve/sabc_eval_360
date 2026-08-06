# Audit rôle CSC — Chef Service Commercial

**Verdict global : Dégradé**

**Résumé.** Le CSC utilise le dashboard « manager » (périmètre direct) : routes guardées, sidebar RBAC correcte, données 100 % API (React Query + Suspense) incluant une heatmap équipe protégée contre l'IDOR côté serveur. Les mêmes défauts transverses que DR/CDTT s'appliquent : échecs analytics silencieux (KPI à zéro sans état d'erreur) et endpoints `analytics/region/*` interrogeables par un CSC pour n'importe quelle région (fuite inter-périmètres). Le CSC pouvant s'auto-évaluer et évaluer pairs/subordonnés, aucun décalage éligibilité UI/serveur ne le concerne.

## 1. Routage & guards

- `apps/web/src/App.tsx:249` — `/csc/dashboard` sous `<R role="CSC">` : OK.
- `apps/web/src/App.tsx:268-269` — alias `/csc/districts` et `/csc/performance` → redirection vers `/csc/dashboard`. Pas des liens morts déguisés (aucune entrée de nav ne les référence) ; anciennes pages de démo supprimées, intention perdue sans message.
- Attention de fond : `normalizeRole` (`apps/web/src/config/rbac.ts:118-122`) rabat tout rôle inconnu sur **CSC** par défaut — un rôle mal orthographié côté données serait traité comme un CSC dans la sidebar et les capacités frontend (le guard de route et le RBAC serveur, eux, refuseraient).

## 2. Navigation / Sidebar (entrées visibles pour CSC)

| Entrée | Cible | Écran réel ? |
|---|---|---|
| Tableau de bord | `/csc/dashboard` | OK — `pages/CSC/Dashboard/index.tsx` |
| Évaluations → Mes évaluations / À compléter / Historique | `/evaluations/*` | OK |
| Évaluations → À valider (badge) | `/evaluations/validate` | OK — affiché seulement si subordonnés directs réels ou file non vide (`Sidebar.tsx:69-84`) : pas de portée régionale pour CSC, cohérent avec le serveur (manager direct uniquement, `validation-manager.service.ts:41-43`) |
| Mon équipe → Subordonnés / Évaluations équipe | `/equipe/*` | OK — conditionné par `requiresDirectReports` + confirmation API |
| Axes d'amélioration | `/axes-amelioration` | OK — scope « manager » (`AxesAmelioration/index.tsx:67,1072-1073`) |

Aucun placeholder ni dead link ; navigation sidebar client-side.

## 3. Dashboard CSC

`pages/CSC/Dashboard/index.tsx` → `RoleManagerDashboardPage` (`apps/web/src/Components/Dashboard/RoleManagerDashboardPage.tsx`), données via `useRoleDashboardData('manager', 'CSC')` : file d'actions (brouillons + validations), score personnel (affiché car CSC est évaluable : `canSeeSelfScore`, `useRoleDashboards.ts:419`), score moyen et couverture équipe, moyennes par type, axes dominants, heatmap équipe (`POST /analytics/team-heatmap` en une requête agrégée, avec état `isLoading` dédié — `RoleManagerDashboardPage.tsx:90-95,178-184` et `TeamHeatmapCard.tsx:56-59`), tableau des subordonnés directs, alertes calculées, règles actives, actions rapides. **Aucune donnée factice** ; empty states partout ; skeleton au chargement ; ErrorBoundary.

## Tableau des constats

| Sévérité | Fichier:ligne | Constat | Recommandation |
|---|---|---|---|
| P1 | apps/web/src/Hooks/queries/useRoleDashboards.ts:369-407 | `Promise.allSettled` sans état d'erreur : un échec de `/hierarchy/subordonnes` ou des batchs analytics affiche « Score moyen — », « Couverture 0% », « 0 collaborateur » comme données réelles (le throttle analytics 30 req/min, `analytics.controller.ts:12`, rend ce cas plausible). | Remonter un indicateur d'erreur par bloc de données. |
| P1 | apps/api/src/analytics/analytics.controller.ts:64-72 | `GET /analytics/region/:idRegion` et `/classement` : JWT seul, aucun `@Roles` ni contrôle de périmètre. Un CSC peut lire les agrégats et le classement nominatif de n'importe quelle région — données hors de son périmètre (ses accès légitimes passent par les batchs contrôlés par `assertCanViewMatricules`). | Restreindre à ADMIN + DR/CDTT de la région. |
| P2 | apps/web/src/Components/Dashboard/RoleManagerDashboardPage.tsx:242,262-276 ; RoleDashboardShared.tsx:58-60 | « Examiner » (via `navigateTo`) et « Actions rapides » = `window.location.href` → full reload, perte du cache React Query. | `useNavigate()`/`Link`. |
| P2 | apps/web/src/Hooks/queries/useEvaluationWorkflow.ts:19-31 | Jusqu'à 100 requêtes séquentielles `historique?statut=rejete` à chaque montage des pages évaluations. | Endpoint agrégé ou limite. |
| P3 | apps/web/src/App.tsx:268-269 | Alias `/csc/districts` et `/csc/performance` redirigent silencieusement vers le dashboard. | Toast ou ancre vers la section équipe du dashboard. |
| P3 | apps/web/src/Components/Dashboard/RoleManagerDashboardPage.tsx:63-73 | Alerte « Baisse de performance » émise avec `severity: 'info'` (incohérent avec sa gravité) et un détail brut « X est à -0.4 » sans unité ni contexte. | Sévérité `warning` + libellé « progression de −0,4 pt vs période précédente ». |
| P3 | apps/web/src/Components/Dashboard/RoleManagerDashboardPage.tsx:268-269 | Actions rapides vers routes legacy `/common/evaluations/*` au lieu de `/evaluations/*` (fonctionnel via alias App.tsx:294-295). | Normaliser. |
| P3 | apps/web/src/Components/Layout/app/Sidebar.tsx:74-82 | Compteur « À valider » obtenu en rechargeant `GET /evaluations` complet toutes les 60 s. | Endpoint de comptage. |

## Endpoints consommés par les écrans CSC

| Endpoint | Statut |
|---|---|
| GET /dashboard | OK |
| GET /analytics/scores, /axes-amelioration, /recommandations (self) | OK |
| POST /analytics/scores/batch, /axes-amelioration/batch | OK — bornés aux subordonnés via `assertCanViewMatricules` (`analytics.controller.ts:24-41`) |
| POST /analytics/team-heatmap | OK — même contrôle IDOR (`analytics.controller.ts:261-265`) |
| GET /analytics/benchmarks/:matricule, /evolution/:matricule | OK — contrôlés (`analytics.controller.ts:247-258`) ; utilisés par le dashboard « individual », pas par le CSC actuellement |
| GET /hierarchy/subordonnes | OK — scopé `req.user` |
| GET /evaluations, /historique, /eligibles, /periodes-actives | OK |
| GET/PUT /evaluations/:id, POST /evaluations/:id/submit | OK — contrôles objet (`evaluations.service.ts:311-358`) |
| POST /evaluations/:id/validate | OK — refusé si l'évalué n'est pas subordonné direct (`validation-manager.service.ts:41-49`) |
| GET /regles | OK |
| GET /notifications, /count, POST :id/read, read-all | OK |
| GET /analytics/region/:idRegion, /classement | **Sans RBAC** (voir P1) — non appelé par les écrans CSC mais atteignable |

## 5. Écrans partagés

- `/evaluations/validate` : la file affichée provient du même service que l'autorisation (`getAValider` filtre par `peutValiderUtilisateurs`, `evaluations.service.ts:610-643`) → aucun bouton « Examiner » voué au 403 ; deep-link `?id=` géré (`ToValidate.tsx:52-60`).
- `/evaluations/mine` : CSC a `peut_auto_evaluer`, `peut_evaluer_pairs`, `peut_evaluer_subordonnes` → les trois groupes affichés correspondent à des créations autorisées serveur ; pairs contraints à même niveau + même région des deux côtés (`eligibility.service.ts:94-102,132-142`). Cohérent.
- `/equipe/subordonnes`, `/equipe/evaluations` : lecture seule sur données réelles, RAS.
- `/axes-amelioration` : scope « manager » n'appelle aucun endpoint admin (les appels `adminApi.*` sont confinés au scope admin, `AxesAmelioration/index.tsx:712-783`) — pas de 403 latent.
