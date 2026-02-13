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
        Schema::connection('pgsql')->create('templates_roles_periodes', function (Blueprint $table) {
            $table->id();
            $table->uuid('id_template');
            $table->string('id_role', 10);
            $table->integer('id_periode');
            $table->boolean('est_actif')->default(true);
            $table->timestamps();
            
            // Contrainte unique : un seul template par (rôle, période)
            $table->unique(['id_role', 'id_periode'], 'unique_role_periode');
            
            // Index pour performances
            $table->index('id_template');
            $table->index('id_role');
            $table->index('id_periode');
            $table->index('est_actif');
            
            // Foreign keys
            $table->foreign('id_template')
                ->references('id_template')
                ->on('templates')
                ->onDelete('cascade');

            // `roles` est stockée côté MySQL (CORE), donc pas de FK possible depuis PostgreSQL.
            // On conserve `id_role` indexé et la cohérence est gérée applicativement.
            
            $table->foreign('id_periode')
                ->references('id_periode')
                ->on('periodes_evaluation')
                ->onDelete('cascade');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::connection('pgsql')->dropIfExists('templates_roles_periodes');
    }
};
