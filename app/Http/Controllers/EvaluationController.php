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
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use App\Traits\FormatsUserData;
use Inertia\Inertia;
use Inertia\Response;
use Illuminate\Http\RedirectResponse;

class EvaluationController extends Controller
{
    use FormatsUserData;
    protected EvaluationService $evaluationService;

    public function __construct(EvaluationService $evaluationService)
    {
        $this->evaluationService = $evaluationService;
    }

    /**
     * Enregistre une évaluation (brouillon) dans la base Business (PGSQL)
     */
    public function store(Request $request)
    {
        $utilisateur = Auth::user();
        if (!$utilisateur) {
            abort(401);
        }

        $validated = $request->validate([
            'id_regle' => 'nullable|string',
            'target_matricule' => 'required|string|exists:utilisateurs,matricule',
            'notes' => 'required|array',
            'notes.*.note' => 'required|integer|min:1|max:5',
            'notes.*.commentaire' => 'nullable|string',
            'commentaire_general' => 'nullable|string'
        ]);

        // Vérifier l'autorisation via le service (règles/permissions/période)
        $can = $this->evaluationService->canCreateEvaluation(
            $utilisateur->matricule,
            $validated['target_matricule'],
            $validated['id_regle'] ?? null
        );
        if (!$can) {
            abort(403, "Vous n'êtes pas autorisé à créer cette évaluation");
        }

        // Récupérer la période active (PGSQL)
        $periode = PeriodeEvaluation::where('statut', 'active')->first();
        if (!$periode) {
            abort(422, 'Aucune période active');
        }

        // Calcul de la note globale simple (moyenne)
        $sum = 0; $count = 0;
        foreach ($validated['notes'] as $n) { $sum += (int)$n['note']; $count++; }
        $noteGlobale = $count > 0 ? round($sum / $count, 2) : null;

        // Insertion dans PGSQL (table business evaluations)
        $payload = [
            'id_evaluation' => (string) Str::uuid(),
            'evaluateur_matricule' => $utilisateur->matricule,
            'evalue_matricule' => $validated['target_matricule'],
            'id_periode' => $periode->id_periode,
            'id_regle' => $validated['id_regle'] ?? null,
            'date_evaluation' => now()->toDateString(),
            'date_soumission' => null,
            'statut' => 'brouillon',
            'notations_json' => json_encode($validated['notes']),
            'commentaire_general' => $validated['commentaire_general'] ?? null,
            'note_globale' => $noteGlobale,
            'type_evaluation' => '360',
            'source_system' => 'web',
            'sync_status' => 'pending',
            'created_at' => now(),
            'updated_at' => now(),
        ];

        DB::connection('pgsql')->table('evaluations')->insert($payload);

        return redirect()->route('evaluations.index')
            ->with('success', "Évaluation créée en brouillon");
    }

    /**
     * Page d'accueil des évaluations
     */
    public function index(): Response|RedirectResponse
    {
        // Par défaut, rediriger vers "Mes évaluations" pour éviter la page vide
        return redirect()->route('evaluations.mine');
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
            'user' => $utilisateur ? $this->formatUserForUI($utilisateur) : null,
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
            'user' => $utilisateur ? $this->formatUserForUI($utilisateur) : null,
        ]);
    }

    /**
     * Création d'une nouvelle évaluation
     */
    public function create(Request $request): Response
    {
        // Deep-link vers la page "Mes évaluations" qui ouvrira le modal directement
        $templateParam = $request->get('template') ?? $request->get('template_id') ?? $request->get('id_regle');
        $targetParam = $request->get('target') ?? $request->get('target_id') ?? $request->get('evalue');
        if (!$templateParam || !$targetParam) {
            return redirect()->route('evaluations.mine');
        }
        return redirect()->route('evaluations.mine', [
            'template' => (string)$templateParam,
            'target' => (string)$targetParam,
        ]);
    }

    /**
     * Détails JSON pour alimenter un modal côté front
     */
    public function details(Request $request)
    {
        $utilisateur = Auth::user();
        if (!$utilisateur) {
            return response()->json(['error' => 'Unauthenticated'], 401);
        }
        $templateParam = $request->query('template');
        $targetParam = $request->query('target');
        if (!$templateParam || !$targetParam) {
            return response()->json(['error' => 'Paramètres manquants'], 422);
        }
        $target = Utilisateur::where('matricule', $targetParam)->first();
        if (!$target) {
            return response()->json(['error' => 'Utilisateur cible introuvable'], 404);
        }
        $periode = PeriodeEvaluation::where('statut', 'active')->first();
        $regleUuid = $this->mapTemplateIdToUuid($templateParam) ?: null;
        if ($regleUuid) {
            $regle = RegleEvaluation::find($regleUuid);
            return response()->json([
                'template' => $regle,
                'periode' => $periode,
                'target' => $target,
                'id_regle' => $regle?->id_regle,
            ]);
        }
        $template = \App\Models\Business\Template::with(['items.competence'])->find($templateParam);
        if (!$template) {
            return response()->json(['error' => 'Template introuvable'], 404);
        }
        $regleSnap = RegleEvaluation::where('est_active', true)
            ->whereRaw("parametres_json->>'template_id' = ?", [$templateParam])
            ->first();
        if ($regleSnap) {
            return response()->json([
                'template' => $regleSnap,
                'periode' => $periode,
                'target' => $target,
                'id_regle' => $regleSnap->id_regle,
            ]);
        }
        $criteres = [];
        foreach ($template->items as $item) {
            $criteres[] = [
                'id' => (string) $item->id,
                'libelle' => $item->competence?->libelle ?? 'Critère',
                'description' => $item->competence?->description,
                'poids' => $item->poids_critere,
                'echelle' => $item->scale_min . '-' . $item->scale_max,
                'section_label' => $item->section_label,
                'section_order' => $item->section_order,
            ];
        }
        return response()->json([
            'template' => [
                'id_regle' => null,
                'nom_regle' => $template->nom,
                'criteres_evaluation_json' => $criteres,
            ],
            'periode' => $periode,
            'target' => $target,
            'id_regle' => null,
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
     * Mise à jour d'un brouillon d'évaluation ou soumission finale.
     */
    public function update(Request $request, string $id)
    {
        $utilisateur = Auth::user();
        if (!$utilisateur) {
            abort(401);
        }

        $evaluation = DB::connection('pgsql')
            ->table('evaluations')
            ->where('id_evaluation', $id)
            ->first();

        if (!$evaluation) {
            abort(404, 'Évaluation introuvable');
        }

        if (($evaluation->evaluateur_matricule ?? $evaluation->evaluateur_id ?? null) !== $utilisateur->matricule) {
            abort(403, 'Vous n\'êtes pas autorisé à modifier cette évaluation');
        }

        if (($evaluation->statut ?? 'brouillon') !== 'brouillon') {
            abort(403, "Seules les évaluations en brouillon peuvent être modifiées");
        }

        $validated = $request->validate([
            'notes' => ['required', 'array', 'min:1'],
            'notes.*.note' => ['required', 'integer', 'between:1,5'],
            'notes.*.commentaire' => ['nullable', 'string'],
            'commentaire_general' => ['nullable', 'string'],
            'submit' => ['required', 'boolean'],
        ]);

        $notes = collect($validated['notes'])
            ->map(function ($note) {
                return [
                    'id' => $note['id'] ?? null,
                    'note' => (int) $note['note'],
                    'commentaire' => $note['commentaire'] ?? null,
                ];
            })
            ->values()
            ->all();

        $noteGlobale = count($notes) > 0
            ? round(collect($notes)->avg(fn ($item) => (int) $item['note']), 2)
            : null;

        $statut = $validated['submit'] ? 'soumis' : 'brouillon';
        $dateSoumission = $validated['submit'] ? now() : null;

        DB::connection('pgsql')
            ->table('evaluations')
            ->where('id_evaluation', $id)
            ->update([
                'notations_json' => json_encode($notes),
                'commentaire_general' => $validated['commentaire_general'] ?? null,
                'note_globale' => $noteGlobale,
                'statut' => $statut,
                'date_soumission' => $dateSoumission,
                'updated_at' => now(),
            ]);

        return $validated['submit']
            ? redirect()
                ->route('evaluations.show', ['id' => $id])
                ->with('success', "Évaluation soumise pour validation")
            : redirect()
                ->route('evaluations.edit', ['id' => $id])
                ->with('success', 'Brouillon enregistré');
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
