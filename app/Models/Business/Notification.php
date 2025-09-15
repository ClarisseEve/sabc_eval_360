<?php

namespace App\Models\Business;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * Model Notification selon règles métier SABC
 * Gestion des notifications et escalades
 * Base: PostgreSQL (BUSINESS)
 */
class Notification extends Model
{
    use HasFactory;
    
    /**
     * Connexion PostgreSQL (BUSINESS) selon architecture SABC
     *
     * @var string
     */
    protected $connection = 'pgsql';
    
    /**
     * Table associée selon règles SABC
     *
     * @var string
     */
    protected $table = 'notifications';
    
    /**
     * Clé primaire
     *
     * @var string
     */
    protected $primaryKey = 'id_notification';
    public $incrementing = false;
    protected $keyType = 'string';
    
    /**
     * Attributs assignables selon règles métier SABC
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'id_notification',
        'destinataire_matricule',
        'expediteur_matricule',
        'type_notification',
        'titre',
        'message',
        'donnees_contexte',
        'priorite',
        'canal',
        'est_lue',
        'date_lecture',
        'date_envoi',
        'date_expiration',
        'id_evaluation',
        'code_periode',
        'id_region',
        'niveau_escalade',
        'prochaine_escalade',
        'manager_escalade_matricule'
    ];
    
    /**
     * Attributs convertis selon règles SABC
     *
     * @var array<string, string>
     */
    protected $casts = [
        'donnees_contexte' => 'array',
        'est_lue' => 'boolean',
        'date_lecture' => 'datetime',
        'date_envoi' => 'datetime',
        'date_expiration' => 'datetime',
        'niveau_escalade' => 'integer',
        'prochaine_escalade' => 'datetime',
        'created_at' => 'datetime',
        'updated_at' => 'datetime'
    ];
    
    /**
     * Types de notifications selon règles métier SABC
     */
    public const TYPES_NOTIFICATIONS = [
        'evaluation_en_retard' => 'Évaluation en Retard',
        'validation_en_attente' => 'Validation en Attente',
        'performance_en_baisse' => 'Performance en Baisse',
        'evaluation_incoherente' => 'Évaluation Incohérente',
        'escalade_manager' => 'Escalade Manager',
        'rappel_evaluation' => 'Rappel Évaluation',
        'periode_ouverte' => 'Période Ouverte',
        'periode_fermee' => 'Période Fermée'
    ];
    
    /**
     * Priorités selon escalade SABC
     */
    public const PRIORITES = [
        'basse' => 'Basse',
        'normale' => 'Normale',
        'haute' => 'Haute',
        'critique' => 'Critique'
    ];
    
    /**
     * Canaux selon règles SABC
     */
    public const CANAUX = [
        'email' => 'Email',
        'sms' => 'SMS',
        'push' => 'Push',
        'interne' => 'Interne'
    ];
    
    /**
     * Scope pour notifications non lues selon règles SABC
     */
    public function scopeNonLues($query)
    {
        return $query->where('est_lue', false);
    }
    
    /**
     * Scope pour notifications critiques selon escalade SABC
     */
    public function scopeCritiques($query)
    {
        return $query->where('priorite', 'critique');
    }
    
    /**
     * Scope pour notifications nécessitant escalade selon hiérarchie SABC
     */
    public function scopeAEscalader($query)
    {
        return $query->where('prochaine_escalade', '<=', now())
                    ->where('niveau_escalade', '<', 3); // Max 3 niveaux selon règles SABC
    }
    
    /**
     * Scope par destinataire selon hiérarchie SABC
     */
    public function scopePourUtilisateur($query, string $matricule)
    {
        return $query->where('destinataire_matricule', $matricule);
    }
    
    /**
     * Scope par période selon règles SABC
     */
    public function scopePourPeriode($query, string $codePeriode)
    {
        return $query->where('code_periode', $codePeriode);
    }
    
    /**
     * Marquer comme lue selon workflow SABC
     */
    public function marquerCommeLue(): void
    {
        $this->update([
            'est_lue' => true,
            'date_lecture' => now()
        ]);
    }
    
    /**
     * Escalader selon hiérarchie SABC
     */
    public function escalader(string $managerMatricule): void
    {
        $this->update([
            'niveau_escalade' => $this->niveau_escalade + 1,
            'manager_escalade_matricule' => $managerMatricule,
            'prochaine_escalade' => now()->addDays(3), // 3 jours selon règles SABC
            'priorite' => $this->niveau_escalade >= 2 ? 'critique' : 'haute'
        ]);
    }
}
