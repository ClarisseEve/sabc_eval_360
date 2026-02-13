# Story 2.2: Configuration des Éligibilités d'Évaluation

Status: ready-for-dev

## Story

En tant qu'administrateur,
Je veux configurer qui peut évaluer qui selon les règles SABC,
Afin d'appliquer les permissions d'évaluation (auto/pairs/descendante).

## Acceptance Criteria

**Given** je configure une règle d'évaluation
**When** je définis les éligibilités (auto-évaluation, évaluation pairs, évaluation descendante)
**Then** les flags `peut_auto_evaluer`, `peut_evaluer_pairs`, `peut_evaluer_subordonnes` sont configurés par rôle
**And** l'auto-évaluation est autorisée uniquement pour les rôles avec `peut_auto_evaluer = true`
**And** l'évaluation pairs requiert même `niveau_hierarchique`, même `id_region`, même `id_branche`
**And** l'évaluation descendante requiert lien hiérarchique direct (`manager_matricule`)
**And** les rôles uniques par région (DR, CDTT, RTM, SRMO) ne peuvent pas évaluer leurs pairs

## Tasks / Subtasks

- [ ] Service EligibilityService (AC: 1, 2, 3, 4, 5, 6)
  - [ ] Créer `app/Services/EligibilityService.php`
  - [ ] Méthode `canAutoEvaluate()` : Vérifier `peut_auto_evaluer` du rôle
  - [ ] Méthode `canEvaluatePeer()` : Même niveau, région, branche + pas rôle unique
  - [ ] Méthode `canEvaluateSubordinate()` : Lien hiérarchique direct
  - [ ] Méthode `getEligibleEvaluators()` : Liste évaluateurs éligibles pour un utilisateur
  - [ ] Méthode `getEligibleEvaluees()` : Liste évalués éligibles pour un évaluateur

- [ ] Validation Éligibilité dans Règles (AC: 1, 2, 3, 4, 5, 6)
  - [ ] Intégrer EligibilityService dans RegleEvaluation
  - [ ] Méthode `getEligibleUsersForRule()` : Utilisateurs éligibles pour une règle
  - [ ] Filtrage automatique selon permissions rôle
  - [ ] Cache Redis pour performance

- [ ] Interface Admin Configuration Éligibilités (AC: 1)
  - [ ] Page `resources/js/Pages/Admin/Evaluations/Eligibilites/Index.tsx`
  - [ ] Vue matrice permissions par rôle
  - [ ] Affichage flags : auto-évaluation, pairs, subordonnés
  - [ ] Indicateurs visuels : rôles uniques (DR, CDTT, RTM, SRMO)
  - [ ] Design SABC responsive

- [ ] Composant MatriceEligibilites (AC: 1, 2, 3, 4, 5, 6)
  - [ ] Créer `resources/js/Components/Evaluations/MatriceEligibilites.tsx`
  - [ ] Tableau 11 rôles × 3 permissions
  - [ ] Badges visuels : ✅ Autorisé, ❌ Interdit
  - [ ] Légende : Rôles uniques, Cross-branch
  - [ ] Responsive mobile

- [ ] EligibilitesController (AC: 1)
  - [ ] Créer `app/Http/Controllers/Admin/EligibilitesController.php`
  - [ ] Méthode `index()` : Afficher matrice permissions
  - [ ] Méthode `getEligibleUsers()` : API pour obtenir utilisateurs éligibles
  - [ ] Middleware `auth:api` + `role:ADMIN`

- [ ] Tests & Validation
  - [ ] Tester auto-évaluation selon `peut_auto_evaluer`
  - [ ] Tester évaluation pairs (même niveau, région, branche)
  - [ ] Tester évaluation descendante (lien hiérarchique)
  - [ ] Tester exclusion rôles uniques (DR, CDTT, RTM, SRMO)
  - [ ] Tester filtrage automatique éligibilités

## Dev Notes

### Architecture Éligibilités d'Évaluation

**Types d'Évaluation :**
1. **Auto-évaluation** : Utilisateur évalue lui-même
2. **Évaluation pairs** : Utilisateur évalue collègue même niveau
3. **Évaluation descendante** : Manager évalue subordonné direct

**Règles d'Éligibilité :**
- **Auto-évaluation** : `role.peut_auto_evaluer = true`
- **Pairs** : Même `niveau_hierarchique`, `id_region`, `id_branche` + Pas rôle unique
- **Descendante** : `evaluateur.matricule = evalue.manager_matricule`

**Rôles Uniques par Région (Pas d'évaluation pairs) :**
- DR : Directeur Régional
- CDTT : Chef Département Trade
- RTM : Regional Trade Marketing
- SRMO : Superviseur Régional Marketing Opérationnel

### Matrice Permissions SABC (Rappel Story 1.3)

| Rôle | Auto-évaluation | Évaluation Pairs | Évaluation Subordonnés | Rôle Unique |
|------|----------------|------------------|------------------------|-------------|
| ADMIN | ❌ Non | ❌ Non | ❌ Non | Oui |
| DR | ❌ Non | ❌ Non | ✅ Oui | Oui |
| CDTT | ❌ Non | ❌ Non | ✅ Oui | Oui |
| CSC | ✅ Oui | ✅ Oui | ✅ Oui | Non |
| CDV | ✅ Oui | ✅ Oui | ✅ Oui | Non |
| CDS | ✅ Oui | ✅ Oui | ❌ Non | Non |
| RTM | ✅ Oui | ❌ Non | ✅ Oui | Oui |
| TMO | ✅ Oui | ✅ Oui | ✅ Oui | Non |
| SRMO | ✅ Oui | ❌ Non | ✅ Oui | Oui |
| SS | ✅ Oui | ✅ Oui | ✅ Oui | Non |
| AS | ✅ Oui | ✅ Oui | ❌ Non | Non |

### EligibilityService

```php
namespace App\Services;

use App\Models\Utilisateur;
use App\Models\Role;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Cache;

class EligibilityService
{
    const ROLES_UNIQUES = ['DR', 'CDTT', 'RTM', 'SRMO'];
    
    /**
     * Vérifier si un utilisateur peut s'auto-évaluer
     */
    public function canAutoEvaluate(Utilisateur $user): bool
    {
        return $user->role->peut_auto_evaluer ?? false;
    }
    
    /**
     * Vérifier si un utilisateur peut évaluer un pair
     */
    public function canEvaluatePeer(Utilisateur $evaluateur, Utilisateur $evalue): bool
    {
        // Vérifier permission rôle
        if (!$evaluateur->role->peut_evaluer_pairs) {
            return false;
        }
        
        // Vérifier que ce ne sont pas des rôles uniques
        if (in_array($evaluateur->role->nom_role, self::ROLES_UNIQUES)) {
            return false;
        }
        
        // Vérifier même niveau hiérarchique
        if ($evaluateur->role->niveau_hierarchique !== $evalue->role->niveau_hierarchique) {
            return false;
        }
        
        // Vérifier même région
        if ($evaluateur->id_region !== $evalue->id_region) {
            return false;
        }
        
        // Vérifier même branche
        if ($evaluateur->id_branche !== $evalue->id_branche) {
            return false;
        }
        
        // Ne peut pas s'évaluer soi-même
        if ($evaluateur->matricule === $evalue->matricule) {
            return false;
        }
        
        return true;
    }
    
    /**
     * Vérifier si un utilisateur peut évaluer un subordonné
     */
    public function canEvaluateSubordinate(Utilisateur $evaluateur, Utilisateur $evalue): bool
    {
        // Vérifier permission rôle
        if (!$evaluateur->role->peut_evaluer_subordonnes) {
            return false;
        }
        
        // Vérifier lien hiérarchique direct
        return $evalue->manager_matricule === $evaluateur->matricule;
    }
    
    /**
     * Obtenir tous les évaluateurs éligibles pour un utilisateur
     */
    public function getEligibleEvaluators(Utilisateur $evalue): Collection
    {
        $cacheKey = "eligible_evaluators_{$evalue->matricule}";
        
        return Cache::remember($cacheKey, 300, function() use ($evalue) {
            $evaluators = collect();
            
            // 1. Auto-évaluation
            if ($this->canAutoEvaluate($evalue)) {
                $evaluators->push([
                    'type' => 'auto',
                    'user' => $evalue,
                ]);
            }
            
            // 2. Évaluation par le manager
            if ($evalue->manager) {
                $evaluators->push([
                    'type' => 'manager',
                    'user' => $evalue->manager,
                ]);
            }
            
            // 3. Évaluation par les pairs
            if ($evalue->role->peut_evaluer_pairs && 
                !in_array($evalue->role->nom_role, self::ROLES_UNIQUES)) {
                
                $peers = Utilisateur::actif()
                    ->where('id_region', $evalue->id_region)
                    ->where('id_branche', $evalue->id_branche)
                    ->where('id_role', $evalue->id_role)
                    ->where('matricule', '!=', $evalue->matricule)
                    ->get();
                
                foreach ($peers as $peer) {
                    $evaluators->push([
                        'type' => 'peer',
                        'user' => $peer,
                    ]);
                }
            }
            
            return $evaluators;
        });
    }
    
    /**
     * Obtenir tous les utilisateurs qu'un évaluateur peut évaluer
     */
    public function getEligibleEvaluees(Utilisateur $evaluateur): Collection
    {
        $cacheKey = "eligible_evaluees_{$evaluateur->matricule}";
        
        return Cache::remember($cacheKey, 300, function() use ($evaluateur) {
            $evaluees = collect();
            
            // 1. Auto-évaluation
            if ($this->canAutoEvaluate($evaluateur)) {
                $evaluees->push([
                    'type' => 'auto',
                    'user' => $evaluateur,
                ]);
            }
            
            // 2. Subordonnés directs
            if ($evaluateur->role->peut_evaluer_subordonnes) {
                $subordinates = Utilisateur::actif()
                    ->where('manager_matricule', $evaluateur->matricule)
                    ->get();
                
                foreach ($subordinates as $subordinate) {
                    $evaluees->push([
                        'type' => 'subordinate',
                        'user' => $subordinate,
                    ]);
                }
            }
            
            // 3. Pairs
            if ($evaluateur->role->peut_evaluer_pairs && 
                !in_array($evaluateur->role->nom_role, self::ROLES_UNIQUES)) {
                
                $peers = Utilisateur::actif()
                    ->where('id_region', $evaluateur->id_region)
                    ->where('id_branche', $evaluateur->id_branche)
                    ->where('id_role', $evaluateur->id_role)
                    ->where('matricule', '!=', $evaluateur->matricule)
                    ->get();
                
                foreach ($peers as $peer) {
                    $evaluees->push([
                        'type' => 'peer',
                        'user' => $peer,
                    ]);
                }
            }
            
            return $evaluees;
        });
    }
    
    /**
     * Valider une évaluation selon les éligibilités
     */
    public function validateEvaluation(Utilisateur $evaluateur, Utilisateur $evalue, string $type): bool
    {
        switch ($type) {
            case 'auto':
                return $evaluateur->matricule === $evalue->matricule && 
                       $this->canAutoEvaluate($evaluateur);
            
            case 'peer':
                return $this->canEvaluatePeer($evaluateur, $evalue);
            
            case 'subordinate':
            case 'manager':
                return $this->canEvaluateSubordinate($evaluateur, $evalue);
            
            default:
                return false;
        }
    }
}
```

### EligibilitesController

```php
namespace App\Http\Controllers\Admin;

use App\Models\Role;
use App\Services\EligibilityService;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response as InertiaResponse;

class EligibilitesController extends Controller
{
    protected $eligibilityService;
    
    public function __construct(EligibilityService $eligibilityService)
    {
        $this->middleware(['auth:api', 'role:ADMIN']);
        $this->eligibilityService = $eligibilityService;
    }
    
    public function index(): InertiaResponse
    {
        $roles = Role::orderBy('niveau_hierarchique')->get();
        
        $matrice = $roles->map(function($role) {
            return [
                'nom_role' => $role->nom_role,
                'nom_complet' => $role->nom_complet,
                'niveau_hierarchique' => $role->niveau_hierarchique,
                'peut_auto_evaluer' => $role->peut_auto_evaluer,
                'peut_evaluer_pairs' => $role->peut_evaluer_pairs,
                'peut_evaluer_subordonnes' => $role->peut_evaluer_subordonnes,
                'est_role_unique' => in_array($role->nom_role, EligibilityService::ROLES_UNIQUES),
                'peut_cross_branch' => $role->peut_cross_branch,
            ];
        });
        
        return Inertia::render('Admin/Evaluations/Eligibilites/Index', [
            'matrice' => $matrice,
            'roles_uniques' => EligibilityService::ROLES_UNIQUES,
        ]);
    }
    
    public function getEligibleUsers(Request $request)
    {
        $validated = $request->validate([
            'user_matricule' => 'required|exists:utilisateurs,matricule',
            'type' => 'required|in:evaluators,evaluees',
        ]);
        
        $user = \App\Models\Utilisateur::findOrFail($validated['user_matricule']);
        
        if ($validated['type'] === 'evaluators') {
            $eligible = $this->eligibilityService->getEligibleEvaluators($user);
        } else {
            $eligible = $this->eligibilityService->getEligibleEvaluees($user);
        }
        
        return response()->json([
            'eligible' => $eligible->map(function($item) {
                return [
                    'type' => $item['type'],
                    'matricule' => $item['user']->matricule,
                    'nom_complet' => $item['user']->nom_complet,
                    'role' => $item['user']->role->nom_role,
                ];
            }),
        ]);
    }
}
```

### Composant MatriceEligibilites

```tsx
// resources/js/Components/Evaluations/MatriceEligibilites.tsx
import { Card } from '@/Components/UI/Card';
import { Badge } from '@/Components/UI/Badge';
import { Check, X, Info } from 'lucide-react';

interface Role {
    nom_role: string;
    nom_complet: string;
    niveau_hierarchique: number;
    peut_auto_evaluer: boolean;
    peut_evaluer_pairs: boolean;
    peut_evaluer_subordonnes: boolean;
    est_role_unique: boolean;
    peut_cross_branch: boolean;
}

interface MatriceEligibilitesProps {
    matrice: Role[];
    rolesUniques: string[];
}

export default function MatriceEligibilites({ matrice, rolesUniques }: MatriceEligibilitesProps) {
    const PermissionIcon = ({ allowed }: { allowed: boolean }) => (
        <div className={`flex items-center justify-center w-8 h-8 rounded-full ${
            allowed ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'
        }`}>
            {allowed ? <Check size={16} /> : <X size={16} />}
        </div>
    );
    
    return (
        <div className="space-y-6">
            {/* Légende */}
            <Card className="p-4 bg-sabc-gray-50">
                <div className="flex items-start space-x-2">
                    <Info size={20} className="text-sabc-accent mt-1" />
                    <div className="space-y-2 text-sm text-sabc-gray-800">
                        <p>
                            <strong>Rôles uniques par région</strong> ({rolesUniques.join(', ')}) : 
                            Ne peuvent pas évaluer leurs pairs (un seul par région).
                        </p>
                        <p>
                            <strong>Évaluation pairs</strong> : Requiert même niveau hiérarchique, 
                            même région, même branche.
                        </p>
                        <p>
                            <strong>Évaluation descendante</strong> : Requiert lien hiérarchique direct 
                            (manager → subordonné).
                        </p>
                    </div>
                </div>
            </Card>
            
            {/* Matrice */}
            <Card className="overflow-x-auto">
                <table className="w-full">
                    <thead>
                        <tr className="border-b-2 border-sabc-gray-200">
                            <th className="text-left p-4 font-semibold text-sabc-gray-900">Rôle</th>
                            <th className="text-center p-4 font-semibold text-sabc-gray-900">Niveau</th>
                            <th className="text-center p-4 font-semibold text-sabc-gray-900">
                                Auto-évaluation
                            </th>
                            <th className="text-center p-4 font-semibold text-sabc-gray-900">
                                Évaluation Pairs
                            </th>
                            <th className="text-center p-4 font-semibold text-sabc-gray-900">
                                Évaluation Subordonnés
                            </th>
                            <th className="text-center p-4 font-semibold text-sabc-gray-900">
                                Particularités
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        {matrice.map((role) => (
                            <tr 
                                key={role.nom_role} 
                                className="border-b border-sabc-gray-100 hover:bg-sabc-gray-50"
                            >
                                <td className="p-4">
                                    <div>
                                        <div className="font-semibold text-sabc-gray-900">
                                            {role.nom_role}
                                        </div>
                                        <div className="text-sm text-sabc-gray-600">
                                            {role.nom_complet}
                                        </div>
                                    </div>
                                </td>
                                <td className="p-4 text-center">
                                    <Badge variant="secondary">
                                        Niveau {role.niveau_hierarchique}
                                    </Badge>
                                </td>
                                <td className="p-4">
                                    <div className="flex justify-center">
                                        <PermissionIcon allowed={role.peut_auto_evaluer} />
                                    </div>
                                </td>
                                <td className="p-4">
                                    <div className="flex justify-center">
                                        <PermissionIcon 
                                            allowed={role.peut_evaluer_pairs && !role.est_role_unique} 
                                        />
                                    </div>
                                </td>
                                <td className="p-4">
                                    <div className="flex justify-center">
                                        <PermissionIcon allowed={role.peut_evaluer_subordonnes} />
                                    </div>
                                </td>
                                <td className="p-4">
                                    <div className="flex flex-wrap gap-2 justify-center">
                                        {role.est_role_unique && (
                                            <Badge variant="warning" className="text-xs">
                                                Rôle Unique
                                            </Badge>
                                        )}
                                        {role.peut_cross_branch && (
                                            <Badge variant="success" className="text-xs">
                                                Cross-Branch
                                            </Badge>
                                        )}
                                    </div>
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

### Page Admin Eligibilites Index

```tsx
// resources/js/Pages/Admin/Evaluations/Eligibilites/Index.tsx
import MatriceEligibilites from '@/Components/Evaluations/MatriceEligibilites';

interface Role {
    nom_role: string;
    nom_complet: string;
    niveau_hierarchique: number;
    peut_auto_evaluer: boolean;
    peut_evaluer_pairs: boolean;
    peut_evaluer_subordonnes: boolean;
    est_role_unique: boolean;
    peut_cross_branch: boolean;
}

interface Props {
    matrice: Role[];
    roles_uniques: string[];
}

export default function EligibilitesIndex({ matrice, roles_uniques }: Props) {
    return (
        <div className="p-6">
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-sabc-gray-900 font-poppins">
                    Configuration des Éligibilités d'Évaluation
                </h1>
                <p className="text-sabc-gray-600 mt-2">
                    Matrice des permissions d'évaluation par rôle SABC
                </p>
            </div>

            <MatriceEligibilites 
                matrice={matrice} 
                rolesUniques={roles_uniques} 
            />
        </div>
    );
}
```

### Routes

```php
// routes/web.php
Route::middleware(['auth:api', 'role:ADMIN'])->prefix('admin/evaluations')->group(function () {
    Route::get('/eligibilites', [EligibilitesController::class, 'index'])
        ->name('admin.evaluations.eligibilites.index');
    
    Route::post('/eligibilites/eligible-users', [EligibilitesController::class, 'getEligibleUsers'])
        ->name('admin.evaluations.eligibilites.eligible-users');
});
```

### Project Structure Notes

**Fichiers à créer :**
- `app/Services/EligibilityService.php`
- `app/Http/Controllers/Admin/EligibilitesController.php`
- `resources/js/Pages/Admin/Evaluations/Eligibilites/Index.tsx`
- `resources/js/Components/Evaluations/MatriceEligibilites.tsx`

**Fichiers à modifier :**
- `routes/web.php` : Ajouter routes éligibilités
- `app/Models/RegleEvaluation.php` : Intégrer EligibilityService
- `resources/js/types/index.ts` : Ajouter interfaces

**Dépendances Stories Précédentes :**
- Story 1.3 : Rôles SABC avec permissions (peut_auto_evaluer, peut_evaluer_pairs, peut_evaluer_subordonnes)
- Story 1.5 : Table utilisateurs avec manager_matricule
- Story 2.1 : Règles d'évaluation créées

### Règles Métier SABC Critiques

**Éligibilité Auto-évaluation :**
- Basée uniquement sur `role.peut_auto_evaluer`
- DR et CDTT : Non autorisés

**Éligibilité Pairs :**
- Même `niveau_hierarchique`
- Même `id_region`
- Même `id_branche`
- Pas de rôles uniques (DR, CDTT, RTM, SRMO)

**Éligibilité Descendante :**
- Lien hiérarchique direct : `evalue.manager_matricule = evaluateur.matricule`
- Basée sur `role.peut_evaluer_subordonnes`

**Cache Performance :**
- Cache Redis 5 minutes pour éligibilités
- Invalidation lors modification utilisateurs/rôles

### References

- [Source: epics.md#Epic 2 Story 2.2] - Acceptance criteria complets
- [Source: business-logic-rules.md#Matrice des Permissions] - Permissions par rôle
- [Source: business-logic-rules.md#Règles d'Évaluation] - Types évaluation
- [Source: architecture.md#Security Governance] - RBAC strict
- [Source: project-context.md#Critical Implementation Rules] - TypeScript strict

## Dev Agent Record

### Agent Model Used

_À remplir par le dev agent_

### Debug Log References

_À remplir par le dev agent_

### Completion Notes List

_À remplir par le dev agent_

### File List

_À remplir par le dev agent_
