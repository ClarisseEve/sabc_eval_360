<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     * Architecture multi-bases de données SABC Eval360
     */
    public function run(): void
    {
        $this->command->info('🌱 Démarrage du seeding multi-bases de données SABC Eval360...');
        
        // 1. MySQL (Core) - Données critiques
        $this->command->info('🔄 Seeding MySQL (Core Database)...');
        $this->call([
            CoreSeeder::class,
        ]);
        
        // 2. PostgreSQL (Business) - Logique métier
        $this->command->info('🔄 Seeding PostgreSQL (Business Database)...');
        $this->call([
            BusinessSeeder::class,
            EvaluationPermissionsSeeder::class,
            TemplateSeeder::class,
            ReglesEvaluationSeeder::class,
        ]);
        
        // 3. ClickHouse (Analytics) - Données analytiques
        $this->command->info('🔄 Seeding ClickHouse (Analytics Database)...');
        $this->call([
            AnalyticsSeeder::class,
        ]);
        
        $this->command->info('✅ Seeding multi-bases de données terminé avec succès !');
    }
}
