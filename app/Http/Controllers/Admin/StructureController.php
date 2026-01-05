<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Region;
use App\Models\ServiceCommercial;
use App\Models\District;
use App\Models\Secteur;
use App\Models\Utilisateur;
use App\Traits\FormatsUserData;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Inertia\Inertia;
use Inertia\Response as InertiaResponse;

class StructureController extends Controller
{
    use FormatsUserData;
    public function __construct()
    {
        // Middleware applied at route level
    }

    /**
     * Vue d'ensemble de la structure organisationnelle sous forme d'arborescence.
     */
    public function overview(): InertiaResponse
    {
        $user = request()->user();

        $regions = Region::withCount(['utilisateurs'])
            ->with([
                'servicesCommerciaux' => function ($query) {
                    $query->withCount(['utilisateurs'])
                        ->with([
                            'districts' => function ($districtQuery) {
                                $districtQuery->withCount(['utilisateurs'])
                                    ->with([
                                        'secteurs' => function ($secteurQuery) {
                                            $secteurQuery->withCount(['utilisateurs']);
                                        },
                                    ]);
                            },
                            'secteurs' => function ($secteurQuery) {
                                $secteurQuery->withCount(['utilisateurs']);
                            },
                        ]);
                },
            ])
            ->get();

        $tree = $regions->map(function (Region $region) {
            $regionManager = $this->formatPersonName(
                $this->findStructureLead('DR', ['id_region' => $region->id_region])
            );

            $serviceNodes = $region->servicesCommerciaux->map(function (ServiceCommercial $service) {
                $serviceManager = $this->formatPersonName(
                    $this->findStructureLead('CSC', ['id_service' => $service->id_service])
                );

                $districtNodes = $service->districts->map(function (District $district) {
                    $districtManager = $this->formatPersonName(
                        $this->findStructureLead('CDV', ['id_district' => $district->id_district])
                    );

                    $sectorNodes = $district->secteurs->map(function (Secteur $secteur) {
                        $sectorManager = $this->formatPersonName(
                            $this->findStructureLead('CDS', ['id_secteur' => $secteur->id_secteur])
                        );

                        return [
                            'id' => (string) $secteur->id_secteur,
                            'nom' => ucfirst(strtolower($secteur->nom_secteur)),
                            'niveau' => 4,
                            'type' => 'structure',
                            'badge_variant' => 'outline',
                            'manager' => $sectorManager,
                            'manager_role' => 'Chef de secteur',
                            'metadata' => [
                                'utilisateurs_count' => $secteur->utilisateurs_count ?? 0,
                            ],
                        ];
                    })->values();

                    return [
                        'id' => (string) $district->id_district,
                        'nom' => ucfirst(strtolower($district->nom_district)),
                        'niveau' => 3,
                        'type' => 'structure',
                        'badge_variant' => 'secondary',
                        'manager' => $districtManager,
                        'manager_role' => 'Chef district vente',
                        'metadata' => [
                            'utilisateurs_count' => $district->utilisateurs_count ?? 0,
                        ],
                        'children' => $sectorNodes,
                    ];
                })->values();

                $directSectors = $service->secteurs
                    ->filter(fn ($secteur) => empty($secteur->id_district))
                    ->map(function (Secteur $secteur) {
                        $sectorManager = $this->formatPersonName(
                            $this->findStructureLead('CDS', ['id_secteur' => $secteur->id_secteur])
                        );

                        return [
                            'id' => (string) $secteur->id_secteur,
                            'nom' => ucfirst(strtolower($secteur->nom_secteur)),
                            'niveau' => 3,
                            'type' => 'structure',
                            'badge_variant' => 'outline',
                            'manager' => $sectorManager,
                            'manager_role' => 'Chef de secteur',
                            'metadata' => [
                                'utilisateurs_count' => $secteur->utilisateurs_count ?? 0,
                            ],
                        ];
                    })->values();

                return [
                    'id' => (string) $service->id_service,
                    'nom' => ucfirst(strtolower($service->nom_service)),
                    'niveau' => 2,
                    'type' => 'structure',
                    'badge_variant' => 'default',
                    'manager' => $serviceManager,
                    'manager_role' => 'Chef service commercial',
                    'metadata' => [
                        'utilisateurs_count' => $service->utilisateurs_count ?? 0,
                    ],
                    'children' => $districtNodes->merge($directSectors)->values(),
                ];
            })->values();

            return [
                'id' => (string) $region->id_region,
                'nom' => strtoupper($region->nom_region),
                'niveau' => 1,
                'type' => 'structure',
                'badge_variant' => $region->est_taniere ? 'default' : 'secondary',
                'manager' => $regionManager,
                'manager_role' => 'Directeur régional',
                'description' => $region->est_taniere ? 'Région tanière' : 'Région non tanière',
                'metadata' => [
                    'utilisateurs_count' => $region->utilisateurs_count ?? 0,
                    'statut' => $region->est_taniere ? 'tanière' : 'non tanière',
                ],
                'children' => $serviceNodes,
            ];
        })->values();

        $statistics = [
            'regions' => $regions->count(),
            'taniere' => $regions->where('est_taniere', true)->count(),
            'non_taniere' => $regions->where('est_taniere', false)->count(),
            'services' => $regions->sum(fn (Region $region) => $region->servicesCommerciaux->count()),
            'districts' => $regions->sum(fn (Region $region) => $region->servicesCommerciaux->sum(fn (ServiceCommercial $service) => $service->districts->count())),
            'secteurs' => $regions->sum(fn (Region $region) => $region->servicesCommerciaux->sum(fn (ServiceCommercial $service) => $service->secteurs->count())),
            'utilisateurs' => $regions->sum('utilisateurs_count'),
        ];

        return Inertia::render('Admin/structure/index', [
            'user' => $this->formatUserForUI($user),
            'tree' => $tree->toArray(),
            'statistics' => $statistics,
        ]);
    }

    private function findStructureLead(string $role, array $criteria)
    {
        $query = Utilisateur::query()->where('role_nom', $role);

        foreach ($criteria as $field => $value) {
            if ($value !== null) {
                $query->where($field, $value);
            }
        }

        return $query->orderByDesc('est_actif')->orderByDesc('updated_at')->first();
    }

    private function formatPersonName($user): ?string
    {
        if (!$user) {
            return null;
        }

        $prenom = $user->prenom ? ucfirst(strtolower($user->prenom)) : '';
        $nom = $user->nom ? mb_strtoupper($user->nom) : '';
        $fullName = trim($prenom . ' ' . $nom);

        return $fullName !== '' ? $fullName : $user->matricule;
    }

    // ==================== RÉGIONS ====================

    /**
     * Affiche la liste des régions avec statistiques
     */
    public function regions(): InertiaResponse
    {
        $regions = Region::withCount(['utilisateurs', 'servicesCommerciaux'])
            ->get()
            ->map(function ($region) {
                return [
                    'id_region' => $region->id_region,
                    'nom_region' => $region->nom_region,
                    'est_taniere' => $region->est_taniere,
                    'utilisateurs_count' => $region->utilisateurs_count,
                    'services_count' => $region->services_commerciaux_count,
                ];
            });

        $statistics = [
            'total_regions' => $regions->count(),
            'regions_taniere' => $regions->where('est_taniere', true)->count(),
            'regions_non_taniere' => $regions->where('est_taniere', false)->count(),
            'total_utilisateurs' => $regions->sum('utilisateurs_count'),
        ];

        return Inertia::render('Admin/structure/regions', [
            'regions' => $regions,
            'statistics' => $statistics,
        ]);
    }

    /**
     * Stocke une nouvelle région
     */
    public function storeRegion(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'nom_region' => 'required|string|max:100|unique:regions,nom_region',
            'est_taniere' => 'required|boolean',
        ]);

        if ($validator->fails()) {
            return back()->withErrors($validator)->withInput();
        }

        Region::create($validator->validated());

        return back()->with('success', 'Région créée avec succès.');
    }

    /**
     * Met à jour une région
     */
    public function updateRegion(Request $request, string $id)
    {
        $region = Region::findOrFail($id);

        $validator = Validator::make($request->all(), [
            'nom_region' => 'required|string|max:100|unique:regions,nom_region,' . $id . ',id_region',
            'est_taniere' => 'required|boolean',
        ]);

        if ($validator->fails()) {
            return back()->withErrors($validator)->withInput();
        }

        $region->update($validator->validated());

        return back()->with('success', 'Région mise à jour avec succès.');
    }

    /**
     * Supprime une région (avec vérification des dépendances)
     */
    public function destroyRegion(string $id)
    {
        $region = Region::findOrFail($id);

        // Vérification des dépendances selon règles SABC
        $utilisateursCount = Utilisateur::where('id_region', $id)->count();
        $servicesCount = ServiceCommercial::where('id_region', $id)->count();
        
        if ($utilisateursCount > 0) {
            return back()->withErrors([
                'delete' => "Impossible de supprimer cette région. {$utilisateursCount} utilisateur(s) y sont encore affecté(s)."
            ]);
        }

        if ($servicesCount > 0) {
            return back()->withErrors([
                'delete' => "Impossible de supprimer cette région. {$servicesCount} service(s) commercial(aux) y sont encore rattaché(s)."
            ]);
        }

        $region->delete();

        return back()->with('success', 'Région supprimée avec succès.');
    }

    // ==================== SERVICES COMMERCIAUX ====================

    /**
     * Affiche la liste des services commerciaux avec statistiques
     */
    public function services(): InertiaResponse
    {
        $services = ServiceCommercial::with('region')
            ->withCount(['utilisateurs', 'districts', 'secteurs'])
            ->get()
            ->map(function ($service) {
                return [
                    'id_service' => $service->id_service,
                    'nom_service' => $service->nom_service,
                    'id_region' => $service->id_region,
                    'region_nom' => $service->region->nom_region,
                    'est_taniere' => $service->region->est_taniere,
                    'utilisateurs_count' => $service->utilisateurs_count,
                    'districts_count' => $service->districts_count,
                    'secteurs_count' => $service->secteurs_count,
                ];
            });

        $regions = Region::select('id_region', 'nom_region', 'est_taniere')->get();

        $statistics = [
            'total_services' => $services->count(),
            'services_taniere' => $services->where('est_taniere', true)->count(),
            'services_non_taniere' => $services->where('est_taniere', false)->count(),
            'total_utilisateurs' => $services->sum('utilisateurs_count'),
        ];

        return Inertia::render('Admin/structure/services', [
            'services' => $services,
            'regions' => $regions,
            'statistics' => $statistics,
        ]);
    }

    /**
     * Stocke un nouveau service commercial
     */
    public function storeService(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'nom_service' => 'required|string|max:100',
            'id_region' => 'required|exists:regions,id_region',
        ]);

        if ($validator->fails()) {
            return back()->withErrors($validator)->withInput();
        }

        ServiceCommercial::create($validator->validated());

        return back()->with('success', 'Service commercial créé avec succès.');
    }

    /**
     * Met à jour un service commercial
     */
    public function updateService(Request $request, string $id)
    {
        $service = ServiceCommercial::findOrFail($id);

        $validator = Validator::make($request->all(), [
            'nom_service' => 'required|string|max:100',
            'id_region' => 'required|exists:regions,id_region',
        ]);

        if ($validator->fails()) {
            return back()->withErrors($validator)->withInput();
        }

        $service->update($validator->validated());

        return back()->with('success', 'Service commercial mis à jour avec succès.');
    }

    /**
     * Supprime un service commercial (avec vérification des dépendances)
     */
    public function destroyService(string $id)
    {
        $service = ServiceCommercial::findOrFail($id);

        // Vérification des dépendances selon règles SABC
        $utilisateursCount = Utilisateur::where('id_service', $id)->count();
        $districtsCount = District::where('id_service', $id)->count();
        $secteursCount = Secteur::where('id_service', $id)->count();
        
        if ($utilisateursCount > 0) {
            return back()->withErrors([
                'delete' => "Impossible de supprimer ce service. {$utilisateursCount} utilisateur(s) y sont encore affecté(s)."
            ]);
        }

        if ($districtsCount > 0 || $secteursCount > 0) {
            return back()->withErrors([
                'delete' => "Impossible de supprimer ce service. {$districtsCount} district(s) et {$secteursCount} secteur(s) y sont encore rattaché(s)."
            ]);
        }

        $service->delete();

        return back()->with('success', 'Service commercial supprimé avec succès.');
    }

    // ==================== DISTRICTS ====================

    /**
     * Affiche la liste des districts avec statistiques
     */
    public function districts(): InertiaResponse
    {
        $districts = District::with(['serviceCommercial.region'])
            ->withCount(['utilisateurs', 'secteurs'])
            ->get()
            ->map(function ($district) {
                $service = $district->serviceCommercial;
                $region = $service?->region;

                return [
                    'id_district' => $district->id_district,
                    'nom_district' => $district->nom_district,
                    'id_service' => $district->id_service,
                    'service_nom' => $service?->nom_service ?? 'Service non défini',
                    'region_nom' => $region?->nom_region ?? 'Région non définie',
                    'est_taniere' => $region?->est_taniere ?? false,
                    'utilisateurs_count' => $district->utilisateurs_count,
                    'secteurs_count' => $district->secteurs_count,
                ];
            });

        $services = ServiceCommercial::with('region')
            ->select('id_service', 'nom_service', 'id_region')
            ->get()
            ->map(function ($service) {
                return [
                    'id_service' => $service->id_service,
                    'nom_service' => $service->nom_service,
                    'region_nom' => $service->region->nom_region,
                ];
            });

        $statistics = [
            'total_districts' => $districts->count(),
            'districts_taniere' => $districts->where('est_taniere', true)->count(),
            'districts_non_taniere' => $districts->where('est_taniere', false)->count(),
            'total_utilisateurs' => $districts->sum('utilisateurs_count'),
        ];

        return Inertia::render('Admin/structure/districts', [
            'districts' => $districts,
            'services' => $services,
            'statistics' => $statistics,
        ]);
    }

    /**
     * Stocke un nouveau district
     */
    public function storeDistrict(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'nom_district' => 'required|string|max:100',
            'id_service' => 'required|exists:services_commerciaux,id_service',
        ]);

        if ($validator->fails()) {
            return back()->withErrors($validator)->withInput();
        }

        District::create($validator->validated());

        return back()->with('success', 'District créé avec succès.');
    }

    /**
     * Met à jour un district
     */
    public function updateDistrict(Request $request, string $id)
    {
        $district = District::findOrFail($id);

        $validator = Validator::make($request->all(), [
            'nom_district' => 'required|string|max:100',
            'id_service' => 'required|exists:services_commerciaux,id_service',
        ]);

        if ($validator->fails()) {
            return back()->withErrors($validator)->withInput();
        }

        $district->update($validator->validated());

        return back()->with('success', 'District mis à jour avec succès.');
    }

    /**
     * Supprime un district (avec vérification des dépendances)
     */
    public function destroyDistrict(string $id)
    {
        $district = District::findOrFail($id);

        // Vérification des dépendances selon règles SABC
        $utilisateursCount = Utilisateur::where('id_district', $id)->count();
        $secteursCount = Secteur::where('id_district', $id)->count();
        
        if ($utilisateursCount > 0) {
            return back()->withErrors([
                'delete' => "Impossible de supprimer ce district. {$utilisateursCount} utilisateur(s) y sont encore affecté(s)."
            ]);
        }

        if ($secteursCount > 0) {
            return back()->withErrors([
                'delete' => "Impossible de supprimer ce district. {$secteursCount} secteur(s) y sont encore rattaché(s)."
            ]);
        }

        $district->delete();

        return back()->with('success', 'District supprimé avec succès.');
    }

    // ==================== SECTEURS ====================

    /**
     * Affiche la liste des secteurs avec statistiques
     */
    public function secteurs(): InertiaResponse
    {
        $secteurs = Secteur::with(['serviceCommercial.region', 'district'])
            ->withCount('utilisateurs')
            ->get()
            ->map(function ($secteur) {
                $service = $secteur->serviceCommercial;
                $region = $service?->region;

                return [
                    'id_secteur' => $secteur->id_secteur,
                    'nom_secteur' => $secteur->nom_secteur,
                    'id_service' => $secteur->id_service,
                    'id_district' => $secteur->id_district,
                    'service_nom' => $service?->nom_service ?? 'Service non défini',
                    'district_nom' => $secteur->district ? $secteur->district->nom_district : null,
                    'region_nom' => $region?->nom_region ?? 'Région non définie',
                    'est_taniere' => $region?->est_taniere ?? false,
                    'utilisateurs_count' => $secteur->utilisateurs_count,
                ];
            });

        $services = ServiceCommercial::with(['region', 'districts'])
            ->get()
            ->map(function ($service) {
                return [
                    'id_service' => $service->id_service,
                    'nom_service' => $service->nom_service,
                    'region_nom' => $service->region->nom_region,
                    'districts' => $service->districts->map(function ($district) {
                        return [
                            'id_district' => $district->id_district,
                            'nom_district' => $district->nom_district,
                        ];
                    }),
                ];
            });

        $statistics = [
            'total_secteurs' => $secteurs->count(),
            'secteurs_taniere' => $secteurs->where('est_taniere', true)->count(),
            'secteurs_non_taniere' => $secteurs->where('est_taniere', false)->count(),
            'total_utilisateurs' => $secteurs->sum('utilisateurs_count'),
        ];

        return Inertia::render('Admin/structure/secteurs', [
            'secteurs' => $secteurs,
            'services' => $services,
            'statistics' => $statistics,
        ]);
    }

    /**
     * Stocke un nouveau secteur
     */
    public function storeSecteur(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'nom_secteur' => 'required|string|max:100',
            'id_service' => 'required|exists:services_commerciaux,id_service',
            'id_district' => 'nullable|exists:districts,id_district',
        ]);

        if ($validator->fails()) {
            return back()->withErrors($validator)->withInput();
        }

        // Validation métier : si district spécifié, il doit appartenir au même service
        $data = $validator->validated();
        if ($data['id_district']) {
            $district = District::find($data['id_district']);
            if ($district && $district->id_service !== $data['id_service']) {
                return back()->withErrors([
                    'id_district' => 'Le district sélectionné n\'appartient pas au service choisi.'
                ]);
            }
        }

        Secteur::create($data);

        return back()->with('success', 'Secteur créé avec succès.');
    }

    /**
     * Met à jour un secteur
     */
    public function updateSecteur(Request $request, string $id)
    {
        $secteur = Secteur::findOrFail($id);

        $validator = Validator::make($request->all(), [
            'nom_secteur' => 'required|string|max:100',
            'id_service' => 'required|exists:services_commerciaux,id_service',
            'id_district' => 'nullable|exists:districts,id_district',
        ]);

        if ($validator->fails()) {
            return back()->withErrors($validator)->withInput();
        }

        // Validation métier : si district spécifié, il doit appartenir au même service
        $data = $validator->validated();
        if ($data['id_district']) {
            $district = District::find($data['id_district']);
            if ($district && $district->id_service !== $data['id_service']) {
                return back()->withErrors([
                    'id_district' => 'Le district sélectionné n\'appartient pas au service choisi.'
                ]);
            }
        }

        $secteur->update($data);

        return back()->with('success', 'Secteur mis à jour avec succès.');
    }

    /**
     * Supprime un secteur (avec vérification des dépendances)
     */
    public function destroySecteur(string $id)
    {
        $secteur = Secteur::findOrFail($id);

        // Vérification des dépendances selon règles SABC
        $utilisateursCount = Utilisateur::where('id_secteur', $id)->count();
        
        if ($utilisateursCount > 0) {
            return back()->withErrors([
                'delete' => "Impossible de supprimer ce secteur. {$utilisateursCount} utilisateur(s) y sont encore affecté(s)."
            ]);
        }

        $secteur->delete();

        return back()->with('success', 'Secteur supprimé avec succès.');
    }
}
