<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     * Création de la table notifications_utilisateurs selon le modèle dbdiagram.io
     */
    public function up(): void
    {
        Schema::create('notifications_utilisateurs', function (Blueprint $table) {
            $table->string('id_notification', 5)->primary()->comment('Format: NU-XX');
            $table->string('destinataire_matricule', 5);
            $table->string('type', 50)->comment('evaluation_soumise, evaluation_validee, remplacement_cree, etc.');
            $table->string('titre', 100);
            $table->text('message');
            $table->string('lien', 255)->nullable();
            $table->boolean('est_lue')->default(false);
            $table->timestamp('date_creation')->default(DB::raw('CURRENT_TIMESTAMP'));
            $table->timestamp('date_lecture')->nullable();
            
            // Données contextuelles
            $table->string('id_evaluation', 8)->nullable()->comment('Référence à evaluations.id_evaluation au format EV-PP-XX');
            $table->string('id_remplacement', 5)->nullable()->comment('Référence à remplacements_temporaires.id_remplacement au format RT-XX');
            $table->string('expediteur_matricule', 5)->nullable();
            
            // Index pour optimiser les recherches
            $table->index('destinataire_matricule', 'idx_notif_destinataire');
            $table->index('est_lue', 'idx_notif_lue');
            $table->index(['destinataire_matricule', 'est_lue'], 'idx_dest_non_lues');
            
            // Contraintes de clés étrangères
            $table->foreign('destinataire_matricule')->references('matricule')->on('utilisateurs');
            $table->foreign('expediteur_matricule')->references('matricule')->on('utilisateurs')->onDelete('set null');
            $table->foreign('id_evaluation')->references('id_evaluation')->on('evaluations')->onDelete('cascade');
            $table->foreign('id_remplacement')->references('id_remplacement')->on('remplacements_temporaires')->onDelete('cascade');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('notifications_utilisateurs');
    }
};
