<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::connection('pgsql')->create('business_template_items', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('template_id');
            $table->uuid('competence_id');
            $table->integer('ordre')->default(0);
            $table->integer('poids_critere')->nullable();
            $table->integer('require_comment_if_below')->nullable();
            $table->integer('scale_min')->default(1);
            $table->integer('scale_max')->default(5);
            $table->string('section_label')->nullable();
            $table->integer('section_order')->nullable();
            $table->timestamps();

            $table->foreign('template_id')->references('id_template')->on('business_templates')->onDelete('cascade');
        });
    }

    public function down(): void
    {
        Schema::connection('pgsql')->dropIfExists('business_template_items');
    }
};

