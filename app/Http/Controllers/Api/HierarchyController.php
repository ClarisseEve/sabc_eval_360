<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\HierarchyService;
use App\Models\Utilisateur;
use App\Models\Region;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Auth;

class HierarchyController extends Controller
{
    protected HierarchyService $hierarchyService;

    public function __construct(HierarchyService $hierarchyService)
    {
        $this->hierarchyService = $hierarchyService;
    }

    /**
     * Récupère la hiérarchie complète d'une région
     */
    public function getHierarchieRegion(int $idRegion): JsonResponse
    {
        $utilisateur = Auth::user();
        
        // Vérifier les permissions d'accès à la région
        if (!$this->peutAccederRegion($utilisateur, $idRegion)) {
            return response()->json([
                'success' => false,
                'message' => 'Accès non autorisé à cette région'
            ], 403);
        }

        $hierarchie = $this->hierarchyService->getHierarchieRegion($idRegion);

        if (empty($hierarchie)) {
            return response()->json([
                'success' => false,
                'message' => 'Région introuvable'
            ], 404);
        }

        return response()->json([
            'success' => true,
            'data' => $hierarchie
        ]);
    }

    /**
     * Récupère les subordonnés directs d'un utilisateur
     */
    public function getSubordonnesDirects(Request $request): JsonResponse
    {
        $request->validate([
            'id_utilisateur' => 'nullable|integer|exists:utilisateurs,id_utilisateur',
        ]);

        $utilisateur = Auth::user();
        $idUtilisateur = $request->id_utilisateur ?? $utilisateur->id_utilisateur;

        // Vérifier les permissions
        if (!$this->peutVoirSubordonnes($utilisateur, $idUtilisateur)) {
            return response()->json([
                'success' => false,
                'message' => 'Accès non autorisé aux subordonnés de cet utilisateur'
            ], 403);
        }

        $subordonnes = $this->hierarchyService->getSubordonnesDirects($idUtilisateur);

        return response()->json([
            'success' => true,
            'data' => $subordonnes
        ]);
    }

    /**
     * Récupère tous les subordonnés (directs et indirects) d'un utilisateur
     */
    public function getTousSubordonnes(Request $request): JsonResponse
    {
        $request->validate([
            'id_utilisateur' => 'nullable|integer|exists:utilisateurs,id_utilisateur',
        ]);

        $utilisateur = Auth::user();
        $idUtilisateur = $request->id_utilisateur ?? $utilisateur->id_utilisateur;

        // Vérifier les permissions
        if (!$this->peutVoirSubordonnes($utilisateur, $idUtilisateur)) {
            return response()->json([
                'success' => false,
                'message' => 'Accès non autorisé aux subordonnés de cet utilisateur'
            ], 403);
        }

        $subordonnes = $this->hierarchyService->getTousSubordonnes($idUtilisateur);

        return response()->json([
            'success' => true,
            'data' => $subordonnes
        ]);
    }

    /**
     * Récupère la chaîne hiérarchique complète d'un utilisateur
     */
    public function getChaineHierarchique(Request $request): JsonResponse
    {
        $request->validate([
            'id_utilisateur' => 'nullable|integer|exists:utilisateurs,id_utilisateur',
        ]);

        $utilisateur = Auth::user();
        $idUtilisateur = $request->id_utilisateur ?? $utilisateur->id_utilisateur;

        // Vérifier les permissions
        if (!$this->peutVoirChaineHierarchique($utilisateur, $idUtilisateur)) {
            return response()->json([
                'success' => false,
                'message' => 'Accès non autorisé à la chaîne hiérarchique de cet utilisateur'
            ], 403);
        }

        $chaine = $this->hierarchyService->getChaineHierarchique($idUtilisateur);

        return response()->json([
            'success' => true,
            'data' => $chaine
        ]);
    }

    /**
     * Vérifie si un utilisateur peut superviser un autre utilisateur
     */
    public function verifierSupervision(Request $request): JsonResponse
    {
        $request->validate([
            'id_superviseur' => 'required|integer|exists:utilisateurs,id_utilisateur',
            'id_subordonne' => 'required|integer|exists:utilisateurs,id_utilisateur',
        ]);

        $utilisateur = Auth::user();

        // Seuls les DR et CDTT peuvent vérifier les supervisions
        if (!in_array($utilisateur->role->nom_role, ['DR', 'CDTT'])) {
            return response()->json([
                'success' => false,
                'message' => 'Vous n\'êtes pas autorisé à vérifier les supervisions'
            ], 403);
        }

        $peutSuperviser = $this->hierarchyService->peutSuperviser(
            $request->id_superviseur,
            $request->id_subordonne
        );

        return response()->json([
            'success' => true,
            'data' => [
                'peut_superviser' => $peutSuperviser,
                'id_superviseur' => $request->id_superviseur,
                'id_subordonne' => $request->id_subordonne,
            ]
        ]);
    }

    /**
     * Valide l'assignation d'un manager à un utilisateur
     */
    public function validerAssignationManager(Request $request): JsonResponse
    {
        $request->validate([
            'id_utilisateur' => 'required|integer|exists:utilisateurs,id_utilisateur',
            'id_manager' => 'required|integer|exists:utilisateurs,id_utilisateur',
        ]);

        $utilisateur = Auth::user();

        // Seuls les DR et CDTT peuvent valider les assignations
        if (!in_array($utilisateur->role->nom_role, ['DR', 'CDTT'])) {
            return response()->json([
                'success' => false,
                'message' => 'Vous n\'êtes pas autorisé à valider les assignations'
            ], 403);
        }

        $validation = $this->hierarchyService->validerAssignationManager(
            $request->id_utilisateur,
            $request->id_manager
        );

        return response()->json([
            'success' => $validation['valide'],
            'data' => $validation,
            'message' => $validation['valide'] ? 'Assignation valide' : 'Assignation invalide'
        ], $validation['valide'] ? 200 : 400);
    }

    /**
     * Assigne un manager à un utilisateur
     */
    public function assignerManager(Request $request): JsonResponse
    {
        $request->validate([
            'id_utilisateur' => 'required|integer|exists:utilisateurs,id_utilisateur',
            'id_manager' => 'required|integer|exists:utilisateurs,id_utilisateur',
        ]);

        $utilisateur = Auth::user();

        // Seuls les DR et CDTT peuvent assigner des managers
        if (!in_array($utilisateur->role->nom_role, ['DR', 'CDTT'])) {
            return response()->json([
                'success' => false,
                'message' => 'Vous n\'êtes pas autorisé à assigner des managers'
            ], 403);
        }

        // Valider l'assignation
        $validation = $this->hierarchyService->validerAssignationManager(
            $request->id_utilisateur,
            $request->id_manager
        );

        if (!$validation['valide']) {
            return response()->json([
                'success' => false,
                'message' => 'Assignation invalide',
                'erreurs' => $validation['erreurs']
            ], 400);
        }

        // Effectuer l'assignation
        $utilisateurCible = Utilisateur::where('matricule', $request->id_utilisateur)->first();
        if (!$utilisateurCible) {
            return response()->json(['success' => false, 'message' => 'Utilisateur introuvable'], 404);
        }
        $ancienManager = $utilisateurCible->manager_matricule;

        $utilisateurCible->update([
            'manager_matricule' => $request->id_manager,
        ]);

        \App\Models\LogAdministration::enregistrerAction(
            $utilisateur->matricule,
            'assignation_manager',
            'utilisateurs',
            $utilisateurCible->matricule,
            ['manager_matricule' => $ancienManager],
            ['manager_matricule' => $request->id_manager]
        );

        return response()->json([
            'success' => true,
            'message' => 'Manager assigné avec succès',
            'data' => $utilisateurCible->fresh()->load(['manager', 'role'])
        ]);
    }

    /**
     * Récupère les utilisateurs éligibles pour être managers
     */
    public function getManagersEligibles(int $idUtilisateur): JsonResponse
    {
        $utilisateur = Auth::user();

        // Seuls les DR et CDTT peuvent voir les managers éligibles
        if (!in_array($utilisateur->role->nom_role, ['DR', 'CDTT'])) {
            return response()->json([
                'success' => false,
                'message' => 'Vous n\'êtes pas autorisé à voir les managers éligibles'
            ], 403);
        }

        $utilisateurCible = Utilisateur::with(['role', 'region'])->find($idUtilisateur);
        
        if (!$utilisateurCible) {
            return response()->json([
                'success' => false,
                'message' => 'Utilisateur introuvable'
            ], 404);
        }

        // Récupérer tous les utilisateurs de la même région avec un niveau supérieur
        $managersEligibles = Utilisateur::where('id_region', $utilisateurCible->id_region)
            ->where('id_utilisateur', '!=', $idUtilisateur)
            ->with(['role'])
            ->get()
            ->filter(function ($manager) use ($utilisateurCible) {
                return $this->hierarchyService->peutSuperviser($manager->id_utilisateur, $idUtilisateur);
            });

        return response()->json([
            'success' => true,
            'data' => $managersEligibles->values()
        ]);
    }

    /**
     * Récupère les statistiques hiérarchiques d'une région
     */
    public function getStatistiquesRegion(int $idRegion): JsonResponse
    {
        $utilisateur = Auth::user();

        // Vérifier les permissions d'accès à la région
        if (!$this->peutAccederRegion($utilisateur, $idRegion)) {
            return response()->json([
                'success' => false,
                'message' => 'Accès non autorisé à cette région'
            ], 403);
        }

        $region = Region::with(['utilisateurs.role'])->find($idRegion);
        
        if (!$region) {
            return response()->json([
                'success' => false,
                'message' => 'Région introuvable'
            ], 404);
        }

        $utilisateursParRole = $region->utilisateurs->groupBy('role.nom_role');
        $utilisateursParNiveau = $region->utilisateurs->groupBy(function ($user) use ($region) {
            return $user->role->getNiveauHierarchique($region->est_taniere);
        });

        $statistiques = [
            'region' => [
                'id' => $region->id_region,
                'nom' => $region->nom_region,
                'est_taniere' => $region->est_taniere,
            ],
            'total_utilisateurs' => $region->utilisateurs->count(),
            'repartition_par_role' => $utilisateursParRole->map->count(),
            'repartition_par_niveau' => $utilisateursParNiveau->map->count(),
            'utilisateurs_sans_manager' => $region->utilisateurs->where('manager_matricule', null)->count(),
        ];

        return response()->json([
            'success' => true,
            'data' => $statistiques
        ]);
    }

    /**
     * Vérifie si un utilisateur peut accéder aux données d'une région
     */
    private function peutAccederRegion($utilisateur, int $idRegion): bool
    {
        // L'utilisateur peut accéder à sa propre région
        if ($utilisateur->id_region === $idRegion) {
            return true;
        }

        // Les DR et CDTT peuvent accéder à toutes les régions (pour les rapports)
        if (in_array($utilisateur->role->nom_role, ['DR', 'CDTT'])) {
            return true;
        }

        return false;
    }

    /**
     * Vérifie si un utilisateur peut voir les subordonnés d'un autre utilisateur
     */
    private function peutVoirSubordonnes($utilisateur, int $idUtilisateur): bool
    {
        // L'utilisateur peut voir ses propres subordonnés
        if ($utilisateur->id_utilisateur === $idUtilisateur) {
            return true;
        }

        // Un manager peut voir les subordonnés de ses subordonnés
        if ($this->hierarchyService->peutSuperviser($utilisateur->id_utilisateur, $idUtilisateur)) {
            return true;
        }

        // Les DR et CDTT peuvent voir tous les subordonnés de leur région
        $utilisateurCible = Utilisateur::find($idUtilisateur);
        if ($utilisateurCible && 
            in_array($utilisateur->role->nom_role, ['DR', 'CDTT']) && 
            $utilisateur->id_region === $utilisateurCible->id_region) {
            return true;
        }

        return false;
    }

    /**
     * Vérifie si un utilisateur peut voir la chaîne hiérarchique d'un autre utilisateur
     */
    private function peutVoirChaineHierarchique($utilisateur, int $idUtilisateur): bool
    {
        // L'utilisateur peut voir sa propre chaîne
        if ($utilisateur->id_utilisateur === $idUtilisateur) {
            return true;
        }

        // Un manager peut voir la chaîne de ses subordonnés
        if ($this->hierarchyService->peutSuperviser($utilisateur->id_utilisateur, $idUtilisateur)) {
            return true;
        }

        // Les DR et CDTT peuvent voir toutes les chaînes de leur région
        $utilisateurCible = Utilisateur::find($idUtilisateur);
        if ($utilisateurCible && 
            in_array($utilisateur->role->nom_role, ['DR', 'CDTT']) && 
            $utilisateur->id_region === $utilisateurCible->id_region) {
            return true;
        }

        return false;
    }
}