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
        Schema::create('secteurs', function (Blueprint $table) {
            $table->string('id_secteur', 10)->primary();
            $table->string('nom_secteur', 100);
            $table->string('id_service', 10);
            $table->string('id_district', 10)->nullable(); // Nullable pour régions non-tanières
            $table->text('description')->nullable();
            $table->boolean('est_actif')->default(true);
            $table->timestamps();

            // Foreign keys
            $table->foreign('id_service')->references('id_service')->on('services_commerciaux')->onDelete('cascade');
            $table->foreign('id_district')->references('id_district')->on('districts')->onDelete('set null');
            
            // Index pour optimiser les requêtes selon règles SABC
            $table->index(['id_service', 'est_actif']);
            $table->index(['id_district', 'est_actif']);
            $table->index('nom_secteur');
            
            // Contrainte d'unicité par service (règles métier SABC)
            $table->unique(['nom_secteur', 'id_service']);
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
