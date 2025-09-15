<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use App\Models\Core\CoreModel;

class Region extends Model
{
    use HasFactory;
    
    /**
     * Spécifie la connexion à utiliser pour ce modèle
     *
     * @var string
     */
    protected $connection = 'mysql';
    
    /**
     * La clé primaire associée à la table.
     *
     * @var string
     */
    protected $primaryKey = 'id_region';
    
    /**
     * Indique si la clé primaire est auto-incrémentée.
     *
     * @var bool
     */
    public $incrementing = false;
    
    /**
     * Le type de la clé primaire.
     *
     * @var string
     */
    protected $keyType = 'string';
    
    /**
     * Les attributs qui sont assignables en masse.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'id_region',
        'nom_region',
        'est_taniere',
    ];
    
    /**
     * Les attributs qui doivent être convertis.
     *
     * @var array<string, string>
     */
    protected $casts = [
        'est_taniere' => 'boolean',
    ];
    
    /**
     * Relation avec les services commerciaux de cette région
     */
    public function servicesCommerciaux()
    {
        return $this->hasMany(ServiceCommercial::class, 'id_region');
    }
    
    /**
     * Relation avec les utilisateurs de cette région
     */
    public function utilisateurs()
    {
        return $this->hasMany(Utilisateur::class, 'id_region');
    }
    
    /**
     * Détermine si la région est de type tanière (structure à 5 niveaux)
     * ou non-tanière (structure à 3 niveaux)
     *
     * @return string
     */
    public function getTypeRegionAttribute()
    {
        return $this->est_taniere ? 'Tanière' : 'Non-Tanière';
    }
}