<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     * Mise à jour de la table periodes_evaluation selon le schéma SABC final
     */
    public function up(): void
    {
        $connection = DB::connection('pgsql');
        $schema = Schema::connection('pgsql');

        $connection->statement('ALTER TABLE periodes_evaluation DROP CONSTRAINT IF EXISTS periodes_evaluation_id_regle_foreign');

        $idPeriodeColumn = $connection->selectOne(
            "SELECT data_type FROM information_schema.columns WHERE table_schema = current_schema() AND table_name = 'periodes_evaluation' AND column_name = 'id_periode' LIMIT 1"
        );
        $idPeriodeType = $idPeriodeColumn->data_type ?? null;

        if ($idPeriodeType === null) {
            $schema->table('periodes_evaluation', function (Blueprint $table) {
                $table->id('id_periode')->first();
            });
        } elseif ($idPeriodeType !== 'bigint') {
            $schema->table('periodes_evaluation', function (Blueprint $table) {
                $table->dropPrimary();
            });

            $schema->table('periodes_evaluation', function (Blueprint $table) {
                $table->dropColumn('id_periode');
            });

            $schema->table('periodes_evaluation', function (Blueprint $table) {
                $table->id('id_periode')->first();
            });
        }

        $indexExists = static function (string $indexName) use ($connection): bool {
            $result = $connection->selectOne(
                "SELECT 1 FROM pg_indexes WHERE schemaname = current_schema() AND indexname = ? LIMIT 1",
                [$indexName]
            );

            return $result !== null;
        };

        if ($schema->hasColumn('periodes_evaluation', 'titre') && ! $schema->hasColumn('periodes_evaluation', 'nom_periode')) {
            $schema->table('periodes_evaluation', function (Blueprint $table) {
                $table->renameColumn('titre', 'nom_periode');
            });
        }

        if ($schema->hasColumn('periodes_evaluation', 'nom_periode')) {
            $schema->table('periodes_evaluation', function (Blueprint $table) {
                $table->string('nom_periode', 50)->change();
            });
        }

        if (! $schema->hasColumn('periodes_evaluation', 'code_periode')) {
            $schema->table('periodes_evaluation', function (Blueprint $table) {
                $table->string('code_periode', 7)->nullable()->after('id_periode')->comment('2025-S1, 2025-S2');
            });
        }

        if ($schema->hasColumn('periodes_evaluation', 'code_periode')) {
            $connection->statement(
                "WITH ordered AS (
                    SELECT id_periode, ROW_NUMBER() OVER (ORDER BY COALESCE(date_debut, NOW()), id_periode) AS rn
                    FROM periodes_evaluation
                )
                UPDATE periodes_evaluation pe
                SET code_periode = 'L' || LPAD(ordered.rn::text, 6, '0')
                FROM ordered
                WHERE pe.id_periode = ordered.id_periode AND pe.code_periode IS NULL"
            );

            $schema->table('periodes_evaluation', function (Blueprint $table) {
                $table->string('code_periode', 7)->nullable(false)->comment('2025-S1, 2025-S2')->change();
            });
        }

        if ($indexExists('idx_statut_debut')) {
            $schema->table('periodes_evaluation', function (Blueprint $table) {
                $table->dropIndex('idx_statut_debut');
            });
        }

        if ($indexExists('idx_regle')) {
            $schema->table('periodes_evaluation', function (Blueprint $table) {
                $table->dropIndex('idx_regle');
            });
        }

        $connection->statement('ALTER TABLE periodes_evaluation DROP CONSTRAINT IF EXISTS periodes_evaluation_statut_check');

        $columnsToDrop = array_filter([
            'description',
            'statut',
            'id_regle',
            'parametres_json',
        ], fn (string $column) => $schema->hasColumn('periodes_evaluation', $column));

        if (! empty($columnsToDrop)) {
            $schema->table('periodes_evaluation', function (Blueprint $table) use ($columnsToDrop) {
                $table->dropColumn($columnsToDrop);
            });
        }

        if ($schema->hasColumn('periodes_evaluation', 'est_ouverte')) {
            $schema->table('periodes_evaluation', function (Blueprint $table) {
                $table->boolean('est_ouverte')->default(false)->change();
            });
        } else {
            $schema->table('periodes_evaluation', function (Blueprint $table) {
                $table->boolean('est_ouverte')->default(false)->after('date_fin');
            });
        }

        $schema->table('periodes_evaluation', function (Blueprint $table) use ($indexExists) {
            if (! $indexExists('idx_code_periode_unique')) {
                $table->unique('code_periode', 'idx_code_periode_unique');
            }

            if (! $indexExists('idx_periode_ouverte')) {
                $table->index('est_ouverte', 'idx_periode_ouverte');
            }

            if (! $indexExists('idx_periode_dates')) {
                $table->index(['date_debut', 'date_fin'], 'idx_periode_dates');
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
            $indexExists('idx_code_periode_unique') ||
            $indexExists('idx_periode_ouverte') ||
            $indexExists('idx_periode_dates')
        ) {
            $schema->table('periodes_evaluation', function (Blueprint $table) use ($indexExists) {
                if ($indexExists('idx_code_periode_unique')) {
                    $table->dropUnique('idx_code_periode_unique');
                }

                if ($indexExists('idx_periode_ouverte')) {
                    $table->dropIndex('idx_periode_ouverte');
                }

                if ($indexExists('idx_periode_dates')) {
                    $table->dropIndex('idx_periode_dates');
                }
            });
        }

        if ($schema->hasColumn('periodes_evaluation', 'code_periode')) {
            $schema->table('periodes_evaluation', function (Blueprint $table) {
                $table->dropColumn('code_periode');
            });
        }

        if ($schema->hasColumn('periodes_evaluation', 'nom_periode') && ! $schema->hasColumn('periodes_evaluation', 'titre')) {
            $schema->table('periodes_evaluation', function (Blueprint $table) {
                $table->renameColumn('nom_periode', 'titre');
            });
        }

        $schema->table('periodes_evaluation', function (Blueprint $table) use ($schema) {
            if (! $schema->hasColumn('periodes_evaluation', 'description')) {
                $table->text('description')->nullable();
            }

            if (! $schema->hasColumn('periodes_evaluation', 'statut')) {
                $table->enum('statut', ['planifiee', 'ouverte', 'fermee', 'archivee'])->default('planifiee');
            }

            if (! $schema->hasColumn('periodes_evaluation', 'id_regle')) {
                $table->unsignedBigInteger('id_regle')->nullable();
            }

            if (! $schema->hasColumn('periodes_evaluation', 'parametres_json')) {
                $table->json('parametres_json')->nullable();
            }
        });

        $connection->statement('ALTER TABLE periodes_evaluation DROP CONSTRAINT IF EXISTS periodes_evaluation_statut_check');
        $connection->statement(
            "ALTER TABLE periodes_evaluation ADD CONSTRAINT periodes_evaluation_statut_check CHECK (statut IN ('planifiee', 'ouverte', 'fermee', 'archivee'))"
        );

        if (! $indexExists('idx_statut_debut')) {
            $schema->table('periodes_evaluation', function (Blueprint $table) {
                $table->index(['statut', 'date_debut'], 'idx_statut_debut');
            });
        }

        if (! $indexExists('idx_regle')) {
            $schema->table('periodes_evaluation', function (Blueprint $table) {
                $table->index('id_regle', 'idx_regle');
            });
        }

        $connection->statement('ALTER TABLE periodes_evaluation DROP CONSTRAINT IF EXISTS periodes_evaluation_id_regle_foreign');
        $connection->statement(
            'ALTER TABLE periodes_evaluation ADD CONSTRAINT periodes_evaluation_id_regle_foreign FOREIGN KEY (id_regle) REFERENCES regles_evaluation(id_regle) ON DELETE SET NULL'
        );
    }
};
