<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     * Création de la table notifications pour les alertes système
     * Utilise une codification cohérente avec l'IdGeneratorService
     */
    public function up(): void
    {
        Schema::create('notifications', function (Blueprint $table) {
            $table->string('id_notification', 5)->primary()->comment('Format: NT-XX');
            $table->string('type');
            $table->morphs('notifiable');
            $table->text('data');
            $table->timestamp('read_at')->nullable();
            $table->timestamps();
            
            // Index pour optimiser les recherches
            $table->index(['notifiable_type', 'notifiable_id'], 'idx_notification_notifiable');
            $table->index('read_at', 'idx_notification_read'); 
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('notifications');
    }
};
