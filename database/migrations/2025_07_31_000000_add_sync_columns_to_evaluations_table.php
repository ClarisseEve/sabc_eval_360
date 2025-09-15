<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class AddSyncColumnsToEvaluationsTable extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::connection('mysql')->table('evaluations', function (Blueprint $table) {
            if (!Schema::connection('mysql')->hasColumn('evaluations', 'sync_status')) {
                $table->string('sync_status')->default('pending')->after('statut');
            }
            if (!Schema::connection('mysql')->hasColumn('evaluations', 'sync_date')) {
                $table->timestamp('sync_date')->nullable()->after('sync_status');
            }
            if (!Schema::connection('mysql')->hasColumn('evaluations', 'sync_error')) {
                $table->text('sync_error')->nullable()->after('sync_date');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::connection('mysql')->table('evaluations', function (Blueprint $table) {
            $table->dropColumn(['sync_status', 'sync_date', 'sync_error']);
        });
    }
}
