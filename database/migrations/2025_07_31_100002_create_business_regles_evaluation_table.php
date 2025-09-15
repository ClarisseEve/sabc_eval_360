<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     * Création de la table regles_evaluation dans PostgreSQL (Business Database)
     */
    public function up(): void
    {
        Schema::connection('pgsql')->create('regles_evaluation', function (Blueprint $table) {
            $table->uuid('id_regle')->primary();
            $table->string('nom_regle', 100);
            $table->text('description')->nullable();
            $table->json('criteres_evaluation_json');
            $table->boolean('est_active')->default(true);
            $table->date('date_debut');
            $table->date('date_fin')->nullable();
            $table->json('parametres_json')->nullable();
            
            $table->timestamps();
            
            // Index pour optimiser les requêtes
            $table->index(['est_active', 'date_debut'], 'idx_active_debut');
            $table->index(['nom_regle'], 'idx_nom_regle');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::connection('pgsql')->dropIfExists('regles_evaluation');
    }
};
