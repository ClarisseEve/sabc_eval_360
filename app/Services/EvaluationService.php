<?php

namespace App\Services;

use App\Models\Evaluation;
use App\Models\Utilisateur;
use App\Models\PeriodeEvaluation;
use App\Models\RegleEvaluation;
use App\Models\ScoreUtilisateur;
use App\Models\Notification;
use App\Models\LogAdministration;
use App\Models\EvaluationPermission;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;

class EvaluationService
{
    /**
     * Vérifie si un utilisateur peut créer une évaluation pour un autre utilisateur avec une règle spécifique
     * 
     * @param string $evaluateurMatricule Matricule de l'évaluateur
     * @param string $evalueMatricule Matricule de l'utilisateur à évaluer
     * @param string $idRegle UUID de la règle d'évaluation (regles_evaluation.id_regle)
     * @return bool
     */
    public function canCreateEvaluation(string $evaluateurMatricule, string $evalueMatricule, ?string $idRegle = null): bool
    {
        // Récupérer les utilisateurs et la règle
        $evaluateur = Utilisateur::where('matricule', $evaluateurMatricule)->first();
        $evalue = Utilisateur::where('matricule', $evalueMatricule)->first();
        $regle = $idRegle ? RegleEvaluation::find($idRegle) : null;
        
        // Vérifier que les entités existent
        if (!$evaluateur || !$evalue) {
            return false;
        }
        
        // Déterminer le type d'évaluation
        $typeEvaluation = $this->determinerTypeEvaluation($evaluateur, $evalue);
        
        // Vérifier les permissions selon les règles SABC
        if (!EvaluationPermission::estAutorise($evaluateur->role, $evalue->role, $typeEvaluation)) {
            return false;
        }
        
        // Vérifications supplémentaires selon les règles métier
        if (!$this->verifierConditionsSupplementaires($evaluateur, $evalue, $typeEvaluation)) {
            return false;
        }
        
        // Vérifier l'existence d'une période d'évaluation active
        $periodeActive = PeriodeEvaluation::where('statut', 'active')->first();
        if (!$periodeActive) {
            return false;
        }
        
        // Vérifier si une évaluation existe déjà pour cette période/règle
        // Utiliser les matricules pour être compatible avec le schéma Business (PGSQL)
        $exists = DB::connection('pgsql')
            ->table('evaluations')
            ->where('evaluateur_matricule', $evaluateur->matricule)
            ->where('evalue_matricule', $evalue->matricule)
            ->where('id_periode', $periodeActive->id_periode)
            ->when($idRegle, function ($q) use ($idRegle) { $q->where('id_regle', $idRegle); })
            ->exists();
        if ($exists) {
            return false;
        }
        
        return true;
    }
    
    /**
     * Crée une nouvelle évaluation
     * 
     * @param int $idEvaluateur
     * @param int $idEvalue
     * @param int $idPeriode
     * @param int $idRegle
     * @return Evaluation|null
     */
    public function creerEvaluation(int $idEvaluateur, int $idEvalue, int $idPeriode, int $idRegle): ?Evaluation
    {
        $evaluateur = Utilisateur::find($idEvaluateur);
        $evalue = Utilisateur::find($idEvalue);
        $periode = PeriodeEvaluation::find($idPeriode);
        $regle = RegleEvaluation::find($idRegle);
        
        // Validations
        if (!$evaluateur || !$evalue || !$periode || !$regle) {
            return null;
        }
        
        // Vérifier si l'évaluation est autorisée
        if (!$evaluateur->peutEvaluer($evalue)) {
            return null;
        }
        
        // Vérifier si la période est active
        if (!$periode->estActive()) {
            return null;
        }
        
        // Vérifier si une évaluation existe déjà
        $evaluationExistante = Evaluation::where([
            'id_evaluateur' => $idEvaluateur,
            'id_evalue' => $idEvalue,
            'id_periode' => $idPeriode,
        ])->first();
        
        if ($evaluationExistante) {
            return $evaluationExistante;
        }
        
        // Créer l'évaluation
        $evaluation = Evaluation::create([
            'id_evaluateur' => $idEvaluateur,
            'id_evalue' => $idEvalue,
            'id_periode' => $idPeriode,
            'id_regle' => $idRegle,
            'date_evaluation' => now(),
            'statut' => 'brouillon',
            'notes_json' => [],
        ]);
        
        // Log de l'action
        LogAdministration::enregistrerAction(
            $idEvaluateur,
            'creation',
            'evaluations',
            $evaluation->id_evaluation,
            null,
            $evaluation->toArray()
        );
        
        // Notification à l'évalué
        Notification::notifierNouvelleEvaluation($idEvalue, $idEvaluateur);
        
        return $evaluation;
    }
    
    /**
     * Met à jour les notes d'une évaluation
     * 
     * @param int $idEvaluation
     * @param array $notes
     * @param string|null $commentaireGeneral
     * @return bool
     */
    public function mettreAJourNotes(int $idEvaluation, array $notes, ?string $commentaireGeneral = null): bool
    {
        $evaluation = Evaluation::find($idEvaluation);
        
        if (!$evaluation || $evaluation->statut !== 'brouillon') {
            return false;
        }
        
        $anciennesValeurs = $evaluation->toArray();
        
        $evaluation->update([
            'notes_json' => $notes,
            'commentaire_general' => $commentaireGeneral,
        ]);
        
        // Log de l'action
        LogAdministration::enregistrerAction(
            $evaluation->id_evaluateur,
            'modification',
            'evaluations',
            $evaluation->id_evaluation,
            $anciennesValeurs,
            $evaluation->fresh()->toArray()
        );
        
        return true;
    }
    
    /**
     * Soumet une évaluation pour validation
     * 
     * @param int $idEvaluation
     * @return array
     */
    public function soumettrePourValidation(int $idEvaluation): array
    {
        $evaluation = Evaluation::find($idEvaluation);
        
        if (!$evaluation) {
            return ['success' => false, 'message' => 'Évaluation introuvable'];
        }
        
        // Vérifier si l'évaluation peut être soumise
        if (!$evaluation->peutEtreSoumise()) {
            return ['success' => false, 'message' => 'L\'évaluation ne peut pas être soumise dans son état actuel'];
        }
        
        $anciennesValeurs = $evaluation->toArray();
        
        $evaluation->update([
            'statut' => 'soumis',
            'date_soumission' => now(),
        ]);
        
        // Log de l'action
        LogAdministration::enregistrerAction(
            $evaluation->id_evaluateur,
            'soumission',
            'evaluations',
            $evaluation->id_evaluation,
            $anciennesValeurs,
            $evaluation->fresh()->toArray()
        );
        
        // Notification au manager pour validation
        if ($evaluation->evalue->manager) {
            Notification::creer(
                $evaluation->evalue->manager->id_utilisateur,
                'Évaluation à valider',
                "Une évaluation de {$evaluation->evalue->prenom} {$evaluation->evalue->nom} est en attente de validation.",
                'validation'
            );
        }
        
        return ['success' => true, 'message' => 'Évaluation soumise avec succès'];
    }
    
    /**
     * Valide ou rejette une évaluation
     * 
     * @param int $idEvaluation
     * @param int $idValidateur
     * @param bool $estValidee
     * @param string|null $commentaireValidation
     * @return array
     */
    public function validerEvaluation(int $idEvaluation, int $idValidateur, bool $estValidee, ?string $commentaireValidation = null): array
    {
        $evaluation = Evaluation::find($idEvaluation);
        $validateur = Utilisateur::find($idValidateur);
        
        if (!$evaluation || !$validateur) {
            return ['success' => false, 'message' => 'Évaluation ou validateur introuvable'];
        }
        
        // Vérifier si l'évaluation peut être validée par ce validateur
        if (!$evaluation->peutEtreValidee($validateur)) {
            return ['success' => false, 'message' => 'Vous n\'êtes pas autorisé à valider cette évaluation'];
        }
        
        $anciennesValeurs = $evaluation->toArray();
        $nouveauStatut = $estValidee ? 'valide' : 'rejete';
        
        $evaluation->update([
            'statut' => $nouveauStatut,
            'id_validateur' => $idValidateur,
            'date_validation' => now(),
            'commentaire_validation' => $commentaireValidation,
        ]);
        
        // Si rejetée, remettre en brouillon
        if (!$estValidee) {
            $evaluation->update(['statut' => 'brouillon']);
        }
        
        // Log de l'action
        LogAdministration::enregistrerAction(
            $idValidateur,
            $estValidee ? 'validation' : 'rejet',
            'evaluations',
            $evaluation->id_evaluation,
            $anciennesValeurs,
            $evaluation->fresh()->toArray()
        );
        
        // Notification à l'évaluateur
        Notification::notifierValidationEvaluation($evaluation->id_evaluateur, $estValidee);
        
        // Si validée, mettre à jour les scores
        if ($estValidee) {
            $this->mettreAJourScores($evaluation->id_evalue, $evaluation->id_periode);
        }
        
        $message = $estValidee ? 'Évaluation validée avec succès' : 'Évaluation rejetée';
        return ['success' => true, 'message' => $message];
    }
    
    /**
     * Met à jour les scores d'un utilisateur pour une période
     * 
     * @param int $idUtilisateur
     * @param int $idPeriode
     * @return void
     */
    public function mettreAJourScores(int $idUtilisateur, int $idPeriode): void
    {
        $evaluationsValidees = Evaluation::where('id_evalue', $idUtilisateur)
            ->where('id_periode', $idPeriode)
            ->where('statut', 'valide')
            ->with(['evaluateur.role'])
            ->get();
        
        if ($evaluationsValidees->isEmpty()) {
            return;
        }
        
        // Calculer les scores par type d'évaluation
        $scoreAutoEvaluation = $this->calculerScoreParType($evaluationsValidees, 'auto');
        $scorePairs = $this->calculerScoreParType($evaluationsValidees, 'pairs');
        $scoreManager = $this->calculerScoreParType($evaluationsValidees, 'manager');
        
        // Créer ou mettre à jour le score utilisateur
        $scoreUtilisateur = ScoreUtilisateur::updateOrCreate(
            [
                'id_utilisateur' => $idUtilisateur,
                'id_periode' => $idPeriode,
            ],
            [
                'score_auto_evaluation' => $scoreAutoEvaluation,
                'score_pairs' => $scorePairs,
                'score_manager' => $scoreManager,
                'details_scores_json' => $this->construireDetailsScores($evaluationsValidees),
            ]
        );
        
        // Calculer et sauvegarder le score global
        $scoreUtilisateur->mettreAJourScoreGlobal();
    }
    
    /**
     * Calcule le score moyen par type d'évaluation
     * 
     * @param Collection $evaluations
     * @param string $type
     * @return float|null
     */
    private function calculerScoreParType(Collection $evaluations, string $type): ?float
    {
        $evaluationsType = $evaluations->filter(function ($evaluation) use ($type) {
            switch ($type) {
                case 'auto':
                    return $evaluation->id_evaluateur === $evaluation->id_evalue;
                case 'pairs':
                    return $evaluation->id_evaluateur !== $evaluation->id_evalue && 
                           $evaluation->evaluateur->role->getNiveauHierarchique($evaluation->evalue->region->est_taniere) === 
                           $evaluation->evalue->role->getNiveauHierarchique($evaluation->evalue->region->est_taniere);
                case 'manager':
                    return $evaluation->id_evaluateur === $evaluation->evalue->id_manager;
                default:
                    return false;
            }
        });
        
        if ($evaluationsType->isEmpty()) {
            return null;
        }
        
        $sommeScores = $evaluationsType->sum(function ($evaluation) {
            return $evaluation->getNoteMoyenne();
        });
        
        return round($sommeScores / $evaluationsType->count(), 2);
    }
    
    /**
     * Construit les détails des scores pour le JSON
     * 
     * @param Collection $evaluations
     * @return array
     */
    private function construireDetailsScores(Collection $evaluations): array
    {
        $details = [];
        
        foreach ($evaluations as $evaluation) {
            $details[] = [
                'id_evaluation' => $evaluation->id_evaluation,
                'evaluateur' => [
                    'id' => $evaluation->evaluateur->id_utilisateur,
                    'nom' => "{$evaluation->evaluateur->prenom} {$evaluation->evaluateur->nom}",
                    'role' => $evaluation->evaluateur->role->nom_role,
                ],
                'note_moyenne' => $evaluation->getNoteMoyenne(),
                'notes_detail' => $evaluation->getNotes(),
                'date_evaluation' => $evaluation->date_evaluation->format('Y-m-d'),
            ];
        }
        
        return $details;
    }
    
    /**
     * Récupère les évaluations en attente pour un utilisateur
     * 
     * @param int $idUtilisateur
     * @return Collection
     */
    public function getEvaluationsEnAttente(int $idUtilisateur): Collection
    {
        return Evaluation::where('id_evaluateur', $idUtilisateur)
            ->where('statut', 'brouillon')
            ->with(['evalue', 'periode'])
            ->get();
    }
    
    /**
     * Récupère les évaluations à valider pour un manager
     * 
     * @param int $idManager
     * @return Collection
     */
    public function getEvaluationsAValider(int $idManager): Collection
    {
        return Evaluation::where('statut', 'soumis')
            ->whereHas('evalue', function ($query) use ($idManager) {
                $query->where('id_manager', $idManager);
            })
            ->with(['evaluateur', 'evalue', 'periode'])
            ->get();
    }
    
    /**
     * Génère un rapport d'évaluation pour une période
     * 
     * @param int $idPeriode
     * @param int|null $idRegion
     * @return array
     */
    public function genererRapportPeriode(int $idPeriode, ?int $idRegion = null): array
    {
        $query = Evaluation::where('id_periode', $idPeriode);
        
        if ($idRegion) {
            $query->whereHas('evalue', function ($q) use ($idRegion) {
                $q->where('id_region', $idRegion);
            });
        }
        
        $evaluations = $query->with(['evaluateur', 'evalue', 'periode'])->get();
        
        $rapport = [
            'periode' => PeriodeEvaluation::find($idPeriode),
            'statistiques' => [
                'total_evaluations' => $evaluations->count(),
                'brouillons' => $evaluations->where('statut', 'brouillon')->count(),
                'soumises' => $evaluations->where('statut', 'soumis')->count(),
                'validees' => $evaluations->where('statut', 'valide')->count(),
                'rejetees' => $evaluations->where('statut', 'rejete')->count(),
            ],
            'taux_completion' => $this->calculerTauxCompletion($evaluations),
            'scores_moyens' => $this->calculerScoresMoyens($idPeriode, $idRegion),
        ];
        
        return $rapport;
    }
    
    /**
     * Calcule le taux de complétion des évaluations
     * 
     * @param Collection $evaluations
     * @return float
     */
    private function calculerTauxCompletion(Collection $evaluations): float
    {
        if ($evaluations->isEmpty()) {
            return 0;
        }
        
        $completees = $evaluations->whereIn('statut', ['soumis', 'valide'])->count();
        return round(($completees / $evaluations->count()) * 100, 2);
    }
    
    /**
     * Calcule les scores moyens pour une période
     * 
     * @param int $idPeriode
     * @param int|null $idRegion
     * @return array
     */
    private function calculerScoresMoyens(int $idPeriode, ?int $idRegion = null): array
    {
        $query = ScoreUtilisateur::where('id_periode', $idPeriode);
        
        if ($idRegion) {
            $query->whereHas('utilisateur', function ($q) use ($idRegion) {
                $q->where('id_region', $idRegion);
            });
        }
        
        $scores = $query->get();
        
        return [
            'score_auto_evaluation' => $scores->avg('score_auto_evaluation'),
            'score_pairs' => $scores->avg('score_pairs'),
            'score_manager' => $scores->avg('score_manager'),
            'score_global' => $scores->avg('score_global'),
        ];
    }
    
    /**
     * Envoie des rappels pour les évaluations en retard
     * 
     * @param int $idPeriode
     * @return int Nombre de rappels envoyés
     */
    public function envoyerRappelsEvaluations(int $idPeriode): int
    {
        $periode = PeriodeEvaluation::find($idPeriode);
        
        if (!$periode || !$periode->estActive()) {
            return 0;
        }
        
        $joursRestants = now()->diffInDays($periode->date_fin);
        
        if ($joursRestants > 7) {
            return 0; // Pas de rappel si plus de 7 jours restants
        }
        
        $evaluationsEnRetard = Evaluation::where('id_periode', $idPeriode)
            ->where('statut', 'brouillon')
            ->where('created_at', '<', now()->subDays(3))
            ->with(['evaluateur'])
            ->get();
        
        $rappelsEnvoyes = 0;
        
        foreach ($evaluationsEnRetard as $evaluation) {
            Notification::notifierRappelEvaluation(
                $evaluation->id_evaluateur,
                $joursRestants
            );
            $rappelsEnvoyes++;
        }
        
        return $rappelsEnvoyes;
    }
    
    /**
     * Détermine le type d'évaluation selon les règles SABC
     * 
     * @param Utilisateur $evaluateur
     * @param Utilisateur $evalue
     * @return string
     */
    private function determinerTypeEvaluation(Utilisateur $evaluateur, Utilisateur $evalue): string
    {
        // Auto-évaluation
        if ($evaluateur->matricule === $evalue->matricule) {
            return 'auto';
        }
        
        // Évaluation descendante (manager vers subordonné)
        if ($evalue->manager_matricule === $evaluateur->matricule) {
            return 'descendante';
        }
        
        // Évaluation par les pairs (même niveau hiérarchique et même région)
        if ($evaluateur->niveau_hierarchique === $evalue->niveau_hierarchique && 
            $evaluateur->id_region === $evalue->id_region &&
            $evaluateur->id_branche === $evalue->id_branche) {
            return 'pairs';
        }
        
        // Évaluation ascendante (subordonné vers manager)
        if ($evaluateur->manager_matricule === $evalue->matricule) {
            return 'ascendante';
        }
        
        return 'autre';
    }
    
    /**
     * Vérifie les conditions supplémentaires selon les règles SABC
     * 
     * @param Utilisateur $evaluateur
     * @param Utilisateur $evalue
     * @param string $typeEvaluation
     * @return bool
     */
    private function verifierConditionsSupplementaires(Utilisateur $evaluateur, Utilisateur $evalue, string $typeEvaluation): bool
    {
        // Vérifier que les utilisateurs sont dans la même région
        if ($evaluateur->id_region !== $evalue->id_region) {
            return false;
        }
        
        // Vérifier que les utilisateurs sont actifs
        if (!$evaluateur->est_actif || !$evalue->est_actif) {
            return false;
        }
        
        // Cas spécial pour RTM et SRMO : vérification stricte des rôles des subordonnés
        if (in_array($evaluateur->role, ['RTM', 'SRMO']) && $typeEvaluation === 'descendante') {
            if ($evaluateur->role === 'RTM') {
                return in_array($evalue->role, ['TMO', 'SS']);
            }
            if ($evaluateur->role === 'SRMO') {
                return $evalue->role === 'TMO';
            }
        }
        
        return true;
    }
    
    /**
     * Récupère les évaluations à compléter pour un utilisateur selon son rôle
     * 
     * @param Utilisateur $utilisateur
     * @return array
     */
    public function getEvaluationsACompleter(Utilisateur $utilisateur): array
    {
        $periodeActive = PeriodeEvaluation::where('statut', 'active')->first();
        if (!$periodeActive) {
            return [];
        }
        
        $evaluations = [];
        $permissions = EvaluationPermission::getPermissionsPourRole($utilisateur->role);
        
        foreach ($permissions as $permission) {
            $cibles = $this->getCiblesEvaluation($utilisateur, $permission);
            
            foreach ($cibles as $cible) {
                // Vérifier si l'évaluation existe déjà
                $evaluationExistante = Evaluation::where([
                    'evaluateur_matricule' => $utilisateur->matricule,
                    'evalue_matricule' => $cible->matricule,
                    'id_periode' => $periodeActive->id_periode,
                ])->first();
                
                if (!$evaluationExistante) {
                    $evaluations[] = [
                        'type' => $permission->type_evaluation,
                        'cible' => $cible,
                        'statut' => 'a_faire',
                        'deadline' => $periodeActive->date_fin,
                    ];
                } elseif ($evaluationExistante->statut === 'brouillon') {
                    $evaluations[] = [
                        'type' => $permission->type_evaluation,
                        'cible' => $cible,
                        'evaluation' => $evaluationExistante,
                        'statut' => 'a_terminer',
                        'deadline' => $periodeActive->date_fin,
                    ];
                }
            }
        }
        
        return $evaluations;
    }
    
    /**
     * Récupère les cibles d'évaluation selon le type et l'utilisateur
     * 
     * @param Utilisateur $utilisateur
     * @param EvaluationPermission $permission
     * @return Collection
     */
    private function getCiblesEvaluation(Utilisateur $utilisateur, EvaluationPermission $permission): Collection
    {
        switch ($permission->type_evaluation) {
            case 'auto':
                return collect([$utilisateur]);
                
            case 'descendante':
                return Utilisateur::where('manager_matricule', $utilisateur->matricule)
                    ->where('role', $permission->role_evalue)
                    ->where('est_actif', true)
                    ->get();
                    
            case 'pairs':
                return Utilisateur::where('niveau_hierarchique', $utilisateur->niveau_hierarchique)
                    ->where('id_region', $utilisateur->id_region)
                    ->where('id_branche', $utilisateur->id_branche)
                    ->where('role', $permission->role_evalue)
                    ->where('matricule', '!=', $utilisateur->matricule)
                    ->where('est_actif', true)
                    ->get();
                    
            default:
                return collect([]);
        }
    }
}
