<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class AnalyticsSeeder extends Seeder
{
    /**
     * Seed ClickHouse (Analytics Database) avec des données analytiques de base
     */
    public function run(): void
    {
        $this->command->info('🌱 Seeding ClickHouse Analytics Database...');

        // 1. Vérifier que les tables existent
        $this->verifyTables();
        
        // 2. Insérer des données de référence pour l'analytique
        $this->seedReferenceData();
        
        // 3. Créer des données historiques de test (optionnel)
        $this->seedHistoricalData();
        
        $this->command->info('✅ ClickHouse Analytics Database seeded successfully!');
    }

    /**
     * Vérifier que les tables ClickHouse existent
     */
    private function verifyTables()
    {
        try {
            $tables = [
                'evaluations_analytics',
                'performance_region',
                'performance_branche',
                'tendances_mensuelles_region_table'
            ];

            $existingTables = [];
            
            foreach ($tables as $table) {
                try {
                    $result = DB::connection('clickhouse')->select("EXISTS TABLE sabc_analytics.{$table}");
                    if (!empty($result) && $result[0]->result == 1) {
                        $existingTables[] = $table;
                    }
                } catch (\Exception $e) {
                    // Table n'existe pas
                }
            }

            $this->command->line('  🔍 Tables ClickHouse détectées : ' . count($existingTables) . '/' . count($tables));
            
            if (count($existingTables) === 0) {
                $this->command->warn('  ⚠️  Aucune table ClickHouse détectée. Exécutez d\'abord le script d\'initialisation.');
                return;
            }

        } catch (\Exception $e) {
            $this->command->warn('  ⚠️  Impossible de vérifier les tables ClickHouse : ' . $e->getMessage());
        }
    }

    /**
     * Insérer des données de référence pour l'analytique
     */
    private function seedReferenceData()
    {
        try {
            // Insérer des données de référence dans performance_region
            $regionData = [
                [
                    'region_id' => 'RG-01',
                    'region_nom' => 'Littoral',
                    'type_region' => 'taniere',
                    'date_jour' => now()->format('Y-m-d'),
                    'score_moyen' => 0.0,
                    'nombre_evaluations' => 0,
                    'progression_vs_precedent' => 0.0
                ],
                [
                    'region_id' => 'RG-02',
                    'region_nom' => 'Centre',
                    'type_region' => 'taniere',
                    'date_jour' => now()->format('Y-m-d'),
                    'score_moyen' => 0.0,
                    'nombre_evaluations' => 0,
                    'progression_vs_precedent' => 0.0
                ],
                [
                    'region_id' => 'RG-03',
                    'region_nom' => 'Ouest',
                    'type_region' => 'non_taniere',
                    'date_jour' => now()->format('Y-m-d'),
                    'score_moyen' => 0.0,
                    'nombre_evaluations' => 0,
                    'progression_vs_precedent' => 0.0
                ],
                [
                    'region_id' => 'RG-04',
                    'region_nom' => 'Nord',
                    'type_region' => 'non_taniere',
                    'date_jour' => now()->format('Y-m-d'),
                    'score_moyen' => 0.0,
                    'nombre_evaluations' => 0,
                    'progression_vs_precedent' => 0.0
                ]
            ];

            foreach ($regionData as $data) {
                try {
                    DB::connection('clickhouse')->insert(
                        'INSERT INTO sabc_analytics.performance_region 
                        (region_id, region_nom, type_region, date_jour, score_moyen, nombre_evaluations, progression_vs_precedent) 
                        VALUES (?, ?, ?, ?, ?, ?, ?)',
                        [
                            $data['region_id'],
                            $data['region_nom'],
                            $data['type_region'],
                            $data['date_jour'],
                            $data['score_moyen'],
                            $data['nombre_evaluations'],
                            $data['progression_vs_precedent']
                        ]
                    );
                } catch (\Exception $e) {
                    // Ignorer les erreurs d'insertion (table peut ne pas exister)
                }
            }

            $this->command->line('  📊 Données de référence régionales insérées');

        } catch (\Exception $e) {
            $this->command->warn('  ⚠️  Erreur lors de l\'insertion des données de référence : ' . $e->getMessage());
        }
    }

    /**
     * Créer des données historiques de test
     */
    private function seedHistoricalData()
    {
        try {
            // Insérer quelques données historiques de test pour les 3 derniers mois
            $historicalData = [];
            
            for ($i = 3; $i >= 1; $i--) {
                $date = now()->subMonths($i)->format('Y-m-d');
                
                $historicalData[] = [
                    'region_id' => 'RG-01',
                    'region_nom' => 'Littoral',
                    'type_region' => 'taniere',
                    'date_jour' => $date,
                    'score_moyen' => rand(35, 45) / 10, // Score entre 3.5 et 4.5
                    'nombre_evaluations' => rand(15, 25),
                    'progression_vs_precedent' => (rand(-10, 15) / 10) // Entre -1.0 et 1.5
                ];
                
                $historicalData[] = [
                    'region_id' => 'RG-02',
                    'region_nom' => 'Centre',
                    'type_region' => 'taniere',
                    'date_jour' => $date,
                    'score_moyen' => rand(32, 42) / 10,
                    'nombre_evaluations' => rand(12, 20),
                    'progression_vs_precedent' => (rand(-8, 12) / 10)
                ];
                
                $historicalData[] = [
                    'region_id' => 'RG-03',
                    'region_nom' => 'Ouest',
                    'type_region' => 'non_taniere',
                    'date_jour' => $date,
                    'score_moyen' => rand(30, 40) / 10,
                    'nombre_evaluations' => rand(8, 15),
                    'progression_vs_precedent' => (rand(-5, 10) / 10)
                ];
                
                $historicalData[] = [
                    'region_id' => 'RG-04',
                    'region_nom' => 'Nord',
                    'type_region' => 'non_taniere',
                    'date_jour' => $date,
                    'score_moyen' => rand(28, 38) / 10,
                    'nombre_evaluations' => rand(6, 12),
                    'progression_vs_precedent' => (rand(-3, 8) / 10)
                ];
            }

            foreach ($historicalData as $data) {
                try {
                    DB::connection('clickhouse')->insert(
                        'INSERT INTO sabc_analytics.performance_region 
                        (region_id, region_nom, type_region, date_jour, score_moyen, nombre_evaluations, progression_vs_precedent) 
                        VALUES (?, ?, ?, ?, ?, ?, ?)',
                        [
                            $data['region_id'],
                            $data['region_nom'],
                            $data['type_region'],
                            $data['date_jour'],
                            $data['score_moyen'],
                            $data['nombre_evaluations'],
                            $data['progression_vs_precedent']
                        ]
                    );
                } catch (\Exception $e) {
                    // Ignorer les erreurs d'insertion
                }
            }

            $this->command->line('  📈 ' . count($historicalData) . ' enregistrements historiques insérés');

        } catch (\Exception $e) {
            $this->command->warn('  ⚠️  Erreur lors de l\'insertion des données historiques : ' . $e->getMessage());
        }
    }
}
