<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations - Ajout champs manquants selon règles SABC
     */
    public function up(): void
    {
        Schema::connection('pgsql')->table('evaluations', function (Blueprint $table) {
            // Champs pour remplacements temporaires selon règles SABC
            $table->string('matricule_remplacant', 5)->nullable()->after('evalue_matricule');
            $table->boolean('est_remplacement')->default(false)->after('matricule_remplacant');
            
            // Référence période selon règles métier SABC
            $table->string('code_periode', 20)->nullable()->after('id_periode');
            
            // Workflow validation selon hiérarchie SABC
            $table->boolean('est_validee_manager')->default(false)->after('statut');
            $table->timestamp('date_validation_manager')->nullable()->after('est_validee_manager');
            $table->string('validateur_matricule', 5)->nullable()->after('date_validation_manager');
            
            // Métriques performance selon règles SABC
            $table->decimal('progression_vs_precedente', 5, 2)->nullable()->after('note_globale');
            $table->json('historique_modifications')->nullable()->after('progression_vs_precedente');
            
            // Alertes et suivi selon règles SABC
            $table->integer('nb_rappels_envoyes')->default(0)->after('historique_modifications');
            $table->timestamp('derniere_alerte_envoyee')->nullable()->after('nb_rappels_envoyes');
            
            // Index pour performance selon règles SABC
            $table->index(['evaluateur_matricule', 'code_periode'], 'idx_evaluateur_periode');
            $table->index(['evalue_matricule', 'statut'], 'idx_evalue_statut');
            $table->index(['matricule_remplacant'], 'idx_remplacant');
            $table->index(['est_validee_manager', 'date_validation_manager'], 'idx_validation');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::connection('pgsql')->table('evaluations', function (Blueprint $table) {
            $table->dropIndex('idx_evaluateur_periode');
            $table->dropIndex('idx_evalue_statut');
            $table->dropIndex('idx_remplacant');
            $table->dropIndex('idx_validation');
            
            $table->dropColumn([
                'matricule_remplacant',
                'est_remplacement',
                'code_periode',
                'est_validee_manager',
                'date_validation_manager',
                'validateur_matricule',
                'progression_vs_precedente',
                'historique_modifications',
                'nb_rappels_envoyes',
                'derniere_alerte_envoyee'
            ]);
        });
    }
};
