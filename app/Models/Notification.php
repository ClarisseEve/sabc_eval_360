<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\App;
use Illuminate\Support\Facades\Log;
use App\Services\IdGeneratorService;
use App\Models\Utilisateur;

class Notification extends Model
{
    use HasFactory;
    
    /**
     * Spécifie la connexion à utiliser pour ce modèle
     *
     * @var string
     */
    protected $connection = 'mysql';
    
    /**
     * La clé primaire associée à la table.
     *
     * @var string
     */
    protected $table = 'notifications_utilisateurs';

    protected $primaryKey = 'id_notification';
    public $incrementing = false;
    protected $keyType = 'string';
    
    /**
     * Les attributs qui sont assignables en masse.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'id_notification',
        'destinataire_matricule',
        'titre',
        'message',
        'type',
        'est_lu',
        'lien',
        'date_creation',
        'date_lecture',
        'donnees_json',
        'id_evaluation',
        'id_remplacement',
        'expediteur_matricule',
    ];
    
    /**
     * Les attributs qui doivent être convertis.
     *
     * @var array<string, string>
     */
    protected $casts = [
        'est_lu' => 'boolean',
        'date_creation' => 'datetime',
        'date_lecture' => 'datetime',
        'donnees_json' => 'json',
    ];

    /**
     * Vocabulaire standard pour les priorités et canaux (compat Business)
     */
    public const PRIORITES = [
        'basse', 'normale', 'haute', 'critique'
    ];

    public const CANAUX = [
        'email', 'sms', 'push', 'interne'
    ];
    
    /**
     * Relation avec l'utilisateur destinataire
     */
    public function destinataire()
    {
        return $this->belongsTo(Utilisateur::class, 'destinataire_matricule', 'matricule');
    }
    
    /**
     * Crée une notification pour un utilisateur
     * 
     * @param string $destinataireMatricule
     * @param string $titre
     * @param string $message
     * @param string $type
     * @param array|null $donnees
     * @return Notification
     */
    public static function creer(
        string $destinataireMatricule,
        string $titre,
        string $message,
        string $type = 'info',
        ?array $donnees = null
    ): Notification {
        try {
            /** @var IdGeneratorService $idGenerator */
            $idGenerator = App::make(IdGeneratorService::class);
            $idNotification = $idGenerator->generateTableId('notifications_utilisateurs');

            return static::create([
                'id_notification' => $idNotification,
                'destinataire_matricule' => $destinataireMatricule,
                'titre' => $titre,
                'message' => $message,
                'type' => $type,
                'est_lu' => false,
                'date_creation' => now(),
                'donnees_json' => $donnees,
            ]);
        } catch (\Throwable $e) {
            // Évite l'échec du flux d'évaluation si le schéma Notification n'est pas aligné
            Log::warning('Notification non persistée (schéma non aligné): '.$e->getMessage(), [
                'destinataire' => $destinataireMatricule,
                'titre' => $titre,
                'type' => $type,
            ]);
            // Retourne un modèle en mémoire pour éviter les null checks en chaîne
            $model = new static([
                'id_notification' => $idNotification ?? null,
                'destinataire_matricule' => $destinataireMatricule,
                'titre' => $titre,
                'message' => $message,
                'type' => $type,
                'est_lu' => false,
                'date_creation' => now(),
                'donnees_json' => $donnees,
            ]);
            return $model;
        }
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
        return $this->date_creation->greaterThan(now()->subDay());
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
        return $query->where('destinataire_matricule', $idDestinataire);
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
        return $query->where('date_creation', '>=', now()->subHours($heures));
    }

    /**
     * Notifications spécifiques pour les évaluations
     */
    public static function notifierNouvelleEvaluation(string $matriculeEvalue, string $matriculeEvaluateur): void
    {
        $matriculeEvalue = static::resolveMatricule($matriculeEvalue);
        $matriculeEvaluateur = static::resolveMatricule($matriculeEvaluateur);

        $evaluateur = Utilisateur::where('matricule', $matriculeEvaluateur)->first();
        
        static::creer(
            $matriculeEvalue,
            'Nouvelle évaluation reçue',
            $evaluateur
                ? "Vous avez reçu une nouvelle évaluation de {$evaluateur->prenom} {$evaluateur->nom}."
                : 'Vous avez reçu une nouvelle évaluation.',
            'evaluation',
            ['evaluateur' => $matriculeEvaluateur]
        );
    }

    /**
     * Notification pour validation d'évaluation
     */
    public static function notifierValidationEvaluation(string $matriculeEvaluateur, bool $estValidee): void
    {
        $titre = $estValidee ? 'Évaluation validée' : 'Évaluation rejetée';
        $message = $estValidee 
            ? 'Votre évaluation a été validée par votre manager.'
            : 'Votre évaluation a été rejetée. Veuillez la corriger et la soumettre à nouveau.';
        
        static::creer(
            static::resolveMatricule($matriculeEvaluateur),
            $titre,
            $message,
            $estValidee ? 'success' : 'warning'
        );
    }

    /**
     * Notification pour rappel d'évaluation
     */
    public static function notifierRappelEvaluation(string $matriculeUtilisateur, int $joursRestants): void
    {
        static::creer(
            static::resolveMatricule($matriculeUtilisateur),
            'Rappel : Évaluation en attente',
            "Il vous reste {$joursRestants} jour(s) pour compléter vos évaluations en cours.",
            'reminder'
        );
    }

    /**
     * Convertit un identifiant système en matricule (compatibilité anciens schémas).
     */
    protected static function resolveMatricule($identifiant): string
    {
        $identifiant = (string) $identifiant;

        $utilisateur = Utilisateur::where('matricule', $identifiant)->first();

        return $utilisateur ? $utilisateur->matricule : $identifiant;
    }
}
