# Story 1.3: Gestion des Rôles & Permissions (RBAC)

Status: ready-for-dev

## Story

En tant qu'administrateur,
Je veux créer et gérer les rôles SABC avec leurs permissions,
Afin de contrôler l'accès aux fonctionnalités selon les responsabilités.

## Acceptance Criteria

**Given** je suis connecté en tant qu'admin
**When** je crée un nouveau rôle (ex: DR, CDTT, CSC, CDV, CDS, RTM, TMO, SRMO, SS, AS)
**Then** le rôle est créé dans MySQL `roles` avec ses attributs (niveau_hierarchique, peut_cross_branch, portee_geographique)
**And** je peux assigner des permissions spécifiques au rôle (peut_auto_evaluer, peut_evaluer_pairs, peut_evaluer_subordonnes)
**And** le middleware `role:*` vérifie les permissions avant d'autoriser l'accès
**And** les rôles DR et CDTT ont `peut_cross_branch = true` et `portee_geographique = global`
**And** le rôle ADMIN a `id_branche = NULL` (hors hiérarchie)
**And** les modifications de rôles sont loggées dans `logs_administration`

## Tasks / Subtasks

- [ ] Création Table `roles` MySQL (AC: 1, 2)
  - [ ] Migration `create_roles_table.php`
  - [ ] Colonnes : id_role, nom_role, niveau_hierarchique, peut_cross_branch, portee_geographique
  - [ ] Colonnes permissions : peut_auto_evaluer, peut_evaluer_pairs, peut_evaluer_subordonnes
  - [ ] Colonne : id_branche (nullable pour ADMIN)
  - [ ] Index sur nom_role et niveau_hierarchique

- [ ] Seeding Rôles SABC (AC: 1, 4, 5)
  - [ ] Créer `RolesSeeder.php`
  - [ ] Seeder 11 rôles : ADMIN, DR, CDTT, CSC, CDV, CDS, RTM, TMO, SRMO, SS, AS
  - [ ] Configurer DR/CDTT : peut_cross_branch=true, portee_geographique=global
  - [ ] Configurer ADMIN : id_branche=NULL, niveau_hierarchique=0
  - [ ] Configurer permissions selon matrice métier SABC

- [ ] Modèle Eloquent `Role` (AC: 1, 2)
  - [ ] Créer `app/Models/Role.php`
  - [ ] Connexion MySQL (sabc_core)
  - [ ] Relations : hasMany Utilisateurs
  - [ ] Accessors pour permissions booléennes
  - [ ] Scopes : byNiveau, crossBranch, etc.

- [ ] Interface Admin CRUD Rôles (AC: 1, 2, 6)
  - [ ] Page Inertia `resources/js/Pages/Admin/Roles/Index.tsx`
  - [ ] Liste rôles avec filtres (niveau, branche)
  - [ ] Formulaire création/édition rôle
  - [ ] Checkboxes permissions (auto-évaluer, pairs, subordonnés)
  - [ ] Design SABC responsive

- [ ] RolesController (AC: 1, 2, 6)
  - [ ] Créer `app/Http/Controllers/Admin/RolesController.php`
  - [ ] Méthodes : index, create, store, edit, update, destroy
  - [ ] Validation règles métier (DR/CDTT cross-branch obligatoire)
  - [ ] Logging modifications dans `logs_administration`
  - [ ] Middleware `auth:api` + `role:ADMIN`

- [ ] Middleware `role:*` (AC: 3)
  - [ ] Créer `app/Http/Middleware/CheckRole.php`
  - [ ] Vérifier rôle utilisateur authentifié
  - [ ] Support multi-rôles : `role:DR,CDTT`
  - [ ] Retourner 403 si non autorisé
  - [ ] Enregistrer dans `app/Http/Kernel.php`

- [ ] Tests & Validation
  - [ ] Tester création rôle avec permissions
  - [ ] Tester middleware role sur routes protégées
  - [ ] Vérifier DR/CDTT ont cross-branch
  - [ ] Vérifier ADMIN hors hiérarchie
  - [ ] Tester logging modifications

## Dev Notes

### Architecture RBAC SABC

**Hiérarchie des Rôles (11 rôles) :**

**Niveau 0 (Hors hiérarchie) :**
- **ADMIN** : Gestion système complète, id_branche=NULL

**Branche Commerciale - Tanière (5 niveaux) :**
- **DR** (Directeur Régional) : Niveau 1, cross-branch, portée globale
- **CDTT** (Chef Département Trade) : Niveau 2, cross-branch, portée globale
- **CSC** (Chef Service Commercial) : Niveau 3
- **CDV** (Chef District Vente) : Niveau 4
- **CDS** (Chef de Secteur) : Niveau 5

**Branche Marketing - Tanière :**
- **RTM** (Regional Trade Marketing) : Niveau 3, unique par région
- **TMO** (Trade Marketing Operator) : Niveau 4
- **SS** (Superviseur Sponsoring) : Niveau 4
- **AS** (Assistant Superviseur Sponsoring) : Niveau 5

**Branche Marketing - Non-Tanière :**
- **SRMO** (Superviseur Régional Marketing Opérationnel) : Niveau 2, unique par région

### Matrice des Permissions

**Permissions par rôle (selon règles métier SABC) :**

| Rôle | Auto-évaluation | Évaluation Pairs | Évaluation Subordonnés | Cross-Branch | Portée |
|------|----------------|------------------|------------------------|--------------|--------|
| ADMIN | Non | Non | Non | Oui | Global |
| DR | Non | Non | Oui | Oui | Global |
| CDTT | Non | Non | Oui | Oui | Global |
| CSC | Oui | Oui | Oui | Non | Région |
| CDV | Oui | Oui | Oui | Non | Région |
| CDS | Oui | Oui | Non | Non | Région |
| RTM | Oui | Non | Oui | Non | Région |
| TMO | Oui | Oui | Oui | Non | Région |
| SRMO | Oui | Non | Oui | Non | Région |
| SS | Oui | Oui | Oui | Non | Région |
| AS | Oui | Oui | Non | Non | Région |

### Migration Table `roles`

```php
Schema::connection('mysql')->create('roles', function (Blueprint $table) {
    $table->id('id_role');
    $table->string('nom_role', 50)->unique(); // DR, CDTT, CSC, etc.
    $table->string('nom_complet', 100); // Directeur Régional, etc.
    $table->integer('niveau_hierarchique'); // 0-5
    
    // Permissions d'évaluation
    $table->boolean('peut_auto_evaluer')->default(false);
    $table->boolean('peut_evaluer_pairs')->default(false);
    $table->boolean('peut_evaluer_subordonnes')->default(false);
    
    // Portée organisationnelle
    $table->boolean('peut_cross_branch')->default(false);
    $table->enum('portee_geographique', ['region', 'global'])->default('region');
    
    // Relation branche (NULL pour ADMIN)
    $table->foreignId('id_branche')->nullable()->constrained('branches');
    
    $table->timestamps();
    
    $table->index('nom_role');
    $table->index('niveau_hierarchique');
});
```

### RolesSeeder Complet

```php
namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class RolesSeeder extends Seeder
{
    public function run()
    {
        $roles = [
            // ADMIN - Hors hiérarchie
            [
                'nom_role' => 'ADMIN',
                'nom_complet' => 'Administrateur Système',
                'niveau_hierarchique' => 0,
                'peut_auto_evaluer' => false,
                'peut_evaluer_pairs' => false,
                'peut_evaluer_subordonnes' => false,
                'peut_cross_branch' => true,
                'portee_geographique' => 'global',
                'id_branche' => null,
            ],
            
            // Branche Commerciale
            [
                'nom_role' => 'DR',
                'nom_complet' => 'Directeur Régional',
                'niveau_hierarchique' => 1,
                'peut_auto_evaluer' => false,
                'peut_evaluer_pairs' => false,
                'peut_evaluer_subordonnes' => true,
                'peut_cross_branch' => true,
                'portee_geographique' => 'global',
                'id_branche' => 1, // Commerciale
            ],
            [
                'nom_role' => 'CDTT',
                'nom_complet' => 'Chef Département Trade',
                'niveau_hierarchique' => 2,
                'peut_auto_evaluer' => false,
                'peut_evaluer_pairs' => false,
                'peut_evaluer_subordonnes' => true,
                'peut_cross_branch' => true,
                'portee_geographique' => 'global',
                'id_branche' => 1, // Commerciale
            ],
            [
                'nom_role' => 'CSC',
                'nom_complet' => 'Chef Service Commercial',
                'niveau_hierarchique' => 3,
                'peut_auto_evaluer' => true,
                'peut_evaluer_pairs' => true,
                'peut_evaluer_subordonnes' => true,
                'peut_cross_branch' => false,
                'portee_geographique' => 'region',
                'id_branche' => 1, // Commerciale
            ],
            [
                'nom_role' => 'CDV',
                'nom_complet' => 'Chef District Vente',
                'niveau_hierarchique' => 4,
                'peut_auto_evaluer' => true,
                'peut_evaluer_pairs' => true,
                'peut_evaluer_subordonnes' => true,
                'peut_cross_branch' => false,
                'portee_geographique' => 'region',
                'id_branche' => 1, // Commerciale
            ],
            [
                'nom_role' => 'CDS',
                'nom_complet' => 'Chef de Secteur',
                'niveau_hierarchique' => 5,
                'peut_auto_evaluer' => true,
                'peut_evaluer_pairs' => true,
                'peut_evaluer_subordonnes' => false,
                'peut_cross_branch' => false,
                'portee_geographique' => 'region',
                'id_branche' => 1, // Commerciale
            ],
            
            // Branche Marketing
            [
                'nom_role' => 'RTM',
                'nom_complet' => 'Regional Trade Marketing',
                'niveau_hierarchique' => 3,
                'peut_auto_evaluer' => true,
                'peut_evaluer_pairs' => false, // Unique par région
                'peut_evaluer_subordonnes' => true,
                'peut_cross_branch' => false,
                'portee_geographique' => 'region',
                'id_branche' => 2, // Marketing
            ],
            [
                'nom_role' => 'TMO',
                'nom_complet' => 'Trade Marketing Operator',
                'niveau_hierarchique' => 4,
                'peut_auto_evaluer' => true,
                'peut_evaluer_pairs' => true,
                'peut_evaluer_subordonnes' => true,
                'peut_cross_branch' => false,
                'portee_geographique' => 'region',
                'id_branche' => 2, // Marketing
            ],
            [
                'nom_role' => 'SRMO',
                'nom_complet' => 'Superviseur Régional Marketing Opérationnel',
                'niveau_hierarchique' => 2,
                'peut_auto_evaluer' => true,
                'peut_evaluer_pairs' => false, // Unique par région
                'peut_evaluer_subordonnes' => true,
                'peut_cross_branch' => false,
                'portee_geographique' => 'region',
                'id_branche' => 2, // Marketing
            ],
            [
                'nom_role' => 'SS',
                'nom_complet' => 'Superviseur Sponsoring',
                'niveau_hierarchique' => 4,
                'peut_auto_evaluer' => true,
                'peut_evaluer_pairs' => true,
                'peut_evaluer_subordonnes' => true,
                'peut_cross_branch' => false,
                'portee_geographique' => 'region',
                'id_branche' => 2, // Marketing
            ],
            [
                'nom_role' => 'AS',
                'nom_complet' => 'Assistant Superviseur Sponsoring',
                'niveau_hierarchique' => 5,
                'peut_auto_evaluer' => true,
                'peut_evaluer_pairs' => true,
                'peut_evaluer_subordonnes' => false,
                'peut_cross_branch' => false,
                'portee_geographique' => 'region',
                'id_branche' => 2, // Marketing
            ],
        ];

        DB::connection('mysql')->table('roles')->insert($roles);
    }
}
```

### Modèle Role

```php
namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Role extends Model
{
    protected $connection = 'mysql'; // sabc_core
    protected $table = 'roles';
    protected $primaryKey = 'id_role';
    
    protected $fillable = [
        'nom_role',
        'nom_complet',
        'niveau_hierarchique',
        'peut_auto_evaluer',
        'peut_evaluer_pairs',
        'peut_evaluer_subordonnes',
        'peut_cross_branch',
        'portee_geographique',
        'id_branche',
    ];
    
    protected $casts = [
        'peut_auto_evaluer' => 'boolean',
        'peut_evaluer_pairs' => 'boolean',
        'peut_evaluer_subordonnes' => 'boolean',
        'peut_cross_branch' => 'boolean',
    ];
    
    // Relations
    public function utilisateurs()
    {
        return $this->hasMany(Utilisateur::class, 'id_role', 'id_role');
    }
    
    public function branche()
    {
        return $this->belongsTo(Branche::class, 'id_branche', 'id_branche');
    }
    
    // Scopes
    public function scopeCrossBranch($query)
    {
        return $query->where('peut_cross_branch', true);
    }
    
    public function scopeByNiveau($query, int $niveau)
    {
        return $query->where('niveau_hierarchique', $niveau);
    }
}
```

### Middleware CheckRole

```php
namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;

class CheckRole
{
    public function handle(Request $request, Closure $next, ...$roles)
    {
        if (!$request->user()) {
            return response()->json(['message' => 'Non authentifié'], 401);
        }
        
        $userRole = $request->user()->role_nom;
        
        if (!in_array($userRole, $roles)) {
            return response()->json([
                'message' => 'Accès refusé. Rôle requis : ' . implode(', ', $roles)
            ], 403);
        }
        
        return $next($request);
    }
}
```

**Enregistrement dans `app/Http/Kernel.php` :**
```php
protected $middlewareAliases = [
    'auth' => \App\Http\Middleware\Authenticate::class,
    'role' => \App\Http\Middleware\CheckRole::class,
];
```

### RolesController

```php
namespace App\Http\Controllers\Admin;

use App\Models\Role;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class RolesController extends Controller
{
    public function __construct()
    {
        $this->middleware(['auth:api', 'role:ADMIN']);
    }
    
    public function index()
    {
        $roles = Role::with('branche')->orderBy('niveau_hierarchique')->get();
        
        return Inertia::render('Admin/Roles/Index', [
            'roles' => $roles,
        ]);
    }
    
    public function create()
    {
        $branches = DB::connection('mysql')->table('branches')->get();
        
        return Inertia::render('Admin/Roles/Create', [
            'branches' => $branches,
        ]);
    }
    
    public function store(Request $request)
    {
        $validated = $request->validate([
            'nom_role' => 'required|string|max:50|unique:roles,nom_role',
            'nom_complet' => 'required|string|max:100',
            'niveau_hierarchique' => 'required|integer|min:0|max:5',
            'peut_auto_evaluer' => 'boolean',
            'peut_evaluer_pairs' => 'boolean',
            'peut_evaluer_subordonnes' => 'boolean',
            'peut_cross_branch' => 'boolean',
            'portee_geographique' => 'required|in:region,global',
            'id_branche' => 'nullable|exists:branches,id_branche',
        ]);
        
        // Validation métier : DR/CDTT doivent avoir cross-branch
        if (in_array($validated['nom_role'], ['DR', 'CDTT'])) {
            $validated['peut_cross_branch'] = true;
            $validated['portee_geographique'] = 'global';
        }
        
        // ADMIN hors hiérarchie
        if ($validated['nom_role'] === 'ADMIN') {
            $validated['id_branche'] = null;
            $validated['niveau_hierarchique'] = 0;
        }
        
        $role = Role::create($validated);
        
        // Logging
        DB::connection('mysql')->table('logs_administration')->insert([
            'utilisateur_matricule' => $request->user()->matricule,
            'action' => 'role_created',
            'resultat' => 'succes',
            'details' => "Rôle créé : {$role->nom_role}",
            'adresse_ip' => $request->ip(),
            'date_action' => now(),
        ]);
        
        return redirect()->route('admin.roles.index')
            ->with('success', 'Rôle créé avec succès');
    }
    
    public function edit(Role $role)
    {
        $branches = DB::connection('mysql')->table('branches')->get();
        
        return Inertia::render('Admin/Roles/Edit', [
            'role' => $role,
            'branches' => $branches,
        ]);
    }
    
    public function update(Request $request, Role $role)
    {
        $validated = $request->validate([
            'nom_complet' => 'required|string|max:100',
            'niveau_hierarchique' => 'required|integer|min:0|max:5',
            'peut_auto_evaluer' => 'boolean',
            'peut_evaluer_pairs' => 'boolean',
            'peut_evaluer_subordonnes' => 'boolean',
            'peut_cross_branch' => 'boolean',
            'portee_geographique' => 'required|in:region,global',
            'id_branche' => 'nullable|exists:branches,id_branche',
        ]);
        
        $role->update($validated);
        
        // Logging
        DB::connection('mysql')->table('logs_administration')->insert([
            'utilisateur_matricule' => $request->user()->matricule,
            'action' => 'role_updated',
            'resultat' => 'succes',
            'details' => "Rôle modifié : {$role->nom_role}",
            'adresse_ip' => $request->ip(),
            'date_action' => now(),
        ]);
        
        return redirect()->route('admin.roles.index')
            ->with('success', 'Rôle mis à jour avec succès');
    }
}
```

### Page Admin Roles Index

```tsx
// resources/js/Pages/Admin/Roles/Index.tsx
import { Role } from '@/types';
import { Badge } from '@/Components/UI/Badge';
import { Button } from '@/Components/UI/Button';
import { Card } from '@/Components/UI/Card';

interface Props {
    roles: Role[];
}

export default function RolesIndex({ roles }: Props) {
    return (
        <div className="p-6">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-sabc-gray-900 font-poppins">
                    Gestion des Rôles SABC
                </h1>
                <Button href="/admin/roles/create" className="bg-sabc-red-primary">
                    Créer un Rôle
                </Button>
            </div>

            <Card>
                <table className="w-full">
                    <thead>
                        <tr className="border-b border-sabc-gray-200">
                            <th className="text-left p-4">Rôle</th>
                            <th className="text-left p-4">Niveau</th>
                            <th className="text-left p-4">Permissions</th>
                            <th className="text-left p-4">Portée</th>
                            <th className="text-left p-4">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {roles.map((role) => (
                            <tr key={role.id_role} className="border-b border-sabc-gray-100">
                                <td className="p-4">
                                    <div className="font-semibold">{role.nom_role}</div>
                                    <div className="text-sm text-sabc-gray-400">{role.nom_complet}</div>
                                </td>
                                <td className="p-4">
                                    <Badge variant="secondary">Niveau {role.niveau_hierarchique}</Badge>
                                </td>
                                <td className="p-4">
                                    <div className="flex gap-2 flex-wrap">
                                        {role.peut_auto_evaluer && <Badge>Auto</Badge>}
                                        {role.peut_evaluer_pairs && <Badge>Pairs</Badge>}
                                        {role.peut_evaluer_subordonnes && <Badge>Subordonnés</Badge>}
                                    </div>
                                </td>
                                <td className="p-4">
                                    <Badge variant={role.peut_cross_branch ? 'success' : 'secondary'}>
                                        {role.portee_geographique}
                                    </Badge>
                                </td>
                                <td className="p-4">
                                    <Button href={`/admin/roles/${role.id_role}/edit`} size="sm">
                                        Modifier
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
- `database/migrations/xxxx_create_roles_table.php` : Table roles
- `database/seeders/RolesSeeder.php` : Seeder 11 rôles SABC
- `app/Models/Role.php` : Modèle Eloquent
- `app/Http/Controllers/Admin/RolesController.php` : CRUD rôles
- `app/Http/Middleware/CheckRole.php` : Middleware vérification rôle
- `resources/js/Pages/Admin/Roles/Index.tsx` : Liste rôles
- `resources/js/Pages/Admin/Roles/Create.tsx` : Formulaire création
- `resources/js/Pages/Admin/Roles/Edit.tsx` : Formulaire édition
- `resources/js/types/index.ts` : Ajouter interface Role

**Fichiers à modifier :**
- `app/Http/Kernel.php` : Enregistrer middleware `role`
- `routes/web.php` : Ajouter routes admin/roles
- `database/seeders/DatabaseSeeder.php` : Appeler RolesSeeder

**Dépendances Stories Précédentes :**
- Story 1.1 : MySQL (sabc_core) configuré
- Story 1.2 : Authentification et middleware auth:api

### Règles Métier SABC Critiques

**Validation Cross-Branch :**
- DR et CDTT **DOIVENT** avoir `peut_cross_branch = true`
- Portée géographique **DOIT** être `global` pour DR/CDTT

**Hiérarchie Stricte :**
- ADMIN : Niveau 0, hors hiérarchie, id_branche=NULL
- Niveaux 1-5 : Selon organigramme SABC

**Permissions Évaluation :**
- Respecter matrice des permissions (voir tableau ci-dessus)
- RTM et SRMO : Uniques par région, pas d'évaluation pairs

### References

- [Source: epics.md#Epic 1 Story 1.3] - Acceptance criteria complets
- [Source: business-logic-rules.md#Organisation Interne] - Hiérarchie et rôles SABC
- [Source: business-logic-rules.md#Règles d'Évaluation] - Matrice permissions
- [Source: architecture.md#Security Governance] - RBAC strict, logging
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
