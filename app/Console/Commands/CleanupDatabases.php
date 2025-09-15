<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

class CleanupDatabases extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'cleanup:databases 
                            {--connection=all : Connexion à nettoyer (mysql, pgsql, clickhouse, all)}
                            {--force : Forcer la suppression sans confirmation}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Nettoie les bases de données selon l\'architecture multi-DB (supprime les tables inappropriées)';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $connection = $this->option('connection');
        $force = $this->option('force');

        $this->info('🧹 Nettoyage des bases de données selon l\'architecture multi-DB...');
        $this->newLine();

        if (!$force) {
            $this->warn('⚠️  ATTENTION : Cette opération va supprimer des tables existantes !');
            if (!$this->confirm('Voulez-vous continuer ?')) {
                $this->info('❌ Nettoyage annulé.');
                return Command::SUCCESS;
            }
        }

        try {
            switch ($connection) {
                case 'mysql':
                    $this->cleanupMysql();
                    break;
                
                case 'pgsql':
                    $this->cleanupPostgres();
                    break;
                
                case 'clickhouse':
                    $this->cleanupClickhouse();
                    break;
                
                case 'all':
                default:
                    $this->cleanupMysql();
                    $this->cleanupPostgres();
                    $this->cleanupClickhouse();
                    break;
            }

            $this->newLine();
            $this->info('✅ Nettoyage terminé avec succès !');
            
        } catch (\Exception $e) {
            $this->error('❌ Erreur lors du nettoyage : ' . $e->getMessage());
            return Command::FAILURE;
        }

        return Command::SUCCESS;
    }

    /**
     * Nettoie MySQL - Garde seulement les tables Core
     */
    private function cleanupMysql()
    {
        $this->info('🧹 Nettoyage MySQL (Core Database)...');
        
        // Tables à conserver dans MySQL
        $tablesToKeep = [
            'migrations',
            'utilisateurs',
            'regions',
            'branches', 
            'roles',
            'logs_administration',
            'failed_jobs',
            'sessions',
            'cache',
            'cache_locks'
        ];

        $existingTables = Schema::connection('mysql')->getTableListing();
        $tablesToDrop = [];

        foreach ($existingTables as $table) {
            $tableName = str_replace('sabc_core.', '', $table);
            if (!in_array($tableName, $tablesToKeep)) {
                $tablesToDrop[] = $tableName;
            }
        }

        if (!empty($tablesToDrop)) {
            DB::connection('mysql')->statement('SET FOREIGN_KEY_CHECKS=0');
            
            foreach ($tablesToDrop as $table) {
                try {
                    Schema::connection('mysql')->dropIfExists($table);
                    $this->line("  🗑️  Supprimé : {$table}");
                } catch (\Exception $e) {
                    $this->warn("  ⚠️  Erreur suppression {$table} : {$e->getMessage()}");
                }
            }
            
            DB::connection('mysql')->statement('SET FOREIGN_KEY_CHECKS=1');
            $this->line("  ✅ MySQL nettoyé : " . count($tablesToDrop) . " tables supprimées");
        } else {
            $this->line("  ✅ MySQL déjà propre");
        }
    }

    /**
     * Nettoie PostgreSQL - Garde seulement les tables Business
     */
    private function cleanupPostgres()
    {
        $this->info('🧹 Nettoyage PostgreSQL (Business Database)...');
        
        // Tables à conserver dans PostgreSQL
        $tablesToKeep = [
            'migrations',
            'evaluations',
            'regles_evaluation',
            'periodes_evaluation',
            'notifications',
            'remplacements_temporaires'
        ];

        $existingTables = Schema::connection('pgsql')->getTableListing();
        $tablesToDrop = [];

        foreach ($existingTables as $table) {
            $tableName = str_replace('public.', '', $table);
            if (!in_array($tableName, $tablesToKeep)) {
                $tablesToDrop[] = $tableName;
            }
        }

        if (!empty($tablesToDrop)) {
            foreach ($tablesToDrop as $table) {
                try {
                    DB::connection('pgsql')->statement("DROP TABLE IF EXISTS {$table} CASCADE");
                    $this->line("  🗑️  Supprimé : {$table}");
                } catch (\Exception $e) {
                    $this->warn("  ⚠️  Erreur suppression {$table} : {$e->getMessage()}");
                }
            }
            
            $this->line("  ✅ PostgreSQL nettoyé : " . count($tablesToDrop) . " tables supprimées");
        } else {
            $this->line("  ✅ PostgreSQL déjà propre");
        }
    }

    /**
     * Nettoie ClickHouse - Garde seulement les tables Analytics
     */
    private function cleanupClickhouse()
    {
        $this->info('🧹 Nettoyage ClickHouse (Analytics Database)...');
        
        try {
            // ClickHouse utilise une structure différente, nous ne nettoyons que si nécessaire
            $this->line("  ✅ ClickHouse géré par scripts SQL dédiés");
        } catch (\Exception $e) {
            $this->warn("  ⚠️  Erreur ClickHouse : {$e->getMessage()}");
        }
    }
}
