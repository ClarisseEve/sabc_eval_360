# Audit rôle ADMIN — SABC Eval360

**Date**: 2026-08-06 · **Analyse statique** (aucune exécution) · Branche `dev`

## Verdict global : Dégradé (proche de OK)

La surface admin est globalement saine : toutes les routes `/admin/*` sont protégées par le guard `A` (ADMIN), tous les endpoints appelés existent côté NestJS et **tous les endpoints sensibles sont protégés serveur** (`JwtAuthGuard` + `RolesGuard`/`@Roles('ADMIN')`). Les pages consomment des données réelles via React Query (aucun mock, aucun `window.alert/confirm` natif, aucun `window.location.href` de navigation), avec confirmations (`useConfirm`) et toasts sur les mutations. Les points dégradés : l'update manquant pour services/districts/secteurs (front + API), une édition de rôle limitée à un seul champ, 4 pages orphelines (dont 2 dupliquant des modals), et la fonctionnalité « rappels » sans UI.

**Constats : 0 P0 · 1 P1 · 7 P2 · 4 P3**

## Tableau des constats

| Sévérité | Fichier:ligne | Constat | Recommandation |
|---|---|---|---|
| P1 | `apps/api/src/admin/admin-structure.controller.ts:48-97` + `apps/web/src/pages/Admin/Structure/{services,districts,secteurs}.tsx` | Pas de `PUT` pour services, districts et secteurs (seules les régions ont `updateRegion`, ctrl:36). L'UI n'offre que créer/supprimer : corriger un nom impose une suppression/recréation destructive (perte d'id et des rattachements utilisateurs `id_service/id_district/id_secteur`). | Ajouter `PUT /admin/structure/{services,districts,secteurs}/:id` côté API + bouton « Modifier » dans les 3 pages (calqué sur `regions.tsx:70-110`). |
| P2 | `apps/web/src/pages/Admin/Utilisateurs/Create.tsx` + `App.tsx:193` | Page de création utilisateur routée (`/admin/utilisateurs/create`) mais **aucun lien ne pointe dessus** : `Utilisateurs/Index.tsx:101-198` crée via un modal. Deux implémentations parallèles du même formulaire → risque de divergence de validation. | Supprimer la page + la route, ou remplacer le modal par un lien vers la page (une seule source). |
| P2 | `apps/web/src/pages/Admin/Roles/create.tsx` + `App.tsx:225` | Même duplication pour les rôles : `/admin/roles/create` routé mais jamais lié ; `Roles/index.tsx:59-273` crée via modal. | Idem : supprimer la page orpheline ou unifier. |
| P2 | `apps/web/src/pages/Admin/Roles/permissions.tsx` | Page morte : la route `/admin/roles/permissions` redirige vers les règles (`App.tsx:226`) et aucun lien/import ne référence le fichier (7,8 K, 4 queries). | Supprimer le fichier. |
| P2 | `apps/web/src/pages/Admin/Evaluations/Templates/Assignations.tsx` | Page morte : `/admin/evaluations/templates/assignations` redirige vers l'index templates (`App.tsx:213`) ; fichier (7,6 K, 7 queries) plus référencé nulle part. | Supprimer le fichier (la matrice d'assignation vit dans Templates/Index). |
| P2 | `apps/web/src/pages/Admin/Roles/show.tsx:23-27` | Édition de rôle réduite au seul toggle `peut_auto_evaluer`, alors que `UpdateRoleDto` (`apps/api/src/admin/dto/role.dto.ts:54-69`) accepte `nom_role`, `description`, `id_branche`, `niveau`. Pas d'écran/route d'édition. | Ajouter un formulaire d'édition (modal dans show.tsx) couvrant les champs du DTO. |
| P2 | `apps/web/src/Services/api.ts:275-276` | `evaluationsApi.rapport` et `evaluationsApi.rappels` ne sont appelés par **aucune page** : la relance des évaluateurs en retard (`POST /evaluations/rappels/:idPeriode`, ADMIN côté API, `evaluations.controller.ts:66-68`) n'a aucune UI. | Câbler un bouton « Relancer » dans `Evaluations/Periodes.tsx` ou `Management.tsx`, sinon retirer les deux méthodes. |
| P2 | `apps/web/src/pages/Admin/Utilisateurs/Gaps.tsx:23-25` | Aucun état loading/erreur : pendant le chargement (ou sur erreur silencieuse), `users=[]` → la page affiche « Aucun gap détecté » (faux positif rassurant sur une page d'audit de données). | Exploiter `isLoading`/`isError` de `useAdminUsers` (skeleton + EmptyState variante erreur). |
| P3 | `apps/web/src/pages/Admin/Structure/index.tsx:19-24` | Pas d'état loading/erreur : les 4 KPI affichent 0 pendant le chargement. | Ajouter skeletons sur les compteurs. |
| P3 | `apps/api/src/dashboard/dashboard.controller.ts:43-51` | `GET /dashboard/admin` est bien protégé, mais via un check manuel `ForbiddenException` au lieu du couple `RolesGuard` + `@Roles('ADMIN')` utilisé partout ailleurs. | Uniformiser avec le décorateur (cohérence + lisibilité des audits). |
| P3 | `apps/web/src/pages/Admin/Evaluations/Regles/Index.tsx:105` | Pas de suppression de règle dans l'UI (toggle actif/inactif uniquement) alors que `DELETE /regles/:id` existe (`regles.controller.ts:72-77`) ; `reglesApi.delete` (`api.ts:336`) est du code mort. | Choix soft-delete acceptable : documenter et retirer `reglesApi.delete`, ou câbler la suppression pour les règles jamais utilisées. |
| P3 | `apps/web/src/Components/Auth/AuthGuard.tsx:35` | `!requiredRoles.includes(userRole) && !user.est_admin` : un compte `est_admin` contourne **tous** les guards `R` (accès aux dashboards DR/CDV/etc.). Comportement probablement voulu (super-admin) mais implicite. | Documenter ce bypass, ou le restreindre aux routes `/admin/*`. |

## Endpoints (frontend → API NestJS)

Tous les endpoints appelés par le front admin existent côté API. Aucun endpoint appelé-mais-inexistant détecté. Statuts :

| Endpoint (groupe) | Statut |
|---|---|
| `GET/POST/PUT/DELETE /admin/utilisateurs[...]` (+ `/historique`, `/chaine`, `/subordonnes`) | OK — `admin-users.controller.ts:13-15`, classe `@Roles('ADMIN')` |
| `GET/POST/PUT/DELETE /admin/roles[...]` + `/admin/roles/regles/evaluation[...]` (+ toggle) | OK — `admin-roles.controller.ts:8-10`, classe ADMIN |
| `GET/POST/PUT/DELETE /admin/structure/*` (regions/services/districts/secteurs/branches) | OK — `admin-structure.controller.ts:13-15`, classe ADMIN. **Manque** : `PUT` services/districts/secteurs (P1 ci-dessus) |
| `GET /admin/evaluations/history`, `GET /admin/evaluations/:id` | OK — `admin-evaluations.controller.ts:6-8`, classe ADMIN |
| `GET/POST/PUT/DELETE /periodes` + `/:id/toggle` | OK — mutations `@Roles('ADMIN')` par méthode (`periodes.controller.ts:28-74`) ; lectures JWT seul (voulu : besoin transverse) |
| `GET/POST/PUT/DELETE /regles` + constraints/categories/toggle | OK — mutations + `/all` ADMIN (`regles.controller.ts:30-77`) |
| `/templates` CRUD + publish/unpublish/assign/matrice | OK — mutations ADMIN (`templates.controller.ts:33-92`) |
| `/remplacements` actifs/a-venir/historique/CRUD/terminer | OK — tout ADMIN sauf `par-utilisateur` (JWT, voulu) (`remplacements.controller.ts:36-96`) |
| `/hierarchy/managers-eligibles`, `verifier-supervision`, `valider-assignation`, `assigner-manager` | OK — `@Roles('ADMIN')` par méthode (`hierarchy.controller.ts:48-91`) |
| `/analytics/dashboard`, `/evaluations`, `/performances`, `/admin/*`, `/anomalies*`, `/recommandations` (validate/reject/run), `/tendances` | OK — `@Roles('ADMIN')` par méthode (`analytics.controller.ts`) ; endpoints par-matricule protégés anti-IDOR (`assertCanViewMatricules`, lignes 24-41) |
| `GET /dashboard/admin` | OK mais check manuel in-handler (P3) — `dashboard.controller.ts:43-51` |
| `/reports` CRUD + sections + exports PPTX/XLSX | OK — classe entière `@Roles('ADMIN')` (`reports.controller.ts:23-25`) |
| `POST /notifications/send-bulk` | OK — `@Roles('ADMIN')` (`notifications.controller.ts:55-57`) |
| `evaluationsApi.rapport` / `rappels` (`api.ts:275-276`) | Existants et ADMIN côté API, **mais jamais appelés par l'UI** (P2) |
| `reglesApi.delete` (`api.ts:336`) | Existant côté API, jamais appelé (P3, code mort) |

**Aucun endpoint sensible sans contrôle serveur détecté.** Le RBAC n'est jamais uniquement côté client.

## CRUD par entité

| Entité | Create | Read | Update | Delete | Notes |
|---|---|---|---|---|---|
| Utilisateurs | ✅ modal `Index.tsx:163` (+ page `Create.tsx` orpheline) | ✅ `Show.tsx` | ✅ `Edit.tsx` (rôle, région, manager, statut) + modal rapide `Index.tsx:463` | ✅ soft (désactivation) `Show.tsx:28` | Complet ; dédupliquer création |
| Rôles | ✅ modal `index.tsx:59` (+ page orpheline) | ✅ `show.tsx` | ⚠️ partiel : toggle `peut_auto_evaluer` uniquement | ✅ `index.tsx:190` (confirm) | Update à compléter (P2) |
| Périodes | ✅ `Periodes.tsx:143` | ✅ | ✅ `:136` | ✅ `:170` + toggle `:159` | Complet, toasts + confirm |
| Templates | ✅ `Templates/Create.tsx` | ✅ `Show.tsx` | ✅ `Edit.tsx` | ✅ `Index.tsx:62` + publish/unpublish + assignation matrice | Complet |
| Règles d'évaluation | ✅ `Regles/Create.tsx:45` | ✅ `Index.tsx` | ✅ `Edit.tsx:44` | ⚠️ absent en UI (toggle actif/inactif à la place) | Soft-delete assumé (P3) |
| Structure — régions | ✅ | ✅ | ✅ `regions.tsx:93` | ✅ | Complet |
| Structure — services/districts/secteurs | ✅ | ✅ | ❌ ni UI ni API | ✅ | **P1** |
| Remplacements | ✅ `Create.tsx` | ✅ `Show.tsx` | ✅ `Edit.tsx` + terminer | — (historisation, pas de delete : voulu) | Complet |
| Rapports | ✅ `Reports/Index.tsx` | ✅ `Builder.tsx` | ✅ sections (add/update/reorder) | ✅ (confirm `Index.tsx:41`) + exports PPTX/XLSX | Complet |

## Navigation & routage — synthèse

- **Guard `A`** (`App.tsx:157-159`) appliqué à 100 % des 31 routes `/admin/*` ; redirection `/403` sinon (`AuthGuard.tsx:36`).
- **Sidebar** (`config/nav.tsx` + `Sidebar.tsx:116-121`) : toutes les entrées ADMIN (Gestion globale, Périodes, Règles, Modèles, Analytics ×6 onglets, Rapports, Utilisateurs, Gaps, Remplacements, Rôles, Structure ×4) mènent à des écrans réels câblés API. Les onglets `?tab=` de la nav Analytics correspondent tous à `ADMIN_TABS` (`Analytics/Index.tsx:22-30`).
- **Redirections legacy** cohérentes : `/analytics/*` → `/admin/analytics?tab=…` (`App.tsx:238-240`), `/admin/roles/permissions` → règles, `/admin/evaluations/templates/assignations` → templates.
- `/admin/evaluations/history` n'est pas dans la sidebar mais est accessible depuis Management (`Management.tsx:169`), Show et l'onglet Évaluations — OK.
- Aucun `window.location.href` de navigation dans la surface admin (seul le redirect `/login` sur 401 dans `api.ts:121,194`, légitime).
