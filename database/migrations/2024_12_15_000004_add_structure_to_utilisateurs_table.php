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
        Schema::table('utilisateurs', function (Blueprint $table) {
            // Ajout des colonnes pour la structure organisationnelle SABC
            $table->string('id_service', 10)->nullable()->after('id_region');
            $table->string('id_district', 10)->nullable()->after('id_service');
            $table->string('id_secteur', 10)->nullable()->after('id_district');
            
            // Foreign keys vers les nouvelles tables
            $table->foreign('id_service')->references('id_service')->on('services_commerciaux')->onDelete('set null');
            $table->foreign('id_district')->references('id_district')->on('districts')->onDelete('set null');
            $table->foreign('id_secteur')->references('id_secteur')->on('secteurs')->onDelete('set null');
            
            // Index pour optimiser les requêtes hiérarchiques selon règles SABC
            $table->index(['id_region', 'id_service', 'id_district', 'id_secteur']);
            $table->index(['id_service', 'est_actif']);
            $table->index(['id_district', 'est_actif']);
            $table->index(['id_secteur', 'est_actif']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('utilisateurs', function (Blueprint $table) {
            // Suppression des foreign keys
            $table->dropForeign(['id_service']);
            $table->dropForeign(['id_district']);
            $table->dropForeign(['id_secteur']);
            
            // Suppression des colonnes
            $table->dropColumn(['id_service', 'id_district', 'id_secteur']);
        });
    }
};
