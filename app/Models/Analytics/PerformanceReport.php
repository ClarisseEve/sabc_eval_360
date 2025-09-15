<?php

namespace App\Models\Analytics;

use Illuminate\Database\Eloquent\Factories\HasFactory;

class PerformanceReport extends AnalyticsModel
{
    use HasFactory;
    
    /**
     * La table associée au modèle.
     *
     * @var string
     */
    protected $table = 'performance_reports';
    
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
        'type_region',
        'branche_nom',
        'role_nom',
        'niveau_hierarchique',
        'periode_titre',
        'annee',
        'semestre',
        'score_moyen',
        'score_min',
        'score_max',
        'ecart_type',
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
        'niveau_hierarchique' => 'integer',
        'score_moyen' => 'float',
        'score_min' => 'float',
        'score_max' => 'float',
        'ecart_type' => 'float',
        'nombre_evaluations' => 'integer',
        'progression_vs_precedente' => 'float',
        'date_calcul' => 'datetime',
    ];
    
    /**
     * Récupère les rapports de performance par région
     * 
     * @param int $annee
     * @param int|null $semestre
     * @return \Illuminate\Database\Eloquent\Collection
     */
    public static function getReportsByRegion($annee, $semestre = null)
    {
        $query = self::select([
            'region_nom',
            'type_region',
            'annee',
            'semestre',
            'score_moyen',
            'score_min',
            'score_max',
            'ecart_type',
            'nombre_evaluations',
            'progression_vs_precedente'
        ])
        ->where('annee', $annee)
        ->whereNull('role_nom'); // Agrégation au niveau région
        
        if ($semestre) {
            $query->where('semestre', $semestre);
        }
        
        return $query->orderBy('score_moyen', 'desc')
            ->get();
    }
    
    /**
     * Récupère les rapports de performance pour une région spécifique
     * 
     * @param string $region_nom
     * @param int $annee
     * @param int|null $semestre
     * @return \Illuminate\Database\Eloquent\Collection
     */
    public static function getRegionDetailedReport($region_nom, $annee, $semestre = null)
    {
        $query = self::select([
            'region_nom',
            'branche_nom',
            'role_nom',
            'niveau_hierarchique',
            'annee',
            'semestre',
            'score_moyen',
            'score_min',
            'score_max',
            'ecart_type',
            'nombre_evaluations',
            'progression_vs_precedente'
        ])
        ->where('region_nom', $region_nom)
        ->where('annee', $annee)
        ->whereNotNull('role_nom'); // Détails par rôle
        
        if ($semestre) {
            $query->where('semestre', $semestre);
        }
        
        return $query->orderBy('niveau_hierarchique')
            ->orderBy('score_moyen', 'desc')
            ->get();
    }
    
    /**
     * Détecte les anomalies de performance
     * 
     * @param float $threshold Seuil d'écart pour considérer une anomalie
     * @param int $annee
     * @param int|null $semestre
     * @return \Illuminate\Database\Eloquent\Collection
     */
    public static function detectPerformanceAnomalies($threshold = 1.5, $annee = null, $semestre = null)
    {
        if (!$annee) {
            $annee = date('Y');
        }
        
        $query = self::select([
            'region_nom',
            'branche_nom',
            'role_nom',
            'annee',
            'semestre',
            'score_moyen',
            'progression_vs_precedente'
        ])
        ->whereNotNull('role_nom')
        ->where(function($q) use ($threshold) {
            $q->where('progression_vs_precedente', '<', -$threshold)
              ->orWhere('progression_vs_precedente', '>', $threshold);
        });
        
        if ($annee) {
            $query->where('annee', $annee);
        }
        
        if ($semestre) {
            $query->where('semestre', $semestre);
        }
        
        return $query->orderBy('progression_vs_precedente')
            ->get();
    }
}
