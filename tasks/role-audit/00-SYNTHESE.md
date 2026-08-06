# Synthèse — Audit exhaustif rôle par rôle (2026-08-06)

Audit statique mené en 4 lots d'agents (DR/CDTT/CSC, CDV/CDS/TMO, SS/RTM/SRMO/AS, ADMIN).
Un rapport détaillé par rôle dans ce dossier.

## Verdicts

| Rôle | Verdict | P0 | P1 | P2 | P3 |
|---|---|---|---|---|---|
| ADMIN | Dégradé (proche OK) | 0 | 1 | 7 | 4 |
| DR | Dégradé | 0 | 2 | 3 | 5 |
| CDTT | Dégradé | 0 | 2 | 3 | 4 |
| CSC | Dégradé | 0 | 2 | 2 | 4 |
| CDV | OK | 0 | 1 | 2 | 2 |
| CDS | Dégradé | 0 | 2 | 3 | 2 |
| TMO | OK | 0 | 1 | 2 | 3 |
| SS | OK (réserves mineures) | 0 | 1 | 2 | 3 |
| RTM | OK (réserves) | 0 | 1 | 3 | 2 |
| SRMO | Dégradé | 0 | 2 | 3 | 2 |
| AS | OK | 0 | 1 | 2 | 2 |

Aucun P0. Le soupçon historique de « coquilles vides » (TMO, SS, RTM, SRMO, AS) est
**infirmé** : tous les dashboards sont réels (API + React Query, skeleton/empty/error).
Les anciennes coquilles « Contenu à implémenter » subsistent uniquement en code mort
non routé.

## P1 transverses (à corriger en priorité)

1. **Sécurité API** — `GET /analytics/region/:idRegion` et `.../classement`
   (`apps/api/src/analytics/analytics.controller.ts:64-72`) : JWT seul, sans
   `@Roles` ni contrôle de périmètre. Tout utilisateur authentifié (même un AS)
   peut lire agrégats et classement nominatif de n'importe quelle région.
   Remonté indépendamment par 3 lots sur 4.
2. **KPI trompeurs en cas de panne** —
   `apps/web/src/Hooks/queries/useRoleDashboards.ts:369-407` : `Promise.allSettled`
   avale les échecs ; les dashboards affichent « 0 évaluations / Couverture 0% »
   comme données réelles, sans état d'erreur partiel. Plausible avec le throttle
   analytics (30 req/min).

## P1 spécifiques

- **CDS** : mauvais gabarit — reçoit `RoleManagerDashboardPage` alors qu'il n'a
  jamais de subordonnés → 6 blocs sur 9 en empty state permanent ; perd les vues
  individuelles (évolution, benchmarks, recommandations). Idem page Axes.
- **SRMO** : même travers — dashboard manager mais aucun subordonné côté seed
  (`seed.ts:396-399`, `peut_evaluer_subordonnes:false` en `seed.ts:258`) et
  divergence front `rbac.ts:84-90` (`canEvaluateSubs:true`). Coquille vide de fait.
- **ADMIN** : pas de `PUT` services/districts/secteurs (API ni UI,
  `admin-structure.controller.ts:48-97`) → renommer impose suppression/recréation.

## P2 transverses

- `navigateTo` = `window.location.href` (`RoleDashboardShared.tsx:58-60` et
  dérivés) : full reload sur « Actions rapides » / « Examiner » — casse l'esprit SPA.
- `AuthGuard.tsx:33-38` et `DashboardRedirect` (`App.tsx:139-142`) comparent
  `role_nom || role` brut sans `resolveKnownRole` — fragile si `role_nom` devient
  un libellé.
- DR/CDTT : `/evaluations/eligibles` peut renvoyer une cible « auto » que la
  création refusera en 403 (`eligibility.service.ts:145-151` vs `58-69`).
- Jusqu'à 100 requêtes séquentielles pour les évaluations rejetées
  (`useEvaluationWorkflow.ts:19-31`).
- ADMIN : 4 pages orphelines (Utilisateurs/Create, Roles/create, Roles/permissions,
  Templates/Assignations) ; édition de rôle limitée au toggle `peut_auto_evaluer` ;
  rapport/rappels d'évaluations non exposés en UI ; `Gaps.tsx` sans état
  loading/erreur.

## Points sains confirmés

- RBAC serveur solide sur le cœur : anti-IDOR sur tous les endpoints analytics
  par matricule/batch, évaluations et hiérarchie scopées au JWT, 31 routes
  `/admin/*` sous guard + `@Roles('ADMIN')` serveur.
- Aucun endpoint appelé par le front qui manque côté NestJS.
- Zéro mock dans les dashboards routés, zéro `window.alert/confirm`, sidebar
  RBAC data-driven sans lien mort.
