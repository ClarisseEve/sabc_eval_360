<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     * Création de la table notifications dans PostgreSQL (Business Database)
     */
    public function up(): void
    {
        Schema::connection('pgsql')->create('notifications', function (Blueprint $table) {
            $table->uuid('id_notification')->primary();
            $table->string('destinataire_matricule', 10);
            $table->string('expediteur_matricule', 10)->nullable();
            $table->string('type_notification', 50);
            $table->string('titre', 200);
            $table->text('message');
            $table->json('donnees_json')->nullable();
            $table->enum('statut', ['non_lue', 'lue', 'archivee'])->default('non_lue');
            $table->enum('priorite', ['basse', 'normale', 'haute', 'urgente'])->default('normale');
            $table->timestamp('date_lecture')->nullable();
            $table->timestamp('date_expiration')->nullable();
            
            $table->timestamps();
            
            // Index pour optimiser les requêtes
            $table->index(['destinataire_matricule', 'statut'], 'idx_destinataire_statut');
            $table->index(['type_notification', 'created_at'], 'idx_type_date');
            $table->index(['priorite', 'statut'], 'idx_priorite_statut');
            $table->index(['date_expiration'], 'idx_expiration');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::connection('pgsql')->dropIfExists('notifications');
    }
};
