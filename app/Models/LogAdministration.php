<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use App\Models\Core\CoreModel;

class LogAdministration extends Model
{
    use HasFactory;
    
    /**
     * Spécifie la connexion à utiliser pour ce modèle
     *
     * @var string
     */
    protected $connection = 'mysql';
    
    /**
     * La table associée au modèle.
     *
     * @var string
     */
    protected $table = 'logs_administration';
    
    /**
     * La clé primaire associée à la table.
     *
     * @var string
     */
    protected $primaryKey = 'id_log';
    
    /**
     * Les attributs qui sont assignables en masse.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'id_utilisateur',
        'action',
        'table_affectee',
        'id_enregistrement',
        'anciennes_valeurs_json',
        'nouvelles_valeurs_json',
        'ip_address',
        'user_agent',
        'date_action',
    ];
    
    /**
     * Les attributs qui doivent être convertis.
     *
     * @var array<string, string>
     */
    protected $casts = [
        'anciennes_valeurs_json' => 'json',
        'nouvelles_valeurs_json' => 'json',
        'date_action' => 'datetime',
    ];
    
    /**
     * Relation avec l'utilisateur qui a effectué l'action
     */
    public function utilisateur()
    {
        return $this->belongsTo(Utilisateur::class, 'id_utilisateur');
    }
    
    /**
     * Enregistre une action d'administration
     * 
     * @param int $idUtilisateur
     * @param string $action
     * @param string $tableAffectee
     * @param int|null $idEnregistrement
     * @param array|null $anciennesValeurs
     * @param array|null $nouvellesValeurs
     * @param string|null $ipAddress
     * @param string|null $userAgent
     * @return LogAdministration
     */
    public static function enregistrerAction(
        int $idUtilisateur,
        string $action,
        string $tableAffectee,
        ?int $idEnregistrement = null,
        ?array $anciennesValeurs = null,
        ?array $nouvellesValeurs = null,
        ?string $ipAddress = null,
        ?string $userAgent = null
    ): LogAdministration {
        return static::create([
            'id_utilisateur' => $idUtilisateur,
            'action' => $action,
            'table_affectee' => $tableAffectee,
            'id_enregistrement' => $idEnregistrement,
            'anciennes_valeurs_json' => $anciennesValeurs,
            'nouvelles_valeurs_json' => $nouvellesValeurs,
            'ip_address' => $ipAddress ?? request()->ip(),
            'user_agent' => $userAgent ?? request()->userAgent(),
            'date_action' => now(),
        ]);
    }
    
    /**
     * Récupère les anciennes valeurs
     * 
     * @return array
     */
    public function getAnciennesValeurs(): array
    {
        return $this->anciennes_valeurs_json ?? [];
    }
    
    /**
     * Récupère les nouvelles valeurs
     * 
     * @return array
     */
    public function getNouvellesValeurs(): array
    {
        return $this->nouvelles_valeurs_json ?? [];
    }
    
    /**
     * Récupère les changements effectués
     * 
     * @return array
     */
    public function getChangements(): array
    {
        $anciennes = $this->getAnciennesValeurs();
        $nouvelles = $this->getNouvellesValeurs();
        $changements = [];
        
        foreach ($nouvelles as $champ => $nouvelleValeur) {
            $ancienneValeur = $anciennes[$champ] ?? null;
            if ($ancienneValeur !== $nouvelleValeur) {
                $changements[$champ] = [
                    'ancienne' => $ancienneValeur,
                    'nouvelle' => $nouvelleValeur,
                ];
            }
        }
        
        return $changements;
    }
    
    /**
     * Scope pour filtrer par utilisateur
     */
    public function scopeParUtilisateur($query, $idUtilisateur)
    {
        return $query->where('id_utilisateur', $idUtilisateur);
    }
    
    /**
     * Scope pour filtrer par action
     */
    public function scopeParAction($query, $action)
    {
        return $query->where('action', $action);
    }
    
    /**
     * Scope pour filtrer par table affectée
     */
    public function scopeParTable($query, $table)
    {
        return $query->where('table_affectee', $table);
    }
    
    /**
     * Scope pour filtrer par période
     */
    public function scopeParPeriode($query, $dateDebut, $dateFin)
    {
        return $query->whereBetween('date_action', [$dateDebut, $dateFin]);
    }
    
    /**
     * Scope pour les actions récentes
     */
    public function scopeRecentes($query, $heures = 24)
    {
        return $query->where('date_action', '>=', now()->subHours($heures));
    }
}
