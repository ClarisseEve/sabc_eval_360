<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Str;

class EvaluationPermission extends Model
{
    use HasFactory;
    
    /**
     * Spécifie la connexion à utiliser pour ce modèle
     *
     * @var string
     */
    protected $connection = 'pgsql';
    
    /**
     * La table associée au modèle.
     *
     * @var string
     */
    protected $table = 'evaluation_permissions';
    
    /**
     * La clé primaire associée à la table.
     *
     * @var string
     */
    protected $primaryKey = 'id_permission';
    
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
        'id_permission',
        'role_evaluateur',
        'role_evalue',
        'type_evaluation',
        'est_autorise',
        'conditions_json',
        'description',
        'est_active',
    ];
    
    /**
     * Les attributs qui doivent être convertis.
     *
     * @var array<string, string>
     */
    protected $casts = [
        'conditions_json' => 'json',
        'est_autorise' => 'boolean',
        'est_active' => 'boolean',
    ];
    
    /**
     * Boot method pour générer l'UUID automatiquement
     */
    protected static function boot()
    {
        parent::boot();
        
        static::creating(function ($model) {
            if (empty($model->{$model->getKeyName()})) {
                $model->{$model->getKeyName()} = Str::uuid()->toString();
            }
        });
    }
    
    /**
     * Vérifie si une évaluation est autorisée selon les règles SABC
     * 
     * @param string $roleEvaluateur
     * @param string $roleEvalue
     * @param string $typeEvaluation
     * @return bool
     */
    public static function estAutorise(string $roleEvaluateur, string $roleEvalue, string $typeEvaluation): bool
    {
        $permission = self::where([
            'role_evaluateur' => $roleEvaluateur,
            'role_evalue' => $roleEvalue,
            'type_evaluation' => $typeEvaluation,
            'est_active' => true,
        ])->first();
        
        return $permission ? $permission->est_autorise : false;
    }
    
    /**
     * Récupère toutes les permissions pour un rôle évaluateur
     * 
     * @param string $roleEvaluateur
     * @return \Illuminate\Database\Eloquent\Collection
     */
    public static function getPermissionsPourRole(string $roleEvaluateur)
    {
        return self::where('role_evaluateur', $roleEvaluateur)
            ->where('est_active', true)
            ->where('est_autorise', true)
            ->get();
    }
}
