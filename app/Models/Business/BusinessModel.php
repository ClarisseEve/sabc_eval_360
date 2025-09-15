<?php

namespace App\Models\Business;

use Illuminate\Database\Eloquent\Model;

class BusinessModel extends Model
{
    /**
     * Spécifie la connexion à utiliser pour ce modèle
     *
     * @var string
     */
    protected $connection = 'pgsql';
    
    /**
     * Vérifie que la connexion à PostgreSQL fonctionne
     *
     * @return bool
     */
    public static function testConnection()
    {
        try {
            // Exécute une requête simple pour vérifier la connexion
            \DB::connection('pgsql')->select('SELECT 1');
            return true;
        } catch (\Exception $e) {
            \Log::error('Erreur de connexion PostgreSQL: ' . $e->getMessage());
            return false;
        }
    }
}
