<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;

class OrganizationalStructureSeeder extends Seeder
{
    /**
     * Run the database seeds.
     * Peuple les tables avec les données du fichier distributeurs.csv
     */
    public function run(): void
    {
        $csvPath = base_path('sample/distributeurs.csv');
        
        if (!file_exists($csvPath)) {
            $this->command->error('Fichier distributeurs.csv non trouvé dans sample/');
            return;
        }

        $this->command->info('Lecture du fichier distributeurs.csv...');
        
        $csvData = array_map('str_getcsv', file($csvPath));
        $header = array_shift($csvData); // Supprimer l'en-tête
        
        $regions = [];
        $services = [];
        $districts = [];
        $secteurs = [];
        
        foreach ($csvData as $row) {
            if (count($row) < 4) continue;
            
            $regionNom = trim($row[0]);
            $serviceNom = trim($row[1]);
            $districtNom = trim($row[2]);
            $secteurNom = trim($row[3]);
            
            // Ignorer les lignes avec des valeurs vides
            if (empty($regionNom) || empty($serviceNom) || empty($districtNom) || empty($secteurNom)) {
                continue;
            }
            
            // Collecter les régions uniques
            if (!in_array($regionNom, $regions)) {
                $regions[] = $regionNom;
            }
            
            // Collecter les services uniques par région
            $serviceKey = $regionNom . '|' . $serviceNom;
            if (!isset($services[$serviceKey])) {
                $services[$serviceKey] = [
                    'region' => $regionNom,
                    'service' => $serviceNom
                ];
            }
            
            // Collecter les districts uniques par service
            $districtKey = $serviceKey . '|' . $districtNom;
            if (!isset($districts[$districtKey])) {
                $districts[$districtKey] = [
                    'region' => $regionNom,
                    'service' => $serviceNom,
                    'district' => $districtNom
                ];
            }
            
            // Collecter les secteurs uniques
            $secteurKey = $districtKey . '|' . $secteurNom;
            if (!isset($secteurs[$secteurKey])) {
                $secteurs[$secteurKey] = [
                    'region' => $regionNom,
                    'service' => $serviceNom,
                    'district' => $districtNom,
                    'secteur' => $secteurNom
                ];
            }
        }
        
        $this->command->info('Insertion des régions...');
        
        // Insérer les régions
        foreach ($regions as $index => $regionNom) {
            $estTaniere = in_array($regionNom, ['Littoral', 'Centre']);
            $regionId = 'REG' . str_pad($index + 1, 2, '0', STR_PAD_LEFT);
            
            // Vérifier si la région existe déjà
            $existingRegion = DB::table('regions')->where('nom_region', $regionNom)->first();
            
            if (!$existingRegion) {
                DB::table('regions')->insert([
                    'id_region' => $regionId,
                    'nom_region' => $regionNom,
                    'est_taniere' => $estTaniere,
                    'created_at' => now()
                ]);
            }
        }
        
        $this->command->info('Insertion des services commerciaux...');
        
        // Insérer les services commerciaux
        $serviceCounter = 1;
        foreach ($services as $service) {
            $regionId = DB::table('regions')
                ->where('nom_region', $service['region'])
                ->value('id_region');
                
            if ($regionId) {
                // Vérifier si le service existe déjà
                $existingService = DB::table('services_commerciaux')
                    ->where('nom_service', $service['service'])
                    ->where('id_region', $regionId)
                    ->first();
                
                if (!$existingService) {
                    $serviceId = 'SVC' . str_pad($serviceCounter, 3, '0', STR_PAD_LEFT);
                    
                    DB::table('services_commerciaux')->insert([
                        'id_service' => $serviceId,
                        'nom_service' => $service['service'],
                        'id_region' => $regionId,
                        'created_at' => now()
                    ]);
                    $serviceCounter++;
                }
            }
        }
        
        $this->command->info('Insertion des districts...');
        
        // Insérer les districts
        $districtCounter = 1;
        foreach ($districts as $district) {
            $serviceId = DB::table('services_commerciaux')
                ->join('regions', 'services_commerciaux.id_region', '=', 'regions.id_region')
                ->where('regions.nom_region', $district['region'])
                ->where('services_commerciaux.nom_service', $district['service'])
                ->value('services_commerciaux.id_service');
                
            if ($serviceId) {
                // Vérifier si le district existe déjà
                $existingDistrict = DB::table('districts')
                    ->where('nom_district', $district['district'])
                    ->where('id_service', $serviceId)
                    ->first();
                
                if (!$existingDistrict) {
                    $districtId = 'DST' . str_pad($districtCounter, 3, '0', STR_PAD_LEFT);
                    
                    DB::table('districts')->insert([
                        'id_district' => $districtId,
                        'nom_district' => $district['district'],
                        'id_service' => $serviceId,
                        'created_at' => now()
                    ]);
                    $districtCounter++;
                }
            }
        }
        
        $this->command->info('Insertion des secteurs...');
        
        // Insérer les secteurs
        $secteurCounter = 1;
        foreach ($secteurs as $secteur) {
            $serviceId = DB::table('services_commerciaux')
                ->join('regions', 'services_commerciaux.id_region', '=', 'regions.id_region')
                ->where('regions.nom_region', $secteur['region'])
                ->where('services_commerciaux.nom_service', $secteur['service'])
                ->value('services_commerciaux.id_service');
                
            $districtId = null;
            if ($serviceId) {
                $districtId = DB::table('districts')
                    ->where('nom_district', $secteur['district'])
                    ->where('id_service', $serviceId)
                    ->value('id_district');
            }
                
            if ($serviceId) {
                // Vérifier si le secteur existe déjà
                $existingSecteur = DB::table('secteurs')
                    ->where('nom_secteur', $secteur['secteur'])
                    ->where('id_service', $serviceId)
                    ->first();
                
                if (!$existingSecteur) {
                    $secteurId = 'SEC' . str_pad($secteurCounter, 3, '0', STR_PAD_LEFT);
                    
                    DB::table('secteurs')->insert([
                        'id_secteur' => $secteurId,
                        'nom_secteur' => $secteur['secteur'],
                        'id_service' => $serviceId,
                        'id_district' => $districtId,
                        'created_at' => now()
                    ]);
                    $secteurCounter++;
                }
            }
        }
        
        $this->command->info('Structure organisationnelle SABC créée avec succès !');
        $this->command->info('Régions: ' . count($regions));
        $this->command->info('Services: ' . count($services));
        $this->command->info('Districts: ' . count($districts));
        $this->command->info('Secteurs: ' . count($secteurs));
    }
}
