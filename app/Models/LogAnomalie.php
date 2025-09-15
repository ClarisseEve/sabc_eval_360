<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use App\Models\Analytics\AnalyticsModel;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * Model LogAnomalie selon règles métier SABC
 * Détection et suivi des anomalies d'évaluation
 * Base: ClickHouse (ANALYTICS)
 */
class LogAnomalie extends AnalyticsModel
{
    use HasFactory;
    
    /**
     * Connexion ClickHouse (ANALYTICS) selon architecture SABC
     *
     * @var string
     */
    protected $connection = 'clickhouse';
    
    /**
     * Table associée selon règles SABC
     *
     * @var string
     */
    protected $table = 'logs_anomalies';
    
    /**
     * Clé primaire
     *
     * @var string
     */
    protected $primaryKey = 'id_anomalie';
    public $incrementing = false;
    protected $keyType = 'string';
    
    /**
     * Attributs assignables selon règles métier SABC
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'id_anomalie',
        'type_anomalie',
        'matricule_concerne',
        'matricule_evaluateur',
        'id_evaluation',
        'code_periode',
        'description',
        'donnees_anomalie',
        'score_severite',
        'valeur_detectee',
        'seuil_configure',
        'ecart_seuil',
        'statut',
        'assignee_matricule',
        'commentaire_resolution',
        'date_resolution',
        'necessite_escalade',
        'manager_notifie_matricule',
        'date_escalade'
    ];
    
    /**
     * Attributs convertis selon règles SABC
     *
     * @var array<string, string>
     */
    protected $casts = [
        'donnees_anomalie' => 'array',
        'score_severite' => 'decimal:2',
        'valeur_detectee' => 'decimal:2',
        'seuil_configure' => 'decimal:2',
        'ecart_seuil' => 'decimal:2',
        'necessite_escalade' => 'boolean',
        'date_resolution' => 'datetime',
        'date_escalade' => 'datetime',
        'created_at' => 'datetime',
        'updated_at' => 'datetime'
    ];
    
    /**
     * Types d'anomalies selon règles métier SABC
     */
    public const TYPES_ANOMALIES = [
        'divergence_auto_autres' => 'Divergence Auto vs. Autres',
        'baisse_performance' => 'Baisse de Performance',
        'uniformite_evaluations' => 'Uniformité des Évaluations',
        'biais_evaluateur' => 'Biais Évaluateur',
        'evaluation_tardive' => 'Évaluation Tardive',
        'score_incoherent' => 'Score Incohérent'
    ];
    
    /**
     * Statuts selon workflow SABC
     */
    public const STATUTS = [
        'detectee' => 'Détectée',
        'en_cours' => 'En Cours',
        'resolue' => 'Résolue',
        'ignoree' => 'Ignorée'
    ];
    
    /**
     * Scope pour anomalies critiques selon règles SABC
     */
    public function scopeCritiques($query)
    {
        return $query->where('score_severite', '>=', 7.0);
    }
    
    /**
     * Scope pour anomalies nécessitant escalade selon hiérarchie SABC
     */
    public function scopeNecessiteEscalade($query)
    {
        return $query->where('necessite_escalade', true);
    }
    
    /**
     * Scope par période selon règles SABC
     */
    public function scopePourPeriode($query, string $codePeriode)
    {
        return $query->where('code_periode', $codePeriode);
    }
    
    /**
     * Scope par type selon règles métier SABC
     */
    public function scopeParType($query, string $type)
    {
        return $query->where('type_anomalie', $type);
    }
}
