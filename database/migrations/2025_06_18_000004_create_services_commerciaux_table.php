<?php

use App\Services\IdGeneratorService;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     * Création de la table services_commerciaux
     */
    public function up(): void
    {
        Schema::create('services_commerciaux', function (Blueprint $table) {
            $table->string('id_service', 5)->primary()->comment('Format: SC-XX');
            $table->string('nom_service', 100);
            $table->string('id_region', 5);
            
            // Contrainte de clé étrangère explicite
            $table->foreign('id_region')->references('id_region')->on('regions')->onDelete('cascade');
            $table->timestamps();
            
            // Index pour optimiser les recherches
            $table->index('id_region', 'idx_service_region');
            $table->unique(['nom_service', 'id_region'], 'unq_service_nom_region');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('services_commerciaux');
    }
};
