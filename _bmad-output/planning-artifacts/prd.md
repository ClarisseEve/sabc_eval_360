---
stepsCompleted:
  - step-01-init
  - step-02-discovery
  - step-03-success
  - step-04-journeys
  - step-06-innovation
  - step-07-project-type
  - step-08-scoping
  - step-09-functional
  - step-10-nonfunctional
  - step-11-complete
inputDocuments:
  - /Users/macbook/Documents/SABC/sabc_eval360/_bmad-output/analysis/brainstorming-session-2026-01-08.md
  - /Users/macbook/Documents/SABC/sabc_eval360/docs/index.md
  - /Users/macbook/Documents/SABC/sabc_eval360/docs/project-overview.md
  - /Users/macbook/Documents/SABC/sabc_eval360/docs/source-tree-analysis.md
  - /Users/macbook/Documents/SABC/sabc_eval360/docs/deployment-guide.md
  - /Users/macbook/Documents/SABC/sabc_eval360/docs/integration-architecture.md
  - /Users/macbook/Documents/SABC/sabc_eval360/docs/architecture-app.md
  - /Users/macbook/Documents/SABC/sabc_eval360/docs/architecture-evaluation.md
  - /Users/macbook/Documents/SABC/sabc_eval360/docs/architecture-analytics.md
  - /Users/macbook/Documents/SABC/sabc_eval360/docs/architecture-pipelines.md
  - /Users/macbook/Documents/SABC/sabc_eval360/docs/api-contracts-app.md
  - /Users/macbook/Documents/SABC/sabc_eval360/docs/api-contracts-evaluation.md
  - /Users/macbook/Documents/SABC/sabc_eval360/docs/api-contracts-analytics.md
  - /Users/macbook/Documents/SABC/sabc_eval360/docs/data-models-app.md
  - /Users/macbook/Documents/SABC/sabc_eval360/docs/data-models-evaluation.md
  - /Users/macbook/Documents/SABC/sabc_eval360/docs/data-models-analytics.md
  - /Users/macbook/Documents/SABC/sabc_eval360/docs/data-models-pipelines.md
  - /Users/macbook/Documents/SABC/sabc_eval360/docs/development-guide-app.md
  - /Users/macbook/Documents/SABC/sabc_eval360/docs/development-guide-evaluation.md
  - /Users/macbook/Documents/SABC/sabc_eval360/docs/development-guide-analytics.md
  - /Users/macbook/Documents/SABC/sabc_eval360/docs/development-guide-pipelines.md
  - /Users/macbook/Documents/SABC/sabc_eval360/docs/component-inventory-app.md
  - /Users/macbook/Documents/SABC/sabc_eval360/docs/component-inventory-evaluation.md
  - /Users/macbook/Documents/SABC/sabc_eval360/docs/component-inventory-analytics.md
  - /Users/macbook/Documents/SABC/sabc_eval360/docs/component-inventory-pipelines.md
  - /Users/macbook/Documents/SABC/sabc_eval360/docs/analytics/README.md
documentCounts:
  briefs: 0
  research: 0
  brainstorming: 1
  projectDocs: 25
workflowType: 'prd'
lastStep: 11
---

# Product Requirements Document - {{project_name}}

**Author:** {{user_name}}
**Date:** {{date}}

## Executive Summary

Plateforme interne d’évaluation des collaborateurs, destinée aux managers et à l’admin, basée sur des règles d’évaluation configurables et une hiérarchie d’entreprise variable. Le besoin central est double : moderniser radicalement l’expérience (UX/UI) et fournir une aide à la décision fiable, afin d’éliminer le travail manuel (Excel, compilation des rapports) et d’accélérer les décisions de formation.

La plateforme vise :
- une expérience fluide pour les managers (évaluer, suivre les équipes, compléter les tâches sans friction),
- une vue globale pour l’admin (analyses avancées, décisions, rapports),
- la génération de rapports directement depuis les graphes,
- l’extension à d’autres directions (RH, Industrielle, etc.) via des configurations robustes.

Le signal de succès opérationnel est clair : zéro alerte visible et un KPI “reste d’évaluations” à 100% sur la période ouverte.

### What Makes This Special

Le différenciateur majeur est l’UI/UX : une expérience moderne, claire et efficace qui réduit la charge cognitive, simplifie l’évaluation et transforme les données en décisions.
À cela s’ajoute une palette d’analytique avancée pour l’admin, avec un workflow de rapports qui évite la compilation manuelle.

## Project Classification

**Technical Type:** web_app
**Domain:** performance management interne (RH/évaluation collaborateurs)
**Complexity:** medium
**Project Context:** Brownfield - extending existing system

Ce PRD s’aligne sur l’existant (app Laravel + services + pipelines), tout en concentrant l’effort sur la refonte UX et l’outillage analytique/rapport.

## Success Criteria

### User Success

- Managers : 100% des évaluations de leur périmètre complétées dans la période ouverte, avec zéro alerte visible à la clôture.
- Managers : temps moyen pour compléter une évaluation < 10 minutes.
- Managers : < 1 rappel par évaluation (objectif : la majorité des évaluations faites sans relance).
- Admin : génération d’un rapport standard < 15 minutes (vs. compilation manuelle).
- Admin : 80%+ des rapports et graphes générés via la plateforme (plus d’Excel).

### Business Success

- À 3 mois : 100% des managers actifs sur une période d’évaluation, et 80%+ des évaluations clôturées dans les délais.
- À 12 mois : extension à 2 nouvelles directions (ex. RH, Industrielle) avec règles/hiérarchies configurées.
- Efficience : réduction de 50%+ du temps admin consacré à la compilation/rapport.

### Technical Success

- Chargement initial < 5s sur 3G/4G (contexte Cameroun).
- Bundle initial < 300KB.
- API < 1s pour requêtes standards.
- DB < 200ms par requête standard.
- FCP < 3s ; TTI < 6s.
- Disponibilité ≥ 99.5%.
- Freshness analytics : données mises à jour au minimum quotidiennement sur période ouverte.

### Measurable Outcomes

- KPI “reste d’évaluations” = 100% sur période ouverte.
- 0 alerte visible à la clôture.
- Temps admin rapport < 15 minutes.
- Taux de clôture ≥ 80% en 3 mois, ≥ 95% en 12 mois.

## Product Scope

### MVP - Minimum Viable Product

- Gestion utilisateurs + RBAC par rôles.
- Hiérarchies configurables (Tanière/Non‑Tanière).
- Règles d’évaluation configurables (auto/pairs/descendante).
- Templates de fiches d’évaluation configurables.
- Workflow d’évaluation complet (création → soumission → validation).
- Notifications périodes (rappels clés).
- Dashboard manager avec KPI “reste d’évaluations”.
- Admin : analytics de base + export graphiques simples.
- Refonte UI/UX des formulaires et des parcours essentiels.

### Growth Features (Post‑MVP)

- Analytics avancées (anomalies, biais, tendances, segmentation fine par région/branche/rôle/période/sexe/tranche d’âge/ancienneté).
- Génération de rapports templatisés (sections standard + champs libres).
- Workflow “ajouter un graphe au rapport” + commentaires éditables.
- Exports avancés (PPT/Excel) depuis la plateforme.
- Optimisations pipelines + cache analytique.

### Vision (Future)

- Automatisation quasi complète des rapports.
- Recommandations décisionnelles (formation/mentorat) basées sur données.
- Extension multi‑direction sans friction (templates et KPIs par direction).

## User Journeys

**Journey 1: Patrick (Manager) — “Tout est au vert”**
Patrick, Chef de Secteur, ouvre l’application le premier jour de la période. Son dashboard lui montre immédiatement le KPI “reste d’évaluations” et une liste priorisée de ses subordonnés. Il clique sur le premier collaborateur, remplit la fiche d’évaluation à partir d’un template clair, et valide en moins de 10 minutes.
Chaque jour, il voit sa progression monter. À J‑1, il ne voit aucune alerte, le KPI est à 100%. Il repart serein : son travail d’évaluation est terminé et visible.

**Journey 2: Patrick (Manager) — Cas limite “retard + contre‑évaluation”**
Patrick découvre qu’un collaborateur a reçu des évaluations incohérentes (auto vs pairs). La plateforme signale l’anomalie et propose une contre‑évaluation. Il ouvre le dossier, compare les notes, saisit son appréciation et clôture proprement l’écart.
Résultat : l’alerte disparaît, l’historique est clair, et le manager a récupéré le contrôle sans friction.

**Journey 3: Aïcha (Collaboratrice) — Auto‑évaluation simple**
Aïcha reçoit une notification “période ouverte”. Elle se connecte, voit un formulaire clair avec des critères compréhensibles. Elle complète son auto‑évaluation en une session, et reçoit une confirmation immédiate.
Elle peut ensuite suivre l’état (soumis/validé) sans contacter son manager.

**Journey 4: Nadège (Admin) — Analyse avancée + Rapport**
Nadège ouvre le tableau de bord admin. Elle analyse les KPIs par région, branche et rôle, identifie une baisse de performance et isole un segment à risque.
Elle ajoute un graphe au rapport en cours, accepte le commentaire généré, ajuste le texte, puis exporte un PPT/Excel.
Résultat : un rapport complet, sans compilation manuelle.

**Journey 5: Support/Ops — Correction rapide sans casse**
Un utilisateur n’apparaît pas dans la bonne hiérarchie. Le support ouvre le profil, corrige la branche ou la région, et le système revalide automatiquement la cohérence hiérarchique.
L’audit trail conserve la trace et l’utilisateur retrouve son bon périmètre d’évaluation.

### Journey Requirements Summary

- Dashboards par rôle (manager, admin, collaborateur)
- Workflow complet d’évaluation (création → soumission → validation)
- Templates de fiches d’évaluation
- Notifications de période + rappels intelligents
- Détection d’anomalies et contre‑évaluation
- Analytics avancées (segmentation par région/branche/rôle/période/sexe/tranche d’âge/ancienneté, tendances, alertes)
- Génération de rapports avec insertion de graphes
- Configurations admin (rôles, règles, hiérarchies)
- Support/Ops avec audit et correction rapide

## Innovation & Novel Patterns

### Detected Innovation Areas

- Innovation d’expérience : évaluer / s’auto‑évaluer en < 10 minutes via des templates clairs et un flow ultra‑fluide.
- Décision & reporting intégrés : l’admin construit un rapport directement à partir des graphes (ajout en un clic + commentaire), sans Excel.
- Signal opérationnel unique : “zéro alerte visible + KPI reste d’évaluations = 100%” comme objectif explicite de clôture.

### Market Context & Competitive Landscape

Le “concurrent” principal est l’existant : une app basique, peu moderne, qui pousse à la compilation manuelle (Excel + PPT).
La différenciation repose sur l’UX et la suppression du travail administratif répétitif, plus que sur une technologie inédite.

### Validation Approach

- Hypothèse 1 : un manager peut terminer une évaluation en < 10 minutes.
  → Mesure : temps moyen par évaluation + taux de complétion.
- Hypothèse 2 : l’admin peut produire un rapport < 15 minutes.
  → Mesure : temps de génération + nombre d’exports réalisés.
- Hypothèse 3 : en fin de période, 0 alerte visible et KPI “reste d’évaluations = 100%”.
  → Mesure : taux de clôture + alertes ouvertes.
- Validation : pilote sur 1–2 régions + comparaison avant/après sur temps admin et taux de complétion.

### Risk Mitigation

- Risque : l’innovation “report builder + analytics” ne réduit pas assez la charge.
- Plan B : garantir au minimum une expérience d’évaluation moderne et ultra bien conçue, même si l’analytics avancée arrive par phases.
- Filet de sécurité : exports simples (Excel/PPT) dès le MVP, puis amélioration progressive.

## Web App Specific Requirements

### Project-Type Overview

Application web interne MPA (multi‑page), orientée workflows d’évaluation et dashboards.
SEO non requis (usage interne), priorité à la clarté UX, à la performance sur réseau 3G/4G et à l’accessibilité.

### Technical Architecture Considerations

- MPA côté serveur pour stabilité et simplicité, avec enrichissements UI ciblés.
- Temps réel limité : privilégier notifications/indicateurs essentiels sans surcoût d’infrastructure.
- Cohérence avec l’existant Laravel + services (mêmes patterns d’auth/RBAC).

### Browser Matrix

- Chrome : supporté (>= 120)
- Edge : supporté (>= 120)
- Safari : supporté (>= 17)
- Firefox : supporté (>= 120)

### Responsive Design

- Desktop‑first (1024px+) : dashboards complets et confort d’usage sur écran large.
- Tablet (768–1024px) : navigation compacte.
- Mobile (320–768px) : UI simplifiée et cartes empilées.
- Cibles tactiles ≥ 44px, et formulaires d’évaluation lisibles sur petit écran.

### Performance Targets

- Chargement initial < 5s sur 3G/4G.
- Bundle initial < 300KB.
- API < 1s (requêtes standards) ; DB < 200ms.
- FCP < 3s ; TTI < 6s.

### SEO Strategy

- Non applicable (application interne, non indexée).

### Accessibility Level

- WCAG AA minimum : contraste, navigation clavier, labels explicites.

### Implementation Considerations

- Temps réel contraint : polling léger ou rafraîchissement périodique sur KPIs clés.
- Optimiser les pages d’évaluation (priorité UX) + analytics admin.
- Reprise après coupure réseau : queue locale et resubmit automatique des soumissions.
- Rester conforme au design system SABC (Poppins/Inter + palette rouge/orange).

## Project Scoping & Phased Development

### MVP Strategy & Philosophy

**MVP Approach:** Experience MVP + Platform MVP + Problem‑Solving MVP
**Resource Requirements:** Solo (multi‑rôles). Conséquence : scope strict, phasage rigoureux, réutilisation maximale de l’existant.

### MVP Feature Set (Phase 1)

**Core User Journeys Supported:**
- Manager : évaluation + suivi KPI “reste d’évaluations”
- Collaborateur : auto‑évaluation simple
- Admin : analytics de base + export rapport
- Support : correction hiérarchique + audit

**Must‑Have Capabilities:**
- Gestion utilisateurs + RBAC par rôles
- Hiérarchies configurables (Tanière/Non‑Tanière)
- Templates de fiches d’évaluation
- Workflow d’évaluation complet (création → soumission → validation)
- Notifications et rappels de période
- Dashboards par rôle (manager/admin/collaborateur)
- KPI “reste d’évaluations”
- Export rapport simple (PPT/Excel)
- Conformité design system SABC + perf mobile

### Post‑MVP Features

**Phase 2 (Growth):**
- Analytics avancées (anomalies, biais, tendances, segmentation fine par région/branche/rôle/période/sexe/tranche d’âge/ancienneté)
- Report builder templatisé (sections standard + champs libres)
- Ajout de graphes au rapport + commentaires éditables
- Optimisations cache/pipelines

**Phase 3 (Expansion):**
- Recommandations décisionnelles (formation/mentorat)
- Extension multi‑direction sans friction (templates & KPIs par direction)
- Automatisation avancée des rapports

### Risk Mitigation Strategy

**Technical Risks:** analytics lourdes + performance 3G/4G
→ limiter le temps réel, batch quotidien, cache ciblé.

**Market Risks:** adoption managers / friction de saisie
→ UX ultra‑fluide, templates clairs, KPI simple, rappels efficaces.

**Resource Risks:** solo sur un scope medium/complexe
→ phasage strict, MVP ultra focalisé, livraison incrémentale.

## Functional Requirements

### User & Access Management

- FR1: L’admin peut créer, modifier et désactiver des utilisateurs avec leurs attributs d’organisation (matricule, région, branche, manager).
- FR2: L’admin peut assigner et modifier les rôles et permissions des utilisateurs.
- FR3: Les utilisateurs peuvent s’authentifier et accéder à un dashboard selon leur rôle.
- FR4: Les utilisateurs peuvent consulter et mettre à jour leur profil.
- FR5: Le système peut restreindre l’accès aux données et fonctionnalités selon le rôle.

### Org Structure & Hierarchy

- FR6: L’admin peut configurer des régions et les marquer Tanière / Non‑Tanière.
- FR7: L’admin peut configurer branches et niveaux hiérarchiques.
- FR8: Le système peut valider la cohérence hiérarchique lors d’assignations manager‑subordonné.
- FR9: Le système peut imposer l’alignement de région entre manager et subordonné.
- FR10: Le système peut autoriser la supervision inter‑branche uniquement pour les rôles habilités.

### Evaluation Rules & Permissions

- FR11: L’admin peut définir des règles d’évaluation avec critères et éligibilités (auto/pairs/subordonnés).
- FR12: Le système peut autoriser l’auto‑évaluation uniquement pour les rôles permis.
- FR13: Le système peut autoriser l’évaluation par pairs selon niveau, région et branche.
- FR14: Le système peut autoriser l’évaluation descendante uniquement pour les liens hiérarchiques directs.
- FR15: Le système peut bloquer toute action d’évaluation non conforme aux règles.
- FR16: Le système peut appliquer les exceptions de rôles (ex. DR/CDTT cross‑branche, pas d’auto‑éval).

### Evaluation Workflow & Status

- FR17: Un évaluateur peut créer une évaluation pour un utilisateur éligible sur une période ouverte.
- FR18: Un évaluateur peut sauvegarder une évaluation en brouillon et la soumettre plus tard.
- FR19: Le système peut valider la complétude des critères et les bornes de notation avant soumission.
- FR20: Un évaluateur peut soumettre une évaluation et recevoir confirmation.
- FR21: Un valideur/manager peut valider ou rejeter une évaluation soumise.
- FR22: Une évaluation rejetée peut repasser en brouillon pour correction.
- FR23: Un évalué peut consulter ses évaluations reçues et leur statut.
- FR24: Un évaluateur peut consulter ses évaluations données et leur statut.
- FR25: Un manager peut effectuer une contre‑évaluation quand la politique le permet.

**Workflow Constraints:**
- L’évaluation est autorisée uniquement si la période est ouverte et dans un délai de 30 jours.
- Une évaluation en brouillon devient en lecture seule après 14 jours sans soumission (sauf si rejetée).

### Templates & Periods

- FR26: L’admin peut créer et éditer des templates de fiches d’évaluation.
- FR27: L’admin peut assigner des templates par rôle et par période.
- FR28: L’admin peut créer et gérer des périodes d’évaluation (dates début/fin).
- FR29: Le système peut ouvrir/fermer automatiquement les périodes selon le calendrier.
- FR30: Le système peut afficher l’état d’une période (ouverte/fermée, échéances).

### Notifications & Escalations

- FR31: Le système peut notifier l’ouverture d’une période aux utilisateurs concernés.
- FR32: Le système peut envoyer des rappels pour évaluations en retard.
- FR33: Le système peut notifier les managers des validations en attente et des escalades.
- FR34: Les utilisateurs peuvent consulter leurs notifications et les marquer comme lues.

### Manager & Collaborator Dashboards

- FR35: Les managers peuvent voir la progression de leur équipe et le KPI “reste d’évaluations”.
- FR36: Les managers peuvent voir les évaluations/validations en attente par collaborateur.
- FR37: Les managers peuvent consulter des statistiques d’équipe (scores, progression).
- FR38: Les collaborateurs peuvent voir leur statut d’évaluation et qui les a évalués (selon permissions).
- FR39: Les utilisateurs peuvent filtrer les vues par période et périmètre d’équipe.

### Admin Analytics & Decision Support

- FR40: L’admin peut consulter des KPIs globaux par région, branche et rôle.
- FR41: L’admin peut accéder à l’analytics d’un utilisateur (scores, historique).
- FR42: Le système peut détecter et signaler des anomalies (écarts auto/pairs/manager, variance faible, baisse). Seuils par défaut : divergence auto vs autres > 1.5 ; baisse < -1 sur 3 mois ; variance < 0.5 ; biais évaluateur si moyenne > 4.5 ou < 2.0 sur 3 périodes.
- FR43: L’admin peut analyser des segments (région, branche, rôle, période, sexe, tranche d’âge, ancienneté) avec agrégats anonymisés si requis.
- FR44: L’admin peut consulter des tendances temporelles multi‑périodes.
- FR45: Le système peut proposer des recommandations d’actions (formation/mentorat/mobilité).

### Reporting & Exports

- FR46: L’admin peut créer un rapport avec sections templatisées et texte libre.
- FR47: L’admin peut ajouter des graphes depuis l’analytics dans un rapport.
- FR48: L’admin peut éditer ou accepter les commentaires proposés pour les sections de rapport.
- FR49: L’admin peut exporter un rapport en PPT et Excel.
- FR50: L’admin peut exporter des graphes individuellement.

### Support & Audit

- FR51: Le support/admin peut corriger les affectations d’un utilisateur (rôle, région, branche, manager).
- FR52: Le système peut journaliser les actions administratives et tentatives d’accès.
- FR53: L’admin peut consulter les logs d’audit pour conformité et diagnostic.

## Non-Functional Requirements

### Performance

- Chargement initial < 5s sur 3G/4G.
- Bundle initial < 300KB.
- API < 1s (standard), DB < 200ms.
- FCP < 3s ; TTI < 6s.

### Security & Privacy

- Données sensibles chiffrées en transit et au repos.
- RBAC strict + journaux d’accès admin.
- Filtrage régional obligatoire sur toutes les requêtes (pas de fuite inter‑régions).
- Anonymisation pour agrégats globaux (suppression si n < 5, scores arrondis à 1 décimale).

### Reliability

- Disponibilité ≥ 99.5%.
- Sauvegarde quotidienne + restauration testée mensuellement.

### Scalability

- Supporter x3 volume d’utilisateurs sans dégradation > 10%.
- Batch analytics quotidien + cache pour KPIs critiques.

### Accessibility

- WCAG AA (contrastes, navigation clavier, labels).

### Observability

- Logs admin + métriques API (latence, erreurs).
- Alertes si latence > 3s sur 5 minutes.
