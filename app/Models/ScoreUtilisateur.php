<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ScoreUtilisateur extends Model
{
    use HasFactory;
    
    /**
     * Spécifie la connexion principale (MySQL) pour les scores utilisateurs.
     *
     * @var string
     */
    protected $connection = 'mysql';
    
    /**
     * La table associée au modèle.
     *
     * @var string
     */
    protected $table = 'scores_utilisateurs';
    
    /**
     * Clé primaire composite selon règles SABC
     *
     * @var array
     */
    protected $primaryKey = null;
    public $incrementing = false;
    protected $keyType = 'string';
    
    /**
     * Les attributs assignables selon règles métier SABC
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'matricule',
        'id_periode',
        'score_global',
        'score_auto',
        'score_auto_evaluation',
        'score_pairs',
        'score_manager',
        'progression_vs_precedente',
        'nb_evaluations_recues',
        'nb_evaluations_donnees',
        'position_equipe',
        'derniere_maj'
    ];
    
    /**
     * Les attributs qui doivent être convertis.
     *
     * @var array<string, string>
     */
    protected $casts = [
        'score_auto' => 'float',
        'score_pairs' => 'float',
        'score_manager' => 'float',
        'score_global' => 'float',
        'progression_vs_precedente' => 'float',
        'derniere_maj' => 'datetime',
    ];
    
    /**
     * Relation avec l'utilisateur
     */
    public function utilisateur()
    {
        return $this->belongsTo(Utilisateur::class, 'matricule', 'matricule');
    }
    
    /**
     * Relation avec la période d'évaluation
     */
    public function periode()
    {
        return $this->belongsTo(PeriodeEvaluation::class, 'id_periode', 'id_periode');
    }
    
    /**
     * Calcule le score global selon la pondération SABC
     * Auto-évaluation : 20%, Pairs : 40%, Manager : 40%
     * 
     * @return float
     */
    public function calculerScoreGlobal(): float
    {
        $scoreAuto = $this->score_auto ?? 0;
        $scorePairs = $this->score_pairs ?? 0;
        $scoreManager = $this->score_manager ?? 0;
        
        // Pondération SABC
        $scoreGlobal = ($scoreAuto * 0.2) + ($scorePairs * 0.4) + ($scoreManager * 0.4);
        
        return round($scoreGlobal, 2);
    }
    
    /**
     * Met à jour le score global et sauvegarde
     */
    public function mettreAJourScoreGlobal(): void
    {
        $this->score_global = $this->calculerScoreGlobal();
        $this->derniere_maj = now();
        $this->save();
    }
    
    /**
     * Récupère les détails des scores
     * 
     * @return array
     */
    public function getDetailsScores(): array
    {
        return [];
    }
    
    /**
     * Vérifie si le score est complet (toutes les évaluations reçues)
     * 
     * @return bool
     */
    public function estComplet(): bool
    {
        // Un score est complet si au moins une évaluation manager est présente
        // et que les scores ne sont pas nuls
        return $this->score_manager !== null && $this->score_manager > 0;
    }
    
    /**
     * Récupère l'évolution du score par rapport à la période précédente
     * 
     * @return float|null
     */
    public function getEvolutionScore(): ?float
    {
        $scorePrecedent = static::where('matricule', $this->matricule)
            ->where('id_periode', '<', $this->id_periode)
            ->orderBy('id_periode', 'desc')
            ->first();
            
        if (!$scorePrecedent || !$scorePrecedent->score_global) {
            return null;
        }
        
        return round($this->score_global - $scorePrecedent->score_global, 2);
    }
    
    /**
     * Scope pour filtrer par utilisateur
     */
    public function scopeParUtilisateur($query, $idUtilisateur)
    {
        return $query->where('matricule', $idUtilisateur);
    }
    
    /**
     * Scope pour filtrer par période
     */
    public function scopeParPeriode($query, $idPeriode)
    {
        return $query->where('id_periode', $idPeriode);
    }
    
    /**
     * Scope pour les scores complets uniquement
     */
    public function scopeComplets($query)
    {
        return $query->whereNotNull('score_manager')
                    ->where('score_manager', '>', 0);
    }

    /**
     * Prépare la clé composite (matricule + id_periode) pour les mises à jour.
     */
    protected function setKeysForSaveQuery($query)
    {
        $query->where('matricule', $this->getAttribute('matricule'))
              ->where('id_periode', $this->getAttribute('id_periode'));

        return $query;
    }

    /**
     * Accesseur compatible pour l'auto-évaluation.
     */
    public function getScoreAutoEvaluationAttribute(): ?float
    {
        return $this->score_auto;
    }

    /**
     * Mutateur compatible pour l'auto-évaluation.
     */
    public function setScoreAutoEvaluationAttribute($value): void
    {
        $this->attributes['score_auto'] = $value;
    }

    /**
     * Accesseur pour la période (compatibilité avec anciens attributs).
     */
    public function getPeriodeEvaluationAttribute(): ?string
    {
        return $this->id_periode;
    }

    /**
     * Mutateur pour la période (compatibilité).
     */
    public function setPeriodeEvaluationAttribute($value): void
    {
        $this->attributes['id_periode'] = $value;
    }
}
