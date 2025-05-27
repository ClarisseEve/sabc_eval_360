---
trigger: always_on
---

# 📁 Organisation Fichiers SABC - Règles de Structure

## **PRINCIPE FONDAMENTAL**

### Règle d'Or Anti-Duplication
**UN FICHIER = UNE RESPONSABILITÉ UNIQUE**
- Vérifier existence avant création nouveau fichier
- Rechercher dans toute la codebase fonctionnalité similaire
- Étendre fichier existant plutôt que dupliquer
- Nommage explicite reflétant la responsabilité exacte

### Processus Vérification Obligatoire
1. **Recherche globale** : Grep/Find fonction similaire
2. **Consultation architecture** : Vérifier où logique devrait être
3. **Documentation** : Lire docs composants existants
4. **Validation équipe** : Confirmer nécessité nouveau fichier

## **STRUCTURE BACKEND LARAVEL**

### Organisation Controllers
- **Api/** : Endpoints RESTful purs sans vues
- **Auth/** : Authentification et autorisation uniquement  
- **Dashboard/** : Un controller par type de rôle
- **Evaluation/** : CRUD évaluations et workflow
- Règle : Maximum 7 méthodes par controller

### Organisation Services
- **EvaluationService** : Logique évaluations 360° uniquement
- **HierarchieService** : Navigation organisationnelle seulement
- **AnalyticsService** : Calculs métriques et rapports
- **NotificationService** : Gestion alertes et communications
- Règle : Une responsabilité métier par service

### Organisation Models
- Noms correspondant exactement aux tables DB
- Un model par table principale
- Relations définies dans model approprié
- Pas de duplication relations dans plusieurs models

## **STRUCTURE FRONTEND REACT**

### Organisation Composants
- **UI/** : Composants réutilisables design system
- **Charts/** : Graphiques spécialisés par type
- **Dashboards/** : Composants par rôle hiérarchique
- **Forms/** : Formulaires métier spécifiques
- **Layout/** : Structure application générale

### Règles Composants
- Un composant par fichier
- Nom fichier = nom composant exact
- Responsabilité unique par composant
- Props interface dans même fichier

### Organisation Pages
- **Dashboard/** : Une page par type utilisateur
- **Evaluation/** : CRUD évaluations workflow
- **Analytics/** : Rapports et analyses
- **Auth/** : Authentification et profil
- Structure miroir des routes Laravel

## **ÉVITER DUPLICATION CRITIQUE**

### Vérifications Avant Création
Checklist obligatoire :
- Fonction similaire existe-t-elle déjà ?
- Peut-on étendre composant existant ?
- Logique métier déjà implémentée ailleurs ?
- Nom choisi unique dans projet ?

### Patterns Anti-Duplication
- **Extend vs Create** : Hériter plutôt que recréer
- **Composition** : Réutiliser petits composants
- **Services centralisés** : Une source vérité par domaine
- **Types partagés** : Interfaces communes TypeScript

### Erreurs Fréquentes à Éviter
- UserController + UsersController (même entité)
- Button + CustomButton (même composant)
- EvaluationForm + CreateEvaluationForm (même form)
- AnalyticsService + ReportsService (même domaine)

## **NOMMAGE COHÉRENT**

### Conventions Backend
- Controllers : **NomController.php**
- Services : **NomService.php**
- Models : **Nom.php** (singulier)
- Requests : **ActionNomRequest.php**
- Policies : **NomPolicy.php**

### Conventions Frontend
- Components : **NomComponent.tsx**
- Pages : **NomPage.tsx**
- Hooks : **useNom.ts**
- Types : **nomTypes.ts**
- Utils : **nomUtils.ts**

### Conventions Base de Données
- Tables : noms_pluriels (snake_case)
- Colonnes : nom_colonne (snake_case)
- Foreign keys : id_table_référencée
- Index : idx_table_colonnes

## **ORGANISATION PAR DOMAINE**

### Domaines Métier SABC
- **Evaluation** : Tout le processus 360°
- **Hierarchy** : Structure organisationnelle
- **Analytics** : Métriques et rapports
- **Notification** : Communications système
- **Auth** : Authentification autorisation

### Regroupement Logique
Chaque domaine contient :
- Controller dédié
- Service métier
- Models associés
- Requests validation
- Tests correspondants

## **GESTION ASSETS & RESOURCES**

### Images & Media
- **public/images/** : Assets statiques uniquement
- **storage/app/public/** : Uploads utilisateurs
- Éviter duplication images identiques
- Nommage descriptif assets

### Configuration
- **config/** : Un fichier par domaine configuration
- Variables environnement pour valeurs variables
- Constantes dans fichiers config appropriés
- Pas de configuration hardcodée code

## **STRUCTURE TESTS**

### Organisation Tests
- **Feature/** : Tests intégration par workflow
- **Unit/** : Tests unitaires par classe
- **Browser/** : Tests E2E parcours complets
- Nom test = nom classe/méthode testée

### Couverture Tests
- Un fichier test par classe métier
- Tests services business logic prioritaires
- Tests controllers endpoints critiques
- Tests models relations complexes

## **DATA PIPELINES PYTHON**

### Structure Séparée
- **data_pipelines/** : Scripts Python isolés
- **extract/** : Extraction données sources
- **transform/** : Transformations métier
- **load/** : Chargement résultats
- **utils/** : Fonctions communes réutilisables

## **VALIDATION STRUCTURE**

### Checklist Pré-Création Fichier
- [ ] Fichier similaire n'existe pas
- [ ] Nom explicite et unique
- [ ] Responsabilité unique claire
- [ ] Placé dans dossier approprié
- [ ] Documentation fonction ajoutée
- [ ] Tests correspondants prévus

### Revue Périodique
- Audit mensuel fichiers dupliqués
- Refactoring code répétitif identifié
- Consolidation fichiers similaires
- Nettoyage fichiers obsolètes

## **INTERDICTIONS STRUCTURE**

### Fichiers Interdits
- Même nom dans dossiers différents
- Responsabilités multiples dans un fichier
- Duplication logique métier
- Fichiers temporaires commitées
- Configuration sensible dans code

### Pratiques Bannies
- Création sans vérification existence
- Nommage générique ambigü
- Logique métier dispersée
- Assets dupliqués
- Tests séparés de leur classe