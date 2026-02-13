<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Carbon\Carbon;

class RegleEvaluation extends Model
{
    use HasFactory;
    
    /**
     * Spécifie la connexion à utiliser pour ce modèle
     *
     * @var string
     */
    protected $connection = 'pgsql';
    
    /**
     * La table associée au modèle.
     *
     * @var string
     */
    protected $table = 'regles_evaluation';
    
    /**
     * La clé primaire associée à la table.
     *
     * @var string
     */
    protected $primaryKey = 'id_regle';
    
    /**
     * Indique si la clé primaire est auto-incrémentée.
     *
     * @var bool
     */
    public $incrementing = true;
    
    /**
     * Le type de la clé primaire.
     *
     * @var string
     */
    protected $keyType = 'int';
    
    /**
     * Les attributs qui sont assignables en masse.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'nom_regle',
        'description',
        'criteres_evaluation_json',
        'est_active',
        'role_evaluateur',
        'role_evalue',
        'type_evaluation',
        'meme_region_obligatoire',
        'meme_branche_obligatoire',
    ];
    
    /**
     * Les attributs qui doivent être convertis.
     *
     * @var array<string, string>
     */
    protected $casts = [
        'criteres_evaluation_json' => 'array',
        'est_active' => 'boolean',
        'meme_region_obligatoire' => 'boolean',
        'meme_branche_obligatoire' => 'boolean',
    ];
    
    /**
     * Relation avec les évaluations utilisant cette règle
     */
    public function evaluations()
    {
        return $this->hasMany(Evaluation::class, 'id_regle');
    }
    
    /**
     * Scope pour filtrer les règles actives
     */
    public function scopeActif($query)
    {
        return $query->where('est_active', true);
    }
    
    /**
     * Scope pour filtrer par catégorie
     */
    public function scopeByCategorie($query, string $categorie)
    {
        return $query->whereJsonContains('criteres_evaluation_json->categories', $categorie);
    }
    
    /**
     * Accessor pour récupérer les critères
     */
    public function getCriteresAttribute(): array
    {
        $data = $this->criteres_evaluation_json;
        return $data['criteres'] ?? [];
    }
    
    /**
     * Accessor pour récupérer les catégories
     */
    public function getCategoriesAttribute(): array
    {
        $data = $this->criteres_evaluation_json;
        return $data['categories'] ?? [];
    }
    
    /**
     * Accessor pour calculer le total des pondérations
     */
    public function getTotalPonderationAttribute(): int
    {
        return collect($this->criteres)->sum('ponderation');
    }

    /**
     * Compatibilité ascendante: vérifie si la règle est active à une date donnée.
     */
    public function estActiveADate($date = null): bool
    {
        if (! $this->est_active) {
            return false;
        }

        $dateReference = $date instanceof Carbon ? $date : Carbon::parse($date ?? now());

        // Si les colonnes existent et sont renseignées, respecter la fenêtre d'activité.
        if (isset($this->date_debut) && $this->date_debut && $dateReference->lt(Carbon::parse($this->date_debut))) {
            return false;
        }

        if (isset($this->date_fin) && $this->date_fin && $dateReference->gt(Carbon::parse($this->date_fin))) {
            return false;
        }

        return true;
    }
}
