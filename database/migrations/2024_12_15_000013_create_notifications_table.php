<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     * Création de la table notifications selon le schéma SABC final
     */
    public function up(): void
    {
        Schema::connection('pgsql')->create('notifications', function (Blueprint $table) {
            $table->id('id_notification');
            
            // Destinataire selon schéma SABC
            $table->string('matricule_destinataire', 20);
            
            // Type et contenu de notification
            $table->string('type_notification', 50)->comment('evaluation_a_faire, remplacement_commence, remplacement_termine, nouveau_manager_temporaire, etc.');
            $table->string('titre', 200);
            $table->text('message');
            
            // Contexte remplacement selon schéma SABC
            $table->unsignedBigInteger('id_remplacement')->nullable()->comment('Lien si notification liée à un remplacement');
            
            // Statut de lecture
            $table->boolean('est_lu')->default(false);
            $table->timestamp('date_creation')->useCurrent();
            $table->timestamp('date_lecture')->nullable();
            
            // Index selon schéma SABC
            $table->index(['matricule_destinataire', 'est_lu'], 'idx_notif_user_status');
            $table->index('date_creation', 'idx_notif_date');
            $table->index('type_notification', 'idx_notif_type');
            $table->index('id_remplacement', 'idx_notif_remplacement');
            
            // Références vers les autres tables
            $table->foreign('matricule_destinataire')->references('matricule')->on('utilisateurs');
            $table->foreign('id_remplacement')->references('id_remplacement')->on('remplacements_temporaires');
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
