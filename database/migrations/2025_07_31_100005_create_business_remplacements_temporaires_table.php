<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     * Création de la table remplacements_temporaires dans PostgreSQL (Business Database)
     */
    public function up(): void
    {
        Schema::connection('pgsql')->create('remplacements_temporaires', function (Blueprint $table) {
            $table->uuid('id_remplacement')->primary();
            $table->string('utilisateur_remplace_matricule', 10);
            $table->string('utilisateur_remplacant_matricule', 10);
            $table->date('date_debut');
            $table->date('date_fin');
            $table->string('motif', 100);
            $table->text('description')->nullable();
            $table->enum('statut', ['planifie', 'actif', 'termine', 'annule'])->default('planifie');
            $table->string('approuve_par_matricule', 10)->nullable();
            $table->timestamp('date_approbation')->nullable();
            $table->json('permissions_temporaires_json')->nullable();
            
            $table->timestamps();
            
            // Index pour optimiser les requêtes
            $table->index(['utilisateur_remplace_matricule', 'statut'], 'idx_remplace_statut');
            $table->index(['utilisateur_remplacant_matricule', 'statut'], 'idx_remplacant_statut');
            $table->index(['date_debut', 'date_fin'], 'idx_dates_remplacement');
            $table->index(['statut', 'date_debut'], 'idx_statut_debut_remplacement');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::connection('pgsql')->dropIfExists('remplacements_temporaires');
    }
};
