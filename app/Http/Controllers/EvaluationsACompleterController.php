<?php

namespace App\Http\Controllers;

use App\Services\EvaluationService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Inertia\Response as InertiaResponse;
use Inertia\Response;
use App\Traits\FormatsUserData;

class EvaluationsACompleterController extends Controller
{
    use FormatsUserData;
    protected $evaluationService;

    public function __construct(EvaluationService $evaluationService)
    {
        $this->evaluationService = $evaluationService;
    }

    /**
     * Affiche les évaluations à compléter selon le rôle de l'utilisateur
     */
    public function index(): InertiaResponse
    {
        $utilisateur = Auth::user();
        
        // Récupérer les évaluations à compléter selon les règles SABC
        $evaluationsACompleter = $this->evaluationService->getEvaluationsACompleter($utilisateur);
        
        // Organiser par type d'évaluation
        $evaluationsParType = [
            'auto' => [],
            'pairs' => [],
            'descendante' => [],
            'ascendante' => []
        ];
        
        foreach ($evaluationsACompleter as $evaluation) {
            $type = $evaluation['type'];
            if (isset($evaluationsParType[$type])) {
                $evaluationsParType[$type][] = $evaluation;
            }
        }
        
        // Statistiques pour le dashboard
        $statistiques = [
            'total_a_faire' => count(array_filter($evaluationsACompleter, fn($e) => $e['statut'] === 'a_faire')),
            'total_a_terminer' => count(array_filter($evaluationsACompleter, fn($e) => $e['statut'] === 'a_terminer')),
            'total_general' => count($evaluationsACompleter),
        ];
        
        return Inertia::render('Common/Evaluations/Pending', [
            'evaluations' => $evaluationsParType,
            'statistiques' => $statistiques,
            'role_permissions' => $this->getRolePermissions($utilisateur->role_nom),
            ...$this->getPageData('Évaluations à Compléter', [], $utilisateur),
        ]);
    }
    
    /**
     * Récupère les permissions d'évaluation pour un rôle
     */
    private function getRolePermissions(string $role): array
    {
        $permissions = \App\Models\EvaluationPermission::getPermissionsPourRole($role);
        
        return [
            'peut_auto_evaluer' => $permissions->contains('type_evaluation', 'auto'),
            'peut_evaluer_pairs' => $permissions->contains('type_evaluation', 'pairs'),
            'peut_evaluer_subordonnes' => $permissions->contains('type_evaluation', 'descendante'),
            'peut_evaluer_superieurs' => $permissions->contains('type_evaluation', 'ascendante'),
        ];
    }
}
