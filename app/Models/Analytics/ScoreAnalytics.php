<?php

namespace App\Models\Analytics;

use Illuminate\Database\Eloquent\Factories\HasFactory;

class ScoreAnalytics extends AnalyticsModel
{
    use HasFactory;
    
    /**
     * La table associée au modèle.
     *
     * @var string
     */
    protected $table = 'scores_analytics';
    
    /**
     * Indique si les timestamps sont automatiquement gérés.
     *
     * @var bool
     */
    public $timestamps = false;
    
    /**
     * Les attributs qui sont assignables en masse.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'region_nom',
        'role_nom',
        'branche_nom',
        'periode_titre',
        'annee',
        'semestre',
        'score_moyen',
        'nombre_evaluations',
        'progression_vs_precedente',
        'date_calcul',
    ];
    
    /**
     * Les attributs qui doivent être convertis.
     *
     * @var array<string, string>
     */
    protected $casts = [
        'annee' => 'integer',
        'semestre' => 'integer',
        'score_moyen' => 'float',
        'nombre_evaluations' => 'integer',
        'progression_vs_precedente' => 'float',
        'date_calcul' => 'datetime',
    ];
    
    /**
     * Récupère les scores agrégés par région
     * 
     * @param int $annee
     * @param int $semestre
     * @return \Illuminate\Database\Eloquent\Collection
     */
    public static function getScoresByRegion($annee, $semestre = null)
    {
        $query = self::select([
            'region_nom',
            'annee',
            'semestre',
            'score_moyen',
            'nombre_evaluations',
            'progression_vs_precedente'
        ])
        ->where('annee', $annee);
        
        if ($semestre) {
            $query->where('semestre', $semestre);
        }
        
        return $query->groupBy(['region_nom', 'annee', 'semestre'])
            ->orderBy('score_moyen', 'desc')
            ->get();
    }
    
    /**
     * Récupère les scores agrégés par rôle
     * 
     * @param int $annee
     * @param int $semestre
     * @param string|null $region_nom
     * @return \Illuminate\Database\Eloquent\Collection
     */
    public static function getScoresByRole($annee, $semestre = null, $region_nom = null)
    {
        $query = self::select([
            'role_nom',
            'annee',
            'semestre',
            'score_moyen',
            'nombre_evaluations',
            'progression_vs_precedente'
        ])
        ->where('annee', $annee);
        
        if ($semestre) {
            $query->where('semestre', $semestre);
        }
        
        if ($region_nom) {
            $query->where('region_nom', $region_nom);
        }
        
        return $query->groupBy(['role_nom', 'annee', 'semestre'])
            ->orderBy('score_moyen', 'desc')
            ->get();
    }
}
