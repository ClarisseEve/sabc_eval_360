<?php

namespace App\Models\Business;

use Illuminate\Database\Eloquent\Factories\HasFactory;

class HierarchieOrganisationnelle extends BusinessModel
{
    use HasFactory;
    
    /**
     * La table associée au modèle.
     *
     * @var string
     */
    protected $table = 'hierarchie_organisationnelle';
    
    /**
     * La clé primaire associée à la table.
     *
     * @var string
     */
    protected $primaryKey = 'id_hierarchie';
    
    /**
     * Les attributs qui sont assignables en masse.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'id_utilisateur',
        'id_manager',
        'niveau_hierarchique',
        'id_region',
        'id_service',
        'id_departement',
        'id_district',
        'id_secteur',
        'est_taniere',
        'date_debut',
        'date_fin',
        'est_actif',
    ];
    
    /**
     * Les attributs qui doivent être convertis.
     *
     * @var array<string, string>
     */
    protected $casts = [
        'niveau_hierarchique' => 'integer',
        'est_taniere' => 'boolean',
        'date_debut' => 'date',
        'date_fin' => 'date',
        'est_actif' => 'boolean',
    ];
    
    /**
     * Récupère la hiérarchie complète pour un utilisateur
     * 
     * @param string $id_utilisateur
     * @return \Illuminate\Database\Eloquent\Collection
     */
    public static function getHierarchieComplete($id_utilisateur)
    {
        return self::where('id_utilisateur', $id_utilisateur)
            ->where('est_actif', true)
            ->orderBy('date_debut', 'desc')
            ->first();
    }
    
    /**
     * Récupère tous les subordonnés directs d'un manager
     * 
     * @param string $id_manager
     * @return \Illuminate\Database\Eloquent\Collection
     */
    public static function getSubordonnesDirects($id_manager)
    {
        return self::where('id_manager', $id_manager)
            ->where('est_actif', true)
            ->get();
    }
    
    /**
     * Récupère la chaîne hiérarchique complète (tous les managers au-dessus)
     * 
     * @param string $id_utilisateur
     * @return \Illuminate\Database\Eloquent\Collection
     */
    public static function getChaineHierarchique($id_utilisateur)
    {
        $resultat = [];
        $utilisateur_courant = self::where('id_utilisateur', $id_utilisateur)
            ->where('est_actif', true)
            ->first();
            
        if (!$utilisateur_courant) {
            return collect($resultat);
        }
        
        $resultat[] = $utilisateur_courant;
        
        while ($utilisateur_courant && $utilisateur_courant->id_manager) {
            $utilisateur_courant = self::where('id_utilisateur', $utilisateur_courant->id_manager)
                ->where('est_actif', true)
                ->first();
                
            if ($utilisateur_courant) {
                $resultat[] = $utilisateur_courant;
            }
        }
        
        return collect($resultat);
    }
}
