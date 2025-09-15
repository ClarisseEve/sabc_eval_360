<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Services\DatabaseSyncService;

class SyncDatabases extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'sync:databases 
                            {--type=all : Type de synchronisation (mysql-to-postgres, postgres-to-clickhouse, all)}
                            {--limit=100 : Nombre maximum d\'enregistrements à synchroniser}
                            {--period=day : Période pour l\'analytique (day, week)}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Synchronise les données entre les bases de données MySQL, PostgreSQL et ClickHouse';

    /**
     * Execute the console command.
     */
    public function handle(DatabaseSyncService $syncService)
    {
        $type = $this->option('type');
        $limit = (int) $this->option('limit');
        $period = $this->option('period');

        $this->info('Démarrage de la synchronisation des bases de données...');
        $this->newLine();

        try {
            switch ($type) {
                case 'mysql-to-postgres':
                    $this->syncMysqlToPostgres($syncService, $limit);
                    break;
                
                case 'postgres-to-clickhouse':
                    $this->syncPostgresToClickhouse($syncService, $period);
                    break;
                
                case 'all':
                default:
                    $this->syncMysqlToPostgres($syncService, $limit);
                    $this->syncPostgresToClickhouse($syncService, $period);
                    break;
            }

            $this->newLine();
            $this->info('✅ Synchronisation terminée avec succès !');
            
        } catch (\Exception $e) {
            $this->error('❌ Erreur lors de la synchronisation : ' . $e->getMessage());
            $this->line('Trace : ' . $e->getTraceAsString());
            return Command::FAILURE;
        }

        return Command::SUCCESS;
    }

    /**
     * Synchronise MySQL vers PostgreSQL
     */
    private function syncMysqlToPostgres(DatabaseSyncService $syncService, int $limit)
    {
        $this->info('🔄 Synchronisation MySQL → PostgreSQL...');
        
        $stats = $syncService->syncCoreDataToPostgres($limit);
        
        $this->table(
            ['Métrique', 'Valeur'],
            [
                ['Traités', $stats['processed']],
                ['Synchronisés', $stats['synced']],
                ['Erreurs', $stats['errors']],
                ['Message', $stats['message'] ?? 'Aucun message']
            ]
        );
    }

    /**
     * Synchronise PostgreSQL vers ClickHouse
     */
    private function syncPostgresToClickhouse(DatabaseSyncService $syncService, string $period)
    {
        $this->info('🔄 Synchronisation PostgreSQL → ClickHouse...');
        
        $stats = $syncService->syncAnalyticsToClickHouse($period);
        
        $this->table(
            ['Métrique', 'Valeur'],
            [
                ['Traités', $stats['processed']],
                ['Synchronisés', $stats['synced']],
                ['Erreurs', $stats['errors']],
                ['Période', $period],
                ['Message', $stats['message'] ?? 'Aucun message']
            ]
        );
    }
}
