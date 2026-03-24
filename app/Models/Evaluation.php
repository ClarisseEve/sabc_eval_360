<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Evaluation extends Model
{
    use HasFactory, HasUuids;

    protected $connection = 'pgsql';
    protected $table = 'evaluations';
    protected $primaryKey = 'id_evaluation';
    public $incrementing = false;
    protected $keyType = 'string';

    protected $fillable = [
        'id_evaluation',
        'evaluateur_matricule',
        'evalue_matricule',
        'id_periode',
        'id_regle',
        'date_evaluation',
        'date_soumission',
        'statut',
        'notations_json',
        'commentaire_general',
        'note_globale',
        'type_evaluation',
        'source_system',
        'sync_date',
        'sync_status',
    ];

    protected $casts = [
        'date_evaluation'  => 'date',
        'date_soumission'  => 'datetime',
        'notations_json'   => 'array',
        'note_globale'     => 'float',
    ];

    // ─────────────────────────────────────────────────────────────────────────
    // Relations (cross-DB : utiliser en chargement PHP séparé, pas en eager load)
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * Évaluateur (MySQL) — cross-DB : ne pas utiliser with() / whereHas()
     */
    public function evaluateur()
    {
        return $this->belongsTo(Utilisateur::class, 'evaluateur_matricule', 'matricule');
    }

    /**
     * Évalué (MySQL) — cross-DB : ne pas utiliser with() / whereHas()
     */
    public function evalue()
    {
        return $this->belongsTo(Utilisateur::class, 'evalue_matricule', 'matricule');
    }

    /**
     * Période (PGSQL) — même connexion, safe
     */
    public function periode()
    {
        return $this->belongsTo(PeriodeEvaluation::class, 'id_periode', 'id_periode');
    }

    /**
     * Règle (PGSQL) — même connexion, safe
     */
    public function regle()
    {
        return $this->belongsTo(RegleEvaluation::class, 'id_regle', 'id_regle');
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Logique métier
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * Retourne les notations sous forme de tableau.
     */
    public function getNotes(): array
    {
        return $this->notations_json ?? [];
    }

    /**
     * Calcule la note moyenne pondérée.
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
                $ponderation = $note['poids'] ?? $note['ponderation'] ?? 1;
                $somme += $note['note'] * $ponderation;
                $poids += $ponderation;
            }
        }

        return $poids > 0 ? round($somme / $poids, 2) : null;
    }

    /**
     * Vérifie si l'évaluation peut être soumise.
     */
    public function peutEtreSoumise(): bool
    {
        if ($this->statut !== 'brouillon') {
            return false;
        }

        $notes = $this->getNotes();

        if (empty($notes)) {
            return false;
        }

        foreach ($notes as $note) {
            if (!isset($note['note']) || $note['note'] < 1 || $note['note'] > 5) {
                return false;
            }

            if ($note['note'] < 3 && empty($note['commentaire'])) {
                return false;
            }
        }

        if ($this->date_evaluation && $this->date_evaluation->isFuture()) {
            return false;
        }

        return true;
    }

    /**
     * Vérifie si l'évaluation peut être validée par un validateur donné.
     * Le validateur doit être le manager direct de l'évalué.
     */
    public function peutEtreValidee(Utilisateur $validateur): bool
    {
        if ($this->statut !== 'soumis') {
            return false;
        }

        $evalue = Utilisateur::where('matricule', $this->evalue_matricule)->first();

        if (!$evalue) {
            return false;
        }

        return $evalue->manager_matricule === $validateur->matricule;
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Scopes
    // ─────────────────────────────────────────────────────────────────────────

    public function scopeParStatut($query, $statut)
    {
        return $query->where('statut', $statut);
    }

    public function scopeParPeriode($query, $idPeriode)
    {
        return $query->where('id_periode', $idPeriode);
    }

    /**
     * Filtre par région — PHP-side join requis (cross-DB).
     * Utiliser uniquement avec une liste de matricules déjà filtrés.
     */
    public function scopeParMatricules($query, array $matricules)
    {
        return $query->whereIn('evalue_matricule', $matricules);
    }
}
