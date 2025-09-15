<?php

namespace App\Models\Analytics;

use Bavix\LaravelClickHouse\Database\Eloquent\Model;

class AnalyticsModel extends Model
{
    /**
     * Spécifie la connexion à utiliser pour ce modèle
     *
     * @var string
     */
    protected $connection = 'clickhouse';
    
    /**
     * Vérifie que la connexion à ClickHouse fonctionne
     *
     * @return bool
     */
    public static function testConnection()
    {
        try {
            // Exécute une requête simple pour vérifier la connexion
            \DB::connection('clickhouse')->select('SELECT 1');
            return true;
        } catch (\Exception $e) {
            \Log::error('Erreur de connexion ClickHouse: ' . $e->getMessage());
            return false;
        }
    }
}
