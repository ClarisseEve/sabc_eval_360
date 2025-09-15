<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations - Table logs_anomalies dans ClickHouse (ANALYTICS)
     */
    public function up(): void
    {
        DB::connection('clickhouse')->statement("
            CREATE TABLE IF NOT EXISTS logs_anomalies (
                -- Identifiant unique
                id_anomalie String,
                
                -- Détection anomalie selon règles SABC
                type_anomalie Enum8(
                    'divergence_auto_autres' = 1,
                    'baisse_performance' = 2,
                    'uniformite_evaluations' = 3,
                    'biais_evaluateur' = 4,
                    'evaluation_tardive' = 5,
                    'score_incoherent' = 6
                ),
                
                -- Références métier selon règles SABC
                matricule_concerne String,
                matricule_evaluateur String DEFAULT '',
                id_evaluation String DEFAULT '',
                code_periode String DEFAULT '',
                
                -- Détails anomalie selon règles SABC
                description String,
                donnees_anomalie String DEFAULT '{}', -- JSON
                score_severite Decimal(3, 2) DEFAULT 0, -- 0-10
                
                -- Seuils dépassés selon règles métier SABC
                valeur_detectee Nullable(Decimal(8, 2)),
                seuil_configure Nullable(Decimal(8, 2)),
                ecart_seuil Nullable(Decimal(8, 2)),
                
                -- État traitement selon workflow SABC
                statut Enum8('detectee' = 1, 'en_cours' = 2, 'resolue' = 3, 'ignoree' = 4) DEFAULT 'detectee',
                assignee_matricule String DEFAULT '',
                commentaire_resolution String DEFAULT '',
                date_resolution Nullable(DateTime),
                
                -- Escalade selon hiérarchie SABC
                necessite_escalade UInt8 DEFAULT 0,
                manager_notifie_matricule String DEFAULT '',
                date_escalade Nullable(DateTime),
                
                -- Timestamps ClickHouse
                created_at DateTime DEFAULT now(),
                updated_at DateTime DEFAULT now()
            )
            ENGINE = MergeTree()
            PARTITION BY toYYYYMM(created_at)
            ORDER BY (type_anomalie, matricule_concerne, created_at)
            SETTINGS index_granularity = 8192
        ");
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        DB::connection('clickhouse')->statement('DROP TABLE IF EXISTS logs_anomalies');
    }
};
