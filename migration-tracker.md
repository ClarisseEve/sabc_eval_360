# Migration Tracker

## Contexte

- Frontend primaire: `apps/web`
- Backend primaire: `apps/api`
- Architecture active: React SPA + NestJS API
- Transport HTTP frontend: `fetch` natif, plus `axios`

## État des phases

### Phase A

- [x] `A1` Choisir le frontend primaire

### Phase B

- [x] `B1` Admin Dashboard → real API
- [x] `B2` Role Dashboards → real API
- [x] `B3` Common Evaluations → real API
- [x] `B4` Admin Structure → real API
- [x] `B5` Admin Roles + Permissions → real API
- [x] `B6` Admin Utilisateurs → real API
- [x] `B7` Admin Remplacements → real API
- [x] `B8` Settings pages → real API
- [x] `B9` Header notifications → real API

### Phase C

- [~] `C1` Admin: Envoyer notification
- [~] `C2` Admin: Historique notifications
- [x] `C3` Analytics: Vue d'ensemble
- [x] `C4` Analytics: Par région
- [x] `C5` Analytics: Anomalies
- [x] `C6` Mon équipe: Subordonnés
- [x] `C7` Mon équipe: Évaluations
- [~] `C8` Evaluation: Create workflow nouveau
- [~] `C9` AS: Events + Reports

### Phase D

- [~] `D1` Prisma migrations
- [~] `D2` Seed data NestJS
- [~] `D3` Validation DTO
- [~] `D4` Rate limiting
- [x] `D5` Logging structuré
- [~] `D6` Guards rôles

### Phase E

- [x] `E1` Supprimer Dockerfiles obsolètes
- [x] `E2` docker-compose.yml nettoyer
- [ ] `E3` Vérifier docker compose up end-to-end
- [~] `E4` .env.example mettre à jour
- [~] `E5` CI/CD GitHub Actions

### Phase F

- [~] `F1` E2E tests NestJS
- [ ] `F2` Unit tests services critiques
- [ ] `F3` Frontend tests

### Phase G

- [x] `G1` Supprimer `resources/js/`
- [x] `G2` Supprimer `docker/Dockerfile`
- [x] `G3` Supprimer `docker/php/`, `docker/nginx/`, `docker/python/`
- [~] `G4` Supprimer `_legacy/` dans `apps/web`
- [~] `G5` Supprimer `_bmad*`, scripts shell obsolètes
- [x] `G6` Mettre à jour `README.md`
- [x] `G7` Mettre à jour `claude.md`

### Phase H

- [~] `H1` Loading skeletons partout
- [~] `H2` États vides
- [~] `H3` Gestion d’erreurs UI
- [ ] `H4` Mobile responsive
- [ ] `H5` Sidebar badges notifications

## Priorité immédiate

1. Rendre le runtime local cohérent
2. Valider `migrate + seed`
3. Faire tourner les E2E sur une base exploitable
4. Auditer les guards admin

## Blocages runtime constatés

- Le daemon Docker n'est pas accessible sur cette machine pour l'instant
- `apps/api/.env` était incohérent avec les ports réellement ouverts
- Le schéma PostgreSQL réel diffère du schéma supposé dans `seed.ts` et `TemplatesService`
- La base MySQL locale existe déjà et n'est pas un environnement vierge Prisma
- La CI GitHub peut builder `apps/web` et `apps/api`, mais les E2E restent non portables tant qu'un bootstrap complet du schéma business PostgreSQL n'est pas versionné

## Dernières décisions

- Ne pas utiliser `axios`
- Ne pas supprimer arbitrairement les fichiers legacy si le besoin est seulement de remplacer le transport HTTP
- Utiliser `fetch` natif pour le frontend navigateur
