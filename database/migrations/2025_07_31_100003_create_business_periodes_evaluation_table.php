<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     * Création de la table periodes_evaluation dans PostgreSQL (Business Database)
     */
    public function up(): void
    {
        Schema::connection('pgsql')->create('periodes_evaluation', function (Blueprint $table) {
            $table->uuid('id_periode')->primary();
            $table->string('titre', 100);
            $table->text('description')->nullable();
            $table->date('date_debut');
            $table->date('date_fin');
            $table->enum('statut', ['planifiee', 'ouverte', 'fermee', 'archivee'])->default('planifiee');
            $table->uuid('id_regle')->nullable();
            $table->json('parametres_json')->nullable();
            
            $table->timestamps();
            
            // Index pour optimiser les requêtes
            $table->index(['statut', 'date_debut'], 'idx_statut_debut');
            $table->index(['date_debut', 'date_fin'], 'idx_dates');
            $table->index(['id_regle'], 'idx_regle');
            
            // Contrainte de clé étrangère vers regles_evaluation
            $table->foreign('id_regle')->references('id_regle')->on('regles_evaluation')->onDelete('set null');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::connection('pgsql')->dropIfExists('periodes_evaluation');
    }
};
