<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::connection('pgsql')->create('business_templates', function (Blueprint $table) {
            $table->uuid('id_template')->primary();
            $table->string('nom');
            $table->text('description')->nullable();
            $table->enum('statut', ['draft', 'published', 'archived'])->default('draft');
            $table->integer('version')->default(1);
            $table->string('evaluated_role');
            $table->json('meta_json')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::connection('pgsql')->dropIfExists('business_templates');
    }
};

