<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     * Création de la table evaluations dans PostgreSQL (Business Database)
     */
    public function up(): void
    {
        if (!Schema::connection('pgsql')->hasTable('evaluations')) {
            Schema::connection('pgsql')->create('evaluations', function (Blueprint $table) {
            $table->uuid('id_evaluation')->primary();
            $table->string('evaluateur_matricule', 10);
            $table->string('evalue_matricule', 10);
            $table->uuid('id_periode')->nullable();
            $table->uuid('id_regle')->nullable();
            $table->date('date_evaluation');
            $table->timestamp('date_soumission')->nullable();
            $table->enum('statut', ['brouillon', 'soumis', 'valide', 'rejete'])->default('brouillon');
            $table->json('notations_json')->nullable();
            $table->text('commentaire_general')->nullable();
            $table->decimal('note_globale', 3, 2)->nullable();
            $table->string('type_evaluation', 50)->default('360');
            
            // Métadonnées pour synchronisation
            $table->string('source_system', 20)->default('postgres');
            $table->timestamp('sync_date')->nullable();
            $table->enum('sync_status', ['pending', 'synced', 'error'])->default('pending');
            
            $table->timestamps();
            
            // Index pour optimiser les requêtes
            $table->index(['evaluateur_matricule', 'date_evaluation'], 'idx_evaluateur_date');
            $table->index(['evalue_matricule', 'date_evaluation'], 'idx_evalue_date');
            $table->index(['statut', 'date_evaluation'], 'idx_statut_date');
            $table->index(['id_periode'], 'idx_periode');
            $table->index(['sync_status'], 'idx_sync_status');
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::connection('pgsql')->dropIfExists('evaluations');
    }
};
