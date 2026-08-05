# Session Prompt — Epic 5 : Moteur de Notifications & Escalade

> Copier-coller entier au démarrage d'une nouvelle session Claude Code dans `/Users/macbook/Documents/SABC/sabc_eval360`

---

## Mission

Implémenter l'**Epic 5** complet (4 stories) du projet SABC Eval360 en mode Subagent-Driven Development.  
Chaque story est implémentée, testée, reviewée (BMAD), puis commitée. Les stories 5.1 et 5.2 peuvent tourner en parallèle ; 5.3 et 5.4 pareil.

**Critères de succès :**
- `npx tsc --noEmit` → 0 erreur
- `node_modules/.bin/jest` (dans `apps/api/`) → tous les tests passent
- 4 commits distincts, un par story
- Chaque story a son spec Jest avec au moins 5 tests

---

## Contexte projet

**Stack active :** NestJS 11 + Prisma 6 (MySQL) + PostgreSQL (evaluations) + React 19 + TypeScript strict  
**Répertoire :** `apps/api/src/`  
**Tests :** Jest, fichiers `*.spec.ts` colocalisés avec les services  
**Cron :** `@nestjs/schedule` — déjà configuré dans `AppModule`  
**Langue :** code NestJS en anglais, entités métier en français

**Pattern à respecter :**
```typescript
// Service
@Injectable()
export class MonService {
  constructor(private pg: DatabasePgService, private prisma: PrismaService) {}
}
// Spec
describe('MonService', () => {
  let service: MonService;
  let mockPg: jest.Mocked<DatabasePgService>;
  beforeEach(() => { /* instanciation manuelle sans NestJS DI */ });
});
```

---

## État actuel (NE PAS réimplémenter)

### Déjà commité et fonctionnel

| Fichier | Rôle |
|---------|------|
| `notifications/notifications.service.ts` | `create()`, `getForUser()`, `countNonLues()`, `marquerCommeLue()`, `notifierRappelEvaluation(matricule, jours)` |
| `notifications/notifications.module.ts` | Module global, `NotificationsService` exporté |
| `periodes/periodes-scheduler.service.ts` | 3 crons : `ouvrirPeriodes()` 00:01, `envoyerRappels()` 09:00, `fermerPeriodes()` 23:59 |
| `periodes/periodes.module.ts` | `PeriodesSchedulerService` déjà enregistré |

### `PeriodesSchedulerService` — état actuel
```typescript
// ouvrirPeriodes() → ouvre les périodes mais NE notifie PAS les utilisateurs
// envoyerRappels() → détecte les rappels configurés mais NE crée PAS de notifications (juste logger.log)
// fermerPeriodes() → ferme les périodes mais NE notifie PAS
```

### `NotificationsService` — helpers existants à réutiliser
```typescript
notifierRappelEvaluation(matricule: string, joursRestants: number): Promise<...>
create(data: CreateNotificationDto): Promise<{ id_notification: string }>
// type NotificationType = 'info' | 'success' | 'warning' | 'reminder' | 'evaluation' | 'validation'
```

### Schéma Prisma MySQL (`Utilisateur`)
```
matricule: string (PK)
est_actif: boolean
statut: string  // 'Actif' | 'Inactif'
role: string
manager_matricule: string | null
preferences_json: Json | null  // { notifications_email?: boolean, ... }
```

### PostgreSQL (evaluations) — tables clés
```sql
evaluations (id_evaluation, evaluateur_matricule, evalue_matricule, statut, id_periode, date_soumission, created_at)
periodes_evaluation (id_periode, nom_periode, date_debut, date_fin, statut, est_ouverte, est_cloturee, dates_rappels_json)
-- statut evaluation: 'brouillon' | 'soumis' | 'valide' | 'rejete'
```

---

## Stories à implémenter

### Story 5.1 — Notification d'ouverture de période

**Objectif :** Quand `ouvrirPeriodes()` ouvre une période, notifier tous les utilisateurs actifs non-ADMIN.

**Acceptance Criteria :**
- AC1 : Après ouverture d'une période, une notification est créée pour **chaque utilisateur actif** (statut='Actif', est_actif=true, role ≠ 'ADMIN')
- AC2 : Contenu : titre="Nouvelle période d'évaluation ouverte", message="La période {nom} est ouverte. Vous avez jusqu'au {date_fin} pour compléter vos évaluations.", type='info', lien='/evaluations'
- AC3 : La méthode est fire-and-forget (erreur sur un utilisateur ne bloque pas les autres)
- AC4 : Le logger enregistre `[5.1] ${n} notifications envoyées pour période ${nom_periode}`
- AC5 : Si aucun utilisateur actif → log warning, pas d'erreur

**Fichiers à créer/modifier :**
- `notifications/notifications-ouverture.service.ts` — `NotificationsOuvertureService` avec méthode `notifierOuverturePeriode(idPeriode: string, nomPeriode: string, dateFin: string): Promise<number>`
- `notifications/notifications-ouverture.service.spec.ts` — 5+ tests
- `periodes/periodes-scheduler.service.ts` — injecter `NotificationsOuvertureService`, appeler après `periodesService.ouvrir()`
- `periodes/periodes.module.ts` — ajouter `NotificationsOuvertureService` en provider, importer `NotificationsModule`

**Implémentation NestJS (traduit du spec PHP) :**
```typescript
// NotificationsOuvertureService.notifierOuverturePeriode()
// 1. Fetch users: prisma.utilisateur.findMany({ where: { statut: 'Actif', est_actif: true, role: { not: 'ADMIN' } } })
// 2. For each user: notificationsService.create({ destinataire_matricule, titre, message, type: 'info', lien: '/evaluations' })
// 3. Return count of notifications sent
```

---

### Story 5.2 — Rappels automatiques évaluations en retard

**Objectif :** `envoyerRappels()` (déjà planifié à 09:00) doit envoyer de vraies notifications aux utilisateurs avec des évaluations brouillon sur des périodes ouvertes.

**Acceptance Criteria :**
- AC1 : Pour chaque date de rappel configurée (`dates_rappels_json`) qui correspond à aujourd'hui, identifier les évaluations en statut `brouillon` sur la période concernée
- AC2 : Notifier **l'évaluateur** : type='reminder', titre="Rappel : évaluation en attente", message="Il vous reste {jours} jour(s) pour compléter votre évaluation avant la fin de la période {nom}."
- AC3 : Ne pas envoyer 2x le même rappel le même jour pour la même évaluation (dédoublonnage par `(id_evaluation, date_rappel)` via colonne `dernier_rappel_envoye` ou check en mémoire)
- AC4 : Rappels J-7, J-3, J-1 : calcul `jours = Math.ceil((date_fin - today) / 86400000)`
- AC5 : Logger `[5.2] ${n} rappels envoyés pour période ${nom}`

**Fichiers à créer/modifier :**
- `notifications/notifications-rappel.service.ts` — `NotificationsRappelService` avec `envoyerRappelsPeriode(idPeriode: string, nomPeriode: string, dateFin: string, joursRestants: number): Promise<number>`
- `notifications/notifications-rappel.service.spec.ts` — 5+ tests
- `periodes/periodes-scheduler.service.ts` — remplacer `logger.log` dans `envoyerRappels()` par appel réel à `NotificationsRappelService`

**Implémentation NestJS :**
```typescript
// NotificationsRappelService.envoyerRappelsPeriode()
// 1. pg.query: SELECT DISTINCT evaluateur_matricule FROM evaluations
//    WHERE id_periode = $1 AND statut = 'brouillon'
// 2. For each evaluateur: notificationsService.notifierRappelEvaluation(matricule, joursRestants)
//    OU create({ titre, message, type: 'reminder', donnees_json: { id_periode, jours_restants } })
// 3. Return count
```

---

### Story 5.3 — Notifications validations en attente managers

**Objectif :** Cron quotidien à 10:00 — notifier les managers qui ont des évaluations `soumis` depuis >3 jours sans validation.

**Acceptance Criteria :**
- AC1 : Cron à 10:00 Africa/Douala, détecte les évaluations `statut='soumis'` avec `date_soumission < NOW() - 3 days`
- AC2 : Grouper par `manager_matricule` de l'évalué (via `evalue_matricule` → `Utilisateur.manager_matricule`)
- AC3 : Une seule notification par manager (même s'il a 5 évaluations en attente) : "Vous avez {n} évaluation(s) en attente de validation depuis plus de 3 jours."
- AC4 : Les DR/CDTT avec `peut_cross_branch=true` reçoivent aussi les alertes pour leur région
- AC5 : Logger `[5.3] ${n} managers notifiés`

**Fichiers à créer :**
- `notifications/notifications-validation-attente.service.ts` — `NotificationsValidationAttenteService`
- `notifications/notifications-validation-attente.service.spec.ts` — 5+ tests
- `notifications/notifications-validation-attente.scheduler.ts` — `NotificationsValidationAttenteScheduler` avec `@Cron('0 10 * * *', { timeZone: 'Africa/Douala' })`
- Enregistrer dans `notifications.module.ts`

**Implémentation NestJS :**
```typescript
// NotificationsValidationAttenteService.notifierManagersAttente()
// 1. pg.query: SELECT e.id_evaluation, e.evalue_matricule, e.date_soumission
//    FROM evaluations e JOIN periodes_evaluation p ON p.id_periode = e.id_periode
//    WHERE e.statut = 'soumis' AND e.date_soumission < NOW() - INTERVAL '3 days'
//    AND p.statut = 'ouverte'
// 2. For each eval: find manager via prisma.utilisateur.findUnique({ where: { matricule: evalue_matricule }, select: { manager_matricule: true } })
// 3. Group by manager_matricule
// 4. Send one notification per manager
// Return: count of managers notified
```

---

### Story 5.4 — Processus d'escalade automatique

**Objectif :** Escalade progressive quand un manager ne valide pas dans les délais. 4 niveaux : 3j → 7j → 10j → 15j.

**Acceptance Criteria :**
- AC1 : Cron quotidien à 08:00 — détecte les évaluations `soumis` avec délais dépassés
- AC2 : Niveau 1 (≥3j, <7j) → notifier l'évaluateur : "Votre évaluation attend validation depuis {n} jours."
- AC3 : Niveau 2 (≥7j, <10j) → notifier le manager N+1 (manager du manager) : "{n} évaluation(s) de votre équipe en attente depuis {n} jours."
- AC4 : Niveau 3 (≥10j, <15j) → notifier le DR/CDTT de la région
- AC5 : Niveau 4 (≥15j) → notifier les admins (`est_admin=true`)
- AC6 : Chaque niveau notifie **en plus** des niveaux précédents (cumul, pas remplacement)
- AC7 : Logger `[5.4] escalade L{niveau}: ${n} notifications`

**Fichiers à créer :**
- `notifications/escalade.service.ts` — `EscaladeService` avec méthode `traiterEscalade(): Promise<{ l1: number; l2: number; l3: number; l4: number }>`
- `notifications/escalade.service.spec.ts` — 6+ tests (un par niveau + cas bord)
- `notifications/escalade.scheduler.ts` — `EscaladeScheduler` avec `@Cron('0 8 * * *', { timeZone: 'Africa/Douala' })`
- Enregistrer dans `notifications.module.ts`

**Implémentation NestJS :**
```typescript
// EscaladeService.traiterEscalade()
// 1. Fetch: SELECT id_evaluation, evalue_matricule, date_soumission,
//    EXTRACT(EPOCH FROM (NOW() - date_soumission))/86400 AS jours_attente
//    FROM evaluations WHERE statut = 'soumis'
// 2. For each: determine level (jours >= 3, >=7, >=10, >=15)
// 3. Niveau 1: notify evaluateur
// 4. Niveau 2+: fetch manager via Utilisateur.manager_matricule, notify manager N+1
// 5. Niveau 3+: fetch DR de la region via pg query, notify
// 6. Niveau 4+: fetch admins via prisma (est_admin=true), notify
```

---

## Processus d'exécution

### Étape 1 — Paralléliser les stories 5.1 et 5.2

Lancer **deux agents simultanément** :

**Agent A — Story 5.1**
```
Implémente Story 5.1 (notification ouverture période) du projet SABC Eval360.
Répertoire: apps/api/src/notifications/ et apps/api/src/periodes/
Crée: NotificationsOuvertureService + spec (5+ tests) + modifier PeriodesSchedulerService.ouvrirPeriodes()
Build doit passer (0 TS error), tous les tests existants passent.
Voir le fichier docs/superpowers/epic5-session-prompt.md pour les détails complets.
```

**Agent B — Story 5.2**
```
Implémente Story 5.2 (rappels automatiques) du projet SABC Eval360.
Répertoire: apps/api/src/notifications/ et apps/api/src/periodes/
Crée: NotificationsRappelService + spec (5+ tests) + modifier PeriodesSchedulerService.envoyerRappels()
Build doit passer (0 TS error), tous les tests existants passent.
Voir le fichier docs/superpowers/epic5-session-prompt.md pour les détails complets.
```

### Étape 2 — Review BMAD (après les deux agents)

Pour chaque story complétée, lancer un agent de review :

**Review 5.1**
```
BMAD Code Review — Story 5.1 (notification ouverture période):
1. Spec compliance: vérifie que chaque AC est satisfait avec preuves dans le code
2. Code quality: imports inutilisés, types any, gestion d'erreurs
3. Adversarial: injection SQL? N+1 queries? race condition? 
Fichiers: apps/api/src/notifications/notifications-ouverture.service.ts + spec + periodes-scheduler.service.ts
Retourne: PASS (liste AC verts) ou FAIL (liste défauts critiques à corriger)
```

### Étape 3 — Paralléliser les stories 5.3 et 5.4

Même pattern qu'étape 1, puis review BMAD.

### Étape 4 — Commits

Un commit par story :
```
feat(notif): [5.1] send period-opening notifications to all active users
feat(notif): [5.2] implement actual reminder dispatch in scheduler cron
feat(notif): [5.3] daily cron — alert managers with pending validations >3 days
feat(notif): [5.4] automatic escalation L1–L4 for unvalidated evaluations
```

### Étape 5 — Vérification finale
```bash
cd apps/api && npx tsc --noEmit  # doit retourner 0 erreur
node_modules/.bin/jest --passWithNoTests  # tous verts
git log --oneline -6  # voir les 4 nouveaux commits
```

---

## Contraintes techniques

- **Jamais** de `import type` incompatible avec `moduleResolution: nodenext`
- **Jamais** `include: { region: true }` sur Utilisateur (relation inexistante dans le schema Prisma)
- **Toujours** utiliser `DatabasePgService` pour les queries PostgreSQL (evaluations)  
- **Toujours** utiliser `PrismaService` pour les queries MySQL (utilisateurs)
- `NotificationsModule` est `@Global()` — injectez `NotificationsService` directement, pas besoin d'importer `NotificationsModule`
- Les specs doivent mocker `PrismaService` et `DatabasePgService` manuellement (pas de `@nestjs/testing`)

---

## Fichiers de référence à lire avant de commencer

- `apps/api/src/periodes/periodes-scheduler.service.ts` — état actuel du scheduler
- `apps/api/src/notifications/notifications.service.ts` — API disponible
- `apps/api/src/common/services/audit-log.service.ts` — pattern fire-and-forget à imiter
- `apps/api/src/evaluations/eligibility.service.spec.ts` — pattern de spec sans DI NestJS
- `apps/api/prisma/schema.prisma` — modèles MySQL disponibles
