# Story 1.4: Structure Organisationnelle (Régions & Branches)

Status: ready-for-dev

## Story

En tant qu'administrateur,
Je veux configurer les régions et branches de l'organisation,
Afin de refléter la structure hiérarchique SABC.

## Acceptance Criteria

**Given** je suis connecté en tant qu'admin
**When** je crée une région (ex: Littoral, Centre, Nord, Ouest)
**Then** la région est créée dans MySQL `regions` avec attribut `est_taniere` (true/false)
**And** les régions Tanière (Littoral, Centre) supportent 5 niveaux hiérarchiques
**And** les régions Non-Tanière (Nord, Ouest) supportent 3 niveaux hiérarchiques
**And** je peux créer des branches (Commerciale, Marketing) dans MySQL `branches`
**And** la validation empêche la suppression d'une région/branche si des utilisateurs y sont liés
**And** les services commerciaux, districts et secteurs peuvent être créés selon la hiérarchie régionale

## Tasks / Subtasks

- [ ] Création Tables Structure Organisationnelle (AC: 1, 4, 6)
  - [ ] Migration `create_regions_table.php` avec colonne `est_taniere`
  - [ ] Migration `create_branches_table.php` (Commerciale, Marketing)
  - [ ] Migration `create_services_commerciaux_table.php`
  - [ ] Migration `create_districts_table.php`
  - [ ] Migration `create_secteurs_table.php`
  - [ ] Foreign keys et contraintes d'intégrité

- [ ] Seeding Régions SABC (AC: 1, 2, 3)
  - [ ] Créer `RegionsSeeder.php`
  - [ ] Seeder 6 régions : Littoral (tanière), Centre (tanière), Nord, Ouest, Sud, Est
  - [ ] Configurer `est_taniere=true` pour Littoral et Centre
  - [ ] Ajouter métadonnées : niveaux_hierarchiques (3 ou 5)

- [ ] Seeding Branches (AC: 4)
  - [ ] Créer `BranchesSeeder.php`
  - [ ] Seeder 2 branches : Commerciale (id=1), Marketing (id=2)
  - [ ] Lier aux rôles correspondants

- [ ] Modèles Eloquent (AC: 1, 4, 6)
  - [ ] Créer `app/Models/Region.php` avec relations
  - [ ] Créer `app/Models/Branche.php` avec relations
  - [ ] Créer `app/Models/ServiceCommercial.php`
  - [ ] Créer `app/Models/District.php`
  - [ ] Créer `app/Models/Secteur.php`
  - [ ] Scopes pour régions tanières/non-tanières

- [ ] Interface Admin Régions (AC: 1, 5)
  - [ ] Page `resources/js/Pages/Admin/Structure/Regions/Index.tsx`
  - [ ] Liste régions avec badge tanière/non-tanière
  - [ ] Formulaire création/édition région
  - [ ] Validation suppression (vérifier utilisateurs liés)
  - [ ] Design SABC responsive

- [ ] Interface Admin Hiérarchie Complète (AC: 6)
  - [ ] Page `resources/js/Pages/Admin/Structure/Hierarchy/Index.tsx`
  - [ ] Arbre hiérarchique : Région → Services → Districts → Secteurs
  - [ ] CRUD pour chaque niveau hiérarchique
  - [ ] Validation cohérence (district dans service, secteur dans district)

- [ ] Controllers Structure (AC: 1, 4, 5, 6)
  - [ ] Créer `app/Http/Controllers/Admin/RegionsController.php`
  - [ ] Créer `app/Http/Controllers/Admin/BranchesController.php`
  - [ ] Créer `app/Http/Controllers/Admin/HierarchyController.php`
  - [ ] Validation métier (tanière = 5 niveaux, non-tanière = 3 niveaux)
  - [ ] Vérification utilisateurs liés avant suppression
  - [ ] Logging dans `logs_administration`

- [ ] Tests & Validation
  - [ ] Tester création régions tanières et non-tanières
  - [ ] Tester création branches
  - [ ] Tester hiérarchie complète (services → districts → secteurs)
  - [ ] Tester validation suppression avec utilisateurs liés
  - [ ] Vérifier contraintes niveaux hiérarchiques

## Dev Notes

### Architecture Structure Organisationnelle SABC

**Hiérarchie Géographique :**

**Régions Tanières (5 niveaux) :**
- Littoral, Centre
- Niveaux : Région → Service Commercial → District → Secteur → Sous-secteur (optionnel)

**Régions Non-Tanières (3 niveaux) :**
- Nord, Ouest, Sud, Est
- Niveaux : Région → Service Commercial → Secteur

**Branches Métier :**
- **Commerciale** (id=1) : Ventes, distribution
- **Marketing** (id=2) : Trade marketing, sponsoring

### Migrations Tables

**Table `regions` :**
```php
Schema::connection('mysql')->create('regions', function (Blueprint $table) {
    $table->id('id_region');
    $table->string('nom_region', 100)->unique(); // Littoral, Centre, etc.
    $table->string('code_region', 10)->unique(); // LIT, CEN, NOR, etc.
    $table->boolean('est_taniere')->default(false); // true pour Littoral/Centre
    $table->integer('niveaux_hierarchiques')->default(3); // 3 ou 5
    $table->boolean('actif')->default(true);
    $table->timestamps();
    
    $table->index('nom_region');
    $table->index('est_taniere');
});
```

**Table `branches` :**
```php
Schema::connection('mysql')->create('branches', function (Blueprint $table) {
    $table->id('id_branche');
    $table->string('nom_branche', 100)->unique(); // Commerciale, Marketing
    $table->string('code_branche', 10)->unique(); // COM, MKT
    $table->text('description')->nullable();
    $table->boolean('actif')->default(true);
    $table->timestamps();
    
    $table->index('nom_branche');
});
```

**Table `services_commerciaux` :**
```php
Schema::connection('mysql')->create('services_commerciaux', function (Blueprint $table) {
    $table->id('id_service');
    $table->string('nom_service', 100);
    $table->string('code_service', 20)->unique();
    $table->foreignId('id_region')->constrained('regions', 'id_region')->onDelete('restrict');
    $table->foreignId('id_branche')->constrained('branches', 'id_branche')->onDelete('restrict');
    $table->boolean('actif')->default(true);
    $table->timestamps();
    
    $table->index(['id_region', 'id_branche']);
    $table->unique(['nom_service', 'id_region']);
});
```

**Table `districts` :**
```php
Schema::connection('mysql')->create('districts', function (Blueprint $table) {
    $table->id('id_district');
    $table->string('nom_district', 100);
    $table->string('code_district', 20)->unique();
    $table->foreignId('id_service')->constrained('services_commerciaux', 'id_service')->onDelete('restrict');
    $table->foreignId('id_region')->constrained('regions', 'id_region')->onDelete('restrict');
    $table->boolean('actif')->default(true);
    $table->timestamps();
    
    $table->index(['id_service', 'id_region']);
    $table->unique(['nom_district', 'id_service']);
});
```

**Table `secteurs` :**
```php
Schema::connection('mysql')->create('secteurs', function (Blueprint $table) {
    $table->id('id_secteur');
    $table->string('nom_secteur', 100);
    $table->string('code_secteur', 20)->unique();
    $table->foreignId('id_district')->nullable()->constrained('districts', 'id_district')->onDelete('restrict');
    $table->foreignId('id_service')->constrained('services_commerciaux', 'id_service')->onDelete('restrict');
    $table->foreignId('id_region')->constrained('regions', 'id_region')->onDelete('restrict');
    $table->boolean('actif')->default(true);
    $table->timestamps();
    
    $table->index(['id_service', 'id_region']);
    $table->index('id_district');
    $table->unique(['nom_secteur', 'id_service']);
});
```

### Seeders

**RegionsSeeder :**
```php
namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class RegionsSeeder extends Seeder
{
    public function run()
    {
        $regions = [
            [
                'nom_region' => 'Littoral',
                'code_region' => 'LIT',
                'est_taniere' => true,
                'niveaux_hierarchiques' => 5,
                'actif' => true,
            ],
            [
                'nom_region' => 'Centre',
                'code_region' => 'CEN',
                'est_taniere' => true,
                'niveaux_hierarchiques' => 5,
                'actif' => true,
            ],
            [
                'nom_region' => 'Nord',
                'code_region' => 'NOR',
                'est_taniere' => false,
                'niveaux_hierarchiques' => 3,
                'actif' => true,
            ],
            [
                'nom_region' => 'Ouest',
                'code_region' => 'OUE',
                'est_taniere' => false,
                'niveaux_hierarchiques' => 3,
                'actif' => true,
            ],
            [
                'nom_region' => 'Sud',
                'code_region' => 'SUD',
                'est_taniere' => false,
                'niveaux_hierarchiques' => 3,
                'actif' => true,
            ],
            [
                'nom_region' => 'Est',
                'code_region' => 'EST',
                'est_taniere' => false,
                'niveaux_hierarchiques' => 3,
                'actif' => true,
            ],
        ];

        DB::connection('mysql')->table('regions')->insert($regions);
    }
}
```

**BranchesSeeder :**
```php
namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class BranchesSeeder extends Seeder
{
    public function run()
    {
        $branches = [
            [
                'id_branche' => 1,
                'nom_branche' => 'Commerciale',
                'code_branche' => 'COM',
                'description' => 'Branche commerciale - Ventes et distribution',
                'actif' => true,
            ],
            [
                'id_branche' => 2,
                'nom_branche' => 'Marketing',
                'code_branche' => 'MKT',
                'description' => 'Branche marketing - Trade marketing et sponsoring',
                'actif' => true,
            ],
        ];

        DB::connection('mysql')->table('branches')->insert($branches);
    }
}
```

### Modèles Eloquent

**Region Model :**
```php
namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Region extends Model
{
    protected $connection = 'mysql';
    protected $table = 'regions';
    protected $primaryKey = 'id_region';
    
    protected $fillable = [
        'nom_region',
        'code_region',
        'est_taniere',
        'niveaux_hierarchiques',
        'actif',
    ];
    
    protected $casts = [
        'est_taniere' => 'boolean',
        'actif' => 'boolean',
    ];
    
    // Relations
    public function utilisateurs()
    {
        return $this->hasMany(Utilisateur::class, 'id_region', 'id_region');
    }
    
    public function servicesCommerciaux()
    {
        return $this->hasMany(ServiceCommercial::class, 'id_region', 'id_region');
    }
    
    public function districts()
    {
        return $this->hasMany(District::class, 'id_region', 'id_region');
    }
    
    public function secteurs()
    {
        return $this->hasMany(Secteur::class, 'id_region', 'id_region');
    }
    
    // Scopes
    public function scopeTaniere($query)
    {
        return $query->where('est_taniere', true);
    }
    
    public function scopeNonTaniere($query)
    {
        return $query->where('est_taniere', false);
    }
    
    public function scopeActif($query)
    {
        return $query->where('actif', true);
    }
    
    // Méthodes
    public function canDelete(): bool
    {
        return $this->utilisateurs()->count() === 0;
    }
}
```

**Branche Model :**
```php
namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Branche extends Model
{
    protected $connection = 'mysql';
    protected $table = 'branches';
    protected $primaryKey = 'id_branche';
    
    protected $fillable = [
        'nom_branche',
        'code_branche',
        'description',
        'actif',
    ];
    
    protected $casts = [
        'actif' => 'boolean',
    ];
    
    // Relations
    public function roles()
    {
        return $this->hasMany(Role::class, 'id_branche', 'id_branche');
    }
    
    public function utilisateurs()
    {
        return $this->hasMany(Utilisateur::class, 'id_branche', 'id_branche');
    }
    
    public function servicesCommerciaux()
    {
        return $this->hasMany(ServiceCommercial::class, 'id_branche', 'id_branche');
    }
    
    // Méthodes
    public function canDelete(): bool
    {
        return $this->utilisateurs()->count() === 0;
    }
}
```

**ServiceCommercial Model :**
```php
namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ServiceCommercial extends Model
{
    protected $connection = 'mysql';
    protected $table = 'services_commerciaux';
    protected $primaryKey = 'id_service';
    
    protected $fillable = [
        'nom_service',
        'code_service',
        'id_region',
        'id_branche',
        'actif',
    ];
    
    protected $casts = [
        'actif' => 'boolean',
    ];
    
    // Relations
    public function region()
    {
        return $this->belongsTo(Region::class, 'id_region', 'id_region');
    }
    
    public function branche()
    {
        return $this->belongsTo(Branche::class, 'id_branche', 'id_branche');
    }
    
    public function districts()
    {
        return $this->hasMany(District::class, 'id_service', 'id_service');
    }
    
    public function secteurs()
    {
        return $this->hasMany(Secteur::class, 'id_service', 'id_service');
    }
}
```

### RegionsController

```php
namespace App\Http\Controllers\Admin;

use App\Models\Region;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class RegionsController extends Controller
{
    public function __construct()
    {
        $this->middleware(['auth:api', 'role:ADMIN']);
    }
    
    public function index()
    {
        $regions = Region::withCount('utilisateurs')
            ->orderBy('nom_region')
            ->get();
        
        return Inertia::render('Admin/Structure/Regions/Index', [
            'regions' => $regions,
        ]);
    }
    
    public function create()
    {
        return Inertia::render('Admin/Structure/Regions/Create');
    }
    
    public function store(Request $request)
    {
        $validated = $request->validate([
            'nom_region' => 'required|string|max:100|unique:regions,nom_region',
            'code_region' => 'required|string|max:10|unique:regions,code_region',
            'est_taniere' => 'required|boolean',
            'actif' => 'boolean',
        ]);
        
        // Définir niveaux hiérarchiques selon tanière
        $validated['niveaux_hierarchiques'] = $validated['est_taniere'] ? 5 : 3;
        
        $region = Region::create($validated);
        
        // Logging
        DB::connection('mysql')->table('logs_administration')->insert([
            'utilisateur_matricule' => $request->user()->matricule,
            'action' => 'region_created',
            'resultat' => 'succes',
            'details' => "Région créée : {$region->nom_region}",
            'adresse_ip' => $request->ip(),
            'date_action' => now(),
        ]);
        
        return redirect()->route('admin.regions.index')
            ->with('success', 'Région créée avec succès');
    }
    
    public function destroy(Region $region)
    {
        if (!$region->canDelete()) {
            return back()->withErrors([
                'message' => 'Impossible de supprimer cette région : des utilisateurs y sont liés'
            ]);
        }
        
        $nomRegion = $region->nom_region;
        $region->delete();
        
        // Logging
        DB::connection('mysql')->table('logs_administration')->insert([
            'utilisateur_matricule' => request()->user()->matricule,
            'action' => 'region_deleted',
            'resultat' => 'succes',
            'details' => "Région supprimée : {$nomRegion}",
            'adresse_ip' => request()->ip(),
            'date_action' => now(),
        ]);
        
        return redirect()->route('admin.regions.index')
            ->with('success', 'Région supprimée avec succès');
    }
}
```

### HierarchyController

```php
namespace App\Http\Controllers\Admin;

use App\Models\Region;
use App\Models\ServiceCommercial;
use App\Models\District;
use App\Models\Secteur;
use Illuminate\Http\Request;
use Inertia\Inertia;

class HierarchyController extends Controller
{
    public function __construct()
    {
        $this->middleware(['auth:api', 'role:ADMIN']);
    }
    
    public function index(Request $request)
    {
        $regionId = $request->query('region_id');
        
        $regions = Region::actif()->get();
        
        $hierarchy = null;
        if ($regionId) {
            $region = Region::with([
                'servicesCommerciaux.districts.secteurs',
                'servicesCommerciaux.secteurs' => function($query) {
                    $query->whereNull('id_district'); // Secteurs directs
                }
            ])->findOrFail($regionId);
            
            $hierarchy = $this->buildHierarchyTree($region);
        }
        
        return Inertia::render('Admin/Structure/Hierarchy/Index', [
            'regions' => $regions,
            'selectedRegion' => $regionId,
            'hierarchy' => $hierarchy,
        ]);
    }
    
    private function buildHierarchyTree(Region $region): array
    {
        return [
            'region' => $region->nom_region,
            'est_taniere' => $region->est_taniere,
            'niveaux' => $region->niveaux_hierarchiques,
            'services' => $region->servicesCommerciaux->map(function($service) use ($region) {
                $tree = [
                    'id' => $service->id_service,
                    'nom' => $service->nom_service,
                    'branche' => $service->branche->nom_branche,
                ];
                
                if ($region->est_taniere) {
                    // Tanière : Service → District → Secteur
                    $tree['districts'] = $service->districts->map(function($district) {
                        return [
                            'id' => $district->id_district,
                            'nom' => $district->nom_district,
                            'secteurs' => $district->secteurs->map(function($secteur) {
                                return [
                                    'id' => $secteur->id_secteur,
                                    'nom' => $secteur->nom_secteur,
                                ];
                            }),
                        ];
                    });
                } else {
                    // Non-Tanière : Service → Secteur (direct)
                    $tree['secteurs'] = $service->secteurs()
                        ->whereNull('id_district')
                        ->get()
                        ->map(function($secteur) {
                            return [
                                'id' => $secteur->id_secteur,
                                'nom' => $secteur->nom_secteur,
                            ];
                        });
                }
                
                return $tree;
            }),
        ];
    }
}
```

### Page Admin Regions Index

```tsx
// resources/js/Pages/Admin/Structure/Regions/Index.tsx
import { Region } from '@/types';
import { Badge } from '@/Components/UI/Badge';
import { Button } from '@/Components/UI/Button';
import { Card } from '@/Components/UI/Card';

interface Props {
    regions: (Region & { utilisateurs_count: number })[];
}

export default function RegionsIndex({ regions }: Props) {
    const handleDelete = (regionId: number, canDelete: boolean) => {
        if (!canDelete) {
            alert('Impossible de supprimer : des utilisateurs sont liés à cette région');
            return;
        }
        
        if (confirm('Êtes-vous sûr de vouloir supprimer cette région ?')) {
            // Inertia delete request
        }
    };
    
    return (
        <div className="p-6">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-sabc-gray-900 font-poppins">
                    Gestion des Régions SABC
                </h1>
                <Button href="/admin/structure/regions/create" className="bg-sabc-red-primary">
                    Créer une Région
                </Button>
            </div>

            <Card>
                <table className="w-full">
                    <thead>
                        <tr className="border-b border-sabc-gray-200">
                            <th className="text-left p-4">Région</th>
                            <th className="text-left p-4">Code</th>
                            <th className="text-left p-4">Type</th>
                            <th className="text-left p-4">Niveaux</th>
                            <th className="text-left p-4">Utilisateurs</th>
                            <th className="text-left p-4">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {regions.map((region) => (
                            <tr key={region.id_region} className="border-b border-sabc-gray-100">
                                <td className="p-4 font-semibold">{region.nom_region}</td>
                                <td className="p-4">
                                    <Badge variant="secondary">{region.code_region}</Badge>
                                </td>
                                <td className="p-4">
                                    <Badge variant={region.est_taniere ? 'success' : 'secondary'}>
                                        {region.est_taniere ? 'Tanière' : 'Non-Tanière'}
                                    </Badge>
                                </td>
                                <td className="p-4">
                                    <Badge>{region.niveaux_hierarchiques} niveaux</Badge>
                                </td>
                                <td className="p-4">
                                    <span className="text-sabc-gray-600">
                                        {region.utilisateurs_count} utilisateurs
                                    </span>
                                </td>
                                <td className="p-4 flex gap-2">
                                    <Button 
                                        href={`/admin/structure/regions/${region.id_region}/edit`} 
                                        size="sm"
                                    >
                                        Modifier
                                    </Button>
                                    <Button 
                                        onClick={() => handleDelete(region.id_region, region.utilisateurs_count === 0)}
                                        size="sm"
                                        variant="danger"
                                        disabled={region.utilisateurs_count > 0}
                                    >
                                        Supprimer
                                    </Button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </Card>
        </div>
    );
}
```

### Project Structure Notes

**Fichiers à créer :**
- `database/migrations/xxxx_create_regions_table.php`
- `database/migrations/xxxx_create_branches_table.php`
- `database/migrations/xxxx_create_services_commerciaux_table.php`
- `database/migrations/xxxx_create_districts_table.php`
- `database/migrations/xxxx_create_secteurs_table.php`
- `database/seeders/RegionsSeeder.php`
- `database/seeders/BranchesSeeder.php`
- `app/Models/Region.php`
- `app/Models/Branche.php`
- `app/Models/ServiceCommercial.php`
- `app/Models/District.php`
- `app/Models/Secteur.php`
- `app/Http/Controllers/Admin/RegionsController.php`
- `app/Http/Controllers/Admin/BranchesController.php`
- `app/Http/Controllers/Admin/HierarchyController.php`
- `resources/js/Pages/Admin/Structure/Regions/Index.tsx`
- `resources/js/Pages/Admin/Structure/Hierarchy/Index.tsx`

**Fichiers à modifier :**
- `routes/web.php` : Ajouter routes structure
- `database/seeders/DatabaseSeeder.php` : Appeler seeders
- `resources/js/types/index.ts` : Ajouter interfaces

**Dépendances Stories Précédentes :**
- Story 1.1 : MySQL (sabc_core) configuré
- Story 1.2 : Authentification et middleware auth:api
- Story 1.3 : Rôles SABC créés, middleware role:ADMIN

### Règles Métier SABC Critiques

**Régions Tanières vs Non-Tanières :**
- **Tanières** (Littoral, Centre) : 5 niveaux hiérarchiques
- **Non-Tanières** (Nord, Ouest, Sud, Est) : 3 niveaux hiérarchiques

**Validation Suppression :**
- Impossible de supprimer région/branche si utilisateurs liés
- Vérifier avec `canDelete()` avant suppression

**Hiérarchie Stricte :**
- Tanière : Région → Service → District → Secteur
- Non-Tanière : Région → Service → Secteur (pas de district)

### References

- [Source: epics.md#Epic 1 Story 1.4] - Acceptance criteria complets
- [Source: business-logic-rules.md#Structure Régionale] - Tanières vs Non-Tanières
- [Source: business-logic-rules.md#Chaîne de Commandement] - Hiérarchie par branche
- [Source: architecture.md#Data Models] - Structure organisationnelle
- [Source: project-context.md#Critical Implementation Rules] - TypeScript strict, Inertia pages

## Dev Agent Record

### Agent Model Used

_À remplir par le dev agent_

### Debug Log References

_À remplir par le dev agent_

### Completion Notes List

_À remplir par le dev agent_

### File List

_À remplir par le dev agent_
