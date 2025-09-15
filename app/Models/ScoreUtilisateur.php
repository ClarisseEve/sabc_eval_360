<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use App\Models\Analytics\AnalyticsModel;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ScoreUtilisateur extends AnalyticsModel
{
    use HasFactory;
    
    /**
     * Spécifie la connexion ClickHouse (ANALYTICS) selon architecture SABC
     *
     * @var string
     */
    protected $connection = 'clickhouse';
    
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
    protected $primaryKey = ['matricule', 'periode_evaluation'];
    public $incrementing = false;
    
    /**
     * Les attributs assignables selon règles métier SABC
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'matricule',
        'periode_evaluation',
        'score_global',
        'score_auto_evaluation',
        'score_pairs',
        'score_manager',
        'progression_vs_precedente',
        'score_precedent',
        'nb_evaluations_recues',
        'nb_evaluations_donnees',
        'nb_auto_evaluations',
        'scores_par_critere',
        'evolution_par_critere',
        'statut_calcul',
        'date_calcul',
        'id_region',
        'score_normalise_region',
        'percentile_region',
        'derniere_mise_a_jour'
    ];
    
    /**
     * Les attributs qui doivent être convertis.
     *
     * @var array<string, string>
     */
    protected $casts = [
        'score_auto_evaluation' => 'float',
        'score_pairs' => 'float',
        'score_manager' => 'float',
        'score_global' => 'float',
        'details_scores_json' => 'json',
        'date_calcul' => 'datetime',
    ];
    
    /**
     * Relation avec l'utilisateur
     */
    public function utilisateur()
    {
        return $this->belongsTo(Utilisateur::class, 'id_utilisateur');
    }
    
    /**
     * Relation avec la période d'évaluation
     */
    public function periode()
    {
        return $this->belongsTo(PeriodeEvaluation::class, 'id_periode');
    }
    
    /**
     * Calcule le score global selon la pondération SABC
     * Auto-évaluation : 20%, Pairs : 40%, Manager : 40%
     * 
     * @return float
     */
    public function calculerScoreGlobal(): float
    {
        $scoreAuto = $this->score_auto_evaluation ?? 0;
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
        $this->date_calcul = now();
        $this->save();
    }
    
    /**
     * Récupère les détails des scores
     * 
     * @return array
     */
    public function getDetailsScores(): array
    {
        return $this->details_scores_json ?? [];
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
        $scorePrecedent = static::where('id_utilisateur', $this->id_utilisateur)
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
        return $query->where('id_utilisateur', $idUtilisateur);
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
}
