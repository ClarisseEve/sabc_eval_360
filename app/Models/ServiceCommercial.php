<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ServiceCommercial extends Model
{
    use HasFactory;
    
    /**
     * Spécifie la connexion à utiliser pour ce modèle
     *
     * @var string
     */
    protected $connection = 'mysql';
    
    /**
     * La table associée au modèle.
     *
     * @var string
     */
    protected $table = 'services_commerciaux';
    
    /**
     * La clé primaire associée à la table.
     *
     * @var string
     */
    protected $primaryKey = 'id_service';
    
    /**
     * Les attributs qui sont assignables en masse.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'nom_service',
        'id_region',
    ];
    
    /**
     * Les attributs qui doivent être convertis.
     *
     * @var array<string, string>
     */
    protected $casts = [
        'created_at' => 'timestamp',
    ];
    
    /**
     * Relation avec la région
     */
    public function region()
    {
        return $this->belongsTo(Region::class, 'id_region', 'id_region');
    }
    
    /**
     * Relation avec les districts
     */
    public function districts()
    {
        return $this->hasMany(District::class, 'id_service', 'id_service');
    }
    
    /**
     * Relation avec les secteurs
     */
    public function secteurs()
    {
        return $this->hasMany(Secteur::class, 'id_service', 'id_service');
    }
    
    /**
     * Relation avec les utilisateurs
     */
    public function utilisateurs()
    {
        return $this->hasMany(Utilisateur::class, 'id_service', 'id_service');
    }
}
