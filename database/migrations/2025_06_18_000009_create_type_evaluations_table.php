<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     * Création de la table type_evaluations
     */
    public function up(): void
    {
        Schema::create('type_evaluations', function (Blueprint $table) {
            $table->string('id_type_evaluation', 5)->primary()->comment('Format: TE-XX');
            $table->string('nom_type', 50)->unique();
            $table->text('description')->nullable();
            $table->timestamps();
        });
        
        // Insertion des types d'évaluation standards après création de la table
        DB::table('type_evaluations')->insert([
            [
                'id_type_evaluation' => 'TE-01',
                'nom_type' => 'Auto-évaluation',
                'description' => 'Évaluation de soi-même par l\'utilisateur',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'id_type_evaluation' => 'TE-02',
                'nom_type' => 'Évaluation par les pairs',
                'description' => 'Évaluation par un collègue de même niveau hiérarchique',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'id_type_evaluation' => 'TE-03',
                'nom_type' => 'Évaluation descendante',
                'description' => 'Évaluation par un supérieur hiérarchique',
                'created_at' => now(),
                'updated_at' => now(),
            ],
        ]);
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('type_evaluations');
    }
};
