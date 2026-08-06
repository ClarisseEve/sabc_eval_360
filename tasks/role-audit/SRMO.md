# Audit rôle SRMO — Superviseur Regional Marketing Operation

**Verdict global : Dégradé**

**Résumé** : `/srmo/dashboard` n'est plus une coquille vide au sens « Contenu à implémenter » : il rend le vrai `RoleManagerDashboardPage` avec données API, skeleton et empty states. Mais c'est un dashboard **manager** attribué à un rôle qui, dans le référentiel serveur, n'a ni subordonnés rattachés (TMO et SRMO rapportent tous deux au RTM) ni le droit d'évaluer des subordonnés (`peut_evaluer_subordonnes:false`) : toutes les cartes « équipe » restent donc vides en permanence — une coquille vide *de fait* pour la moitié de l'écran. Les endpoints consommés existent et sont protégés côté API.

## 1. Routage & guards

- Route dashboard : `apps/web/src/App.tsx:255` — `<Route path="/srmo/dashboard" element={<R role="SRMO"><SRMODashboard /></R>} />`. Guard `R` (App.tsx:161-163) → `AuthGuard requiredRoles={['SRMO']}`.
- Alias : `/srmo/campaigns` et `/srmo/operators` (App.tsx:276-277) → `Navigate replace` vers `/srmo/dashboard` sous guard SRMO. **Pas des liens morts déguisés** : aucun lien interne ne les cible (seules occurrences dans App.tsx) ; pure compatibilité d'URL.
- `DashboardRedirect` (App.tsx:135-143) : `/` → `/srmo/dashboard`.

## 2. Navigation / Sidebar

Config : `apps/web/src/config/nav.tsx` ; filtrage `Sidebar.tsx:113-126`. Entrées visibles pour SRMO :

| Entrée | Cible | État |
|---|---|---|
| Tableau de bord | `/srmo/dashboard` | Écran réel (mais voir P1 ci-dessous) |
| Évaluations → Mes évaluations / À compléter / Historique | `/evaluations/mine`, `/evaluations/pending`, `/evaluations/historique` | Écrans réels |
| Évaluations → À valider | SRMO ∈ `VALIDATION_QUEUE_ROLES` (nav.tsx:35-36) mais l'entrée est masquée data-driven (Sidebar.tsx:69-84) tant que `/hierarchy/subordonnes` est vide et la file `a_valider` vide — cas nominal du SRMO seedé. Comportement correct, pas de lien mort. | Masqué en pratique |
| Mon équipe | SRMO ∈ `ROLES_WITH_POTENTIAL_REPORTS` (nav.tsx:35) mais `requiresDirectReports` masque l'entrée puisque l'API ne remonte aucun subordonné. Correct. | Masqué en pratique |
| Axes d'amélioration | `/axes-amelioration` (App.tsx:307) | Écran réel |

## 3. Dashboard

`apps/web/src/pages/SRMO/Dashboard/index.tsx:10` → `RoleManagerDashboardPage` (fallbackRole="SRMO"), ErrorBoundary + Suspense/`DashboardSkeleton`.

- **Données réelles** pour la partie « self » : scores, axes, recommandations, évaluations en attente, règles (useRoleDashboards.ts:369-389). Pas de mock.
- **Partie équipe structurellement vide** : le scope 'manager' alimente l'équipe via `GET /hierarchy/subordonnes` (useRoleDashboards.ts:386, 399). Or le seed n'assigne **aucun** subordonné aux SRMO — `['TMO', 'SRMO'].includes(entry.role)` → manager = RTM (`apps/api/prisma/seed.ts:396-399`). Résultat pour tout SRMO : « Score moyen équipe — », « Taux de couverture 0% », graphique « Score moyen par type » vide, heatmap vide (requête même pas lancée, `enabled: teamMatricules.length > 0`, RoleManagerDashboardPage.tsx:93), tableau équipe vide, alertes vides. La moitié de l'écran n'affichera jamais rien.
- Les empty states sont propres (pas de crash, pas de spinner infini), mais l'écran ne correspond pas à la réalité du rôle.

## 4. Constats

| Sévérité | Fichier:ligne | Constat | Recommandation |
|---|---|---|---|
| P1 | apps/web/src/pages/SRMO/Dashboard/index.tsx:10 + apps/web/src/config/rbac.ts:84-90 vs apps/api/prisma/seed.ts:258 et 396-399 | Incohérence de conception : le front traite SRMO comme un manager (`RoleManagerDashboardPage`, `canEvaluateSubs:true`, `directSubsOnly`), alors que le référentiel serveur dit l'inverse : rôle R0008 `peut_evaluer_subordonnes:false` (seed.ts:258) et hiérarchie seedée sans aucun subordonné SRMO (TMO → RTM, seed.ts:396-399). Le dashboard SRMO affiche en permanence des cartes équipe vides : coquille vide de fait. | Trancher le modèle métier : (a) si SRMO est un contributeur individuel → basculer sur `RoleIndividualDashboardPage` et corriger `rbac.ts` (`canEvaluateSubs:false`) ; (b) si SRMO doit superviser des TMO → corriger le seed (rattachement TMO→SRMO + `peut_evaluer_subordonnes:true`). |
| P1 | apps/api/src/analytics/analytics.controller.ts:64-72 | `GET /analytics/region/:idRegion` et `/classement` sans `@Roles` ni contrôle de périmètre : un SRMO peut lire les analytics de n'importe quelle région. Non consommé par ses écrans, mais exposé. | Restreindre à ADMIN ou au périmètre de l'appelant. |
| P2 | apps/web/src/config/rbac.ts:84-90 vs apps/api/prisma/seed.ts:257 | Divergence supplémentaire : front `canEvaluatePeers:false` vs rôle DB `peut_evaluer_pairs:true`. Le serveur (EligibilityService, eligibility.service.ts:71-86) proposerait des pairs que le front ne prévoit pas. | Servir les capacités du rôle via l'API, source unique. |
| P2 | apps/web/src/Components/Dashboard/RoleDashboardShared.tsx:58-60 | `navigateTo` = `window.location.href` sur les « Actions rapides » (RoleManagerDashboardPage.tsx:262-277) → full reload SPA. | `useNavigate`/`Link` react-router. |
| P2 | apps/web/src/Components/Auth/AuthGuard.tsx:33-38 + App.tsx:139 | Comparaison brute `(role_nom \|\| role).toUpperCase() === 'SRMO'` — fragile si `role_nom` devient un libellé (« Superviseur regional marketing operationnel ») : 403 systématique + redirect cassé, alors que `resolveKnownRole` (rbac.ts:110) gère ce libellé. | Unifier via `resolveKnownRole`. |
| P3 | apps/web/src/pages/SRMO/Campaigns.tsx + apps/web/src/pages/SRMO/Operators.tsx | Coquilles vides historiques non routées : code mort. | Supprimer. |
| P3 | apps/web/src/config/nav.tsx:57-63 + Sidebar.tsx:266-302 | `badge: 'notifications'` de « À compléter » jamais rendu. | Brancher ou retirer. |

## 5. Écrans partagés

- `/evaluations/*` : pilotés serveur ; l'éligibilité SRMO (auto + pairs selon flags DB) est calculée par `GET /evaluations/eligibles` → aucun bouton menant à un 403. Le CTA du hub est désactivé avec motif si aucune règle applicable (`pages/Common/Evaluations/index.tsx:40-45`).
- `/evaluations/validate` : accessible par URL directe (guard `G` seulement, App.tsx:285) mais la file serveur `getAValider` scopée `manager_matricule` (evaluations.service.ts:589-604) sera vide pour un SRMO sans subordonné → écran vide, pas de fuite ni d'action interdite.
- `/equipe/subordonnes` et `/equipe/evaluations` : accessibles par URL directe (guard `G`), afficheront « Aucun subordonné trouvé » (Overview.tsx:39-42). Pas de 403, cohérent.
- Notifications : Header autonome, endpoints présents.

## Endpoints

| Endpoint appelé (écrans SRMO) | Statut |
|---|---|
| `GET /dashboard` | OK — scopé au matricule |
| `GET /analytics/scores` / `axes-amelioration` / `recommandations` | OK — self only |
| `POST /analytics/scores/batch` / `axes-amelioration/batch` / `team-heatmap` | OK — anti-IDOR ; jamais déclenchés en pratique (équipe vide) |
| `GET /evaluations` / `historique` / `eligibles` | OK — scopés `req.user.matricule` |
| `GET /regles` | OK — règles actives publiées |
| `GET /hierarchy/subordonnes` | OK — scopé ; retourne `[]` pour SRMO (données seed) |
| `GET /notifications` (+ count, read) | OK |
| `GET /analytics/region/:idRegion` (+ `/classement`) | **Sans RBAC** — exposé à tout authentifié (voir P1) |

Aucun endpoint appelé par les écrans SRMO n'est manquant côté API.
