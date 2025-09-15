<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Inertia\Response as InertiaResponse;
use App\Models\Role;
use App\Models\Branche;
use App\Models\Utilisateur;
use App\Traits\FormatsUserData;

class RolesController extends Controller
{
    use FormatsUserData;

    /**
     * Affiche la liste des rôles
     */
    public function index(): InertiaResponse
    {
        $utilisateur = Auth::user();
        
        // Récupérer tous les rôles avec leurs branches
        $roles = Role::with('branche:id_branche,nom_branche')
            ->select('id_role', 'nom_role', 'description', 'id_branche', 'niveau_taniere', 'niveau_non_taniere', 
                    'peut_auto_evaluer', 'peut_evaluer_pairs', 'peut_evaluer_subordonnes', 'peut_cross_branch',
                    'role_principal_equivalent', 'peut_remplacer_roles', 'portee_geographique')
            ->orderBy('nom_role')
            ->get();

        // Statistiques
        $statistiques = [
            'total' => Role::count(),
            'commercial' => Role::whereHas('branche', function($q) { $q->where('nom_branche', 'Commercial'); })->count(),
            'marketing' => Role::whereHas('branche', function($q) { $q->where('nom_branche', 'Marketing'); })->count(),
            'admin' => Role::whereHas('branche', function($q) { $q->where('nom_branche', 'Admin'); })->count(),
            'support' => Role::whereNotNull('role_principal_equivalent')->count(),
        ];

        // Données de référence
        $branches = Branche::select('id_branche as id', 'nom_branche as nom', 'description')->get();

        return Inertia::render('Admin/Roles/Index', [
            'roles' => $roles,
            'statistiques' => $statistiques,
            'branches' => $branches,
            ...$this->getAdminPageData('Gestion des Rôles', [], $utilisateur),
        ]);
    }

    /**
     * Affiche le formulaire de création d'un rôle
     */
    public function create(): InertiaResponse
    {
        $utilisateur = Auth::user();
        
        $branches = Branche::select('id_branche as id', 'nom_branche as nom', 'description')->get();
        $rolesExistants = Role::select('nom_role as nom', 'description')->get();

        return Inertia::render('Admin/Roles/Create', [
            'branches' => $branches,
            'roles_existants' => $rolesExistants,
            ...$this->getAdminPageData('Créer un Rôle', [], $utilisateur),
        ]);
    }

    /**
     * Enregistre un nouveau rôle
     */
    public function store(Request $request): \Illuminate\Http\RedirectResponse
    {
        $request->validate([
            'nom_role' => 'required|string|max:50|unique:roles,nom_role',
            'description' => 'required|string|max:255',
            'id_branche' => 'required|exists:branches,id_branche',
            'niveau_taniere' => 'nullable|integer|min:1|max:5',
            'niveau_non_taniere' => 'nullable|integer|min:1|max:3',
            'peut_auto_evaluer' => 'boolean',
            'peut_evaluer_pairs' => 'boolean',
            'peut_evaluer_subordonnes' => 'boolean',
            'peut_cross_branch' => 'boolean',
            'role_principal_equivalent' => 'nullable|string|max:50',
            'peut_remplacer_roles' => 'nullable|string',
            'portee_geographique' => 'required|in:region,nationale',
        ]);

        Role::create($request->all());

        return redirect()->route('admin.roles.index')
            ->with('success', 'Rôle créé avec succès.');
    }

    /**
     * Affiche un rôle spécifique
     */
    public function show(Role $role): InertiaResponse
    {
        $utilisateur = Auth::user();
        
        $role->load('branche:id_branche,nom_branche');
        
        // Utilisateurs ayant ce rôle
        $utilisateursAvecRole = Utilisateur::where('role', $role->nom_role)
            ->select('matricule', 'nom', 'prenom', 'region_nom', 'est_actif')
            ->get();

        return Inertia::render('Admin/Roles/Show', [
            'role' => $role,
            'utilisateurs' => $utilisateursAvecRole,
            ...$this->getAdminPageData('Détails du Rôle', [], $utilisateur),
        ]);
    }

    /**
     * Affiche le formulaire d'édition d'un rôle
     */
    public function edit(Role $role): InertiaResponse
    {
        $utilisateur = Auth::user();
        
        $role->load('branche:id_branche,nom_branche');
        $branches = Branche::select('id_branche as id', 'nom_branche as nom', 'description')->get();

        return Inertia::render('Admin/Roles/Edit', [
            'role' => $role,
            'branches' => $branches,
            ...$this->getAdminPageData('Modifier le Rôle', [], $utilisateur),
        ]);
    }

    /**
     * Met à jour un rôle
     */
    public function update(Request $request, Role $role): \Illuminate\Http\RedirectResponse
    {
        $request->validate([
            'nom_role' => 'required|string|max:50|unique:roles,nom_role,' . $role->id_role . ',id_role',
            'description' => 'required|string|max:255',
            'id_branche' => 'required|exists:branches,id_branche',
            'niveau_taniere' => 'nullable|integer|min:1|max:5',
            'niveau_non_taniere' => 'nullable|integer|min:1|max:3',
            'peut_auto_evaluer' => 'boolean',
            'peut_evaluer_pairs' => 'boolean',
            'peut_evaluer_subordonnes' => 'boolean',
            'peut_cross_branch' => 'boolean',
            'role_principal_equivalent' => 'nullable|string|max:50',
            'peut_remplacer_roles' => 'nullable|string',
            'portee_geographique' => 'required|in:region,nationale',
        ]);

        $role->update($request->all());

        return redirect()->route('admin.roles.index')
            ->with('success', 'Rôle mis à jour avec succès.');
    }

    /**
     * Supprime un rôle (avec vérification des dépendances)
     */
    public function destroy(Role $role): \Illuminate\Http\RedirectResponse
    {
        // Vérifier si des utilisateurs utilisent ce rôle
        $utilisateursLies = Utilisateur::where('role', $role->nom_role)->count();
        
        if ($utilisateursLies > 0) {
            return back()->withErrors([
                'delete' => "Impossible de supprimer ce rôle. {$utilisateursLies} utilisateur(s) y sont liés."
            ]);
        }

        // Vérifier si ce rôle est référencé comme équivalent principal
        $rolesSupport = Role::where('role_principal_equivalent', $role->nom_role)->count();
        
        if ($rolesSupport > 0) {
            return back()->withErrors([
                'delete' => "Impossible de supprimer ce rôle. {$rolesSupport} rôle(s) support y font référence."
            ]);
        }

        $role->delete();

        return redirect()->route('admin.roles.index')
            ->with('success', 'Rôle supprimé avec succès.');
    }

    /**
     * Affiche les permissions d'évaluation
     */
    public function permissions(): InertiaResponse
    {
        $utilisateur = Auth::user();
        
        // Récupérer les règles d'évaluation
        $regles = \App\Models\RegleEvaluation::with([
            'roleEvaluateur:id_role,nom_role',
            'roleEvalue:id_role,nom_role'
        ])->get();

        $roles = Role::select('nom_role as nom', 'description')->get();

        return Inertia::render('Admin/Roles/Permissions', [
            'regles' => $regles,
            'roles' => $roles,
            ...$this->getAdminPageData('Permissions d\'Évaluation', [], $utilisateur),
        ]);
    }

    /**
     * Méthode privée pour obtenir les données de page admin
     */
    private function getAdminPageData(string $title, array $breadcrumbs, $user): array
    {
        return [
            'title' => $title,
            'breadcrumbs' => $breadcrumbs,
            'user' => $this->formatUserData($user),
        ];
    }
}
