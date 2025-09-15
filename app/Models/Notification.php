<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use App\Models\Business\BusinessModel;

class Notification extends Model
{
    use HasFactory;
    
    /**
     * Spécifie la connexion à utiliser pour ce modèle
     *
     * @var string
     */
    protected $connection = 'pgsql';
    
    /**
     * La clé primaire associée à la table.
     *
     * @var string
     */
    protected $primaryKey = 'id_notification';
    
    /**
     * Les attributs qui sont assignables en masse.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'id_destinataire',
        'titre',
        'message',
        'type',
        'est_lu',
        'date_envoi',
        'date_lecture',
        'donnees_json',
    ];
    
    /**
     * Les attributs qui doivent être convertis.
     *
     * @var array<string, string>
     */
    protected $casts = [
        'est_lu' => 'boolean',
        'date_envoi' => 'datetime',
        'date_lecture' => 'datetime',
        'donnees_json' => 'json',
    ];
    
    /**
     * Relation avec l'utilisateur destinataire
     */
    public function destinataire()
    {
        return $this->belongsTo(Utilisateur::class, 'id_destinataire');
    }
    
    /**
     * Crée une notification pour un utilisateur
     * 
     * @param int $idDestinataire
     * @param string $titre
     * @param string $message
     * @param string $type
     * @param array|null $donnees
     * @return Notification
     */
    public static function creer(
        int $idDestinataire,
        string $titre,
        string $message,
        string $type = 'info',
        ?array $donnees = null
    ): Notification {
        return static::create([
            'id_destinataire' => $idDestinataire,
            'titre' => $titre,
            'message' => $message,
            'type' => $type,
            'est_lu' => false,
            'date_envoi' => now(),
            'donnees_json' => $donnees,
        ]);
    }
    
    /**
     * Marque la notification comme lue
     */
    public function marquerCommeLue(): void
    {
        if (!$this->est_lu) {
            $this->update([
                'est_lu' => true,
                'date_lecture' => now(),
            ]);
        }
    }
    
    /**
     * Récupère les données additionnelles de la notification
     * 
     * @return array
     */
    public function getDonnees(): array
    {
        return $this->donnees_json ?? [];
    }
    
    /**
     * Vérifie si la notification est récente (moins de 24h)
     * 
     * @return bool
     */
    public function estRecente(): bool
    {
        return $this->date_envoi->greaterThan(now()->subDay());
    }
    
    /**
     * Scope pour les notifications non lues
     */
    public function scopeNonLues($query)
    {
        return $query->where('est_lu', false);
    }
    
    /**
     * Scope pour filtrer par destinataire
     */
    public function scopeParDestinataire($query, $idDestinataire)
    {
        return $query->where('id_destinataire', $idDestinataire);
    }
    
    /**
     * Scope pour filtrer par type
     */
    public function scopeParType($query, $type)
    {
        return $query->where('type', $type);
    }
    
    /**
     * Scope pour les notifications récentes
     */
    public function scopeRecentes($query, $heures = 24)
    {
        return $query->where('date_envoi', '>=', now()->subHours($heures));
    }
    
    /**
     * Notifications spécifiques pour les évaluations
     */
    public static function notifierNouvelleEvaluation(int $idEvalue, int $idEvaluateur): void
    {
        $evaluateur = Utilisateur::find($idEvaluateur);
        
        static::creer(
            $idEvalue,
            'Nouvelle évaluation reçue',
            "Vous avez reçu une nouvelle évaluation de {$evaluateur->prenom} {$evaluateur->nom}.",
            'evaluation',
            ['id_evaluateur' => $idEvaluateur]
        );
    }
    
    /**
     * Notification pour validation d'évaluation
     */
    public static function notifierValidationEvaluation(int $idEvaluateur, bool $estValidee): void
    {
        $titre = $estValidee ? 'Évaluation validée' : 'Évaluation rejetée';
        $message = $estValidee 
            ? 'Votre évaluation a été validée par votre manager.'
            : 'Votre évaluation a été rejetée. Veuillez la corriger et la soumettre à nouveau.';
        
        static::creer(
            $idEvaluateur,
            $titre,
            $message,
            $estValidee ? 'success' : 'warning'
        );
    }
    
    /**
     * Notification pour rappel d'évaluation
     */
    public static function notifierRappelEvaluation(int $idUtilisateur, int $joursRestants): void
    {
        static::creer(
            $idUtilisateur,
            'Rappel : Évaluation en attente',
            "Il vous reste {$joursRestants} jour(s) pour compléter vos évaluations en cours.",
            'reminder'
        );
    }
}
