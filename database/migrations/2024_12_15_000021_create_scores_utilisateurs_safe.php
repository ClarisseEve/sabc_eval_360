<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations - Table scores_utilisateurs selon règles SABC
     */
    public function up(): void
    {
        if (Schema::connection('pgsql')->hasTable('scores_utilisateurs')) {
            return;
        }

        Schema::connection('pgsql')->create('scores_utilisateurs', function (Blueprint $table) {
            // Clé composite selon règles métier SABC
            $table->string('matricule', 5);
            $table->string('periode_evaluation', 20);
            $table->primary(['matricule', 'periode_evaluation']);
            
            // Scores selon pondération SABC (20% auto, 40% pairs, 40% manager)
            $table->decimal('score_global', 5, 2)->default(0);
            $table->decimal('score_auto_evaluation', 5, 2)->nullable();
            $table->decimal('score_pairs', 5, 2)->nullable();
            $table->decimal('score_manager', 5, 2)->nullable();
            
            // Évolution performance selon règles SABC
            $table->decimal('progression_vs_precedente', 5, 2)->nullable();
            $table->decimal('score_precedent', 5, 2)->nullable();
            
            // Métriques évaluations selon règles SABC
            $table->integer('nb_evaluations_recues')->default(0);
            $table->integer('nb_evaluations_donnees')->default(0);
            $table->integer('nb_auto_evaluations')->default(0);
            
            // Détail par critères selon règles SABC
            $table->json('scores_par_critere')->nullable();
            $table->json('evolution_par_critere')->nullable();
            
            // Statut et validation selon workflow SABC
            $table->enum('statut_calcul', ['en_cours', 'complete', 'partielle'])->default('en_cours');
            $table->timestamp('derniere_mise_a_jour')->nullable();
            $table->timestamp('date_calcul')->nullable();
            
            // Normalisation régionale selon règles SABC
            $table->string('id_region', 5)->nullable();
            $table->decimal('score_normalise_region', 5, 2)->nullable();
            $table->decimal('percentile_region', 5, 2)->nullable();
            
            // Timestamps
            $table->timestamps();
            
            // Index pour performance selon règles SABC
            $table->index(['matricule'], 'idx_scores_matricule');
            $table->index(['periode_evaluation'], 'idx_scores_periode');
            $table->index(['score_global'], 'idx_scores_global');
            $table->index(['id_region', 'score_global'], 'idx_scores_region');
            $table->index(['statut_calcul'], 'idx_scores_statut');
            $table->index(['derniere_mise_a_jour'], 'idx_scores_maj');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::connection('pgsql')->dropIfExists('scores_utilisateurs');
    }
};
