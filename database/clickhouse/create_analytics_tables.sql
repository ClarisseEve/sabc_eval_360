-- Table pour stocker les données agrégées d'évaluation
CREATE TABLE IF NOT EXISTS sabc_analytics.evaluations_analytics (
    evalue_matricule String,
    evaluateur_matricule String,
    id_type_evaluation String,
    note_moyenne Float32,
    nombre_evaluations UInt32,
    date_jour Date,
    date_insertion DateTime DEFAULT now(),
    
    -- Utilisation d'un moteur MergeTree pour les performances analytiques
    -- Optimisé pour les requêtes d'agrégation et les filtres sur les dates
    INDEX idx_evalue_matricule evalue_matricule TYPE bloom_filter GRANULARITY 1,
    INDEX idx_evaluateur_matricule evaluateur_matricule TYPE bloom_filter GRANULARITY 1,
    INDEX idx_type_evaluation id_type_evaluation TYPE bloom_filter GRANULARITY 1
) ENGINE = MergeTree()
PARTITION BY toYYYYMM(date_jour)
ORDER BY (date_jour, evalue_matricule, evaluateur_matricule, id_type_evaluation);

-- Table pour stocker les métriques de performance par région
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

-- Table pour stocker les métriques de performance par branche
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

-- Table cible pour la vue matérialisée
CREATE TABLE IF NOT EXISTS sabc_analytics.tendances_mensuelles_region_table (
    region_id String,
    region_nom String,
    mois Date,
    score_moyen_mensuel Float32,
    nombre_evaluations_mensuel UInt32,
    progression_moyenne Float32
) ENGINE = SummingMergeTree()
ORDER BY (mois, region_id);

-- Vue matérialisée pour les tendances mensuelles par région
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
GROUP BY
    region_id,
    region_nom,
    mois;
