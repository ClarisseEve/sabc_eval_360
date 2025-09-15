<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations - Table notifications selon règles SABC
     */
    public function up(): void
    {
        Schema::connection('pgsql')->create('notifications', function (Blueprint $table) {
            $table->uuid('id_notification')->primary();
            
            // Destinataire selon hiérarchie SABC
            $table->string('destinataire_matricule', 5);
            $table->string('expediteur_matricule', 5)->nullable();
            
            // Type notification selon règles métier SABC
            $table->enum('type_notification', [
                'evaluation_en_retard',
                'validation_en_attente',
                'performance_en_baisse',
                'evaluation_incoherente',
                'escalade_manager',
                'rappel_evaluation',
                'periode_ouverte',
                'periode_fermee'
            ]);
            
            // Contenu notification selon règles SABC
            $table->string('titre', 200);
            $table->text('message');
            $table->json('donnees_contexte')->nullable();
            
            // Priorité selon escalade SABC
            $table->enum('priorite', ['basse', 'normale', 'haute', 'critique'])->default('normale');
            $table->enum('canal', ['email', 'sms', 'push', 'interne'])->default('interne');
            
            // État notification selon workflow SABC
            $table->boolean('est_lue')->default(false);
            $table->timestamp('date_lecture')->nullable();
            $table->timestamp('date_envoi')->nullable();
            $table->timestamp('date_expiration')->nullable();
            
            // Références métier selon règles SABC
            $table->uuid('id_evaluation')->nullable();
            $table->string('code_periode', 20)->nullable();
            $table->string('id_region', 5)->nullable();
            
            // Escalade selon hiérarchie SABC
            $table->integer('niveau_escalade')->default(0);
            $table->timestamp('prochaine_escalade')->nullable();
            $table->string('manager_escalade_matricule', 5)->nullable();
            
            // Timestamps
            $table->timestamps();
            
            // Index pour performance selon règles SABC
            $table->index(['destinataire_matricule', 'est_lue'], 'idx_notif_destinataire');
            $table->index(['type_notification'], 'idx_notif_type');
            $table->index(['priorite', 'date_envoi'], 'idx_notif_priorite');
            $table->index(['id_evaluation'], 'idx_notif_evaluation');
            $table->index(['code_periode'], 'idx_notif_periode');
            $table->index(['niveau_escalade', 'prochaine_escalade'], 'idx_notif_escalade');
            $table->index(['date_expiration'], 'idx_notif_expiration');
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
