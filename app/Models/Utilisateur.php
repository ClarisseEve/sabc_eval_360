<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use App\Models\Core\CoreModel;

class Utilisateur extends Authenticatable
{
    use HasFactory, Notifiable;
    
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
    protected $table = 'utilisateurs';
    
    /**
     * La clé primaire associée à la table.
     *
     * @var string
     */
    protected $primaryKey = 'matricule';
    
    /**
     * Indique si la clé primaire est auto-incrémentée.
     *
     * @var bool
     */
    public $incrementing = false;
    
    /**
     * Le type de la clé primaire.
     *
     * @var string
     */
    protected $keyType = 'string';
    
    /**
     * Champs utilisables pour l'authentification
     * L'authentification se fait par email ou matricule
     */
    public function getAuthIdentifierName()
    {
        return 'matricule';
    }
    
    /**
     * Les attributs qui sont assignables en masse.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'matricule',
        'nom',
        'prenom',
        'email',
        'telephone',
        'date_naissance',
        'password',
        'role',
        'manager_matricule',
        'niveau_hierarchique',
        'id_region',
        'id_branche',
        'region_nom',
        'role_nom',
        'type_region',
        'est_actif',
        'est_admin',
        'est_indisponible',
        'photo_url',
        'statut',
        'date_debut_indisponibilite',
        'date_fin_indisponibilite',
        'motif_indisponibilite',
        'roles_support_json',
    ];

    /**
     * Les attributs qui doivent être cachés pour la sérialisation.
     *
     * @var array<int, string>
     */
    protected $hidden = [
        'password',
        'remember_token',
    ];

    /**
     * Les attributs qui doivent être convertis.
     *
     * @var array<string, string>
     */
    protected $casts = [
        'email_verified_at' => 'timestamp',
        'password' => 'hashed',
        'niveau_hierarchique' => 'integer',
        'est_actif' => 'boolean',
        'est_admin' => 'boolean',
        'est_indisponible' => 'boolean',
        'date_debut_indisponibilite' => 'date',
        'date_fin_indisponibilite' => 'date',
        'roles_support_json' => 'array',
    ];
    
    /**
     * Relation avec la région de l'utilisateur
     */
    public function regionEntity()
    {
        return $this->belongsTo(Region::class, 'id_region', 'id_region');
    }
    
    /**
     * Relation avec la branche de l'utilisateur
     */
    public function branche()
    {
        return $this->belongsTo(Branche::class, 'id_branche', 'id_branche');
    }
    
    /**
     * Relation avec le rôle de l'utilisateur
     */
    public function roleModel()
    {
        return $this->belongsTo(Role::class, 'role', 'nom_role');
    }
    
    /**
     * Récupère le modèle Role associé
     */
    public function getRoleObject()
    {
        return Role::where('nom_role', $this->role)->first();
    }
    

    
    /**
     * Relation avec le manager de l'utilisateur
     */
    public function manager()
    {
        return $this->belongsTo(Utilisateur::class, 'manager_matricule', 'matricule');
    }
    
    /**
     * Relation avec les subordonnés de l'utilisateur
     */
    public function subordonnes()
    {
        return $this->hasMany(Utilisateur::class, 'manager_matricule', 'matricule');
    }
    
    /**
     * Récupère les évaluations données par cet utilisateur
     */
    public function evaluationsDonnees()
    {
        return $this->hasMany(Evaluation::class, 'evaluateur_matricule', 'matricule');
    }
    
    /**
     * Récupère les évaluations reçues par cet utilisateur
     */
    public function evaluationsRecues()
    {
        return $this->hasMany(Evaluation::class, 'evalue_matricule', 'matricule');
    }
    
    /**
     * Récupère les scores de cet utilisateur
     */
    public function scores()
    {
        return $this->hasMany(ScoreUtilisateur::class, 'id_utilisateur');
    }
    
    /**
     * Récupère les notifications de cet utilisateur
     */
    public function notifications()
    {
        return $this->hasMany(Notification::class, 'id_destinataire');
    }
    
    /**
     * Récupère les remplacements où cet utilisateur est le titulaire (remplacé)
     */
    public function remplacementsEnTantQueTitulaire()
    {
        return $this->hasMany(RemplacementTemporaire::class, 'titulaire_matricule', 'matricule');
    }
    
    /**
     * Récupère les remplacements où cet utilisateur est le remplaçant
     */
    public function remplacementsEnTantQueRemplacant()
    {
        return $this->hasMany(RemplacementTemporaire::class, 'remplacant_matricule', 'matricule');
    }
    
    /**
     * Récupère les remplacements actifs où cet utilisateur est le titulaire
     */
    public function remplacementsActifsEnTantQueTitulaire()
    {
        return $this->remplacementsEnTantQueTitulaire()
            ->where('est_actif', true)
            ->where(function ($query) {
                $query->where(function ($q) {
                    $q->where('date_debut', '<=', now())
                      ->where(function ($q2) {
                          $q2->where('date_fin', '>=', now())
                             ->orWhereNull('date_fin');
                      });
                });
            });
    }
    
    /**
     * Récupère les remplacements actifs où cet utilisateur est le remplaçant
     */
    public function remplacementsActifsEnTantQueRemplacant()
    {
        return $this->remplacementsEnTantQueRemplacant()
            ->where('est_actif', true)
            ->where(function ($query) {
                $query->where(function ($q) {
                    $q->where('date_debut', '<=', now())
                      ->where(function ($q2) {
                          $q2->where('date_fin', '>=', now())
                             ->orWhereNull('date_fin');
                      });
                });
            });
    }
    
    /**
     * Vérifie si l'utilisateur peut évaluer un autre utilisateur
     * Prend en compte les remplacements temporaires
     * 
     * @param Utilisateur $utilisateurEvalue
     * @param string $typeEvaluation
     * @return bool
     */
    public function peutEvaluer(Utilisateur $utilisateurEvalue, ?string $typeEvaluation = null): bool
    {
        // Vérifier si l'utilisateur est indisponible et n'est pas un remplaçant
        if ($this->estIndisponible() && !$this->estRemplacantActif()) {
            return false;
        }
        
        // Vérifier si l'utilisateur évalué est indisponible et n'a pas de remplaçant
        if ($utilisateurEvalue->estIndisponible() && !$utilisateurEvalue->estRemplace()) {
            return false;
        }
        
        // Vérifier si les utilisateurs sont dans la même région
        if ($this->id_region !== $utilisateurEvalue->id_region) {
            // Vérifier si l'utilisateur est un remplaçant pour un titulaire dans la région de l'évalué
            $remplacements = $this->remplacementsActifsEnTantQueRemplacant()->get();
            $peutEvaluerViaRemplacement = false;
            
            foreach ($remplacements as $remplacement) {
                $titulaire = Utilisateur::where('matricule', $remplacement->titulaire_matricule)->first();
                if ($titulaire && $titulaire->id_region === $utilisateurEvalue->id_region) {
                    $peutEvaluerViaRemplacement = true;
                    break;
                }
            }
            
            if (!$peutEvaluerViaRemplacement) {
                return false;
            }
        }
        
        // Auto-évaluation
        if ($this->matricule === $utilisateurEvalue->matricule) {
            return $this->getRoleObject()->peut_auto_evaluer;
        }
        
        // Vérifier si les branches sont identiques
        $memeBranche = $this->getRoleObject()->id_branche === $utilisateurEvalue->getRoleObject()->id_branche;
        
        // Déterminer si l'utilisateur évalué est un subordonné direct
        $estSubordonneDirect = $utilisateurEvalue->manager_matricule === $this->matricule;
        
        // Vérifier si l'utilisateur est un remplaçant pour le manager de l'évalué
        if (!$estSubordonneDirect) {
            $remplacements = $this->remplacementsActifsEnTantQueRemplacant()->get();
            foreach ($remplacements as $remplacement) {
                $titulaire = Utilisateur::where('matricule', $remplacement->titulaire_matricule)->first();
                if ($titulaire && $utilisateurEvalue->manager_matricule === $titulaire->matricule) {
                    $estSubordonneDirect = true;
                    break;
                }
            }
        }
        
        // Cas spécial pour RTM et SRMO : vérification stricte des rôles des subordonnés
        if (in_array($this->getRoleObject()->nom_role, ['RTM', 'SRMO'])) {
            // RTM ne peut évaluer que TMO et SS directement (pas AS)
            if ($this->getRoleObject()->nom_role === 'RTM') {
                if (!in_array($utilisateurEvalue->getRoleObject()->nom_role, ['TMO', 'SS'])) {
                    return false;
                }
            }
            
            // SRMO ne peut évaluer que TMO directement
            if ($this->getRoleObject()->nom_role === 'SRMO') {
                if ($utilisateurEvalue->getRoleObject()->nom_role !== 'TMO') {
                    return false;
                }
            }
            
            // Vérifier que c'est bien un subordonné direct
            if (!$estSubordonneDirect) {
                return false;
            }
        }
        
        // Vérifier les rôles support (cumul de fonctions)
        if (!$memeBranche && is_array($this->roles_support_json) && !empty($this->roles_support_json)) {
            foreach ($this->roles_support_json as $roleSupport) {
                if (isset($roleSupport['role']) && isset($roleSupport['region'])) {
                    $roleObj = Role::where('nom_role', $roleSupport['role'])->first();
                    if ($roleObj && $roleObj->id_branche === $utilisateurEvalue->getRoleObject()->id_branche) {
                        $memeBranche = true;
                        break;
                    }
                }
            }
        }
        
        // Utiliser la logique du modèle Role pour vérifier les permissions
        return $this->getRoleObject()->peutEvaluer($utilisateurEvalue->getRoleObject(), $memeBranche, $estSubordonneDirect);
    }
    
    /**
     * Règles de validation pour la création d'un utilisateur
     * 
     * @return array<string, mixed>
     */
    public static function validationRules(): array
    {
        return [
            'matricule' => 'required|string|max:20|unique:utilisateurs,matricule',
            'nom' => 'required|string|max:100',
            'prenom' => 'required|string|max:100',
            'email' => 'required|email|max:255|unique:utilisateurs,email',
            'telephone' => 'required|string|max:20',
            'username' => 'required|string|max:50|unique:utilisateurs,username',
            'password' => 'required|string|min:8',
            'id_role' => 'required|exists:roles,id_role',
            'id_region' => 'required|exists:regions,id_region',
            'id_manager' => 'nullable|exists:utilisateurs,id_utilisateur',
            'statut' => 'required|in:Actif,En_conge,Indisponible,Support_Actif',
            'date_prise_poste' => 'required|date',
            'date_debut_indisponibilite' => 'nullable|date',
            'date_fin_indisponibilite' => 'nullable|date|after_or_equal:date_debut_indisponibilite',
            'motif_indisponibilite' => 'nullable|string|max:100',
            'roles_support_json' => 'nullable|json',
        ];
    }
    
    /**
     * Vérifie si l'utilisateur est actuellement indisponible
     * 
     * @return bool
     */
    public function estIndisponible(): bool
    {
        if ($this->statut !== 'Indisponible' && $this->statut !== 'En_conge') {
            return false;
        }
        
        // Si pas de dates d'indisponibilité définies, on se base uniquement sur le statut
        if (!$this->date_debut_indisponibilite) {
            return true;
        }
        
        $aujourdhui = now()->startOfDay();
        $dateDebut = $this->date_debut_indisponibilite->startOfDay();
        $dateFin = $this->date_fin_indisponibilite ? $this->date_fin_indisponibilite->startOfDay() : null;
        
        return $dateDebut->lessThanOrEqualTo($aujourdhui) && 
               (!$dateFin || $dateFin->greaterThanOrEqualTo($aujourdhui));
    }
    
    /**
     * Vérifie si l'utilisateur est un remplaçant actif
     * 
     * @return bool
     */
    public function estRemplacantActif(): bool
    {
        return $this->statut === 'Support_Actif' || $this->remplacementsActifsEnTantQueRemplacant()->exists();
    }
    
    /**
     * Vérifie si l'utilisateur est actuellement remplacé
     * 
     * @return bool
     */
    public function estRemplace(): bool
    {
        return $this->estIndisponible() && $this->remplacementsActifsEnTantQueTitulaire()->exists();
    }
    
    /**
     * Récupère le remplaçant actif de l'utilisateur, s'il existe
     * 
     * @return Utilisateur|null
     */
    public function remplacantActif(): ?Utilisateur
    {
        $remplacement = $this->remplacementsActifsEnTantQueTitulaire()->first();
        if (!$remplacement) {
            return null;
        }
        
        return Utilisateur::where('matricule', $remplacement->remplacant_matricule)->first();
    }
    
    /**
     * Récupère les utilisateurs que cet utilisateur remplace actuellement
     * 
     * @return \Illuminate\Database\Eloquent\Collection
     */
    public function utilisateursRemplaces()
    {
        $remplacements = $this->remplacementsActifsEnTantQueRemplacant()->get();
        if ($remplacements->isEmpty()) {
            return collect();
        }
        
        $matricules = $remplacements->pluck('titulaire_matricule')->toArray();
        return Utilisateur::whereIn('matricule', $matricules)->get();
    }
    
    /**
     * Définit l'utilisateur comme indisponible pour la période spécifiée
     * 
     * @param string $motif
     * @param \DateTime|string $dateDebut
     * @param \DateTime|string|null $dateFin
     * @param string $statut
     * @return $this
     */
    public function definirIndisponible(string $motif, $dateDebut, $dateFin = null, string $statut = 'Indisponible')
    {
        $this->statut = $statut;
        $this->motif_indisponibilite = $motif;
        $this->date_debut_indisponibilite = $dateDebut;
        $this->date_fin_indisponibilite = $dateFin;
        $this->save();
        
        return $this;
    }
    
    /**
     * Vérifie si l'utilisateur peut se connecter avec le matricule ou le username fourni
     * 
     * @param string $credential
     * @return Utilisateur|null
     */
    public static function findForAuth(string $credential): ?Utilisateur
    {
        return static::where('username', $credential)
            ->orWhere('matricule', $credential)
            ->first();
    }
}
