<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Services\EvaluationService;
use App\Models\Evaluation;
use App\Models\PeriodeEvaluation;
use App\Models\Utilisateur;
use App\Models\RegleEvaluation;
use App\Models\Business\Template;
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

        if ($this->isAdmin($utilisateur)) {
            abort(403, "Les administrateurs ne peuvent pas créer d'évaluation");
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
        $periode = PeriodeEvaluation::active()->first();
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
        if ($this->isAdmin(Auth::user())) {
            return redirect()->route('admin.evaluations.management');
        }
        // Par défaut, rediriger vers "Mes évaluations" pour éviter la page vide
        return redirect()->route('evaluations.mine');
    }

    /**
     * Page "Mes évaluations" - templates disponibles + cibles selon le rôle
     */
    public function mine(): Response
    {
        $utilisateur = Auth::user();

        if ($this->isAdmin($utilisateur)) {
            abort(403);
        }

        $periode = PeriodeEvaluation::active()->first();

        // Templates applicables à ce rôle (PGSQL via Business\Template)
        $templates = $this->getApplicableTemplates($utilisateur);

        // Cibles d'évaluation selon la hiérarchie
        $targets = $this->getEvaluationTargets($utilisateur);

        // Stats évaluations complétées cette période
        $completed = 0;
        $total = array_sum(array_map('count', $targets));
        if ($periode) {
            $completed = DB::connection('pgsql')->table('evaluations')
                ->where('evaluateur_matricule', $utilisateur->matricule)
                ->where('id_periode', $periode->id_periode)
                ->whereIn('statut', ['valide', 'soumis'])
                ->count();
        }

        return Inertia::render('Common/Evaluations/Mine', [
            'templates'         => $templates,
            'evaluationTargets' => $targets,
            'stats'             => ['completed' => $completed, 'total' => $total],
            'user'              => $this->formatUserForUI($utilisateur),
        ]);
    }

    /**
     * Page "À compléter" — évaluations brouillon + à démarrer
     */
    public function pending(): Response
    {
        $utilisateur = Auth::user();

        if ($this->isAdmin($utilisateur)) {
            abort(403);
        }

        $periode     = PeriodeEvaluation::active()->first();
        $targets     = $this->getEvaluationTargets($utilisateur);
        $evaluations = [];

        // Récupérer les brouillons existants (PGSQL)
        $brouillons = collect();
        if ($periode) {
            $rows = DB::connection('pgsql')->table('evaluations')
                ->where('evaluateur_matricule', $utilisateur->matricule)
                ->where('id_periode', $periode->id_periode)
                ->where('statut', 'brouillon')
                ->get();

            // Charger les infos cibles depuis MySQL
            $evalueMatricules = $rows->pluck('evalue_matricule')->unique();
            $evalues = Utilisateur::whereIn('matricule', $evalueMatricules)
                ->get()->keyBy('matricule');

            foreach ($rows as $row) {
                $cible = $evalues->get($row->evalue_matricule);
                if (!$cible) continue;
                $type = $this->determinerTypeEvaluationPourCibles($utilisateur, $cible);
                $evaluations[$type][] = [
                    'type'       => $type,
                    'statut'     => 'a_terminer',
                    'deadline'   => $periode->date_fin,
                    'evaluation' => [
                        'id_evaluation'  => $row->id_evaluation,
                        'id'             => $row->id_evaluation,
                        'statut'         => $row->statut,
                        'note_globale'   => $row->note_globale,
                        'notations_json' => json_decode($row->notations_json ?? '[]', true),
                        'date_soumission' => $row->date_soumission,
                    ],
                    'cible' => $this->formatCible($cible),
                ];
                $brouillons->push($row->evalue_matricule);
            }
        }

        // Ajouter les cibles non encore commencées ("à faire")
        foreach ($targets as $type => $cibles) {
            foreach ($cibles as $cible) {
                if ($brouillons->contains($cible['matricule'])) continue;
                $evaluations[$type][] = [
                    'type'       => $type,
                    'statut'     => 'a_faire',
                    'deadline'   => $periode?->date_fin,
                    'evaluation' => null,
                    'cible'      => $cible,
                ];
            }
        }

        $aTerminer = 0;
        $aFaire    = 0;
        foreach ($evaluations as $tasks) {
            foreach ($tasks as $task) {
                $task['statut'] === 'a_terminer' ? $aTerminer++ : $aFaire++;
            }
        }

        return Inertia::render('Common/Evaluations/Pending', [
            'evaluations'   => $evaluations,
            'statistiques'  => [
                'total_a_faire'    => $aFaire,
                'total_a_terminer' => $aTerminer,
                'total_general'    => $aFaire + $aTerminer,
            ],
            'role_permissions' => $this->getRolePermissions($utilisateur),
            'user'             => $this->formatUserForUI($utilisateur),
        ]);
    }

    /**
     * Création d'une nouvelle évaluation
     */
    public function create(Request $request): Response
    {
        if ($this->isAdmin(Auth::user())) {
            abort(403);
        }
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

        if ($this->isAdmin($utilisateur)) {
            return response()->json(['error' => 'Forbidden'], 403);
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
        $periode = PeriodeEvaluation::active()->first();
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
     * Affichage d'une évaluation spécifique (raw DB — évite les relations Eloquent cross-DB)
     */
    public function show(string $id): Response
    {
        $utilisateur = Auth::user();

        $evalRow = DB::connection('pgsql')->table('evaluations')
            ->where('id_evaluation', $id)
            ->first();

        if (!$evalRow) abort(404, 'Évaluation introuvable');

        if (!$this->peutAccederEvaluationRaw($utilisateur, $evalRow)) {
            abort(403, 'Vous n\'êtes pas autorisé à voir cette évaluation');
        }

        $evaluateur = Utilisateur::where('matricule', $evalRow->evaluateur_matricule)->first();
        $evalue     = Utilisateur::where('matricule', $evalRow->evalue_matricule)->first();
        $criteres   = $this->getCriteresForEvaluation($evalRow);

        $evaluation = [
            'id_evaluation'      => $evalRow->id_evaluation,
            'id'                 => $evalRow->id_evaluation,
            'statut'             => $evalRow->statut,
            'note_globale'       => $evalRow->note_globale,
            'notations_json'     => json_decode($evalRow->notations_json ?? '[]', true),
            'commentaire_general' => $evalRow->commentaire_general,
            'date_evaluation'    => $evalRow->date_evaluation,
            'date_soumission'    => $evalRow->date_soumission,
            'evaluateur'         => $evaluateur,
            'evalue'             => $evalue,
            'regle'              => ['criteres_evaluation_json' => $criteres],
        ];

        return Inertia::render('Common/Evaluations/Show', [
            'evaluation' => $evaluation,
            'user'       => $this->formatUserForUI($utilisateur),
        ]);
    }

    /**
     * Édition d'une évaluation (raw DB — évite les relations Eloquent cross-DB)
     */
    public function edit(string $id): Response
    {
        $utilisateur = Auth::user();

        $evalRow = DB::connection('pgsql')->table('evaluations')
            ->where('id_evaluation', $id)
            ->first();

        if (!$evalRow) abort(404, 'Évaluation introuvable');

        if (($evalRow->evaluateur_matricule ?? '') !== $utilisateur->matricule
            || ($evalRow->statut ?? '') !== 'brouillon') {
            abort(403, 'Vous n\'êtes pas autorisé à modifier cette évaluation');
        }

        $evaluateur = Utilisateur::where('matricule', $evalRow->evaluateur_matricule)->first();
        $evalue     = Utilisateur::where('matricule', $evalRow->evalue_matricule)->first();
        $criteres   = $this->getCriteresForEvaluation($evalRow);

        $evaluation = [
            'id_evaluation'      => $evalRow->id_evaluation,
            'id'                 => $evalRow->id_evaluation,
            'statut'             => $evalRow->statut,
            'note_globale'       => $evalRow->note_globale,
            'notations_json'     => json_decode($evalRow->notations_json ?? '[]', true),
            'commentaire_general' => $evalRow->commentaire_general,
            'date_evaluation'    => $evalRow->date_evaluation,
            'evaluateur'         => $evaluateur,
            'evalue'             => $evalue,
            'regle'              => ['criteres_evaluation_json' => $criteres],
        ];

        return Inertia::render('Common/Evaluations/Edit', [
            'evaluation' => $evaluation,
            'user'       => $this->formatUserForUI($utilisateur),
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
     * Page "À valider" — évaluations soumises par les subordonnés directs
     */
    public function aValider(): Response
    {
        $utilisateur = Auth::user();
        if ($this->isAdmin($utilisateur)) abort(403);

        // Subordonnés directs de l'utilisateur connecté
        $subMatricules = Utilisateur::where('manager_matricule', $utilisateur->matricule)
            ->pluck('matricule')
            ->toArray();

        $aValider = [];

        if (!empty($subMatricules)) {
            $rows = DB::connection('pgsql')->table('evaluations')
                ->where('statut', 'soumis')
                ->whereIn('evalue_matricule', $subMatricules)
                ->orderByDesc('date_soumission')
                ->get();

            // Charger les infos MySQL des évaluateurs et évalués
            $allMatricules = $rows->flatMap(fn($r) => [$r->evaluateur_matricule, $r->evalue_matricule])
                ->unique()->values()->toArray();
            $users = Utilisateur::whereIn('matricule', $allMatricules)->get()->keyBy('matricule');

            foreach ($rows as $row) {
                $evaluateur = $users->get($row->evaluateur_matricule);
                $evalue     = $users->get($row->evalue_matricule);
                $aValider[] = [
                    'id_evaluation'       => $row->id_evaluation,
                    'statut'              => $row->statut,
                    'date_soumission'     => $row->date_soumission,
                    'date_evaluation'     => $row->date_evaluation,
                    'note_globale'        => $row->note_globale,
                    'commentaire_general' => $row->commentaire_general,
                    'notations_json'      => json_decode($row->notations_json ?? '[]', true),
                    'type_evaluation'     => $row->type_evaluation,
                    'evaluateur' => $evaluateur ? $this->formatCible($evaluateur) : ['matricule' => $row->evaluateur_matricule, 'nom' => '', 'prenom' => ''],
                    'evalue'     => $evalue     ? $this->formatCible($evalue)     : ['matricule' => $row->evalue_matricule,     'nom' => '', 'prenom' => ''],
                ];
            }
        }

        return Inertia::render('Common/Evaluations/ToValidate', [
            'aValider' => $aValider,
            'stats'    => [
                'total'   => count($aValider),
                'urgents' => collect($aValider)->filter(fn($e) => $e['date_soumission'] && \Carbon\Carbon::parse($e['date_soumission'])->diffInDays(now()) > 3)->count(),
            ],
            'user' => $this->formatUserForUI($utilisateur),
        ]);
    }

    /**
     * Valide ou rejette une évaluation soumise par un subordonné
     */
    public function valider(Request $request, string $id)
    {
        $utilisateur = Auth::user();
        if (!$utilisateur) abort(401);

        $validated = $request->validate([
            'action'                 => 'required|in:valide,rejete',
            'commentaire_validation' => 'nullable|string|max:500',
        ]);

        $evalRow = DB::connection('pgsql')->table('evaluations')
            ->where('id_evaluation', $id)
            ->where('statut', 'soumis')
            ->first();

        if (!$evalRow) abort(404, 'Évaluation introuvable ou non soumise');

        // Vérifier que l'utilisateur est bien le manager de l'évalué
        $evalue = Utilisateur::where('matricule', $evalRow->evalue_matricule)->first();
        if (!$evalue || $evalue->manager_matricule !== $utilisateur->matricule) {
            abort(403, 'Vous n\'êtes pas autorisé à valider cette évaluation');
        }

        $nouveauStatut = $validated['action'] === 'valide' ? 'valide' : 'brouillon';

        DB::connection('pgsql')->table('evaluations')
            ->where('id_evaluation', $id)
            ->update([
                'statut'     => $nouveauStatut,
                'updated_at' => now(),
            ]);

        $message = $validated['action'] === 'valide'
            ? 'Évaluation validée avec succès'
            : 'Évaluation renvoyée en brouillon';

        return redirect()->route('evaluations.a-valider')
            ->with('success', $message);
    }

    /**
     * Vérifie l'accès à une évaluation via un objet stdClass (raw DB row)
     */
    private function peutAccederEvaluationRaw($utilisateur, $evalRow): bool
    {
        if (($evalRow->evaluateur_matricule ?? '') === $utilisateur->matricule) return true;

        if (($evalRow->evalue_matricule ?? '') === $utilisateur->matricule
            && ($evalRow->statut ?? '') === 'valide') return true;

        $evalue = Utilisateur::where('matricule', $evalRow->evalue_matricule ?? '')->first();
        if ($evalue && $evalue->manager_matricule === $utilisateur->matricule) return true;

        if (in_array($utilisateur->role_nom, ['DR', 'CDTT'])
            && $evalue && $evalue->id_region === $utilisateur->id_region) return true;

        return false;
    }

    /**
     * Charge les critères d'évaluation depuis un template ou une règle (PGSQL)
     */
    private function getCriteresForEvaluation($evalRow): array
    {
        if (empty($evalRow->id_regle)) return [];

        // Essayer comme UUID (Business\Template)
        $template = Template::with(['items.competence'])->find($evalRow->id_regle);
        if ($template) {
            return $template->items->map(fn($item) => [
                'id'            => (string) $item->id,
                'libelle'       => $item->competence?->libelle ?? 'Critère',
                'description'   => $item->competence?->description,
                'poids'         => $item->poids_critere,
                'section_label' => $item->section_label,
                'section_order' => $item->section_order,
            ])->toArray();
        }

        // Essayer comme entier (RegleEvaluation)
        if (is_numeric($evalRow->id_regle)) {
            $regle = RegleEvaluation::find($evalRow->id_regle);
            if ($regle) {
                return $regle->criteres_evaluation_json ?? [];
            }
        }

        return [];
    }

    /**
     * Récupère les templates applicables au rôle de l'utilisateur (PGSQL Business\Template)
     * avec fallback sur RegleEvaluation si aucun template publié trouvé.
     */
    private function getApplicableTemplates($utilisateur): array
    {
        $roleNom = $utilisateur->role_nom ?? $utilisateur->role ?? '';

        // Essayer via Business\Template + TemplateEvaluatorRole
        $templates = Template::with(['evaluatorRoles'])
            ->where('statut', 'publie')
            ->whereHas('evaluatorRoles', fn($q) => $q->where('role_evaluateur', $roleNom))
            ->get();

        if ($templates->isNotEmpty()) {
            return $templates->map(fn($t) => [
                'id'             => $t->id_template,
                'id_regle'       => $t->id_template,
                'nom'            => $t->nom,
                'title'          => $t->nom,
                'description'    => $t->description ?? '',
                'evaluated_role' => $t->evaluated_role,
                'status'         => 'published',
            ])->toArray();
        }

        // Fallback sur RegleEvaluation
        $regles = RegleEvaluation::where('est_active', true)
            ->where(function ($q) use ($roleNom) {
                $q->where('role_evaluateur', $roleNom)
                  ->orWhereNull('role_evaluateur');
            })
            ->get();

        return $regles->map(fn($r) => [
            'id'          => $r->id_regle,
            'id_regle'    => $r->id_regle,
            'nom'         => $r->nom_regle,
            'title'       => $r->nom_regle,
            'description' => $r->description ?? '',
            'status'      => 'published',
        ])->toArray();
    }

    /**
     * Construit les groupes de cibles d'évaluation selon la hiérarchie SABC.
     */
    private function getEvaluationTargets($utilisateur): array
    {
        $targets = [
            'auto'         => [],
            'peers'        => [],
            'subordinates' => [],
            'ascendante'   => [],
        ];

        // Auto-évaluation
        $targets['auto'][] = $this->formatCible($utilisateur);

        // Subordonnés directs
        $subordonnes = Utilisateur::where('manager_matricule', $utilisateur->matricule)
            ->where('est_actif', true)
            ->get();
        foreach ($subordonnes as $s) {
            $targets['subordinates'][] = $this->formatCible($s);
        }

        // Pairs (même région + même niveau hiérarchique)
        if ($utilisateur->id_region && $utilisateur->niveau_hierarchique) {
            $pairs = Utilisateur::where('id_region', $utilisateur->id_region)
                ->where('niveau_hierarchique', $utilisateur->niveau_hierarchique)
                ->where('matricule', '!=', $utilisateur->matricule)
                ->where('est_actif', true)
                ->get();
            foreach ($pairs as $p) {
                $targets['peers'][] = $this->formatCible($p);
            }
        }

        // Évaluation ascendante (manager direct)
        if ($utilisateur->manager_matricule) {
            $manager = Utilisateur::where('matricule', $utilisateur->manager_matricule)
                ->where('est_actif', true)
                ->first();
            if ($manager) {
                $targets['ascendante'][] = $this->formatCible($manager);
            }
        }

        // Nettoyer les groupes vides
        return array_filter($targets, fn($group) => count($group) > 0);
    }

    /**
     * Formate un utilisateur en tableau cible pour le frontend.
     */
    private function formatCible($utilisateur): array
    {
        return [
            'matricule'  => $utilisateur->matricule,
            'prenom'     => $utilisateur->prenom,
            'nom'        => $utilisateur->nom,
            'role_nom'   => $utilisateur->role_nom ?? $utilisateur->role,
            'region_nom' => $utilisateur->region_nom,
            'avatar'     => $utilisateur->photo_url ?? null,
        ];
    }

    /**
     * Détermine le type d'évaluation entre deux utilisateurs.
     */
    private function determinerTypeEvaluationPourCibles($evaluateur, $evalue): string
    {
        if ($evaluateur->matricule === $evalue->matricule) {
            return 'auto';
        }
        if ($evaluateur->matricule === $evalue->manager_matricule) {
            return 'descendante';
        }
        if ($evaluateur->manager_matricule === $evalue->matricule) {
            return 'ascendante';
        }
        return 'pairs';
    }

    /**
     * Construit les permissions rôle pour la page Pending.
     */
    private function getRolePermissions($utilisateur): array
    {
        $role = $utilisateur->role_nom ?? $utilisateur->role ?? '';
        $permissions = [
            'peut_auto_evaluation'   => true,
            'peut_evaluer_pairs'     => in_array($role, ['DR', 'CDTT', 'CSC', 'CDV', 'CDS', 'RTM', 'SRMO', 'TMO', 'SS', 'AS']),
            'peut_evaluer_equipe'    => in_array($role, ['DR', 'CDTT', 'CSC', 'CDV', 'RTM', 'SRMO', 'SS']),
            'peut_evaluer_ascendant' => in_array($role, ['CSC', 'CDV', 'CDS', 'RTM', 'TMO', 'SS', 'AS']),
        ];
        return array_filter($permissions);
    }

    /**
     * Détecte si l'utilisateur est identifié comme administrateur.
     */
    protected function isAdmin($user): bool
    {
        if (!$user) {
            return false;
        }

        $role = strtoupper(trim($user->role_nom ?? $user->role ?? ''));

        return str_contains($role, 'ADMIN');
    }
}
