<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     * Mise à jour de la table periodes_evaluation selon le schéma SABC final
     */
    public function up(): void
    {
        Schema::connection('pgsql')->table('periodes_evaluation', function (Blueprint $table) {
            // Changer la clé primaire de UUID vers INT auto-increment
            $table->dropForeign(['id_regle']);
            $table->dropPrimary();
            $table->dropColumn('id_periode');
        });

        Schema::connection('pgsql')->table('periodes_evaluation', function (Blueprint $table) {
            // Nouvelle clé primaire selon schéma SABC
            $table->id('id_periode')->first();
            
            // Champs selon le schéma SABC final
            $table->string('code_periode', 7)->unique()->after('id_periode')->comment('2025-S1, 2025-S2');
            $table->string('nom_periode', 50)->after('code_periode');
            $table->boolean('est_ouverte')->default(false)->after('date_fin');
            
            // Renommer et ajuster les colonnes existantes
            $table->renameColumn('titre', 'nom_periode_temp');
            $table->dropColumn(['description', 'statut', 'id_regle', 'parametres_json']);
            
            // Index selon schéma SABC
            $table->index('code_periode', 'idx_code_periode');
            $table->index('est_ouverte', 'idx_periode_ouverte');
            $table->index(['date_debut', 'date_fin'], 'idx_periode_dates');
        });

        // Nettoyer la colonne temporaire
        Schema::connection('pgsql')->table('periodes_evaluation', function (Blueprint $table) {
            $table->dropColumn('nom_periode_temp');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::connection('pgsql')->table('periodes_evaluation', function (Blueprint $table) {
            // Restaurer l'ancienne structure si nécessaire
            $table->dropIndex('idx_code_periode');
            $table->dropIndex('idx_periode_ouverte');
            $table->dropIndex('idx_periode_dates');
            
            $table->dropColumn([
                'code_periode',
                'nom_periode',
                'est_ouverte'
            ]);
            
            $table->string('titre', 100);
            $table->text('description')->nullable();
            $table->enum('statut', ['planifiee', 'ouverte', 'fermee', 'archivee'])->default('planifiee');
            $table->uuid('id_regle')->nullable();
            $table->json('parametres_json')->nullable();
        });
    }
};
