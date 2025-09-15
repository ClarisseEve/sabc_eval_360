<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class District extends Model
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
    protected $table = 'districts';
    
    /**
     * La clé primaire associée à la table.
     *
     * @var string
     */
    protected $primaryKey = 'id_district';
    
    /**
     * Les attributs qui sont assignables en masse.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'nom_district',
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
     * Relation avec le service commercial
     */
    public function service()
    {
        return $this->belongsTo(ServiceCommercial::class, 'id_service', 'id_service');
    }
    
    /**
     * Relation avec les secteurs
     */
    public function secteurs()
    {
        return $this->hasMany(Secteur::class, 'id_district', 'id_district');
    }
    
    /**
     * Relation avec les utilisateurs
     */
    public function utilisateurs()
    {
        return $this->hasMany(Utilisateur::class, 'id_district', 'id_district');
    }
}
