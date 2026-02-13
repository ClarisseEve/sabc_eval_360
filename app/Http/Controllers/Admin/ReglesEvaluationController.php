<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\RegleEvaluation;
use App\Services\RegleEvaluationValidationService;
use App\Traits\FormatsUserData;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response as InertiaResponse;

class ReglesEvaluationController extends Controller
{
    use FormatsUserData;
    
    protected $validationService;
    
    public function __construct(RegleEvaluationValidationService $validationService)
    {
        $this->validationService = $validationService;
    }
    
    public function index(): InertiaResponse
    {
        $regles = RegleEvaluation::orderBy('created_at', 'desc')->get();
        
        return Inertia::render('Admin/Evaluations/Regles/Index', [
            ...$this->getAdminPageData('Règles d\'Évaluation'),
            'regles' => $regles->map(function($regle) {
                return [
                    'id_regle' => $regle->id_regle,
                    'nom_regle' => $regle->nom_regle,
                    'description' => $regle->description,
                    'role_evaluateur' => $regle->role_evaluateur,
                    'role_evalue' => $regle->role_evalue,
                    'type_evaluation' => $regle->type_evaluation,
                    'nb_criteres' => count($regle->criteres),
                    'categories' => $regle->categories,
                    'est_active' => $regle->est_active,
                    'meme_region_obligatoire' => $regle->meme_region_obligatoire,
                    'meme_branche_obligatoire' => $regle->meme_branche_obligatoire,
                    'created_at' => $regle->created_at->format('Y-m-d'),
                ];
            }),
        ]);
    }
    
    public function create(): InertiaResponse
    {
        return Inertia::render('Admin/Evaluations/Regles/Create', [
            ...$this->getAdminPageData('Créer une Règle d\'Évaluation'),
            'categories_disponibles' => RegleEvaluationValidationService::CATEGORIES_VALIDES,
            'roles_disponibles' => $this->getRolesDisponibles(),
            'types_evaluation' => ['auto', 'pairs', 'descendante'],
        ]);
    }
    
    public function store(Request $request)
    {
        $validated = $request->validate([
            'nom_regle' => 'required|string|max:100',
            'description' => 'nullable|string',
            'role_evaluateur' => 'required|string|max:50',
            'role_evalue' => 'required|string|max:50',
            'type_evaluation' => 'required|string|in:auto,pairs,descendante',
            'criteres' => 'required|array|min:5',
            'criteres.*.nom' => 'required|string|max:200',
            'criteres.*.description' => 'required|string',
            'criteres.*.ponderation' => 'required|numeric|min:1',
            'criteres.*.echelle.min' => 'required|integer|in:1',
            'criteres.*.echelle.max' => 'required|integer|in:5',
            'criteres.*.categorie' => 'required|string',
            'meme_region_obligatoire' => 'boolean',
            'meme_branche_obligatoire' => 'boolean',
        ]);
        
        try {
            $this->validationService->validateCriteres($validated['criteres']);
        } catch (\Exception $e) {
            return back()->withErrors(['criteres' => $e->getMessage()])->withInput();
        }
        
        $criteres = collect($validated['criteres'])->map(function($critere, $index) {
            $critere['id'] = 'crit-' . ($index + 1);
            return $critere;
        })->toArray();
        
        $categories = collect($criteres)->pluck('categorie')->unique()->values()->toArray();
        
        $regle = RegleEvaluation::create([
            'nom_regle' => $validated['nom_regle'],
            'description' => $validated['description'],
            'role_evaluateur' => $validated['role_evaluateur'],
            'role_evalue' => $validated['role_evalue'],
            'type_evaluation' => $validated['type_evaluation'],
            'criteres_evaluation_json' => [
                'criteres' => $criteres,
                'categories' => $categories,
            ],
            'est_active' => true,
            'meme_region_obligatoire' => $validated['meme_region_obligatoire'] ?? true,
            'meme_branche_obligatoire' => $validated['meme_branche_obligatoire'] ?? true,
        ]);
        
        return redirect()->route('admin.admin.evaluations.regles.index')
            ->with('success', 'Règle d\'évaluation créée avec succès');
    }
    
    public function edit(int $id): InertiaResponse
    {
        $regle = RegleEvaluation::findOrFail($id);
        
        return Inertia::render('Admin/Evaluations/Regles/Edit', [
            ...$this->getAdminPageData('Modifier la Règle d\'Évaluation'),
            'regle' => [
                'id_regle' => $regle->id_regle,
                'nom_regle' => $regle->nom_regle,
                'description' => $regle->description,
                'role_evaluateur' => $regle->role_evaluateur,
                'role_evalue' => $regle->role_evalue,
                'type_evaluation' => $regle->type_evaluation,
                'criteres' => $regle->criteres,
                'est_active' => $regle->est_active,
                'meme_region_obligatoire' => $regle->meme_region_obligatoire,
                'meme_branche_obligatoire' => $regle->meme_branche_obligatoire,
            ],
            'categories_disponibles' => RegleEvaluationValidationService::CATEGORIES_VALIDES,
            'roles_disponibles' => $this->getRolesDisponibles(),
            'types_evaluation' => ['auto', 'pairs', 'descendante'],
        ]);
    }
    
    public function update(Request $request, int $id)
    {
        $regle = RegleEvaluation::findOrFail($id);
        
        $validated = $request->validate([
            'nom_regle' => 'required|string|max:100',
            'description' => 'nullable|string',
            'role_evaluateur' => 'required|string|max:50',
            'role_evalue' => 'required|string|max:50',
            'type_evaluation' => 'required|string|in:auto,pairs,descendante',
            'criteres' => 'required|array|min:5',
            'criteres.*.nom' => 'required|string|max:200',
            'criteres.*.description' => 'required|string',
            'criteres.*.ponderation' => 'required|numeric|min:1',
            'criteres.*.echelle.min' => 'required|integer|in:1',
            'criteres.*.echelle.max' => 'required|integer|in:5',
            'criteres.*.categorie' => 'required|string',
            'meme_region_obligatoire' => 'boolean',
            'meme_branche_obligatoire' => 'boolean',
        ]);
        
        try {
            $this->validationService->validateCriteres($validated['criteres']);
        } catch (\Exception $e) {
            return back()->withErrors(['criteres' => $e->getMessage()])->withInput();
        }
        
        $criteres = collect($validated['criteres'])->map(function($critere, $index) {
            if (!isset($critere['id'])) {
                $critere['id'] = 'crit-' . ($index + 1);
            }
            return $critere;
        })->toArray();
        
        $categories = collect($criteres)->pluck('categorie')->unique()->values()->toArray();
        
        $regle->update([
            'nom_regle' => $validated['nom_regle'],
            'description' => $validated['description'],
            'role_evaluateur' => $validated['role_evaluateur'],
            'role_evalue' => $validated['role_evalue'],
            'type_evaluation' => $validated['type_evaluation'],
            'criteres_evaluation_json' => [
                'criteres' => $criteres,
                'categories' => $categories,
            ],
            'meme_region_obligatoire' => $validated['meme_region_obligatoire'] ?? true,
            'meme_branche_obligatoire' => $validated['meme_branche_obligatoire'] ?? true,
        ]);
        
        return redirect()->route('admin.admin.evaluations.regles.index')
            ->with('success', 'Règle d\'évaluation mise à jour avec succès');
    }
    
    public function toggleActif(int $id)
    {
        $regle = RegleEvaluation::findOrFail($id);
        $regle->update(['est_active' => !$regle->est_active]);
        
        $status = $regle->est_active ? 'activée' : 'désactivée';
        
        return back()->with('success', "Règle d'évaluation {$status} avec succès");
    }
    
    protected function getRolesDisponibles(): array
    {
        return [
            'DR', 'CDTT', 'CSC', 'RTM', 'SRMO', 
            'CDV', 'TMO', 'CDS', 'SS', 'AS'
        ];
    }
}
