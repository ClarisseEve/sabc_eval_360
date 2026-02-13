<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Business\Template;
use App\Models\RegleEvaluation;
use App\Services\TemplateStructureValidator;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response as InertiaResponse;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\ValidationException;
use App\Traits\FormatsUserData;

class TemplatesEvaluationController extends Controller
{
    use FormatsUserData;
    
    protected TemplateStructureValidator $structureValidator;
    
    public function __construct(TemplateStructureValidator $structureValidator)
    {
        $this->middleware(['auth', 'role:ADMIN']);
        $this->structureValidator = $structureValidator;
    }
    
    /**
     * Afficher la liste des templates
     */
    public function index(): InertiaResponse
    {
        $templates = Template::with(['items.competence', 'evaluatorRoles'])
            ->orderByDesc('created_at')
            ->get()
            ->map(function ($template) {
                return [
                    'id_template' => $template->id_template,
                    'nom' => $template->nom,
                    'description' => $template->description,
                    'statut' => $template->statut,
                    'version' => $template->version,
                    'evaluated_role' => $template->evaluated_role,
                    'nb_items' => $template->items->count(),
                    'nb_roles' => $template->evaluatorRoles->count(),
                    'created_at' => $template->created_at,
                    'updated_at' => $template->updated_at,
                ];
            });
        
        $statistiques = [
            'total_templates' => $templates->count(),
            'templates_publies' => $templates->where('statut', 'publie')->count(),
            'templates_brouillon' => $templates->where('statut', 'brouillon')->count(),
        ];
        
        return Inertia::render('Admin/Evaluations/Templates', [
            'templates' => $templates,
            'statistiques' => $statistiques,
            ...$this->getAdminPageData("Gestion des Templates d'Évaluation", [], Auth::user()),
        ]);
    }
    
    /**
     * Créer un nouveau template
     */
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'nom' => 'required|string|max:255',
            'description' => 'nullable|string|max:1000',
            'evaluated_role' => 'nullable|string|max:50',
            'structure' => 'required|array',
            'statut' => 'nullable|in:brouillon,publie',
        ]);
        
        if ($validator->fails()) {
            return back()->withErrors($validator)->withInput();
        }
        
        try {
            // Valider la structure
            $structure = $request->structure;
            $this->structureValidator->validateStructure($structure);
            $this->structureValidator->validateMinimumCriteres($structure, 5);
            
            $template = Template::create([
                'nom' => $request->nom,
                'description' => $request->description,
                'statut' => $request->statut ?? 'brouillon',
                'version' => '1.0',
                'evaluated_role' => $request->evaluated_role,
                'meta_json' => $structure,
            ]);
            
            return back()->with('success', 'Template créé avec succès');
        } catch (ValidationException $e) {
            return back()->withErrors($e->errors())->withInput();
        } catch (\Exception $e) {
            return back()->withErrors(['error' => "Erreur lors de la création : {$e->getMessage()}"])->withInput();
        }
    }
    
    /**
     * Mettre à jour un template
     */
    public function update(Request $request, string $id)
    {
        $template = Template::findOrFail($id);
        
        $validator = Validator::make($request->all(), [
            'nom' => 'required|string|max:255',
            'description' => 'nullable|string|max:1000',
            'evaluated_role' => 'nullable|string|max:50',
            'structure' => 'required|array',
        ]);
        
        if ($validator->fails()) {
            return back()->withErrors($validator)->withInput();
        }
        
        try {
            // Valider la structure
            $structure = $request->structure;
            $this->structureValidator->validateStructure($structure);
            $this->structureValidator->validateMinimumCriteres($structure, 5);
            
            $template->update([
                'nom' => $request->nom,
                'description' => $request->description,
                'evaluated_role' => $request->evaluated_role,
                'meta_json' => $structure,
            ]);
            
            return back()->with('success', 'Template mis à jour avec succès');
        } catch (ValidationException $e) {
            return back()->withErrors($e->errors())->withInput();
        } catch (\Exception $e) {
            return back()->withErrors(['error' => "Erreur lors de la mise à jour : {$e->getMessage()}"])->withInput();
        }
    }
    
    /**
     * Publier un template (brouillon → publié)
     */
    public function publish(string $id)
    {
        try {
            $template = Template::findOrFail($id);
            
            if ($template->statut === 'publie') {
                return back()->withErrors(['error' => 'Ce template est déjà publié']);
            }
            
            // Valider la structure avant publication
            if ($template->meta_json) {
                $this->structureValidator->validateStructure($template->meta_json);
                $this->structureValidator->validateMinimumCriteres($template->meta_json, 5);
            }
            
            $template->update(['statut' => 'publie']);
            
            return back()->with('success', 'Template publié avec succès');
        } catch (ValidationException $e) {
            return back()->withErrors([
                'error' => 'Impossible de publier : ' . implode(', ', $e->errors())
            ]);
        } catch (\Exception $e) {
            return back()->withErrors(['error' => "Erreur lors de la publication : {$e->getMessage()}"]);
        }
    }
    
    /**
     * Dépublier un template (publié → brouillon)
     */
    public function unpublish(string $id)
    {
        try {
            $template = Template::findOrFail($id);
            
            if ($template->statut === 'brouillon') {
                return back()->withErrors(['error' => 'Ce template est déjà en brouillon']);
            }
            
            $template->update(['statut' => 'brouillon']);
            
            return back()->with('success', 'Template remis en brouillon avec succès');
        } catch (\Exception $e) {
            return back()->withErrors(['error' => "Erreur : {$e->getMessage()}"]);
        }
    }
    
    /**
     * Supprimer un template
     */
    public function destroy(string $id)
    {
        try {
            $template = Template::findOrFail($id);
            
            // Vérifier qu'aucune évaluation n'utilise ce template
            $nbEvaluations = \DB::connection('pgsql')
                ->table('evaluations')
                ->where('id_template', $id)
                ->count();
            
            if ($nbEvaluations > 0) {
                return back()->withErrors([
                    'error' => 'Impossible de supprimer ce template car il est utilisé par des évaluations'
                ]);
            }
            
            $template->delete();
            
            return back()->with('success', 'Template supprimé avec succès');
        } catch (\Exception $e) {
            return back()->withErrors(['error' => "Erreur lors de la suppression : {$e->getMessage()}"]);
        }
    }
    
    /**
     * Dupliquer un template
     */
    public function duplicate(string $id)
    {
        try {
            $template = Template::findOrFail($id);
            
            $nouveauTemplate = $template->replicate();
            $nouveauTemplate->nom = $template->nom . ' (Copie)';
            $nouveauTemplate->statut = 'brouillon';
            $nouveauTemplate->save();
            
            // Dupliquer les items si nécessaire
            foreach ($template->items as $item) {
                $nouveauItem = $item->replicate();
                $nouveauItem->template_id = $nouveauTemplate->id_template;
                $nouveauItem->save();
            }
            
            return back()->with('success', 'Template dupliqué avec succès');
        } catch (\Exception $e) {
            return back()->withErrors(['error' => "Erreur lors de la duplication : {$e->getMessage()}"]);
        }
    }
}
