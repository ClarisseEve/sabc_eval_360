CREATE DATABASE IF NOT EXISTS sabc_analytics;

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

-- Table scores_utilisateurs (analytics scoring)
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
ORDER BY (matricule, periode_evaluation, created_at)
SETTINGS index_granularity = 8192;

-- Table logs_anomalies (analytics anomalies)
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
ORDER BY (type_anomalie, matricule_concerne, created_at)
SETTINGS index_granularity = 8192;

-- Table recommandations (analytics recommendations)
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
ORDER BY (matricule_destinataire, type_recommandation, created_at)
SETTINGS index_granularity = 8192;
