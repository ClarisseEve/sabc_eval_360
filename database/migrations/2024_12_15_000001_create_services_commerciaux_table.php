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
        Schema::create('services_commerciaux', function (Blueprint $table) {
            $table->string('id_service', 10)->primary();
            $table->string('nom_service', 100)->unique();
            $table->string('id_region', 10);
            $table->text('description')->nullable();
            $table->boolean('est_actif')->default(true);
            $table->timestamps();

            // Foreign key vers regions
            $table->foreign('id_region')->references('id_region')->on('regions')->onDelete('cascade');
            
            // Index pour optimiser les requêtes
            $table->index(['id_region', 'est_actif']);
            $table->index('nom_service');
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
