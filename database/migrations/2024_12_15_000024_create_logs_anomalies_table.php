<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations - Table logs_anomalies selon règles SABC
     */
    public function up(): void
    {
        Schema::connection('pgsql')->create('logs_anomalies', function (Blueprint $table) {
            $table->uuid('id_anomalie')->primary();
            
            // Détection anomalie selon règles SABC
            $table->enum('type_anomalie', [
                'divergence_auto_autres',
                'baisse_performance',
                'uniformite_evaluations',
                'biais_evaluateur',
                'evaluation_tardive',
                'score_incoherent'
            ]);
            
            // Références métier selon règles SABC
            $table->string('matricule_concerne', 5);
            $table->string('matricule_evaluateur', 5)->nullable();
            $table->uuid('id_evaluation')->nullable();
            $table->string('code_periode', 20)->nullable();
            
            // Détails anomalie selon règles SABC
            $table->text('description');
            $table->json('donnees_anomalie');
            $table->decimal('score_severite', 3, 2)->default(0); // 0-10
            
            // Seuils dépassés selon règles métier SABC
            $table->decimal('valeur_detectee', 8, 2)->nullable();
            $table->decimal('seuil_configure', 8, 2)->nullable();
            $table->decimal('ecart_seuil', 8, 2)->nullable();
            
            // État traitement selon workflow SABC
            $table->enum('statut', ['detectee', 'en_cours', 'resolue', 'ignoree'])->default('detectee');
            $table->string('assignee_matricule', 5)->nullable();
            $table->text('commentaire_resolution')->nullable();
            $table->timestamp('date_resolution')->nullable();
            
            // Escalade selon hiérarchie SABC
            $table->boolean('necessite_escalade')->default(false);
            $table->string('manager_notifie_matricule', 5)->nullable();
            $table->timestamp('date_escalade')->nullable();
            
            // Timestamps
            $table->timestamps();
            
            // Index pour performance selon règles SABC
            $table->index(['type_anomalie'], 'idx_anomalie_type');
            $table->index(['matricule_concerne'], 'idx_anomalie_matricule');
            $table->index(['statut'], 'idx_anomalie_statut');
            $table->index(['score_severite'], 'idx_anomalie_severite');
            $table->index(['code_periode'], 'idx_anomalie_periode');
            $table->index(['necessite_escalade'], 'idx_anomalie_escalade');
            $table->index(['created_at'], 'idx_anomalie_date');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::connection('pgsql')->dropIfExists('logs_anomalies');
    }
};
