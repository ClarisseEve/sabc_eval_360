<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     * Mise à jour de la table evaluations selon le schéma SABC final
     */
    public function up(): void
    {
        $connection = DB::connection('pgsql');
        $schema = Schema::connection('pgsql');

        $idEvaluationColumn = $connection->selectOne(
            "SELECT data_type FROM information_schema.columns WHERE table_schema = current_schema() AND table_name = 'evaluations' AND column_name = 'id_evaluation' LIMIT 1"
        );
        $idEvaluationType = $idEvaluationColumn->data_type ?? null;

        if ($idEvaluationType === null) {
            $schema->table('evaluations', function (Blueprint $table) {
                $table->id('id_evaluation')->first();
            });
        } elseif ($idEvaluationType !== 'bigint') {
            $schema->table('evaluations', function (Blueprint $table) {
                $table->dropPrimary();
            });

            $schema->table('evaluations', function (Blueprint $table) {
                $table->dropColumn('id_evaluation');
            });

            $schema->table('evaluations', function (Blueprint $table) {
                $table->id('id_evaluation')->first();
            });
        }

        $idRegleColumn = $connection->selectOne(
            "SELECT data_type FROM information_schema.columns WHERE table_schema = current_schema() AND table_name = 'evaluations' AND column_name = 'id_regle' LIMIT 1"
        );
        $idRegleType = $idRegleColumn->data_type ?? null;

        if ($idRegleType !== null && $idRegleType !== 'bigint') {
            $connection->statement('UPDATE evaluations SET id_regle = NULL');

            $schema->table('evaluations', function (Blueprint $table) {
                $table->dropColumn('id_regle');
            });

            $schema->table('evaluations', function (Blueprint $table) {
                $table->unsignedBigInteger('id_regle')->nullable()->after('id_periode');
            });
        }

        if ($schema->hasColumn('evaluations', 'date_evaluation') && ! $schema->hasColumn('evaluations', 'date_creation')) {
            $schema->table('evaluations', function (Blueprint $table) {
                $table->renameColumn('date_evaluation', 'date_creation');
            });
        }

        if ($schema->hasColumn('evaluations', 'commentaire_general') && ! $schema->hasColumn('evaluations', 'commentaire_global')) {
            $schema->table('evaluations', function (Blueprint $table) {
                $table->renameColumn('commentaire_general', 'commentaire_global');
            });
        }

        if ($schema->hasColumn('evaluations', 'code_periode') && ! $schema->hasColumn('evaluations', 'periode_code')) {
            $schema->table('evaluations', function (Blueprint $table) {
                $table->renameColumn('code_periode', 'periode_code');
            });
        }

        if ($schema->hasColumn('evaluations', 'date_validation_manager') && ! $schema->hasColumn('evaluations', 'date_validation')) {
            $schema->table('evaluations', function (Blueprint $table) {
                $table->renameColumn('date_validation_manager', 'date_validation');
            });
        }

        $schema->table('evaluations', function (Blueprint $table) use ($schema) {
            if (! $schema->hasColumn('evaluations', 'evaluateur_en_remplacement')) {
                $table->boolean('evaluateur_en_remplacement')->default(false)->after('id_regle')->comment('true si évaluateur remplace quelqu\'un');
            }

            if (! $schema->hasColumn('evaluations', 'id_remplacement')) {
                $table->unsignedBigInteger('id_remplacement')->nullable()->after('evaluateur_en_remplacement')->comment('Lien vers remplacement si applicable');
            }

            if (! $schema->hasColumn('evaluations', 'periode_code')) {
                $table->string('periode_code', 7)->nullable()->after('id_periode')->comment('2025-S1, 2025-S2');
            }

            if (! $schema->hasColumn('evaluations', 'validateur_matricule')) {
                $table->string('validateur_matricule', 20)->nullable()->after('date_soumission');
            }

            if (! $schema->hasColumn('evaluations', 'date_validation')) {
                $table->timestamp('date_validation')->nullable()->after('validateur_matricule');
            }
        });

        if ($schema->hasColumn('evaluations', 'periode_code')) {
            $connection->statement("UPDATE evaluations SET periode_code = '0000-S0' WHERE periode_code IS NULL");

            $schema->table('evaluations', function (Blueprint $table) {
                $table->string('periode_code', 7)->default('0000-S0')->nullable(false)->comment('2025-S1, 2025-S2')->change();
            });
        }

        if ($schema->hasColumn('evaluations', 'validateur_matricule')) {
            $schema->table('evaluations', function (Blueprint $table) {
                $table->string('validateur_matricule', 20)->nullable()->change();
            });
        }

        if ($schema->hasColumn('evaluations', 'date_validation')) {
            $schema->table('evaluations', function (Blueprint $table) {
                $table->timestamp('date_validation')->nullable()->change();
            });
        }

        if ($schema->hasColumn('evaluations', 'notations_json')) {
            $connection->statement('ALTER TABLE evaluations ALTER COLUMN notations_json TYPE text USING notations_json::text');
            $connection->statement('COMMENT ON COLUMN evaluations.notations_json IS \'JSON: {critere_nom: {note: 1-5, commentaire: ""}, ...}\'');
        }

        $connection->statement("UPDATE evaluations SET statut = 'brouillon' WHERE statut IS NULL");
        $connection->statement('ALTER TABLE evaluations DROP CONSTRAINT IF EXISTS evaluations_statut_check');
        $connection->statement("ALTER TABLE evaluations ALTER COLUMN statut SET DEFAULT 'brouillon'");
        $connection->statement("ALTER TABLE evaluations ADD CONSTRAINT evaluations_statut_check CHECK (statut IN ('brouillon', 'soumis', 'valide'))");

        $columnsToDrop = array_filter([
            'source_system',
            'sync_date',
            'sync_status',
        ], fn (string $column) => $schema->hasColumn('evaluations', $column));

        if (! empty($columnsToDrop)) {
            $hasSyncIndex = $connection->selectOne(
                "SELECT 1 FROM pg_indexes WHERE schemaname = current_schema() AND indexname = 'idx_sync_status' LIMIT 1"
            ) !== null;

            if ($hasSyncIndex) {
                $schema->table('evaluations', function (Blueprint $table) {
                    $table->dropIndex('idx_sync_status');
                });
            }

            $connection->statement('ALTER TABLE evaluations DROP CONSTRAINT IF EXISTS evaluations_sync_status_check');

            $schema->table('evaluations', function (Blueprint $table) use ($columnsToDrop) {
                $table->dropColumn($columnsToDrop);
            });
        }

        $indexExists = static function (string $indexName) use ($connection): bool {
            $result = $connection->selectOne(
                "SELECT 1 FROM pg_indexes WHERE schemaname = current_schema() AND indexname = ? LIMIT 1",
                [$indexName]
            );

            return $result !== null;
        };

        $schema->table('evaluations', function (Blueprint $table) use ($indexExists) {
            if (! $indexExists('evaluations_eval_unique')) {
                $table->unique(['evaluateur_matricule', 'evalue_matricule', 'id_periode', 'type_evaluation'], 'evaluations_eval_unique');
            }

            if (! $indexExists('idx_eval_evalue_periode')) {
                $table->index(['evalue_matricule', 'id_periode'], 'idx_eval_evalue_periode');
            }

            if (! $indexExists('idx_eval_periode')) {
                $table->index('id_periode', 'idx_eval_periode');
            }

            if (! $indexExists('idx_eval_statut')) {
                $table->index('statut', 'idx_eval_statut');
            }

            if (! $indexExists('idx_eval_remplacement')) {
                $table->index('id_remplacement', 'idx_eval_remplacement');
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
            $indexExists('evaluations_eval_unique') ||
            $indexExists('idx_eval_evalue_periode') ||
            $indexExists('idx_eval_periode') ||
            $indexExists('idx_eval_statut') ||
            $indexExists('idx_eval_remplacement')
        ) {
            $schema->table('evaluations', function (Blueprint $table) use ($indexExists) {
                if ($indexExists('evaluations_eval_unique')) {
                    $table->dropUnique('evaluations_eval_unique');
                }

                if ($indexExists('idx_eval_evalue_periode')) {
                    $table->dropIndex('idx_eval_evalue_periode');
                }

                if ($indexExists('idx_eval_periode')) {
                    $table->dropIndex('idx_eval_periode');
                }

                if ($indexExists('idx_eval_statut')) {
                    $table->dropIndex('idx_eval_statut');
                }

                if ($indexExists('idx_eval_remplacement')) {
                    $table->dropIndex('idx_eval_remplacement');
                }
            });
        }

        $columnsToDrop = array_filter([
            'evaluateur_en_remplacement',
            'id_remplacement',
            'periode_code',
            'validateur_matricule',
            'date_validation',
        ], fn (string $column) => $schema->hasColumn('evaluations', $column));

        if (! empty($columnsToDrop)) {
            $schema->table('evaluations', function (Blueprint $table) use ($columnsToDrop) {
                $table->dropColumn($columnsToDrop);
            });
        }

        if ($schema->hasColumn('evaluations', 'date_creation') && ! $schema->hasColumn('evaluations', 'date_evaluation')) {
            $schema->table('evaluations', function (Blueprint $table) {
                $table->renameColumn('date_creation', 'date_evaluation');
            });
        }

        if ($schema->hasColumn('evaluations', 'commentaire_global') && ! $schema->hasColumn('evaluations', 'commentaire_general')) {
            $schema->table('evaluations', function (Blueprint $table) {
                $table->renameColumn('commentaire_global', 'commentaire_general');
            });
        }

        if ($schema->hasColumn('evaluations', 'date_validation') && ! $schema->hasColumn('evaluations', 'date_validation_manager')) {
            $schema->table('evaluations', function (Blueprint $table) {
                $table->renameColumn('date_validation', 'date_validation_manager');
            });
        }

        if ($schema->hasColumn('evaluations', 'notations_json')) {
            $connection->statement('ALTER TABLE evaluations ALTER COLUMN notations_json TYPE json USING notations_json::json');
            $connection->statement('COMMENT ON COLUMN evaluations.notations_json IS NULL');
        }

        $connection->statement('ALTER TABLE evaluations DROP CONSTRAINT IF EXISTS evaluations_statut_check');
        $connection->statement("ALTER TABLE evaluations ALTER COLUMN statut SET DEFAULT 'brouillon'");
        $connection->statement("ALTER TABLE evaluations ADD CONSTRAINT evaluations_statut_check CHECK (statut IN ('brouillon', 'soumis', 'valide', 'rejete'))");

        if (! $schema->hasColumn('evaluations', 'code_periode')) {
            $schema->table('evaluations', function (Blueprint $table) {
                $table->string('code_periode', 20)->nullable()->after('id_periode');
            });
        }

        if (! $schema->hasColumn('evaluations', 'validateur_matricule')) {
            $schema->table('evaluations', function (Blueprint $table) {
                $table->string('validateur_matricule', 5)->nullable()->after('date_soumission');
            });
        }

        if (! $schema->hasColumn('evaluations', 'date_validation_manager')) {
            $schema->table('evaluations', function (Blueprint $table) {
                $table->timestamp('date_validation_manager')->nullable()->after('validateur_matricule');
            });
        }

        $schema->table('evaluations', function (Blueprint $table) use ($schema) {
            if (! $schema->hasColumn('evaluations', 'source_system')) {
                $table->string('source_system', 20)->default('postgres');
            }

            if (! $schema->hasColumn('evaluations', 'sync_date')) {
                $table->timestamp('sync_date')->nullable();
            }

            if (! $schema->hasColumn('evaluations', 'sync_status')) {
                $table->enum('sync_status', ['pending', 'synced', 'error'])->default('pending');
            }
        });

        $connection->statement('ALTER TABLE evaluations DROP CONSTRAINT IF EXISTS evaluations_sync_status_check');
        $connection->statement("ALTER TABLE evaluations ADD CONSTRAINT evaluations_sync_status_check CHECK (sync_status IN ('pending', 'synced', 'error'))");

        if (! $indexExists('idx_sync_status')) {
            $schema->table('evaluations', function (Blueprint $table) {
                $table->index('sync_status', 'idx_sync_status');
            });
        }

        if (! $indexExists('idx_evaluateur_periode')) {
            $schema->table('evaluations', function (Blueprint $table) {
                $table->index(['evaluateur_matricule', 'code_periode'], 'idx_evaluateur_periode');
            });
        }

        $idRegleColumn = $connection->selectOne(
            "SELECT data_type FROM information_schema.columns WHERE table_schema = current_schema() AND table_name = 'evaluations' AND column_name = 'id_regle' LIMIT 1"
        );
        $idRegleType = $idRegleColumn->data_type ?? null;

        if ($idRegleType === 'bigint') {
            $connection->statement('UPDATE evaluations SET id_regle = NULL');

            $schema->table('evaluations', function (Blueprint $table) {
                $table->dropColumn('id_regle');
            });

            $schema->table('evaluations', function (Blueprint $table) {
                $table->uuid('id_regle')->nullable()->after('id_periode');
            });
        }
    }
};
