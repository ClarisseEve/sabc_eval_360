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
            // Supprimer le champ annee_naissance (year)
            $table->dropColumn('annee_naissance');
            
            // Ajouter le champ date_naissance (date complète)
            $table->date('date_naissance')->nullable()->after('telephone');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('utilisateurs', function (Blueprint $table) {
            //
        });
    }
};
