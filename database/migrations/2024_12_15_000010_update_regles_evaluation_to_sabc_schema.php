<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     * Mise à jour de la table regles_evaluation selon le schéma SABC final
     */
    public function up(): void
    {
        Schema::connection('pgsql')->table('regles_evaluation', function (Blueprint $table) {
            // Changer la clé primaire de UUID vers INT auto-increment
            $table->dropPrimary();
            $table->dropColumn('id_regle');
        });

        Schema::connection('pgsql')->table('regles_evaluation', function (Blueprint $table) {
            // Nouvelle clé primaire selon schéma SABC
            $table->id('id_regle')->first();
            
            // Champs manquants selon la modélisation SABC
            $table->string('role_evaluateur', 50)->after('description');
            $table->string('role_evalue', 50)->after('role_evaluateur');
            $table->string('type_evaluation', 20)->after('role_evalue')->comment('auto, pairs, descendante');
            
            // Contraintes géographiques et organisationnelles
            $table->boolean('meme_region_obligatoire')->default(true)->after('criteres_evaluation_json');
            $table->boolean('meme_branche_obligatoire')->default(true)->after('meme_region_obligatoire')->comment('Sauf cross_branch DR/CDTT');
            
            // Renommer et ajuster les colonnes existantes
            $table->renameColumn('nom_regle', 'nom_regle');
            $table->text('criteres_evaluation_json')->comment('JSON: [{nom, description, poids, ordre}, ...] min 5 critères')->change();
            
            // Supprimer les colonnes non conformes au schéma SABC
            $table->dropColumn(['date_debut', 'date_fin', 'parametres_json']);
            
            // Index selon schéma SABC
            $table->unique(['role_evaluateur', 'role_evalue', 'type_evaluation'], 'idx_regle_unique');
            $table->index('est_active', 'idx_regles_actives');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::connection('pgsql')->table('regles_evaluation', function (Blueprint $table) {
            // Restaurer l'ancienne structure si nécessaire
            $table->dropUnique('idx_regle_unique');
            $table->dropIndex('idx_regles_actives');
            
            $table->dropColumn([
                'role_evaluateur',
                'role_evalue', 
                'type_evaluation',
                'meme_region_obligatoire',
                'meme_branche_obligatoire'
            ]);
            
            $table->date('date_debut')->nullable();
            $table->date('date_fin')->nullable();
            $table->json('parametres_json')->nullable();
        });
    }
};
