<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Models\Role;
use App\Models\EntiteOrganisationnelle;
use App\Services\IdGeneratorService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;

class UserController extends Controller
{
    protected $idGenerator;
    
    /**
     * Constructeur avec injection du service IdGenerator
     */
    public function __construct(IdGeneratorService $idGenerator)
    {
        $this->idGenerator = $idGenerator;
        $this->middleware('auth');
        $this->middleware('role:ADMIN')->except(['profile', 'updateProfile']);
    }
    
    /**
     * Afficher la liste des utilisateurs
     */
    public function index()
    {
        $users = User::with(['role', 'entite.region'])
            ->orderBy('nom')
            ->paginate(10);
            
        return Inertia::render('Users/Index', [
            'users' => $users
        ]);
    }
    
    /**
     * Afficher le formulaire de création d'un utilisateur
     */
    public function create()
    {
        $roles = Role::orderBy('niveau_hierarchique')->get();
        $entites = EntiteOrganisationnelle::with('region')->get();
        
        return Inertia::render('Users/Create', [
            'roles' => $roles,
            'entites' => $entites,
            'statuts' => ['actif', 'inactif', 'suspendu']
        ]);
    }
    
    /**
     * Enregistrer un nouvel utilisateur
     */
    public function store(Request $request)
    {
        // Valider les données avec les règles définies dans le modèle User
        $validator = Validator::make($request->all(), User::validationRules());
        
        if ($validator->fails()) {
            return redirect()->back()->withErrors($validator)->withInput();
        }
        
        // Récupérer le rôle et la région pour générer un matricule cohérent
        $role = Role::find($request->id_role);
        $entite = EntiteOrganisationnelle::with('region')->find($request->id_entite);
        
        // Générer un matricule unique si non fourni
        if (empty($request->matricule)) {
            $roleName = $role ? $role->nom_role : null;
            $regionName = $entite && $entite->region ? $entite->region->nom_region : null;
            $matricule = $this->idGenerator->generateUserMatricule($roleName, $regionName);
            $request->merge(['matricule' => $matricule]);
        }
        
        // Créer l'utilisateur
        $user = User::create([
            'matricule' => $request->matricule,
            'nom' => $request->nom,
            'prenom' => $request->prenom,
            'email' => $request->email,
            'telephone' => $request->telephone,
            'username' => $request->username,
            'password' => Hash::make($request->password),
            'id_role' => $request->id_role,
            'id_entite' => $request->id_entite,
            'statut' => $request->statut,
            'date_prise_poste' => $request->date_prise_poste,
        ]);
        
        return redirect()->route('users.index')
            ->with('success', 'Utilisateur créé avec succès.');
    }
    
    /**
     * Afficher les détails d'un utilisateur
     */
    public function show($id)
    {
        $user = User::with(['role', 'entite.region'])->findOrFail($id);
        
        return Inertia::render('Users/Show', [
            'user' => $user
        ]);
    }
    
    /**
     * Afficher le formulaire d'édition d'un utilisateur
     */
    public function edit($id)
    {
        $user = User::findOrFail($id);
        $roles = Role::orderBy('niveau_hierarchique')->get();
        $entites = EntiteOrganisationnelle::with('region')->get();
        
        return Inertia::render('Users/Edit', [
            'user' => $user,
            'roles' => $roles,
            'entites' => $entites,
            'statuts' => ['actif', 'inactif', 'suspendu']
        ]);
    }
    
    /**
     * Mettre à jour un utilisateur
     */
    public function update(Request $request, $id)
    {
        $user = User::findOrFail($id);
        
        // Règles de validation modifiées pour l'édition (ignorer l'unicité pour l'utilisateur actuel)
        $rules = [
            'nom' => 'required|string|max:100',
            'prenom' => 'required|string|max:100',
            'email' => 'required|email|max:255|unique:users,email,'.$id,
            'telephone' => 'required|string|max:20',
            'username' => 'required|string|max:50|unique:users,username,'.$id,
            'id_role' => 'required|exists:roles,id',
            'id_entite' => 'required|exists:entites_organisationnelles,id_entite',
            'statut' => 'required|in:actif,inactif,suspendu',
            'date_prise_poste' => 'required|date',
        ];
        
        // Ajouter la validation du mot de passe uniquement s'il est fourni
        if ($request->filled('password')) {
            $rules['password'] = 'string|min:8';
        }
        
        $validator = Validator::make($request->all(), $rules);
        
        if ($validator->fails()) {
            return redirect()->back()->withErrors($validator)->withInput();
        }
        
        // Préparer les données à mettre à jour
        $data = $request->only([
            'nom', 'prenom', 'email', 'telephone', 'username',
            'id_role', 'id_entite', 'statut', 'date_prise_poste'
        ]);
        
        // Mettre à jour le mot de passe si fourni
        if ($request->filled('password')) {
            $data['password'] = Hash::make($request->password);
        }
        
        // Mettre à jour l'utilisateur
        $user->update($data);
        
        return redirect()->route('users.index')
            ->with('success', 'Utilisateur mis à jour avec succès.');
    }
    
    /**
     * Supprimer un utilisateur
     */
    public function destroy($id)
    {
        $user = User::findOrFail($id);
        
        // Vérifier que l'utilisateur n'est pas l'administrateur principal
        if ($user->username === 'admin') {
            return redirect()->back()
                ->with('error', 'L\'administrateur principal ne peut pas être supprimé.');
        }
        
        $user->delete();
        
        return redirect()->route('users.index')
            ->with('success', 'Utilisateur supprimé avec succès.');
    }
    
    /**
     * Afficher le profil de l'utilisateur connecté
     */
    public function profile()
    {
        $user = auth()->user();
        
        return Inertia::render('Users/Profile', [
            'user' => $user->load(['role', 'entite.region'])
        ]);
    }
    
    /**
     * Mettre à jour le profil de l'utilisateur connecté
     */
    public function updateProfile(Request $request)
    {
        $user = auth()->user();
        
        // Règles de validation pour la mise à jour du profil
        $rules = [
            'nom' => 'required|string|max:100',
            'prenom' => 'required|string|max:100',
            'email' => 'required|email|max:255|unique:users,email,'.$user->id,
            'telephone' => 'required|string|max:20',
        ];
        
        // Ajouter la validation du mot de passe actuel et nouveau si fourni
        if ($request->filled('new_password')) {
            $rules['current_password'] = 'required|current_password';
            $rules['new_password'] = 'required|string|min:8|confirmed';
        }
        
        $validator = Validator::make($request->all(), $rules);
        
        if ($validator->fails()) {
            return redirect()->back()->withErrors($validator)->withInput();
        }
        
        // Préparer les données à mettre à jour
        $data = $request->only(['nom', 'prenom', 'email', 'telephone']);
        
        // Mettre à jour le mot de passe si fourni
        if ($request->filled('new_password')) {
            $data['password'] = Hash::make($request->new_password);
        }
        
        // Mettre à jour l'utilisateur
        $user->update($data);
        
        return redirect()->route('profile')
            ->with('success', 'Profil mis à jour avec succès.');
    }
}
