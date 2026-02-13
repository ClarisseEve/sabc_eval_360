<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use App\Models\Business\Template;
use App\Models\Role;
use App\Models\PeriodeEvaluation;

class TemplateRolePeriode extends Model
{
    protected $connection = 'pgsql';
    protected $table = 'templates_roles_periodes';
    
    protected $fillable = [
        'id_template',
        'id_role',
        'id_periode',
        'est_actif',
    ];
    
    protected $casts = [
        'est_actif' => 'boolean',
    ];
    
    /**
     * Relation avec le template
     */
    public function template()
    {
        return $this->belongsTo(Template::class, 'id_template', 'id_template');
    }
    
    /**
     * Relation avec le rôle
     */
    public function role()
    {
        return $this->belongsTo(Role::class, 'id_role', 'id_role');
    }
    
    /**
     * Relation avec la période
     */
    public function periode()
    {
        return $this->belongsTo(PeriodeEvaluation::class, 'id_periode', 'id_periode');
    }
    
    /**
     * Scope pour filtrer par rôle
     */
    public function scopeByRole($query, string $idRole)
    {
        return $query->where('id_role', $idRole);
    }
    
    /**
     * Scope pour filtrer par période
     */
    public function scopeByPeriode($query, int $idPeriode)
    {
        return $query->where('id_periode', $idPeriode);
    }
    
    /**
     * Scope pour les assignations actives
     */
    public function scopeActif($query)
    {
        return $query->where('est_actif', true);
    }
    
    /**
     * Vérifier si l'assignation peut être modifiée
     * (période non ouverte)
     */
    public function peutEtreModifiee(): bool
    {
        if (!$this->periode) {
            return true;
        }
        
        return !$this->periode->est_ouverte && !$this->periode->est_cloturee;
    }
}
