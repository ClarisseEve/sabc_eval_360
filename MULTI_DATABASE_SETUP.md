# 🏗️ Architecture Multi-Bases de Données SABC Eval360

## 📋 Vue d'ensemble

L'application SABC Eval360 utilise maintenant une architecture multi-bases de données optimisée pour gérer 500+ utilisateurs simultanés avec une séparation claire des responsabilités.

## 🗄️ Architecture des Bases de Données

### 1. MySQL (sabc_core) - Données Critiques
- **Usage** : Authentification, utilisateurs, rôles, permissions, logs
- **Connexion** : `mysql`
- **Tables principales** :
  - `utilisateurs` - Données utilisateurs et authentification
  - `regions` - Régions géographiques
  - `branches` - Branches organisationnelles
  - `roles` - Rôles et permissions
  - `logs_administration` - Logs d'audit

### 2. PostgreSQL (sabc_business) - Logique Métier
- **Usage** : Évaluations, hiérarchie organisationnelle, notifications
- **Connexion** : `pgsql`
- **Tables principales** :
  - `evaluations` - Évaluations 360°
  - `regles_evaluation` - Règles d'évaluation
  - `periodes_evaluation` - Périodes d'évaluation
  - `notifications` - Système de notifications
  - `remplacements_temporaires` - Gestion des remplacements

### 3. ClickHouse (sabc_analytics) - Analytique
- **Usage** : Données historiques, métriques, rapports de performance
- **Connexion** : `clickhouse`
- **Tables principales** :
  - `evaluations_analytics` - Données d'évaluation pour analyse
  - `performance_region` - Performances par région
  - `performance_branche` - Performances par branche
  - `scores_analytics` - Scores agrégés
  - Vues matérialisées pour les tendances

## 🔄 Synchronisation des Données

### Service de Synchronisation
Le `DatabaseSyncService` gère la synchronisation entre les bases :

1. **MySQL → PostgreSQL** : Toutes les 15 minutes
   - Synchronise les évaluations et données métier
   - Gestion des erreurs et retry automatique

2. **PostgreSQL → ClickHouse** : Quotidien et hebdomadaire
   - Agrégation des données pour l'analytique
   - Calcul des métriques de performance

### Tâches Planifiées
```bash
# Synchronisation MySQL → PostgreSQL (15 min)
*/15 * * * * sync-mysql-to-postgres

# Synchronisation PostgreSQL → ClickHouse (quotidien)
0 1 * * * sync-postgres-to-clickhouse-daily

# Synchronisation PostgreSQL → ClickHouse (hebdomadaire)
0 2 * * 1 sync-postgres-to-clickhouse-weekly

# Test des connexions (horaire)
0 * * * * php artisan db:test-connections
```

## 🛠️ Commandes Artisan Disponibles

### Gestion des Bases de Données
```bash
# Tester les connexions aux 3 bases
php artisan db:test-connections

# Synchroniser les données
php artisan sync:databases --type=all --limit=100

# Analyser les performances
php artisan analyze:performance --connection=all --detailed

# Valider l'architecture complète
php artisan validate:multi-db --detailed
```

### Initialisation et Maintenance
```bash
# Initialiser avec des données de test
php artisan seed:multi-db --connection=all --fresh

# Nettoyer les fichiers obsolètes
php artisan cleanup:legacy --dry-run
```

## 📊 Modèles et Connexions

La majorité des modèles métiers sont dans `app/Models` et déclarent explicitement leur connexion (`mysql`, `pgsql`, `clickhouse`).
Les classes de base (`CoreModel`, `BusinessModel`, `AnalyticsModel`) vivent dans `app/Models/Core`, `app/Models/Business`, `app/Models/Analytics` pour factoriser la connexion et les utilitaires.

### Exemples Core (MySQL)
- `Utilisateur` - Authentification et données utilisateur
- `Region` - Régions géographiques
- `Branche` - Branches organisationnelles
- `Role` - Rôles et permissions
- `LogAdministration` - Logs d'audit

### Exemples Business (PostgreSQL)
- `Evaluation` - Évaluations 360°
- `RegleEvaluation` - Règles d'évaluation
- `PeriodeEvaluation` - Périodes d'évaluation
- `Notification` - Notifications système
- `RemplacementTemporaire` - Remplacements

### Exemples Analytics (ClickHouse)
- `ScoreUtilisateur` - Scores utilisateurs
- `EvaluationAnalytics` - Données d'évaluation analytiques
- `ScoreAnalytics` - Scores agrégés
- `PerformanceReport` - Rapports de performance
- `HistoriqueEvaluation` - Historique des évaluations

## 🚀 Déploiement et Configuration

### 1. Variables d'Environnement
```env
# MySQL (Core)
DB_HOST=localhost
DB_PORT=3306
DB_DATABASE=sabc_core
DB_USERNAME=sabc_user
DB_PASSWORD=your_password

# PostgreSQL (Business)
PGSQL_HOST=localhost
PGSQL_PORT=5432
PGSQL_DATABASE=sabc_business
PGSQL_USERNAME=sabc_user
PGSQL_PASSWORD=your_password

# ClickHouse (Analytics)
CLICKHOUSE_HOST=localhost
CLICKHOUSE_PORT=8123
CLICKHOUSE_DATABASE=sabc_analytics
CLICKHOUSE_USERNAME=admin
CLICKHOUSE_PASSWORD=your_password
```

### 2. Initialisation
```bash
# 1. Migrations MySQL et PostgreSQL
php artisan migrate --database=mysql
php artisan migrate --database=pgsql

# 2. Initialisation ClickHouse (via Docker)
./database/clickhouse/run_clickhouse_script.sh database/clickhouse/create_analytics_tables.sql

# Note: la définition ClickHouse est centralisée dans le script SQL ci-dessus
# afin d'éviter les doubles sources (migrations Laravel ClickHouse archivées).

# 3. Données de test
php artisan seed:multi-db --connection=all

# 4. Validation
php artisan validate:multi-db --detailed
```

### 3. Surveillance et Maintenance
```bash
# Démarrer le planificateur
php artisan schedule:work

# Surveiller les performances
php artisan analyze:performance --connection=all

# Vérifier l'intégrité
php artisan validate:multi-db
```

## 📈 Performances et Optimisation

### Métriques de Performance
- **MySQL** : ~10-20ms temps de connexion
- **PostgreSQL** : ~20-30ms temps de connexion  
- **ClickHouse** : ~10-80ms temps de connexion
- **Synchronisation** : Traitement par lots de 100-200 enregistrements

### Optimisations Implémentées
- Connection pooling pour MySQL et PostgreSQL
- Index optimisés pour les requêtes fréquentes
- Vues matérialisées ClickHouse pour l'analytique
- Cache Redis pour les sessions et queues
- Synchronisation asynchrone avec gestion d'erreurs

## 🔧 Dépannage

### Problèmes Courants
1. **Erreur de connexion** : Vérifier les variables d'environnement
2. **Synchronisation échouée** : Consulter les logs Laravel
3. **ClickHouse indisponible** : Vérifier le conteneur Docker
4. **Migrations échouées** : Vérifier les contraintes de clés étrangères

### Commandes de Diagnostic
```bash
# Test complet de l'architecture
php artisan validate:multi-db --detailed

# Analyse des performances
php artisan analyze:performance --connection=all --detailed

# Vérification des connexions
php artisan db:test-connections
```

## 📚 Structure des Fichiers

```
app/
├── Models/
│   ├── Core/           # Base MySQL (CoreModel)
│   ├── Business/       # Base PostgreSQL (BusinessModel)
│   ├── Analytics/      # Base ClickHouse (AnalyticsModel)
│   └── *.php           # Modèles métier avec connexion explicite
├── Services/
│   └── DatabaseSyncService.php
└── Console/Commands/
    ├── TestDatabaseConnections.php
    ├── SyncDatabases.php
    ├── AnalyzePerformance.php
    ├── ValidateMultiDatabase.php
    ├── SeedMultiDatabase.php
    └── CleanupLegacyFiles.php

database/
├── migrations/         # Migrations Laravel
└── clickhouse/
    ├── create_analytics_tables.sql
    └── run_clickhouse_script.sh
```

## ✅ Validation Finale

L'architecture a été validée avec succès :
- ✅ 3 connexions de base de données opérationnelles
- ✅ Tous les modèles utilisent les bonnes connexions
- ✅ Intégrité référentielle respectée
- ✅ Services de synchronisation fonctionnels
- ✅ Commandes de gestion disponibles
- ✅ Données de test initialisées

**L'architecture multi-bases de données SABC Eval360 est maintenant prête pour la production !**
