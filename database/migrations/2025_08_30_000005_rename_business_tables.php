<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration {
    public function up(): void
    {
        $schema = DB::connection('pgsql')->getSchemaBuilder();

        if ($schema->hasTable('business_competencies') && !$schema->hasTable('competencies')) {
            DB::connection('pgsql')->statement('ALTER TABLE business_competencies RENAME TO competencies');
        }
        if ($schema->hasTable('business_templates') && !$schema->hasTable('templates')) {
            DB::connection('pgsql')->statement('ALTER TABLE business_templates RENAME TO templates');
        }
        if ($schema->hasTable('business_template_items') && !$schema->hasTable('template_items')) {
            DB::connection('pgsql')->statement('ALTER TABLE business_template_items RENAME TO template_items');
        }
        if ($schema->hasTable('business_template_evaluator_roles') && !$schema->hasTable('template_evaluator_roles')) {
            DB::connection('pgsql')->statement('ALTER TABLE business_template_evaluator_roles RENAME TO template_evaluator_roles');
        }
    }

    public function down(): void
    {
        $schema = DB::connection('pgsql')->getSchemaBuilder();
        if ($schema->hasTable('template_evaluator_roles') && !$schema->hasTable('business_template_evaluator_roles')) {
            DB::connection('pgsql')->statement('ALTER TABLE template_evaluator_roles RENAME TO business_template_evaluator_roles');
        }
        if ($schema->hasTable('template_items') && !$schema->hasTable('business_template_items')) {
            DB::connection('pgsql')->statement('ALTER TABLE template_items RENAME TO business_template_items');
        }
        if ($schema->hasTable('templates') && !$schema->hasTable('business_templates')) {
            DB::connection('pgsql')->statement('ALTER TABLE templates RENAME TO business_templates');
        }
        if ($schema->hasTable('competencies') && !$schema->hasTable('business_competencies')) {
            DB::connection('pgsql')->statement('ALTER TABLE competencies RENAME TO business_competencies');
        }
    }
};

