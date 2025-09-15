<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Utiliser la connexion MySQL pour les modifications
        Schema::connection('mysql')->table('utilisateurs', function (Blueprint $table) {
            // Ajouter le champ année de naissance
            $table->year('annee_naissance')->nullable()->after('telephone');
        });

        // Corriger la table sessions pour accepter les matricules (string) comme user_id
        Schema::connection('mysql')->table('sessions', function (Blueprint $table) {
            // Modifier la colonne user_id pour accepter des strings (matricules)
            $table->string('user_id', 5)->nullable()->change();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('utilisateurs_and_fix_sessions', function (Blueprint $table) {
            //
        });
    }
};
