# 🐳 Guide Connexion ClickHouse dans DataGrip

## 📋 Informations de votre conteneur

```
Nom conteneur: funny_dewdney.orb.local
Base de données: sabc_analytics
User: default
Password: (vide)
```

## 🔧 Étape 1 : Installer le plugin ClickHouse

1. Ouvrez **DataGrip**
2. **Preferences** (Cmd+,) → **Plugins**
3. Recherchez "**ClickHouse**"
4. Installez le plugin officiel **ClickHouse** de JetBrains
5. Redémarrez DataGrip

## 🔌 Étape 2 : Ajouter la connexion

### Option A : Port Native (9000) - Recommandé

1. Dans DataGrip : **+** → **Data Source** → **ClickHouse**
2. Configurez :

```
Name: SABC Analytics (ClickHouse)
Host: funny_dewdney.orb.local
Port: 9000
Database: sabc_analytics
User: default
Password: (laisser vide)
```

3. **Test Connection** → **OK**

### Option B : Port HTTP (8123) - Alternative

Si le port 9000 ne fonctionne pas :

```
Host: funny_dewdney.orb.local
Port: 8123
Database: sabc_analytics
User: default
Password: (laisser vide)
```

## 🗄️ Étape 3 : Créer la base de données

Ouvrez une console SQL dans DataGrip et exécutez :

```sql
CREATE DATABASE IF NOT EXISTS sabc_analytics;
```

## 📊 Étape 4 : Créer les tables analytics

Copiez-collez ce SQL complet dans DataGrip :

```sql
-- ============================================================================
-- SABC EVAL360 - CLICKHOUSE ANALYTICS TABLES
-- ============================================================================

-- Table 1: Évaluations agrégées
CREATE TABLE IF NOT EXISTS sabc_analytics.evaluations_analytics (
    evalue_matricule String,
    evaluateur_matricule String,
    id_type_evaluation String,
    note_moyenne Float32,
    nombre_evaluations UInt32,
    date_jour Date,
    date_insertion DateTime DEFAULT now(),
    
    INDEX idx_evalue_matricule evalue_matricule TYPE bloom_filter GRANULARITY 1,
    INDEX idx_evaluateur_matricule evaluateur_matricule TYPE bloom_filter GRANULARITY 1,
    INDEX idx_type_evaluation id_type_evaluation TYPE bloom_filter GRANULARITY 1
) ENGINE = MergeTree()
PARTITION BY toYYYYMM(date_jour)
ORDER BY (date_jour, evalue_matricule, evaluateur_matricule, id_type_evaluation);

-- Table 2: Performance par région
CREATE TABLE IF NOT EXISTS sabc_analytics.performance_region (
    region_id String,
    region_nom String,
    est_taniere UInt8,
    date_jour Date,
    score_moyen Float32,
    nombre_evaluations UInt32,
    progression_vs_precedent Float32,
    date_insertion DateTime DEFAULT now()
) ENGINE = MergeTree()
PARTITION BY toYYYYMM(date_jour)
ORDER BY (date_jour, region_id);

-- Table 3: Performance par branche
CREATE TABLE IF NOT EXISTS sabc_analytics.performance_branche (
    branche_id String,
    branche_nom String,
    region_id String,
    date_jour Date,
    score_moyen Float32,
    nombre_evaluations UInt32,
    progression_vs_precedent Float32,
    date_insertion DateTime DEFAULT now()
) ENGINE = MergeTree()
PARTITION BY toYYYYMM(date_jour)
ORDER BY (date_jour, branche_id, region_id);

-- Table 4: Scores utilisateurs
CREATE TABLE IF NOT EXISTS sabc_analytics.scores_utilisateurs (
    matricule String,
    periode_evaluation String,
    score_global Decimal(5, 2) DEFAULT 0,
    score_auto_evaluation Nullable(Decimal(5, 2)),
    score_pairs Nullable(Decimal(5, 2)),
    score_manager Nullable(Decimal(5, 2)),
    progression_vs_precedente Nullable(Decimal(5, 2)),
    score_precedent Nullable(Decimal(5, 2)),
    nb_evaluations_recues UInt32 DEFAULT 0,
    nb_evaluations_donnees UInt32 DEFAULT 0,
    nb_auto_evaluations UInt32 DEFAULT 0,
    scores_par_critere String DEFAULT '{}',
    evolution_par_critere String DEFAULT '{}',
    statut_calcul Enum8('en_cours' = 1, 'complete' = 2, 'partielle' = 3) DEFAULT 'en_cours',
    derniere_mise_a_jour DateTime DEFAULT now(),
    date_calcul Nullable(DateTime),
    id_region String DEFAULT '',
    score_normalise_region Nullable(Decimal(5, 2)),
    percentile_region Nullable(Decimal(5, 2)),
    created_at DateTime DEFAULT now(),
    updated_at DateTime DEFAULT now()
) ENGINE = MergeTree()
PARTITION BY toYYYYMM(created_at)
ORDER BY (matricule, periode_evaluation, created_at);

-- Table 5: Logs anomalies
CREATE TABLE IF NOT EXISTS sabc_analytics.logs_anomalies (
    id_anomalie String,
    type_anomalie Enum8(
        'divergence_auto_autres' = 1,
        'baisse_performance' = 2,
        'uniformite_evaluations' = 3,
        'biais_evaluateur' = 4,
        'evaluation_tardive' = 5,
        'score_incoherent' = 6
    ),
    matricule_concerne String,
    matricule_evaluateur String DEFAULT '',
    id_evaluation String DEFAULT '',
    code_periode String DEFAULT '',
    description String,
    donnees_anomalie String DEFAULT '{}',
    score_severite Decimal(3, 2) DEFAULT 0,
    valeur_detectee Nullable(Decimal(8, 2)),
    seuil_configure Nullable(Decimal(8, 2)),
    ecart_seuil Nullable(Decimal(8, 2)),
    statut Enum8('detectee' = 1, 'en_cours' = 2, 'resolue' = 3, 'ignoree' = 4) DEFAULT 'detectee',
    assignee_matricule String DEFAULT '',
    commentaire_resolution String DEFAULT '',
    date_resolution Nullable(DateTime),
    necessite_escalade UInt8 DEFAULT 0,
    manager_notifie_matricule String DEFAULT '',
    date_escalade Nullable(DateTime),
    created_at DateTime DEFAULT now(),
    updated_at DateTime DEFAULT now()
) ENGINE = MergeTree()
PARTITION BY toYYYYMM(created_at)
ORDER BY (type_anomalie, matricule_concerne, created_at);

-- Table 6: Recommandations
CREATE TABLE IF NOT EXISTS sabc_analytics.recommandations (
    id_recommandation String,
    matricule_destinataire String,
    matricule_generateur String DEFAULT '',
    type_recommandation Enum8(
        'formation' = 1,
        'mentorat' = 2,
        'mobilite' = 3,
        'plan_developpement' = 4,
        'objectif_smart' = 5,
        'coaching' = 6
    ),
    titre String,
    description String,
    criteres_declencheurs String DEFAULT '{}',
    donnees_support String DEFAULT '{}',
    priorite Enum8('basse' = 1, 'normale' = 2, 'haute' = 3, 'critique' = 4) DEFAULT 'normale',
    score_pertinence Decimal(3, 2) DEFAULT 0,
    date_echeance_suggeree Nullable(Date),
    duree_estimee_jours Nullable(UInt32),
    cout_estime Nullable(Decimal(10, 2)),
    statut Enum8('proposee' = 1, 'acceptee' = 2, 'en_cours' = 3, 'completee' = 4, 'rejetee' = 5) DEFAULT 'proposee',
    date_acceptation Nullable(DateTime),
    date_completion Nullable(DateTime),
    commentaire_utilisateur String DEFAULT '',
    score_avant Nullable(Decimal(5, 2)),
    score_apres Nullable(Decimal(5, 2)),
    amelioration_mesuree Nullable(Decimal(5, 2)),
    objectif_atteint Nullable(UInt8),
    code_periode_origine String DEFAULT '',
    id_region String DEFAULT '',
    axe_competence String DEFAULT '',
    created_at DateTime DEFAULT now(),
    updated_at DateTime DEFAULT now()
) ENGINE = MergeTree()
PARTITION BY toYYYYMM(created_at)
ORDER BY (matricule_destinataire, type_recommandation, created_at);

-- Table 7: Tendances mensuelles (table cible pour vue matérialisée)
CREATE TABLE IF NOT EXISTS sabc_analytics.tendances_mensuelles_region_table (
    region_id String,
    region_nom String,
    mois Date,
    score_moyen_mensuel Float32,
    nombre_evaluations_mensuel UInt32,
    progression_moyenne Float32
) ENGINE = SummingMergeTree()
ORDER BY (mois, region_id);

-- Vue matérialisée pour tendances mensuelles
CREATE MATERIALIZED VIEW IF NOT EXISTS sabc_analytics.tendances_mensuelles_region
TO sabc_analytics.tendances_mensuelles_region_table
AS
SELECT
    region_id,
    region_nom,
    toStartOfMonth(date_jour) AS mois,
    avg(score_moyen) AS score_moyen_mensuel,
    sum(nombre_evaluations) AS nombre_evaluations_mensuel,
    avg(progression_vs_precedent) AS progression_moyenne
FROM sabc_analytics.performance_region
GROUP BY region_id, region_nom, mois;
```

## ✅ Étape 5 : Vérifier les tables créées

```sql
-- Lister toutes les tables
SHOW TABLES FROM sabc_analytics;

-- Vérifier la structure d'une table
DESCRIBE sabc_analytics.evaluations_analytics;

-- Compter les enregistrements
SELECT COUNT(*) FROM sabc_analytics.evaluations_analytics;
```

## 🔄 Étape 6 : Mettre à jour le .env Laravel

Vérifiez que votre `.env` contient :

```env
CLICKHOUSE_HOST=funny_dewdney.orb.local
CLICKHOUSE_PORT=9000
CLICKHOUSE_DATABASE=sabc_analytics
CLICKHOUSE_USERNAME=default
CLICKHOUSE_PASSWORD=
```

## 🧪 Étape 7 : Tester la connexion depuis Laravel

```bash
php artisan tinker
```

Puis dans tinker :

```php
DB::connection('clickhouse')->select('SELECT 1 as test');
// Devrait retourner: [{"test": 1}]

DB::connection('clickhouse')->select('SHOW TABLES FROM sabc_analytics');
// Devrait lister vos 7 tables
```

## 📊 Architecture ClickHouse SABC

### Tables principales
1. **evaluations_analytics** : Données agrégées évaluations
2. **performance_region** : Métriques par région
3. **performance_branche** : Métriques par branche
4. **scores_utilisateurs** : Scores calculés 360°
5. **logs_anomalies** : Détection anomalies
6. **recommandations** : Engine recommandations
7. **tendances_mensuelles_region_table** : Agrégations mensuelles

### Optimisations ClickHouse
- **Partitionnement** : Par mois (toYYYYMM)
- **Index Bloom Filter** : Recherches rapides sur matricules
- **MergeTree Engine** : Performances analytiques optimales
- **Vue matérialisée** : Calculs pré-agrégés temps réel

## 🚀 Prochaines étapes

1. ✅ Connexion ClickHouse dans DataGrip
2. ✅ Tables créées
3. 🔄 Configurer synchronisation PostgreSQL → ClickHouse
4. 🔄 Implémenter pipelines Python pour analytics
5. 🔄 Créer dashboards Grafana

## 🐛 Dépannage

### Erreur "Connection refused"
```bash
# Vérifier que le conteneur est actif
docker ps | grep funny_dewdney

# Vérifier les ports exposés
docker port funny_dewdney
```

### Erreur "Database doesn't exist"
```sql
-- Créer manuellement la base
CREATE DATABASE sabc_analytics;
```

### Erreur "Authentication failed"
```sql
-- ClickHouse par défaut n'a pas de mot de passe
-- Laisser le champ password vide dans DataGrip
```
