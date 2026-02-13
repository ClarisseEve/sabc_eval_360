<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use App\Models\Business\BusinessModel;

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
    public $incrementing = true;
    
    /**
     * Le type de données de la clé primaire.
     *
     * @var string
     */
    protected $keyType = 'int';
    
    /**
     * Les attributs qui sont assignables en masse.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'id_periode',
        'code_periode',
        'nom_periode',
        'titre',
        'description',
        'date_debut',
        'date_fin',
        'statut',
        'id_regle',
        'est_ouverte',
        'est_cloturee',
        'rappels_envoyes',
        'derniere_notification',
        'statistiques_json',
        'nb_evaluations_attendues',
        'nb_evaluations_completees',
        'taux_completion',
        'duree_rappels_jours',
        'nb_max_rappels',
        'escalade_automatique',
        'validateur_dr_matricule',
        'date_validation_dr',
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
        'est_ouverte' => 'boolean',
        'est_cloturee' => 'boolean',
        'rappels_envoyes' => 'json',
        'statistiques_json' => 'json',
        'nb_evaluations_attendues' => 'integer',
        'nb_evaluations_completees' => 'integer',
        'taux_completion' => 'float',
        'duree_rappels_jours' => 'integer',
        'nb_max_rappels' => 'integer',
        'escalade_automatique' => 'boolean',
        'date_validation_dr' => 'datetime',
    ];
    
    /**
     * Boot method pour générer automatiquement l'ID selon les règles SABC
     */
    protected static function boot()
    {
        parent::boot();
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

        if ($this->est_cloturee) {
            return false;
        }

        if (! $this->est_ouverte) {
            return false;
        }

        return $now->greaterThanOrEqualTo($this->date_debut) && $now->lessThanOrEqualTo($this->date_fin);
    }
    
    /**
     * Vérifie si la période est terminée
     * 
     * @return bool
     */
    public function estTerminee(): bool
    {
        return $this->est_cloturee || now()->greaterThan($this->date_fin);
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
    
    /**
     * Scopes pour filtrer les périodes
     */
    public function scopePlanifiee($query)
    {
        return $query->where('statut', 'planifiee')
                     ->where('est_ouverte', false)
                     ->where('est_cloturee', false);
    }
    
    public function scopeOuverte($query)
    {
        return $query->where('est_ouverte', true)
                     ->where('est_cloturee', false);
    }
    
    public function scopeFermee($query)
    {
        return $query->where('est_cloturee', true);
    }
    
    public function scopeActive($query)
    {
        return $query->where('est_ouverte', true)
                     ->where('est_cloturee', false)
                     ->where('date_debut', '<=', now())
                     ->where('date_fin', '>=', now());
    }
    
    /**
     * Vérifie si la période peut être modifiée
     * 
     * @return bool
     */
    public function estModifiable(): bool
    {
        // Une période peut être modifiée si elle est planifiée et non ouverte
        return $this->statut === 'planifiee' && !$this->est_ouverte && !$this->est_cloturee;
    }
    
    /**
     * Récupère les dates de rappels
     * 
     * @return array
     */
    public function getDatesRappels(): array
    {
        if (!empty($this->rappels_envoyes) && is_array($this->rappels_envoyes)) {
            return $this->rappels_envoyes;
        }
        
        // Générer dates par défaut si non définies
        if ($this->date_fin) {
            return [
                'j_moins_7' => $this->date_fin->copy()->subDays(7)->format('Y-m-d'),
                'j_moins_3' => $this->date_fin->copy()->subDays(3)->format('Y-m-d'),
                'j_moins_1' => $this->date_fin->copy()->subDays(1)->format('Y-m-d'),
            ];
        }
        
        return [];
    }
    
    /**
     * Ouvrir la période
     * 
     * @return bool
     */
    public function ouvrir(): bool
    {
        if ($this->est_ouverte) {
            return false;
        }
        
        return $this->update([
            'est_ouverte' => true,
            'est_cloturee' => false,
            'statut' => 'active',
        ]);
    }
    
    /**
     * Fermer la période
     * 
     * @return bool
     */
    public function fermer(): bool
    {
        if ($this->est_cloturee) {
            return false;
        }
        
        return $this->update([
            'est_ouverte' => false,
            'est_cloturee' => true,
            'statut' => 'fermee',
        ]);
    }
    
    /**
     * Vérifie si la période est en cours
     * 
     * @return bool
     */
    public function estEnCours(): bool
    {
        if (!$this->est_ouverte || $this->est_cloturee) {
            return false;
        }
        
        $now = now();
        return $now->between($this->date_debut, $this->date_fin);
    }
}
