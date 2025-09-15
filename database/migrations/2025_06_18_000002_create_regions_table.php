<?php

use App\Services\IdGeneratorService;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     * Création de la table regions selon le modèle dbdiagram.io
     */
    public function up(): void
    {
        Schema::create('regions', function (Blueprint $table) {
            $table->string('id_region', 5)->primary()->comment('Format: RG-XX');
            $table->string('nom_region', 100)->unique();
            $table->boolean('est_taniere')->default(false);
            $table->timestamp('created_at')->default(DB::raw('CURRENT_TIMESTAMP'));
            $table->timestamp('updated_at')->default(DB::raw('CURRENT_TIMESTAMP'));
            
            // Index pour optimiser les recherches
            $table->index('est_taniere', 'idx_region_taniere');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('regions');
    }
};
