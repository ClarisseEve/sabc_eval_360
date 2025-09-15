<?php

use App\Services\IdGeneratorService;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     * Création de la table evaluations selon le modèle dbdiagram.io
     */
    public function up(): void
    {
        Schema::create('evaluations', function (Blueprint $table) {
            $table->string('id_evaluation', 8)->primary()->comment('Format: EV-PP-XX où PP est le code de période');
            $table->string('evaluateur_matricule', 5);
            $table->string('evalue_matricule', 5);
            $table->string('type_evaluation', 20);
            $table->string('id_periode', 5);
            $table->string('periode_code', 7);
            $table->string('id_regle', 5);
            
            // Contraintes pour les clés étrangères string
            $table->foreign('id_periode')->references('id_periode')->on('periodes_evaluation');
            $table->foreign('id_regle')->references('id_regle')->on('regles_evaluation');
            
            // CONTEXTE REMPLACEMENT
            $table->boolean('evaluateur_en_remplacement')->default(false)->comment('true si évaluateur remplace quelqu\'un');
            $table->string('id_remplacement', 5)->nullable()->comment('Lien vers remplacement si applicable');
            
            $table->text('notations_json')->comment('JSON: {critere_nom: {note: 1-5, commentaire: ""}, ...}');
            $table->decimal('note_globale', 3, 2)->nullable();
            $table->text('commentaire_global')->nullable();
            $table->string('statut', 20)->default('brouillon')->comment('brouillon, soumis, valide');
            
            $table->timestamp('date_creation')->default(DB::raw('CURRENT_TIMESTAMP'));
            $table->timestamp('date_soumission')->nullable();
            $table->timestamp('date_validation')->nullable();
            $table->string('validateur_matricule', 5)->nullable();
            
            // Index pour optimiser les recherches
            $table->unique(['evaluateur_matricule', 'evalue_matricule', 'id_periode', 'type_evaluation'], 'unq_evaluation_complete');
            $table->index(['evalue_matricule', 'id_periode'], 'idx_eval_evalue_periode');
            $table->index('id_periode', 'idx_eval_periode');
            $table->index('statut', 'idx_eval_statut');
            $table->index('id_remplacement', 'idx_eval_remplacement');
            
            // Contraintes de clés étrangères
            $table->foreign('evaluateur_matricule')->references('matricule')->on('utilisateurs');
            $table->foreign('evalue_matricule')->references('matricule')->on('utilisateurs');
            $table->foreign('validateur_matricule')->references('matricule')->on('utilisateurs');
            $table->foreign('id_remplacement')->references('id_remplacement')->on('remplacements_temporaires')->onDelete('set null');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('evaluations');
    }
};
