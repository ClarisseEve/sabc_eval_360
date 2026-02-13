<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\TemplateRolePeriode;
use App\Models\Business\Template;
use App\Models\PeriodeEvaluation;
use App\Services\TemplateAssignationService;
use App\Exceptions\PeriodeNonModifiableException;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response as InertiaResponse;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Validator;
use App\Traits\FormatsUserData;

class TemplateAssignationsController extends Controller
{
    use FormatsUserData;
    
    protected TemplateAssignationService $assignationService;
    
    public function __construct(TemplateAssignationService $assignationService)
    {
        $this->middleware(['auth', 'role:ADMIN']);
        $this->assignationService = $assignationService;
    }
    
    /**
     * Afficher la matrice d'assignations
     */
    public function index(Request $request): InertiaResponse
    {
        // Récupérer la période active ou la dernière période
        $periodeId = $request->query('periode_id');
        
        if (!$periodeId) {
            $periode = PeriodeEvaluation::orderByDesc('date_debut')->first();
            $periodeId = $periode?->id_periode;
        } else {
            $periode = PeriodeEvaluation::find($periodeId);
        }
        
        // Récupérer toutes les périodes pour le sélecteur
        $periodes = PeriodeEvaluation::orderByDesc('date_debut')
            ->get()
            ->map(function ($p) {
                return [
                    'id_periode' => $p->id_periode,
                    'nom_periode' => $p->nom_periode,
                    'date_debut' => $p->date_debut->format('Y-m-d'),
                    'date_fin' => $p->date_fin->format('Y-m-d'),
                    'est_ouverte' => $p->est_ouverte,
                    'est_cloturee' => $p->est_cloturee,
                    'peut_modifier' => $this->assignationService->canModifyAssignation($p),
                ];
            });
        
        // Récupérer la matrice d'assignations
        $matrice = [];
        if ($periodeId) {
            $matrice = $this->assignationService->getMatriceAssignations($periodeId);
        }
        
        // Récupérer tous les templates publiés
        $templates = Template::where('statut', 'publie')
            ->orderBy('nom')
            ->get()
            ->map(function ($t) {
                return [
                    'id_template' => $t->id_template,
                    'nom' => $t->nom,
                    'description' => $t->description,
                    'evaluated_role' => $t->evaluated_role,
                ];
            });
        
        $statistiques = [
            'total_roles' => count($matrice),
            'roles_assignes' => collect($matrice)->where('est_assigne', true)->count(),
            'roles_non_assignes' => collect($matrice)->where('est_assigne', false)->count(),
        ];
        
        return Inertia::render('Admin/Evaluations/Assignations', [
            'periodes' => $periodes,
            'periode_selectionnee' => $periode ? [
                'id_periode' => $periode->id_periode,
                'nom_periode' => $periode->nom_periode,
                'peut_modifier' => $this->assignationService->canModifyAssignation($periode),
            ] : null,
            'matrice' => $matrice,
            'templates' => $templates,
            'statistiques' => $statistiques,
            ...$this->getAdminPageData("Assignation des Templates", [], Auth::user()),
        ]);
    }
    
    /**
     * Assigner un template à un rôle pour une période
     */
    public function assign(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'id_template' => 'required|exists:templates,id_template',
            'id_role' => 'required|exists:roles,id_role',
            'id_periode' => 'required|exists:periodes_evaluation,id_periode',
        ]);
        
        if ($validator->fails()) {
            return back()->withErrors($validator)->withInput();
        }
        
        try {
            $this->assignationService->assignTemplate(
                $request->id_template,
                $request->id_role,
                $request->id_periode
            );
            
            return back()->with('success', 'Template assigné avec succès');
        } catch (PeriodeNonModifiableException $e) {
            return back()->withErrors(['error' => $e->getMessage()]);
        } catch (\InvalidArgumentException $e) {
            return back()->withErrors(['error' => $e->getMessage()]);
        } catch (\Exception $e) {
            return back()->withErrors(['error' => "Erreur lors de l'assignation : {$e->getMessage()}"]);
        }
    }
    
    /**
     * Mettre à jour une assignation
     */
    public function update(Request $request, int $id)
    {
        $validator = Validator::make($request->all(), [
            'id_template' => 'required|exists:templates,id_template',
        ]);
        
        if ($validator->fails()) {
            return back()->withErrors($validator)->withInput();
        }
        
        try {
            $this->assignationService->updateAssignation($id, $request->id_template);
            
            return back()->with('success', 'Assignation mise à jour avec succès');
        } catch (PeriodeNonModifiableException $e) {
            return back()->withErrors(['error' => $e->getMessage()]);
        } catch (\Exception $e) {
            return back()->withErrors(['error' => "Erreur lors de la mise à jour : {$e->getMessage()}"]);
        }
    }
    
    /**
     * Supprimer une assignation
     */
    public function destroy(int $id)
    {
        try {
            $this->assignationService->deleteAssignation($id);
            
            return back()->with('success', 'Assignation supprimée avec succès');
        } catch (PeriodeNonModifiableException $e) {
            return back()->withErrors(['error' => $e->getMessage()]);
        } catch (\Exception $e) {
            return back()->withErrors(['error' => "Erreur lors de la suppression : {$e->getMessage()}"]);
        }
    }
    
    /**
     * Assignation en masse
     */
    public function assignBulk(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'id_periode' => 'required|exists:periodes_evaluation,id_periode',
            'assignations' => 'required|array',
            'assignations.*.id_role' => 'required|exists:roles,id_role',
            'assignations.*.id_template' => 'required|exists:templates,id_template',
        ]);
        
        if ($validator->fails()) {
            return back()->withErrors($validator)->withInput();
        }
        
        try {
            $count = $this->assignationService->assignBulk(
                $request->id_periode,
                $request->assignations
            );
            
            return back()->with('success', "{$count} assignation(s) créée(s) avec succès");
        } catch (PeriodeNonModifiableException $e) {
            return back()->withErrors(['error' => $e->getMessage()]);
        } catch (\Exception $e) {
            return back()->withErrors(['error' => "Erreur lors de l'assignation en masse : {$e->getMessage()}"]);
        }
    }
}
