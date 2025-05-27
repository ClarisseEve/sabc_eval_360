---
trigger: always_on
---

# 🏢 Business Logic SABC - Règles Métier

## HIÉRARCHIE ORGANISATIONNELLE

### Structure Régions Obligatoire
- Tanières : Littoral & Centre (5 niveaux hiérarchiques)
- Non-Tanières : Ouest & Nord (3 niveaux hiérarchiques)

### Double Hiérarchie Stricte
Commercial :
- Tanière : DR → CDTT → CSC → CDV → CDS
- Non-Tanière : DR → CSC → CDS

Marketing : 
- Tanière : DR → CDTT → RTM → TMO
dans certains cas tanière on a plutot: DR → CDTT → RTM → SS → AS
- Non-Tanière : DR → SRMO → TMO

## Definition des abreviations:

DR: Directeur Regional
CDTT: Chef Departement Trade(Commercial)
CSC: Chef Service Commercial
CDV: Chef District Vente
CDS: Chef de Secteur
RTM: Regional Trade Marketing
TMO:Trade Marketing Operator
SRMO:Superviseur Regional Marketing Operation
SS: Superviseur Sponsoring
AS: Assistant Supervieur Sponsoring

### Règles Validation Hiérarchique
- DR et CDTT peuvent superviser les 2 branches
- Autres rôles : même branche uniquement
- Validation niveau hiérarchique obligatoire
- Restriction géographique stricte (même région)

## RÈGLES ÉVALUATION 360°

### Types d'Évaluation Autorisés
1. Auto-évaluation : Tous sauf DR et CDTT
2. Évaluation pairs : Même niveau + même région/service  
3. Évaluation descendante : Supérieur → Subordonnés directs

### Matrice Permissions Complète
| Évaluateur | Auto | Pairs | Subordonnés | Cross-Branch |
|------------|------|-------|-------------|--------------|
| DR         | ❌   | ❌    | ✅          | ✅           |
| CDTT       | ❌   | ❌    | ✅          | ✅           |
| CSC/RTM    | ✅   | ✅    | ✅          | ❌           |
| CDV/TMO    | ✅   | ✅    | ✅          | ❌           |
| CDS/AS     | ✅   | ✅    | ❌          | ❌           |

### Algorithme Validation Principal
1. Même région obligatoire : Pas d'évaluation inter-régions
2. Auto-évaluation DR/CDTT interdite : Exception rôles dirigeants  
3. Cross-branch DR/CDTT : Privilège supervision duale
4. Même catégorie : Commercial/Marketing séparés (sauf DR/CDTT)
5. Validation par niveau : Pairs ou hiérarchie descendante

## WORKFLOW ÉVALUATIONS

### États et Transitions
- **Brouillon** → Soumis
- **Soumis** → Validé/Rejeté/Brouillon
- **Validé** : État final
- **Rejeté** → Brouillon (correction)

### Règles Validation Métier
- Toutes compétences notées (minimum 5)
- Notes entre 1 et 5 obligatoirement
- Date évaluation cohérente (pas future)
- Délai maximum 30 jours
- Commentaires requis si note < 3

## **CALCULS PERFORMANCE**

### Index Performance Composite
- Pondération sources : Auto (20%), Pairs (40%), Manager (40%)
- Période considérée : 6 derniers mois
- Normalisation : Échelle 0-100
- Ajustement régional : Équité inter-régions

### Métriques par Rôle
- DR : Vue stratégique région, comparaisons services
- CDTT : Performance département, commercial vs marketing
- Managers : Métriques équipe, développement talents
- Opérationnels : Performance individuelle, progression

## ANALYTICS & INSIGHTS

### Détection Anomalies Automatique
- Écart auto-évaluation vs autres > 1.5 points
- Baisse performance > 1 point en 3 mois
- Évaluations trop uniformes (variance < 0.5)
- Biais évaluateur (systématiquement sévère/indulgent)

### Recommandations IA
- Formation : Basée sur compétences < 3/5
- Mentorat : Matching experts/apprenants même région
- Mobilité : Identification talents promotion
- Plans développement : Objectifs SMART personnalisés

## **RÈGLES CONFIDENTIALITÉ**

### Accès aux Données
- Évaluateur : Peut voir ses évaluations données
- Évalué : Peut voir évaluations reçues
- Manager : Peut voir évaluations équipe directe
- DR et CDTT : Peuventt voir toute la région
- Anonymisation : Données agrégées sans identification

### Restriction Géographique
- Accès limité à sa région uniquement
- Pas de comparaisons inter-régions nominatives
- Benchmarks anonymisés seulement
- Audit trail complet des accès

## **NOTIFICATIONS & WORKFLOW**

### Alertes Automatiques
- Évaluation en retard (>7 jours échéance)
- Validation en attente manager (>3 jours)
- Performance en baisse significative
- Évaluation incohérente détectée

### Processus Escalade
- Rappel évaluateur +3 jours
- Notification manager +7 jours  
- Alerte DR si blocage >10 jours
- Mesures disciplinaires si nécessaire

## **VALIDATION BUSINESS RULES**

### Tests Métier Obligatoires
- Validation matrice permissions 360°
- Test restriction géographique
- Vérification workflow états
- Contrôle calculs performance
- Test anonymisation données

### Audit & Conformité
- Log toutes tentatives non autorisées
- Métriques conformité mensuelle
- Rapport anomalies automatique
- Validation règles métier continue

## RÈGLES TEMPORELLES

### Cycles Évaluation
- Fréquence : Semestrielle obligatoire
- Période ouverte : 3 semaines
- Rappels : J-7, J-3, J-1, J+1
- Clôture automatique : Fin période

### Archivage & Rétention
- Données actives : 2 ans
- Archive historique : 5 ans
- Purge anonymisée : 7 ans
- Backup sécurisé : Quotidien