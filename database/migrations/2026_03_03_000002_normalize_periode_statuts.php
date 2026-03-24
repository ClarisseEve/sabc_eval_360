<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     * Normalise les valeurs historiques de statut et synchronise les flags booléens.
     */
    public function up(): void
    {
        $schema = Schema::connection('pgsql');

        if (! $schema->hasTable('periodes_evaluation')) {
            return;
        }

        if (! $schema->hasColumn('periodes_evaluation', 'statut')) {
            return;
        }

        $connection = DB::connection('pgsql');

        // Backfill des statuts legacy vers les statuts canoniques.
        $connection->statement(<<<'SQL'
UPDATE periodes_evaluation
SET statut = CASE
    WHEN statut IS NULL THEN 'planifiee'
    WHEN LOWER(TRIM(statut::text)) = 'active' THEN 'ouverte'
    WHEN LOWER(TRIM(statut::text)) = 'terminee' THEN 'archivee'
    WHEN LOWER(TRIM(statut::text)) = 'cloturee' THEN 'fermee'
    WHEN LOWER(TRIM(statut::text)) IN ('planifiee', 'ouverte', 'fermee', 'archivee') THEN LOWER(TRIM(statut::text))
    ELSE 'planifiee'
END
WHERE statut IS NULL
   OR LOWER(TRIM(statut::text)) NOT IN ('planifiee', 'ouverte', 'fermee', 'archivee')
   OR statut::text <> LOWER(TRIM(statut::text));
SQL);

        // Synchronisation des flags selon le statut canonique.
        if ($schema->hasColumn('periodes_evaluation', 'est_ouverte')) {
            $connection->statement(<<<'SQL'
UPDATE periodes_evaluation
SET est_ouverte = (statut = 'ouverte')
WHERE est_ouverte IS DISTINCT FROM (statut = 'ouverte');
SQL);
        }

        if ($schema->hasColumn('periodes_evaluation', 'est_cloturee')) {
            $connection->statement(<<<'SQL'
UPDATE periodes_evaluation
SET est_cloturee = (statut IN ('fermee', 'archivee'))
WHERE est_cloturee IS DISTINCT FROM (statut IN ('fermee', 'archivee'));
SQL);
        }
    }

    /**
     * Reverse the migrations.
     * Migration de données non réversible de manière fiable.
     */
    public function down(): void
    {
        // Intentionnellement vide.
    }
};
