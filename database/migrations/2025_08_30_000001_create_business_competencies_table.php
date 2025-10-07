<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::connection('pgsql')->create('business_competencies', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('libelle');
            $table->text('description')->nullable();
            $table->string('categorie')->nullable();
            $table->boolean('actif')->default(true);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::connection('pgsql')->dropIfExists('business_competencies');
    }
};

