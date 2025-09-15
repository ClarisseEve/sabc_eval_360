<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use App\Models\Core\CoreModel;

class Role extends Model
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
    protected $primaryKey = 'id_role';
    
    /**
     * Les attributs qui sont assignables en masse.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'id_role',
        'nom_role',
        'description',
        'id_branche',
        'niveau_taniere',
        'niveau_non_taniere',
        'peut_auto_evaluer',
        'peut_evaluer_pairs',
        'peut_evaluer_subalternes',
        'peut_evaluer_cross_branch',
    ];
    
    /**
     * Les attributs qui doivent être convertis.
     *
     * @var array<string, string>
     */
    protected $casts = [
        'niveau_taniere' => 'integer',
        'niveau_non_taniere' => 'integer',
        'peut_auto_evaluer' => 'boolean',
        'peut_evaluer_pairs' => 'boolean',
        'peut_evaluer_subalternes' => 'boolean',
        'peut_evaluer_cross_branch' => 'boolean',
    ];
    
    /**
     * Relation avec la branche de ce rôle (Commercial ou Marketing)
     */
    public function branche()
    {
        return $this->belongsTo(Branche::class, 'id_branche');
    }
    
    /**
     * Relation avec les utilisateurs ayant ce rôle
     * La table utilisateurs utilise 'role' (nom du rôle) comme clé étrangère
     */
    public function utilisateurs()
    {
        return $this->hasMany(Utilisateur::class, 'role', 'nom_role');
    }
    
    /**
     * Détermine le niveau hiérarchique en fonction du type de région
     * 
     * @param bool $estTaniere
     * @return int|null
     */
    public function getNiveauHierarchique(bool $estTaniere): ?int
    {
        return $estTaniere ? $this->niveau_taniere : $this->niveau_non_taniere;
    }
    
    /**
     * Vérifie si ce rôle peut évaluer un autre rôle
     * 
     * @param Role $roleEvalue
     * @param bool $estMemeBranche
     * @param bool $estSubordonneDirect Indique si l'utilisateur évalué est un subordonné direct
     * @return bool
     */
    public function peutEvaluer(Role $roleEvalue, bool $estMemeBranche = true, bool $estSubordonneDirect = false): bool
    {
        // Cas spécial pour RTM (en tanière) et SRMO (en non-tanière)
        // Ces rôles ne peuvent évaluer que leurs subordonnés directs et jamais leurs pairs
        if (in_array($this->nom_role, ['RTM', 'SRMO'])) {
            // RTM et SRMO ne peuvent jamais évaluer leurs pairs
            if ($this->id_role === $roleEvalue->id_role) {
                return false;
            }
            
            // RTM et SRMO ne peuvent évaluer que leurs subordonnés directs
            if (!$estSubordonneDirect) {
                return false;
            }
            
            // RTM (en tanière) peut uniquement évaluer TMO et SS (pas AS directement)
            if ($this->nom_role === 'RTM' && !in_array($roleEvalue->nom_role, ['TMO', 'SS'])) {
                return false;
            }
            
            // SRMO (en non-tanière) peut uniquement évaluer TMO
            if ($this->nom_role === 'SRMO' && $roleEvalue->nom_role !== 'TMO') {
                return false;
            }
            
            // Si toutes les conditions sont remplies, ils peuvent évaluer leurs subordonnés directs
            return $this->peut_evaluer_subalternes;
        }
        
        // Si rôles identiques, vérifier si l'évaluation par les pairs est autorisée
        if ($this->id_role === $roleEvalue->id_role) {
            return $this->peut_auto_evaluer;
        }
        
        // Si branches différentes, vérifier si l'évaluation cross-branch est autorisée
        if (!$estMemeBranche && !$this->peut_evaluer_cross_branch) {
            return false;
        }
        
        // Vérifier les règles d'évaluation descendante (manager évalue subalterne)
        if ($this->niveau_taniere < $roleEvalue->niveau_taniere || 
            $this->niveau_non_taniere < $roleEvalue->niveau_non_taniere) {
            return $this->peut_evaluer_subalternes;
        }
        
        // Vérifier les règles d'évaluation par les pairs (même niveau)
        if (($this->niveau_taniere === $roleEvalue->niveau_taniere) || 
            ($this->niveau_non_taniere === $roleEvalue->niveau_non_taniere)) {
            return $this->peut_evaluer_pairs;
        }
        
        // Par défaut, pas d'évaluation autorisée
        return false;
    }
}