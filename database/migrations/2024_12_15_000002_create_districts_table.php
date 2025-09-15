<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('districts', function (Blueprint $table) {
            $table->string('id_district', 10)->primary();
            $table->string('nom_district', 100);
            $table->string('id_service', 10);
            $table->text('description')->nullable();
            $table->boolean('est_actif')->default(true);
            $table->timestamps();

            // Foreign key vers services_commerciaux
            $table->foreign('id_service')->references('id_service')->on('services_commerciaux')->onDelete('cascade');
            
            // Index pour optimiser les requêtes
            $table->index(['id_service', 'est_actif']);
            $table->index('nom_district');
            
            // Contrainte d'unicité par service
            $table->unique(['nom_district', 'id_service']);
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
