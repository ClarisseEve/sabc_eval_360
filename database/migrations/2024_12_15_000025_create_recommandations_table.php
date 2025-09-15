<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations - Table recommandations selon règles SABC
     */
    public function up(): void
    {
        Schema::connection('pgsql')->create('recommandations', function (Blueprint $table) {
            $table->uuid('id_recommandation')->primary();
            
            // Destinataire selon hiérarchie SABC
            $table->string('matricule_destinataire', 5);
            $table->string('matricule_generateur', 5)->nullable(); // Système ou manager
            
            // Type recommandation selon règles métier SABC
            $table->enum('type_recommandation', [
                'formation',
                'mentorat',
                'mobilite',
                'plan_developpement',
                'objectif_smart',
                'coaching'
            ]);
            
            // Contenu recommandation selon règles SABC
            $table->string('titre', 200);
            $table->text('description');
            $table->json('criteres_declencheurs'); // Critères ayant déclenché la recommandation
            $table->json('donnees_support'); // Scores, évaluations, etc.
            
            // Priorité selon performance SABC
            $table->enum('priorite', ['basse', 'normale', 'haute', 'critique'])->default('normale');
            $table->decimal('score_pertinence', 3, 2)->default(0); // 0-10
            
            // Échéances selon règles SABC
            $table->date('date_echeance_suggeree')->nullable();
            $table->integer('duree_estimee_jours')->nullable();
            $table->decimal('cout_estime', 10, 2)->nullable();
            
            // État traitement selon workflow SABC
            $table->enum('statut', ['proposee', 'acceptee', 'en_cours', 'completee', 'rejetee'])->default('proposee');
            $table->timestamp('date_acceptation')->nullable();
            $table->timestamp('date_completion')->nullable();
            $table->text('commentaire_utilisateur')->nullable();
            
            // Suivi efficacité selon règles SABC
            $table->decimal('score_avant', 5, 2)->nullable();
            $table->decimal('score_apres', 5, 2)->nullable();
            $table->decimal('amelioration_mesuree', 5, 2)->nullable();
            $table->boolean('objectif_atteint')->nullable();
            
            // Références métier selon règles SABC
            $table->string('code_periode_origine', 20)->nullable();
            $table->string('id_region', 5)->nullable();
            $table->string('axe_competence', 100)->nullable(); // Critère d'évaluation ciblé
            
            // Timestamps
            $table->timestamps();
            
            // Index pour performance selon règles SABC
            $table->index(['matricule_destinataire'], 'idx_reco_destinataire');
            $table->index(['type_recommandation'], 'idx_reco_type');
            $table->index(['statut'], 'idx_reco_statut');
            $table->index(['priorite', 'score_pertinence'], 'idx_reco_priorite');
            $table->index(['date_echeance_suggeree'], 'idx_reco_echeance');
            $table->index(['id_region'], 'idx_reco_region');
            $table->index(['axe_competence'], 'idx_reco_competence');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::connection('pgsql')->dropIfExists('recommandations');
    }
};
