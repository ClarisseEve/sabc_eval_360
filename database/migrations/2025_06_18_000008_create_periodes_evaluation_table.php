<?php

use App\Services\IdGeneratorService;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     * Création de la table periodes_evaluation selon le modèle dbdiagram.io
     */
    public function up(): void
    {
        Schema::create('periodes_evaluation', function (Blueprint $table) {
            $table->string('id_periode', 5)->primary()->comment('Format: PE-XX');
            $table->string('code_periode', 7)->unique()->comment('2025-S1, 2025-S2');
            $table->string('nom_periode', 50);
            $table->date('date_debut');
            $table->date('date_fin');
            $table->boolean('est_ouverte')->default(false);
            $table->timestamps();
            
            // Index pour optimiser les recherches
            $table->index('est_ouverte', 'idx_periode_ouverte');
            $table->index(['date_debut', 'date_fin'], 'idx_periode_dates');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('periodes_evaluation');
    }
};
