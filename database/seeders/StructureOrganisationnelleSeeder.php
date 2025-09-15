<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Region;
use App\Models\ServiceCommercial;
use App\Models\District;
use App\Models\Secteur;
use Illuminate\Support\Str;

class StructureOrganisationnelleSeeder extends Seeder
{
    /**
     * Génère un ID unique selon les règles SABC
     */
    private function generateId(string $prefix): string
    {
        return $prefix . '-' . str_pad(rand(1, 999), 3, '0', STR_PAD_LEFT);
    }

    /**
     * Initialise la structure organisationnelle SABC selon les règles métier
     */
    public function run(): void
    {
        // Création des régions selon les règles SABC
        $regions = [
            ['nom' => 'Littoral', 'est_taniere' => true],
            ['nom' => 'Centre', 'est_taniere' => true],
            ['nom' => 'Ouest', 'est_taniere' => false],
            ['nom' => 'Nord', 'est_taniere' => false],
            ['nom' => 'Sud', 'est_taniere' => false],
            ['nom' => 'Est', 'est_taniere' => false],
        ];

        $regionIds = [];
        foreach ($regions as $regionData) {
            $region = Region::create([
                'id_region' => $this->generateId('REG'),
                'nom_region' => $regionData['nom'],
                'est_taniere' => $regionData['est_taniere'],
            ]);
            $regionIds[$regionData['nom']] = $region->id_region;
        }

        // Services commerciaux par région selon structure SABC
        $services = [
            // Régions Tanières (structure complexe)
            ['nom' => 'Service Commercial Littoral 1', 'region' => 'Littoral'],
            ['nom' => 'Service Commercial Littoral 2', 'region' => 'Littoral'],
            ['nom' => 'Service Commercial Centre 1', 'region' => 'Centre'],
            ['nom' => 'Service Commercial Centre 2', 'region' => 'Centre'],
            
            // Régions Non-Tanières (structure simplifiée)
            ['nom' => 'Service Commercial Ouest', 'region' => 'Ouest'],
            ['nom' => 'Service Commercial Nord', 'region' => 'Nord'],
            ['nom' => 'Service Commercial Sud', 'region' => 'Sud'],
            ['nom' => 'Service Commercial Est', 'region' => 'Est'],
        ];

        $serviceIds = [];
        foreach ($services as $serviceData) {
            $service = ServiceCommercial::create([
                'id_service' => $this->generateId('SVC'),
                'nom_service' => $serviceData['nom'],
                'id_region' => $regionIds[$serviceData['region']],
                'description' => 'Service commercial pour la région ' . $serviceData['region'],
            ]);
            $serviceIds[$serviceData['nom']] = $service->id_service;
        }

        // Districts pour régions tanières uniquement (règles SABC)
        $districts = [
            // Littoral (tanière - 5 niveaux hiérarchiques)
            ['nom' => 'District Douala Centre', 'service' => 'Service Commercial Littoral 1'],
            ['nom' => 'District Douala Akwa', 'service' => 'Service Commercial Littoral 1'],
            ['nom' => 'District Kribi', 'service' => 'Service Commercial Littoral 2'],
            ['nom' => 'District Limbe', 'service' => 'Service Commercial Littoral 2'],
            
            // Centre (tanière - 5 niveaux hiérarchiques)
            ['nom' => 'District Yaoundé Centre', 'service' => 'Service Commercial Centre 1'],
            ['nom' => 'District Yaoundé Nord', 'service' => 'Service Commercial Centre 1'],
            ['nom' => 'District Mbalmayo', 'service' => 'Service Commercial Centre 2'],
            ['nom' => 'District Obala', 'service' => 'Service Commercial Centre 2'],
        ];

        $districtIds = [];
        foreach ($districts as $districtData) {
            $district = District::create([
                'id_district' => $this->generateId('DST'),
                'nom_district' => $districtData['nom'],
                'id_service' => $serviceIds[$districtData['service']],
                'description' => 'District de vente pour ' . $districtData['nom'],
            ]);
            $districtIds[$districtData['nom']] = $district->id_district;
        }

        // Secteurs selon règles hiérarchiques SABC
        $secteurs = [
            // Secteurs avec districts (régions tanières)
            ['nom' => 'Secteur Bonanjo', 'service' => 'Service Commercial Littoral 1', 'district' => 'District Douala Centre'],
            ['nom' => 'Secteur Bonapriso', 'service' => 'Service Commercial Littoral 1', 'district' => 'District Douala Centre'],
            ['nom' => 'Secteur Akwa Nord', 'service' => 'Service Commercial Littoral 1', 'district' => 'District Douala Akwa'],
            ['nom' => 'Secteur Akwa Sud', 'service' => 'Service Commercial Littoral 1', 'district' => 'District Douala Akwa'],
            
            ['nom' => 'Secteur Kribi Centre', 'service' => 'Service Commercial Littoral 2', 'district' => 'District Kribi'],
            ['nom' => 'Secteur Kribi Plage', 'service' => 'Service Commercial Littoral 2', 'district' => 'District Kribi'],
            ['nom' => 'Secteur Limbe Mile 4', 'service' => 'Service Commercial Littoral 2', 'district' => 'District Limbe'],
            ['nom' => 'Secteur Limbe Down Beach', 'service' => 'Service Commercial Littoral 2', 'district' => 'District Limbe'],
            
            ['nom' => 'Secteur Yaoundé Centre-Ville', 'service' => 'Service Commercial Centre 1', 'district' => 'District Yaoundé Centre'],
            ['nom' => 'Secteur Yaoundé Mfoundi', 'service' => 'Service Commercial Centre 1', 'district' => 'District Yaoundé Centre'],
            ['nom' => 'Secteur Yaoundé Emombo', 'service' => 'Service Commercial Centre 1', 'district' => 'District Yaoundé Nord'],
            ['nom' => 'Secteur Yaoundé Nkoldongo', 'service' => 'Service Commercial Centre 1', 'district' => 'District Yaoundé Nord'],
            
            // Secteurs sans districts (régions non-tanières - structure simplifiée)
            ['nom' => 'Secteur Bafoussam', 'service' => 'Service Commercial Ouest', 'district' => null],
            ['nom' => 'Secteur Dschang', 'service' => 'Service Commercial Ouest', 'district' => null],
            ['nom' => 'Secteur Bamenda', 'service' => 'Service Commercial Ouest', 'district' => null],
            
            ['nom' => 'Secteur Garoua', 'service' => 'Service Commercial Nord', 'district' => null],
            ['nom' => 'Secteur Maroua', 'service' => 'Service Commercial Nord', 'district' => null],
            ['nom' => 'Secteur Ngaoundéré', 'service' => 'Service Commercial Nord', 'district' => null],
            
            ['nom' => 'Secteur Ebolowa', 'service' => 'Service Commercial Sud', 'district' => null],
            ['nom' => 'Secteur Sangmélima', 'service' => 'Service Commercial Sud', 'district' => null],
            
            ['nom' => 'Secteur Bertoua', 'service' => 'Service Commercial Est', 'district' => null],
            ['nom' => 'Secteur Batouri', 'service' => 'Service Commercial Est', 'district' => null],
        ];

        foreach ($secteurs as $secteurData) {
            Secteur::create([
                'id_secteur' => $this->generateId('SEC'),
                'nom_secteur' => $secteurData['nom'],
                'id_service' => $serviceIds[$secteurData['service']],
                'id_district' => $secteurData['district'] ? $districtIds[$secteurData['district']] : null,
                'description' => 'Secteur de vente pour ' . $secteurData['nom'],
            ]);
        }

        $this->command->info('Structure organisationnelle SABC initialisée avec succès :');
        $this->command->info('- ' . count($regions) . ' régions (2 tanières, 4 non-tanières)');
        $this->command->info('- ' . count($services) . ' services commerciaux');
        $this->command->info('- ' . count($districts) . ' districts (tanières uniquement)');
        $this->command->info('- ' . count($secteurs) . ' secteurs');
    }
}
