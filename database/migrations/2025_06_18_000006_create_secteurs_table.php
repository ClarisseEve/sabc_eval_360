<?php

use App\Services\IdGeneratorService;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     * Création de la table secteurs
     */
    public function up(): void
    {
        Schema::create('secteurs', function (Blueprint $table) {
            $table->string('id_secteur', 5)->primary()->comment('Format: SE-XX');
            $table->string('nom_secteur', 100);
            $table->string('id_district', 5)->nullable();
            $table->string('id_service', 5);
            
            // Contraintes de clés étrangères explicites
            $table->foreign('id_district')->references('id_district')->on('districts')->onDelete('set null');
            $table->foreign('id_service')->references('id_service')->on('services_commerciaux')->onDelete('cascade');
            $table->timestamps();
            
            // Index pour optimiser les recherches
            $table->index(['id_district', 'id_service'], 'idx_secteur_district_service');
            $table->unique(['nom_secteur', 'id_service'], 'unq_secteur_nom_service');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('secteurs');
    }
};
