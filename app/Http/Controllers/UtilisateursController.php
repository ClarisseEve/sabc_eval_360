<?php

namespace App\Http\Controllers;

use App\Models\Utilisateur;
use App\Models\Region;
use App\Models\Branche;
use App\Models\Role;
use App\Models\Evaluation;
use App\Services\EvaluationService;
use App\Traits\FormatsUserData;
use Illuminate\Http\Request;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Collection;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response as InertiaResponse;

class UtilisateursController extends Controller
{
    use FormatsUserData;
    
    protected $evaluationService;

    public function __construct(EvaluationService $evaluationService)
    {
        $this->evaluationService = $evaluationService;
    }

    /**
     * Affiche la liste des utilisateurs avec vue hiérarchique (ADMIN uniquement)
     */
    public function index(Request $request): InertiaResponse
    {
        $utilisateur = Auth::user();
        
        $this->assertAdmin($utilisateur);
        
        // Récupérer tous les utilisateurs avec leurs relations
        $utilisateurs = Utilisateur::with(['regionEntity', 'branche', 'roleModel'])
            ->orderBy('nom')
            ->orderBy('prenom')
            ->get()
            ->map(function ($user) {
                return [
                    'matricule' => $user->matricule,
                    'nom' => $user->nom,
                    'prenom' => $user->prenom,
                    'email' => $user->email,
                    'telephone' => $user->telephone,
                    'role' => $user->role,
                    'region_nom' => $user->regionEntity?->nom_region ?? 'Non définie',
                    'branche_nom' => $user->branche?->nom_branche ?? 'Non définie',
                    'manager_matricule' => $user->manager_matricule,
                    'manager_nom' => $user->manager ? "{$user->manager->prenom} {$user->manager->nom}" : null,
                    'statut' => $user->statut ?? 'actif',
                    'niveau_hierarchique' => $user->niveau_hierarchique ?? 1,
                    'date_creation' => $user->created_at?->format('Y-m-d H:i:s'),
                    'derniere_connexion' => $user->last_login_at?->format('Y-m-d H:i:s'),
                ];
            });

        // Calculer les statistiques
        $totalUtilisateurs = $utilisateurs->count();
        $actifs = $utilisateurs->where('statut', 'actif')->count();
        $inactifs = $utilisateurs->where('statut', 'inactif')->count();
        $avecGaps = 0; // À calculer selon la logique métier

        $statistiques = [
            'total_utilisateurs' => $totalUtilisateurs,
            'actifs' => $actifs,
            'inactifs' => $inactifs,
            'avec_gaps' => $avecGaps,
        ];

        // Récupérer les données de référence pour les filtres
        $regions = Region::select('id_region as id', 'nom_region as nom')
            ->orderBy('nom_region')
            ->get()
            ->toArray();

        $roles = Role::select('nom_role as nom', 'description as libelle')
            ->orderBy('nom_role')
            ->get()
            ->toArray();

        $branches = Branche::select('id_branche as id', 'nom_branche as nom')
            ->orderBy('nom_branche')
            ->get()
            ->toArray();

        // Construire la hiérarchie (version simplifiée)
        $hierarchie = $this->construireHierarchie($utilisateurs);
        
        return Inertia::render('Admin/Utilisateurs/Index', [
            'utilisateurs' => $utilisateurs->toArray(),
            'hierarchie' => $hierarchie,
            'regions' => $regions,
            'roles' => $roles,
            'branches' => $branches,
            'statistiques' => $statistiques,
            ...$this->getAdminPageData('Gestion des Utilisateurs', [], $utilisateur),
        ]);
    }
    
    /**
     * Affiche les détails d'un utilisateur avec gap analysis (ADMIN uniquement)
     */
    public function show(string $matricule): InertiaResponse
    {
        $utilisateur = Auth::user();
        
        $this->assertAdmin($utilisateur);
        
        $utilisateurCible = Utilisateur::where('matricule', $matricule)->firstOrFail();
        $region = $utilisateurCible->regionEntity;
        $branche = $utilisateurCible->branche;
        $manager = $utilisateurCible->manager;
        
        return Inertia::render('Admin/Utilisateurs/Show', [
            'user' => [
                'id' => $utilisateurCible->matricule,
                'name' => trim($utilisateurCible->prenom . ' ' . $utilisateurCible->nom),
                'username' => $utilisateurCible->matricule,
                'matricule' => $utilisateurCible->matricule,
                'email' => $utilisateurCible->email,
                'phone' => $utilisateurCible->telephone,
                'role' => $utilisateurCible->role_nom ?? $utilisateurCible->role,
                'region' => $region?->nom_region ?? 'Non définie',
                'branche' => $branche?->nom_branche ?? 'Non définie',
                'manager' => $manager ? trim($manager->prenom . ' ' . $manager->nom) : 'Non défini',
                'manager_matricule' => $utilisateurCible->manager_matricule,
                'date_embauche' => $utilisateurCible->created_at?->format('Y-m-d'),
                'niveau_hierarchique' => $utilisateurCible->niveau_hierarchique ?? 0,
                'status' => $utilisateurCible->statut ?? ($utilisateurCible->est_actif ? 'actif' : 'inactif'),
                'derniere_connexion' => $utilisateurCible->last_login_at?->format('Y-m-d H:i:s'),
                'evaluations_recues' => 0,
                'evaluations_donnees' => 0,
                'score_moyen' => $utilisateurCible->score_global ?? 0,
            ],
            ...$this->getAdminPageData('Détails Utilisateur', [], $utilisateur),
        ]);
    }
    
    /**
     * Affiche le formulaire de création d'un nouvel utilisateur
     */
    public function create(): InertiaResponse
    {
        $utilisateur = Auth::user();
        
        $this->assertAdmin($utilisateur);
        
        // Récupérer les données nécessaires pour le formulaire
        $regions = Region::select('id_region', 'nom_region')->orderBy('nom_region')->get();
        $branches = Branche::select('id_branche', 'nom_branche')->orderBy('nom_branche')->get();
        $roles = Role::select('nom_role', 'description')->orderBy('nom_role')->get();
        
        return Inertia::render('Admin/Utilisateurs/Create', [
            'regions' => $regions,
            'branches' => $branches,
            'roles' => $roles,
            ...$this->getAdminPageData('Créer un Utilisateur', [], $utilisateur),
        ]);
    }

    /**
     * Enregistre un nouvel utilisateur (ADMIN uniquement)
     */
    public function store(Request $request): RedirectResponse
    {
        $utilisateur = Auth::user();
        $this->assertAdmin($utilisateur);

        $validated = $request->validate([
            'matricule' => ['required', 'string', 'max:5', 'unique:utilisateurs,matricule'],
            'nom' => ['required', 'string', 'max:100'],
            'prenom' => ['required', 'string', 'max:100'],
            'email' => ['required', 'email', 'max:100', 'unique:utilisateurs,email'],
            'telephone' => ['nullable', 'string', 'max:20'],
            'role' => ['required', 'string', 'max:50'],
            'region' => ['required', 'string', 'max:5'],
            'branche' => ['required', 'string', 'max:5'],
            'manager_matricule' => ['nullable', 'string', 'max:5'],
            'password' => ['required', 'string', 'min:8', 'confirmed'],
            'is_active' => ['nullable', 'boolean'],
        ]);

        $region = Region::where('id_region', $validated['region'])->first();
        $branche = Branche::where('id_branche', $validated['branche'])->first();
        $role = Role::where('nom_role', $validated['role'])->first();

        $nouvelUtilisateur = new Utilisateur();
        $nouvelUtilisateur->matricule = $validated['matricule'];
        $nouvelUtilisateur->nom = $validated['nom'];
        $nouvelUtilisateur->prenom = $validated['prenom'];
        $nouvelUtilisateur->email = $validated['email'];
        $nouvelUtilisateur->telephone = $validated['telephone'] ?? null;
        $nouvelUtilisateur->password = Hash::make($validated['password']);
        $nouvelUtilisateur->role = $validated['role'];
        $nouvelUtilisateur->role_nom = $role?->nom_role ?? $validated['role'];
        $nouvelUtilisateur->manager_matricule = $validated['manager_matricule'] ?? null;
        $nouvelUtilisateur->id_region = $validated['region'];
        $nouvelUtilisateur->id_branche = $validated['branche'];
        $nouvelUtilisateur->region_nom = $region?->nom_region ?? 'Non définie';
        $nouvelUtilisateur->type_region = $region?->est_taniere ? 'Tanière' : 'Non-Tanière';
        $nouvelUtilisateur->est_actif = $validated['is_active'] ?? true;
        $nouvelUtilisateur->statut = $nouvelUtilisateur->est_actif ? 'actif' : 'inactif';
        $nouvelUtilisateur->est_admin = strtoupper($nouvelUtilisateur->role) === 'ADMIN';
        $nouvelUtilisateur->save();

        return redirect()->route('admin.utilisateurs.show', ['matricule' => $nouvelUtilisateur->matricule]);
    }

    /**
     * Affiche le formulaire d'édition d'un utilisateur
     */
    public function edit(string $matricule): InertiaResponse
    {
        $utilisateur = Auth::user();
        $this->assertAdmin($utilisateur);

        $utilisateurCible = Utilisateur::where('matricule', $matricule)->firstOrFail();

        return Inertia::render('Admin/Utilisateurs/Edit', [
            'user' => [
                'id' => $utilisateurCible->matricule,
                'nom' => $utilisateurCible->nom,
                'prenom' => $utilisateurCible->prenom,
                'matricule' => $utilisateurCible->matricule,
                'username' => $utilisateurCible->matricule,
                'email' => $utilisateurCible->email,
                'telephone' => $utilisateurCible->telephone,
                'role' => $utilisateurCible->role,
                'region' => $utilisateurCible->id_region,
                'branche' => $utilisateurCible->id_branche,
                'manager_matricule' => $utilisateurCible->manager_matricule,
                'date_embauche' => $utilisateurCible->created_at?->format('Y-m-d'),
                'is_active' => $utilisateurCible->est_actif ?? true,
            ],
            'regions' => Region::select('id_region', 'nom_region')->orderBy('nom_region')->get(),
            'branches' => Branche::select('id_branche', 'nom_branche')->orderBy('nom_branche')->get(),
            'roles' => Role::select('nom_role', 'description')->orderBy('nom_role')->get(),
            ...$this->getAdminPageData('Modifier un Utilisateur', [], $utilisateur),
        ]);
    }

    /**
     * Met à jour un utilisateur (ADMIN uniquement)
     */
    public function update(Request $request, string $matricule): RedirectResponse
    {
        $utilisateur = Auth::user();
        $this->assertAdmin($utilisateur);

        $utilisateurCible = Utilisateur::where('matricule', $matricule)->firstOrFail();

        $validated = $request->validate([
            'nom' => ['required', 'string', 'max:100'],
            'prenom' => ['required', 'string', 'max:100'],
            'email' => [
                'required',
                'email',
                'max:100',
                Rule::unique('utilisateurs', 'email')->ignore($utilisateurCible->matricule, 'matricule'),
            ],
            'telephone' => ['nullable', 'string', 'max:20'],
            'role' => ['required', 'string', 'max:50'],
            'region' => ['required', 'string', 'max:5'],
            'branche' => ['required', 'string', 'max:5'],
            'manager_matricule' => ['nullable', 'string', 'max:5'],
            'password' => ['nullable', 'string', 'min:8', 'confirmed'],
            'is_active' => ['nullable', 'boolean'],
        ]);

        $region = Region::where('id_region', $validated['region'])->first();
        $branche = Branche::where('id_branche', $validated['branche'])->first();
        $role = Role::where('nom_role', $validated['role'])->first();

        $utilisateurCible->nom = $validated['nom'];
        $utilisateurCible->prenom = $validated['prenom'];
        $utilisateurCible->email = $validated['email'];
        $utilisateurCible->telephone = $validated['telephone'] ?? null;
        $utilisateurCible->role = $validated['role'];
        $utilisateurCible->role_nom = $role?->nom_role ?? $validated['role'];
        $utilisateurCible->id_region = $validated['region'];
        $utilisateurCible->id_branche = $validated['branche'];
        $utilisateurCible->region_nom = $region?->nom_region ?? $utilisateurCible->region_nom;
        $utilisateurCible->type_region = $region?->est_taniere ? 'Tanière' : 'Non-Tanière';
        $utilisateurCible->manager_matricule = $validated['manager_matricule'] ?? null;
        $utilisateurCible->est_actif = $validated['is_active'] ?? $utilisateurCible->est_actif;
        $utilisateurCible->statut = $utilisateurCible->est_actif ? 'actif' : 'inactif';
        $utilisateurCible->est_admin = strtoupper($utilisateurCible->role) === 'ADMIN';

        if (!empty($validated['password'])) {
            $utilisateurCible->password = Hash::make($validated['password']);
        }

        $utilisateurCible->save();

        return redirect()->route('admin.utilisateurs.show', ['matricule' => $utilisateurCible->matricule]);
    }
    
    /**
     * Affiche l'analyse des gaps pour tous les utilisateurs
     */
    public function gaps(): InertiaResponse
    {
        $utilisateur = Auth::user();
        
        $this->assertAdmin($utilisateur);
        
        // Récupérer les utilisateurs avec leurs scores et gaps
        $utilisateurs = Utilisateur::with(['regionEntity', 'branche'])
            ->where('est_actif', true)
            ->get()
            ->map(function ($user) {
                return [
                    'matricule' => $user->matricule,
                    'nom' => $user->nom,
                    'prenom' => $user->prenom,
                    'role' => $user->role,
                    'region' => $user->regionEntity?->nom_region ?? 'Non définie',
                    'branche' => $user->branche?->nom_branche ?? 'Non définie',
                    'score_global' => $user->score_global ?? 0,
                    'progression' => $user->progression_vs_precedente ?? 0,
                    'nb_evaluations' => $user->evaluationsRecues()->count(),
                    'gaps_detectes' => $this->getGapsUtilisateur($user),
                ];
            });
        
        return Inertia::render('Admin/Utilisateurs/Gaps', [
            'utilisateurs' => $utilisateurs,
            ...$this->getAdminPageData('Analyse des Gaps de Performance', [], $utilisateur),
        ]);
    }

    private function assertAdmin(?Utilisateur $utilisateur): void
    {
        if (!$utilisateur || strtoupper($utilisateur->role ?? '') !== 'ADMIN') {
            abort(403, 'Accès réservé aux administrateurs');
        }
    }
    
    /**
     * Identifie les gaps de performance pour un utilisateur
     */
    private function getGapsUtilisateur($utilisateur): array
    {
        $gaps = [];
        
        // Gap de score global
        if ($utilisateur->score_global < 60) {
            $gaps[] = [
                'type' => 'score_faible',
                'description' => 'Score global inférieur à 60%',
                'priorite' => 'haute',
                'severite' => 'elevee',
                'recommandation' => 'Formation intensive recommandée'
            ];
        }
        
        // Gap de progression
        if ($utilisateur->progression_vs_precedente < -10) {
            $gaps[] = [
                'type' => 'regression',
                'description' => 'Régression de performance significative',
                'priorite' => 'haute',
                'severite' => 'elevee',
                'recommandation' => 'Accompagnement personnalisé requis'
            ];
        }
        
        // Gap d'évaluations
        $nbEvaluations = $utilisateur->evaluationsRecues()->count();
        if ($nbEvaluations < 3) {
            $gaps[] = [
                'type' => 'evaluations_insuffisantes',
                'description' => 'Nombre d\'évaluations insuffisant',
                'priorite' => 'moyenne',
                'severite' => 'moyenne',
                'recommandation' => 'Solliciter plus d\'évaluations'
            ];
        }
        
        return $gaps;
    }
    
    /**
     * Génère la vue hiérarchique des utilisateurs
     */
    private function getVueHierarchique(): array
    {
        $regions = Region::with(['utilisateurs' => function($query) {
            $query->where('est_actif', true)->orderBy('niveau_hierarchique');
        }])->get();
        
        $hierarchie = [];
        
        foreach ($regions as $region) {
            $noeudsRegion = [];
            
            // Organiser par niveau hiérarchique
            $utilisateursParNiveau = $region->utilisateurs->groupBy('niveau_hierarchique');
            
            foreach ($utilisateursParNiveau as $niveau => $utilisateurs) {
                foreach ($utilisateurs as $utilisateur) {
                    $noeud = [
                        'id' => $utilisateur->matricule,
                        'nom' => $utilisateur->prenom . ' ' . $utilisateur->nom,
                        'role' => $utilisateur->role,
                        'niveau' => $niveau,
                        'manager' => $utilisateur->manager_matricule,
                        'region' => $region->nom_region,
                        'branche' => $utilisateur->id_branche,
                        'est_actif' => $utilisateur->est_actif,
                        'enfants' => []
                    ];
                    
                    $noeudsRegion[] = $noeud;
                }
            }
            
            // Construire l'arbre hiérarchique
            $arbreRegion = $this->construireArbre($noeudsRegion);
            
            $hierarchie[] = [
                'region' => $region,
                'arbre' => $arbreRegion,
                'total_utilisateurs' => count($noeudsRegion)
            ];
        }
        
        return [
            'type' => 'hierarchique',
            'regions' => $hierarchie,
            'total_general' => Utilisateur::where('est_actif', true)->count()
        ];
    }
    
    /**
     * Génère la vue liste des utilisateurs avec filtres
     */
    private function getVueListe(Request $request): array
    {
        $query = Utilisateur::query();
        
        // Appliquer les filtres
        if ($request->filled('region')) {
            $query->where('id_region', $request->region);
        }
        
        if ($request->filled('role')) {
            $query->where('role', $request->role);
        }
        
        if ($request->filled('branche')) {
            $query->where('id_branche', $request->branche);
        }
        
        if ($request->filled('statut')) {
            if ($request->statut === 'actif') {
                $query->where('est_actif', true);
            } else {
                $query->where('est_actif', false);
            }
        }
        
        if ($request->filled('recherche')) {
            $recherche = $request->recherche;
            $query->where(function($q) use ($recherche) {
                $q->where('nom', 'like', "%{$recherche}%")
                  ->orWhere('prenom', 'like', "%{$recherche}%")
                  ->orWhere('matricule', 'like', "%{$recherche}%")
                  ->orWhere('email', 'like', "%{$recherche}%");
            });
        }
        
        $utilisateurs = $query->orderBy('region_nom')
                            ->orderBy('niveau_hierarchique')
                            ->orderBy('nom')
                            ->paginate(50);
        
        return [
            'type' => 'liste',
            'utilisateurs' => $utilisateurs,
            'filtres_appliques' => $request->only(['region', 'role', 'branche', 'statut', 'recherche'])
        ];
    }
    
    /**
     * Construit un arbre hiérarchique à partir d'une liste de nœuds
     */
    private function construireArbre(array $noeuds): array
    {
        $arbre = [];
        $noeudsParId = [];
        
        // Indexer par ID
        foreach ($noeuds as $noeud) {
            $noeudsParId[$noeud['id']] = $noeud;
        }
        
        // Construire l'arbre
        foreach ($noeuds as $noeud) {
            if ($noeud['manager'] && isset($noeudsParId[$noeud['manager']])) {
                $noeudsParId[$noeud['manager']]['enfants'][] = &$noeudsParId[$noeud['id']];
            } else {
                $arbre[] = &$noeudsParId[$noeud['id']];
            }
        }
        
        return $arbre;
    }
    
    /**
     * Récupère les filtres disponibles
     */
    private function getFiltresDisponibles(): array
    {
        return [
            'regions' => Region::select('id_region', 'nom_region')->get(),
            'roles' => Role::select('nom_role')->distinct()->get(),
            'branches' => Branche::select('id_branche', 'nom_branche')->get(),
            'statuts' => [
                ['value' => 'actif', 'label' => 'Actif'],
                ['value' => 'inactif', 'label' => 'Inactif']
            ]
        ];
    }
    
    /**
     * Récupère les évaluations d'un utilisateur
     */
    private function getEvaluationsUtilisateur(Utilisateur $utilisateur): array
    {
        return Evaluation::where('evalue_matricule', $utilisateur->matricule)
            ->with(['evaluateur', 'periode', 'regle'])
            ->orderBy('created_at', 'desc')
            ->limit(10)
            ->get()
            ->toArray();
    }
    
    /**
     * Récupère les évaluations des pairs
     */
    private function getEvaluationsPairs(Utilisateur $utilisateur): array
    {
        $pairs = Utilisateur::where('niveau_hierarchique', $utilisateur->niveau_hierarchique)
            ->where('id_region', $utilisateur->id_region)
            ->where('id_branche', $utilisateur->id_branche)
            ->where('matricule', '!=', $utilisateur->matricule)
            ->pluck('matricule');
        
        return Evaluation::whereIn('evalue_matricule', $pairs)
            ->with(['evaluateur', 'evalue', 'periode', 'regle'])
            ->orderBy('created_at', 'desc')
            ->limit(20)
            ->get()
            ->toArray();
    }
    
    /**
     * Récupère les évaluations des supérieurs
     */
    private function getEvaluationsSupérieurs(Utilisateur $utilisateur): array
    {
        $superieurs = [];
        
        // Manager direct
        if ($utilisateur->manager_matricule) {
            $superieurs[] = $utilisateur->manager_matricule;
            
            // Manager du manager
            $manager = Utilisateur::where('matricule', $utilisateur->manager_matricule)->first();
            if ($manager && $manager->manager_matricule) {
                $superieurs[] = $manager->manager_matricule;
            }
        }
        
        if (empty($superieurs)) {
            return [];
        }
        
        return Evaluation::whereIn('evalue_matricule', $superieurs)
            ->with(['evaluateur', 'evalue', 'periode', 'regle'])
            ->orderBy('created_at', 'desc')
            ->limit(10)
            ->get()
            ->toArray();
    }
    
    /**
     * Calcule le gap analysis entre les différentes évaluations
     */
    private function calculerGapAnalysis(array $evaluationsCandidat, array $evaluationsPairs, array $evaluationsSuperieurs): array
    {
        // Logique de calcul du gap analysis
        // Comparer les notes moyennes entre candidat, pairs et supérieurs
        
        $noteCandidat = $this->calculerNoteMoyenne($evaluationsCandidat);
        $notePairs = $this->calculerNoteMoyenne($evaluationsPairs);
        $noteSuperieurs = $this->calculerNoteMoyenne($evaluationsSuperieurs);
        
        return [
            'note_candidat' => $noteCandidat,
            'note_pairs' => $notePairs,
            'note_superieurs' => $noteSuperieurs,
            'gap_candidat_pairs' => $noteCandidat - $notePairs,
            'gap_candidat_superieurs' => $noteCandidat - $noteSuperieurs,
            'interpretation' => $this->interpreterGap($noteCandidat, $notePairs, $noteSuperieurs)
        ];
    }
    
    /**
     * Calcule la note moyenne d'un ensemble d'évaluations
     */
    private function calculerNoteMoyenne(array $evaluations): float
    {
        if (empty($evaluations)) {
            return 0;
        }
        
        $total = 0;
        $count = 0;
        
        foreach ($evaluations as $evaluation) {
            if (isset($evaluation['note_globale']) && $evaluation['note_globale'] > 0) {
                $total += $evaluation['note_globale'];
                $count++;
            }
        }
        
        return $count > 0 ? round($total / $count, 2) : 0;
    }
    
    /**
     * Interprète les écarts de notation
     */
    private function interpreterGap(float $noteCandidat, float $notePairs, float $noteSuperieurs): array
    {
        $interpretations = [];
        
        $gapPairs = $noteCandidat - $notePairs;
        $gapSuperieurs = $noteCandidat - $noteSuperieurs;
        
        if (abs($gapPairs) > 1) {
            $interpretations[] = $gapPairs > 0 
                ? "Le candidat s'évalue plus favorablement que ses pairs"
                : "Le candidat s'évalue moins favorablement que ses pairs";
        }
        
        if (abs($gapSuperieurs) > 1) {
            $interpretations[] = $gapSuperieurs > 0 
                ? "Le candidat s'évalue plus favorablement que ses supérieurs"
                : "Le candidat s'évalue moins favorablement que ses supérieurs";
        }
        
        if (empty($interpretations)) {
            $interpretations[] = "Les évaluations sont cohérentes entre les différents niveaux";
        }
        
        return $interpretations;
    }

    /**
     * Construit la hiérarchie des utilisateurs
     */
    private function construireHierarchie(Collection $utilisateurs): array
    {
        // Convertir en array pour manipulation plus facile
        $users = $utilisateurs->toArray();
        
        // Créer un index par matricule pour accès rapide
        $userIndex = [];
        foreach ($users as $user) {
            $userIndex[$user['matricule']] = $user;
            $userIndex[$user['matricule']]['subordonnes'] = [];
        }
        
        // Construire l'arbre hiérarchique
        $racines = [];
        
        foreach ($users as $user) {
            // Exclure les utilisateurs ADMIN de la hiérarchie
            if ($user['role'] === 'ADMIN') {
                continue;
            }
            
            if ($user['manager_matricule'] && isset($userIndex[$user['manager_matricule']])) {
                // Ajouter comme subordonné de son manager
                $userIndex[$user['manager_matricule']]['subordonnes'][] = &$userIndex[$user['matricule']];
            } else {
                // C'est un nœud racine (pas de manager ou manager introuvable)
                $racines[] = &$userIndex[$user['matricule']];
            }
        }
        
        // Ajouter aussi 'children' pour compatibilité frontend
        $this->addChildrenProperty($racines);
        
        return $racines;
    }

    /**
     * Ajoute la propriété 'children' pour compatibilité frontend
     */
    private function addChildrenProperty(array &$nodes): void
    {
        foreach ($nodes as &$node) {
            if (isset($node['subordonnes']) && is_array($node['subordonnes'])) {
                $node['children'] = $node['subordonnes'];
                $this->addChildrenProperty($node['children']);
            } else {
                $node['children'] = [];
            }
        }
    }
}
