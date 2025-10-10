<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations - Ajout champs manquants selon règles SABC
     */
    public function up(): void
    {
        $connection = DB::connection('pgsql');
        $schema = Schema::connection('pgsql');

        $schema->table('evaluations', function (Blueprint $table) use ($schema) {
            // Champs pour remplacements temporaires selon règles SABC
            if (! $schema->hasColumn('evaluations', 'matricule_remplacant')) {
                $table->string('matricule_remplacant', 5)->nullable()->after('evalue_matricule');
            }

            if (! $schema->hasColumn('evaluations', 'est_remplacement')) {
                $table->boolean('est_remplacement')->default(false)->after('matricule_remplacant');
            }

            // Référence période selon règles métier SABC
            if (
                ! $schema->hasColumn('evaluations', 'code_periode') &&
                ! $schema->hasColumn('evaluations', 'periode_code')
            ) {
                $table->string('code_periode', 20)->nullable()->after('id_periode');
            }

            // Workflow validation selon hiérarchie SABC
            if (! $schema->hasColumn('evaluations', 'est_validee_manager')) {
                $table->boolean('est_validee_manager')->default(false)->after('statut');
            }

            if (! $schema->hasColumn('evaluations', 'date_validation_manager')) {
                $table->timestamp('date_validation_manager')->nullable()->after('est_validee_manager');
            }

            if (! $schema->hasColumn('evaluations', 'validateur_matricule')) {
                $table->string('validateur_matricule', 5)->nullable()->after('date_validation_manager');
            }

            // Métriques performance selon règles SABC
            if (! $schema->hasColumn('evaluations', 'progression_vs_precedente')) {
                $table->decimal('progression_vs_precedente', 5, 2)->nullable()->after('note_globale');
            }

            if (! $schema->hasColumn('evaluations', 'historique_modifications')) {
                $table->json('historique_modifications')->nullable()->after('progression_vs_precedente');
            }

            // Alertes et suivi selon règles SABC
            if (! $schema->hasColumn('evaluations', 'nb_rappels_envoyes')) {
                $table->integer('nb_rappels_envoyes')->default(0)->after('historique_modifications');
            }

            if (! $schema->hasColumn('evaluations', 'derniere_alerte_envoyee')) {
                $table->timestamp('derniere_alerte_envoyee')->nullable()->after('nb_rappels_envoyes');
            }
        });

        $indexExists = static function (string $indexName) use ($connection): bool {
            $result = $connection->selectOne(
                "SELECT 1 FROM pg_indexes WHERE schemaname = current_schema() AND indexname = ? LIMIT 1",
                [$indexName]
            );

            return $result !== null;
        };

        $schema->table('evaluations', function (Blueprint $table) use ($indexExists) {
            if (! $indexExists('idx_evaluateur_periode')) {
                $table->index(['evaluateur_matricule', 'code_periode'], 'idx_evaluateur_periode');
            }

            if (! $indexExists('idx_evalue_statut')) {
                $table->index(['evalue_matricule', 'statut'], 'idx_evalue_statut');
            }

            if (! $indexExists('idx_remplacant')) {
                $table->index(['matricule_remplacant'], 'idx_remplacant');
            }

            if (! $indexExists('idx_validation')) {
                $table->index(['est_validee_manager', 'date_validation_manager'], 'idx_validation');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        $connection = DB::connection('pgsql');
        $schema = Schema::connection('pgsql');

        $indexExists = static function (string $indexName) use ($connection): bool {
            $result = $connection->selectOne(
                "SELECT 1 FROM pg_indexes WHERE schemaname = current_schema() AND indexname = ? LIMIT 1",
                [$indexName]
            );

            return $result !== null;
        };

        if (
            $indexExists('idx_evaluateur_periode') ||
            $indexExists('idx_evalue_statut') ||
            $indexExists('idx_remplacant') ||
            $indexExists('idx_validation')
        ) {
            $schema->table('evaluations', function (Blueprint $table) use ($indexExists) {
                if ($indexExists('idx_evaluateur_periode')) {
                    $table->dropIndex('idx_evaluateur_periode');
                }

                if ($indexExists('idx_evalue_statut')) {
                    $table->dropIndex('idx_evalue_statut');
                }

                if ($indexExists('idx_remplacant')) {
                    $table->dropIndex('idx_remplacant');
                }

                if ($indexExists('idx_validation')) {
                    $table->dropIndex('idx_validation');
                }
            });
        }

        $columnsToDrop = array_filter([
            'matricule_remplacant',
            'est_remplacement',
            'code_periode',
            'est_validee_manager',
            'date_validation_manager',
            'validateur_matricule',
            'progression_vs_precedente',
            'historique_modifications',
            'nb_rappels_envoyes',
            'derniere_alerte_envoyee',
        ], fn (string $column) => $schema->hasColumn('evaluations', $column));

        if (! empty($columnsToDrop)) {
            $schema->table('evaluations', function (Blueprint $table) use ($columnsToDrop) {
                $table->dropColumn($columnsToDrop);
            });
        }
    }
};
