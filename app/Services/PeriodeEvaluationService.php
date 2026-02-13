<?php

namespace App\Services;

use App\Models\PeriodeEvaluation;
use App\Models\Evaluation;
use App\Exceptions\PeriodeChevauchementException;
use App\Exceptions\PeriodeNonModifiableException;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class PeriodeEvaluationService
{
    /**
     * Valider qu'il n'y a pas de chevauchement avec une autre période
     * 
     * @param Carbon $dateDebut
     * @param Carbon $dateFin
     * @param string|null $excludeIdPeriode
     * @throws PeriodeChevauchementException
     * @return void
     */
    public function validateNoChevauchement(
        Carbon $dateDebut,
        Carbon $dateFin,
        ?string $excludeIdPeriode = null
    ): void {
        $query = PeriodeEvaluation::where(function($q) use ($dateDebut, $dateFin) {
            // Chevauchement si :
            // 1. Nouvelle période commence pendant une période existante
            $q->where(function($subQ) use ($dateDebut) {
                $subQ->where('date_debut', '<=', $dateDebut)
                     ->where('date_fin', '>=', $dateDebut);
            })
            // 2. Nouvelle période finit pendant une période existante
            ->orWhere(function($subQ) use ($dateFin) {
                $subQ->where('date_debut', '<=', $dateFin)
                     ->where('date_fin', '>=', $dateFin);
            })
            // 3. Nouvelle période englobe une période existante
            ->orWhere(function($subQ) use ($dateDebut, $dateFin) {
                $subQ->where('date_debut', '>=', $dateDebut)
                     ->where('date_fin', '<=', $dateFin);
            });
        });
        
        // Exclure la période en cours de modification
        if ($excludeIdPeriode) {
            $query->where('id_periode', '!=', $excludeIdPeriode);
        }
        
        $chevauchement = $query->first();
        
        if ($chevauchement) {
            throw new PeriodeChevauchementException(
                "La période chevauche une période existante : {$chevauchement->nom_periode} " .
                "({$chevauchement->date_debut->format('d/m/Y')} - {$chevauchement->date_fin->format('d/m/Y')})"
            );
        }
    }
    
    /**
     * Vérifier si une période peut être modifiée
     * 
     * @param PeriodeEvaluation $periode
     * @return bool
     */
    public function canModifyDates(PeriodeEvaluation $periode): bool
    {
        return $periode->estModifiable();
    }
    
    /**
     * Calculer les statistiques d'une période
     * 
     * @param PeriodeEvaluation $periode
     * @return array
     */
    public function calculateStatistiques(PeriodeEvaluation $periode): array
    {
        try {
            $evaluations = DB::connection('pgsql')
                ->table('evaluations')
                ->where('id_periode', $periode->id_periode)
                ->get();
            
            $nbTotal = $evaluations->count();
            $nbBrouillon = $evaluations->where('statut', 'brouillon')->count();
            $nbSoumises = $evaluations->where('statut', 'soumis')->count();
            $nbValidees = $evaluations->where('statut', 'valide')->count();
            $nbRejetees = $evaluations->where('statut', 'rejete')->count();
            
            $nbCompletees = $nbValidees;
            $nbEnCours = $nbBrouillon + $nbSoumises;
            $nbNonDemarrees = 0; // À calculer selon la logique métier
            
            $tauxCompletion = $nbTotal > 0 ? round(($nbCompletees / $nbTotal) * 100, 2) : 0;
            
            $stats = [
                'nb_evaluations_attendues' => $nbTotal,
                'nb_evaluations_completees' => $nbCompletees,
                'taux_completion' => $tauxCompletion,
                'nb_evaluations_en_cours' => $nbEnCours,
                'nb_evaluations_non_demarrees' => $nbNonDemarrees,
                'nb_brouillon' => $nbBrouillon,
                'nb_soumises' => $nbSoumises,
                'nb_validees' => $nbValidees,
                'nb_rejetees' => $nbRejetees,
                'derniere_mise_a_jour' => now()->toIso8601String(),
            ];
            
            // Mettre à jour dans la base
            $periode->update([
                'statistiques_json' => $stats,
                'nb_evaluations_attendues' => $nbTotal,
                'nb_evaluations_completees' => $nbCompletees,
                'taux_completion' => $tauxCompletion,
            ]);
            
            return $stats;
        } catch (\Exception $e) {
            Log::error('Erreur calcul statistiques période', [
                'periode' => $periode->id_periode,
                'error' => $e->getMessage()
            ]);
            
            return [
                'nb_evaluations_attendues' => 0,
                'nb_evaluations_completees' => 0,
                'taux_completion' => 0,
                'nb_evaluations_en_cours' => 0,
                'nb_evaluations_non_demarrees' => 0,
                'derniere_mise_a_jour' => now()->toIso8601String(),
            ];
        }
    }
    
    /**
     * Récupérer la période active en cours
     * 
     * @return PeriodeEvaluation|null
     */
    public function getPeriodeActive(): ?PeriodeEvaluation
    {
        return PeriodeEvaluation::where('est_ouverte', true)
            ->where('est_cloturee', false)
            ->where('date_debut', '<=', now())
            ->where('date_fin', '>=', now())
            ->orderByDesc('date_debut')
            ->first();
    }
    
    /**
     * Générer les dates de rappels par défaut
     * 
     * @param Carbon $dateFin
     * @return array
     */
    public function generateDatesRappels(Carbon $dateFin): array
    {
        return [
            'j_moins_7' => $dateFin->copy()->subDays(7)->format('Y-m-d'),
            'j_moins_3' => $dateFin->copy()->subDays(3)->format('Y-m-d'),
            'j_moins_1' => $dateFin->copy()->subDays(1)->format('Y-m-d'),
        ];
    }
    
    /**
     * Ouvrir une période d'évaluation
     * 
     * @param PeriodeEvaluation $periode
     * @return bool
     */
    public function ouvrirPeriode(PeriodeEvaluation $periode): bool
    {
        if ($periode->est_ouverte) {
            return false;
        }
        
        return $periode->update([
            'est_ouverte' => true,
            'est_cloturee' => false,
            'statut' => 'active',
        ]);
    }
    
    /**
     * Fermer une période d'évaluation
     * 
     * @param PeriodeEvaluation $periode
     * @return bool
     */
    public function fermerPeriode(PeriodeEvaluation $periode): bool
    {
        if ($periode->est_cloturee) {
            return false;
        }
        
        // Calculer statistiques finales
        $this->calculateStatistiques($periode);
        
        return $periode->update([
            'est_ouverte' => false,
            'est_cloturee' => true,
            'statut' => 'fermee',
        ]);
    }
    
    /**
     * Vérifier si une période peut être supprimée
     * 
     * @param PeriodeEvaluation $periode
     * @return bool
     */
    public function canDelete(PeriodeEvaluation $periode): bool
    {
        // Ne peut pas supprimer si des évaluations existent
        $nbEvaluations = DB::connection('pgsql')
            ->table('evaluations')
            ->where('id_periode', $periode->id_periode)
            ->count();
        
        return $nbEvaluations === 0;
    }
    
    /**
     * Valider les dates d'une période
     * 
     * @param Carbon $dateDebut
     * @param Carbon $dateFin
     * @param bool $isCreation
     * @throws \InvalidArgumentException
     * @return void
     */
    public function validateDates(Carbon $dateDebut, Carbon $dateFin, bool $isCreation = true): void
    {
        // Vérifier que date_debut < date_fin
        if ($dateDebut->greaterThanOrEqualTo($dateFin)) {
            throw new \InvalidArgumentException('La date de début doit être antérieure à la date de fin');
        }
        
        // Pour une création, vérifier que date_debut > aujourd'hui
        if ($isCreation && $dateDebut->lessThan(now()->startOfDay())) {
            throw new \InvalidArgumentException('La date de début doit être dans le futur');
        }
        
        // Vérifier durée minimale (ex: 7 jours)
        $dureeJours = $dateDebut->diffInDays($dateFin);
        if ($dureeJours < 7) {
            throw new \InvalidArgumentException('La période doit durer au moins 7 jours');
        }
        
        // Vérifier durée maximale (ex: 180 jours)
        if ($dureeJours > 180) {
            throw new \InvalidArgumentException('La période ne peut pas dépasser 180 jours');
        }
    }
}
