<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     * Mise à jour de la table regles_evaluation selon le schéma SABC final
     */
    public function up(): void
    {
        $connection = DB::connection('pgsql');
        $schema = Schema::connection('pgsql');

        $connection->statement('ALTER TABLE periodes_evaluation DROP CONSTRAINT IF EXISTS periodes_evaluation_id_regle_foreign');

        $idRegleColumn = $connection->selectOne(
            "SELECT data_type FROM information_schema.columns WHERE table_schema = current_schema() AND table_name = 'regles_evaluation' AND column_name = 'id_regle' LIMIT 1"
        );
        $idRegleType = $idRegleColumn->data_type ?? null;

        $periodesIdRegleColumn = $connection->selectOne(
            "SELECT data_type FROM information_schema.columns WHERE table_schema = current_schema() AND table_name = 'periodes_evaluation' AND column_name = 'id_regle' LIMIT 1"
        );
        $periodesIdRegleType = $periodesIdRegleColumn->data_type ?? null;

        if ($idRegleType === null) {
            $schema->table('regles_evaluation', function (Blueprint $table) {
                $table->id('id_regle')->first();
            });
        } elseif ($idRegleType !== 'bigint') {
            $schema->table('regles_evaluation', function (Blueprint $table) {
                $table->dropPrimary();
            });

            $schema->table('regles_evaluation', function (Blueprint $table) {
                $table->dropColumn('id_regle');
            });

            $schema->table('regles_evaluation', function (Blueprint $table) {
                $table->id('id_regle')->first();
            });
        }

        if ($periodesIdRegleType !== null && $periodesIdRegleType !== 'bigint') {
            $hasPeriodeIndex = $connection->selectOne(
                "SELECT 1 FROM pg_indexes WHERE schemaname = current_schema() AND indexname = 'idx_regle' LIMIT 1"
            ) !== null;

            if ($hasPeriodeIndex) {
                $schema->table('periodes_evaluation', function (Blueprint $table) {
                    $table->dropIndex('idx_regle');
                });
            }

            $connection->statement('UPDATE periodes_evaluation SET id_regle = NULL');

            $schema->table('periodes_evaluation', function (Blueprint $table) {
                $table->dropColumn('id_regle');
            });

            $schema->table('periodes_evaluation', function (Blueprint $table) {
                $table->unsignedBigInteger('id_regle')->nullable();
            });

            $schema->table('periodes_evaluation', function (Blueprint $table) {
                $table->index('id_regle', 'idx_regle');
            });

            $periodesIdRegleType = 'bigint';
        }

        $schema->table('regles_evaluation', function (Blueprint $table) use ($schema) {
            // Champs manquants selon la modélisation SABC
            if (! $schema->hasColumn('regles_evaluation', 'role_evaluateur')) {
                $table->string('role_evaluateur', 50)->nullable()->after('description');
            }

            if (! $schema->hasColumn('regles_evaluation', 'role_evalue')) {
                $table->string('role_evalue', 50)->nullable()->after('role_evaluateur');
            }

            if (! $schema->hasColumn('regles_evaluation', 'type_evaluation')) {
                $table->string('type_evaluation', 20)->nullable()->after('role_evalue')->comment('auto, pairs, descendante');
            }

            // Contraintes géographiques et organisationnelles
            if (! $schema->hasColumn('regles_evaluation', 'meme_region_obligatoire')) {
                $table->boolean('meme_region_obligatoire')->default(true)->after('criteres_evaluation_json');
            }

            if (! $schema->hasColumn('regles_evaluation', 'meme_branche_obligatoire')) {
                $table->boolean('meme_branche_obligatoire')->default(true)->after('meme_region_obligatoire')->comment('Sauf cross_branch DR/CDTT');
            }

            // Ajuster les colonnes existantes
            if ($schema->hasColumn('regles_evaluation', 'criteres_evaluation_json')) {
                $table->text('criteres_evaluation_json')->comment('JSON: [{nom, description, poids, ordre}, ...] min 5 critères')->change();
            }
        });

        $columnsToDrop = array_filter([
            'date_debut',
            'date_fin',
            'parametres_json',
        ], fn (string $column) => $schema->hasColumn('regles_evaluation', $column));

        if (! empty($columnsToDrop)) {
            $schema->table('regles_evaluation', function (Blueprint $table) use ($columnsToDrop) {
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

        $schema->table('regles_evaluation', function (Blueprint $table) use ($indexExists) {
            // Index selon schéma SABC
            if (! $indexExists('idx_regle_unique')) {
                $table->unique(['role_evaluateur', 'role_evalue', 'type_evaluation'], 'idx_regle_unique');
            }

            if (! $indexExists('idx_regles_actives')) {
                $table->index('est_active', 'idx_regles_actives');
            }
        });

        $schema->table('periodes_evaluation', function (Blueprint $table) {
            $table->foreign('id_regle')
                ->references('id_regle')
                ->on('regles_evaluation')
                ->nullOnDelete();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        $connection = DB::connection('pgsql');
        $schema = Schema::connection('pgsql');

        $connection->statement('ALTER TABLE periodes_evaluation DROP CONSTRAINT IF EXISTS periodes_evaluation_id_regle_foreign');

        $hasUnique = $connection->selectOne(
            "SELECT 1 FROM pg_indexes WHERE schemaname = current_schema() AND indexname = 'idx_regle_unique' LIMIT 1"
        ) !== null;
        $hasIndex = $connection->selectOne(
            "SELECT 1 FROM pg_indexes WHERE schemaname = current_schema() AND indexname = 'idx_regles_actives' LIMIT 1"
        ) !== null;

        if ($hasUnique || $hasIndex) {
            $schema->table('regles_evaluation', function (Blueprint $table) use ($hasUnique, $hasIndex) {
                // Supprimer les index ajoutés lors de la migration
                if ($hasUnique) {
                    $table->dropUnique('idx_regle_unique');
                }

                if ($hasIndex) {
                    $table->dropIndex('idx_regles_actives');
                }
            });
        }

        $columnsToDrop = array_filter([
            'role_evaluateur',
            'role_evalue',
            'type_evaluation',
            'meme_region_obligatoire',
            'meme_branche_obligatoire',
        ], fn (string $column) => $schema->hasColumn('regles_evaluation', $column));

        if (! empty($columnsToDrop)) {
            $schema->table('regles_evaluation', function (Blueprint $table) use ($columnsToDrop) {
                $table->dropColumn($columnsToDrop);
            });
        }

        $schema->table('regles_evaluation', function (Blueprint $table) use ($schema) {
            if (! $schema->hasColumn('regles_evaluation', 'date_debut')) {
                $table->date('date_debut')->nullable();
            }

            if (! $schema->hasColumn('regles_evaluation', 'date_fin')) {
                $table->date('date_fin')->nullable();
            }

            if (! $schema->hasColumn('regles_evaluation', 'parametres_json')) {
                $table->json('parametres_json')->nullable();
            }
        });

        $connection->statement('ALTER TABLE periodes_evaluation ADD CONSTRAINT periodes_evaluation_id_regle_foreign FOREIGN KEY (id_regle) REFERENCES regles_evaluation(id_regle) ON DELETE SET NULL');
    }
};
