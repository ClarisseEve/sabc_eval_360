<?php

use App\Services\IdGeneratorService;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     * Création de la table districts
     */
    public function up(): void
    {
        Schema::create('districts', function (Blueprint $table) {
            $table->string('id_district', 5)->primary()->comment('Format: DI-XX');
            $table->string('nom_district', 100);
            $table->string('id_service', 5);
            
            // Contrainte de clé étrangère explicite
            $table->foreign('id_service')->references('id_service')->on('services_commerciaux')->onDelete('cascade');
            $table->timestamps();
            
            // Index pour optimiser les recherches
            $table->index('id_service', 'idx_district_service');
            $table->unique(['nom_district', 'id_service'], 'unq_district_nom_service');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('districts');
    }
};
