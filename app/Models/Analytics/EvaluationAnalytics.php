<?php

namespace App\Models\Analytics;

use Illuminate\Database\Eloquent\Factories\HasFactory;

class EvaluationAnalytics extends AnalyticsModel
{
    use HasFactory;
    
    /**
     * La table associée au modèle.
     *
     * @var string
     */
    protected $table = 'evaluations_analytics';
    
    /**
     * La clé primaire associée à la table.
     *
     * @var string
     */
    protected $primaryKey = 'id_evaluation';
    
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
        'id_evaluation',
        'evaluateur_matricule',
        'evalue_matricule',
        'date_evaluation',
        'date_soumission',
        'statut',
        'score_moyen',
        'region_nom',
        'role_evaluateur',
        'role_evalue',
        'type_evaluation',
        'periode_titre',
        'annee',
        'semestre',
        'mois',
        'jour',
    ];
    
    /**
     * Les attributs qui doivent être convertis.
     *
     * @var array<string, string>
     */
    protected $casts = [
        'date_evaluation' => 'date',
        'date_soumission' => 'datetime',
        'score_moyen' => 'float',
        'annee' => 'integer',
        'semestre' => 'integer',
        'mois' => 'integer',
        'jour' => 'integer',
    ];
}
