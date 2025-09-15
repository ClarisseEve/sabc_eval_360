<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use App\Models\Business\BusinessModel;
use App\Services\IdGeneratorService;

class PeriodeEvaluation extends Model
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
    protected $table = 'periodes_evaluation';
    
    /**
     * La clé primaire associée à la table.
     *
     * @var string
     */
    protected $primaryKey = 'id_periode';
    
    /**
     * Indique si les IDs sont auto-incrémentés.
     *
     * @var bool
     */
    public $incrementing = false;
    
    /**
     * Le type de données de la clé primaire.
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
        'id_periode',
        'titre',
        'description',
        'date_debut',
        'date_fin',
        'statut',
        'id_regle',
        'id_region',
        'parametres_json',
    ];
    
    /**
     * Les attributs qui doivent être convertis.
     *
     * @var array<string, string>
     */
    protected $casts = [
        'date_debut' => 'date',
        'date_fin' => 'date',
        'parametres_json' => 'json',
    ];
    
    /**
     * Boot method pour générer automatiquement l'ID selon les règles SABC
     */
    protected static function boot()
    {
        parent::boot();
        
        static::creating(function ($model) {
            if (empty($model->id_periode)) {
                $idGenerator = new IdGeneratorService();
                $model->id_periode = $idGenerator->generateId('periodes_evaluation');
            }
        });
    }
    
    /**
     * Relation avec la règle d'évaluation
     */
    public function regleEvaluation()
    {
        return $this->belongsTo(RegleEvaluation::class, 'id_regle');
    }
    
    /**
     * Relation avec la région concernée
     */
    public function region()
    {
        return $this->belongsTo(Region::class, 'id_region');
    }
    
    /**
     * Relation avec les évaluations de cette période
     */
    public function evaluations()
    {
        return $this->hasMany(Evaluation::class, 'id_periode');
    }
    
    /**
     * Vérifie si la période est active à la date actuelle
     * 
     * @return bool
     */
    public function estActive(): bool
    {
        $now = now();
        return $this->statut === 'active' && 
               $now->greaterThanOrEqualTo($this->date_debut) && 
               $now->lessThanOrEqualTo($this->date_fin);
    }
    
    /**
     * Vérifie si la période est terminée
     * 
     * @return bool
     */
    public function estTerminee(): bool
    {
        return $this->statut === 'terminee' || now()->greaterThan($this->date_fin);
    }
    
    /**
     * Récupère les paramètres de la période
     * 
     * @return array
     */
    public function getParametres(): array
    {
        return $this->parametres_json ?? [];
    }
    
    /**
     * Récupère un paramètre spécifique
     * 
     * @param string $cle
     * @param mixed $defaut
     * @return mixed
     */
    public function getParametre(string $cle, $defaut = null)
    {
        $parametres = $this->getParametres();
        return $parametres[$cle] ?? $defaut;
    }
    
    /**
     * Récupère le nombre d'évaluations soumises pour cette période
     * 
     * @return int
     */
    public function getNombreEvaluationsSoumises(): int
    {
        return $this->evaluations()->whereIn('statut', ['soumis', 'valide'])->count();
    }
    
    /**
     * Récupère le nombre d'évaluations validées pour cette période
     * 
     * @return int
     */
    public function getNombreEvaluationsValidees(): int
    {
        return $this->evaluations()->where('statut', 'valide')->count();
    }
    
    /**
     * Récupère le taux de complétion des évaluations pour cette période
     * 
     * @return float
     */
    public function getTauxCompletion(): float
    {
        $total = $this->evaluations()->count();
        if ($total === 0) {
            return 0;
        }
        
        $soumises = $this->getNombreEvaluationsSoumises();
        return round(($soumises / $total) * 100, 2);
    }
}
