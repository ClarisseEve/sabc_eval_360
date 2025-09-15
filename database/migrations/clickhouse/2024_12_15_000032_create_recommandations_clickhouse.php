<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations - Table recommandations dans ClickHouse (ANALYTICS)
     */
    public function up(): void
    {
        DB::connection('clickhouse')->statement("
            CREATE TABLE IF NOT EXISTS recommandations (
                -- Identifiant unique
                id_recommandation String,
                
                -- Destinataire selon hiérarchie SABC
                matricule_destinataire String,
                matricule_generateur String DEFAULT '', -- Système ou manager
                
                -- Type recommandation selon règles métier SABC
                type_recommandation Enum8(
                    'formation' = 1,
                    'mentorat' = 2,
                    'mobilite' = 3,
                    'plan_developpement' = 4,
                    'objectif_smart' = 5,
                    'coaching' = 6
                ),
                
                -- Contenu recommandation selon règles SABC
                titre String,
                description String,
                criteres_declencheurs String DEFAULT '{}', -- JSON
                donnees_support String DEFAULT '{}', -- JSON
                
                -- Priorité selon performance SABC
                priorite Enum8('basse' = 1, 'normale' = 2, 'haute' = 3, 'critique' = 4) DEFAULT 'normale',
                score_pertinence Decimal(3, 2) DEFAULT 0, -- 0-10
                
                -- Échéances selon règles SABC
                date_echeance_suggeree Nullable(Date),
                duree_estimee_jours Nullable(UInt32),
                cout_estime Nullable(Decimal(10, 2)),
                
                -- État traitement selon workflow SABC
                statut Enum8('proposee' = 1, 'acceptee' = 2, 'en_cours' = 3, 'completee' = 4, 'rejetee' = 5) DEFAULT 'proposee',
                date_acceptation Nullable(DateTime),
                date_completion Nullable(DateTime),
                commentaire_utilisateur String DEFAULT '',
                
                -- Suivi efficacité selon règles SABC
                score_avant Nullable(Decimal(5, 2)),
                score_apres Nullable(Decimal(5, 2)),
                amelioration_mesuree Nullable(Decimal(5, 2)),
                objectif_atteint Nullable(UInt8),
                
                -- Références métier selon règles SABC
                code_periode_origine String DEFAULT '',
                id_region String DEFAULT '',
                axe_competence String DEFAULT '', -- Critère d'évaluation ciblé
                
                -- Timestamps ClickHouse
                created_at DateTime DEFAULT now(),
                updated_at DateTime DEFAULT now()
            )
            ENGINE = MergeTree()
            PARTITION BY toYYYYMM(created_at)
            ORDER BY (matricule_destinataire, type_recommandation, created_at)
            SETTINGS index_granularity = 8192
        ");
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        DB::connection('clickhouse')->statement('DROP TABLE IF EXISTS recommandations');
    }
};
