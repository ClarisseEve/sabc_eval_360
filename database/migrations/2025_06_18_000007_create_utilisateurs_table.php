<?php

use App\Services\IdGeneratorService;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     * Création de la table utilisateurs selon le modèle dbdiagram.io
     */
    public function up(): void
    {
        Schema::create('utilisateurs', function (Blueprint $table) {
            // Utilisation de matricule comme clé primaire au lieu de id_utilisateur
            // pour une codification cohérente avec l'IdGeneratorService
            $table->string('matricule', 5)->primary()->comment('Format: US-XX');
            $table->string('nom', 100);
            $table->string('prenom', 100);
            $table->string('email', 100)->unique();
            $table->string('telephone', 20)->nullable();
            $table->string('password');
            $table->string('role', 50);
            $table->string('manager_matricule', 5)->nullable();
            $table->integer('niveau_hierarchique')->default(0);
            $table->string('id_region', 5);
            $table->string('id_branche', 5);
            
            // Contraintes pour les clés étrangères string
            $table->foreign('id_region')->references('id_region')->on('regions');
            $table->foreign('id_branche')->references('id_branche')->on('branches');
            $table->boolean('est_actif')->default(true);
            $table->boolean('est_admin')->default(false);
            $table->boolean('est_indisponible')->default(false);
            $table->string('photo_url')->nullable();
            $table->rememberToken();
            $table->timestamp('email_verified_at')->nullable();
            
            // STATUT ET DISPONIBILITÉ
            $table->string('statut', 20)->default('Actif')->comment('Actif, En_conge, Indisponible, Support_Actif');
            $table->date('date_debut_indisponibilite')->nullable();
            $table->date('date_fin_indisponibilite')->nullable();
            $table->string('motif_indisponibilite', 100)->nullable();

            
            // DÉNORMALISATION PERFORMANCE
            $table->string('region_nom', 100);
            $table->string('role_nom', 50);
            $table->string('type_region', 20);
            
            // RÔLES SUPPORT ADDITIONNELS (cumul de fonctions)
            $table->text('roles_support_json')->nullable()->comment('JSON: [{role, region, service, date_debut, date_fin}, ...]');
            
            $table->timestamps();
            
            // Index pour optimiser les recherches
            $table->index(['role', 'id_region'], 'idx_user_role_region');
            $table->index('manager_matricule', 'idx_hierarchy');
            $table->index('statut', 'idx_user_statut');
            $table->index(['date_debut_indisponibilite', 'date_fin_indisponibilite'], 'idx_indisponibilite');
            
            // Index unique explicite sur matricule pour PostgreSQL
            $table->unique('matricule', 'unique_matricule');
            
            // Contrainte de clé étrangère auto-référentielle
            $table->foreign('manager_matricule')->references('matricule')->on('utilisateurs')->onDelete('set null');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('utilisateurs');
    }
};
