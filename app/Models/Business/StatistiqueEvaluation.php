<?php

namespace App\Models\Business;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use App\Models\Evaluation;
use App\Models\PeriodeEvaluation;

class StatistiqueEvaluation extends BusinessModel
{
    use HasFactory;
    
    /**
     * La table associée au modèle.
     *
     * @var string
     */
    protected $table = 'statistiques_evaluation';
    
    /**
     * La clé primaire associée à la table.
     *
     * @var string
     */
    protected $primaryKey = 'id_statistique';
    
    /**
     * Les attributs qui sont assignables en masse.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'id_periode',
        'id_region',
        'id_role',
        'nombre_evaluations_attendues',
        'nombre_evaluations_soumises',
        'nombre_evaluations_validees',
        'nombre_evaluations_rejetees',
        'score_moyen',
        'date_calcul',
        'details_json',
    ];
    
    /**
     * Les attributs qui doivent être convertis.
     *
     * @var array<string, string>
     */
    protected $casts = [
        'nombre_evaluations_attendues' => 'integer',
        'nombre_evaluations_soumises' => 'integer',
        'nombre_evaluations_validees' => 'integer',
        'nombre_evaluations_rejetees' => 'integer',
        'score_moyen' => 'float',
        'date_calcul' => 'datetime',
        'details_json' => 'json',
    ];
    
    /**
     * Relation avec la période d'évaluation
     */
    public function periode()
    {
        return $this->belongsTo(PeriodeEvaluation::class, 'id_periode');
    }
    
    /**
     * Calcule les statistiques pour une période donnée
     * 
     * @param string $id_periode
     * @param string|null $id_region
     * @return array
     */
    public static function calculerStatistiques($id_periode, $id_region = null)
    {
        $query = Evaluation::where('id_periode', $id_periode);
        
        if ($id_region) {
            $query->where('id_region', $id_region);
        }
        
        $evaluations = $query->get();
        
        $stats = [
            'nombre_evaluations_attendues' => 0, // À calculer séparément
            'nombre_evaluations_soumises' => $evaluations->where('statut', 'soumis')->count(),
            'nombre_evaluations_validees' => $evaluations->where('statut', 'valide')->count(),
            'nombre_evaluations_rejetees' => $evaluations->where('statut', 'rejete')->count(),
            'score_moyen' => 0,
        ];
        
        // Calcul du score moyen
        $evaluationsValidees = $evaluations->where('statut', 'valide');
        if ($evaluationsValidees->count() > 0) {
            $totalScore = 0;
            $count = 0;
            
            foreach ($evaluationsValidees as $evaluation) {
                if ($evaluation->notes_json) {
                    $notes = json_decode($evaluation->notes_json, true);
                    if (is_array($notes)) {
                        foreach ($notes as $note) {
                            if (isset($note['note']) && is_numeric($note['note'])) {
                                $totalScore += $note['note'];
                                $count++;
                            }
                        }
                    }
                }
            }
            
            if ($count > 0) {
                $stats['score_moyen'] = $totalScore / $count;
            }
        }
        
        return $stats;
    }
    
    /**
     * Génère un rapport de progression pour une région
     * 
     * @param string $id_region
     * @param int $annee
     * @return array
     */
    public static function genererRapportProgression($id_region, $annee)
    {
        $periodes = PeriodeEvaluation::where('id_region', $id_region)
            ->whereYear('date_debut', $annee)
            ->orderBy('date_debut')
            ->get();
            
        $rapportData = [];
        
        foreach ($periodes as $periode) {
            $stats = self::where('id_periode', $periode->id_periode)
                ->where('id_region', $id_region)
                ->first();
                
            if ($stats) {
                $rapportData[] = [
                    'periode' => $periode->titre,
                    'date_debut' => $periode->date_debut,
                    'date_fin' => $periode->date_fin,
                    'nombre_evaluations_validees' => $stats->nombre_evaluations_validees,
                    'score_moyen' => $stats->score_moyen,
                    'taux_completion' => $stats->nombre_evaluations_attendues > 0 
                        ? ($stats->nombre_evaluations_validees / $stats->nombre_evaluations_attendues) * 100 
                        : 0,
                ];
            }
        }
        
        return $rapportData;
    }
}
