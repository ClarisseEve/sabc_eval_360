<?php

namespace App\Models\Analytics;

use Illuminate\Database\Eloquent\Factories\HasFactory;

class HistoriqueEvaluation extends AnalyticsModel
{
    use HasFactory;
    
    /**
     * La table associée au modèle.
     *
     * @var string
     */
    protected $table = 'historique_evaluations';
    
    /**
     * Indique si les timestamps sont automatiquement gérés.
     *
     * @var bool
     */
    public $timestamps = false;
    
    /**
     * Les attributs qui sont assignables en masse.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'id_evaluation',
        'evaluateur_matricule',
        'evalue_matricule',
        'date_evaluation',
        'date_soumission',
        'statut',
        'score_moyen',
        'region_nom',
        'type_region',
        'role_evaluateur',
        'role_evalue',
        'niveau_hierarchique_evaluateur',
        'niveau_hierarchique_evalue',
        'branche_evaluateur',
        'branche_evalue',
        'type_evaluation',
        'periode_titre',
        'annee',
        'semestre',
        'trimestre',
        'mois',
        'jour',
        'criteres_json',
    ];
    
    /**
     * Les attributs qui doivent être convertis.
     *
     * @var array<string, string>
     */
    protected $casts = [
        'date_evaluation' => 'date',
        'date_soumission' => 'datetime',
        'score_moyen' => 'float',
        'niveau_hierarchique_evaluateur' => 'integer',
        'niveau_hierarchique_evalue' => 'integer',
        'annee' => 'integer',
        'semestre' => 'integer',
        'trimestre' => 'integer',
        'mois' => 'integer',
        'jour' => 'integer',
        'criteres_json' => 'json',
    ];
    
    /**
     * Récupère l'historique des évaluations pour une période spécifique
     * 
     * @param int $annee
     * @param int|null $semestre
     * @return \Illuminate\Database\Eloquent\Collection
     */
    public static function getHistoriquePeriode($annee, $semestre = null)
    {
        $query = self::where('annee', $annee);
        
        if ($semestre) {
            $query->where('semestre', $semestre);
        }
        
        return $query->orderBy('date_evaluation', 'desc')
            ->get();
    }
    
    /**
     * Récupère l'historique des évaluations pour un utilisateur spécifique
     * 
     * @param string $matricule
     * @param bool $estEvaluateur Si true, recherche les évaluations où l'utilisateur est évaluateur
     * @return \Illuminate\Database\Eloquent\Collection
     */
    public static function getHistoriqueUtilisateur($matricule, $estEvaluateur = false)
    {
        if ($estEvaluateur) {
            return self::where('evaluateur_matricule', $matricule)
                ->orderBy('date_evaluation', 'desc')
                ->get();
        } else {
            return self::where('evalue_matricule', $matricule)
                ->orderBy('date_evaluation', 'desc')
                ->get();
        }
    }
    
    /**
     * Récupère les tendances d'évaluation sur plusieurs périodes
     * 
     * @param int $nombrePeriodes
     * @param string|null $region_nom
     * @return array
     */
    public static function getTendancesEvaluation($nombrePeriodes = 4, $region_nom = null)
    {
        $query = self::selectRaw('
            annee,
            semestre,
            AVG(score_moyen) as score_moyen,
            COUNT(*) as nombre_evaluations
        ')
        ->whereNotNull('score_moyen')
        ->groupBy(['annee', 'semestre']);
        
        if ($region_nom) {
            $query->where('region_nom', $region_nom);
        }
        
        return $query->orderBy('annee', 'desc')
            ->orderBy('semestre', 'desc')
            ->limit($nombrePeriodes)
            ->get()
            ->sortBy([
                ['annee', 'asc'],
                ['semestre', 'asc']
            ])
            ->values()
            ->toArray();
    }
    
    /**
     * Récupère les statistiques par critère d'évaluation
     * 
     * @param int $annee
     * @param int|null $semestre
     * @param string|null $region_nom
     * @return array
     */
    public static function getStatistiquesCriteres($annee, $semestre = null, $region_nom = null)
    {
        // Cette méthode nécessite une requête SQL spécifique à ClickHouse
        // pour extraire et analyser les données JSON des critères
        // Implémentation simplifiée pour l'exemple
        
        $query = self::where('annee', $annee);
        
        if ($semestre) {
            $query->where('semestre', $semestre);
        }
        
        if ($region_nom) {
            $query->where('region_nom', $region_nom);
        }
        
        $evaluations = $query->get();
        
        // Structure pour collecter les statistiques par critère
        $statistiquesCriteres = [];
        
        foreach ($evaluations as $evaluation) {
            if (!empty($evaluation->criteres_json)) {
                $criteres = json_decode($evaluation->criteres_json, true);
                
                if (is_array($criteres)) {
                    foreach ($criteres as $critere) {
                        if (isset($critere['id_critere'], $critere['libelle'], $critere['note'])) {
                            $id = $critere['id_critere'];
                            
                            if (!isset($statistiquesCriteres[$id])) {
                                $statistiquesCriteres[$id] = [
                                    'id_critere' => $id,
                                    'libelle' => $critere['libelle'],
                                    'somme_notes' => 0,
                                    'nombre_notes' => 0,
                                    'note_moyenne' => 0
                                ];
                            }
                            
                            $statistiquesCriteres[$id]['somme_notes'] += $critere['note'];
                            $statistiquesCriteres[$id]['nombre_notes']++;
                        }
                    }
                }
            }
        }
        
        // Calcul des moyennes
        foreach ($statistiquesCriteres as &$stat) {
            if ($stat['nombre_notes'] > 0) {
                $stat['note_moyenne'] = $stat['somme_notes'] / $stat['nombre_notes'];
            }
        }
        
        return array_values($statistiquesCriteres);
    }
}
