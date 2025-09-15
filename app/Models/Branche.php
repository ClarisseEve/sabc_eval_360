<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use App\Models\Core\CoreModel;

class Branche extends Model
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
    protected $primaryKey = 'id_branche';
    
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
        'id_branche',
        'nom_branche',
        'description',
    ];
    
    /**
     * Relation avec les rôles de cette branche
     */
    public function roles()
    {
        return $this->hasMany(Role::class, 'id_branche');
    }
    
    /**
     * Récupère tous les utilisateurs appartenant à cette branche
     */
    public function utilisateurs()
    {
        return $this->hasMany(Utilisateur::class, 'id_branche', 'id_branche');
    }
}
