<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     * Correction des incohérences de données selon les règles métier SABC
     */
    public function up(): void
    {
        // 1. Corriger les données admin AVANT de modifier les contraintes
        DB::table('utilisateurs')
            ->where('role', 'ADMIN')
            ->update([
                'id_region' => null,
                'id_branche' => null,
                'manager_matricule' => null,
                'niveau_hierarchique' => 0
            ]);

        // 2. Permettre id_region et id_branche nullable pour les admins
        Schema::table('utilisateurs', function (Blueprint $table) {
            $table->string('id_region', 5)->nullable()->change();
            $table->string('id_branche', 5)->nullable()->change();
        });

        // 4. Corriger les portées géographiques des rôles selon règles SABC
        DB::table('roles')->where('nom_role', 'CSC')->update(['portee_geographique' => 'service']);
        DB::table('roles')->where('nom_role', 'CDV')->update(['portee_geographique' => 'district']);
        DB::table('roles')->where('nom_role', 'CDS')->update(['portee_geographique' => 'secteur']);
        DB::table('roles')->where('nom_role', 'RTM')->update(['portee_geographique' => 'region']);
        DB::table('roles')->where('nom_role', 'TMO')->update(['portee_geographique' => 'service']);
        DB::table('roles')->where('nom_role', 'SRMO')->update(['portee_geographique' => 'region']);
        DB::table('roles')->where('nom_role', 'AS')->update(['portee_geographique' => 'service']);
        DB::table('roles')->where('nom_role', 'SS')->update(['portee_geographique' => 'service']);
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Restaurer les contraintes non-nullable
        Schema::table('utilisateurs', function (Blueprint $table) {
            $table->dropForeign(['id_region']);
            $table->dropForeign(['id_branche']);
            
            $table->string('id_region', 5)->nullable(false)->change();
            $table->string('id_branche', 5)->nullable(false)->change();
            
            $table->foreign('id_region')->references('id_region')->on('regions');
            $table->foreign('id_branche')->references('id_branche')->on('branches');
        });

        // Restaurer les portées géographiques originales
        DB::table('roles')->whereIn('nom_role', ['CSC', 'CDV', 'CDS', 'RTM', 'TMO', 'SRMO', 'AS', 'SS'])
            ->update(['portee_geographique' => 'region']);
    }
};
