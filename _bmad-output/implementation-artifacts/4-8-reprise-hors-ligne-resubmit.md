# Story 4.8: Reprise Hors-Ligne et Resubmit

Status: done

## Story

En tant qu'évaluateur,
Je veux pouvoir continuer à saisir mon évaluation même sans connexion réseau,
Afin de ne perdre aucune donnée saisie en cas de coupure.

## Acceptance Criteria

**Given** je suis en train de saisir une évaluation et je perds la connexion
**When** je continue à saisir des notes
**Then** les données sont sauvegardées localement (IndexedDB)
**And** un message "Envoi en attente" est affiché
**And** à la reconnexion, les données sont envoyées automatiquement au serveur
**And** un bouton de relance manuelle est disponible si l'envoi échoue
**And** aucune donnée saisie n'est perdue

## Tasks / Subtasks

- [ ] Service OfflineStorageService (AC: 1, 2, 4, 5)
  - [ ] Wrapper IndexedDB pour les brouillons
  - [ ] `saveDraft(evaluationId, notes, commentaire)` — sauvegarde locale
  - [ ] `getDraft(evaluationId)` — récupère le brouillon local
  - [ ] `deleteDraft(evaluationId)` — supprime après sync
  - [ ] `getAllPendingDrafts()` — liste les brouillons en attente

- [ ] Hook useOfflineSync (AC: 2, 3, 4)
  - [ ] Détection connexion via `navigator.onLine` + `online`/`offline` events
  - [ ] Retry automatique avec backoff exponentiel
  - [ ] `isSyncing`, `pendingCount`, `lastSyncTime` exposés
  - [ ] Bouton relance manuelle

- [ ] Intégration dans Edit.tsx (AC: 1, 2, 3)
  - [ ] Auto-save toutes les 30s dans IndexedDB
  - [ ] Indicateur de statut (en ligne / hors ligne / en attente)
  - [ ] Restauration du brouillon local à l'ouverture

## Dev Notes

### Architecture
- IndexedDB via `idb` library ou native API
- Store: `sabc_drafts` DB, objectStore `evaluation_drafts`, keyPath `evaluation_id`
- Sync: `navigator.onLine` + EventListener pour `online` event
- Retry: backoff 1s → 2s → 4s → 8s (max 4 tentatives)

### Dépendances
- Story 4.1 (création évaluation)
- Story 4.2 (saisie notes)
- Story 4.3 (soumission)

## Dev Agent Record

_À implémenter_
