# Session Prompt — Epic 6 : Dashboards Manager & Collaborateur

> Copier-coller entier au démarrage d'une nouvelle session Claude Code dans `/Users/macbook/Documents/SABC/sabc_eval360`

---

## Mission

Implémenter l'**Epic 6** complet (3 stories) du projet SABC Eval360 en mode Subagent-Driven Development.  
Backend NestJS **et** Frontend React pour chaque story. Stories 6.1 + 6.2 en parallèle, puis 6.3.

**Critères de succès :**
- `cd apps/api && npx tsc --noEmit` → 0 erreur TypeScript
- `cd apps/api && node_modules/.bin/jest` → tous les tests passent  
- `cd apps/web && npx tsc --noEmit` → 0 erreur TypeScript frontend
- 3 commits distincts, un par story
- Chaque story backend a ≥5 tests Jest

---

## Contexte projet

**Stack active :** NestJS 11 + Prisma 6 (MySQL) + PostgreSQL (evaluations) + React 19 + TypeScript strict  
**Répertoire API :** `apps/api/src/`  
**Répertoire Web :** `apps/web/src/`  
**Tests :** Jest, fichiers `*.spec.ts` colocalisés  
**React Query :** TanStack Query v5 déjà installé (`@tanstack/react-query`)  
**Charts :** Recharts déjà installé

**Pattern service NestJS :**
```typescript
@Injectable()
export class MonService {
  constructor(
    private pg: DatabasePgService,   // PostgreSQL (evaluations)
    private prisma: PrismaService,   // MySQL (utilisateurs)
    private cache: CacheService,     // cache en mémoire
  ) {}
}
```

**Pattern React Query (déjà utilisé dans le projet) :**
```typescript
const { data, isLoading } = useQuery({
  queryKey: ['dashboard', 'manager', matricule, idPeriode],
  queryFn: () => api.get(`/dashboard/manager?id_periode=${idPeriode}`),
  refetchInterval: 30_000,  // polling 30s
});
```

---

## État actuel (NE PAS réimplémenter)

### Backend déjà commité

| Fichier | Ce qui existe |
|---------|---------------|
| `dashboard/dashboard.service.ts` | `getStats(matricule)`, `getAdminStats(matricule)`, `_getRegionStats()`, `_getRolePerformance()` |
| `dashboard/dashboard.controller.ts` | `GET /dashboard`, `GET /dashboard/stats`, `GET /dashboard/admin` |
| `dashboard/dashboard.module.ts` | Module avec `DashboardService` + `DashboardController` |
| `evaluations/evaluations.service.ts` | `getAValider(managerMatricule)` — retourne évals soumises des subordonnés |
| `evaluations/validation-manager.service.ts` | Permission checks pour validation |
| `hierarchy/hierarchy.service.ts` | `getSubordonnesDirects(matricule)`, `getTousSubordonnes(matricule)` |

### Schéma MySQL (`Utilisateur`) — champs utiles
```
matricule: string (PK)
nom, prenom: string
role: string          // ex: 'CSC', 'CDV', 'RTM', 'DR', 'CDTT'
role_nom: string      // ex: 'Chef Service Commercial'
manager_matricule: string | null
niveau_hierarchique: number
id_region: string | null
est_actif: boolean
statut: string        // 'Actif' | 'Inactif'
est_admin: boolean
```

### Schéma PostgreSQL — tables clés
```sql
evaluations (id_evaluation UUID, evaluateur_matricule, evalue_matricule, statut, id_periode, 
             note_globale DECIMAL, date_soumission TIMESTAMP, created_at)
periodes_evaluation (id_periode UUID, nom_periode, date_debut, date_fin, statut, est_ouverte, code_periode)
-- statut: 'brouillon' | 'soumis' | 'valide' | 'rejete'
```

### `DashboardController` actuel — à ÉTENDRE (ne pas réécrire)
```typescript
// Ajouter ces routes au DashboardController existant:
// GET /dashboard/manager             → progression équipe
// GET /dashboard/manager/validations → validations en attente
// GET /dashboard/collaborateur       → statut personnel
```

---

## Stories à implémenter

### Story 6.1 — Dashboard Manager : Progression Équipe

**Objectif :** Manager voit la progression de son équipe (subordonnés directs) avec KPI, liste et historique.

**Acceptance Criteria :**
- AC1 : `GET /dashboard/manager?id_periode=...` retourne `{ kpi: { total, completes, en_attente, restantes, taux_completion }, subordonnes: [...], historique: [...] }`
- AC2 : `kpi.total` = nombre d'évaluations attendues pour tous les subordonnés directs sur la période
- AC3 : `kpi.completes` = évaluations avec `statut='valide'`
- AC4 : `subordonnes` : liste avec `{ matricule, nom, prenom, role_nom, nb_recues, nb_donnees, nb_en_attente, statut_couleur }`
- AC5 : `historique` : 6 derniers mois de données `{ mois: 'YYYY-MM', completes, en_attente }` (PostgreSQL)
- AC6 : Réponse cachée 30 secondes par `(manager_matricule, id_periode)`
- AC7 : Frontend — page `apps/web/src/pages/Manager/Dashboard.tsx` avec KPI card, table subordonnés, line chart Recharts

**Fichiers à créer/modifier :**
- `dashboard/dashboard-manager.service.ts` — `DashboardManagerService`
- `dashboard/dashboard-manager.service.spec.ts` — 6+ tests
- `dashboard/dashboard.controller.ts` — ajouter `GET /dashboard/manager`
- `dashboard/dashboard.module.ts` — ajouter `DashboardManagerService` en provider
- `apps/web/src/pages/Manager/Dashboard.tsx` — page frontend
- `apps/web/src/pages/Manager/Dashboard.spec.tsx` (optionnel, composants testables)

**Implémentation backend :**
```typescript
// DashboardManagerService.getProgressionEquipe(managerMatricule: string, idPeriode?: string)
// 1. hierarchyService.getSubordonnesDirects(managerMatricule) → string[] de matricules
// 2. Si pas de subordonnés → retourner zéros
// 3. pg.query: SELECT evalue_matricule, statut, COUNT(*) FROM evaluations
//    WHERE evalue_matricule IN (...matricules) [AND id_periode = $n]
//    GROUP BY evalue_matricule, statut
// 4. Calculer KPI depuis les résultats
// 5. Historique: SELECT DATE_TRUNC('month', created_at) as mois,
//    COUNT(*) FILTER (WHERE statut='valide') as completes,
//    COUNT(*) FILTER (WHERE statut IN ('brouillon','soumis')) as en_attente
//    FROM evaluations WHERE evalue_matricule IN (...) AND created_at > NOW() - INTERVAL '6 months'
//    GROUP BY mois ORDER BY mois

// Couleur statut subordonné:
// 0 évals → 'grey', toutes validées → 'green', ≥1 soumise → 'orange', ≥1 brouillon → 'red'
```

**Implémentation frontend (`Manager/Dashboard.tsx`) :**
```tsx
// - useQuery({ queryKey: ['dashboard','manager', matricule, selectedPeriode], refetchInterval: 30_000 })
// - KPI card: total / completes (barre progression)
// - Table subordonnés: nom | role | reçues | données | en attente | badge couleur
// - LineChart Recharts: x=mois, y=completes + en_attente (2 lignes)
// - Filtre période (select) → modifie queryKey
```

---

### Story 6.2 — Dashboard Manager : Validations en Attente

**Objectif :** Manager voit la liste des évaluations soumises qui attendent sa validation.

**Acceptance Criteria :**
- AC1 : `GET /dashboard/manager/validations?page=1&limit=20` retourne `{ data: [...], meta: { total, page } }`
- AC2 : Chaque item : `{ id_evaluation, evaluateur_nom, evalue_nom, date_soumission, jours_attente, periode_nom, priorite }`
- AC3 : `jours_attente` = nb jours depuis `date_soumission` jusqu'à aujourd'hui
- AC4 : `priorite` = 'urgente' si `jours_attente >= 3`, sinon 'normale'
- AC5 : Tri par `date_soumission ASC` (plus anciennes en premier)
- AC6 : Filtres query params : `?evaluateur_matricule=`, `?priorite=urgente|normale`, `?id_periode=`
- AC7 : Frontend — section "Validations en attente" dans `Manager/Dashboard.tsx` avec badge rouge si urgente

**Fichiers à créer/modifier :**
- `dashboard/dashboard-manager.service.ts` — ajouter `getValidationsAttente(managerMatricule, filters)` (au même service que 6.1)
- `dashboard/dashboard.controller.ts` — ajouter `GET /dashboard/manager/validations`
- `apps/web/src/pages/Manager/Dashboard.tsx` — ajouter section validations avec table + badges

**Implémentation backend :**
```typescript
// DashboardManagerService.getValidationsAttente(managerMatricule: string, filters)
// 1. Fetch subordonnés directs matricules
// 2. pg.query: 
//    SELECT e.id_evaluation, e.evaluateur_matricule, e.evalue_matricule, e.date_soumission,
//           EXTRACT(EPOCH FROM (NOW() - e.date_soumission))/86400 AS jours_attente,
//           p.nom_periode, e.id_periode
//    FROM evaluations e JOIN periodes_evaluation p ON p.id_periode = e.id_periode
//    WHERE e.statut = 'soumis' AND e.evalue_matricule IN (...matricules)
//    [AND e.evaluateur_matricule = $n] [AND e.id_periode = $n]
//    ORDER BY e.date_soumission ASC
//    LIMIT $n OFFSET $n
// 3. Enrich evaluateur_nom + evalue_nom from prisma.utilisateur
// 4. Map: priorite = jours_attente >= 3 ? 'urgente' : 'normale'
```

---

### Story 6.3 — Dashboard Collaborateur : Statut Évaluation Personnelle

**Objectif :** Collaborateur voit son statut d'évaluation (évals à compléter + reçues + score).

**Acceptance Criteria :**
- AC1 : `GET /dashboard/collaborateur` retourne `{ a_completer: [...], recues: [...], kpi: { score_global, progression_vs_periode_precedente, nb_a_completer } }`
- AC2 : `a_completer` : évaluations `statut IN ('brouillon','soumis')` où `evaluateur_matricule = moi`
- AC3 : `recues` : évaluations `statut IN ('soumis','valide')` où `evalue_matricule = moi` (règle de visibilité : un collaborateur ne voit pas les `brouillon` qui le concernent)
- AC4 : `kpi.score_global` : moyenne de toutes ses évaluations `valide` (note_globale)
- AC5 : `kpi.progression` : comparaison score période courante vs score période précédente (peut être null)
- AC6 : Frontend — page `apps/web/src/pages/Collaborateur/Dashboard.tsx` avec 3 sections : KPI score, mes évals à compléter, mes évals reçues

**Fichiers à créer/modifier :**
- `dashboard/dashboard-collaborateur.service.ts` — `DashboardCollaborateurService`
- `dashboard/dashboard-collaborateur.service.spec.ts` — 5+ tests
- `dashboard/dashboard.controller.ts` — ajouter `GET /dashboard/collaborateur`
- `dashboard/dashboard.module.ts` — ajouter `DashboardCollaborateurService` en provider
- `apps/web/src/pages/Collaborateur/Dashboard.tsx` — page frontend

**Implémentation backend :**
```typescript
// DashboardCollaborateurService.getStatutPersonnel(matricule: string)
// 1. a_completer: pg.query SELECT * FROM evaluations WHERE evaluateur_matricule = $1 
//    AND statut IN ('brouillon','soumis')
// 2. recues: pg.query SELECT * FROM evaluations WHERE evalue_matricule = $1
//    AND statut IN ('soumis','valide')
// 3. score_global: pg.queryOne SELECT AVG(note_globale) FROM evaluations
//    WHERE evalue_matricule = $1 AND statut = 'valide' AND note_globale IS NOT NULL
// 4. progression: comparer score période active vs période précédente
//    (si pas de période active → null)
// 5. Enrich: pour chaque éval → nom evaluateur/evalue depuis prisma
```

**Implémentation frontend (`Collaborateur/Dashboard.tsx`) :**
```tsx
// - Score global: grand chiffre circulaire (ou barre)
// - Progression: flèche + ou - avec delta
// - Évals à compléter: table avec bouton "Reprendre" → lien /evaluations/:id/edit
// - Évals reçues: table avec statut badge (soumis/validé)
// - useQuery avec refetchInterval: 60_000
```

---

## Processus d'exécution

### Étape 1 — Paralléliser 6.1 + 6.2 (même service)

Lancer **deux agents simultanément** :

**Agent A — Story 6.1 Backend**
```
Implémente Story 6.1 BACKEND (progression équipe manager) du projet SABC Eval360.
Crée DashboardManagerService avec getProgressionEquipe() + spec 6 tests.
Ajoute GET /dashboard/manager au DashboardController existant.
Ajoute DashboardManagerService au DashboardModule.
Build 0 erreur TS, tous les tests passent.
Voir docs/superpowers/epic6-session-prompt.md pour specs complètes.
```

**Agent B — Story 6.3 Backend**
```
Implémente Story 6.3 BACKEND (dashboard collaborateur) du projet SABC Eval360.
Crée DashboardCollaborateurService avec getStatutPersonnel() + spec 5 tests.
Ajoute GET /dashboard/collaborateur au DashboardController existant.
Ajoute DashboardCollaborateurService au DashboardModule.
Build 0 erreur TS, tous les tests passent.
Voir docs/superpowers/epic6-session-prompt.md pour specs complètes.
```

> 6.2 s'ajoute dans le même service que 6.1 (DashboardManagerService) — l'agent A peut l'inclure directement.

### Étape 2 — Review BMAD backends

**Review 6.1 + 6.2**
```
BMAD Review Story 6.1+6.2 (dashboard manager):
1. Spec compliance: AC1–AC7 pour 6.1, AC1–AC7 pour 6.2
2. Code quality: N+1 queries? types any? gestion null?
3. Security: le manager voit-il seulement ses propres subordonnés? (pas d'IDOR)
Fichiers: dashboard/dashboard-manager.service.ts + spec + dashboard.controller.ts
PASS ou FAIL avec liste défauts.
```

**Review 6.3**
```
BMAD Review Story 6.3 (dashboard collaborateur):
1. Spec compliance: AC1–AC6
2. Security: visibilité correcte des évals? (ne voit pas ses propres brouillons en "recues")
3. Code quality
PASS ou FAIL.
```

### Étape 3 — Frontend (après reviews backend PASS)

**Agent Frontend A — Manager Dashboard**
```
Implémente le frontend Story 6.1+6.2 (manager dashboard) du projet SABC Eval360.
Créer apps/web/src/pages/Manager/Dashboard.tsx avec:
- useQuery polling 30s sur /dashboard/manager
- KPI card progression (total/completes/restantes)
- Table subordonnés avec badge couleur statut
- LineChart Recharts (6 mois historique)
- Section validations en attente avec badge urgente (rouge si jours>=3)
Stack: React 19 + TanStack Query v5 + Recharts + TypeScript strict
Conventions visuelles: voir apps/web/src/pages/Common/ pour les patterns existants
```

**Agent Frontend B — Collaborateur Dashboard**
```
Implémente le frontend Story 6.3 (collaborateur dashboard) du projet SABC Eval360.
Créer apps/web/src/pages/Collaborateur/Dashboard.tsx avec:
- Score global KPI (chiffre + barre)
- Progression vs période précédente (flèche delta)
- Table évals à compléter + bouton Reprendre
- Table évals reçues + badge statut
Stack: React 19 + TanStack Query v5 + TypeScript strict
Polling toutes les 60s.
```

### Étape 4 — Review BMAD frontend

```
BMAD Review Frontend Epic 6:
1. Recharts responsive? (pas de width fixe hardcodé)
2. Loading/error states gérés?
3. TanStack Query: queryKey stable? invalidation correcte?
4. TypeScript: pas de `any` dans les props?
5. Accessibilité: tableaux avec headers, aria-labels sur badges
PASS ou FAIL.
```

### Étape 5 — Commits

```bash
# Un commit par story
git add apps/api/src/dashboard/dashboard-manager.* apps/api/src/dashboard/dashboard.controller.ts apps/api/src/dashboard/dashboard.module.ts apps/web/src/pages/Manager/
git commit -m "feat(dashboard): [6.1+6.2] manager team progression and pending validations"

git add apps/api/src/dashboard/dashboard-collaborateur.* apps/web/src/pages/Collaborateur/
git commit -m "feat(dashboard): [6.3] collaborateur personal evaluation status dashboard"
```

### Étape 6 — Vérification finale
```bash
cd apps/api && npx tsc --noEmit    # 0 erreur
node_modules/.bin/jest             # tous verts
cd ../web && npx tsc --noEmit      # 0 erreur
git log --oneline -5
```

---

## Contraintes techniques

- **Jamais** d'include Prisma sur des relations inexistantes : `Region` n'a pas `utilisateurs`, `Utilisateur` n'a pas `region` ni `branche`
- **Pour les utilisateurs d'une région :** `prisma.utilisateur.findMany({ where: { id_region } })` — pas d'include
- **Toujours** `DatabasePgService` pour PostgreSQL (evaluations), `PrismaService` pour MySQL (utilisateurs)
- **Cache :** `CacheService.getOrCompute(key, ttlSeconds, fn)` — déjà injecté dans `DashboardService`
- **Tests :** mock `DatabasePgService` et `PrismaService` manuellement — pas de `@nestjs/testing`
- **Frontend :** utiliser les composants existants dans `apps/web/src/components/` avant d'en créer de nouveaux

---

## Fichiers de référence à lire avant de commencer

- `apps/api/src/dashboard/dashboard.service.ts` — patterns existants (CacheService, pg queries, types)
- `apps/api/src/dashboard/dashboard.controller.ts` — à étendre (ne pas réécrire)
- `apps/api/src/dashboard/dashboard.module.ts` — à étendre
- `apps/api/src/hierarchy/hierarchy.service.ts` — `getSubordonnesDirects()` disponible
- `apps/api/src/evaluations/evaluations.service.ts` — `getAValider()` déjà implémenté
- `apps/api/src/evaluations/evaluations-consultation.service.ts` — pattern pagination
- `apps/web/src/pages/Common/Evaluations/Recues.tsx` — pattern React Query + table frontend
- `apps/api/prisma/schema.prisma` — modèle Utilisateur complet

---

## Notes d'architecture frontend

**Route à ajouter dans `apps/web/src/app.tsx` :**
```tsx
<Route path="/manager/dashboard" element={<ManagerDashboard />} />
<Route path="/collaborateur/dashboard" element={<CollaborateurDashboard />} />
```

**API client pattern (existant dans le projet) :**
```typescript
// Utiliser le client Axios/fetch déjà configuré — chercher dans apps/web/src/lib/ ou apps/web/src/api/
```
