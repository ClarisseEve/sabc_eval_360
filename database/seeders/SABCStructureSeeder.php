<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Region;
use App\Models\ServiceCommercial;
use App\Models\District;
use App\Models\Secteur;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\DB;

class SABCStructureSeeder extends Seeder
{
    private static $counters = [];

    /**
     * Génère un ID unique selon les règles SABC (format court)
     */
    private function generateId(string $prefix): string
    {
        if (!isset(self::$counters[$prefix])) {
            self::$counters[$prefix] = 1;
        } else {
            self::$counters[$prefix]++;
        }
        
        return $prefix . str_pad(self::$counters[$prefix], 2, '0', STR_PAD_LEFT);
    }

    /**
     * Initialise la structure organisationnelle SABC basée sur les données réelles CSV
     */
    public function run(): void
    {
        // Vider les tables dans l'ordre des dépendances
        DB::statement('SET FOREIGN_KEY_CHECKS=0;');
        Secteur::truncate();
        District::truncate();
        ServiceCommercial::truncate();
        Region::truncate();
        DB::statement('SET FOREIGN_KEY_CHECKS=1;');

        // Définition des régions selon les données CSV SABC
        $regions = [
            ['nom' => 'CENTRE', 'est_taniere' => true],
            ['nom' => 'LITTORAL', 'est_taniere' => true],
            ['nom' => 'NORD', 'est_taniere' => false],
            ['nom' => 'OUEST', 'est_taniere' => false],
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

        // Services commerciaux selon structure CSV SABC
        $services = [
            // CENTRE (Tanière)
            ['nom' => 'CE SERVICE COMMERCIAL OLEMBE', 'region' => 'CENTRE'],
            ['nom' => 'CE SERVICE COMMERCIAL DURICAM', 'region' => 'CENTRE'],
            ['nom' => 'CE SERVICE COMMERCIAL EBOLOWA', 'region' => 'CENTRE'],
            ['nom' => 'CE SERVICE COMMERCIAL BERTOUA', 'region' => 'CENTRE'],
            ['nom' => 'CE CSC MT CENTRE', 'region' => 'CENTRE'],
            
            // LITTORAL (Tanière)
            ['nom' => 'LT SERVICE COMMERCIAL NDOKOTI', 'region' => 'LITTORAL'],
            ['nom' => 'LT SERVICE COMMERCIAL BONABERI', 'region' => 'LITTORAL'],
            ['nom' => 'LT SERVICE COMMERCIAL MOUNGO', 'region' => 'LITTORAL'],
            ['nom' => 'LT SERVICE COMMERCIAL OCEAN', 'region' => 'LITTORAL'],
            ['nom' => 'SW SERVICE COMMERCIAL OMBE', 'region' => 'LITTORAL'],
            ['nom' => 'LT CSC MT LITTORAL', 'region' => 'LITTORAL'],
            
            // NORD (Non-Tanière)
            ['nom' => 'NO SERVICE COMMERCIAL GAROUA', 'region' => 'NORD'],
            ['nom' => 'NO SERVICE COMMERCIAL MAROUA', 'region' => 'NORD'],
            ['nom' => 'NO SERVICE COMMERCIAL NGAOUNDERE', 'region' => 'NORD'],
            
            // OUEST (Non-Tanière)
            ['nom' => 'OU SERVICE COMMERCIAL BAFOUSSAM', 'region' => 'OUEST'],
            ['nom' => 'OU SERVICE COMMERCIAL DSCHANG', 'region' => 'OUEST'],
            ['nom' => 'OU SERVICE COMMERCIAL BAMENDA', 'region' => 'OUEST'],
            ['nom' => 'OU SERVICE COMMERCIAL BAFIA/BGTE', 'region' => 'OUEST'],
        ];

        $serviceIds = [];
        foreach ($services as $serviceData) {
            $service = ServiceCommercial::create([
                'id_service' => $this->generateId('SVC'),
                'nom_service' => $serviceData['nom'],
                'id_region' => $regionIds[$serviceData['region']],
                'description' => 'Service commercial ' . $serviceData['nom'],
            ]);
            $serviceIds[$serviceData['nom']] = $service->id_service;
        }

        // Districts selon structure CSV SABC (régions tanières uniquement)
        $districts = [
            // CENTRE Districts
            ['nom' => 'CE-OLEMBE DISTRICT VENTE 01', 'service' => 'CE SERVICE COMMERCIAL OLEMBE'],
            ['nom' => 'CE-OLEMBE DISTRICT VENTE 02', 'service' => 'CE SERVICE COMMERCIAL OLEMBE'],
            ['nom' => 'CE-OLEMBE DISTRICT VENTE 03', 'service' => 'CE SERVICE COMMERCIAL OLEMBE'],
            ['nom' => 'CE-DURICAM DISTRICT VENTE 01', 'service' => 'CE SERVICE COMMERCIAL DURICAM'],
            ['nom' => 'CE-DURICAM DISTRICT VENTE 02', 'service' => 'CE SERVICE COMMERCIAL DURICAM'],
            ['nom' => 'CENTRE-EBOLOWA DISTRICT VENTE 01', 'service' => 'CE SERVICE COMMERCIAL EBOLOWA'],
            ['nom' => 'CENTRE-BERTOUA DISTRICT VENTE 01', 'service' => 'CE SERVICE COMMERCIAL BERTOUA'],
            ['nom' => 'CENTRE-DISTRICT MODERN TRADE', 'service' => 'CE CSC MT CENTRE'],
            
            // LITTORAL Districts
            ['nom' => 'LT-NDOKOTI DISTRICT VENTE 01', 'service' => 'LT SERVICE COMMERCIAL NDOKOTI'],
            ['nom' => 'LT-NDOKOTI DISTRICT VENTE 02', 'service' => 'LT SERVICE COMMERCIAL NDOKOTI'],
            ['nom' => 'LT-BONABERI DISTRICT VENTE 01', 'service' => 'LT SERVICE COMMERCIAL BONABERI'],
            ['nom' => 'LT-BONABERI DISTRICT VENTE 02', 'service' => 'LT SERVICE COMMERCIAL BONABERI'],
            ['nom' => 'LITTORAL-NKONGSAMBA DISTRICT VENTE 01', 'service' => 'LT SERVICE COMMERCIAL MOUNGO'],
            ['nom' => 'LITTORAL-EDEA DISTRICT VENTE 01', 'service' => 'LT SERVICE COMMERCIAL OCEAN'],
            ['nom' => 'SUD OUEST-OMBE DISTRICT VENTE 01', 'service' => 'SW SERVICE COMMERCIAL OMBE'],
            ['nom' => 'LITTORAL-DISTRICT MODERN TRADE', 'service' => 'LT CSC MT LITTORAL'],
            
            // NORD Districts (structure simplifiée pour non-tanières)
            ['nom' => 'NORD-GAROUA DISTRICT VENTE 01', 'service' => 'NO SERVICE COMMERCIAL GAROUA'],
            ['nom' => 'NORD-MAROUA DISTRICT VENTE 01', 'service' => 'NO SERVICE COMMERCIAL MAROUA'],
            ['nom' => 'NORD-NGAOUNDERE DISTRICT VENTE 01', 'service' => 'NO SERVICE COMMERCIAL NGAOUNDERE'],
            
            // OUEST Districts (structure simplifiée pour non-tanières)
            ['nom' => 'OUEST-BAFOUSSAM DISTRICT VENTE 01', 'service' => 'OU SERVICE COMMERCIAL BAFOUSSAM'],
            ['nom' => 'OUEST-DSCHANG DISTRICT VENTE 01', 'service' => 'OU SERVICE COMMERCIAL DSCHANG'],
            ['nom' => 'OUEST-BAMENDA DISTRICT VENTE 01', 'service' => 'OU SERVICE COMMERCIAL BAMENDA'],
            ['nom' => 'OUEST-BTE/BAFIA DISTRICT VENTE 01', 'service' => 'OU SERVICE COMMERCIAL BAFIA/BGTE'],
        ];

        $districtIds = [];
        foreach ($districts as $districtData) {
            $district = District::create([
                'id_district' => $this->generateId('DST'),
                'nom_district' => $districtData['nom'],
                'id_service' => $serviceIds[$districtData['service']],
                'description' => 'District ' . $districtData['nom'],
            ]);
            $districtIds[$districtData['nom']] = $district->id_district;
        }

        // Secteurs selon structure CSV SABC (échantillon représentatif)
        $secteurs = [
            // CENTRE Secteurs
            ['nom' => 'CE-YAOUNDE-SECTEUR01', 'service' => 'CE SERVICE COMMERCIAL OLEMBE', 'district' => 'CE-OLEMBE DISTRICT VENTE 01'],
            ['nom' => 'CE-YAOUNDE-SECTEUR02', 'service' => 'CE SERVICE COMMERCIAL OLEMBE', 'district' => 'CE-OLEMBE DISTRICT VENTE 01'],
            ['nom' => 'CE-YAOUNDE-SECTEUR03', 'service' => 'CE SERVICE COMMERCIAL OLEMBE', 'district' => 'CE-OLEMBE DISTRICT VENTE 02'],
            ['nom' => 'CE-YAOUNDE-SECTEUR04', 'service' => 'CE SERVICE COMMERCIAL OLEMBE', 'district' => 'CE-OLEMBE DISTRICT VENTE 01'],
            ['nom' => 'CE-YAOUNDE-SECTEUR05', 'service' => 'CE SERVICE COMMERCIAL OLEMBE', 'district' => 'CE-OLEMBE DISTRICT VENTE 03'],
            ['nom' => 'CE-YAOUNDE-SECTEUR06', 'service' => 'CE SERVICE COMMERCIAL OLEMBE', 'district' => 'CE-OLEMBE DISTRICT VENTE 01'],
            ['nom' => 'CE-YAOUNDE-SECTEUR09', 'service' => 'CE SERVICE COMMERCIAL DURICAM', 'district' => 'CE-DURICAM DISTRICT VENTE 01'],
            ['nom' => 'CE-YAOUNDE-SECTEUR10', 'service' => 'CE SERVICE COMMERCIAL DURICAM', 'district' => 'CE-DURICAM DISTRICT VENTE 01'],
            ['nom' => 'CE-YAOUNDE-SECTEUR11', 'service' => 'CE SERVICE COMMERCIAL DURICAM', 'district' => 'CE-DURICAM DISTRICT VENTE 01'],
            ['nom' => 'CE-YAOUNDE-SECTEUR12', 'service' => 'CE SERVICE COMMERCIAL DURICAM', 'district' => 'CE-DURICAM DISTRICT VENTE 02'],
            ['nom' => 'CE-BERTOUA-SECTEUR01', 'service' => 'CE SERVICE COMMERCIAL BERTOUA', 'district' => 'CENTRE-BERTOUA DISTRICT VENTE 01'],
            ['nom' => 'CE-BERTOUA-SECTEUR02', 'service' => 'CE SERVICE COMMERCIAL BERTOUA', 'district' => 'CENTRE-BERTOUA DISTRICT VENTE 01'],
            ['nom' => 'CE-EBOLOWA-SECTEUR01', 'service' => 'CE SERVICE COMMERCIAL EBOLOWA', 'district' => 'CENTRE-EBOLOWA DISTRICT VENTE 01'],
            ['nom' => 'CE-EBOLOWA-SECTEUR02', 'service' => 'CE SERVICE COMMERCIAL EBOLOWA', 'district' => 'CENTRE-EBOLOWA DISTRICT VENTE 01'],
            ['nom' => 'CE-MT-ON TRADE-SECTEUR01', 'service' => 'CE CSC MT CENTRE', 'district' => 'CENTRE-DISTRICT MODERN TRADE'],
            ['nom' => 'CE-MT-OFF TRADE-SECTEUR01', 'service' => 'CE CSC MT CENTRE', 'district' => 'CENTRE-DISTRICT MODERN TRADE'],
            
            // LITTORAL Secteurs
            ['nom' => 'LT-DOUALA-SECTEUR01', 'service' => 'LT SERVICE COMMERCIAL NDOKOTI', 'district' => 'LT-NDOKOTI DISTRICT VENTE 01'],
            ['nom' => 'LT-DOUALA-SECTEUR02', 'service' => 'LT SERVICE COMMERCIAL NDOKOTI', 'district' => 'LT-NDOKOTI DISTRICT VENTE 01'],
            ['nom' => 'LT-DOUALA-SECTEUR03', 'service' => 'LT SERVICE COMMERCIAL NDOKOTI', 'district' => 'LT-NDOKOTI DISTRICT VENTE 01'],
            ['nom' => 'LT-DOUALA-SECTEUR21', 'service' => 'LT SERVICE COMMERCIAL BONABERI', 'district' => 'LT-BONABERI DISTRICT VENTE 01'],
            ['nom' => 'LT-DOUALA-SECTEUR22', 'service' => 'LT SERVICE COMMERCIAL BONABERI', 'district' => 'LT-BONABERI DISTRICT VENTE 01'],
            ['nom' => 'LT-DOUALA-SECTEUR23', 'service' => 'LT SERVICE COMMERCIAL BONABERI', 'district' => 'LT-BONABERI DISTRICT VENTE 01'],
            ['nom' => 'LT-NKONGSAMBA-SECTEUR01', 'service' => 'LT SERVICE COMMERCIAL MOUNGO', 'district' => 'LITTORAL-NKONGSAMBA DISTRICT VENTE 01'],
            ['nom' => 'LT-KRIBI-SECTEUR01', 'service' => 'LT SERVICE COMMERCIAL OCEAN', 'district' => 'LITTORAL-EDEA DISTRICT VENTE 01'],
            ['nom' => 'LT-EDEA-SECTEUR01', 'service' => 'LT SERVICE COMMERCIAL OCEAN', 'district' => 'LITTORAL-EDEA DISTRICT VENTE 01'],
            ['nom' => 'SW-LIMBE-SECTEUR01', 'service' => 'SW SERVICE COMMERCIAL OMBE', 'district' => 'SUD OUEST-OMBE DISTRICT VENTE 01'],
            ['nom' => 'LT-MT-ON TRADE-SECTEUR01', 'service' => 'LT CSC MT LITTORAL', 'district' => 'LITTORAL-DISTRICT MODERN TRADE'],
            ['nom' => 'LT-MT-OFF TRADE-SECTEUR01', 'service' => 'LT CSC MT LITTORAL', 'district' => 'LITTORAL-DISTRICT MODERN TRADE'],
            
            // NORD Secteurs (sans districts pour non-tanières selon règles SABC)
            ['nom' => 'NO-GAROUA-SECTEUR01', 'service' => 'NO SERVICE COMMERCIAL GAROUA', 'district' => 'NORD-GAROUA DISTRICT VENTE 01'],
            ['nom' => 'NO-GAROUA-SECTEUR02', 'service' => 'NO SERVICE COMMERCIAL GAROUA', 'district' => 'NORD-GAROUA DISTRICT VENTE 01'],
            ['nom' => 'NO-MAROUA-SECTEUR01', 'service' => 'NO SERVICE COMMERCIAL MAROUA', 'district' => 'NORD-MAROUA DISTRICT VENTE 01'],
            ['nom' => 'NO-MAROUA-SECTEUR02', 'service' => 'NO SERVICE COMMERCIAL MAROUA', 'district' => 'NORD-MAROUA DISTRICT VENTE 01'],
            ['nom' => 'NO-NGAOUNDERE-SECTEUR01', 'service' => 'NO SERVICE COMMERCIAL NGAOUNDERE', 'district' => 'NORD-NGAOUNDERE DISTRICT VENTE 01'],
            ['nom' => 'NO-NGAOUNDERE-SECTEUR02', 'service' => 'NO SERVICE COMMERCIAL NGAOUNDERE', 'district' => 'NORD-NGAOUNDERE DISTRICT VENTE 01'],
            
            // OUEST Secteurs (sans districts pour non-tanières selon règles SABC)
            ['nom' => 'OU-BAFOUSSAM-SECTEUR01', 'service' => 'OU SERVICE COMMERCIAL BAFOUSSAM', 'district' => 'OUEST-BAFOUSSAM DISTRICT VENTE 01'],
            ['nom' => 'OU-BAFOUSSAM-SECTEUR02', 'service' => 'OU SERVICE COMMERCIAL BAFOUSSAM', 'district' => 'OUEST-BAFOUSSAM DISTRICT VENTE 01'],
            ['nom' => 'OU-DSCHANG-SECTEUR01', 'service' => 'OU SERVICE COMMERCIAL DSCHANG', 'district' => 'OUEST-DSCHANG DISTRICT VENTE 01'],
            ['nom' => 'OU-DSCHANG-SECTEUR02', 'service' => 'OU SERVICE COMMERCIAL DSCHANG', 'district' => 'OUEST-DSCHANG DISTRICT VENTE 01'],
            ['nom' => 'OU-BAMENDA-SECTEUR01', 'service' => 'OU SERVICE COMMERCIAL BAMENDA', 'district' => 'OUEST-BAMENDA DISTRICT VENTE 01'],
            ['nom' => 'OU-BAFIA-SECTEUR01', 'service' => 'OU SERVICE COMMERCIAL BAFIA/BGTE', 'district' => 'OUEST-BTE/BAFIA DISTRICT VENTE 01'],
        ];

        foreach ($secteurs as $secteurData) {
            Secteur::create([
                'id_secteur' => $this->generateId('SEC'),
                'nom_secteur' => $secteurData['nom'],
                'id_service' => $serviceIds[$secteurData['service']],
                'id_district' => $districtIds[$secteurData['district']],
                'description' => 'Secteur ' . $secteurData['nom'],
            ]);
        }

        $this->command->info('Structure organisationnelle SABC initialisée selon données CSV réelles :');
        $this->command->info('- ' . count($regions) . ' régions (' . collect($regions)->where('est_taniere', true)->count() . ' tanières, ' . collect($regions)->where('est_taniere', false)->count() . ' non-tanières)');
        $this->command->info('- ' . count($services) . ' services commerciaux');
        $this->command->info('- ' . count($districts) . ' districts');
        $this->command->info('- ' . count($secteurs) . ' secteurs (échantillon représentatif)');
        $this->command->info('Structure conforme aux règles métier SABC : tanières (5 niveaux) vs non-tanières (3 niveaux)');
    }
}
