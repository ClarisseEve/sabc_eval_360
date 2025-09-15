<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Services\EvaluationService;
use App\Models\Evaluation;
use App\Models\PeriodeEvaluation;
use App\Models\Utilisateur;
use App\Models\RegleEvaluation;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Inertia\Response;

class EvaluationController extends Controller
{
    protected EvaluationService $evaluationService;

    public function __construct(EvaluationService $evaluationService)
    {
        $this->evaluationService = $evaluationService;
    }

    /**
     * Page d'accueil des évaluations
     */
    public function index(): Response
    {
        $utilisateur = Auth::user();
        
        // Récupérer les statistiques de base pour l'utilisateur
        $stats = [
            'total_evaluations' => $this->evaluationService->getTotalEvaluations($utilisateur->id_utilisateur),
            'evaluations_en_attente' => $this->evaluationService->getEvaluationsEnAttente($utilisateur->id_utilisateur)->count(),
            'evaluations_terminees' => $this->evaluationService->getEvaluationsTerminees($utilisateur->id_utilisateur)->count(),
        ];
        
        return Inertia::render('Common/Evaluations/Index', [
            'stats' => $stats,
            'user' => $utilisateur
        ]);
    }

    /**
     * Page "Mes évaluations" - affiche les types d'évaluations disponibles selon le rôle
     */
    public function mine(): Response
    {
        $utilisateur = Auth::user();
        
        // Pour l'instant, utiliser des données simulées
        $templates = [
            [
                'id' => 1,
                'title' => 'Évaluation des compétences managériales',
                'description' => 'Évaluation des compétences de leadership',
                'status' => 'published'
            ],
            [
                'id' => 2,
                'title' => 'Évaluation des compétences commerciales',
                'description' => 'Évaluation des compétences de vente',
                'status' => 'published'
            ]
        ];
        
        $evaluationTargets = [
            'auto' => [$utilisateur],
            'peers' => [],
            'subordinates' => []
        ];
        
        return Inertia::render('Common/Evaluations/Mine', [
            'templates' => $templates,
            'evaluationTargets' => $evaluationTargets,
            'user' => $utilisateur
        ]);
    }

    /**
     * Page "À compléter" - évaluations en cours
     */
    public function pending(): Response
    {
        $utilisateur = Auth::user();
        
        // Pour l'instant, utiliser des données simulées
        $pendingEvaluations = [];
        
        return Inertia::render('Common/Evaluations/Pending', [
            'evaluations' => $pendingEvaluations,
            'user' => $utilisateur
        ]);
    }

    /**
     * Création d'une nouvelle évaluation
     */
    public function create(Request $request): Response
    {
        $utilisateur = Auth::user();
        
        // Récupérer les paramètres de la requête
        // Front envoie actuellement ?template=...&target=... (matricule)
        $templateParam = $request->get('template') ?? $request->get('template_id') ?? $request->get('id_regle');
        $targetParam = $request->get('target') ?? $request->get('target_id') ?? $request->get('evalue');
        
        // Validation minimale des paramètres requis
        if (!$templateParam || !$targetParam) {
            abort(422, 'Paramètres manquants: template et target sont requis');
        }
        
        // Mapper l'index entier vers l'UUID de la règle
        $regleUuid = $this->mapTemplateIdToUuid($templateParam);
        $targetMatricule = (string) $targetParam;
        
        if (!$regleUuid) {
            abort(404, 'Template d\'évaluation introuvable');
        }
        
        // Valider que l'utilisateur peut créer cette évaluation
        $canCreate = $this->evaluationService->canCreateEvaluation(
            $utilisateur->matricule,
            $targetMatricule,
            $regleUuid
        );
        
        if (!$canCreate) {
            abort(403, 'Vous n\'êtes pas autorisé à créer cette évaluation');
        }
        
        // Récupérer la règle/"template" et les informations de la cible
        $regle = RegleEvaluation::find($regleUuid);
        $target = Utilisateur::where('matricule', $targetMatricule)->first();
        
        if (!$regle || !$target) {
            abort(404, 'Ressources introuvables (règle ou utilisateur)');
        }
        
        return Inertia::render('Common/Evaluations/Create', [
            // Garder la clé "template" pour compatibilité UI, bien qu'il s'agisse de la règle
            'template' => $regle,
            'template_id' => $templateParam, // Garder l'ID original pour le frontend
            'target' => $target,
            'target_matricule' => $targetMatricule,
            'user' => $utilisateur
        ]);
    }
    
    /**
     * Mappe un ID de template (entier) vers l'UUID correspondant
     */
    private function mapTemplateIdToUuid($templateId): ?string
    {
        // Mapping simple basé sur l'ordre des règles dans la base
        $mapping = [
            '1' => '09ee8f71-5067-4d4f-995f-817f3eb44f8e', // DR vers CDTT
            '2' => 'c491935b-2368-40b1-80fc-49e7dff4cd09', // CDTT vers CSC  
            '3' => '93032fd5-56d6-4e04-a10f-ddfa33c1b830', // CSC par pairs
        ];
        
        return $mapping[(string) $templateId] ?? null;
    }

    /**
     * Affichage d'une évaluation spécifique
     */
    public function show(string $id): Response
    {
        $utilisateur = Auth::user();
        
        // Récupérer l'évaluation avec relations
        $evaluation = Evaluation::with(['evaluateur', 'evalue', 'periode', 'regle', 'validateur'])
            ->find($id);
        
        if (!$evaluation) {
            abort(404, 'Évaluation introuvable');
        }
        
        // Vérifier que l'utilisateur peut voir cette évaluation
        if (!$this->peutAccederEvaluation($utilisateur, $evaluation)) {
            abort(403, 'Vous n\'êtes pas autorisé à voir cette évaluation');
        }
        
        return Inertia::render('Common/Evaluations/Show', [
            'evaluation' => $evaluation,
            'user' => $utilisateur
        ]);
    }

    /**
     * Édition d'une évaluation
     */
    public function edit(string $id): Response
    {
        $utilisateur = Auth::user();
        
        // Récupérer l'évaluation avec relations
        $evaluation = Evaluation::with(['evaluateur', 'evalue', 'periode', 'regle'])
            ->find($id);
        
        if (!$evaluation) {
            abort(404, 'Évaluation introuvable');
        }
        
        // Vérifier que l'utilisateur peut éditer cette évaluation
        // Seul l'évaluateur peut éditer et seulement si statut = 'brouillon'
        if ($evaluation->evaluateur->matricule !== $utilisateur->matricule || 
            $evaluation->statut !== 'brouillon') {
            abort(403, 'Vous n\'êtes pas autorisé à modifier cette évaluation');
        }
        
        return Inertia::render('Common/Evaluations/Edit', [
            'evaluation' => $evaluation,
            'user' => $utilisateur
        ]);
    }
    
    /**
     * Vérifie si un utilisateur peut accéder à une évaluation
     */
    private function peutAccederEvaluation($utilisateur, $evaluation): bool
    {
        // L'évaluateur peut toujours accéder (utiliser matricule comme clé)
        if ($evaluation->evaluateur->matricule === $utilisateur->matricule) {
            return true;
        }
        
        // L'évalué peut accéder si l'évaluation est validée
        if ($evaluation->evalue->matricule === $utilisateur->matricule && $evaluation->statut === 'valide') {
            return true;
        }
        
        // Le manager peut accéder pour validation
        if ($evaluation->evalue->manager_matricule === $utilisateur->matricule) {
            return true;
        }
        
        // DR et CDTT peuvent accéder à toutes les évaluations de leur région
        if (in_array($utilisateur->role_nom, ['DR', 'CDTT']) && 
            $evaluation->evalue->id_region === $utilisateur->id_region) {
            return true;
        }
        
        return false;
    }
}
