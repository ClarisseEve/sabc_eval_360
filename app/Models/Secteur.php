<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Secteur extends Model
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
    protected $table = 'secteurs';
    
    /**
     * La clé primaire associée à la table.
     *
     * @var string
     */
    protected $primaryKey = 'id_secteur';
    
    /**
     * Les attributs qui sont assignables en masse.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'nom_secteur',
        'id_district',
        'id_service',
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
     * Relation avec le district (optionnel)
     */
    public function district()
    {
        return $this->belongsTo(District::class, 'id_district', 'id_district');
    }
    
    /**
     * Relation avec le service commercial
     */
    public function service()
    {
        return $this->belongsTo(ServiceCommercial::class, 'id_service', 'id_service');
    }
    
    /**
     * Relation avec les utilisateurs
     */
    public function utilisateurs()
    {
        return $this->hasMany(Utilisateur::class, 'id_secteur', 'id_secteur');
    }
}
