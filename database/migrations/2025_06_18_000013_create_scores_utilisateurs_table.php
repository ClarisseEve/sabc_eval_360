<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     * Création de la table scores_utilisateurs selon le modèle dbdiagram.io
     */
    public function up(): void
    {
        Schema::create('scores_utilisateurs', function (Blueprint $table) {
            $table->string('matricule', 10);
            $table->string('id_periode', 10);
            $table->decimal('score_global', 3, 2)->nullable();
            $table->decimal('score_auto', 3, 2)->nullable();
            $table->decimal('score_pairs', 3, 2)->nullable();
            $table->decimal('score_manager', 3, 2)->nullable();
            $table->integer('nb_evaluations_recues')->default(0);
            $table->integer('nb_evaluations_donnees')->default(0);
            $table->decimal('progression_vs_precedente', 3, 2)->nullable();
            $table->integer('position_equipe')->nullable();
            $table->timestamp('derniere_maj')->default(DB::raw('CURRENT_TIMESTAMP'));
            
            // Index pour optimiser les recherches
            $table->primary(['matricule', 'id_periode']);
            $table->index('score_global', 'idx_score_global');
            $table->index('id_periode', 'idx_scores_periode');
            
            // Contraintes de clés étrangères
            $table->foreign('matricule')->references('matricule')->on('utilisateurs')->onDelete('cascade');
            $table->foreign('id_periode')->references('id_periode')->on('periodes_evaluation');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('scores_utilisateurs');
    }
};
