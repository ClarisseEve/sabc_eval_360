<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        $schema = Schema::connection('pgsql');

        if (! $schema->hasColumn('periodes_evaluation', 'titre')) {
            $schema->table('periodes_evaluation', function (Blueprint $table) {
                $table->string('titre', 100)->nullable();
            });

            DB::connection('pgsql')->table('periodes_evaluation')->update([
                'titre' => DB::raw("COALESCE(nom_periode, code_periode)")
            ]);
        }

        if (! $schema->hasColumn('periodes_evaluation', 'description')) {
            $schema->table('periodes_evaluation', function (Blueprint $table) {
                $table->text('description')->nullable();
            });
        }

        if (! $schema->hasColumn('periodes_evaluation', 'statut')) {
            $schema->table('periodes_evaluation', function (Blueprint $table) {
                $table->enum('statut', ['planifiee', 'ouverte', 'fermee', 'archivee'])->default('planifiee');
            });

            DB::connection('pgsql')->statement(<<<'SQL'
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'periodes_evaluation_statut_check'
          AND conrelid = 'periodes_evaluation'::regclass
    ) THEN
        ALTER TABLE periodes_evaluation
        ADD CONSTRAINT periodes_evaluation_statut_check
        CHECK (statut IN ('planifiee', 'ouverte', 'fermee', 'archivee'));
    END IF;
END
$$;
SQL);
        }

        if (! $schema->hasColumn('periodes_evaluation', 'id_regle')) {
            $schema->table('periodes_evaluation', function (Blueprint $table) {
                $table->unsignedBigInteger('id_regle')->nullable();
            });

            $schema->table('periodes_evaluation', function (Blueprint $table) {
                $table->foreign('id_regle')
                    ->references('id_regle')
                    ->on('regles_evaluation')
                    ->nullOnDelete();
            });
        }


        if (! $schema->hasColumn('periodes_evaluation', 'parametres_json')) {
            $schema->table('periodes_evaluation', function (Blueprint $table) {
                $table->json('parametres_json')->nullable();
            });
        }

        if (! DB::connection('pgsql')->selectOne("SELECT 1 FROM pg_indexes WHERE schemaname = current_schema() AND indexname = 'idx_statut_debut'")) {
            $schema->table('periodes_evaluation', function (Blueprint $table) {
                $table->index(['statut', 'date_debut'], 'idx_statut_debut');
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        $schema = Schema::connection('pgsql');

        if ($schema->hasColumn('periodes_evaluation', 'parametres_json')) {
            $schema->table('periodes_evaluation', function (Blueprint $table) {
                $table->dropColumn('parametres_json');
            });
        }

        if ($schema->hasColumn('periodes_evaluation', 'id_regle')) {
            $schema->table('periodes_evaluation', function (Blueprint $table) {
                $table->dropForeign(['id_regle']);
                $table->dropColumn('id_regle');
            });
        }


        if (DB::connection('pgsql')->selectOne("SELECT 1 FROM pg_indexes WHERE schemaname = current_schema() AND indexname = 'idx_statut_debut'")) {
            $schema->table('periodes_evaluation', function (Blueprint $table) {
                $table->dropIndex('idx_statut_debut');
            });
        }

        if ($schema->hasColumn('periodes_evaluation', 'statut')) {
            $schema->table('periodes_evaluation', function (Blueprint $table) {
                $table->dropColumn('statut');
            });
        }

        if ($schema->hasColumn('periodes_evaluation', 'description')) {
            $schema->table('periodes_evaluation', function (Blueprint $table) {
                $table->dropColumn('description');
            });
        }

        if ($schema->hasColumn('periodes_evaluation', 'titre')) {
            $schema->table('periodes_evaluation', function (Blueprint $table) {
                $table->dropColumn('titre');
            });
        }
    }
};
