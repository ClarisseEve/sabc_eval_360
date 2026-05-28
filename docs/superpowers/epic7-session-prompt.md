# Session Prompt — Epic 7 : Analytics & Détection d'anomalies

> Copier-coller entier au démarrage d'une nouvelle session Claude Code dans `/Users/macbook/Documents/SABC/sabc_eval360`

---

## Mission

Implémenter l'**Epic 7** complet (3 stories) du projet SABC Eval360 en mode Subagent-Driven Development.

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
**React Query :** TanStack Query v5 (`@tanstack/react-query`)
**Charts :** Recharts déjà installé

**Pattern service NestJS :**
```typescript
@Injectable()
export class AnalyticsService {
  constructor(
    private pg: DatabasePgService,   // PostgreSQL (evaluations)
    private prisma: PrismaService,   // MySQL (utilisateurs)
    private cache: CacheService,
    private config: ConfigService,
  ) {}
}
```

**Pattern cron (déjà utilisé dans notifications/) :**
```typescript
@Injectable()
export class AnalyticsScheduler {
  @Cron('0 2 * * *', { timeZone: 'Africa/Douala' })
  async runAnomalyDetection(): Promise<void> { ... }
}
```

---

## État actuel (NE PAS réimplémenter)

### Backend déjà commité

| Fichier | Ce qui existe |
|---------|---------------|
| `analytics/analytics.service.ts` | `detecterAnomalies()`, `getRecommandations()`, `getImprovementPlans()`, `getAdminOverview()`, `getAdminRegionsOverview()`, `getAdminRoleAnalytics()`, `getAdminRegionDetail()`, `getScoresUtilisateur()`, `getAxesAmelioration()`, `getClassementRegional()` |
| `analytics/analytics.controller.ts` | Toutes les routes analytics existantes — **NE PAS réécrire** |
| `analytics/analytics.module.ts` | Module existant — **étendre seulement** |
| `analytics/analytics.service.spec.ts` | Tests existants — **ajouter seulement** |

### Frontend déjà commité

| Fichier | Ce qui existe |
|---------|---------------|
| `Admin/Dashboard/index.tsx` | 6 tabs: overview, regions, roles, anomalies, individual, improvement |
| `Components/Dashboard/Admin/Tabs/AnomaliesTab.tsx` | Affiche anomalies sans action |
| `Components/Dashboard/Admin/Tabs/ImprovementPlansTab.tsx` | Affiche plans sans validation |
| `Hooks/queries/useAdminDashboardTabs.ts` | Hooks existants pour chaque tab |
| `Services/api.ts` | Client API centralisé avec `analyticsApi` |

### Schéma PostgreSQL existant

```sql
evaluations (id_evaluation UUID, evaluateur_matricule, evalue_matricule, statut, id_periode,
             note_globale DECIMAL, type_evaluation, notations_json JSONB, date_soumission, created_at)
periodes_evaluation (id_periode UUID, nom_periode, date_debut, date_fin, statut, est_ouverte, code_periode)
-- type_evaluation: 'auto' | 'pairs' | 'descendante'
-- statut: 'brouillon' | 'soumis' | 'valide' | 'rejete'
```

### `analyticsApi` dans `apps/web/src/Services/api.ts` — à ÉTENDRE

```typescript
// Ajouter dans analyticsApi:
tendances: (params?) => api.get('/analytics/tendances', { params }),
anomaliesHistory: (params?) => api.get('/analytics/anomalies/history', { params }),
acknowledgeAnomalie: (id: string) => api.patch(`/analytics/anomalies/${id}/acknowledge`),
runAnomalyDetection: () => api.post('/analytics/anomalies/run-detection'),
adminRecommandations: (params?) => api.get('/analytics/admin/recommandations', { params }),
validateRecommandation: (id: string) => api.patch(`/analytics/recommandations/${id}/validate`),
rejectRecommandation: (id: string) => api.patch(`/analytics/recommandations/${id}/reject`),
runRecommandationsGeneration: () => api.post('/analytics/recommandations/run-generation'),
```

---

## Stories à implémenter

### Story 7A — Tendances Multi-Périodes

**Objectif :** Admin voit l'évolution des scores et taux de complétion sur plusieurs périodes.

**Acceptance Criteria :**
- AC1 : `GET /analytics/tendances?id_region=&role=&limit=6` retourne `{ tendances: [...], generated_at }`
- AC2 : Chaque item : `{ id_periode, code_periode, nom_periode, date_debut, date_fin, score_moyen, taux_completion, nb_evaluations, nb_valides }`
- AC3 : Trié par `date_debut ASC` (chronologique)
- AC4 : Filtres optionnels `id_region` et `role` (filtre sur `evalue_matricule` via `utilisateurs_ref`)
- AC5 : Comparaison delta entre période N et période N-1 : `{ delta_score, delta_completion }` calculé pour chaque période
- AC6 : Endpoint ADMIN only, cache 5 minutes
- AC7 : Frontend — nouveau onglet "Tendances" dans `Admin/Dashboard/index.tsx`
- AC8 : LineChart Recharts avec 2 lignes : score_moyen (axe gauche) + taux_completion (axe droit)
- AC9 : Sélecteur de filtres région + rôle dans l'onglet

**Fichiers à créer/modifier :**
- `analytics/analytics.service.ts` — ajouter `getTendancesMultiPeriodes(filters)`
- `analytics/analytics.controller.ts` — ajouter `GET /analytics/tendances`
- `analytics/analytics.service.spec.ts` — ajouter 5+ tests
- `apps/web/src/Components/Dashboard/Admin/Tabs/TendancesTab.tsx` — nouveau composant
- `apps/web/src/Hooks/queries/useAdminDashboardTabs.ts` — ajouter `useAdminTendancesTabData()`
- `apps/web/src/Services/api.ts` — ajouter `analyticsApi.tendances()`
- `apps/web/src/pages/Admin/Dashboard/index.tsx` — ajouter tab "tendances"

**Implémentation backend :**
```typescript
// AnalyticsService.getTendancesMultiPeriodes(filters: { id_region?: string; role?: string; limit?: number })
// 1. Récupérer périodes clôturées (statut='fermee' ou est_ouverte=false) ORDER BY date_debut DESC LIMIT limit
// 2. Pour chaque période:
//    SELECT p.id_periode, p.code_periode, p.nom_periode, p.date_debut, p.date_fin,
//           AVG(e.note_globale) as score_moyen,
//           COUNT(*) as nb_evaluations,
//           COUNT(*) FILTER (WHERE e.statut='valide') as nb_valides,
//           ROUND(COUNT(*) FILTER (WHERE e.statut='valide') * 100.0 / NULLIF(COUNT(*),0), 1) as taux_completion
//    FROM periodes_evaluation p LEFT JOIN evaluations e ON e.id_periode = p.id_periode
//    [AND e.evalue_matricule IN (SELECT matricule FROM utilisateurs_ref WHERE id_region=$n)]
//    [AND e.evalue_matricule IN (SELECT matricule FROM utilisateurs_ref WHERE role=$n)]
//    WHERE p.id_periode = $1
//    GROUP BY p.id_periode, p.code_periode, p.nom_periode, p.date_debut, p.date_fin
// 3. Calculer delta_score = score_moyen[i] - score_moyen[i-1] (null pour la 1ère période)
// 4. Cache 5 min : `analytics:tendances:${id_region??''}:${role??''}:${limit}`
```

**Implémentation frontend (TendancesTab.tsx) :**
```tsx
// - useAdminTendancesTabData({ regionFilter, roleFilter })
// - Sélecteurs région + rôle (depuis adminApi.structure.regions() + adminApi.roles.list())
// - ComposedChart Recharts: Bar chart nb_evaluations + Line score_moyen + Line taux_completion
// - Table résumé: période | score | taux | nb évals | delta
// - Badge delta: vert si delta_score > 0, rouge si < 0, gris si null/0
```

---

### Story 7B — Acknowledge Anomalies (UI + Endpoint)

**Objectif :** Admin peut marquer une anomalie comme résolue depuis le dashboard.

**Acceptance Criteria :**
- AC1 : `PATCH /analytics/anomalies/:id/acknowledge` marque l'anomalie résolue en DB
- AC2 : L'endpoint retourne `{ success: true, id, resolue: true, date_resolution }`
- AC3 : Frontend — bouton "Marquer résolu" dans `AnomaliesTableSection` pour chaque anomalie
- AC4 : Après acknowledge, invalidation du cache anomalies → rechargement de la liste
- AC5 : Les anomalies résolues apparaissent avec un badge "Résolu" grisé (non supprimées)
- AC6 : ADMIN only

**Note :** Dépend de la table `logs_anomalies` créée dans Story 7C.

---

### Story 7C — Persistance Batch + Notifications Admins

**Objectif :** Les anomalies et recommandations sont persistées en DB, un cron quotidien les détecte et notifie les admins.

**Acceptance Criteria :**
- AC1 : Table `logs_anomalies` créée dans PostgreSQL au démarrage du service (CREATE TABLE IF NOT EXISTS)
- AC2 : Table `recommandations_admin` créée dans PostgreSQL au démarrage du service
- AC3 : `POST /analytics/anomalies/run-detection` (ADMIN) — lance la détection + persistance
- AC4 : Cron quotidien 02:00 Douala → même logique que AC3 automatiquement
- AC5 : `GET /analytics/anomalies/history` (ADMIN) — liste les anomalies persistées avec filtres `?severite=&type=&resolue=&limit=`
- AC6 : Si des anomalies `critical` sont détectées → créer notification type `warning` pour tous les utilisateurs `est_admin=true` (via NotificationsService)
- AC7 : `POST /analytics/recommandations/run-generation` (ADMIN) — génère et persiste recommandations globales
- AC8 : Cron quotidien 03:00 Douala → même logique que AC7
- AC9 : `GET /analytics/admin/recommandations` (ADMIN) — liste recommandations avec filtres
- AC10 : `PATCH /analytics/recommandations/:id/validate` (ADMIN) — marque validée
- AC11 : `PATCH /analytics/recommandations/:id/reject` (ADMIN) — marque rejetée avec motif
- AC12 : ≥5 tests Jest

**Schéma des tables PostgreSQL :**
```sql
CREATE TABLE IF NOT EXISTS logs_anomalies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type VARCHAR(100) NOT NULL,  -- 'divergence_auto_vs_autres' | 'baisse_performance' | 'uniformite_evaluations' | 'biais_evaluateur'
  description TEXT NOT NULL,
  severite VARCHAR(20) NOT NULL,  -- 'info' | 'warning' | 'critical'
  matricule VARCHAR(20),
  details JSONB,
  resolue BOOLEAN DEFAULT false,
  date_resolution TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS recommandations_admin (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type VARCHAR(50) NOT NULL,  -- 'formation' | 'mentorat' | 'mobilite' | 'plan_developpement'
  priorite VARCHAR(20) NOT NULL,  -- 'haute' | 'moyenne' | 'basse'
  matricule VARCHAR(20) NOT NULL,
  titre TEXT NOT NULL,
  description TEXT NOT NULL,
  details JSONB,
  statut VARCHAR(20) DEFAULT 'en_attente',  -- 'en_attente' | 'validee' | 'rejetee'
  motif_rejet TEXT,
  validateur_matricule VARCHAR(20),
  date_validation TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_logs_anomalies_severite ON logs_anomalies(severite);
CREATE INDEX IF NOT EXISTS idx_logs_anomalies_resolue ON logs_anomalies(resolue);
CREATE INDEX IF NOT EXISTS idx_logs_anomalies_matricule ON logs_anomalies(matricule);
CREATE INDEX IF NOT EXISTS idx_recommandations_admin_statut ON recommandations_admin(statut);
CREATE INDEX IF NOT EXISTS idx_recommandations_admin_matricule ON recommandations_admin(matricule);
```

**Implémentation backend :**
```typescript
// analytics.service.ts — ajouter:

// Initialisation tables (appeler depuis onModuleInit ou constructor)
async initTables(): Promise<void> {
  await this.pg.query(`CREATE TABLE IF NOT EXISTS logs_anomalies (...)`);
  await this.pg.query(`CREATE TABLE IF NOT EXISTS recommandations_admin (...)`);
  // + indexes
}

// Persistance anomalies
async runAnomalyDetectionBatch(): Promise<{ total: number; critical: number }> {
  const result = await this._detecterAnomalies();  // calcul existant
  for (const anomalie of result.anomalies) {
    await this.pg.query(
      `INSERT INTO logs_anomalies (type, description, severite, matricule, details)
       VALUES ($1, $2, $3, $4, $5)`,
      [anomalie.type, anomalie.description, anomalie.severite, anomalie.matricule ?? null, JSON.stringify(anomalie.details)]
    );
  }
  // Notifier admins si critical
  if (result.par_severite.critical > 0) {
    await this.notifierAdminsCritical(result.par_severite.critical);
  }
  return { total: result.total, critical: result.par_severite.critical };
}

async getAnomaliesHistory(filters: { severite?: string; type?: string; resolue?: string; limit?: number }) { ... }

async acknowledgeAnomalie(id: string): Promise<{ success: boolean; id: string; resolue: boolean; date_resolution: Date }> {
  await this.pg.query(
    `UPDATE logs_anomalies SET resolue=true, date_resolution=NOW() WHERE id=$1`,
    [id]
  );
  this.cache.invalidate(`analytics:admin:anomalies:history`); // si invalidation supportée
  return { success: true, id, resolue: true, date_resolution: new Date() };
}

private async notifierAdminsCritical(nbCritical: number): Promise<void> {
  const admins = await this.prisma.utilisateur.findMany({ where: { est_admin: true, est_actif: true } });
  for (const admin of admins) {
    await this.notificationsService.create({
      destinataire_matricule: admin.matricule,
      titre: `${nbCritical} anomalie(s) critique(s) détectée(s)`,
      message: `Le batch de détection nocturne a identifié ${nbCritical} anomalie(s) critique(s). Consultez le dashboard Analytics.`,
      type: 'warning',
      lien: '/admin/dashboard?tab=anomalies',
    });
  }
}
```

**Scheduler :**
```typescript
// analytics/analytics.scheduler.ts
@Injectable()
export class AnalyticsScheduler {
  @Cron('0 2 * * *', { timeZone: 'Africa/Douala' })
  async runAnomalyDetection() { ... }

  @Cron('0 3 * * *', { timeZone: 'Africa/Douala' })
  async runRecommandationsGeneration() { ... }
}
```

---

## Processus d'exécution

### Étape 1 — Paralléliser 7A + 7C (indépendants)

**Agent A — Story 7A Backend + Frontend**
```
Implémente Story 7A BACKEND + FRONTEND (tendances multi-périodes) du projet SABC Eval360.
Ajoute getTendancesMultiPeriodes() dans AnalyticsService + route GET /analytics/tendances.
Crée TendancesTab.tsx + hook useAdminTendancesTabData() + ajoute tab "tendances" dans Admin Dashboard.
≥5 tests Jest. Build 0 erreur TS.
Voir docs/superpowers/epic7-session-prompt.md pour specs complètes.
```

**Agent B — Story 7B+C Backend**
```
Implémente Story 7B+C BACKEND (persistance anomalies + recommandations + batch cron) du projet SABC Eval360.
Crée tables logs_anomalies + recommandations_admin via initTables() dans AnalyticsService.
Ajoute runAnomalyDetectionBatch(), getAnomaliesHistory(), acknowledgeAnomalie().
Ajoute runRecommandationsBatch(), getAdminRecommandations(), validateRecommandation(), rejectRecommandation().
Crée AnalyticsScheduler avec crons 02:00 + 03:00.
Notifie admins si anomalies critiques via NotificationsService.
≥5 tests Jest. Build 0 erreur TS.
Voir docs/superpowers/epic7-session-prompt.md pour specs complètes.
```

### Étape 2 — Frontend 7B+C (après backends terminés)

**Agent Frontend — 7B+C UI**
```
Implémente le frontend Story 7B+C du projet SABC Eval360.
Met à jour AnomaliesTab + AnomaliesTableSection avec bouton "Marquer résolu" (PATCH acknowledge).
Met à jour ImprovementPlansTab avec boutons "Valider" / "Rejeter" par recommandation.
Ajoute useAdminAnomaliesHistoryTabData() dans useAdminDashboardTabs.ts.
Ajouter analyticsApi.acknowledgeAnomalie, .anomaliesHistory, .adminRecommandations, .validateRecommandation, .rejectRecommandation dans Services/api.ts.
TypeScript strict, pas de `any` dans les props.
```

### Étape 3 — Review + Commits

```bash
# Un commit par story
git add apps/api/src/analytics/ apps/web/src/Components/Dashboard/Admin/Tabs/TendancesTab.tsx apps/web/src/Hooks/queries/useAdminDashboardTabs.ts apps/web/src/pages/Admin/Dashboard/index.tsx apps/web/src/Services/api.ts
git commit -m "feat(analytics): [7A] multi-period trends tab with region/role filters"

git add apps/api/src/analytics/analytics.scheduler.ts
git commit -m "feat(analytics): [7B+C] anomaly/recommendation persistence, batch cron, admin notifications, acknowledge endpoints"

git add apps/web/src/Components/Dashboard/Admin/
git commit -m "feat(analytics): [7B+C] acknowledge anomalies UI + validate/reject recommendations"
```

### Étape 4 — Vérification finale
```bash
cd apps/api && npx tsc --noEmit    # 0 erreur
node_modules/.bin/jest             # tous verts
cd ../web && npx tsc --noEmit      # 0 erreur
git log --oneline -5
```

---

## Contraintes techniques

- **Tables PostgreSQL :** Créer via `this.pg.query(CREATE TABLE IF NOT EXISTS ...)` dans `onModuleInit()` ou `initTables()` — PAS via Prisma (qui ne gère que MySQL dans ce projet)
- **NotificationsService :** Déjà disponible via `NotificationsModule` — il faut importer `NotificationsModule` dans `AnalyticsModule` si pas déjà fait
- **Cache CacheService :** `this.cache.getOrCompute(key, ttlSeconds, fn)` — pattern existant
- **Tests :** mock `DatabasePgService` et `PrismaService` manuellement — pas de `@nestjs/testing`
- **Recharts :** Utiliser `ComposedChart` pour mixer Bar + Line sur le même graphe tendances
- **Frontend :** utiliser les composants existants dans `apps/web/src/components/` avant d'en créer de nouveaux
- **NE PAS** réécrire `analytics.service.ts` depuis zéro — ajouter seulement les nouvelles méthodes

---

## Fichiers de référence à lire avant de commencer

- `apps/api/src/analytics/analytics.service.ts` — toutes les méthodes existantes
- `apps/api/src/analytics/analytics.controller.ts` — routes existantes à ÉTENDRE
- `apps/api/src/analytics/analytics.module.ts` — module à ÉTENDRE
- `apps/api/src/analytics/analytics.service.spec.ts` — pattern de tests existant
- `apps/api/src/notifications/escalade.scheduler.ts` — pattern Cron existant
- `apps/api/src/notifications/notifications.service.ts` — API NotificationsService
- `apps/web/src/Hooks/queries/useAdminDashboardTabs.ts` — hooks existants à ÉTENDRE
- `apps/web/src/Components/Dashboard/Admin/Tabs/AnomaliesTab.tsx` — à modifier
- `apps/web/src/Components/Dashboard/Admin/Tabs/ImprovementPlansTab.tsx` — à modifier
- `apps/web/src/pages/Admin/Dashboard/index.tsx` — tabs à ÉTENDRE
- `apps/web/src/Services/api.ts` — analyticsApi à ÉTENDRE
