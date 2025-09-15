<?php

namespace App\Models\Core;

use Illuminate\Database\Eloquent\Model;

class CoreModel extends Model
{
    /**
     * Spécifie la connexion à utiliser pour ce modèle
     *
     * @var string
     */
    protected $connection = 'mysql';
    
    /**
     * Vérifie que la connexion à MySQL fonctionne
     *
     * @return bool
     */
    public static function testConnection()
    {
        try {
            // Exécute une requête simple pour vérifier la connexion
            \DB::connection('mysql')->select('SELECT 1');
            return true;
        } catch (\Exception $e) {
            \Log::error('Erreur de connexion MySQL: ' . $e->getMessage());
            return false;
        }
    }
}
