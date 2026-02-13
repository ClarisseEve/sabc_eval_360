---
stepsCompleted:
  - step-01-validate-prerequisites
  - step-02-design-epics
  - step-03-create-stories
inputDocuments:
  - /Users/macbook/Documents/SABC/sabc_eval360/_bmad-output/analysis/brainstorming-session-2026-01-08.md
  - /Users/macbook/Documents/SABC/sabc_eval360/_bmad-output/implementation-artifacts/1-1-setup-projet-architecture-multi-db.md
  - /Users/macbook/Documents/SABC/sabc_eval360/_bmad-output/implementation-artifacts/1-2-authentification-session-utilisateur.md
  - /Users/macbook/Documents/SABC/sabc_eval360/_bmad-output/implementation-artifacts/1-3-gestion-roles-permissions-rbac.md
  - /Users/macbook/Documents/SABC/sabc_eval360/_bmad-output/implementation-artifacts/1-4-structure-organisationnelle-regions-branches.md
  - /Users/macbook/Documents/SABC/sabc_eval360/_bmad-output/implementation-artifacts/1-5-gestion-hierarchique-utilisateurs.md
  - /Users/macbook/Documents/SABC/sabc_eval360/_bmad-output/implementation-artifacts/1-6-profil-utilisateur-champs-restreints.md
  - /Users/macbook/Documents/SABC/sabc_eval360/_bmad-output/implementation-artifacts/1-7-composants-dashboard-reutilisables-dashboards-role.md
  - /Users/macbook/Documents/SABC/sabc_eval360/_bmad-output/implementation-artifacts/2-1-creation-regles-evaluation-criteres.md
  - /Users/macbook/Documents/SABC/sabc_eval360/_bmad-output/implementation-artifacts/2-2-configuration-eligibilites-evaluation.md
  - /Users/macbook/Documents/SABC/sabc_eval360/_bmad-output/implementation-artifacts/2-3-gestion-exceptions-roles-dr-cdtt.md
  - /Users/macbook/Documents/SABC/sabc_eval360/_bmad-output/implementation-artifacts/2-4-moteur-validation-permissions-evaluation.md
  - /Users/macbook/Documents/SABC/sabc_eval360/_bmad-output/implementation-artifacts/3-1-creation-templates-evaluation.md
  - /Users/macbook/Documents/SABC/sabc_eval360/_bmad-output/implementation-artifacts/3-2-assignation-templates-role-periode.md
  - /Users/macbook/Documents/SABC/sabc_eval360/_bmad-output/implementation-artifacts/3-3-creation-gestion-periodes-evaluation.md
  - /Users/macbook/Documents/SABC/sabc_eval360/_bmad-output/implementation-artifacts/3-4-ouverture-fermeture-automatique-periodes.md
  - /Users/macbook/Documents/SABC/sabc_eval360/_bmad-output/implementation-artifacts/4-1-creation-evaluation-utilisateur-eligible.md
  - /Users/macbook/Documents/SABC/sabc_eval360/_bmad-output/implementation-artifacts/4-2-notation-commentaires-criteres.md
  - /Users/macbook/Documents/SABC/sabc_eval360/_bmad-output/implementation-artifacts/4-3-validation-soumission-evaluation.md
  - /Users/macbook/Documents/SABC/sabc_eval360/_bmad-output/implementation-artifacts/4-4-validation-rejet-evaluation-manager.md
  - /Users/macbook/Documents/SABC/sabc_eval360/_bmad-output/implementation-artifacts/4-5-consultation-evaluations-recues.md
  - /Users/macbook/Documents/SABC/sabc_eval360/_bmad-output/implementation-artifacts/4-6-consultation-evaluations-donnees.md
  - /Users/macbook/Documents/SABC/sabc_eval360/_bmad-output/implementation-artifacts/5-1-notification-ouverture-periode.md
  - /Users/macbook/Documents/SABC/sabc_eval360/_bmad-output/implementation-artifacts/5-2-rappels-automatiques-evaluations-retard.md
  - /Users/macbook/Documents/SABC/sabc_eval360/_bmad-output/implementation-artifacts/5-3-notifications-validation-attente-managers.md
  - /Users/macbook/Documents/SABC/sabc_eval360/_bmad-output/implementation-artifacts/5-4-processus-escalade-automatique.md
  - /Users/macbook/Documents/SABC/sabc_eval360/_bmad-output/implementation-artifacts/6-1-dashboard-manager-progression-equipe.md
  - /Users/macbook/Documents/SABC/sabc_eval360/_bmad-output/implementation-artifacts/6-2-dashboard-manager-validations-attente.md
  - /Users/macbook/Documents/SABC/sabc_eval360/_bmad-output/implementation-artifacts/6-3-dashboard-collaborateur-statut-evaluation.md
  - /Users/macbook/Documents/SABC/sabc_eval360/_bmad-output/implementation-artifacts/7-1-kpis-globaux-region-branche-role.md
  - /Users/macbook/Documents/SABC/sabc_eval360/_bmad-output/implementation-artifacts/7-2-detection-signalement-anomalies.md
  - /Users/macbook/Documents/SABC/sabc_eval360/_bmad-output/implementation-artifacts/7-3-recommandations-actions-formation-mentorat-mobilite.md
  - /Users/macbook/Documents/SABC/sabc_eval360/_bmad-output/implementation-artifacts/8-1-report-builder-sections-templatisees.md
  - /Users/macbook/Documents/SABC/sabc_eval360/_bmad-output/implementation-artifacts/8-2-export-rapports-ppt-excel-graphes.md
  - /Users/macbook/Documents/SABC/sabc_eval360/_bmad-output/implementation-artifacts/8-3-logs-audit-tracabilite.md
  - /Users/macbook/Documents/SABC/sabc_eval360/_bmad-output/implementation-artifacts/8-4-corrections-affectations-utilisateurs-support.md
  - /Users/macbook/Documents/SABC/sabc_eval360/_bmad-output/implementation-artifacts/sprint-status.yaml
  - /Users/macbook/Documents/SABC/sabc_eval360/_bmad-output/planning-artifacts/architecture.md
  - /Users/macbook/Documents/SABC/sabc_eval360/_bmad-output/planning-artifacts/bmm-workflow-status.yaml
  - /Users/macbook/Documents/SABC/sabc_eval360/_bmad-output/planning-artifacts/epics.md
  - /Users/macbook/Documents/SABC/sabc_eval360/_bmad-output/planning-artifacts/prd.md
  - /Users/macbook/Documents/SABC/sabc_eval360/_bmad-output/planning-artifacts/ux-design-directions.html
  - /Users/macbook/Documents/SABC/sabc_eval360/_bmad-output/planning-artifacts/ux-design-specification.md
  - /Users/macbook/Documents/SABC/sabc_eval360/_bmad-output/project-context.md---

# sabc_eval360 - Epic Breakdown

## Overview

This document provides the complete epic and story breakdown for sabc_eval360, decomposing the requirements from the PRD, UX Design if it exists, and Architecture requirements into implementable stories.

## Requirements Inventory

### Functional Requirements

FR1: L’admin peut créer, modifier et désactiver des utilisateurs avec leurs attributs d’organisation (matricule, région, branche, manager).
FR2: L’admin peut assigner et modifier les rôles et permissions des utilisateurs.
FR3: Les utilisateurs peuvent s’authentifier et accéder à un dashboard selon leur rôle.
FR4: Les utilisateurs peuvent consulter et mettre à jour leur profil.
FR5: Le système peut restreindre l’accès aux données et fonctionnalités selon le rôle.
FR6: L’admin peut configurer des régions et les marquer Tanière / Non‑Tanière.
FR7: L’admin peut configurer branches et niveaux hiérarchiques.
FR8: Le système peut valider la cohérence hiérarchique lors d’assignations manager‑subordonné.
FR9: Le système peut imposer l’alignement de région entre manager et subordonné.
FR10: Le système peut autoriser la supervision inter‑branche uniquement pour les rôles habilités.
FR11: L’admin peut définir des règles d’évaluation avec critères et éligibilités (auto/pairs/subordonnés).
FR12: Le système peut autoriser l’auto‑évaluation uniquement pour les rôles permis.
FR13: Le système peut autoriser l’évaluation par pairs selon niveau, région et branche.
FR14: Le système peut autoriser l’évaluation descendante uniquement pour les liens hiérarchiques directs.
FR15: Le système peut bloquer toute action d’évaluation non conforme aux règles.
FR16: Le système peut appliquer les exceptions de rôles (ex. DR/CDTT cross‑branche, pas d’auto‑éval).
FR17: Un évaluateur peut créer une évaluation pour un utilisateur éligible sur une période ouverte.
FR18: Un évaluateur peut sauvegarder une évaluation en brouillon et la soumettre plus tard.
FR19: Le système peut valider la complétude des critères et les bornes de notation avant soumission.
FR20: Un évaluateur peut soumettre une évaluation et recevoir confirmation.
FR21: Un valideur/manager peut valider ou rejeter une évaluation soumise.
FR22: Une évaluation rejetée peut repasser en brouillon pour correction.
FR23: Un évalué peut consulter ses évaluations reçues et leur statut.
FR24: Un évaluateur peut consulter ses évaluations données et leur statut.
FR25: Un manager peut effectuer une contre‑évaluation quand la politique le permet.
FR26: L’admin peut créer et éditer des templates de fiches d’évaluation.
FR27: L’admin peut assigner des templates par rôle et par période.
FR28: L’admin peut créer et gérer des périodes d’évaluation (dates début/fin).
FR29: Le système peut ouvrir/fermer automatiquement les périodes selon le calendrier.
FR30: Le système peut afficher l’état d’une période (ouverte/fermée, échéances).
FR31: Le système peut notifier l’ouverture d’une période aux utilisateurs concernés.
FR32: Le système peut envoyer des rappels pour évaluations en retard.
FR33: Le système peut notifier les managers des validations en attente et des escalades.
FR34: Les utilisateurs peuvent consulter leurs notifications et les marquer comme lues.
FR35: Les managers peuvent voir la progression de leur équipe et le KPI “reste d’évaluations”.
FR36: Les managers peuvent voir les évaluations/validations en attente par collaborateur.
FR37: Les managers peuvent consulter des statistiques d’équipe (scores, progression).
FR38: Les collaborateurs peuvent voir leur statut d’évaluation et qui les a évalués (selon permissions).
FR39: Les utilisateurs peuvent filtrer les vues par période et périmètre d’équipe.
FR40: L’admin peut consulter des KPIs globaux par région, branche et rôle.
FR41: L’admin peut accéder à l’analytics d’un utilisateur (scores, historique).
FR42: Le système peut détecter et signaler des anomalies (écarts auto/pairs/manager, variance faible, baisse).
FR43: L’admin peut analyser des segments (région/branche/role/période) avec agrégats anonymisés si requis.
FR44: L’admin peut consulter des tendances temporelles multi‑périodes.
FR45: Le système peut proposer des recommandations d’actions (formation/mentorat/mobilité).
FR46: L’admin peut créer un rapport avec sections templatisées et texte libre.
FR47: L’admin peut ajouter des graphes depuis l’analytics dans un rapport.
FR48: L’admin peut éditer ou accepter les commentaires proposés pour les sections de rapport.
FR49: L’admin peut exporter un rapport en PPT et Excel.
FR50: L’admin peut exporter des graphes individuellement.
FR51: Le support/admin peut corriger les affectations d’un utilisateur (rôle, région, branche, manager).
FR52: Le système peut journaliser les actions administratives et tentatives d’accès.
FR53: L’admin peut consulter les logs d’audit pour conformité et diagnostic.

### NonFunctional Requirements

NFR1: Chargement initial < 5s sur 3G/4G.
NFR2: Bundle initial < 300KB.
NFR3: API < 1s (standard), DB < 200ms.
NFR4: FCP < 3s ; TTI < 6s.
NFR5: Données sensibles chiffrées en transit et au repos.
NFR6: RBAC strict + journaux d’accès admin.
NFR7: Filtrage régional obligatoire sur toutes les requêtes (pas de fuite inter‑régions).
NFR8: Anonymisation pour agrégats globaux.
NFR9: Disponibilité ≥ 99.5%.
NFR10: Sauvegarde quotidienne + restauration testée mensuellement.
NFR11: Supporter x3 volume d’utilisateurs sans dégradation > 10%.
NFR12: Batch analytics quotidien + cache pour KPIs critiques.
NFR13: WCAG AA (contrastes, navigation clavier, labels).
NFR14: Logs admin + métriques API (latence, erreurs).
NFR15: Alertes si latence > 3s sur 5 minutes.

### Additional Requirements

- Starter template: conserver le monorepo existant (Laravel + Inertia/React + services Go + pipelines Python). Aucune ré‑initialisation; si nouveau service Go, partir d’un service existant.
- Architecture multi‑DB: MySQL (core/identité), PostgreSQL (business/évaluations), ClickHouse (analytics) avec SoT séparés; synchronisation planifiée MySQL→PostgreSQL et batch PostgreSQL→ClickHouse.
- Strangler pattern via proxies Laravel (EvaluationServiceProxy, AnalyticsServiceProxy) avec feature flags et fallback si service Go indisponible.
- Services Go exposent `/api/v2/*` + endpoints `/health` et `/metrics` (Prometheus).
- Authentification: Laravel Passport + JWT; inter‑services via JWT signé; middleware `auth` sur routes privées; logging des accès admin.
- API REST/JSON avec documentation OpenAPI; enveloppe d’erreur standardisée; `request_id` corrélé dans logs.
- Conventions: API en `snake_case`, UI en `camelCase` (adapters); Inertia pages uniquement dans `resources/js/Pages`.
- Front: Inertia/React, state par domaine (Zustand), cache/queries (TanStack Query) pour analytics/KPIs; pagination server‑side + code‑splitting.
- Observabilité: Prometheus + Grafana + Jaeger; métriques/latences suivies; alerting si dérive.
- Cache analytics via Redis avec TTL horaire; afficher “last updated”; analytics batch (pas de temps réel implicite).
- Design system SABC obligatoire (couleurs rouge/orange, Poppins/Inter, tokens), cohérence des composants.
- UX: navigation latérale persistante + breadcrumbs, panneaux contextuels (drawer), KPIs en cartes, tabs pour analytics.
- UX: MPA desktop‑first, mobile simplifié; responsive 320–768px; zones tactiles ≥ 44px.
- UX: démarrer une évaluation en 1–2 clics; auto‑save du brouillon; reprise après coupure réseau (queue locale + resubmit).
- UX: validation inline, indicateur de progression, feedback “check vert” après soumission.
- Profil utilisateur: champs éditables limités (nom, prénom, mot de passe, date de naissance, préférences JSON); champs org en lecture seule.
- Rôles & permissions: DR/CDTT = cross‑branche, portées géographiques spécifiques; ADMIN hors hiérarchie; modifications loggées.
- Régions Tanière vs Non‑Tanière: 5 niveaux vs 3 niveaux hiérarchiques; suppression interdite si utilisateurs liés.
- Hiérarchie: manager doit être dans la même région; cohérence niveau manager > subordonné; supervision inter‑branche limitée aux rôles habilités.
- Règles d’évaluation: critères min. 5, pondération totale = 100%, échelle 1–5, catégorisation; règles activables/désactivables.
- Éligibilités: auto/pairs/descendante selon flags; pairs = même niveau/région/branche; rôles uniques (DR/CDTT/RTM/SRMO) pas d’évaluation pairs.
- Moteur de validation des permissions: bloque actions non conformes, messages explicites, tentatives loggées.
- Templates d’évaluation: structure JSON, statut publié/brouillon; seuls les publiés sont utilisables.
- Assignation templates par rôle & période; erreur si aucun template; assignations modifiables avant ouverture.
- Périodes: statuts planifiée/ouverte/fermée, pas de chevauchement; rappels J‑7/J‑3/J‑1; stats de période en JSON.
- Ouverture/fermeture automatiques des périodes; après fermeture, brouillons conservés mais non soumis; rapport de clôture généré.
- Création d’évaluation: `statut=brouillon`, lié à évaluateur/évalué/période/template; critères affichés 1–5.
- Notation: commentaire obligatoire si note < 3; progression % de critères complétés.
- Soumission: validation complétude + bornes, `date_soumission` enregistrée, notification manager, verrouillage édition.
- Validation manager: seul manager direct valide/rejette; rejet avec motif obligatoire et retour en brouillon; DR/CDTT valident cross‑branche.
- Consultation des évaluations reçues: uniquement validées; filtrage par période; type d’évaluation affiché.
- Consultation des évaluations données: reprise brouillon possible; motif de rejet visible; filtres période/type.
- Notifications ouverture période: message avec dates + nb d’évaluations; lien direct; email si opt‑in.
- Rappels auto: brouillon > 7 jours + J‑7/J‑3/J‑1 + rappel final post‑clôture; compteur de rappels.
- Notifications validation en attente: > 3 jours, daily jusqu’à résolution; DR/CDTT inclus selon périmètre.
- Escalade automatique: 3j (évaluateur/manager), 7j (manager N+1), 10j (DR), 15j (admin), loggée et visible dashboard admin.
- Dashboards par rôle: composants réutilisables (KPI, charts, tables, filtres, notifications); filtrage région/branche automatique.
- Dashboard manager: KPI “reste d’évaluations”, liste subordonnés, chart 6 mois; données via TanStack Query.
- Validations en attente: tri par ancienneté, badge rouge si > 3 jours; filtres évaluateur/évalué.
- Dashboard collaborateur: tâches à compléter, évaluations reçues, score global si calculé, progression vs période précédente.
- Analytics admin: KPIs globaux + segmentation région/branche/rôle; cache Redis TTL horaire; source Go Analytics.
- Anomalies: divergence auto vs autres > 1.5; baisse < -1 sur 3 mois; variance < 0.5; biais évaluateur; stockage `logs_anomalies` + notif sévérité.
- Recommandations: formation si score < 3/5, mentorat par matching, mobilité si forte progression; validation admin + plans de développement.
- Report builder: sections templatisées + texte libre, ajout graphes drag‑drop, réorganisation, brouillon éditable, preview.
- Exports: PPTX/Excel (sections + graphes), export graphe PNG/SVG/PDF, branding SABC, historique des exports.
- Audit logs: filtres date/utilisateur/type/résultat, export CSV, accès non autorisés en rouge, rétention 2 ans.
- Corrections support: modifications affectations avec motif + log anciennes/nouvelles valeurs, notification utilisateur, alerte impact évaluations.
- Règles d’ingénierie: TypeScript strict, pnpm obligatoire, ajout des variables dans `.env.example`, respect des conventions de test et lint.

### FR Coverage Map

### FR Coverage Map

FR1: Epic 1 - Accès & identité utilisateur (gestion utilisateurs)
FR2: Epic 1 - Accès & identité utilisateur (rôles/permissions)
FR3: Epic 1 - Accès & identité utilisateur (auth + dashboard par rôle)
FR4: Epic 1 - Accès & identité utilisateur (profil utilisateur)
FR5: Epic 1 - Accès & identité utilisateur (RBAC + restrictions)
FR6: Epic 2 - Organisation & hiérarchie (régions)
FR7: Epic 2 - Organisation & hiérarchie (branches + niveaux)
FR8: Epic 2 - Organisation & hiérarchie (cohérence hiérarchique)
FR9: Epic 2 - Organisation & hiérarchie (alignement région)
FR10: Epic 2 - Organisation & hiérarchie (supervision inter‑branche)
FR11: Epic 3 - Règles & modèles d’évaluation (règles + critères)
FR12: Epic 3 - Règles & modèles d’évaluation (auto‑évaluation)
FR13: Epic 3 - Règles & modèles d’évaluation (pairs)
FR14: Epic 3 - Règles & modèles d’évaluation (descendante)
FR15: Epic 3 - Règles & modèles d’évaluation (blocage non‑conforme)
FR16: Epic 3 - Règles & modèles d’évaluation (exceptions DR/CDTT)
FR17: Epic 4 - Exécution des évaluations (création évaluation)
FR18: Epic 4 - Exécution des évaluations (brouillon)
FR19: Epic 4 - Exécution des évaluations (validation critères/bornes)
FR20: Epic 4 - Exécution des évaluations (soumission)
FR21: Epic 4 - Exécution des évaluations (validation/rejet)
FR22: Epic 4 - Exécution des évaluations (retour brouillon)
FR23: Epic 4 - Exécution des évaluations (évaluations reçues)
FR24: Epic 4 - Exécution des évaluations (évaluations données)
FR25: Epic 4 - Exécution des évaluations (contre‑évaluation)
FR26: Epic 3 - Règles & modèles d’évaluation (templates)
FR27: Epic 3 - Règles & modèles d’évaluation (assignation templates)
FR28: Epic 3 - Règles & modèles d’évaluation (périodes)
FR29: Epic 3 - Règles & modèles d’évaluation (ouverture/fermeture auto)
FR30: Epic 3 - Règles & modèles d’évaluation (état période)
FR31: Epic 5 - Notifications & escalades (ouverture période)
FR32: Epic 5 - Notifications & escalades (rappels)
FR33: Epic 5 - Notifications & escalades (validation en attente)
FR34: Epic 5 - Notifications & escalades (consultation notifications)
FR35: Epic 6 - Dashboards par rôle (progression équipe)
FR36: Epic 6 - Dashboards par rôle (validations en attente)
FR37: Epic 6 - Dashboards par rôle (stats équipe)
FR38: Epic 6 - Dashboards par rôle (statut collaborateur)
FR39: Epic 6 - Dashboards par rôle (filtres période/périmètre)
FR40: Epic 7 - Analytics & anomalies (KPIs globaux)
FR41: Epic 7 - Analytics & anomalies (analytics utilisateur)
FR42: Epic 7 - Analytics & anomalies (détection anomalies)
FR43: Epic 7 - Analytics & anomalies (segmentation)
FR44: Epic 7 - Analytics & anomalies (tendances multi‑périodes)
FR45: Epic 7 - Analytics & anomalies (recommandations)
FR46: Epic 8 - Reporting & exports (rapport templatisé)
FR47: Epic 8 - Reporting & exports (ajout graphes)
FR48: Epic 8 - Reporting & exports (édition commentaires)
FR49: Epic 8 - Reporting & exports (export PPT/Excel)
FR50: Epic 8 - Reporting & exports (export graphes)
FR51: Epic 9 - Support & audit (corrections affectations)
FR52: Epic 9 - Support & audit (journalisation actions)
FR53: Epic 9 - Support & audit (consultation logs)

## Epic List

### Epic 0: Setup & Baseline
Assurer un démarrage propre du monorepo et un environnement exécutable.
**FRs covered:** None (foundation only)

### Epic 1: Accès & Identité utilisateur
Permettre aux utilisateurs d’entrer, de gérer leur profil et d’être sécurisés par rôle.
**FRs covered:** FR1–FR5

### Epic 2: Organisation & Hiérarchie
Rendre la structure (régions/branches/managers) fiable et cohérente.
**FRs covered:** FR6–FR10

### Epic 3: Règles & Modèles d’évaluation + Périodes
Configurer les règles, critères, templates et périodes d’évaluation.
**FRs covered:** FR11–FR16, FR26–FR30

### Epic 4: Exécution des évaluations
Créer, remplir, soumettre, valider/rejeter et consulter les évaluations.
**FRs covered:** FR17–FR25

### Epic 5: Notifications & Escalades
Rappels, notifications managers, escalades automatiques.
**FRs covered:** FR31–FR34

### Epic 6: Dashboards par rôle
Progression équipe, validations en attente, vue collaborateur.
**FRs covered:** FR35–FR39

### Epic 7: Analytics & Détection d’anomalies
KPIs globaux, segmentation, anomalies, recommandations.
**FRs covered:** FR40–FR45

### Epic 8: Reporting & Exports
Rapports templatisés, graphes, exports PPT/Excel.
**FRs covered:** FR46–FR50

### Epic 9: Support & Audit
Corrections support + logs d’audit consultables.
**FRs covered:** FR51–FR53

<!-- Repeat for each epic in epics_list (N = 1, 2, 3...) -->

## Epic 0: Setup & Baseline

Initialiser le monorepo et l’environnement de développement sans casser l’existant.

### Story 0.1: Initialisation du Monorepo et Environnement

**FRs:** None (foundation only)

As a développeur,
I want initialiser le monorepo et ses dépendances,
So that je puisse démarrer le développement immédiatement.

**Acceptance Criteria:**

**Given** je dispose du dépôt monorepo existant
**When** je configure l’environnement local
**Then** je peux installer les dépendances (Composer, pnpm, Go, Python) sans erreurs
**And** les variables nécessaires sont présentes dans `.env.example`
**And** les services principaux démarrent via Docker Compose
**And** une commande de bootstrap unique est documentée (README ou scripts)


## Epic 1: Accès & Identité utilisateur

Permettre aux utilisateurs d’entrer, de gérer leur profil et d’être sécurisés par rôle.

<!-- Repeat for each story (M = 1, 2, 3...) within epic N -->

### Story 1.1: Authentification & Session Utilisateur

**FRs:** FR3

As a utilisateur SABC,
I want me connecter avec mon matricule et mot de passe,
So that accéder au système de manière sécurisée.

**Acceptance Criteria:**

<!-- for each AC on this story -->

**Given** je suis un utilisateur enregistré avec matricule et mot de passe
**When** je saisis mes identifiants corrects sur la page de login
**Then** je suis authentifié et redirigé vers mon dashboard selon mon rôle
**And** une session Laravel est créée avec JWT token (Passport)
**And** le middleware `auth` protège toutes les routes privées
**And** je peux me déconnecter et ma session est détruite
**And** les tentatives de login échouées sont loggées dans `logs_administration`
**And** après 5 tentatives échouées, le compte est temporairement verrouillé (15 minutes)
**And** les tentatives de login sont rate‑limitées par IP et matricule
**And** les actions de logout/refresh token sont loggées dans `logs_administration`

### Story 1.2: Gestion des Rôles & Permissions (RBAC)

**FRs:** FR2, FR5

As a admin,
I want créer et gérer les rôles avec leurs permissions,
So that l’accès au système soit strictement contrôlé par rôle.

**Acceptance Criteria:**

**Given** je suis connecté en tant qu’admin
**When** je crée un nouveau rôle (ex: DR, CDTT, CSC, CDV, CDS, RTM, TMO, SRMO, SS, AS)
**Then** le rôle est créé dans MySQL `roles` avec ses attributs (niveau_hierarchique, peut_cross_branch, portee_geographique)
**And** je peux assigner des permissions spécifiques au rôle (peut_auto_evaluer, peut_evaluer_pairs, peut_evaluer_subordonnes)
**And** le middleware `role:*` vérifie les permissions avant d'autoriser l'accès
**And** les rôles DR et CDTT ont `peut_cross_branch = true` et `portee_geographique = global`
**And** le rôle ADMIN a `id_branche = NULL` (hors hiérarchie)
**And** les modifications de rôles sont loggées dans `logs_administration`

### Story 1.3: Gestion Hiérarchique des Utilisateurs

**FRs:** FR1

As a admin,
I want créer et gérer les utilisateurs avec leur hiérarchie,
So that l’organisation soit cohérente et les permissions soient correctes.

**Acceptance Criteria:**

**Given** je suis connecté en tant qu’admin
**When** je crée un utilisateur avec matricule, nom, prénom, email, région, branche, rôle, manager
**Then** l'utilisateur est créé dans MySQL `utilisateurs` avec tous ses attributs organisationnels
**And** le système valide que le manager existe et appartient à la même `id_region`
**And** le système valide la cohérence hiérarchique (niveau manager > niveau subordonné)
**And** la supervision inter‑branche est autorisée uniquement pour DR et CDTT (`peut_cross_branch = true`)
**And** si le manager change en cours de période, les permissions et rattachements d’évaluations en cours sont recalculés
**And** je peux désactiver un utilisateur sans le supprimer (soft delete)
**And** les modifications conséquentes (matricule, région, branche, manager, rôle) sont réservées à l'admin
**And** toutes les actions admin sont loggées dans `logs_administration`

### Story 1.4: Profil Utilisateur (Champs Restreints)

**FRs:** FR4

As a utilisateur,
I want consulter mon profil et modifier seulement certains champs,
So that je garde mes informations à jour sans casser la structure org.

**Acceptance Criteria:**

**Given** je suis connecté avec mon compte utilisateur
**When** j'accède à la page "Mon Profil"
**Then** je peux consulter toutes mes informations (matricule, nom, prénom, email, région, branche, rôle, manager)
**And** je peux modifier uniquement : nom, prénom, mot de passe, date de naissance, préférences (langue, notifications)
**And** les champs matricule, région, branche, manager, rôle sont en lecture seule
**And** la modification du mot de passe requiert l'ancien mot de passe pour validation
**And** les préférences sont sauvegardées dans un champ JSON `preferences_json`
**And** un message indique "Pour modifier votre région, branche ou rôle, contactez l'administrateur"
**And** les modifications sont sauvegardées dans MySQL `utilisateurs`

## Epic 2: Organisation & Hiérarchie

Rendre la structure (régions/branches/managers) fiable et cohérente.

### Story 2.1: Structure Organisationnelle (Régions & Branches)

**FRs:** FR6, FR7

As a admin,
I want créer et gérer les régions, branches et niveaux,
So that la structure organisationnelle soit claire et cohérente.

**Acceptance Criteria:**

**Given** je suis connecté en tant qu'admin
**When** je crée une région (ex: Littoral, Centre, Nord, Ouest)
**Then** la région est créée dans MySQL `regions` avec attribut `est_taniere` (true/false)
**And** les régions Tanière (Littoral, Centre) supportent 5 niveaux hiérarchiques
**And** les régions Non‑Tanière (Nord, Ouest) supportent 3 niveaux hiérarchiques
**And** je peux créer des branches (Commerciale, Marketing) dans MySQL `branches`
**And** la validation empêche la suppression d'une région/branche si des utilisateurs y sont liés
**And** les services commerciaux, districts et secteurs peuvent être créés selon la hiérarchie régionale

### Story 2.2: Règles de Cohérence Hiérarchique

**FRs:** FR8, FR9, FR10

As a admin,
I want garantir la cohérence hiérarchique et régionale des affectations,
So that l’organisation reste valide et les permissions sont correctes.

**Acceptance Criteria:**

**Given** je suis connecté en tant qu’admin
**When** j’assigne un manager à un utilisateur
**Then** le système valide que le manager appartient à la même `id_region`
**And** le niveau hiérarchique du manager est supérieur au subordonné
**And** la supervision inter‑branche est autorisée uniquement pour les rôles habilités (DR/CDTT)
**And** toute affectation non conforme est bloquée avec message explicite
**And** les changements d’affectation sont loggés dans `logs_administration`
**And** si un manager change en cours de période, l’impact sur les évaluations en cours est affiché

## Epic 3: Règles & Modèles d’évaluation + Périodes

Configurer les règles, critères, templates et périodes d’évaluation.

### Story 3.1: Création de Règles d'Évaluation avec Critères

**FRs:** FR11

As a admin,
I want créer des règles d’évaluation avec critères structurés,
So that les évaluations soient cohérentes et comparables.

**Acceptance Criteria:**

**Given** je suis connecté en tant qu'admin
**When** je crée une règle d'évaluation avec nom, description et critères
**Then** la règle est créée dans PostgreSQL `regles_evaluation` avec `criteres_evaluation_json`
**And** chaque critère contient : nom, description, pondération (%), échelle notation (1-5)
**And** la somme des pondérations doit égaler 100%
**And** minimum 5 critères par règle d'évaluation
**And** les critères peuvent être catégorisés (Compétences techniques, Soft skills, Leadership, etc.)
**And** la règle peut être activée/désactivée sans suppression

### Story 3.2: Configuration des Éligibilités d'Évaluation

**FRs:** FR12, FR13, FR14, FR15

As a admin,
I want définir les éligibilités d’évaluation par rôle,
So that seules les évaluations autorisées sont possibles.

**Acceptance Criteria:**

**Given** je configure une règle d'évaluation
**When** je définis les éligibilités (auto-évaluation, évaluation pairs, évaluation descendante)
**Then** les flags `peut_auto_evaluer`, `peut_evaluer_pairs`, `peut_evaluer_subordonnes` sont configurés par rôle
**And** l'auto-évaluation est autorisée uniquement pour les rôles avec `peut_auto_evaluer = true`
**And** l'évaluation pairs requiert même `niveau_hierarchique`, même `id_region`, même `id_branche`
**And** l'évaluation descendante requiert lien hiérarchique direct (`manager_matricule`)
**And** les rôles uniques par région (DR, CDTT, RTM, SRMO) ne peuvent pas évaluer leurs pairs

### Story 3.3: Gestion des Exceptions de Rôles (DR/CDTT)

**FRs:** FR16

As a admin,
I want gérer les exceptions spécifiques aux rôles DR/CDTT,
So that les règles restent cohérentes avec la hiérarchie terrain.

**Acceptance Criteria:**

**Given** un utilisateur avec rôle DR ou CDTT
**When** le système vérifie les permissions d'évaluation
**Then** le flag `peut_cross_branch = true` autorise la supervision inter‑branche
**And** DR et CDTT ne peuvent pas s'auto‑évaluer (`peut_auto_evaluer = false`)
**And** DR et CDTT ne peuvent pas évaluer leurs pairs (rôles uniques par région)
**And** DR et CDTT peuvent évaluer tous les subordonnés de leur région, toutes branches confondues
**And** la `portee_geographique = global` pour DR, `portee_geographique = region` pour CDTT

### Story 3.4: Création de Templates d'Évaluation

**FRs:** FR26

As a admin,
I want créer des templates d’évaluation réutilisables,
So that les formulaires soient cohérents et adaptés aux rôles.

**Acceptance Criteria:**

**Given** je suis connecté en tant qu'admin
**When** je crée un template d'évaluation
**Then** le template est créé dans PostgreSQL `templates_evaluation` avec nom, description, structure JSON
**And** le template référence une `id_regle` (règle d'évaluation avec critères)
**And** je peux définir des sections personnalisées (Objectifs, Compétences, Développement)
**And** je peux ajouter des champs texte libre pour commentaires
**And** le template peut être marqué comme "publié" ou "brouillon"
**And** seuls les templates publiés sont accessibles aux évaluateurs

### Story 3.5: Assignation de Templates par Rôle et Période

**FRs:** FR27

As a admin,
I want assigner des templates par rôle et par période,
So that chaque évaluation utilise le bon formulaire.

**Acceptance Criteria:**

**Given** j'ai créé des templates d'évaluation
**When** j'assigne un template à un rôle (ex: CSC) et une période (ex: 2025-S1)
**Then** l'assignation est créée dans `templates_roles_periodes` avec `id_template`, `id_role`, `id_periode`
**And** lors de la création d'évaluation, le système sélectionne automatiquement le template assigné
**And** si aucun template n'est assigné, un message d'erreur est affiché
**And** je peux assigner plusieurs templates à un même rôle pour différentes périodes
**And** je peux modifier l'assignation avant l'ouverture de la période

### Story 3.6: Création et Gestion des Périodes d'Évaluation

**FRs:** FR28, FR30

As a admin,
I want créer et gérer des périodes d’évaluation,
So that les évaluations soient planifiées et traçables.

**Acceptance Criteria:**

**Given** je suis connecté en tant qu'admin
**When** je crée une période d'évaluation (ex: "2025-S1")
**Then** la période est créée dans PostgreSQL `periodes_evaluation` avec `date_debut`, `date_fin`, `est_ouverte`
**And** je peux définir des dates de rappels (J-7, J-3, J-1)
**And** la période peut être en statut : "planifiée", "ouverte", "fermée"
**And** je peux modifier les dates avant l'ouverture de la période
**And** une période ne peut pas chevaucher une autre période active
**And** les statistiques de la période sont calculées dans `statistiques_json`

### Story 3.7: Ouverture/Fermeture Automatique des Périodes

**FRs:** FR29, FR30

As a admin,
I want automatiser l’ouverture et la fermeture des périodes,
So that le calendrier d’évaluation soit respecté sans action manuelle.

**Acceptance Criteria:**

**Given** une période d'évaluation avec `date_debut` et `date_fin` configurées
**When** la date système atteint `date_debut`
**Then** le Scheduled Job Laravel met `est_ouverte = true` automatiquement
**And** une notification est envoyée à tous les utilisateurs concernés
**And** les évaluateurs peuvent créer des évaluations pour cette période
**And** quand la date système atteint `date_fin`, `est_ouverte = false` automatiquement
**And** les évaluations en brouillon sont conservées mais ne peuvent plus être soumises
**And** un rapport de clôture est généré avec statistiques de participation

## Epic 4: Exécution des évaluations

Créer, remplir, soumettre, valider/rejeter et consulter les évaluations.

### Story 4.1: Création d'Évaluation pour Utilisateur Éligible

**FRs:** FR17, FR18

As a évaluateur,
I want créer une évaluation pour un utilisateur éligible,
So that je puisse démarrer le processus d’évaluation.

**Acceptance Criteria:**

**Given** une période d'évaluation est ouverte et dans la fenêtre de 30 jours
**When** je crée une nouvelle évaluation
**Then** une évaluation est créée dans PostgreSQL `evaluations` avec `statut = brouillon`
**And** l'évaluation est liée à l'évaluateur, l'évalué, la période et le template
**And** seuls les utilisateurs éligibles apparaissent dans la liste
**And** je peux accéder à l'évaluation depuis mon dashboard

### Story 4.2: Notation et Commentaires sur Critères

**FRs:** FR19

As a évaluateur,
I want noter et commenter les critères d’évaluation,
So that l’évaluation soit complète et conforme aux règles.

**Acceptance Criteria:**

**Given** je suis sur le formulaire d’évaluation
**When** je remplis les notes et commentaires
**Then** chaque critère accepte une note de 1 à 5
**And** un commentaire est requis si la note est < 3
**And** la progression (% critères complétés) est affichée
**And** les notes sont sauvegardées dans `notations_json` (JSONB PostgreSQL)
**And** si la brouillon a plus de 14 jours (et n’est pas rejeté), le formulaire devient en lecture seule

### Story 4.3: Validation et Soumission d'Évaluation

**FRs:** FR19, FR20

As a évaluateur,
I want valider et soumettre mon évaluation,
So that elle soit prise en compte.

**Acceptance Criteria:**

**Given** une évaluation est en brouillon
**When** je clique sur "Soumettre"
**Then** le système valide la complétude des critères et les bornes de notation
**And** `date_soumission` est enregistrée
**And** l'évaluation passe en statut "soumis"
**And** une confirmation est affichée avec "check vert"
**And** le manager reçoit une notification de validation en attente

### Story 4.8: Reprise Hors‑Ligne et Resubmit

**FRs:** FR18, FR20

As a évaluateur,
I want pouvoir soumettre même en cas de coupure réseau,
So that mon évaluation ne soit pas perdue.

**Acceptance Criteria:**

**Given** je perds la connexion pendant une soumission
**When** je valide l’évaluation
**Then** la soumission est mise en file locale (IndexedDB) avec statut "en attente"
**And** un message indique que l’envoi sera retenté automatiquement
**And** un retry est lancé dès que le réseau revient (backoff progressif)
**And** si l’envoi échoue durablement, je peux relancer manuellement
**And** aucune donnée saisie n’est perdue

### Story 4.4: Validation/Rejet d'Évaluation par Manager

**FRs:** FR21, FR22

As a manager,
I want valider ou rejeter une évaluation soumise,
So that la qualité des évaluations soit contrôlée.

**Acceptance Criteria:**

**Given** une évaluation est en statut "soumis"
**When** je consulte l'évaluation
**Then** je peux la valider ou la rejeter avec un motif obligatoire
**And** si rejetée, l'évaluation repasse en statut "brouillon"
**And** l’évaluateur reçoit une notification de rejet
**And** seuls les managers autorisés peuvent valider (DR/CDTT cross‑branche)

### Story 4.5: Consultation des Évaluations Reçues

**FRs:** FR23

As a évalué,
I want consulter mes évaluations reçues,
So that je suive mon statut.

**Acceptance Criteria:**

**Given** je suis connecté
**When** j'accède à "Mes Évaluations Reçues"
**Then** je vois toutes les évaluations validées
**And** je vois le statut de chaque évaluation (brouillon, soumis, validé, rejeté)
**And** je peux consulter les évaluations validées avec notes et commentaires
**And** je ne peux pas voir les évaluations en brouillon ou rejetées
**And** l’existence d’une évaluation en brouillon n’est pas visible côté évalué
**And** je vois le type d'évaluation (auto, pairs, manager, subordonnés)
**And** les évaluations sont filtrables par période

### Story 4.6: Consultation des Évaluations Données

**FRs:** FR24

As a évaluateur,
I want consulter mes évaluations données et leur statut,
So that je puisse suivre et corriger si besoin.

**Acceptance Criteria:**

**Given** je suis connecté
**When** j'accède à "Mes Évaluations Données"
**Then** je vois toutes les évaluations où `evaluateur_matricule = mon_matricule`
**And** je vois le statut de chaque évaluation
**And** je peux reprendre une évaluation en brouillon
**And** je peux consulter mes évaluations soumises et validées
**And** si une évaluation est rejetée, je vois le motif et peux la corriger
**And** les évaluations sont filtrables par période et type

### Story 4.7: Contre‑Évaluation Manager

**FRs:** FR25

As a manager,
I want effectuer une contre‑évaluation lorsqu’une incohérence est détectée,
So that la décision finale soit fiable.

**Acceptance Criteria:**

**Given** une évaluation présente une anomalie ou un écart auto/pairs/manager
**When** je déclenche une contre‑évaluation
**Then** une nouvelle évaluation de type "contre" est créée et liée à l’évaluation initiale
**And** seuls les managers autorisés peuvent la lancer
**And** un motif de contre‑évaluation est requis
**And** la contre‑évaluation suit le même workflow (brouillon → soumis → validé)


## Epic 5: Notifications & Escalades

Rappels, notifications managers, escalades automatiques.

### Story 5.1: Notification d'Ouverture de Période

**FRs:** FR31

As a utilisateur concerné,
I want être notifié à l’ouverture d’une période,
So that je sache immédiatement ce que j’ai à faire.

**Acceptance Criteria:**

**Given** une période d'évaluation s'ouvre (`est_ouverte = true`)
**When** le Scheduled Job détecte l'ouverture
**Then** une notification est créée dans PostgreSQL `notifications` pour chaque utilisateur concerné
**And** le message indique : nom de la période, dates début/fin, nombre d'évaluations à compléter
**And** la notification est visible dans le dashboard et le notifications panel
**And** un email est envoyé si l'utilisateur a activé les notifications email
**And** la notification contient un lien direct vers la page "Évaluations à Compléter"

### Story 5.2: Rappels Automatiques pour Évaluations en Retard

**FRs:** FR32

As a évaluateur,
I want recevoir des rappels quand je suis en retard,
So that je puisse finir mes évaluations à temps.

**Acceptance Criteria:**

**Given** une évaluation en brouillon existe depuis > 7 jours
**When** le Scheduled Job quotidien s'exécute
**Then** une notification de rappel est envoyée à l'évaluateur
**And** le message indique : nom de l'évalué, jours restants avant clôture période
**And** les rappels sont envoyés à J-7, J-3, J-1 avant la `date_fin`
**And** après la `date_fin`, un rappel final est envoyé si évaluation non soumise
**And** le nombre de rappels envoyés est comptabilisé dans `rappels_envoyes`
**And** les notifications respectent les préférences utilisateur (email opt-in)

### Story 5.3: Notifications de Validation en Attente pour Managers

**FRs:** FR33

As a manager,
I want être notifié des validations en attente,
So that je puisse valider rapidement les évaluations soumises.

**Acceptance Criteria:**

**Given** une évaluation est en statut "soumis" depuis > 3 jours
**When** le Scheduled Job quotidien s'exécute
**Then** une notification est envoyée au manager (`manager_matricule`)
**And** le message indique : nombre d'évaluations en attente, noms des évalués
**And** la notification contient un lien direct vers la page "Validations en Attente"
**And** les notifications sont envoyées quotidiennement jusqu'à validation/rejet
**And** DR et CDTT reçoivent les notifications pour leur périmètre (cross-branche)
**And** les notifications respectent les préférences utilisateur (email opt-in)

### Story 5.4: Centre de Notifications (Lecture/Marquage)

**FRs:** FR34

As a utilisateur,
I want consulter mes notifications et les marquer comme lues,
So that je garde un historique clair.

**Acceptance Criteria:**

**Given** je suis connecté
**When** j'ouvre le panneau notifications
**Then** je vois la liste des notifications triées par date
**And** je peux filtrer par type (période, rappel, validation, escalade)
**And** je peux marquer une notification comme lue/non lue
**And** les notifications lues sont visuellement distinguées
**And** les actions de lecture sont persistées dans `notifications` (champ `read_at`)

### Story 5.5: Escalade Niveau 1 (3 jours)

**FRs:** FR33

As a admin,
I want escalader automatiquement les retards critiques à 3 jours,
So that les évaluateurs réagissent rapidement.

**Acceptance Criteria:**

**Given** une évaluation en brouillon ou en attente de validation
**When** le délai dépasse 3 jours
**Then** un rappel d’escalade est envoyé à l’évaluateur/manager concerné
**And** l’escalade est loggée dans `logs_administration`

### Story 5.6: Escalade Niveau 2 (7 jours)

**FRs:** FR33

As a admin,
I want escalader automatiquement les retards critiques à 7 jours,
So that le management supérieur soit alerté.

**Acceptance Criteria:**

**Given** une évaluation en retard persiste au-delà de 7 jours
**When** le job d’escalade s’exécute
**Then** une notification est envoyée au manager N+1
**And** l’escalade est loggée dans `logs_administration`

### Story 5.7: Escalade Niveau 3 (10/15 jours)

**FRs:** FR33

As a admin,
I want escalader automatiquement les retards critiques aux niveaux DR et Admin,
So that aucun blocage ne reste invisible.

**Acceptance Criteria:**

**Given** une évaluation en retard persiste au-delà de 10 jours
**When** le job d’escalade s’exécute
**Then** une alerte est envoyée au DR de la région
**And** au-delà de 15 jours, une alerte est envoyée à l’administrateur système
**And** chaque escalade est loggée dans `logs_administration`
**And** les escalades sont visibles dans le dashboard admin


## Epic 6: Dashboards par rôle

Progression équipe, validations en attente, vue collaborateur.

### Story 6.1: Dashboard Manager - Progression Équipe

**FRs:** FR35, FR37, FR39

As a manager,
I want suivre la progression de mon équipe,
So that je sache où en sont les évaluations en cours.

**Acceptance Criteria:**

**Given** je suis connecté en tant que manager (CSC, CDV, RTM, etc.)
**When** j'accède à mon dashboard
**Then** je vois le KPI "Reste d'évaluations" : nombre total vs complétées
**And** je vois la liste de mes subordonnés directs avec leur statut
**And** pour chaque subordonné : nombre d'évaluations reçues, données, en attente
**And** je peux filtrer par période d'évaluation
**And** je vois un graphique de progression (line chart) sur les 6 derniers mois
**And** les données sont rafraîchies via cache/polling (TanStack Query)
**And** les requêtes standard respectent la contrainte de latence API < 1s

### Story 6.2: Dashboard Manager - Validations en Attente

**FRs:** FR36, FR39

As a manager,
I want voir les validations en attente,
So that je puisse valider rapidement les évaluations soumises.

**Acceptance Criteria:**

**Given** je suis manager
**When** j'accède à "Validations en Attente"
**Then** je vois toutes les évaluations en statut "soumis" pour mes subordonnés
**And** je vois : nom évaluateur, nom évalué, date soumission, jours en attente
**And** je peux cliquer pour consulter et valider/rejeter directement
**And** un badge rouge indique le nombre d'évaluations en attente > 3 jours
**And** je peux filtrer par évaluateur ou évalué
**And** les évaluations sont triées par ancienneté (plus anciennes en premier)
**And** les évaluations affichées sont limitées à mon périmètre hiérarchique autorisé

### Story 6.3: Dashboard Collaborateur - Statut Évaluation

**FRs:** FR38, FR39

As a collaborateur,
I want suivre le statut de mes évaluations,
So that je comprenne ce qui reste à faire et ce qui est validé.

**Acceptance Criteria:**

**Given** je suis connecté en tant que collaborateur
**When** j'accède à mon dashboard
**Then** je vois mes évaluations à compléter (auto, pairs, subordonnés)
**And** je vois mes évaluations reçues avec statut (validées, en attente)
**And** je vois mon score global de performance (si calculé)
**And** je vois ma progression vs période précédente
**And** je peux accéder directement aux évaluations en brouillon
**And** les données respectent les permissions de visibilité selon mon rôle

## Epic 7: Analytics & Détection d’anomalies

KPIs globaux, segmentation, anomalies, recommandations.

### Story 7.1: KPIs Globaux par Région/Branche/Rôle

**FRs:** FR40, FR43

As a admin,
I want consulter les KPIs globaux avec segmentation,
So that je comprenne la performance par périmètre.

**Acceptance Criteria:**

**Given** je suis connecté en tant qu'admin
**When** j'accède au dashboard Analytics
**Then** je vois les KPIs : score moyen global, taux de complétion, taux de validation
**And** je peux segmenter par région (Littoral, Centre, Nord, Ouest)
**And** je peux segmenter par branche (Commerciale, Marketing)
**And** je peux segmenter par rôle (DR, CDTT, CSC, etc.)
**And** je peux segmenter par période, sexe, tranche d’âge et ancienneté
**And** les données proviennent du Service Go Analytics via `/api/v2/analytics`
**And** les données sont mises en cache Redis avec TTL horaire
**And** un timestamp "last updated" est affiché
**And** les données affichées proviennent d'un batch quotidien (pas de temps réel implicite)
**And** les segments/filters sont strictement limités au périmètre autorisé
**And** les segments avec n < 5 sont masqués et les scores arrondis à 1 décimale

### Story 7.2: Analytics Utilisateur (Scores & Historique)

**FRs:** FR41

As a admin,
I want consulter l’analytics d’un utilisateur,
So that je puisse analyser son historique et ses scores.

**Acceptance Criteria:**

**Given** je suis connecté en tant qu'admin
**When** j'ouvre la fiche analytics d'un utilisateur
**Then** je vois son historique de scores par période
**And** je vois ses évaluations reçues (type, date, score)
**And** je peux filtrer par période
**And** l’accès est limité au périmètre autorisé

### Story 7.3: Tendances Multi‑Périodes

**FRs:** FR44

As a admin,
I want consulter des tendances multi‑périodes,
So that je comprenne les évolutions dans le temps.

**Acceptance Criteria:**

**Given** plusieurs périodes d’évaluation sont clôturées
**When** j’accède aux tendances
**Then** je vois des courbes d’évolution par région/branche/rôle
**And** je peux comparer deux périodes sélectionnées
**And** les données sont agrégées et anonymisées si requis

### Story 7.4: Détection et Signalement d'Anomalies

**FRs:** FR42

As a admin,
I want détecter et signaler des anomalies d’évaluation,
So that j’identifie rapidement les risques.

**Acceptance Criteria:**

**Given** les évaluations sont validées et les scores calculés
**When** le système analyse les données (batch quotidien)
**Then** une anomalie "Divergence auto vs autres" est détectée si |score_auto - score_pairs/manager| > 1.5
**And** une anomalie "Baisse de performance" est détectée si progression_vs_precedente < -1 sur 3 mois
**And** une anomalie "Uniformité excessive" est détectée si variance notations < 0.5
**And** une anomalie "Biais évaluateur" est détectée si moyenne systématiquement élevée/basse
**And** les anomalies sont sauvegardées dans `logs_anomalies` avec type, sévérité, utilisateur concerné
**And** les admins reçoivent une notification pour anomalies sévères
**And** les anomalies peuvent être “acknowledged” ou clôturées par un admin

### Story 7.5: Recommandations — Formation

**FRs:** FR45

As a admin,
I want recommander des formations ciblées,
So that je corrige les écarts de compétences.

**Acceptance Criteria:**

**Given** les scores par compétence sont calculés
**When** un score < 3/5 sur un axe
**Then** une recommandation de formation est proposée
**And** la recommandation est sauvegardée dans `recommandations` avec priorité
**And** l’admin peut valider ou rejeter la recommandation

### Story 7.6: Recommandations — Mentorat

**FRs:** FR45

As a admin,
I want recommander du mentorat,
So that je connecte experts et apprenants.

**Acceptance Criteria:**

**Given** un utilisateur a un score faible et un autre un score élevé
**When** le système cherche un mentor compatible (même région)
**Then** une recommandation de mentorat est créée
**And** la recommandation est sauvegardée dans `recommandations` avec type "mentorat"
**And** l’admin peut valider ou rejeter la recommandation

### Story 7.7: Recommandations — Mobilité

**FRs:** FR45

As a admin,
I want recommander la mobilité interne,
So that je valorise les talents à forte progression.

**Acceptance Criteria:**

**Given** un utilisateur a une forte progression et un score global élevé
**When** le système détecte ce profil
**Then** une recommandation de mobilité est créée
**And** la recommandation est sauvegardée dans `recommandations` avec type "mobilité"
**And** l’admin peut valider ou rejeter la recommandation


## Epic 8: Reporting & Exports

Rapports templatisés, graphes, exports PPT/Excel.

### Story 8.1: Report Builder avec Sections Templatisées

**FRs:** FR46, FR47, FR48

As a admin,
I want créer un rapport structuré avec sections et graphes,
So that je puisse partager des analyses claires.

**Acceptance Criteria:**

**Given** je suis connecté en tant qu'admin
**When** je crée un nouveau rapport
**Then** je peux choisir parmi des sections templatisées (Executive Summary, KPIs, Tendances, Recommandations)
**And** je peux ajouter du texte libre dans chaque section
**And** je peux ajouter des graphes depuis l'analytics (drag & drop)
**And** je peux réorganiser les sections par drag & drop
**And** le rapport est sauvegardé en brouillon et peut être édité
**And** je peux prévisualiser le rapport avant export
**And** l'accès à la création de rapport est restreint aux rôles admin autorisés
**And** les données affichées respectent strictement le périmètre autorisé

### Story 8.2: Export Rapport — PowerPoint (PPTX)

**FRs:** FR49

As a admin,
I want exporter un rapport en PowerPoint,
So that je puisse le partager en présentation.

**Acceptance Criteria:**

**Given** j'ai créé un rapport complet
**When** je sélectionne l'export PowerPoint
**Then** l’export PPT contient : slides par section, graphes intégrés, texte formaté
**And** l’export respecte le design system SABC (couleurs, logos)
**And** l’export est limité au périmètre/à la période sélectionnée
**And** un historique d’export est conservé avec date et utilisateur

### Story 8.3: Export Rapport — Excel (XLSX)

**FRs:** FR49

As a admin,
I want exporter un rapport en Excel,
So that je puisse analyser les données hors plateforme.

**Acceptance Criteria:**

**Given** j'ai créé un rapport complet
**When** je sélectionne l'export Excel
**Then** l’export Excel contient : onglets par section, tableaux de données, graphes
**And** l’export est limité au périmètre/à la période sélectionnée
**And** un historique d’export est conservé avec date et utilisateur

### Story 8.4: Export Graphes Individuels

**FRs:** FR50

As a admin,
I want exporter un graphe individuellement,
So that je puisse l’utiliser dans d’autres supports.

**Acceptance Criteria:**

**Given** un graphe est affiché dans l’analytics ou le report builder
**When** je clique sur "Exporter graphe"
**Then** je peux choisir le format : PNG, SVG, PDF
**And** l’export respecte le branding SABC
**And** un historique d’export est conservé avec date et utilisateur


## Epic 9: Support & Audit

Corrections support + logs d’audit consultables.

### Story 9.1: Logs d'Audit et Traçabilité

**FRs:** FR52, FR53

As a admin,
I want consulter les logs d’audit complets,
So that j’assure la conformité et le diagnostic.

**Acceptance Criteria:**

**Given** je suis connecté en tant qu'admin
**When** j'accède aux "Logs d'Audit"
**Then** je vois tous les logs de `logs_administration` avec : date, utilisateur, action, résultat, adresse IP
**And** je peux filtrer par : date, utilisateur, type d'action (création, modification, suppression, accès)
**And** je peux filtrer par résultat (succès, erreur)
**And** les tentatives d'accès non autorisées sont marquées en rouge
**And** je peux exporter les logs en CSV pour analyse externe
**And** les logs sont conservés pendant 2 ans (politique de rétention)
**And** l'accès aux logs d'audit est restreint aux rôles admin autorisés
**And** les exports CSV masquent les données sensibles selon le rôle

### Story 9.2: Corrections Affectations Utilisateurs (Support)

**FRs:** FR51

As a admin support,
I want corriger les affectations erronées d’utilisateurs,
So that les erreurs soient résolues rapidement et traçables.

**Acceptance Criteria:**

**Given** je suis admin avec permissions support
**When** je corrige une affectation utilisateur (rôle, région, branche, manager)
**Then** la modification est appliquée immédiatement dans MySQL `utilisateurs`
**And** un log détaillé est créé dans `logs_administration` avec : ancienne valeur, nouvelle valeur, motif
**And** l'utilisateur reçoit une notification de la modification
**And** si le changement impacte des évaluations en cours, un avertissement est affiché
**And** une confirmation explicite est requise avant d'appliquer la correction
**And** je peux ajouter un commentaire expliquant la raison de la correction
**And** les corrections sont auditables et traçables

### Story 9.3: Observabilité & Monitoring Plateforme

**FRs:** None (foundation)

As a admin,
I want des métriques et alertes fiables sur la plateforme,
So that je détecte rapidement les incidents.

**Acceptance Criteria:**

**Given** la plateforme est en production
**When** des métriques sont collectées
**Then** les services exposent `/metrics` (Prometheus) et `/health`
**And** des dashboards Grafana couvrent latence, erreurs, et jobs batch
**And** des alertes sont configurées (latence > 3s sur 5 min, erreurs > seuil)
**And** les traces distribuées sont visibles via Jaeger

### Story 9.4: Standardisation API & Contrats OpenAPI

**FRs:** None (foundation)

As a développeur,
I want des contrats API cohérents et documentés,
So that les intégrations front/services restent stables.

**Acceptance Criteria:**

**Given** une route API est exposée
**When** je consulte la documentation
**Then** chaque endpoint est documenté dans OpenAPI
**And** les erreurs utilisent une enveloppe standardisée
**And** chaque réponse inclut un `request_id` corrélé aux logs

### Story 9.5: Proxies & Fallback Services (Strangler)

**FRs:** None (foundation)

As a admin,
I want une continuité de service même si un service Go est indisponible,
So that l’expérience reste stable.

**Acceptance Criteria:**

**Given** un service Go est indisponible
**When** un utilisateur appelle une fonctionnalité critique
**Then** le proxy Laravel bascule vers le fallback existant
**And** un flag de feature permet d’activer/désactiver le proxy
**And** l’événement est loggé pour diagnostic

### Story 9.6: Pipelines de Sync Multi‑DB

**FRs:** None (foundation)

As a admin,
I want des synchronisations fiables entre MySQL, PostgreSQL et ClickHouse,
So that les analytics restent cohérentes.

**Acceptance Criteria:**

**Given** des données sources sont mises à jour
**When** les jobs batch s’exécutent
**Then** MySQL → PostgreSQL et PostgreSQL → ClickHouse sont synchronisés
**And** un statut d’exécution est historisé pour chaque batch
**And** les échecs déclenchent une alerte
<!-- End story repeat -->
