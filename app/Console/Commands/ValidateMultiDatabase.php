<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use App\Models\Utilisateur;
use App\Models\Region;
use App\Models\Branche;
use App\Models\Role;

class ValidateMultiDatabase extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'validate:multi-db 
                            {--detailed : Afficher des informations détaillées}
                            {--fix : Tenter de corriger les problèmes détectés}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Valide la configuration et l\'intégrité de l\'architecture multi-bases de données';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $detailed = $this->option('detailed');
        $fix = $this->option('fix');

        $this->info('🔍 Validation de l\'architecture multi-bases de données...');
        $this->newLine();

        $issues = [];
        $warnings = [];
        $success = [];

        try {
            // 1. Test des connexions
            $this->info('📡 Test des connexions...');
            $connectionResults = $this->testConnections();
            
            foreach ($connectionResults as $connection => $result) {
                if ($result['success']) {
                    $success[] = "✅ Connexion {$connection} : OK ({$result['time']}ms)";
                } else {
                    $issues[] = "❌ Connexion {$connection} : ÉCHEC - {$result['error']}";
                }
            }

            // 2. Validation des modèles et connexions
            $this->info('🔧 Validation des modèles...');
            $modelResults = $this->validateModels();
            
            foreach ($modelResults as $result) {
                if ($result['success']) {
                    $success[] = $result['message'];
                } else {
                    if ($result['severity'] === 'warning') {
                        $warnings[] = $result['message'];
                    } else {
                        $issues[] = $result['message'];
                    }
                }
            }

            // 3. Validation de l'intégrité des données
            $this->info('📊 Validation de l\'intégrité des données...');
            $dataResults = $this->validateDataIntegrity();
            
            foreach ($dataResults as $result) {
                if ($result['success']) {
                    $success[] = $result['message'];
                } else {
                    if ($result['severity'] === 'warning') {
                        $warnings[] = $result['message'];
                    } else {
                        $issues[] = $result['message'];
                    }
                }
            }

            // 4. Test des services de synchronisation
            $this->info('🔄 Test des services de synchronisation...');
            $syncResults = $this->testSyncServices();
            
            foreach ($syncResults as $result) {
                if ($result['success']) {
                    $success[] = $result['message'];
                } else {
                    $warnings[] = $result['message'];
                }
            }

            // Affichage des résultats
            $this->displayResults($success, $warnings, $issues, $detailed);

            // Tentative de correction si demandée
            if ($fix && !empty($issues)) {
                $this->info('🔧 Tentative de correction des problèmes...');
                $this->attemptFixes($issues);
            }

        } catch (\Exception $e) {
            $this->error('❌ Erreur lors de la validation : ' . $e->getMessage());
            return Command::FAILURE;
        }

        // Déterminer le code de retour
        if (!empty($issues)) {
            $this->error('❌ Validation échouée avec des erreurs critiques.');
            return Command::FAILURE;
        } elseif (!empty($warnings)) {
            $this->warn('⚠️  Validation terminée avec des avertissements.');
            return Command::SUCCESS;
        } else {
            $this->info('✅ Validation réussie ! Architecture multi-DB opérationnelle.');
            return Command::SUCCESS;
        }
    }

    /**
     * Test les connexions aux trois bases de données
     */
    private function testConnections(): array
    {
        $connections = ['mysql', 'pgsql', 'clickhouse'];
        $results = [];

        foreach ($connections as $connection) {
            try {
                $startTime = microtime(true);
                DB::connection($connection)->getPdo();
                $endTime = microtime(true);
                
                $results[$connection] = [
                    'success' => true,
                    'time' => round(($endTime - $startTime) * 1000, 2)
                ];
            } catch (\Exception $e) {
                $results[$connection] = [
                    'success' => false,
                    'error' => $e->getMessage()
                ];
            }
        }

        return $results;
    }

    /**
     * Valide que les modèles utilisent les bonnes connexions
     */
    private function validateModels(): array
    {
        $results = [];
        
        // Modèles Core (MySQL)
        $coreModels = [
            Utilisateur::class => 'mysql',
            Region::class => 'mysql',
            Branche::class => 'mysql',
            Role::class => 'mysql',
        ];

        foreach ($coreModels as $modelClass => $expectedConnection) {
            try {
                $model = new $modelClass();
                $actualConnection = $model->getConnectionName();
                
                if ($actualConnection === $expectedConnection) {
                    $results[] = [
                        'success' => true,
                        'message' => "✅ {$modelClass} utilise la connexion {$expectedConnection}"
                    ];
                } else {
                    $results[] = [
                        'success' => false,
                        'severity' => 'error',
                        'message' => "❌ {$modelClass} utilise {$actualConnection} au lieu de {$expectedConnection}"
                    ];
                }
            } catch (\Exception $e) {
                $results[] = [
                    'success' => false,
                    'severity' => 'error',
                    'message' => "❌ Erreur avec {$modelClass} : {$e->getMessage()}"
                ];
            }
        }

        return $results;
    }

    /**
     * Valide l'intégrité des données
     */
    private function validateDataIntegrity(): array
    {
        $results = [];

        try {
            // Vérifier les données de base
            $userCount = Utilisateur::count();
            $regionCount = Region::count();
            $brancheCount = Branche::count();
            $roleCount = Role::count();

            $results[] = [
                'success' => true,
                'message' => "📊 Données MySQL : {$userCount} utilisateurs, {$regionCount} régions, {$brancheCount} branches, {$roleCount} rôles"
            ];

            // Vérifier les relations
            if ($userCount > 0) {
                $usersWithoutRegion = Utilisateur::whereNotIn('id_region', Region::pluck('id_region'))->count();
                $usersWithoutBranche = Utilisateur::whereNotIn('id_branche', Branche::pluck('id_branche'))->count();

                if ($usersWithoutRegion > 0) {
                    $results[] = [
                        'success' => false,
                        'severity' => 'warning',
                        'message' => "⚠️  {$usersWithoutRegion} utilisateurs avec région invalide"
                    ];
                }

                if ($usersWithoutBranche > 0) {
                    $results[] = [
                        'success' => false,
                        'severity' => 'warning',
                        'message' => "⚠️  {$usersWithoutBranche} utilisateurs avec branche invalide"
                    ];
                }

                if ($usersWithoutRegion === 0 && $usersWithoutBranche === 0) {
                    $results[] = [
                        'success' => true,
                        'message' => "✅ Intégrité référentielle des utilisateurs : OK"
                    ];
                }
            }

        } catch (\Exception $e) {
            $results[] = [
                'success' => false,
                'severity' => 'error',
                'message' => "❌ Erreur validation intégrité : {$e->getMessage()}"
            ];
        }

        return $results;
    }

    /**
     * Test les services de synchronisation
     */
    private function testSyncServices(): array
    {
        $results = [];

        try {
            // Test du service de synchronisation
            $syncService = app(\App\Services\DatabaseSyncService::class);
            
            $results[] = [
                'success' => true,
                'message' => "✅ Service de synchronisation : Instancié avec succès"
            ];

            // Test des méthodes de synchronisation (sans exécution réelle)
            if (method_exists($syncService, 'syncCoreDataToPostgres')) {
                $results[] = [
                    'success' => true,
                    'message' => "✅ Méthode syncCoreDataToPostgres : Disponible"
                ];
            } else {
                $results[] = [
                    'success' => false,
                    'message' => "❌ Méthode syncCoreDataToPostgres : Manquante"
                ];
            }

            if (method_exists($syncService, 'syncAnalyticsToClickHouse')) {
                $results[] = [
                    'success' => true,
                    'message' => "✅ Méthode syncAnalyticsToClickHouse : Disponible"
                ];
            } else {
                $results[] = [
                    'success' => false,
                    'message' => "❌ Méthode syncAnalyticsToClickHouse : Manquante"
                ];
            }

        } catch (\Exception $e) {
            $results[] = [
                'success' => false,
                'message' => "❌ Erreur service synchronisation : {$e->getMessage()}"
            ];
        }

        return $results;
    }

    /**
     * Affiche les résultats de validation
     */
    private function displayResults(array $success, array $warnings, array $issues, bool $detailed)
    {
        $this->newLine();
        $this->info('📋 Résultats de la validation :');
        $this->newLine();

        if (!empty($success)) {
            $this->info('✅ Succès (' . count($success) . ') :');
            foreach ($success as $message) {
                if ($detailed) {
                    $this->line("  {$message}");
                }
            }
            if (!$detailed && count($success) > 0) {
                $this->line("  " . count($success) . " vérifications réussies");
            }
            $this->newLine();
        }

        if (!empty($warnings)) {
            $this->warn('⚠️  Avertissements (' . count($warnings) . ') :');
            foreach ($warnings as $message) {
                $this->line("  {$message}");
            }
            $this->newLine();
        }

        if (!empty($issues)) {
            $this->error('❌ Erreurs (' . count($issues) . ') :');
            foreach ($issues as $message) {
                $this->line("  {$message}");
            }
            $this->newLine();
        }
    }

    /**
     * Tente de corriger automatiquement certains problèmes
     */
    private function attemptFixes(array $issues)
    {
        $this->warn('🔧 Correction automatique non implémentée pour le moment.');
        $this->line('Les problèmes détectés nécessitent une intervention manuelle.');
    }
}
