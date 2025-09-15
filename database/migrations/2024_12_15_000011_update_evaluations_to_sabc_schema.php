<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     * Mise à jour de la table evaluations selon le schéma SABC final
     */
    public function up(): void
    {
        Schema::connection('pgsql')->table('evaluations', function (Blueprint $table) {
            // Changer la clé primaire de UUID vers INT auto-increment
            $table->dropPrimary();
            $table->dropColumn('id_evaluation');
        });

        Schema::connection('pgsql')->table('evaluations', function (Blueprint $table) {
            // Nouvelle clé primaire selon schéma SABC
            $table->id('id_evaluation')->first();
            
            // Champs manquants pour le système de remplacement SABC
            $table->boolean('evaluateur_en_remplacement')->default(false)->after('id_regle')->comment('true si évaluateur remplace quelqu\'un');
            $table->unsignedBigInteger('id_remplacement')->nullable()->after('evaluateur_en_remplacement')->comment('Lien vers remplacement si applicable');
            
            // Période et validation selon schéma SABC
            $table->string('periode_code', 7)->after('id_periode')->comment('2025-S1, 2025-S2');
            $table->string('validateur_matricule', 20)->nullable()->after('date_soumission');
            $table->timestamp('date_validation')->nullable()->after('validateur_matricule');
            
            // Ajuster les colonnes existantes selon le schéma SABC
            $table->renameColumn('date_evaluation', 'date_creation');
            $table->renameColumn('commentaire_general', 'commentaire_global');
            $table->text('notations_json')->comment('JSON: {critere_nom: {note: 1-5, commentaire: ""}, ...}')->change();
            $table->enum('statut', ['brouillon', 'soumis', 'valide'])->default('brouillon')->change();
            
            // Supprimer les colonnes non conformes au schéma SABC
            $table->dropColumn(['source_system', 'sync_date', 'sync_status']);
            
            // Index selon schéma SABC
            $table->unique(['evaluateur_matricule', 'evalue_matricule', 'id_periode', 'type_evaluation']);
            $table->index(['evalue_matricule', 'id_periode'], 'idx_eval_evalue_periode');
            $table->index('id_periode', 'idx_eval_periode');
            $table->index('statut', 'idx_eval_statut');
            $table->index('id_remplacement', 'idx_eval_remplacement');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::connection('pgsql')->table('evaluations', function (Blueprint $table) {
            // Restaurer l'ancienne structure si nécessaire
            $table->dropUnique(['evaluateur_matricule', 'evalue_matricule', 'id_periode', 'type_evaluation']);
            $table->dropIndex('idx_eval_evalue_periode');
            $table->dropIndex('idx_eval_periode');
            $table->dropIndex('idx_eval_statut');
            $table->dropIndex('idx_eval_remplacement');
            
            $table->dropColumn([
                'evaluateur_en_remplacement',
                'id_remplacement',
                'periode_code',
                'validateur_matricule',
                'date_validation'
            ]);
            
            $table->string('source_system', 20)->default('postgres');
            $table->timestamp('sync_date')->nullable();
            $table->enum('sync_status', ['pending', 'synced', 'error'])->default('pending');
        });
    }
};
