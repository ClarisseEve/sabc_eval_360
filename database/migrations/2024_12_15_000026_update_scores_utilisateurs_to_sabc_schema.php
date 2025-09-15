<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations - Mise à jour scores_utilisateurs selon règles SABC
     */
    public function up(): void
    {
        Schema::connection('pgsql')->table('scores_utilisateurs', function (Blueprint $table) {
            // Ajout champs manquants selon règles métier SABC
            $table->string('periode_evaluation', 20)->nullable()->after('id_periode');
            $table->decimal('score_auto_evaluation', 5, 2)->nullable()->after('score_auto');
            $table->integer('nb_auto_evaluations')->default(0)->after('nb_evaluations_donnees');
            
            // Détail par critères selon règles SABC
            $table->json('scores_par_critere')->nullable()->after('nb_auto_evaluations');
            $table->json('evolution_par_critere')->nullable()->after('scores_par_critere');
            
            // Statut calcul selon workflow SABC
            $table->enum('statut_calcul', ['en_cours', 'complete', 'partielle'])->default('en_cours')->after('evolution_par_critere');
            $table->timestamp('date_calcul')->nullable()->after('statut_calcul');
            
            // Normalisation régionale selon règles SABC
            $table->string('id_region', 5)->nullable()->after('date_calcul');
            $table->decimal('score_normalise_region', 5, 2)->nullable()->after('id_region');
            $table->decimal('percentile_region', 5, 2)->nullable()->after('score_normalise_region');
            $table->decimal('score_precedent', 5, 2)->nullable()->after('percentile_region');
            
            // Renommage colonne pour cohérence SABC
            $table->renameColumn('derniere_maj', 'derniere_mise_a_jour');
            
            // Index pour performance selon règles SABC
            $table->index(['periode_evaluation'], 'idx_scores_periode_eval');
            $table->index(['score_global'], 'idx_scores_global_sabc');
            $table->index(['id_region', 'score_global'], 'idx_scores_region_sabc');
            $table->index(['statut_calcul'], 'idx_scores_statut_sabc');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::connection('pgsql')->table('scores_utilisateurs', function (Blueprint $table) {
            $table->dropIndex('idx_scores_periode_eval');
            $table->dropIndex('idx_scores_global_sabc');
            $table->dropIndex('idx_scores_region_sabc');
            $table->dropIndex('idx_scores_statut_sabc');
            
            $table->renameColumn('derniere_mise_a_jour', 'derniere_maj');
            
            $table->dropColumn([
                'periode_evaluation',
                'score_auto_evaluation',
                'nb_auto_evaluations',
                'scores_par_critere',
                'evolution_par_critere',
                'statut_calcul',
                'date_calcul',
                'id_region',
                'score_normalise_region',
                'percentile_region',
                'score_precedent'
            ]);
        });
    }
};
