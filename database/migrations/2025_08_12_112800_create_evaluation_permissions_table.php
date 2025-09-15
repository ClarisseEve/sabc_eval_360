<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     * Table des permissions d'évaluation selon les règles métier SABC
     */
    public function up(): void
    {
        Schema::connection('pgsql')->create('evaluation_permissions', function (Blueprint $table) {
            $table->uuid('id_permission')->primary();
            $table->string('role_evaluateur', 50);
            $table->string('role_evalue', 50);
            $table->string('type_evaluation', 20); // auto, pairs, descendante, ascendante
            $table->boolean('est_autorise')->default(false);
            $table->json('conditions_json')->nullable(); // Conditions spécifiques
            $table->text('description')->nullable();
            $table->boolean('est_active')->default(true);
            
            $table->timestamps();
            
            // Index pour optimiser les requêtes
            $table->index(['role_evaluateur', 'role_evalue', 'type_evaluation'], 'idx_eval_permissions');
            $table->index(['est_autorise', 'est_active'], 'idx_permissions_active');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::connection('pgsql')->dropIfExists('evaluation_permissions');
    }
};
