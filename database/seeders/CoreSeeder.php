<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use App\Models\Utilisateur;
use App\Models\Region;
use App\Models\Branche;
use App\Models\Role;

class CoreSeeder extends Seeder
{
    /**
     * Seed MySQL (Core Database) avec les données critiques
     */
    public function run(): void
    {
        $this->command->info('🌱 Seeding MySQL Core Database...');

        // 1. Créer les régions selon la logique SABC
        $this->seedRegions();
        
        // 2. Créer les branches organisationnelles
        $this->seedBranches();
        
        // 3. Créer les rôles avec permissions
        $this->seedRoles();
        
        // 4. Créer les utilisateurs de base
        $this->seedUtilisateurs();
        
        $this->command->info('✅ MySQL Core Database seeded successfully!');
    }

    /**
     * Seed les régions selon la logique métier SABC
     */
    private function seedRegions()
    {
        $regions = [
            [
                'id_region' => 'RG-01',
                'nom_region' => 'Littoral',
                'est_taniere' => true,
            ],
            [
                'id_region' => 'RG-02',
                'nom_region' => 'Centre',
                'est_taniere' => true,
            ],
            [
                'id_region' => 'RG-03',
                'nom_region' => 'Ouest',
                'est_taniere' => false,
            ],
            [
                'id_region' => 'RG-04',
                'nom_region' => 'Nord',
                'est_taniere' => false,
            ],
        ];

        foreach ($regions as $regionData) {
            Region::updateOrCreate(
                ['id_region' => $regionData['id_region']], 
                $regionData
            );
        }

        $this->command->line('  📍 ' . count($regions) . ' régions créées');
    }

    /**
     * Seed les branches organisationnelles
     */
    private function seedBranches()
    {
        $branches = [
            [
                'id_branche' => 'BR-01',
                'nom_branche' => 'Commercial',
                'description' => 'Branche commerciale - Vente et distribution',
            ],
            [
                'id_branche' => 'BR-02',
                'nom_branche' => 'Marketing',
                'description' => 'Branche marketing - Trade Marketing et sponsoring',
            ],
            [
                'id_branche' => 'BR-03',
                'nom_branche' => 'Support',
                'description' => 'Branche support - Administration et logistique',
            ],
        ];

        foreach ($branches as $brancheData) {
            Branche::updateOrCreate(
                ['id_branche' => $brancheData['id_branche']], 
                $brancheData
            );
        }

        $this->command->line('  🏢 ' . count($branches) . ' branches créées');
    }

    /**
     * Seed les rôles avec permissions selon la logique SABC
     */
    private function seedRoles()
    {
        $roles = [
            // Rôles de direction
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
                'description' => 'Chef Département Trade (Commercial)',
                'id_branche' => 'BR-01',
                'niveau_taniere' => 2,
                'niveau_non_taniere' => null,
                'peut_auto_evaluer' => false,
                'peut_evaluer_pairs' => false,
                'peut_evaluer_subordonnes' => true,
                'peut_cross_branch' => true,
            ],
            // Rôles commerciaux
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
            [
                'id_role' => 'RL-04',
                'nom_role' => 'CDV',
                'description' => 'Chef District Vente',
                'id_branche' => 'BR-01',
                'niveau_taniere' => 4,
                'niveau_non_taniere' => null,
                'peut_auto_evaluer' => true,
                'peut_evaluer_pairs' => true,
                'peut_evaluer_subordonnes' => true,
                'peut_cross_branch' => false,
            ],
            [
                'id_role' => 'RL-05',
                'nom_role' => 'CDS',
                'description' => 'Chef de Secteur',
                'id_branche' => 'BR-01',
                'niveau_taniere' => 5,
                'niveau_non_taniere' => 3,
                'peut_auto_evaluer' => true,
                'peut_evaluer_pairs' => true,
                'peut_evaluer_subordonnes' => false,
                'peut_cross_branch' => false,
            ],
            // Rôles marketing
            [
                'id_role' => 'RL-06',
                'nom_role' => 'RTM',
                'description' => 'Regional Trade Marketing',
                'id_branche' => 'BR-02',
                'niveau_taniere' => 3,
                'niveau_non_taniere' => null,
                'peut_auto_evaluer' => true,
                'peut_evaluer_pairs' => false,
                'peut_evaluer_subordonnes' => true,
                'peut_cross_branch' => false,
            ],
            [
                'id_role' => 'RL-07',
                'nom_role' => 'TMO',
                'description' => 'Trade Marketing Operator',
                'id_branche' => 'BR-02',
                'niveau_taniere' => 4,
                'niveau_non_taniere' => 3,
                'peut_auto_evaluer' => true,
                'peut_evaluer_pairs' => true,
                'peut_evaluer_subordonnes' => false,
                'peut_cross_branch' => false,
            ],
            [
                'id_role' => 'RL-08',
                'nom_role' => 'SRMO',
                'description' => 'Superviseur Régional Marketing Opérationnel',
                'id_branche' => 'BR-02',
                'niveau_taniere' => null,
                'niveau_non_taniere' => 2,
                'peut_auto_evaluer' => true,
                'peut_evaluer_pairs' => false,
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

        $this->command->line('  👥 ' . count($roles) . ' rôles créés');
    }

    /**
     * Seed les utilisateurs de base pour chaque région
     */
    private function seedUtilisateurs()
    {
        $utilisateurs = [
            // Utilisateur admin système
            [
                'matricule' => 'US-01',
                'nom' => 'Admin',
                'prenom' => 'System',
                'email' => 'admin@sabc.cm',
                'password' => Hash::make('admin123'),
                'role' => 'DR',
                'niveau_hierarchique' => 1,
                'id_region' => 'RG-01',
                'id_branche' => 'BR-01',
                'est_actif' => true,
                'est_admin' => true,
                'region_nom' => 'Littoral',
                'role_nom' => 'DR',
                'type_region' => 'taniere',
            ],
            // DR Littoral (Tanière)
            [
                'matricule' => 'US-02',
                'nom' => 'Mbarga',
                'prenom' => 'Jean',
                'email' => 'jean.mbarga@sabc.cm',
                'password' => Hash::make('***REMOVED***'),
                'role' => 'DR',
                'niveau_hierarchique' => 1,
                'id_region' => 'RG-01',
                'id_branche' => 'BR-01',
                'est_actif' => true,
                'est_admin' => false,
                'region_nom' => 'Littoral',
                'role_nom' => 'DR',
                'type_region' => 'taniere',
            ],
            // DR Centre (Tanière)
            [
                'matricule' => 'US-03',
                'nom' => 'Nkomo',
                'prenom' => 'Marie',
                'email' => 'marie.nkomo@sabc.cm',
                'password' => Hash::make('***REMOVED***'),
                'role' => 'DR',
                'niveau_hierarchique' => 1,
                'id_region' => 'RG-02',
                'id_branche' => 'BR-01',
                'est_actif' => true,
                'est_admin' => false,
                'region_nom' => 'Centre',
                'role_nom' => 'DR',
                'type_region' => 'taniere',
            ],
            // DR Ouest (Non-Tanière)
            [
                'matricule' => 'US-04',
                'nom' => 'Fotso',
                'prenom' => 'Paul',
                'email' => 'paul.fotso@sabc.cm',
                'password' => Hash::make('***REMOVED***'),
                'role' => 'DR',
                'niveau_hierarchique' => 1,
                'id_region' => 'RG-03',
                'id_branche' => 'BR-01',
                'est_actif' => true,
                'est_admin' => false,
                'region_nom' => 'Ouest',
                'role_nom' => 'DR',
                'type_region' => 'non_taniere',
            ],
            // DR Nord (Non-Tanière)
            [
                'matricule' => 'US-05',
                'nom' => 'Bello',
                'prenom' => 'Ahmadou',
                'email' => 'ahmadou.bello@sabc.cm',
                'password' => Hash::make('***REMOVED***'),
                'role' => 'DR',
                'niveau_hierarchique' => 1,
                'id_region' => 'RG-04',
                'id_branche' => 'BR-01',
                'est_actif' => true,
                'est_admin' => false,
                'region_nom' => 'Nord',
                'role_nom' => 'DR',
                'type_region' => 'non_taniere',
            ],
            // CDTT Littoral
            [
                'matricule' => 'US-06',
                'nom' => 'Essomba',
                'prenom' => 'Claude',
                'email' => 'claude.essomba@sabc.cm',
                'password' => Hash::make('***REMOVED***'),
                'role' => 'CDTT',
                'manager_matricule' => 'US-02',
                'niveau_hierarchique' => 2,
                'id_region' => 'RG-01',
                'id_branche' => 'BR-01',
                'est_actif' => true,
                'est_admin' => false,
                'region_nom' => 'Littoral',
                'role_nom' => 'CDTT',
                'type_region' => 'taniere',
            ],
            // CSC Littoral
            [
                'matricule' => 'US-07',
                'nom' => 'Atangana',
                'prenom' => 'Sophie',
                'email' => 'sophie.atangana@sabc.cm',
                'password' => Hash::make('***REMOVED***'),
                'role' => 'CSC',
                'manager_matricule' => 'US-06',
                'niveau_hierarchique' => 3,
                'id_region' => 'RG-01',
                'id_branche' => 'BR-01',
                'est_actif' => true,
                'est_admin' => false,
                'region_nom' => 'Littoral',
                'role_nom' => 'CSC',
                'type_region' => 'taniere',
            ],
        ];

        foreach ($utilisateurs as $userData) {
            Utilisateur::updateOrCreate(
                ['matricule' => $userData['matricule']], 
                $userData
            );
        }

        $this->command->line('  👤 ' . count($utilisateurs) . ' utilisateurs créés');
    }
}
