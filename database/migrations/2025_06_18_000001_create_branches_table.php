<?php

use App\Services\IdGeneratorService;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     * Création de la table branches (Commercial, Marketing, Support)
     */
    public function up(): void
    {
        Schema::create('branches', function (Blueprint $table) {
            $table->string('id_branche', 5)->primary()->comment('Format: BR-XX');
            $table->string('nom_branche', 50)->comment('Commercial, Marketing ou Support');
            $table->text('description')->nullable();
            $table->timestamps();
            
            // Index pour optimiser les recherches
            $table->unique('nom_branche', 'unq_branche_nom');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('branches');
    }
};
