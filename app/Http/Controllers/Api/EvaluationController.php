<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\EvaluationService;
use App\Models\Evaluation;
use App\Models\PeriodeEvaluation;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\ValidationException;

class EvaluationController extends Controller
{
    protected EvaluationService $evaluationService;

    public function __construct(EvaluationService $evaluationService)
    {
        $this->evaluationService = $evaluationService;
    }

    /**
     * Récupère les évaluations de l'utilisateur connecté
     */
    public function index(Request $request): JsonResponse
    {
        $utilisateur = Auth::user();
        
        $evaluationsEnAttente = $this->evaluationService->getEvaluationsEnAttente($utilisateur->id_utilisateur);
        $evaluationsAValider = $this->evaluationService->getEvaluationsAValider($utilisateur->id_utilisateur);
        
        return response()->json([
            'success' => true,
            'data' => [
                'en_attente' => $evaluationsEnAttente,
                'a_valider' => $evaluationsAValider,
            ]
        ]);
    }

    /**
     * Crée une nouvelle évaluation
     */
    public function store(Request $request): JsonResponse
    {
        $request->validate([
            'id_evalue' => 'required|integer|exists:utilisateurs,id_utilisateur',
            'id_periode' => 'required|integer|exists:periodes_evaluation,id_periode',
            'id_regle' => 'required|integer|exists:regles_evaluation,id_regle',
        ]);

        $utilisateur = Auth::user();
        
        $evaluation = $this->evaluationService->creerEvaluation(
            $utilisateur->id_utilisateur,
            $request->id_evalue,
            $request->id_periode,
            $request->id_regle
        );

        if (!$evaluation) {
            return response()->json([
                'success' => false,
                'message' => 'Impossible de créer l\'évaluation. Vérifiez vos permissions et les paramètres.'
            ], 403);
        }

        return response()->json([
            'success' => true,
            'message' => 'Évaluation créée avec succès',
            'data' => $evaluation->load(['evalue', 'periode', 'regle'])
        ], 201);
    }

    /**
     * Affiche une évaluation spécifique
     */
    public function show(int $id): JsonResponse
    {
        $evaluation = Evaluation::with(['evaluateur', 'evalue', 'periode', 'regle', 'validateur'])
            ->find($id);

        if (!$evaluation) {
            return response()->json([
                'success' => false,
                'message' => 'Évaluation introuvable'
            ], 404);
        }

        $utilisateur = Auth::user();
        
        // Vérifier les permissions d'accès
        if (!$this->peutAccederEvaluation($utilisateur, $evaluation)) {
            return response()->json([
                'success' => false,
                'message' => 'Accès non autorisé à cette évaluation'
            ], 403);
        }

        return response()->json([
            'success' => true,
            'data' => $evaluation
        ]);
    }

    /**
     * Met à jour les notes d'une évaluation
     */
    public function update(Request $request, int $id): JsonResponse
    {
        $request->validate([
            'notes' => 'required|array',
            'notes.*' => 'required|numeric|min:1|max:5',
            'commentaire_general' => 'nullable|string|max:1000',
        ]);

        $evaluation = Evaluation::find($id);
        
        if (!$evaluation) {
            return response()->json([
                'success' => false,
                'message' => 'Évaluation introuvable'
            ], 404);
        }

        $utilisateur = Auth::user();
        
        // Vérifier que l'utilisateur est l'évaluateur
        if ($evaluation->id_evaluateur !== $utilisateur->id_utilisateur) {
            return response()->json([
                'success' => false,
                'message' => 'Vous n\'êtes pas autorisé à modifier cette évaluation'
            ], 403);
        }

        $success = $this->evaluationService->mettreAJourNotes(
            $id,
            $request->notes,
            $request->commentaire_general
        );

        if (!$success) {
            return response()->json([
                'success' => false,
                'message' => 'Impossible de mettre à jour l\'évaluation'
            ], 400);
        }

        return response()->json([
            'success' => true,
            'message' => 'Évaluation mise à jour avec succès',
            'data' => $evaluation->fresh()
        ]);
    }

    /**
     * Soumet une évaluation pour validation
     */
    public function submit(int $id): JsonResponse
    {
        $evaluation = Evaluation::find($id);
        
        if (!$evaluation) {
            return response()->json([
                'success' => false,
                'message' => 'Évaluation introuvable'
            ], 404);
        }

        $utilisateur = Auth::user();
        
        // Vérifier que l'utilisateur est l'évaluateur
        if ($evaluation->id_evaluateur !== $utilisateur->id_utilisateur) {
            return response()->json([
                'success' => false,
                'message' => 'Vous n\'êtes pas autorisé à soumettre cette évaluation'
            ], 403);
        }

        $result = $this->evaluationService->soumettrePourValidation($id);

        return response()->json($result, $result['success'] ? 200 : 400);
    }

    /**
     * Valide ou rejette une évaluation
     */
    public function validate(Request $request, int $id): JsonResponse
    {
        $request->validate([
            'est_validee' => 'required|boolean',
            'commentaire_validation' => 'nullable|string|max:1000',
        ]);

        $utilisateur = Auth::user();
        
        $result = $this->evaluationService->validerEvaluation(
            $id,
            $utilisateur->id_utilisateur,
            $request->est_validee,
            $request->commentaire_validation
        );

        return response()->json($result, $result['success'] ? 200 : 400);
    }

    /**
     * Récupère les périodes d'évaluation actives
     */
    public function getPeriodesActives(): JsonResponse
    {
        $periodes = PeriodeEvaluation::actives()
            ->with(['regle', 'region'])
            ->get();

        return response()->json([
            'success' => true,
            'data' => $periodes
        ]);
    }

    /**
     * Génère un rapport d'évaluation pour une période
     */
    public function rapport(Request $request, int $idPeriode): JsonResponse
    {
        $request->validate([
            'id_region' => 'nullable|integer|exists:regions,id_region',
        ]);

        $utilisateur = Auth::user();
        
        // Vérifier les permissions pour générer des rapports
        if (!$utilisateur->role->peutGenererRapports()) {
            return response()->json([
                'success' => false,
                'message' => 'Vous n\'êtes pas autorisé à générer des rapports'
            ], 403);
        }

        $rapport = $this->evaluationService->genererRapportPeriode(
            $idPeriode,
            $request->id_region
        );

        return response()->json([
            'success' => true,
            'data' => $rapport
        ]);
    }

    /**
     * Envoie des rappels pour les évaluations en retard
     */
    public function envoyerRappels(int $idPeriode): JsonResponse
    {
        $utilisateur = Auth::user();
        
        // Vérifier les permissions (DR, CDTT uniquement)
        if (!in_array($utilisateur->role->nom_role, ['DR', 'CDTT'])) {
            return response()->json([
                'success' => false,
                'message' => 'Vous n\'êtes pas autorisé à envoyer des rappels'
            ], 403);
        }

        $rappelsEnvoyes = $this->evaluationService->envoyerRappelsEvaluations($idPeriode);

        return response()->json([
            'success' => true,
            'message' => "{$rappelsEnvoyes} rappel(s) envoyé(s)",
            'data' => ['rappels_envoyes' => $rappelsEnvoyes]
        ]);
    }

    /**
     * Récupère les utilisateurs éligibles pour évaluation
     */
    public function getUtilisateursEligibles(): JsonResponse
    {
        $utilisateur = Auth::user();
        
        $hierarchyService = app(\App\Services\HierarchyService::class);
        $utilisateursEligibles = $hierarchyService->getUtilisateursEligiblesPourEvaluation($utilisateur->id_utilisateur);

        return response()->json([
            'success' => true,
            'data' => $utilisateursEligibles
        ]);
    }

    /**
     * Récupère l'historique des évaluations d'un utilisateur
     */
    public function historique(Request $request): JsonResponse
    {
        $request->validate([
            'id_utilisateur' => 'nullable|integer|exists:utilisateurs,id_utilisateur',
            'limit' => 'nullable|integer|min:1|max:100',
        ]);

        $utilisateur = Auth::user();
        $idUtilisateur = $request->id_utilisateur ?? $utilisateur->id_utilisateur;
        
        // Vérifier les permissions d'accès à l'historique
        if ($idUtilisateur !== $utilisateur->id_utilisateur && !$utilisateur->peutVoirHistorique($idUtilisateur)) {
            return response()->json([
                'success' => false,
                'message' => 'Accès non autorisé à cet historique'
            ], 403);
        }

        $evaluations = Evaluation::where('id_evalue', $idUtilisateur)
            ->where('statut', 'valide')
            ->with(['evaluateur', 'periode', 'regle'])
            ->orderBy('date_evaluation', 'desc')
            ->limit($request->limit ?? 20)
            ->get();

        return response()->json([
            'success' => true,
            'data' => $evaluations
        ]);
    }

    /**
     * Vérifie si un utilisateur peut accéder à une évaluation
     */
    private function peutAccederEvaluation($utilisateur, $evaluation): bool
    {
        // L'évaluateur peut toujours accéder
        if ($evaluation->id_evaluateur === $utilisateur->id_utilisateur) {
            return true;
        }

        // L'évalué peut accéder si l'évaluation est validée
        if ($evaluation->id_evalue === $utilisateur->id_utilisateur && $evaluation->statut === 'valide') {
            return true;
        }

        // Le manager peut accéder pour validation
        if ($evaluation->evalue->id_manager === $utilisateur->id_utilisateur) {
            return true;
        }

        // DR et CDTT peuvent accéder à toutes les évaluations de leur région
        if (in_array($utilisateur->role->nom_role, ['DR', 'CDTT']) && 
            $evaluation->evalue->id_region === $utilisateur->id_region) {
            return true;
        }

        return false;
    }
}