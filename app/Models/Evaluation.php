<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use App\Models\Business\BusinessModel;

class Evaluation extends Model
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
    protected $primaryKey = 'id_evaluation';
    
    /**
     * Les attributs qui sont assignables en masse.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'id_evaluateur',
        'id_evalue',
        'id_periode',
        'id_regle',
        'date_evaluation',
        'notes_json',
        'commentaire_general',
        'statut',
        'date_soumission',
        'date_validation',
        'id_validateur',
        'commentaire_validation',
    ];
    
    /**
     * Les attributs qui doivent être convertis.
     *
     * @var array<string, string>
     */
    protected $casts = [
        'date_evaluation' => 'date',
        'date_soumission' => 'datetime',
        'date_validation' => 'datetime',
        'notes_json' => 'json',
    ];
    
    /**
     * Relation avec l'utilisateur évaluateur
     */
    public function evaluateur()
    {
        return $this->belongsTo(Utilisateur::class, 'id_evaluateur');
    }
    
    /**
     * Relation avec l'utilisateur évalué
     */
    public function evalue()
    {
        return $this->belongsTo(Utilisateur::class, 'id_evalue');
    }
    
    /**
     * Relation avec l'utilisateur validateur
     */
    public function validateur()
    {
        return $this->belongsTo(Utilisateur::class, 'id_validateur');
    }
    
    /**
     * Relation avec la période d'évaluation
     */
    public function periode()
    {
        return $this->belongsTo(PeriodeEvaluation::class, 'id_periode');
    }
    
    /**
     * Relation avec la règle d'évaluation
     */
    public function regle()
    {
        return $this->belongsTo(RegleEvaluation::class, 'id_regle');
    }
    
    /**
     * Vérifie si l'évaluation est autorisée selon les règles métier SABC
     * 
     * @return bool
     */
    public function estAutorisee(): bool
    {
        // Récupérer les utilisateurs
        $evaluateur = $this->evaluateur;
        $evalue = $this->evalue;
        
        if (!$evaluateur || !$evalue) {
            return false;
        }
        
        // Vérifier si la période est active
        if (!$this->periode || !$this->periode->estActive()) {
            return false;
        }
        
        // Vérifier si la règle est active
        if (!$this->regle || !$this->regle->estActiveADate($this->date_evaluation)) {
            return false;
        }
        
        // Utiliser la méthode du modèle Utilisateur pour vérifier les permissions
        return $evaluateur->peutEvaluer($evalue);
    }
    
    /**
     * Vérifie si l'évaluation peut être soumise selon les règles métier SABC
     * 
     * @return bool
     */
    public function peutEtreSoumise(): bool
    {
        // Vérifier que le statut est 'brouillon'
        if ($this->statut !== 'brouillon') {
            return false;
        }
        
        // Vérifier que toutes les compétences sont notées (minimum 5)
        $notes = $this->getNotes();
        if (count($notes) < 5) {
            return false;
        }
        
        // Vérifier que toutes les notes sont entre 1 et 5
        foreach ($notes as $note) {
            if (!isset($note['note']) || $note['note'] < 1 || $note['note'] > 5) {
                return false;
            }
            
            // Vérifier que les commentaires sont présents pour les notes < 3
            if ($note['note'] < 3 && empty($note['commentaire'])) {
                return false;
            }
        }
        
        // Vérifier que la date d'évaluation est cohérente (pas future)
        if ($this->date_evaluation > now()) {
            return false;
        }
        
        // Vérifier le délai maximum de 30 jours
        $delaiMaximum = now()->subDays(30);
        if ($this->created_at < $delaiMaximum) {
            return false;
        }
        
        return true;
    }
    
    /**
     * Vérifie si l'évaluation peut être validée
     * 
     * @param Utilisateur $validateur
     * @return bool
     */
    public function peutEtreValidee(Utilisateur $validateur): bool
    {
        // Vérifier que le statut est 'soumis'
        if ($this->statut !== 'soumis') {
            return false;
        }
        
        // Vérifier que le validateur est un supérieur hiérarchique de l'évalué
        return $validateur->id_utilisateur === $this->evalue->id_manager;
    }
    
    /**
     * Récupère les notes de l'évaluation
     * 
     * @return array
     */
    public function getNotes(): array
    {
        return $this->notes_json ?? [];
    }
    
    /**
     * Calcule la note moyenne de l'évaluation
     * 
     * @return float|null
     */
    public function getNoteMoyenne(): ?float
    {
        $notes = $this->getNotes();
        if (empty($notes)) {
            return null;
        }
        
        $somme = 0;
        $poids = 0;
        
        foreach ($notes as $note) {
            if (isset($note['note'])) {
                $ponderation = $note['ponderation'] ?? 1;
                $somme += $note['note'] * $ponderation;
                $poids += $ponderation;
            }
        }
        
        return $poids > 0 ? round($somme / $poids, 2) : null;
    }
    
    /**
     * Scope pour filtrer les évaluations par statut
     */
    public function scopeParStatut($query, $statut)
    {
        return $query->where('statut', $statut);
    }
    
    /**
     * Scope pour filtrer les évaluations par période
     */
    public function scopeParPeriode($query, $idPeriode)
    {
        return $query->where('id_periode', $idPeriode);
    }
    
    /**
     * Scope pour filtrer les évaluations par région
     */
    public function scopeParRegion($query, $idRegion)
    {
        return $query->whereHas('evalue', function ($q) use ($idRegion) {
            $q->where('id_region', $idRegion);
        });
    }
    
    /**
     * Scope pour filtrer les évaluations par branche
     */
    public function scopeParBranche($query, $idBranche)
    {
        return $query->whereHas('evalue.role.branche', function ($q) use ($idBranche) {
            $q->where('id_branche', $idBranche);
        });
    }
}