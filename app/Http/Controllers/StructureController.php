<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Inertia\Response as InertiaResponse;
use App\Models\Region;
use App\Models\ServiceCommercial;
use App\Models\District;
use App\Models\Secteur;
use App\Models\Utilisateur;
use App\Traits\FormatsUserData;

class StructureController extends Controller
{
    use FormatsUserData;

    /**
     * Affiche la gestion des régions
     */
    public function regions(): InertiaResponse
    {
        $utilisateur = Auth::user();
        
        $regions = Region::withCount(['utilisateurs' => function($query) {
            $query->where('role', '!=', 'ADMIN'); // Admin hors hiérarchie
        }])
        ->withCount('servicesCommerciaux')
        ->orderBy('nom_region')
        ->get();

        $statistiques = [
            'total' => Region::count(),
            'tanieres' => Region::where('est_taniere', true)->count(),
            'non_tanieres' => Region::where('est_taniere', false)->count(),
            'avec_utilisateurs' => Region::whereHas('utilisateurs', function($q) {
                $q->where('role', '!=', 'ADMIN');
            })->count(),
        ];

        return Inertia::render('Admin/Structure/Regions', [
            'regions' => $regions,
            'statistiques' => $statistiques,
            ...$this->getAdminPageData('Gestion des Régions', [], $utilisateur),
        ]);
    }

    /**
     * Affiche la gestion des services commerciaux
     */
    public function services(): InertiaResponse
    {
        $utilisateur = Auth::user();
        
        $services = ServiceCommercial::with('region:id_region,nom_region')
            ->withCount(['utilisateurs' => function($query) {
                $query->where('role', '!=', 'ADMIN');
            }])
            ->withCount('districts')
            ->withCount('secteurs')
            ->orderBy('nom_service')
            ->get();

        $regions = Region::select('id_region as id', 'nom_region as nom')->get();

        $statistiques = [
            'total' => ServiceCommercial::count(),
            'avec_districts' => ServiceCommercial::whereHas('districts')->count(),
            'avec_secteurs' => ServiceCommercial::whereHas('secteurs')->count(),
            'avec_utilisateurs' => ServiceCommercial::whereHas('utilisateurs', function($q) {
                $q->where('role', '!=', 'ADMIN');
            })->count(),
        ];

        return Inertia::render('Admin/Structure/Services', [
            'services' => $services,
            'regions' => $regions,
            'statistiques' => $statistiques,
            ...$this->getAdminPageData('Services Commerciaux', [], $utilisateur),
        ]);
    }

    /**
     * Affiche la gestion des districts
     */
    public function districts(): InertiaResponse
    {
        $utilisateur = Auth::user();
        
        $districts = District::with([
            'service:id_service,nom_service,id_region',
            'service.region:id_region,nom_region'
        ])
        ->withCount(['utilisateurs' => function($query) {
            $query->where('role', '!=', 'ADMIN');
        }])
        ->withCount('secteurs')
        ->orderBy('nom_district')
        ->get();

        $services = ServiceCommercial::with('region:id_region,nom_region')
            ->select('id_service as id', 'nom_service as nom', 'id_region')
            ->get();

        $statistiques = [
            'total' => District::count(),
            'avec_secteurs' => District::whereHas('secteurs')->count(),
            'avec_utilisateurs' => District::whereHas('utilisateurs', function($q) {
                $q->where('role', '!=', 'ADMIN');
            })->count(),
        ];

        return Inertia::render('Admin/Structure/Districts', [
            'districts' => $districts,
            'services' => $services,
            'statistiques' => $statistiques,
            ...$this->getAdminPageData('Gestion des Districts', [], $utilisateur),
        ]);
    }

    /**
     * Affiche la gestion des secteurs
     */
    public function secteurs(): InertiaResponse
    {
        $utilisateur = Auth::user();
        
        $secteurs = Secteur::with([
            'service:id_service,nom_service,id_region',
            'service.region:id_region,nom_region',
            'district:id_district,nom_district'
        ])
        ->withCount(['utilisateurs' => function($query) {
            $query->where('role', '!=', 'ADMIN');
        }])
        ->orderBy('nom_secteur')
        ->get();

        $services = ServiceCommercial::with('region:id_region,nom_region')
            ->select('id_service as id', 'nom_service as nom', 'id_region')
            ->get();
        
        $districts = District::select('id_district as id', 'nom_district as nom', 'id_service')->get();

        $statistiques = [
            'total' => Secteur::count(),
            'avec_districts' => Secteur::whereNotNull('id_district')->count(),
            'sans_districts' => Secteur::whereNull('id_district')->count(),
            'avec_utilisateurs' => Secteur::whereHas('utilisateurs', function($q) {
                $q->where('role', '!=', 'ADMIN');
            })->count(),
        ];

        return Inertia::render('Admin/Structure/Secteurs', [
            'secteurs' => $secteurs,
            'services' => $services,
            'districts' => $districts,
            'statistiques' => $statistiques,
            ...$this->getAdminPageData('Gestion des Secteurs', [], $utilisateur),
        ]);
    }

    /**
     * Crée une nouvelle région
     */
    public function storeRegion(Request $request): \Illuminate\Http\RedirectResponse
    {
        $request->validate([
            'nom_region' => 'required|string|max:100|unique:regions,nom_region',
            'est_taniere' => 'boolean',
        ]);

        Region::create([
            'nom_region' => $request->nom_region,
            'est_taniere' => $request->boolean('est_taniere'),
        ]);

        return back()->with('success', 'Région créée avec succès.');
    }

    /**
     * Met à jour une région
     */
    public function updateRegion(Request $request, Region $region): \Illuminate\Http\RedirectResponse
    {
        $request->validate([
            'nom_region' => 'required|string|max:100|unique:regions,nom_region,' . $region->id_region . ',id_region',
            'est_taniere' => 'boolean',
        ]);

        $region->update([
            'nom_region' => $request->nom_region,
            'est_taniere' => $request->boolean('est_taniere'),
        ]);

        return back()->with('success', 'Région mise à jour avec succès.');
    }

    /**
     * Supprime une région (avec vérification des dépendances)
     */
    public function destroyRegion(Region $region): \Illuminate\Http\RedirectResponse
    {
        // Vérifier les utilisateurs liés (hors ADMIN)
        $utilisateursLies = Utilisateur::where('id_region', $region->id_region)
            ->where('role', '!=', 'ADMIN')
            ->count();
        
        if ($utilisateursLies > 0) {
            return back()->withErrors([
                'delete' => "Impossible de supprimer cette région. {$utilisateursLies} utilisateur(s) y sont affectés."
            ]);
        }

        // Vérifier les services commerciaux liés
        $servicesLies = ServiceCommercial::where('id_region', $region->id_region)->count();
        
        if ($servicesLies > 0) {
            return back()->withErrors([
                'delete' => "Impossible de supprimer cette région. {$servicesLies} service(s) commercial(aux) y sont rattachés."
            ]);
        }

        $region->delete();

        return back()->with('success', 'Région supprimée avec succès.');
    }

    /**
     * Crée un nouveau service commercial
     */
    public function storeService(Request $request): \Illuminate\Http\RedirectResponse
    {
        $request->validate([
            'nom_service' => 'required|string|max:100',
            'id_region' => 'required|exists:regions,id_region',
        ]);

        // Vérifier l'unicité par région
        $exists = ServiceCommercial::where('nom_service', $request->nom_service)
            ->where('id_region', $request->id_region)
            ->exists();

        if ($exists) {
            return back()->withErrors([
                'nom_service' => 'Ce service existe déjà dans cette région.'
            ]);
        }

        ServiceCommercial::create($request->all());

        return back()->with('success', 'Service commercial créé avec succès.');
    }

    /**
     * Supprime un service commercial (avec vérification des dépendances)
     */
    public function destroyService(ServiceCommercial $service): \Illuminate\Http\RedirectResponse
    {
        // Vérifier les utilisateurs liés (hors ADMIN)
        $utilisateursLies = Utilisateur::where('id_service', $service->id_service)
            ->where('role', '!=', 'ADMIN')
            ->count();
        
        if ($utilisateursLies > 0) {
            return back()->withErrors([
                'delete' => "Impossible de supprimer ce service. {$utilisateursLies} utilisateur(s) y sont affectés."
            ]);
        }

        // Vérifier les districts liés
        $districtsLies = District::where('id_service', $service->id_service)->count();
        
        if ($districtsLies > 0) {
            return back()->withErrors([
                'delete' => "Impossible de supprimer ce service. {$districtsLies} district(s) y sont rattachés."
            ]);
        }

        // Vérifier les secteurs liés
        $secteursLies = Secteur::where('id_service', $service->id_service)->count();
        
        if ($secteursLies > 0) {
            return back()->withErrors([
                'delete' => "Impossible de supprimer ce service. {$secteursLies} secteur(s) y sont rattachés."
            ]);
        }

        $service->delete();

        return back()->with('success', 'Service commercial supprimé avec succès.');
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
