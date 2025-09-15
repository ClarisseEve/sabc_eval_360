<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use App\Models\Business\BusinessModel;

class RemplacementTemporaire extends Model
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
    protected $table = 'remplacements_temporaires';
    
    /**
     * La clé primaire associée à la table.
     *
     * @var string
     */
    protected $primaryKey = 'id_remplacement';
    
    /**
     * Les attributs qui sont assignables en masse.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'titulaire_matricule',
        'remplacant_matricule',
        'role_remplace',
        'region_remplacement',
        'service_remplacement',
        'date_debut',
        'date_fin',
        'duree_prevue_jours',
        'motif',
        'cree_par',
        'approuve_par',
        'est_actif',
        'date_fin_effective',
        'notifications_envoyees',
        'equipe_notifiee',
    ];
    
    /**
     * Les attributs qui doivent être convertis.
     *
     * @var array<string, string>
     */
    protected $casts = [
        'date_debut' => 'date',
        'date_fin' => 'date',
        'date_fin_effective' => 'date',
        'est_actif' => 'boolean',
        'notifications_envoyees' => 'boolean',
        'equipe_notifiee' => 'boolean',
        'duree_prevue_jours' => 'integer',
    ];
    
    /**
     * Relation avec l'utilisateur titulaire (qui est remplacé)
     */
    public function titulaire()
    {
        return $this->belongsTo(Utilisateur::class, 'titulaire_matricule', 'matricule');
    }
    
    /**
     * Relation avec l'utilisateur remplaçant
     */
    public function remplacant()
    {
        return $this->belongsTo(Utilisateur::class, 'remplacant_matricule', 'matricule');
    }
    
    /**
     * Relation avec l'administrateur qui a créé le remplacement
     */
    public function createur()
    {
        return $this->belongsTo(Utilisateur::class, 'cree_par', 'matricule');
    }
    
    /**
     * Relation avec le manager qui a approuvé le remplacement
     */
    public function approbateur()
    {
        return $this->belongsTo(Utilisateur::class, 'approuve_par', 'matricule');
    }
    
    /**
     * Relation avec les évaluations effectuées pendant ce remplacement
     */
    public function evaluations()
    {
        return $this->hasMany(Evaluation::class, 'id_remplacement');
    }
    
    /**
     * Relation avec les notifications liées à ce remplacement
     */
    public function notifications()
    {
        return $this->hasMany(Notification::class, 'id_remplacement');
    }
    
    /**
     * Vérifie si le remplacement est actuellement actif
     */
    public function estActif()
    {
        if (!$this->est_actif) {
            return false;
        }
        
        $aujourdhui = now()->startOfDay();
        $dateDebut = $this->date_debut->startOfDay();
        $dateFin = $this->date_fin ? $this->date_fin->startOfDay() : null;
        
        return $dateDebut->lessThanOrEqualTo($aujourdhui) && 
               (!$dateFin || $dateFin->greaterThanOrEqualTo($aujourdhui));
    }
    
    /**
     * Vérifie si le remplacement est terminé
     */
    public function estTermine()
    {
        if (!$this->est_actif) {
            return true;
        }
        
        if (!$this->date_fin) {
            return false;
        }
        
        return $this->date_fin->startOfDay()->lessThan(now()->startOfDay());
    }
    
    /**
     * Vérifie si le remplacement est à venir
     */
    public function estAVenir()
    {
        if (!$this->est_actif) {
            return false;
        }
        
        return $this->date_debut->startOfDay()->greaterThan(now()->startOfDay());
    }
    
    /**
     * Termine le remplacement à la date spécifiée
     */
    public function terminer($dateFin = null)
    {
        $this->est_actif = false;
        $this->date_fin_effective = $dateFin ?? now();
        $this->save();
        
        return $this;
    }
}
