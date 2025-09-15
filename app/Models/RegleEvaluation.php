<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use App\Models\Business\BusinessModel;

class RegleEvaluation extends Model
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
    protected $table = 'regles_evaluation';
    
    /**
     * La clé primaire associée à la table.
     *
     * @var string
     */
    protected $primaryKey = 'id_regle';
    
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
        'nom_regle',
        'criteres_evaluation_json',
        'est_active',
        'date_debut',
        'date_fin',
    ];
    
    /**
     * Les attributs qui doivent être convertis.
     *
     * @var array<string, string>
     */
    protected $casts = [
        'criteres_evaluation_json' => 'json',
        'est_active' => 'boolean',
        'date_debut' => 'date',
        'date_fin' => 'date',
    ];
    
    /**
     * Relation avec les évaluations utilisant cette règle
     */
    public function evaluations()
    {
        return $this->hasMany(Evaluation::class, 'id_regle');
    }
    
    /**
     * Vérifie si la règle est active à une date donnée
     * 
     * @param \DateTime|string|null $date
     * @return bool
     */
    public function estActiveADate($date = null): bool
    {
        if (!$this->est_active) {
            return false;
        }
        
        $date = $date ? new \DateTime($date) : new \DateTime();
        
        // Si pas de dates spécifiées, la règle est active
        if (!$this->date_debut && !$this->date_fin) {
            return true;
        }
        
        // Vérifier si la date est dans la plage de dates
        if ($this->date_debut && $date < new \DateTime($this->date_debut)) {
            return false;
        }
        
        if ($this->date_fin && $date > new \DateTime($this->date_fin)) {
            return false;
        }
        
        return true;
    }
    
    /**
     * Récupère les critères d'évaluation sous forme de tableau
     * 
     * @return array
     */
    public function getCriteres(): array
    {
        return $this->criteres_evaluation_json ?? [];
    }
    
    /**
     * Vérifie si un critère existe dans cette règle
     * 
     * @param string $codeCritere
     * @return bool
     */
    public function hasCritere(string $codeCritere): bool
    {
        $criteres = $this->getCriteres();
        
        foreach ($criteres as $critere) {
            if (isset($critere['code']) && $critere['code'] === $codeCritere) {
                return true;
            }
        }
        
        return false;
    }
    
    /**
     * Récupère la pondération d'un critère
     * 
     * @param string $codeCritere
     * @return float|null
     */
    public function getPonderationCritere(string $codeCritere): ?float
    {
        $criteres = $this->getCriteres();
        
        foreach ($criteres as $critere) {
            if (isset($critere['code']) && $critere['code'] === $codeCritere) {
                return $critere['ponderation'] ?? null;
            }
        }
        
        return null;
    }
}
