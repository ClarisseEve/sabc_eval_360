<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use App\Models\Utilisateur;
use App\Models\Region;
use App\Models\Branche;
use App\Models\Role;

class SeedMultiDatabase extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'seed:multi-db 
                            {--fresh : Vider les tables avant de les remplir}
                            {--connection=all : Connexion à alimenter (mysql, pgsql, clickhouse, all)}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Alimente les bases de données avec des données de test pour l\'architecture multi-DB';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $fresh = $this->option('fresh');
        $connection = $this->option('connection');

        $this->info('🌱 Initialisation des données de test multi-bases...');
        $this->newLine();

        try {
            if ($fresh) {
                $this->warn('⚠️  Mode fresh : Suppression des données existantes...');
                $this->truncateTables($connection);
                $this->newLine();
            }

            switch ($connection) {
                case 'mysql':
                    $this->seedMysql();
                    break;
                
                case 'pgsql':
                    $this->seedPostgres();
                    break;
                
                case 'clickhouse':
                    $this->seedClickhouse();
                    break;
                
                case 'all':
                default:
                    $this->seedMysql();
                    $this->seedPostgres();
                    $this->seedClickhouse();
                    break;
            }

            $this->newLine();
            $this->info('✅ Initialisation terminée avec succès !');
            
        } catch (\Exception $e) {
            $this->error('❌ Erreur lors de l\'initialisation : ' . $e->getMessage());
            return Command::FAILURE;
        }

        return Command::SUCCESS;
    }

    /**
     * Vide les tables selon la connexion
     */
    private function truncateTables(string $connection)
    {
        if ($connection === 'mysql' || $connection === 'all') {
            DB::connection('mysql')->statement('SET FOREIGN_KEY_CHECKS=0');
            DB::connection('mysql')->table('utilisateurs')->truncate();
            DB::connection('mysql')->table('regions')->truncate();
            DB::connection('mysql')->table('branches')->truncate();
            DB::connection('mysql')->table('roles')->truncate();
            DB::connection('mysql')->statement('SET FOREIGN_KEY_CHECKS=1');
            $this->line('🗑️  Tables MySQL vidées');
        }

        if ($connection === 'pgsql' || $connection === 'all') {
            try {
                DB::connection('pgsql')->table('evaluations')->truncate();
                DB::connection('pgsql')->table('notifications')->truncate();
                $this->line('🗑️  Tables PostgreSQL vidées');
            } catch (\Exception $e) {
                $this->line('⚠️  Certaines tables PostgreSQL n\'existent pas encore');
            }
        }

        if ($connection === 'clickhouse' || $connection === 'all') {
            try {
                DB::connection('clickhouse')->statement('TRUNCATE TABLE sabc_analytics.evaluations_analytics');
                DB::connection('clickhouse')->statement('TRUNCATE TABLE sabc_analytics.performance_region');
                $this->line('🗑️  Tables ClickHouse vidées');
            } catch (\Exception $e) {
                $this->line('⚠️  Certaines tables ClickHouse n\'existent pas encore');
            }
        }
    }

    /**
     * Alimente MySQL avec des données de base
     */
    private function seedMysql()
    {
        $this->info('🌱 Alimentation MySQL (Core)...');

        // Créer les régions
        $regions = [
            ['id_region' => 'RG-01', 'nom_region' => 'Littoral', 'est_taniere' => true],
            ['id_region' => 'RG-02', 'nom_region' => 'Centre', 'est_taniere' => true],
            ['id_region' => 'RG-03', 'nom_region' => 'Ouest', 'est_taniere' => false],
            ['id_region' => 'RG-04', 'nom_region' => 'Nord', 'est_taniere' => false],
        ];

        foreach ($regions as $regionData) {
            Region::updateOrCreate(
                ['id_region' => $regionData['id_region']], 
                $regionData
            );
        }
        $this->line('✅ Régions créées : ' . count($regions));

        // Créer les branches
        $branches = [
            ['id_branche' => 'BR-01', 'nom_branche' => 'Commercial', 'description' => 'Branche commerciale'],
            ['id_branche' => 'BR-02', 'nom_branche' => 'Marketing', 'description' => 'Branche marketing'],
            ['id_branche' => 'BR-03', 'nom_branche' => 'Support', 'description' => 'Branche support'],
        ];

        foreach ($branches as $brancheData) {
            Branche::updateOrCreate(
                ['id_branche' => $brancheData['id_branche']], 
                $brancheData
            );
        }
        $this->line('✅ Branches créées : ' . count($branches));

        // Créer les rôles
        $roles = [
            [
                'id_role' => 'RL-01', 
                'nom_role' => 'DR', 
                'description' => 'Directeur Régional',
                'id_branche' => 'BR-01',
                'niveau_taniere' => 1,
                'niveau_non_taniere' => 1,
                'peut_auto_evaluer' => false,
                'peut_evaluer_pairs' => false,
                'peut_evaluer_subordonnes' => true,
                'peut_cross_branch' => true,
            ],
            [
                'id_role' => 'RL-02', 
                'nom_role' => 'CDTT', 
                'description' => 'Chef Département Trade',
                'id_branche' => 'BR-01',
                'niveau_taniere' => 2,
                'niveau_non_taniere' => null,
                'peut_auto_evaluer' => false,
                'peut_evaluer_pairs' => false,
                'peut_evaluer_subordonnes' => true,
                'peut_cross_branch' => true,
            ],
            [
                'id_role' => 'RL-03', 
                'nom_role' => 'CSC', 
                'description' => 'Chef Service Commercial',
                'id_branche' => 'BR-01',
                'niveau_taniere' => 3,
                'niveau_non_taniere' => 2,
                'peut_auto_evaluer' => true,
                'peut_evaluer_pairs' => true,
                'peut_evaluer_subordonnes' => true,
                'peut_cross_branch' => false,
            ],
        ];

        foreach ($roles as $roleData) {
            Role::updateOrCreate(
                ['id_role' => $roleData['id_role']], 
                $roleData
            );
        }
        $this->line('✅ Rôles créés : ' . count($roles));

        // Créer un utilisateur admin de test
        $adminData = [
            'matricule' => 'US-01',
            'nom' => 'Admin',
            'prenom' => 'System',
            'email' => 'admin@sabc.cm',
            'password' => Hash::make('password'),
            'role' => 'DR',
            'niveau_hierarchique' => 1,
            'id_region' => 'RG-01',
            'id_branche' => 'BR-01',
            'est_actif' => true,
            'est_admin' => true,
            'region_nom' => 'Littoral',
            'role_nom' => 'DR',
            'type_region' => 'taniere',
        ];

        Utilisateur::updateOrCreate(
            ['matricule' => $adminData['matricule']], 
            $adminData
        );
        $this->line('✅ Utilisateur admin créé : ' . $adminData['email']);
    }

    /**
     * Alimente PostgreSQL avec des données de test
     */
    private function seedPostgres()
    {
        $this->info('🌱 Alimentation PostgreSQL (Business)...');
        
        // Pour l'instant, PostgreSQL sera alimenté via la synchronisation
        // depuis MySQL, donc nous n'avons pas besoin de créer des données directement
        
        $this->line('✅ PostgreSQL sera alimenté via la synchronisation MySQL');
    }

    /**
     * Alimente ClickHouse avec des données de test
     */
    private function seedClickhouse()
    {
        $this->info('🌱 Alimentation ClickHouse (Analytics)...');
        
        // Pour l'instant, ClickHouse sera alimenté via la synchronisation
        // depuis PostgreSQL, donc nous n'avons pas besoin de créer des données directement
        
        $this->line('✅ ClickHouse sera alimenté via la synchronisation PostgreSQL');
    }
}
