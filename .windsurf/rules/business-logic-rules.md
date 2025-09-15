---
trigger: always_on
---

Logique Métier SABC - Règles d'Affaires
1. Organisation Interne et Hiérarchie
1.1. Structure Régionale
La SABC opère avec deux typologies de régions, influençant directement la modélisation et la logique hiérarchique du système :

Régions Tanières (ex: Littoral, Centre) : Ces entités à forte densité commerciale intègrent une structure hiérarchique de 5 niveaux de profondeur. Le système est configuré pour adapter dynamiquement requêtes et validations à cette granularité.

Régions Non-Tanières (ex: Ouest, Nord) : Moins denses, elles fonctionnent avec une structure simplifiée à 3 niveaux. La logique backend est conçue pour différencier et appliquer la hiérarchie correspondante de manière fluide.

1.2. Chaîne de Commandement par Branche
La gestion des affectations et supervisions doit refléter ces chaînes de commandement clés :

Branche Commerciale :

Tanière : Directeur Régional (DR) → Chef Département Trade (CDTT) → Chef Service Commercial (CSC) → Chef District Vente (CDV) → Chef de Secteur (CDS)

Non-Tanière : Directeur Régional (DR) → Chef Service Commercial (CSC) → Chef de Secteur (CDS)

Branche Marketing :

Tanière : Directeur Régional (DR) → Chef Département Trade (CDTT) → Regional Trade Marketing (RTM) → Trade Marketing Operator (TMO)

Variante en tanière : DR → CDTT → RTM → Superviseur Sponsoring (SS) → Assistant Superviseur Sponsoring (AS)

Précision : Le RTM est unique par région tanière et n'évalue que ses subordonnés directs (TMO, SS, AS).

Non-Tanière : Directeur Régional (DR) → Superviseur Régional Marketing Opérationnel (SRMO) → Trade Marketing Operator (TMO)

Précision : Le SRMO est unique par région non-tanière et n'évalue que ses subordonnés directs (TMO).

1.3. Glossaire des Abréviations Techniques et Fonctionnelles
DR : Directeur Régional

CDTT : Chef Département Trade (Commercial)

CSC : Chef Service Commercial

CDV : Chef District Vente

CDS : Chef de Secteur

RTM : Regional Trade Marketing

TMO : Trade Marketing Operator

SRMO : Superviseur Régional Marketing Opérationnel

SS : Superviseur Sponsoring

AS : Assistant Superviseur Sponsoring

1.4. Règles de Liens Hiérarchiques et Validation
Les rôles DR et CDTT possèdent des privilèges d'inter-branche (peut_cross_branch = true).

Les autres rôles (CSC, RTM, CDV, TMO, CDS, AS, SRMO, SS) sont principalement restreints à leur propre branche_id.

Le système intègre une validation de cohérence hiérarchique lors des opérations CRUD sur la table utilisateurs, assurant que manager_matricule et niveau_hierarchique sont alignés avec type_region.

La supervision est géographiquement contrainte : l'id_region du manager doit correspondre à celui du subordonné.

2. Règles d'Évaluation 360°
2.1. Types d'Évaluations et Processus
Auto-évaluation : Un utilisateur évalue sa propre performance. L'attribut peut_auto_evaluer sur le role détermine l'autorisation.

Évaluation par les pairs : Un utilisateur évalue un collègue de même niveau_hierarchique, dans la même id_region et id_branche. L'attribut peut_evaluer_pairs est vérifié. Exception : Les rôles uniques par région (DR, CDTT, RTM, SRMO) ne peuvent pas évaluer leurs pairs.

Évaluation descendante : Un manager évalue ses subordonnes directs. L'attribut peut_evaluer_subordonnes est vérifié, couplé à la niveau_hierarchique et manager_matricule.

2.2. Matrice des Permissions (Regles_Evaluation & Roles)
Les permissions sont gérées via la table regles_evaluation et les flags booléens sur la table roles.

DR : Auto-évaluation: Non, Évaluation par les Pairs: Non, Évaluation des Subordonnés: Oui, Évaluation Inter-Branches: Oui.

CDTT : Auto-évaluation: Non, Évaluation par les Pairs: Non, Évaluation des Subordonnés: Oui, Évaluation Inter-Branches: Oui.

CSC : Auto-évaluation: Oui, Évaluation par les Pairs: Oui, Évaluation des Subordonnés: Oui, Évaluation Inter-Branches: Non.

RTM : Auto-évaluation: Oui, Évaluation par les Pairs: Non, Évaluation des Subordonnés: Oui, Évaluation Inter-Branches: Non. (N'évalue que ses subordonnés directs)

CDV / TMO : Auto-évaluation: Oui, Évaluation par les Pairs: Oui, Évaluation des Subordonnés: Oui, Évaluation Inter-Branches: Non.

CDS / AS : Auto-évaluation: Oui, Évaluation par les Pairs: Oui, Évaluation des Subordonnés: Non, Évaluation Inter-Branches: Non.

SRMO : Auto-évaluation: Oui, Évaluation par les Pairs: Non, Évaluation des Subordonnés: Oui, Évaluation Inter-Branches: Non. (N'évalue que ses subordonnés directs)

2.3. Principes de Validation des Évaluations (Logique Applicative)
Restriction id_region : evaluateur.id_region == evalue.id_region.

Exclusion DR/CDTT Auto-évaluation : role.peut_auto_evaluer est false pour ces rôles.

Privilège Cross-branche DR/CDTT : Autorisé si role.peut_cross_branch est true et si l'évaluateur est un DR ou CDTT.

Même catégorie (id_branche) : Pour les évaluations par les pairs (hors DR/CDTT), evaluateur.id_branche == evalue.id_branche.

Validation par niveau : niveau_hierarchique de l'évaluateur supérieur (descendantes) ou égal (pairs) à celui de l'évalué.

3. Déroulement des Évaluations (Workflow)
3.1. États et Transitions (evaluations.statut)
brouillon : Initial. → soumis.

soumis : En attente validation. → validé, rejeté. Un rejeté → brouillon.

validé : Terminal.

rejeté : Refusé. → brouillon.

3.2. Règles de Validation du Contenu (evaluations.notations_json)
Le backend applique des validations strictes :

Complétude : Tous critères de regles_evaluation.criteres_evaluation_json (min 5) doivent être notés dans evaluations.notations_json.

Notes : Chaque note dans notations_json est un entier entre 1 et 5.

Temps : date_soumission non postérieure à la date courante.

Délai : Soumission attendue dans les 30 jours après periodes_evaluation.date_debut.

Commentaires : Obligatoires si note associée < 3.

4. Calcul et Analyse de la Performance
4.1. Score de Performance Global (scores_utilisateurs.score_global)
Calculé par tâche backend (Job asynchrone) en pondérant :

Auto-évaluation : 20%

Évaluation des pairs : 40%

Évaluation du manager : 40%
Basé sur les 6 derniers mois, normalisé 0-100, et ajusté régionalement pour équité.

4.2. Indicateurs par Rôle (Dashboards & Reports)
Vues agrégées sur scores_utilisateurs et evaluations pour indicateurs pertinents :

DR : Tableaux de bord stratégiques basés sur score_global par region_nom et comparaisons services_commerciaux.

CDTT : Performance départementale via scores_agreges pour branches Commerciale et Marketing.

Managers : Métriques d'équipe (nb_evaluations_recues, nb_evaluations_donnees) et progression talents (progression_vs_precedente).

Opérationnels : Performance individuelle et progression_vs_precedente.

5. Détection et Recommandations (Analytics)
5.1. Détection Automatique des Anomalies (logs_anomalies ou équivalent)
Le système détecte des anomalies via heuristiques :

Divergence Auto vs. Autres : Alerte si abs(score_auto - score_pairs/manager) > 1.5 pts.

Baisse de Performance : Alerte si progression_vs_precedente < -1 pt sur 3 mois.

Uniformité des Évaluations : Alerte si variance notations_json < 0.5 (manque de différenciation).

Biais Évaluateur : Alerte si moyenne de notation systématiquement élevée/basse.

5.2. Suggestions pour le Développement (Engine de Recommandations)
Requêtes complexes ou microservice (AI Service) pour recommandations :

Formations : Basées sur criteres_evaluation_json où note_globale pour axe_competence est < 3/5.

Mentorat : Matching experts/apprenants (score global élevé vs faible) dans la même id_region.

Mobilité : Identification de talents avec forte progression_vs_precedente et score_global élevé.

Plans de développement : Génération d'objectifs SMART basés sur les faiblesses identifiées.

6. Protection des Données (RBAC & Audit)
6.1. Accès aux Données (Laravel Policies)
Contrôlé strictement par des Policies Laravel :

Évaluateur : Voit ses evaluations données (evaluateur_matricule).

Évalué : Voit ses evaluations reçues (evalue_matricule).

Manager : Accède aux evaluations et scores_utilisateurs de son équipe directe (manager_matricule).

DR et CDTT : Accès à toutes les evaluations et scores_utilisateurs de leur id_region et branches supervisées (peut_cross_branch).

Anonymisation : Vues et agrégations globales excluent identifiants directs (matricule, nom, prenom).

6.2. Restriction Géographique (Filtrage des Requêtes)
Requêtes de données filtrées par l'id_region de l'utilisateur authentifié.

Comparaisons inter-régions nominatives bloquées au niveau API.

Benchmarks entre régions limités aux vues anonymisées.

logs_administration enregistre tentatives d'accès non autorisées (adresse_ip).

7. Alertes et Suivi (Notifications & Planification)
7.1. Alertes Automatiques (notifications table & Scheduled Jobs)
Le système envoie notifications via la table notifications :

Évaluation en retard : Détectée par Scheduled Job si date_soumission manquante et date_creation > 7 jours.

Validation en attente manager : Si statut = 'soumis' et date_soumission > 3 jours.

Performance en baisse : Détectée par Analytics Engine (score_global ou progression_vs_precedente chute).

Évaluations incohérentes : Détectées par module d'anomalies.

7.2. Processus d'Escalade (Workflow de Notifications)
Processus d'escalade structuré :

Rappel Évaluateur : Notification à evaluateur_matricule après 3 jours de retard.

Notification Manager : manager_matricule de l'évaluateur informé après 7 jours de retard.

Alerte DR : DR de la region alerté si blocage > 10 jours.

Mesures : Cas non résolus gérés par Administrateur, traçabilité dans logs_administration.

8. Validation et Conformité (Tests & Monitoring)
8.1. Tests Métier Obligatoires (PHPUnit, Feature Tests)
Tests automatisés rigoureux pour garantir :

Matrice Permissions : Tests unitaires/fonctionnels sur Policies et EvaluationService.

Restriction Géographique : Tests d'intégration des filtres id_region sur API.

Workflow États : Tests de scénario sur transitions statut des evaluations.

Calculs Performance : Tests unitaires sur algorithme score_global et progression_vs_precedente.

Anonymisation : Vérification des vues et requêtes agrégées.

8.2. Audit et Suivi (logs_administration & Monitoring Tools)
Tentatives d'accès non autorisées loguées dans logs_administration (resultat: 'erreur').

Rapports de conformité mensuels générés à partir de logs_administration.

Anomalies signalées automatiquement par module d'analytics.

Validation des règles métier continue via Scheduled Jobs vérifiant la cohérence des données.

9. Calendrier des Évaluations (periodes_evaluation)
9.1. Cycles d'Évaluation
La table periodes_evaluation gère les cycles d'évaluation :

Fréquence : semestrielles obligatoires (ex: '2025-S1').

Durée d'ouverture : Période définie (date_debut à date_fin, typiquement 3 semaines). est_ouverte mis à jour par Scheduled Job.

Rappels : Notifiés par notifications en fonction des dates clés (J-7, J-3, J-1, J+1).

Clôture automatique : Scheduled Job ferme la période en fin de date_fin.

9.2. Stratégie de Rétention des Données
Politique de rétention pour le cycle de vie des données :

Données actives : evaluations, scores_utilisateurs, utilisateurs accessibles pendant 2 ans.

Archive historique : Données plus anciennes archivées pour 5 ans.

Purge anonymisée : Données rendues anonymes après 7 ans (via ETL).

Sauvegarde : Politique de backup quotidien sécurisée de la base de données.