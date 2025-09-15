<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Role;
use App\Models\Utilisateur;
use App\Traits\FormatsUserData;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response as InertiaResponse;

class RolesController extends Controller
{
    use FormatsUserData;

    public function __construct()
    {
        // Middleware applied at route level
    }

    /**
     * Affiche la liste des rôles avec statistiques
     */
    public function index(): InertiaResponse
    {
        $roles = Role::withCount('utilisateurs')
            ->orderBy('niveau_taniere')
            ->orderBy('niveau_non_taniere')
            ->get()
            ->map(function ($role) {
                return [
                    'id_role' => $role->id_role,
                    'nom_role' => $role->nom_role,
                    'description' => $role->description,
                    'niveau_taniere' => $role->niveau_taniere,
                    'niveau_non_taniere' => $role->niveau_non_taniere,
                    'peut_auto_evaluer' => $role->peut_auto_evaluer,
                    'peut_evaluer_pairs' => $role->peut_evaluer_pairs,
                    'peut_evaluer_subordonnes' => $role->peut_evaluer_subalternes,
                    'peut_cross_branch' => $role->peut_cross_branch,
                    'utilisateurs_count' => $role->utilisateurs_count,
                ];
            });

        $statistics = [
            'total_roles' => $roles->count(),
            'roles_avec_utilisateurs' => $roles->where('utilisateurs_count', '>', 0)->count(),
            'roles_management' => $roles->whereIn('nom_role', ['DR', 'CDTT', 'CSC', 'RTM', 'CDV', 'SRMO'])->count(),
            'roles_operationnels' => $roles->whereIn('nom_role', ['CDS', 'TMO', 'AS'])->count(),
        ];

        return Inertia::render('Admin/Roles/index', [
            'roles' => $roles,
            'statistics' => $statistics,
            'pageTitle' => 'Gestion des Rôles'
        ]);
    }

    /**
     * Affiche la matrice des permissions des rôles selon les règles SABC
     */
    public function permissions(): InertiaResponse
    {
        // Récupération des rôles selon les règles SABC
        $roles = Role::withCount('utilisateurs')
            ->orderBy('niveau_taniere')
            ->orderBy('niveau_non_taniere')
            ->get()
            ->map(function ($role) {
                return [
                    'id_role' => $role->id_role,
                    'nom_role' => $role->nom_role,
                    'description' => $role->description,
                    'niveau_taniere' => $role->niveau_taniere,
                    'niveau_non_taniere' => $role->niveau_non_taniere,
                    'peut_auto_evaluer' => $role->peut_auto_evaluer,
                    'peut_evaluer_pairs' => $role->peut_evaluer_pairs,
                    'peut_evaluer_subordonnes' => $role->peut_evaluer_subalternes,
                    'peut_cross_branch' => $role->peut_cross_branch,
                    'permissions' => $this->getPermissionsForRole($role),
                ];
            });

        // Récupération des règles d'évaluation depuis PostgreSQL (structure actuelle)
        $regles_evaluation = \DB::connection('pgsql')->table('regles_evaluation')
            ->select('id_regle', 'nom_regle', 'description', 'criteres_evaluation_json', 'est_active')
            ->where('est_active', true)
            ->orderBy('nom_regle')
            ->get()
            ->map(function ($regle) {
                // Adaptation aux champs disponibles dans la structure actuelle
                return [
                    'id_regle' => $regle->id_regle,
                    'nom_regle' => $regle->nom_regle ?? 'Règle d\'évaluation',
                    'description' => $regle->description ?? 'Description non définie',
                    'criteres_evaluation_json' => json_decode($regle->criteres_evaluation_json, true) ?? $this->getDefaultCriteres(),
                    'est_active' => $regle->est_active,
                    'type_evaluation' => 'auto', // Valeur par défaut selon règles SABC
                    'roles_autorises' => ['DR', 'CDTT', 'CSC'], // Valeurs par défaut selon hiérarchie SABC
                ];
            });

        return Inertia::render('Admin/Roles/permissions', [
            ...$this->getAdminPageData('Rôles et Permissions'),
            'roles' => $roles,
            'regles_evaluation' => $regles_evaluation,
        ]);
    }

    /**
     * Détermine le niveau hiérarchique selon les règles SABC
     */
    private function getNiveauHierarchique(Role $role): string
    {
        $nom = $role->nom_role;
        
        if ($nom === 'ADMIN') return 'Global';
        if (in_array($nom, ['DR', 'CDTT', 'RTM', 'SRMO'])) return 'Région';
        if (in_array($nom, ['CSC', 'TMO'])) return 'Service';
        if ($nom === 'CDV') return 'District';
        if (in_array($nom, ['CDS', 'AS'])) return 'Secteur';
        
        return 'Non défini';
    }

    /**
     * Retourne les permissions spécifiques à un rôle selon les règles SABC
     */
    private function getPermissionsForRole(Role $role): array
    {
        $permissions = [];
        $nom = $role->nom_role;

        // Permissions selon les règles métier SABC
        switch ($nom) {
            case 'ADMIN':
                $permissions = [
                    ['nom' => 'Gestion Utilisateurs', 'type' => 'administration', 'critique' => true],
                    ['nom' => 'Gestion Rôles', 'type' => 'administration', 'critique' => true],
                    ['nom' => 'Analytics Globales', 'type' => 'lecture', 'critique' => false],
                ];
                break;
                
            case 'DR':
                $permissions = [
                    ['nom' => 'Évaluation Subordonnés', 'type' => 'ecriture', 'critique' => false],
                    ['nom' => 'Rapports Régionaux', 'type' => 'lecture', 'critique' => false],
                    ['nom' => 'Gestion Remplacements', 'type' => 'ecriture', 'critique' => false],
                ];
                break;
                
            case 'CDTT':
                $permissions = [
                    ['nom' => 'Évaluation Inter-branches', 'type' => 'ecriture', 'critique' => false],
                    ['nom' => 'Supervision Trade', 'type' => 'lecture', 'critique' => false],
                ];
                break;
                
            case 'CSC':
            case 'RTM':
            case 'CDV':
            case 'TMO':
                $permissions = [
                    ['nom' => 'Auto-évaluation', 'type' => 'ecriture', 'critique' => false],
                    ['nom' => 'Évaluation Pairs', 'type' => 'ecriture', 'critique' => false],
                    ['nom' => 'Évaluation Subordonnés', 'type' => 'ecriture', 'critique' => false],
                ];
                break;
                
            case 'CDS':
            case 'AS':
                $permissions = [
                    ['nom' => 'Auto-évaluation', 'type' => 'ecriture', 'critique' => false],
                    ['nom' => 'Évaluation Pairs', 'type' => 'ecriture', 'critique' => false],
                    ['nom' => 'Consultation Performance', 'type' => 'lecture', 'critique' => false],
                ];
                break;
                
            case 'SRMO':
                $permissions = [
                    ['nom' => 'Auto-évaluation', 'type' => 'ecriture', 'critique' => false],
                    ['nom' => 'Évaluation Subordonnés Marketing', 'type' => 'ecriture', 'critique' => false],
                    ['nom' => 'Rapports Marketing', 'type' => 'lecture', 'critique' => false],
                ];
                break;
        }

        return $permissions;
    }

    /**
     * Affiche le formulaire de création d'un rôle
     */
    public function create(): InertiaResponse
    {
        return Inertia::render('admin/roles/create');
    }

    /**
     * Stocke un nouveau rôle
     */
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'nom_role' => 'required|string|max:50|unique:roles,nom_role',
            'description' => 'required|string|max:255',
            'niveau_hierarchique' => 'required|integer|min:0|max:5',
            'peut_auto_evaluer' => 'boolean',
            'peut_evaluer_pairs' => 'boolean',
            'peut_evaluer_subordonnes' => 'boolean',
            'peut_cross_branch' => 'boolean',
        ]);

        if ($validator->fails()) {
            return back()->withErrors($validator)->withInput();
        }

        // Règles métier SABC : DR et CDTT ne peuvent pas s'auto-évaluer
        $data = $validator->validated();
        if (in_array($data['nom_role'], ['DR', 'CDTT'])) {
            $data['peut_auto_evaluer'] = false;
            $data['peut_evaluer_pairs'] = false;
            $data['peut_cross_branch'] = true;
        }

        Role::create($data);

        return redirect()->route('admin.roles.index')
            ->with('success', 'Rôle créé avec succès.');
    }

    /**
     * Affiche les détails d'un rôle
     */
    public function show(string $id): InertiaResponse
    {
        $role = Role::with(['utilisateurs.region', 'utilisateurs.branche'])
            ->findOrFail($id);

        return Inertia::render('admin/roles/show', [
            'role' => $role,
        ]);
    }

    /**
     * Affiche le formulaire d'édition d'un rôle
     */
    public function edit(string $id): InertiaResponse
    {
        $role = Role::findOrFail($id);

        return Inertia::render('admin/roles/edit', [
            'role' => $role,
        ]);
    }

    /**
     * Met à jour un rôle
     */
    public function update(Request $request, string $id)
    {
        $role = Role::findOrFail($id);

        $validator = Validator::make($request->all(), [
            'nom_role' => 'required|string|max:50|unique:roles,nom_role,' . $id . ',id_role',
            'description' => 'required|string|max:255',
            'niveau_hierarchique' => 'required|integer|min:0|max:5',
            'peut_auto_evaluer' => 'boolean',
            'peut_evaluer_pairs' => 'boolean',
            'peut_evaluer_subordonnes' => 'boolean',
            'peut_cross_branch' => 'boolean',
        ]);

        if ($validator->fails()) {
            return back()->withErrors($validator)->withInput();
        }

        // Règles métier SABC : DR et CDTT ne peuvent pas s'auto-évaluer
        $data = $validator->validated();
        if (in_array($data['nom_role'], ['DR', 'CDTT'])) {
            $data['peut_auto_evaluer'] = false;
            $data['peut_evaluer_pairs'] = false;
            $data['peut_cross_branch'] = true;
        }

        $role->update($data);

        return redirect()->route('admin.roles.index')
            ->with('success', 'Rôle mis à jour avec succès.');
    }

    /**
     * Supprime un rôle (avec vérification des dépendances)
     */
    public function destroy(string $id)
    {
        $role = Role::findOrFail($id);

        // Vérification des dépendances selon règles SABC
        $utilisateursCount = Utilisateur::where('id_role', $id)->count();
        
        if ($utilisateursCount > 0) {
            return back()->withErrors([
                'delete' => "Impossible de supprimer ce rôle. {$utilisateursCount} utilisateur(s) y sont encore affecté(s)."
            ]);
        }

        // Empêcher la suppression des rôles système SABC
        $rolesSysteme = ['ADMIN', 'DR', 'CDTT', 'CSC', 'RTM', 'CDV', 'CDS', 'TMO', 'SRMO', 'SS', 'AS'];
        if (in_array($role->nom_role, $rolesSysteme)) {
            return back()->withErrors([
                'delete' => 'Impossible de supprimer un rôle système SABC.'
            ]);
        }

        $role->delete();

        return redirect()->route('admin.roles.index')
            ->with('success', 'Rôle supprimé avec succès.');
    }

    /**
     * Affiche le formulaire de création d'une règle d'évaluation
     */
    public function createRule(): InertiaResponse
    {
        $roles = Role::select('id_role', 'nom_role', 'description')
            ->orderBy('nom_role')
            ->get();

        return Inertia::render('Admin/Roles/CreateRule', [
            ...$this->getAdminPageData('Créer une Règle d\'Évaluation'),
            'roles' => $roles,
        ]);
    }

    /**
     * Enregistre une nouvelle règle d'évaluation selon les règles SABC
     * Adapté à la structure actuelle de la base de données
     */
    public function storeRule(Request $request)
    {
        $validated = $request->validate([
            'nom_regle' => 'required|string|max:255',
            'description' => 'required|string',
            'type_evaluation' => 'required|string|in:auto,pairs,descendante,ascendante',
            'criteres_evaluation_json' => 'required|array|min:5',
            'roles_autorises' => 'required|array|min:1',
            'est_active' => 'boolean',
        ]);

        // Génération d'un UUID pour la structure actuelle
        $uuid = \Str::uuid();

        // Insertion dans PostgreSQL (structure actuelle)
        \DB::connection('pgsql')->table('regles_evaluation')->insert([
            'id_regle' => $uuid,
            'nom_regle' => $validated['nom_regle'],
            'description' => $validated['description'],
            'criteres_evaluation_json' => json_encode($validated['criteres_evaluation_json']),
            'est_active' => $validated['est_active'] ?? true,
            'date_debut' => now()->toDateString(),
            'date_fin' => null,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        return redirect()->route('admin.roles.permissions')
            ->with('success', 'Règle d\'évaluation créée avec succès.');
    }

    /**
     * Met à jour une règle d'évaluation existante
     * Adapté à la structure actuelle de la base de données
     */
    public function updateRule(Request $request)
    {
        $validated = $request->validate([
            'id_regle' => 'required|string',
            'nom_regle' => 'required|string|max:255',
            'description' => 'required|string',
            'type_evaluation' => 'required|string|in:auto,pairs,descendante,ascendante',
            'criteres_evaluation_json' => 'required|array|min:5',
            'roles_autorises' => 'required|array|min:1',
            'est_active' => 'boolean',
        ]);

        // Mise à jour dans PostgreSQL (structure actuelle)
        \DB::connection('pgsql')->table('regles_evaluation')
            ->where('id_regle', $validated['id_regle'])
            ->update([
                'nom_regle' => $validated['nom_regle'],
                'description' => $validated['description'],
                'criteres_evaluation_json' => json_encode($validated['criteres_evaluation_json']),
                'est_active' => $validated['est_active'] ?? true,
                'updated_at' => now(),
            ]);

        return redirect()->route('admin.roles.permissions')
            ->with('success', 'Règle d\'évaluation mise à jour avec succès.');
    }

    /**
     * Retourne les critères d'évaluation par défaut selon les règles SABC
     */
    private function getDefaultCriteres(): array
    {
        return [
            [
                'nom' => 'Performance Commerciale',
                'description' => 'Atteinte des objectifs de vente et performance commerciale',
                'poids' => 25,
                'ordre' => 1
            ],
            [
                'nom' => 'Leadership',
                'description' => 'Capacité à diriger et motiver une équipe',
                'poids' => 20,
                'ordre' => 2
            ],
            [
                'nom' => 'Communication',
                'description' => 'Qualité de la communication interne et externe',
                'poids' => 15,
                'ordre' => 3
            ],
            [
                'nom' => 'Innovation',
                'description' => 'Capacité d\'innovation et d\'amélioration continue',
                'poids' => 20,
                'ordre' => 4
            ],
            [
                'nom' => 'Respect des Procédures SABC',
                'description' => 'Conformité aux processus et standards SABC',
                'poids' => 20,
                'ordre' => 5
            ]
        ];
    }

    /**
     * Récupère les rôles autorisés pour une règle d'évaluation
     */
    private function getRolesAutorisesForRegle(string $idRegle): array
    {
        // Selon les règles métier SABC, définir les rôles autorisés par défaut
        $rolesParDefaut = [
            'DR' => ['DR', 'CDTT', 'CSC', 'RTM', 'CDV', 'CDS', 'TMO', 'SRMO', 'AS'],
            'CDTT' => ['CDTT', 'CSC', 'RTM', 'CDV', 'CDS', 'TMO', 'AS'],
            'CSC' => ['CSC', 'CDV', 'CDS'],
            'RTM' => ['RTM', 'TMO', 'AS'],
            'CDV' => ['CDV', 'CDS'],
            'TMO' => ['TMO'],
            'CDS' => ['CDS'],
            'SRMO' => ['SRMO', 'TMO'],
            'AS' => ['AS'],
        ];

        // Pour cette implémentation, retourner tous les rôles sauf ADMIN
        return ['DR', 'CDTT', 'CSC', 'RTM', 'CDV', 'CDS', 'TMO', 'SRMO', 'AS'];
    }
}
