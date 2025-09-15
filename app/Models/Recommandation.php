<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use App\Models\Analytics\AnalyticsModel;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * Model Recommandation selon règles métier SABC
 * Engine de recommandations pour développement talents
 * Base: ClickHouse (ANALYTICS)
 */
class Recommandation extends AnalyticsModel
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
    protected $table = 'recommandations';
    
    /**
     * Clé primaire
     *
     * @var string
     */
    protected $primaryKey = 'id_recommandation';
    public $incrementing = false;
    protected $keyType = 'string';
    
    /**
     * Attributs assignables selon règles métier SABC
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'id_recommandation',
        'matricule_destinataire',
        'matricule_generateur',
        'type_recommandation',
        'titre',
        'description',
        'criteres_declencheurs',
        'donnees_support',
        'priorite',
        'score_pertinence',
        'date_echeance_suggeree',
        'duree_estimee_jours',
        'cout_estime',
        'statut',
        'date_acceptation',
        'date_completion',
        'commentaire_utilisateur',
        'score_avant',
        'score_apres',
        'amelioration_mesuree',
        'objectif_atteint',
        'code_periode_origine',
        'id_region',
        'axe_competence'
    ];
    
    /**
     * Attributs convertis selon règles SABC
     *
     * @var array<string, string>
     */
    protected $casts = [
        'criteres_declencheurs' => 'array',
        'donnees_support' => 'array',
        'score_pertinence' => 'decimal:2',
        'date_echeance_suggeree' => 'date',
        'duree_estimee_jours' => 'integer',
        'cout_estime' => 'decimal:2',
        'date_acceptation' => 'datetime',
        'date_completion' => 'datetime',
        'score_avant' => 'decimal:2',
        'score_apres' => 'decimal:2',
        'amelioration_mesuree' => 'decimal:2',
        'objectif_atteint' => 'boolean',
        'created_at' => 'datetime',
        'updated_at' => 'datetime'
    ];
    
    /**
     * Types de recommandations selon règles métier SABC
     */
    public const TYPES_RECOMMANDATIONS = [
        'formation' => 'Formation',
        'mentorat' => 'Mentorat',
        'mobilite' => 'Mobilité',
        'plan_developpement' => 'Plan de Développement',
        'objectif_smart' => 'Objectif SMART',
        'coaching' => 'Coaching'
    ];
    
    /**
     * Priorités selon performance SABC
     */
    public const PRIORITES = [
        'basse' => 'Basse',
        'normale' => 'Normale',
        'haute' => 'Haute',
        'critique' => 'Critique'
    ];
    
    /**
     * Statuts selon workflow SABC
     */
    public const STATUTS = [
        'proposee' => 'Proposée',
        'acceptee' => 'Acceptée',
        'en_cours' => 'En Cours',
        'completee' => 'Complétée',
        'rejetee' => 'Rejetée'
    ];
    
    /**
     * Scope pour recommandations actives selon règles SABC
     */
    public function scopeActives($query)
    {
        return $query->whereIn('statut', ['proposee', 'acceptee', 'en_cours']);
    }
    
    /**
     * Scope pour recommandations prioritaires selon règles SABC
     */
    public function scopePrioritaires($query)
    {
        return $query->whereIn('priorite', ['haute', 'critique']);
    }
    
    /**
     * Scope par destinataire selon hiérarchie SABC
     */
    public function scopePourUtilisateur($query, string $matricule)
    {
        return $query->where('matricule_destinataire', $matricule);
    }
    
    /**
     * Scope par type selon règles métier SABC
     */
    public function scopeParType($query, string $type)
    {
        return $query->where('type_recommandation', $type);
    }
    
    /**
     * Scope par région selon contraintes géographiques SABC
     */
    public function scopeParRegion($query, string $idRegion)
    {
        return $query->where('id_region', $idRegion);
    }
    
    /**
     * Calcul efficacité selon règles SABC
     */
    public function calculerEfficacite(): ?float
    {
        if ($this->score_avant && $this->score_apres) {
            return $this->score_apres - $this->score_avant;
        }
        
        return null;
    }
    
    /**
     * Vérification objectif atteint selon règles SABC
     */
    public function objectifAtteint(): bool
    {
        return $this->objectif_atteint === true;
    }
}
