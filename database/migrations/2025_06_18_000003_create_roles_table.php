<?php

use App\Services\IdGeneratorService;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     * Création de la table roles selon le modèle dbdiagram.io
     */
    public function up(): void
    {
        Schema::create('roles', function (Blueprint $table) {
            $table->string('id_role', 5)->primary()->comment('Format: RL-XX');
            $table->string('nom_role', 50)->unique()->comment('DR, CDTT, CSC, CDV, CDS, RTM, SRMO, TMO, SS, AS, ADMIN + Support variants');
            $table->text('description')->nullable();
            $table->string('id_branche', 5)->comment('Format: BR-XX');
            
            // Contrainte de clé étrangère explicite
            $table->foreign('id_branche')->references('id_branche')->on('branches');
            
            // HIÉRARCHIE ADAPTATIVE
            $table->integer('niveau_taniere')->nullable()->comment('Niveau en région tanière (null si inexistant)');
            $table->integer('niveau_non_taniere')->nullable()->comment('Niveau en région non-tanière (null si inexistant)');
            
            // PERMISSIONS D'ÉVALUATION
            $table->boolean('peut_auto_evaluer')->default(true);
            $table->boolean('peut_evaluer_pairs')->default(true);
            $table->boolean('peut_evaluer_subordonnes')->default(false);
            $table->boolean('peut_cross_branch')->default(false)->comment('DR/CDTT uniquement');
            
            // SUPPORT ET REMPLACEMENT
            $table->string('role_principal_equivalent', 50)->nullable()->comment('Pour rôles support : DR_Support -> DR');
            $table->text('peut_remplacer_roles')->nullable()->comment('JSON: liste des rôles que ce rôle peut remplacer');
            $table->string('portee_geographique', 20)->default('region')->comment('region, nationale pour supports');
            
            $table->timestamps();
            
            // Index pour optimiser les recherches
            $table->index(['niveau_taniere', 'niveau_non_taniere'], 'idx_niveaux');
            $table->index('role_principal_equivalent', 'idx_role_equivalent');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('roles');
    }
};
