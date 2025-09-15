<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Modifier la colonne id_branche pour permettre NULL (pour le rôle ADMIN)
        Schema::table('roles', function (Blueprint $table) {
            $table->string('id_branche', 10)->nullable()->change();
        });

        // Corriger le rôle ADMIN selon les règles SABC
        DB::table('roles')->where('nom_role', 'ADMIN')->update([
            'id_branche' => null,
            'peut_cross_branch' => true,
            'peut_evaluer_subordonnes' => true,
            'niveau_taniere' => 0, // Admin est niveau 0, hors hiérarchie
            'niveau_non_taniere' => 0,
            'peut_auto_evaluer' => false, // Admin ne s'auto-évalue pas
            'peut_evaluer_pairs' => false, // Admin n'a pas de pairs
            'portee_geographique' => 'global', // Admin a une portée globale
            'description' => 'Administrateur système - Hors hiérarchie organisationnelle',
            'updated_at' => now(),
        ]);

        // Ajouter un index pour optimiser les requêtes selon règles SABC
        Schema::table('roles', function (Blueprint $table) {
            $table->index(['id_branche', 'niveau_taniere', 'niveau_non_taniere']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Restaurer la contrainte NOT NULL sur id_branche
        Schema::table('roles', function (Blueprint $table) {
            $table->dropIndex(['id_branche', 'niveau_taniere', 'niveau_non_taniere']);
        });

        // Remettre une branche par défaut pour ADMIN avant de rendre la colonne NOT NULL
        DB::table('roles')->where('nom_role', 'ADMIN')->update([
            'id_branche' => 'BR-01',
            'peut_cross_branch' => false,
        ]);

        Schema::table('roles', function (Blueprint $table) {
            $table->string('id_branche', 10)->nullable(false)->change();
        });
    }
};
