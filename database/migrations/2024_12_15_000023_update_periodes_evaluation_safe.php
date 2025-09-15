<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations - Mise à jour periodes_evaluation selon règles SABC
     */
    public function up(): void
    {
        Schema::connection('pgsql')->table('periodes_evaluation', function (Blueprint $table) {
            // État période selon règles métier SABC
            $table->boolean('est_ouverte')->default(false)->after('date_fin');
            $table->boolean('est_cloturee')->default(false)->after('est_ouverte');
            
            // Gestion notifications selon règles SABC
            $table->json('rappels_envoyes')->nullable()->after('est_cloturee');
            $table->timestamp('derniere_notification')->nullable()->after('rappels_envoyes');
            
            // Statistiques période selon règles SABC
            $table->json('statistiques_json')->nullable()->after('derniere_notification');
            $table->integer('nb_evaluations_attendues')->default(0)->after('statistiques_json');
            $table->integer('nb_evaluations_completees')->default(0)->after('nb_evaluations_attendues');
            $table->decimal('taux_completion', 5, 2)->default(0)->after('nb_evaluations_completees');
            
            // Paramètres période selon règles SABC
            $table->integer('duree_rappels_jours')->default(7)->after('taux_completion');
            $table->integer('nb_max_rappels')->default(3)->after('duree_rappels_jours');
            $table->boolean('escalade_automatique')->default(true)->after('nb_max_rappels');
            
            // Validation DR selon hiérarchie SABC
            $table->string('validateur_dr_matricule', 5)->nullable()->after('escalade_automatique');
            $table->timestamp('date_validation_dr')->nullable()->after('validateur_dr_matricule');
            
            // Index pour performance selon règles SABC
            $table->index(['est_ouverte'], 'idx_periode_ouverte');
            $table->index(['est_cloturee'], 'idx_periode_cloturee');
            $table->index(['taux_completion'], 'idx_periode_completion');
            $table->index(['derniere_notification'], 'idx_periode_notification');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::connection('pgsql')->table('periodes_evaluation', function (Blueprint $table) {
            $table->dropIndex('idx_periode_ouverte');
            $table->dropIndex('idx_periode_cloturee');
            $table->dropIndex('idx_periode_completion');
            $table->dropIndex('idx_periode_notification');
            
            $table->dropColumn([
                'est_ouverte',
                'est_cloturee',
                'rappels_envoyes',
                'derniere_notification',
                'statistiques_json',
                'nb_evaluations_attendues',
                'nb_evaluations_completees',
                'taux_completion',
                'duree_rappels_jours',
                'nb_max_rappels',
                'escalade_automatique',
                'validateur_dr_matricule',
                'date_validation_dr'
            ]);
        });
    }
};
