# Story 1.5: Gestion Hiérarchique des Utilisateurs

Status: ready-for-dev

## Story

En tant qu'administrateur,
Je veux créer et gérer les utilisateurs avec leurs attributs organisationnels,
Afin de maintenir la structure hiérarchique SABC.

## Acceptance Criteria

**Given** je suis connecté en tant qu'admin
**When** je crée un utilisateur avec matricule, nom, prénom, email, région, branche, rôle, manager
**Then** l'utilisateur est créé dans MySQL `utilisateurs` avec tous ses attributs organisationnels
**And** le système valide que le manager existe et appartient à la même `id_region`
**And** le système valide la cohérence hiérarchique (niveau manager > niveau subordonné)
**And** la supervision inter-branche est autorisée uniquement pour DR et CDTT (`peut_cross_branch = true`)
**And** je peux désactiver un utilisateur sans le supprimer (soft delete)
**And** les modifications conséquentes (matricule, région, branche, manager, rôle) sont réservées à l'admin
**And** toutes les actions admin sont loggées dans `logs_administration` avec adresse IP

## Tasks / Subtasks

- [ ] Création Table `utilisateurs` MySQL (AC: 1)
  - [ ] Migration `create_utilisateurs_table.php`
  - [ ] Colonnes identité : matricule (PK), nom, prenom, email, password
  - [ ] Colonnes organisationnelles : id_region, id_branche, id_role, manager_matricule
  - [ ] Colonnes hiérarchie : id_service, id_district, id_secteur (nullable)
  - [ ] Soft delete : deleted_at, actif
  - [ ] Timestamps et indexes

- [ ] Modèle Eloquent `Utilisateur` (AC: 1, 2, 3, 4)
  - [ ] Créer `app/Models/Utilisateur.php`
  - [ ] Connexion MySQL (sabc_core)
  - [ ] Traits : HasApiTokens, SoftDeletes
  - [ ] Relations : role, region, branche, manager, subordonnes
  - [ ] Scopes : actif, byRegion, byRole
  - [ ] Accessors : nom_complet, role_nom

- [ ] Service de Validation Hiérarchique (AC: 2, 3, 4)
  - [ ] Créer `app/Services/HierarchyValidationService.php`
  - [ ] Méthode `validateManager()` : même région, niveau supérieur
  - [ ] Méthode `validateCrossBranch()` : DR/CDTT uniquement
  - [ ] Méthode `validateHierarchyLevel()` : cohérence niveaux
  - [ ] Exceptions personnalisées pour erreurs métier

- [ ] Interface Admin CRUD Utilisateurs (AC: 1, 5, 6)
  - [ ] Page `resources/js/Pages/Admin/Utilisateurs/Index.tsx`
  - [ ] Liste utilisateurs avec filtres (région, branche, rôle, statut)
  - [ ] Formulaire création avec tous les champs organisationnels
  - [ ] Formulaire édition avec restrictions (admin seul pour champs critiques)
  - [ ] Action désactivation (soft delete) sans suppression
  - [ ] Design SABC responsive

- [ ] UtilisateursController (AC: 1, 2, 3, 4, 5, 6, 7)
  - [ ] Créer `app/Http/Controllers/Admin/UtilisateursController.php`
  - [ ] Méthodes CRUD complètes avec validation hiérarchique
  - [ ] Validation manager (même région, niveau supérieur)
  - [ ] Validation cross-branch (DR/CDTT uniquement)
  - [ ] Soft delete pour désactivation
  - [ ] Logging toutes actions dans `logs_administration`
  - [ ] Middleware `auth:api` + `role:ADMIN`

- [ ] Seeder Utilisateurs de Test (AC: 1)
  - [ ] Créer `UtilisateursSeeder.php`
  - [ ] Seeder utilisateurs pour chaque rôle SABC
  - [ ] Respecter hiérarchie (managers avant subordonnés)
  - [ ] Répartir dans différentes régions et branches

- [ ] Tests & Validation
  - [ ] Tester création utilisateur avec tous attributs
  - [ ] Tester validation manager (même région)
  - [ ] Tester validation hiérarchique (niveau manager > subordonné)
  - [ ] Tester cross-branch (DR/CDTT autorisés)
  - [ ] Tester soft delete (désactivation)
  - [ ] Tester restrictions édition (admin seul)

## Dev Notes

### Architecture Gestion Utilisateurs

**Attributs Organisationnels Utilisateur :**
- **Identité** : matricule (PK), nom, prenom, email, password
- **Hiérarchie** : id_region, id_branche, id_role, manager_matricule
- **Affectation** : id_service, id_district, id_secteur (selon niveau)
- **Statut** : actif, deleted_at (soft delete)

**Règles de Validation Hiérarchique :**
1. Manager doit exister et être actif
2. Manager et subordonné dans même `id_region`
3. Niveau hiérarchique manager > niveau subordonné
4. Cross-branch autorisé uniquement pour DR/CDTT
5. Soft delete : `deleted_at` non null, `actif = false`

### Migration Table `utilisateurs`

```php
Schema::connection('mysql')->create('utilisateurs', function (Blueprint $table) {
    // Identité
    $table->string('matricule', 20)->primary();
    $table->string('nom', 100);
    $table->string('prenom', 100);
    $table->string('email', 150)->unique();
    $table->string('password');
    
    // Organisation
    $table->foreignId('id_region')->constrained('regions', 'id_region')->onDelete('restrict');
    $table->foreignId('id_branche')->constrained('branches', 'id_branche')->onDelete('restrict');
    $table->foreignId('id_role')->constrained('roles', 'id_role')->onDelete('restrict');
    
    // Hiérarchie
    $table->string('manager_matricule', 20)->nullable();
    $table->foreign('manager_matricule')->references('matricule')->on('utilisateurs')->onDelete('set null');
    
    // Affectation géographique (selon niveau)
    $table->foreignId('id_service')->nullable()->constrained('services_commerciaux', 'id_service')->onDelete('set null');
    $table->foreignId('id_district')->nullable()->constrained('districts', 'id_district')->onDelete('set null');
    $table->foreignId('id_secteur')->nullable()->constrained('secteurs', 'id_secteur')->onDelete('set null');
    
    // Statut
    $table->boolean('actif')->default(true);
    $table->softDeletes(); // deleted_at
    $table->rememberToken();
    $table->timestamps();
    
    // Index
    $table->index(['id_region', 'id_branche']);
    $table->index('manager_matricule');
    $table->index('id_role');
    $table->index('actif');
});
```

### Modèle Utilisateur

```php
namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Laravel\Passport\HasApiTokens;

class Utilisateur extends Authenticatable
{
    use HasApiTokens, SoftDeletes;
    
    protected $connection = 'mysql'; // sabc_core
    protected $table = 'utilisateurs';
    protected $primaryKey = 'matricule';
    public $incrementing = false;
    protected $keyType = 'string';
    
    protected $fillable = [
        'matricule',
        'nom',
        'prenom',
        'email',
        'password',
        'id_region',
        'id_branche',
        'id_role',
        'manager_matricule',
        'id_service',
        'id_district',
        'id_secteur',
        'actif',
    ];
    
    protected $hidden = [
        'password',
        'remember_token',
    ];
    
    protected $casts = [
        'actif' => 'boolean',
    ];
    
    // Relations
    public function role()
    {
        return $this->belongsTo(Role::class, 'id_role', 'id_role');
    }
    
    public function region()
    {
        return $this->belongsTo(Region::class, 'id_region', 'id_region');
    }
    
    public function branche()
    {
        return $this->belongsTo(Branche::class, 'id_branche', 'id_branche');
    }
    
    public function manager()
    {
        return $this->belongsTo(Utilisateur::class, 'manager_matricule', 'matricule');
    }
    
    public function subordonnes()
    {
        return $this->hasMany(Utilisateur::class, 'manager_matricule', 'matricule');
    }
    
    public function service()
    {
        return $this->belongsTo(ServiceCommercial::class, 'id_service', 'id_service');
    }
    
    public function district()
    {
        return $this->belongsTo(District::class, 'id_district', 'id_district');
    }
    
    public function secteur()
    {
        return $this->belongsTo(Secteur::class, 'id_secteur', 'id_secteur');
    }
    
    // Scopes
    public function scopeActif($query)
    {
        return $query->where('actif', true)->whereNull('deleted_at');
    }
    
    public function scopeByRegion($query, int $regionId)
    {
        return $query->where('id_region', $regionId);
    }
    
    public function scopeByRole($query, int $roleId)
    {
        return $query->where('id_role', $roleId);
    }
    
    // Accessors
    public function getNomCompletAttribute(): string
    {
        return "{$this->prenom} {$this->nom}";
    }
    
    public function getRoleNomAttribute(): string
    {
        return $this->role->nom_role ?? '';
    }
}
```

### HierarchyValidationService

```php
namespace App\Services;

use App\Models\Utilisateur;
use App\Models\Role;
use App\Exceptions\HierarchyValidationException;

class HierarchyValidationService
{
    /**
     * Valider que le manager existe et appartient à la même région
     */
    public function validateManager(string $managerMatricule, int $regionId): void
    {
        $manager = Utilisateur::actif()->find($managerMatricule);
        
        if (!$manager) {
            throw new HierarchyValidationException(
                "Le manager avec matricule {$managerMatricule} n'existe pas ou est inactif"
            );
        }
        
        if ($manager->id_region !== $regionId) {
            throw new HierarchyValidationException(
                "Le manager doit appartenir à la même région que le subordonné"
            );
        }
    }
    
    /**
     * Valider la cohérence des niveaux hiérarchiques
     */
    public function validateHierarchyLevel(int $managerRoleId, int $subordonneRoleId): void
    {
        $managerRole = Role::find($managerRoleId);
        $subordonneRole = Role::find($subordonneRoleId);
        
        if (!$managerRole || !$subordonneRole) {
            throw new HierarchyValidationException("Rôle invalide");
        }
        
        if ($managerRole->niveau_hierarchique >= $subordonneRole->niveau_hierarchique) {
            throw new HierarchyValidationException(
                "Le niveau hiérarchique du manager ({$managerRole->niveau_hierarchique}) " .
                "doit être inférieur au niveau du subordonné ({$subordonneRole->niveau_hierarchique})"
            );
        }
    }
    
    /**
     * Valider la supervision inter-branche (DR/CDTT uniquement)
     */
    public function validateCrossBranch(int $managerRoleId, int $managerBrancheId, int $subordonneBrancheId): void
    {
        if ($managerBrancheId === $subordonneBrancheId) {
            return; // Même branche, OK
        }
        
        $managerRole = Role::find($managerRoleId);
        
        if (!$managerRole || !$managerRole->peut_cross_branch) {
            throw new HierarchyValidationException(
                "La supervision inter-branche est autorisée uniquement pour les rôles DR et CDTT"
            );
        }
    }
    
    /**
     * Validation complète lors de la création/modification d'utilisateur
     */
    public function validateUserHierarchy(array $userData, ?string $currentMatricule = null): void
    {
        if (empty($userData['manager_matricule'])) {
            return; // Pas de manager (ex: DR)
        }
        
        // Valider manager existe et même région
        $this->validateManager($userData['manager_matricule'], $userData['id_region']);
        
        $manager = Utilisateur::find($userData['manager_matricule']);
        
        // Valider niveaux hiérarchiques
        $this->validateHierarchyLevel($manager->id_role, $userData['id_role']);
        
        // Valider cross-branch si nécessaire
        $this->validateCrossBranch(
            $manager->id_role,
            $manager->id_branche,
            $userData['id_branche']
        );
    }
}
```

### UtilisateursController

```php
namespace App\Http\Controllers\Admin;

use App\Models\Utilisateur;
use App\Models\Role;
use App\Models\Region;
use App\Models\Branche;
use App\Services\HierarchyValidationService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Inertia\Inertia;

class UtilisateursController extends Controller
{
    protected $hierarchyService;
    
    public function __construct(HierarchyValidationService $hierarchyService)
    {
        $this->middleware(['auth:api', 'role:ADMIN']);
        $this->hierarchyService = $hierarchyService;
    }
    
    public function index(Request $request)
    {
        $query = Utilisateur::with(['role', 'region', 'branche', 'manager'])
            ->withTrashed(); // Inclure soft deleted
        
        // Filtres
        if ($request->filled('region_id')) {
            $query->where('id_region', $request->region_id);
        }
        
        if ($request->filled('branche_id')) {
            $query->where('id_branche', $request->branche_id);
        }
        
        if ($request->filled('role_id')) {
            $query->where('id_role', $request->role_id);
        }
        
        if ($request->filled('statut')) {
            if ($request->statut === 'actif') {
                $query->actif();
            } elseif ($request->statut === 'inactif') {
                $query->where('actif', false)->orWhereNotNull('deleted_at');
            }
        }
        
        $utilisateurs = $query->orderBy('nom')->paginate(50);
        
        return Inertia::render('Admin/Utilisateurs/Index', [
            'utilisateurs' => $utilisateurs,
            'regions' => Region::actif()->get(),
            'branches' => Branche::where('actif', true)->get(),
            'roles' => Role::all(),
        ]);
    }
    
    public function create()
    {
        return Inertia::render('Admin/Utilisateurs/Create', [
            'regions' => Region::actif()->get(),
            'branches' => Branche::where('actif', true)->get(),
            'roles' => Role::all(),
            'managers' => Utilisateur::actif()->get(['matricule', 'nom', 'prenom', 'id_role']),
        ]);
    }
    
    public function store(Request $request)
    {
        $validated = $request->validate([
            'matricule' => 'required|string|max:20|unique:utilisateurs,matricule',
            'nom' => 'required|string|max:100',
            'prenom' => 'required|string|max:100',
            'email' => 'required|email|max:150|unique:utilisateurs,email',
            'password' => 'required|string|min:8|confirmed',
            'id_region' => 'required|exists:regions,id_region',
            'id_branche' => 'required|exists:branches,id_branche',
            'id_role' => 'required|exists:roles,id_role',
            'manager_matricule' => 'nullable|exists:utilisateurs,matricule',
            'id_service' => 'nullable|exists:services_commerciaux,id_service',
            'id_district' => 'nullable|exists:districts,id_district',
            'id_secteur' => 'nullable|exists:secteurs,id_secteur',
        ]);
        
        // Validation hiérarchique
        try {
            $this->hierarchyService->validateUserHierarchy($validated);
        } catch (\Exception $e) {
            return back()->withErrors(['hierarchy' => $e->getMessage()]);
        }
        
        // Hash password
        $validated['password'] = Hash::make($validated['password']);
        $validated['actif'] = true;
        
        $utilisateur = Utilisateur::create($validated);
        
        // Logging
        DB::connection('mysql')->table('logs_administration')->insert([
            'utilisateur_matricule' => $request->user()->matricule,
            'action' => 'user_created',
            'resultat' => 'succes',
            'details' => "Utilisateur créé : {$utilisateur->matricule} - {$utilisateur->nom_complet}",
            'adresse_ip' => $request->ip(),
            'date_action' => now(),
        ]);
        
        return redirect()->route('admin.utilisateurs.index')
            ->with('success', 'Utilisateur créé avec succès');
    }
    
    public function edit(Utilisateur $utilisateur)
    {
        $utilisateur->load(['role', 'region', 'branche', 'manager']);
        
        return Inertia::render('Admin/Utilisateurs/Edit', [
            'utilisateur' => $utilisateur,
            'regions' => Region::actif()->get(),
            'branches' => Branche::where('actif', true)->get(),
            'roles' => Role::all(),
            'managers' => Utilisateur::actif()
                ->where('matricule', '!=', $utilisateur->matricule)
                ->get(['matricule', 'nom', 'prenom', 'id_role']),
        ]);
    }
    
    public function update(Request $request, Utilisateur $utilisateur)
    {
        $validated = $request->validate([
            'nom' => 'required|string|max:100',
            'prenom' => 'required|string|max:100',
            'email' => 'required|email|max:150|unique:utilisateurs,email,' . $utilisateur->matricule . ',matricule',
            // Champs critiques (admin seul)
            'matricule' => 'required|string|max:20|unique:utilisateurs,matricule,' . $utilisateur->matricule . ',matricule',
            'id_region' => 'required|exists:regions,id_region',
            'id_branche' => 'required|exists:branches,id_branche',
            'id_role' => 'required|exists:roles,id_role',
            'manager_matricule' => 'nullable|exists:utilisateurs,matricule',
            'id_service' => 'nullable|exists:services_commerciaux,id_service',
            'id_district' => 'nullable|exists:districts,id_district',
            'id_secteur' => 'nullable|exists:secteurs,id_secteur',
        ]);
        
        // Validation hiérarchique
        try {
            $this->hierarchyService->validateUserHierarchy($validated, $utilisateur->matricule);
        } catch (\Exception $e) {
            return back()->withErrors(['hierarchy' => $e->getMessage()]);
        }
        
        $utilisateur->update($validated);
        
        // Logging
        DB::connection('mysql')->table('logs_administration')->insert([
            'utilisateur_matricule' => $request->user()->matricule,
            'action' => 'user_updated',
            'resultat' => 'succes',
            'details' => "Utilisateur modifié : {$utilisateur->matricule}",
            'adresse_ip' => $request->ip(),
            'date_action' => now(),
        ]);
        
        return redirect()->route('admin.utilisateurs.index')
            ->with('success', 'Utilisateur mis à jour avec succès');
    }
    
    public function destroy(Utilisateur $utilisateur)
    {
        // Soft delete
        $utilisateur->actif = false;
        $utilisateur->save();
        $utilisateur->delete();
        
        // Logging
        DB::connection('mysql')->table('logs_administration')->insert([
            'utilisateur_matricule' => request()->user()->matricule,
            'action' => 'user_deactivated',
            'resultat' => 'succes',
            'details' => "Utilisateur désactivé : {$utilisateur->matricule}",
            'adresse_ip' => request()->ip(),
            'date_action' => now(),
        ]);
        
        return redirect()->route('admin.utilisateurs.index')
            ->with('success', 'Utilisateur désactivé avec succès');
    }
    
    public function restore(string $matricule)
    {
        $utilisateur = Utilisateur::withTrashed()->findOrFail($matricule);
        
        $utilisateur->actif = true;
        $utilisateur->restore();
        
        // Logging
        DB::connection('mysql')->table('logs_administration')->insert([
            'utilisateur_matricule' => request()->user()->matricule,
            'action' => 'user_restored',
            'resultat' => 'succes',
            'details' => "Utilisateur réactivé : {$utilisateur->matricule}",
            'adresse_ip' => request()->ip(),
            'date_action' => now(),
        ]);
        
        return redirect()->route('admin.utilisateurs.index')
            ->with('success', 'Utilisateur réactivé avec succès');
    }
}
```

### Page Admin Utilisateurs Index

```tsx
// resources/js/Pages/Admin/Utilisateurs/Index.tsx
import { Utilisateur, Region, Branche, Role } from '@/types';
import { Badge } from '@/Components/UI/Badge';
import { Button } from '@/Components/UI/Button';
import { Card } from '@/Components/UI/Card';
import { Select } from '@/Components/UI/Select';
import { useState } from 'react';
import { router } from '@inertiajs/react';

interface Props {
    utilisateurs: {
        data: Utilisateur[];
        current_page: number;
        last_page: number;
    };
    regions: Region[];
    branches: Branche[];
    roles: Role[];
}

export default function UtilisateursIndex({ utilisateurs, regions, branches, roles }: Props) {
    const [filters, setFilters] = useState({
        region_id: '',
        branche_id: '',
        role_id: '',
        statut: '',
    });
    
    const handleFilterChange = (key: string, value: string) => {
        const newFilters = { ...filters, [key]: value };
        setFilters(newFilters);
        router.get('/admin/utilisateurs', newFilters, { preserveState: true });
    };
    
    return (
        <div className="p-6">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-sabc-gray-900 font-poppins">
                    Gestion des Utilisateurs SABC
                </h1>
                <Button href="/admin/utilisateurs/create" className="bg-sabc-red-primary">
                    Créer un Utilisateur
                </Button>
            </div>

            {/* Filtres */}
            <Card className="mb-6">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4">
                    <Select
                        value={filters.region_id}
                        onChange={(e) => handleFilterChange('region_id', e.target.value)}
                    >
                        <option value="">Toutes les régions</option>
                        {regions.map((region) => (
                            <option key={region.id_region} value={region.id_region}>
                                {region.nom_region}
                            </option>
                        ))}
                    </Select>
                    
                    <Select
                        value={filters.branche_id}
                        onChange={(e) => handleFilterChange('branche_id', e.target.value)}
                    >
                        <option value="">Toutes les branches</option>
                        {branches.map((branche) => (
                            <option key={branche.id_branche} value={branche.id_branche}>
                                {branche.nom_branche}
                            </option>
                        ))}
                    </Select>
                    
                    <Select
                        value={filters.role_id}
                        onChange={(e) => handleFilterChange('role_id', e.target.value)}
                    >
                        <option value="">Tous les rôles</option>
                        {roles.map((role) => (
                            <option key={role.id_role} value={role.id_role}>
                                {role.nom_role}
                            </option>
                        ))}
                    </Select>
                    
                    <Select
                        value={filters.statut}
                        onChange={(e) => handleFilterChange('statut', e.target.value)}
                    >
                        <option value="">Tous les statuts</option>
                        <option value="actif">Actifs</option>
                        <option value="inactif">Inactifs</option>
                    </Select>
                </div>
            </Card>

            {/* Liste utilisateurs */}
            <Card>
                <table className="w-full">
                    <thead>
                        <tr className="border-b border-sabc-gray-200">
                            <th className="text-left p-4">Matricule</th>
                            <th className="text-left p-4">Nom Complet</th>
                            <th className="text-left p-4">Rôle</th>
                            <th className="text-left p-4">Région</th>
                            <th className="text-left p-4">Branche</th>
                            <th className="text-left p-4">Manager</th>
                            <th className="text-left p-4">Statut</th>
                            <th className="text-left p-4">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {utilisateurs.data.map((user) => (
                            <tr key={user.matricule} className="border-b border-sabc-gray-100">
                                <td className="p-4">
                                    <Badge variant="secondary">{user.matricule}</Badge>
                                </td>
                                <td className="p-4">
                                    <div className="font-semibold">{user.nom_complet}</div>
                                    <div className="text-sm text-sabc-gray-400">{user.email}</div>
                                </td>
                                <td className="p-4">
                                    <Badge>{user.role?.nom_role}</Badge>
                                </td>
                                <td className="p-4">{user.region?.nom_region}</td>
                                <td className="p-4">{user.branche?.nom_branche}</td>
                                <td className="p-4">
                                    {user.manager ? (
                                        <span className="text-sm">{user.manager.nom_complet}</span>
                                    ) : (
                                        <span className="text-sabc-gray-400">-</span>
                                    )}
                                </td>
                                <td className="p-4">
                                    <Badge variant={user.actif && !user.deleted_at ? 'success' : 'danger'}>
                                        {user.actif && !user.deleted_at ? 'Actif' : 'Inactif'}
                                    </Badge>
                                </td>
                                <td className="p-4 flex gap-2">
                                    <Button 
                                        href={`/admin/utilisateurs/${user.matricule}/edit`} 
                                        size="sm"
                                    >
                                        Modifier
                                    </Button>
                                    {user.actif && !user.deleted_at ? (
                                        <Button size="sm" variant="danger">
                                            Désactiver
                                        </Button>
                                    ) : (
                                        <Button size="sm" variant="success">
                                            Réactiver
                                        </Button>
                                    )}
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
- `database/migrations/xxxx_create_utilisateurs_table.php`
- `database/seeders/UtilisateursSeeder.php`
- `app/Models/Utilisateur.php`
- `app/Services/HierarchyValidationService.php`
- `app/Exceptions/HierarchyValidationException.php`
- `app/Http/Controllers/Admin/UtilisateursController.php`
- `resources/js/Pages/Admin/Utilisateurs/Index.tsx`
- `resources/js/Pages/Admin/Utilisateurs/Create.tsx`
- `resources/js/Pages/Admin/Utilisateurs/Edit.tsx`

**Fichiers à modifier :**
- `routes/web.php` : Ajouter routes utilisateurs
- `database/seeders/DatabaseSeeder.php` : Appeler UtilisateursSeeder
- `resources/js/types/index.ts` : Ajouter interface Utilisateur
- `app/Http/Kernel.php` : Déjà configuré (Story 1.3)

**Dépendances Stories Précédentes :**
- Story 1.1 : MySQL (sabc_core) configuré
- Story 1.2 : Authentification Laravel Passport
- Story 1.3 : Rôles SABC créés, middleware role:ADMIN
- Story 1.4 : Régions, branches, structure organisationnelle

### Règles Métier SABC Critiques

**Validation Hiérarchique :**
- Manager et subordonné dans même `id_region`
- Niveau hiérarchique manager < niveau subordonné
- Cross-branch autorisé uniquement pour DR/CDTT

**Soft Delete :**
- Désactivation : `actif = false` + `deleted_at` non null
- Pas de suppression physique des utilisateurs
- Réactivation possible par admin

**Restrictions Édition :**
- Champs critiques (matricule, région, branche, rôle, manager) : Admin seul
- Champs personnels (nom, prénom, email) : Utilisateur peut modifier (Story 1.6)

### References

- [Source: epics.md#Epic 1 Story 1.5] - Acceptance criteria complets
- [Source: business-logic-rules.md#Chaîne de Commandement] - Hiérarchie par branche
- [Source: business-logic-rules.md#Règles de Liens Hiérarchiques] - Validation manager
- [Source: architecture.md#Data Models] - Structure utilisateurs
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
