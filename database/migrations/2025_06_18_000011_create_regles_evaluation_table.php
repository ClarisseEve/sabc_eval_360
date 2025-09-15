<?php

use App\Services\IdGeneratorService;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     * Création de la table regles_evaluation selon le modèle dbdiagram.io
     */
    public function up(): void
    {
        Schema::create('regles_evaluation', function (Blueprint $table) {
            $table->string('id_regle', 5)->primary()->comment('Format: RE-XX');
            $table->string('role_evaluateur', 50);
            $table->string('role_evalue', 50);
            $table->string('type_evaluation', 20)->comment('auto, pairs, descendante');
            $table->text('criteres_evaluation_json')->comment('JSON: [{nom, description, poids, ordre}, ...] min 5 critères');
            $table->boolean('meme_region_obligatoire')->default(true);
            $table->boolean('meme_branche_obligatoire')->default(true)->comment('Sauf cross_branch DR/CDTT');
            $table->boolean('est_active')->default(true);
            $table->timestamps();
            
            // Index pour optimiser les recherches
            $table->unique(['role_evaluateur', 'role_evalue', 'type_evaluation'], 'idx_regle_unique');
            $table->index('est_active', 'idx_regles_actives');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('regles_evaluation');
    }
};
