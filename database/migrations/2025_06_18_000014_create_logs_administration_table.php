<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     * Création de la table logs_administration pour la traçabilité des actions
     */
    public function up(): void
    {
        Schema::create('logs_administration', function (Blueprint $table) {
            $table->string('id_log', 5)->primary()->comment('Format: LG-XX');
            $table->string('matricule_utilisateur', 5)->nullable()->comment('Référence à utilisateurs.matricule');
            $table->foreign('matricule_utilisateur')->references('matricule')->on('utilisateurs')->onDelete('set null');
            $table->string('action', 100);
            $table->string('entite', 50)->comment('Nom de la table concernée');
            $table->string('id_entite', 20)->nullable()->comment('ID de l\'enregistrement concerné (format string)');
            $table->json('details_json')->nullable()->comment('Détails de l\'action');
            $table->string('adresse_ip', 45)->nullable();
            $table->string('user_agent', 255)->nullable();
            $table->timestamps();
            
            // Index pour optimiser les recherches
            $table->index('matricule_utilisateur', 'idx_log_utilisateur');
            $table->index(['entite', 'id_entite'], 'idx_log_entite');
            $table->index('created_at', 'idx_log_date');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('logs_administration');
    }
};
