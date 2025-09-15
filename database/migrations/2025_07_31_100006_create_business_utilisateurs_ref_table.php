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
        // Migration pour PostgreSQL uniquement
        if (config('database.default') !== 'pgsql') {
            return;
        }

        Schema::connection('pgsql')->create('utilisateurs_ref', function (Blueprint $table) {
            $table->string('matricule', 5)->primary();
            $table->string('nom', 50);
            $table->string('prenom', 50);
            $table->string('email', 100)->unique();
            $table->string('role', 20);
            $table->string('id_region', 5);
            $table->string('id_branche', 5);
            $table->string('region_nom', 50);
            $table->string('type_region', 20);
            $table->boolean('est_actif')->default(true);
            $table->timestamps();

            // Index pour optimiser les requêtes
            $table->index(['role']);
            $table->index(['id_region']);
            $table->index(['id_branche']);
            $table->index(['est_actif']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::connection('pgsql')->dropIfExists('utilisateurs_ref');
    }
};
