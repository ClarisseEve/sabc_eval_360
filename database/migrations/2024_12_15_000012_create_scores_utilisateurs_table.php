<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     * Création de la table scores_utilisateurs selon le schéma SABC final
     */
    public function up(): void
    {
        Schema::connection('pgsql')->create('scores_utilisateurs', function (Blueprint $table) {
            // Clé primaire composite selon schéma SABC
            $table->string('matricule', 20);
            $table->unsignedBigInteger('id_periode');
            
            // Scores selon les règles SABC d'évaluation 360°
            $table->decimal('score_global', 3, 2)->nullable();
            $table->decimal('score_auto', 3, 2)->nullable();
            $table->decimal('score_pairs', 3, 2)->nullable();
            $table->decimal('score_manager', 3, 2)->nullable();
            
            // Métriques d'activité
            $table->integer('nb_evaluations_recues')->default(0);
            $table->integer('nb_evaluations_donnees')->default(0);
            
            // Analytics de progression
            $table->decimal('progression_vs_precedente', 3, 2)->nullable();
            $table->integer('position_equipe')->nullable();
            
            // Métadonnées
            $table->timestamp('derniere_maj')->useCurrent();
            
            // Clé primaire composite
            $table->primary(['matricule', 'id_periode']);
            
            // Index selon schéma SABC
            $table->index('score_global', 'idx_score_global');
            $table->index('id_periode', 'idx_scores_periode');
            
            // Références vers les autres tables
            $table->foreign('matricule')->references('matricule')->on('utilisateurs');
            $table->foreign('id_periode')->references('id_periode')->on('periodes_evaluation');
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
