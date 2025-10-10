<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Inertia\Response as InertiaResponse;
use App\Models\RemplacementTemporaire;
use App\Models\Utilisateur;
use App\Traits\FormatsUserData;

class RemplacementsController extends Controller
{
    use FormatsUserData;

    /**
     * Affiche la liste des remplacements
     */
    public function index(): InertiaResponse
    {
        $utilisateur = Auth::user();
        
        // Récupérer tous les remplacements avec relations
        $remplacements = RemplacementTemporaire::with([
            'titulaire:matricule,nom,prenom,role,region_nom',
            'remplacant:matricule,nom,prenom,role,region_nom',
            'creePar:matricule,nom,prenom',
            'approuvePar:matricule,nom,prenom'
        ])
        ->orderBy('created_at', 'desc')
        ->paginate(20);

        // Statistiques
        $statistiques = [
            'total' => RemplacementTemporaire::count(),
            'actifs' => RemplacementTemporaire::where('est_actif', true)->count(),
            'en_attente' => RemplacementTemporaire::whereNull('approuve_par')->count(),
            'termines' => RemplacementTemporaire::whereNotNull('date_fin_effective')->count(),
        ];

        // Données de référence pour les filtres
        $regions = \App\Models\Region::select('id_region as id', 'nom_region as nom')->get();
        $roles = \App\Models\Role::select('nom_role as nom', 'description as libelle')->get();

        return Inertia::render('Admin/Remplacements/Index', [
            'remplacements' => $remplacements,
            'statistiques' => $statistiques,
            'regions' => $regions,
            'roles' => $roles,
            ...$this->getAdminPageData('Gestion des Remplacements', [], $utilisateur),
        ]);
    }

    /**
     * Affiche le formulaire de création d'un remplacement
     */
    public function create(): InertiaResponse
    {
        $utilisateur = Auth::user();
        
        // Utilisateurs disponibles pour remplacement (actifs uniquement)
        $utilisateurs = Utilisateur::where('est_actif', true)
            ->where('role', '!=', 'ADMIN') // Admin hors hiérarchie
            ->select('matricule', 'nom', 'prenom', 'role', 'region_nom', 'id_region')
            ->orderBy('nom')
            ->get();

        $regions = \App\Models\Region::select('id_region as id', 'nom_region as nom')->get();
        $roles = \App\Models\Role::where('nom_role', '!=', 'ADMIN')->select('nom_role as nom', 'description as libelle')->get();

        return Inertia::render('Admin/Remplacements/Create', [
            'utilisateurs' => $utilisateurs,
            'regions' => $regions,
            'roles' => $roles,
            ...$this->getAdminPageData('Créer un Remplacement', [], $utilisateur),
        ]);
    }

    /**
     * Enregistre un nouveau remplacement
     */
    public function store(Request $request): \Illuminate\Http\RedirectResponse
    {
        $request->validate([
            'titulaire_matricule' => 'required|exists:utilisateurs,matricule',
            'remplacant_matricule' => 'required|exists:utilisateurs,matricule|different:titulaire_matricule',
            'role_remplace' => 'required|string|max:50',
            'region_remplacement' => 'required|string|max:100',
            'date_debut' => 'required|date|after_or_equal:today',
            'duree_prevue_jours' => 'required|integer|min:30',
            'motif' => 'required|string|max:100',
        ]);

        // Vérifier qu'il n'y a pas de conflit de dates
        $conflits = RemplacementTemporaire::where('titulaire_matricule', $request->titulaire_matricule)
            ->where('est_actif', true)
            ->where(function($query) use ($request) {
                $dateFin = now()->parse($request->date_debut)->addDays($request->duree_prevue_jours);
                $query->whereBetween('date_debut', [$request->date_debut, $dateFin])
                      ->orWhereBetween('date_fin', [$request->date_debut, $dateFin]);
            })
            ->exists();

        if ($conflits) {
            return back()->withErrors(['date_debut' => 'Un remplacement existe déjà pour cette période.']);
        }

        RemplacementTemporaire::create([
            'titulaire_matricule' => $request->titulaire_matricule,
            'remplacant_matricule' => $request->remplacant_matricule,
            'role_remplace' => $request->role_remplace,
            'region_remplacement' => $request->region_remplacement,
            'service_remplacement' => $request->service_remplacement,
            'date_debut' => $request->date_debut,
            'date_fin' => $request->date_debut ? now()->parse($request->date_debut)->addDays($request->duree_prevue_jours) : null,
            'duree_prevue_jours' => $request->duree_prevue_jours,
            'motif' => $request->motif,
            'cree_par' => Auth::user()->matricule,
            'est_actif' => true,
        ]);

        return redirect()->route('admin.remplacements.index')
            ->with('success', 'Remplacement créé avec succès.');
    }

    /**
     * Affiche l'historique des remplacements
     */
    public function history(): InertiaResponse
    {
        $utilisateur = Auth::user();
        
        $remplacements = RemplacementTemporaire::with([
            'titulaire:matricule,nom,prenom,role,region_nom',
            'remplacant:matricule,nom,prenom,role,region_nom'
        ])
        ->where('est_actif', false)
        ->orWhereNotNull('date_fin_effective')
        ->orderBy('date_fin_effective', 'desc')
        ->paginate(20);

        return Inertia::render('Admin/Remplacements/History', [
            'remplacements' => $remplacements,
            ...$this->getAdminPageData('Historique des Remplacements', [], $utilisateur),
        ]);
    }

    /**
     * Termine un remplacement
     */
    public function terminate(RemplacementTemporaire $remplacement): \Illuminate\Http\RedirectResponse
    {
        $remplacement->update([
            'est_actif' => false,
            'date_fin_effective' => now(),
        ]);

        return back()->with('success', 'Remplacement terminé avec succès.');
    }

    /**
     * Méthode privée pour obtenir les données de page admin
     */
    private function getAdminPageData(string $title, array $breadcrumbs, $user): array
    {
        return [
            'title' => $title,
            'breadcrumbs' => $breadcrumbs,
            'user' => $this->formatUserForUI($user),
        ];
    }
}
