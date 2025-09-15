<?php

use App\Services\IdGeneratorService;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     * Création de la table remplacements_temporaires selon le modèle dbdiagram.io
     */
    public function up(): void
    {
        Schema::create('remplacements_temporaires', function (Blueprint $table) {
            $table->string('id_remplacement', 5)->primary()->comment('Format: RT-XX');
            
            // QUI REMPLACE QUI
            $table->string('titulaire_matricule', 5);
            $table->string('remplacant_matricule', 5);
            
            // CONTEXTE DU REMPLACEMENT
            $table->string('role_remplace', 50)->comment('Quel rôle est remplacé (peut différer du rôle principal)');
            $table->string('region_remplacement', 100);
            $table->string('service_remplacement', 100)->nullable();
            
            // PÉRIODE ET MOTIF
            $table->date('date_debut');
            $table->date('date_fin')->nullable()->comment('null si durée indéterminée');
            $table->integer('duree_prevue_jours')->comment('Minimum 30 jours');
            $table->string('motif', 100)->comment('Congé, maladie, formation, mutation, etc.');
            
            // WORKFLOW ADMIN
            $table->string('cree_par', 5);
            $table->string('approuve_par', 5)->nullable()->comment('Manager qui approuve si nécessaire');
            $table->boolean('est_actif')->default(true);
            $table->date('date_fin_effective')->nullable()->comment('Date réelle de fin si différente de prévue');
            
            // NOTIFICATIONS ENVOYÉES
            $table->boolean('notifications_envoyees')->default(false);
            $table->boolean('equipe_notifiee')->default(false);
            
            $table->timestamps();
            
            // Index pour optimiser les recherches
            $table->index('titulaire_matricule', 'idx_remplacement_titulaire');
            $table->index('remplacant_matricule', 'idx_remplacement_remplacant');
            $table->index(['date_debut', 'date_fin'], 'idx_remplacement_periode');
            $table->index('est_actif', 'idx_remplacement_actif');
            $table->index(['titulaire_matricule', 'est_actif'], 'idx_titulaire_actif');
            
            // Contraintes de clés étrangères
            $table->foreign('titulaire_matricule')->references('matricule')->on('utilisateurs');
            $table->foreign('remplacant_matricule')->references('matricule')->on('utilisateurs');
            $table->foreign('cree_par')->references('matricule')->on('utilisateurs');
            $table->foreign('approuve_par')->references('matricule')->on('utilisateurs')->onDelete('set null');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('remplacements_temporaires');
    }
};
