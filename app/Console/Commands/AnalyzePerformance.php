<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class AnalyzePerformance extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'analyze:performance 
                            {--connection=all : Connexion à analyser (mysql, pgsql, clickhouse, all)}
                            {--detailed : Afficher des informations détaillées}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Analyse les performances des bases de données et fournit des recommandations';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $connection = $this->option('connection');
        $detailed = $this->option('detailed');

        $this->info('🔍 Analyse des performances des bases de données...');
        $this->newLine();

        try {
            switch ($connection) {
                case 'mysql':
                    $this->analyzeMysql($detailed);
                    break;
                
                case 'pgsql':
                    $this->analyzePostgres($detailed);
                    break;
                
                case 'clickhouse':
                    $this->analyzeClickhouse($detailed);
                    break;
                
                case 'all':
                default:
                    $this->analyzeMysql($detailed);
                    $this->analyzePostgres($detailed);
                    $this->analyzeClickhouse($detailed);
                    break;
            }

            $this->newLine();
            $this->info('✅ Analyse terminée !');
            
        } catch (\Exception $e) {
            $this->error('❌ Erreur lors de l\'analyse : ' . $e->getMessage());
            Log::error('Performance analysis error: ' . $e->getMessage());
            return Command::FAILURE;
        }

        return Command::SUCCESS;
    }

    /**
     * Analyse les performances de MySQL
     */
    private function analyzeMysql(bool $detailed)
    {
        $this->info('🔍 Analyse MySQL (Core Database)...');
        
        try {
            // Tester la connexion
            $startTime = microtime(true);
            $result = DB::connection('mysql')->select('SELECT 1 as test');
            $connectionTime = round((microtime(true) - $startTime) * 1000, 2);
            
            // Statistiques des tables principales
            $tables = ['utilisateurs', 'roles', 'regions', 'branches', 'logs_administration'];
            $tableStats = [];
            
            foreach ($tables as $table) {
                try {
                    $count = DB::connection('mysql')->table($table)->count();
                    $tableStats[] = [$table, $count];
                } catch (\Exception $e) {
                    $tableStats[] = [$table, 'Erreur: ' . $e->getMessage()];
                }
            }
            
            $this->table(['Table', 'Nombre d\'enregistrements'], $tableStats);
            $this->line("⏱️  Temps de connexion : {$connectionTime}ms");
            
            if ($detailed) {
                // Informations détaillées sur les index
                $this->line("\n📊 Informations détaillées MySQL :");
                try {
                    $processlist = DB::connection('mysql')->select('SHOW PROCESSLIST');
                    $this->line("🔗 Connexions actives : " . count($processlist));
                } catch (\Exception $e) {
                    $this->line("⚠️  Impossible de récupérer la liste des processus");
                }
            }
            
        } catch (\Exception $e) {
            $this->error("❌ Erreur MySQL : " . $e->getMessage());
        }
        
        $this->newLine();
    }

    /**
     * Analyse les performances de PostgreSQL
     */
    private function analyzePostgres(bool $detailed)
    {
        $this->info('🔍 Analyse PostgreSQL (Business Database)...');
        
        try {
            // Tester la connexion
            $startTime = microtime(true);
            $result = DB::connection('pgsql')->select('SELECT 1 as test');
            $connectionTime = round((microtime(true) - $startTime) * 1000, 2);
            
            // Statistiques des tables principales
            $tables = ['evaluations', 'regles_evaluation', 'periodes_evaluation', 'notifications', 'remplacements_temporaires'];
            $tableStats = [];
            
            foreach ($tables as $table) {
                try {
                    $count = DB::connection('pgsql')->table($table)->count();
                    $tableStats[] = [$table, $count];
                } catch (\Exception $e) {
                    $tableStats[] = [$table, 'Table n\'existe pas encore'];
                }
            }
            
            $this->table(['Table', 'Nombre d\'enregistrements'], $tableStats);
            $this->line("⏱️  Temps de connexion : {$connectionTime}ms");
            
            if ($detailed) {
                // Informations détaillées
                $this->line("\n📊 Informations détaillées PostgreSQL :");
                try {
                    $version = DB::connection('pgsql')->select('SELECT version()')[0]->version;
                    $this->line("📋 Version : " . substr($version, 0, 50) . "...");
                } catch (\Exception $e) {
                    $this->line("⚠️  Impossible de récupérer la version");
                }
            }
            
        } catch (\Exception $e) {
            $this->error("❌ Erreur PostgreSQL : " . $e->getMessage());
        }
        
        $this->newLine();
    }

    /**
     * Analyse les performances de ClickHouse
     */
    private function analyzeClickhouse(bool $detailed)
    {
        $this->info('🔍 Analyse ClickHouse (Analytics Database)...');
        
        try {
            // Tester la connexion
            $startTime = microtime(true);
            $result = DB::connection('clickhouse')->select('SELECT 1 as test');
            $connectionTime = round((microtime(true) - $startTime) * 1000, 2);
            
            // Statistiques des tables principales
            $tables = ['evaluations_analytics', 'performance_region', 'performance_branche'];
            $tableStats = [];
            
            foreach ($tables as $table) {
                try {
                    $count = DB::connection('clickhouse')->select("SELECT count() as count FROM sabc_analytics.{$table}")[0]->count ?? 0;
                    $tableStats[] = [$table, $count];
                } catch (\Exception $e) {
                    $tableStats[] = [$table, 'Table n\'existe pas encore'];
                }
            }
            
            $this->table(['Table', 'Nombre d\'enregistrements'], $tableStats);
            $this->line("⏱️  Temps de connexion : {$connectionTime}ms");
            
            if ($detailed) {
                // Informations détaillées
                $this->line("\n📊 Informations détaillées ClickHouse :");
                try {
                    $version = DB::connection('clickhouse')->select('SELECT version()')[0]->{'version()'} ?? 'Inconnue';
                    $this->line("📋 Version : {$version}");
                } catch (\Exception $e) {
                    $this->line("⚠️  Impossible de récupérer la version");
                }
            }
            
        } catch (\Exception $e) {
            $this->error("❌ Erreur ClickHouse : " . $e->getMessage());
        }
        
        $this->newLine();
    }
}
