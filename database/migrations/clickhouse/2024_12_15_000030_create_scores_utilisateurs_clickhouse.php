<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations - Table scores_utilisateurs dans ClickHouse (ANALYTICS)
     */
    public function up(): void
    {
        DB::connection('clickhouse')->statement("
            CREATE TABLE IF NOT EXISTS scores_utilisateurs (
                -- Clé composite selon règles métier SABC
                matricule String,
                periode_evaluation String,
                
                -- Scores selon pondération SABC (20% auto, 40% pairs, 40% manager)
                score_global Decimal(5, 2) DEFAULT 0,
                score_auto_evaluation Nullable(Decimal(5, 2)),
                score_pairs Nullable(Decimal(5, 2)),
                score_manager Nullable(Decimal(5, 2)),
                
                -- Évolution performance selon règles SABC
                progression_vs_precedente Nullable(Decimal(5, 2)),
                score_precedent Nullable(Decimal(5, 2)),
                
                -- Métriques évaluations selon règles SABC
                nb_evaluations_recues UInt32 DEFAULT 0,
                nb_evaluations_donnees UInt32 DEFAULT 0,
                nb_auto_evaluations UInt32 DEFAULT 0,
                
                -- Détail par critères selon règles SABC (JSON)
                scores_par_critere String DEFAULT '{}',
                evolution_par_critere String DEFAULT '{}',
                
                -- Statut et validation selon workflow SABC
                statut_calcul Enum8('en_cours' = 1, 'complete' = 2, 'partielle' = 3) DEFAULT 'en_cours',
                derniere_mise_a_jour DateTime DEFAULT now(),
                date_calcul Nullable(DateTime),
                
                -- Normalisation régionale selon règles SABC
                id_region String DEFAULT '',
                score_normalise_region Nullable(Decimal(5, 2)),
                percentile_region Nullable(Decimal(5, 2)),
                
                -- Timestamps ClickHouse
                created_at DateTime DEFAULT now(),
                updated_at DateTime DEFAULT now()
            )
            ENGINE = MergeTree()
            PARTITION BY toYYYYMM(created_at)
            ORDER BY (matricule, periode_evaluation, created_at)
            SETTINGS index_granularity = 8192
        ");
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        DB::connection('clickhouse')->statement('DROP TABLE IF EXISTS scores_utilisateurs');
    }
};
