<?php

namespace App\Console\Commands;

use App\Models\Core\CoreModel;
use App\Models\Business\BusinessModel;
use App\Models\Analytics\AnalyticsModel;
use Illuminate\Console\Command;

class TestDatabaseConnections extends Command
{
    /**
     * Le nom et la signature de la commande console.
     *
     * @var string
     */
    protected $signature = 'db:test-connections';

    /**
     * La description de la commande console.
     *
     * @var string
     */
    protected $description = 'Teste les connexions aux bases de données MySQL, PostgreSQL et ClickHouse';

    /**
     * Exécute la commande console.
     */
    public function handle()
    {
        $this->info('Vérification des connexions aux bases de données...');

        // Test MySQL (Core)
        $this->output->write('MySQL (Core): ');
        if (CoreModel::testConnection()) {
            $this->info('✅ Connecté');
        } else {
            $this->error('❌ Échec de connexion');
        }

        // Test PostgreSQL (Business)
        $this->output->write('PostgreSQL (Business): ');
        if (BusinessModel::testConnection()) {
            $this->info('✅ Connecté');
        } else {
            $this->error('❌ Échec de connexion');
        }

        // Test ClickHouse (Analytics)
        $this->output->write('ClickHouse (Analytics): ');
        if (AnalyticsModel::testConnection()) {
            $this->info('✅ Connecté');
        } else {
            $this->error('❌ Échec de connexion');
        }

        return Command::SUCCESS;
    }
}
