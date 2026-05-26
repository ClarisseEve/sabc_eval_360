# Story 2.3: Gestion des Exceptions de Rôles (DR/CDTT)

Status: ready-for-dev

## Story

En tant que système,
Je veux appliquer les exceptions spéciales pour les rôles DR et CDTT,
Afin de respecter leurs privilèges inter-branches.

## Acceptance Criteria

**Given** un utilisateur avec rôle DR ou CDTT
**When** le système vérifie les permissions d'évaluation
**Then** le flag `peut_cross_branch = true` autorise la supervision inter-branche
**And** DR et CDTT ne peuvent pas s'auto-évaluer (`peut_auto_evaluer = false`)
**And** DR et CDTT ne peuvent pas évaluer leurs pairs (rôles uniques par région)
**And** DR et CDTT peuvent évaluer tous les subordonnés de leur région, toutes branches confondues
**And** la `portee_geographique = global` pour DR, `portee_geographique = region` pour CDTT

## Tasks / Subtasks

- [ ] Extension EligibilityService pour DR/CDTT (AC: 1, 2, 3, 4, 5)
  - [ ] Méthode `canCrossBranchEvaluate()` : Vérifier `peut_cross_branch`
  - [ ] Méthode `getSubordinatesAllBranches()` : Subordonnés toutes branches
  - [ ] Méthode `validateDRCDTTRestrictions()` : Pas auto-évaluation, pas pairs
  - [ ] Override `getEligibleEvaluees()` pour DR/CDTT
  - [ ] Filtrage géographique selon `portee_geographique`

- [ ] Service CrossBranchService (AC: 1, 4, 5)
  - [ ] Créer `app/Services/CrossBranchService.php`
  - [ ] Méthode `getAccessibleBranches()` : Branches accessibles selon rôle
  - [ ] Méthode `getSubordinatesAcrossBranches()` : Subordonnés multi-branches
  - [ ] Méthode `validateCrossBranchAccess()` : Validation accès inter-branche
  - [ ] Cache Redis pour performance

- [ ] Tests Unitaires Exceptions DR/CDTT (AC: 1, 2, 3, 4, 5)
  - [ ] Test auto-évaluation DR/CDTT bloquée
  - [ ] Test évaluation pairs DR/CDTT bloquée
  - [ ] Test évaluation subordonnés cross-branch autorisée
  - [ ] Test portée géographique (global DR, region CDTT)
  - [ ] Test filtrage branches selon permissions

- [ ] Documentation Exceptions (AC: 1, 2, 3, 4, 5)
  - [ ] Documenter règles DR/CDTT dans code
  - [ ] Ajouter exemples dans PHPDoc
  - [ ] Créer diagramme flux décision
  - [ ] Mettre à jour README règles métier

- [ ] Interface Admin Visualisation Exceptions (AC: 1, 4, 5)
  - [ ] Composant `ExceptionsDRCDTT.tsx`
  - [ ] Affichage privilèges spéciaux
  - [ ] Indicateurs visuels cross-branch
  - [ ] Légende portée géographique

- [ ] Validation & Tests Intégration
  - [ ] Tester DR évalue subordonnés branches Commerciale + Marketing
  - [ ] Tester CDTT évalue subordonnés département trade
  - [ ] Tester blocage auto-évaluation DR/CDTT
  - [ ] Tester blocage évaluation pairs DR/CDTT
  - [ ] Tester portée géographique

## Dev Notes

### Architecture Exceptions DR/CDTT

**Privilèges Spéciaux DR :**
- `peut_cross_branch = true` : Supervision inter-branche
- `portee_geographique = global` : Accès toute la région
- Peut évaluer tous subordonnés (Commerciale + Marketing)
- Ne peut pas s'auto-évaluer
- Ne peut pas évaluer pairs (rôle unique)

**Privilèges Spéciaux CDTT :**
- `peut_cross_branch = true` : Supervision département trade
- `portee_geographique = region` : Limité à sa région
- Peut évaluer subordonnés branches Commerciale + Marketing
- Ne peut pas s'auto-évaluer
- Ne peut pas évaluer pairs (rôle unique)

**Différence DR vs CDTT :**
- DR : Portée globale, niveau hiérarchique 1
- CDTT : Portée régionale, niveau hiérarchique 2

### Extension EligibilityService

```php
namespace App\Services;

use App\Models\Utilisateur;
use Illuminate\Support\Collection;

class EligibilityService
{
    const ROLES_UNIQUES = ['DR', 'CDTT', 'RTM', 'SRMO'];
    const ROLES_CROSS_BRANCH = ['DR', 'CDTT'];
    
    /**
     * Vérifier si un utilisateur peut évaluer cross-branch
     */
    public function canCrossBranchEvaluate(Utilisateur $user): bool
    {
        return $user->role->peut_cross_branch ?? false;
    }
    
    /**
     * Obtenir tous les subordonnés d'un DR/CDTT (toutes branches)
     */
    public function getSubordinatesAllBranches(Utilisateur $user): Collection
    {
        if (!$this->canCrossBranchEvaluate($user)) {
            // Utilisateur normal : subordonnés directs uniquement
            return Utilisateur::actif()
                ->where('manager_matricule', $user->matricule)
                ->get();
        }
        
        // DR/CDTT : tous les subordonnés de la région
        return $this->getSubordinatesRecursive($user);
    }
    
    /**
     * Obtenir subordonnés récursifs (hiérarchie complète)
     */
    private function getSubordinatesRecursive(Utilisateur $user): Collection
    {
        $subordinates = collect();
        
        // Subordonnés directs
        $directSubordinates = Utilisateur::actif()
            ->where('manager_matricule', $user->matricule)
            ->get();
        
        foreach ($directSubordinates as $subordinate) {
            $subordinates->push($subordinate);
            
            // Récursion pour subordonnés de subordonnés
            $subordinates = $subordinates->merge(
                $this->getSubordinatesRecursive($subordinate)
            );
        }
        
        return $subordinates;
    }
    
    /**
     * Valider les restrictions spécifiques DR/CDTT
     */
    public function validateDRCDTTRestrictions(Utilisateur $evaluateur, string $type): bool
    {
        $isDRorCDTT = in_array($evaluateur->role->nom_role, self::ROLES_CROSS_BRANCH);
        
        if (!$isDRorCDTT) {
            return true; // Pas de restrictions spéciales
        }
        
        // DR/CDTT ne peuvent pas s'auto-évaluer
        if ($type === 'auto') {
            return false;
        }
        
        // DR/CDTT ne peuvent pas évaluer leurs pairs
        if ($type === 'peer') {
            return false;
        }
        
        return true;
    }
    
    /**
     * Override getEligibleEvaluees pour DR/CDTT
     */
    public function getEligibleEvaluees(Utilisateur $evaluateur): Collection
    {
        $cacheKey = "eligible_evaluees_{$evaluateur->matricule}";
        
        return Cache::remember($cacheKey, 300, function() use ($evaluateur) {
            $evaluees = collect();
            
            // 1. Auto-évaluation (bloquée pour DR/CDTT)
            if ($this->canAutoEvaluate($evaluateur) && 
                !in_array($evaluateur->role->nom_role, self::ROLES_CROSS_BRANCH)) {
                $evaluees->push([
                    'type' => 'auto',
                    'user' => $evaluateur,
                ]);
            }
            
            // 2. Subordonnés (cross-branch pour DR/CDTT)
            if ($evaluateur->role->peut_evaluer_subordonnes) {
                $subordinates = $this->canCrossBranchEvaluate($evaluateur)
                    ? $this->getSubordinatesAllBranches($evaluateur)
                    : Utilisateur::actif()
                        ->where('manager_matricule', $evaluateur->matricule)
                        ->get();
                
                foreach ($subordinates as $subordinate) {
                    $evaluees->push([
                        'type' => 'subordinate',
                        'user' => $subordinate,
                        'cross_branch' => $subordinate->id_branche !== $evaluateur->id_branche,
                    ]);
                }
            }
            
            // 3. Pairs (bloqués pour DR/CDTT)
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
     * Valider une évaluation avec exceptions DR/CDTT
     */
    public function validateEvaluation(Utilisateur $evaluateur, Utilisateur $evalue, string $type): bool
    {
        // Vérifier restrictions DR/CDTT
        if (!$this->validateDRCDTTRestrictions($evaluateur, $type)) {
            return false;
        }
        
        switch ($type) {
            case 'auto':
                return $evaluateur->matricule === $evalue->matricule && 
                       $this->canAutoEvaluate($evaluateur);
            
            case 'peer':
                return $this->canEvaluatePeer($evaluateur, $evalue);
            
            case 'subordinate':
            case 'manager':
                // Pour DR/CDTT : vérifier si dans hiérarchie (même si branche différente)
                if ($this->canCrossBranchEvaluate($evaluateur)) {
                    return $this->isInHierarchy($evaluateur, $evalue);
                }
                return $this->canEvaluateSubordinate($evaluateur, $evalue);
            
            default:
                return false;
        }
    }
    
    /**
     * Vérifier si un utilisateur est dans la hiérarchie d'un autre
     */
    private function isInHierarchy(Utilisateur $manager, Utilisateur $subordinate): bool
    {
        $current = $subordinate;
        
        while ($current->manager_matricule) {
            if ($current->manager_matricule === $manager->matricule) {
                return true;
            }
            $current = $current->manager;
            if (!$current) break;
        }
        
        return false;
    }
}
```

### CrossBranchService

```php
namespace App\Services;

use App\Models\Utilisateur;
use App\Models\Branche;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Cache;

class CrossBranchService
{
    /**
     * Obtenir les branches accessibles pour un utilisateur
     */
    public function getAccessibleBranches(Utilisateur $user): Collection
    {
        $cacheKey = "accessible_branches_{$user->matricule}";
        
        return Cache::remember($cacheKey, 600, function() use ($user) {
            // DR/CDTT : Accès toutes branches
            if ($user->role->peut_cross_branch) {
                return Branche::where('actif', true)->get();
            }
            
            // Autres rôles : Branche unique
            return Branche::where('id_branche', $user->id_branche)
                ->where('actif', true)
                ->get();
        });
    }
    
    /**
     * Obtenir subordonnés à travers plusieurs branches
     */
    public function getSubordinatesAcrossBranches(Utilisateur $user): Collection
    {
        if (!$user->role->peut_cross_branch) {
            // Pas de privilège cross-branch : subordonnés directs uniquement
            return Utilisateur::actif()
                ->where('manager_matricule', $user->matricule)
                ->get();
        }
        
        $cacheKey = "subordinates_cross_branch_{$user->matricule}";
        
        return Cache::remember($cacheKey, 300, function() use ($user) {
            // Récupérer tous les subordonnés de la région
            return Utilisateur::actif()
                ->where('id_region', $user->id_region)
                ->where('niveau_hierarchique', '>', $user->role->niveau_hierarchique)
                ->whereHas('role', function($query) use ($user) {
                    // Subordonnés dans la hiérarchie
                    $query->where('niveau_hierarchique', '>', $user->role->niveau_hierarchique);
                })
                ->get()
                ->filter(function($subordinate) use ($user) {
                    // Vérifier si dans la hiérarchie du manager
                    return $this->isInManagerHierarchy($subordinate, $user);
                });
        });
    }
    
    /**
     * Valider l'accès cross-branch
     */
    public function validateCrossBranchAccess(Utilisateur $user, int $brancheId): bool
    {
        // Vérifier privilège cross-branch
        if (!$user->role->peut_cross_branch) {
            return $user->id_branche === $brancheId;
        }
        
        // DR/CDTT : Accès toutes branches de leur région
        $branche = Branche::find($brancheId);
        return $branche && $branche->actif;
    }
    
    /**
     * Vérifier si un subordonné est dans la hiérarchie d'un manager
     */
    private function isInManagerHierarchy(Utilisateur $subordinate, Utilisateur $manager): bool
    {
        $current = $subordinate;
        $maxDepth = 10; // Éviter boucles infinies
        $depth = 0;
        
        while ($current->manager_matricule && $depth < $maxDepth) {
            if ($current->manager_matricule === $manager->matricule) {
                return true;
            }
            $current = $current->manager;
            if (!$current) break;
            $depth++;
        }
        
        return false;
    }
    
    /**
     * Obtenir statistiques cross-branch pour un DR/CDTT
     */
    public function getCrossBranchStats(Utilisateur $user): array
    {
        if (!$user->role->peut_cross_branch) {
            return [];
        }
        
        $subordinates = $this->getSubordinatesAcrossBranches($user);
        
        return [
            'total_subordinates' => $subordinates->count(),
            'by_branch' => $subordinates->groupBy('id_branche')->map(function($group) {
                return [
                    'count' => $group->count(),
                    'branche' => $group->first()->branche->nom_branche,
                ];
            }),
            'portee_geographique' => $user->role->portee_geographique,
        ];
    }
}
```

### Tests Unitaires

```php
namespace Tests\Unit\Services;

use Tests\TestCase;
use App\Models\Utilisateur;
use App\Models\Role;
use App\Services\EligibilityService;
use Illuminate\Foundation\Testing\RefreshDatabase;

class EligibilityServiceDRCDTTTest extends TestCase
{
    use RefreshDatabase;
    
    protected $eligibilityService;
    
    protected function setUp(): void
    {
        parent::setUp();
        $this->eligibilityService = new EligibilityService();
    }
    
    /** @test */
    public function dr_cannot_auto_evaluate()
    {
        $dr = Utilisateur::factory()->create([
            'id_role' => Role::where('nom_role', 'DR')->first()->id_role,
        ]);
        
        $this->assertFalse($this->eligibilityService->canAutoEvaluate($dr));
    }
    
    /** @test */
    public function cdtt_cannot_auto_evaluate()
    {
        $cdtt = Utilisateur::factory()->create([
            'id_role' => Role::where('nom_role', 'CDTT')->first()->id_role,
        ]);
        
        $this->assertFalse($this->eligibilityService->canAutoEvaluate($cdtt));
    }
    
    /** @test */
    public function dr_cannot_evaluate_peers()
    {
        $dr1 = Utilisateur::factory()->create([
            'id_role' => Role::where('nom_role', 'DR')->first()->id_role,
            'id_region' => 1,
        ]);
        
        $dr2 = Utilisateur::factory()->create([
            'id_role' => Role::where('nom_role', 'DR')->first()->id_role,
            'id_region' => 1,
        ]);
        
        $this->assertFalse($this->eligibilityService->canEvaluatePeer($dr1, $dr2));
    }
    
    /** @test */
    public function dr_can_evaluate_subordinates_across_branches()
    {
        $dr = Utilisateur::factory()->create([
            'id_role' => Role::where('nom_role', 'DR')->first()->id_role,
            'id_region' => 1,
            'id_branche' => 1, // Commerciale
        ]);
        
        $subordinateCommercial = Utilisateur::factory()->create([
            'id_region' => 1,
            'id_branche' => 1, // Commerciale
            'manager_matricule' => $dr->matricule,
        ]);
        
        $subordinateMarketing = Utilisateur::factory()->create([
            'id_region' => 1,
            'id_branche' => 2, // Marketing
            'manager_matricule' => $dr->matricule,
        ]);
        
        $eligibles = $this->eligibilityService->getEligibleEvaluees($dr);
        
        $this->assertTrue($eligibles->contains(function($item) use ($subordinateCommercial) {
            return $item['user']->matricule === $subordinateCommercial->matricule;
        }));
        
        $this->assertTrue($eligibles->contains(function($item) use ($subordinateMarketing) {
            return $item['user']->matricule === $subordinateMarketing->matricule;
        }));
    }
    
    /** @test */
    public function cdtt_has_region_scope()
    {
        $cdtt = Utilisateur::factory()->create([
            'id_role' => Role::where('nom_role', 'CDTT')->first()->id_role,
        ]);
        
        $this->assertEquals('region', $cdtt->role->portee_geographique);
    }
    
    /** @test */
    public function dr_has_global_scope()
    {
        $dr = Utilisateur::factory()->create([
            'id_role' => Role::where('nom_role', 'DR')->first()->id_role,
        ]);
        
        $this->assertEquals('global', $dr->role->portee_geographique);
    }
}
```

### Composant ExceptionsDRCDTT

```tsx
// resources/js/Components/Evaluations/ExceptionsDRCDTT.tsx
import { Card } from '@/Components/UI/Card';
import { Badge } from '@/Components/UI/Badge';
import { Shield, Users, Globe, MapPin } from 'lucide-react';

interface ExceptionsDRCDTTProps {
    role: 'DR' | 'CDTT';
}

export default function ExceptionsDRCDTT({ role }: ExceptionsDRCDTTProps) {
    const privileges = {
        DR: {
            titre: 'Directeur Régional',
            portee: 'Globale',
            icon: <Globe size={24} />,
            privileges: [
                'Supervision inter-branche (Commerciale + Marketing)',
                'Évaluation tous subordonnés de la région',
                'Portée géographique globale',
                'Pas d\'auto-évaluation',
                'Pas d\'évaluation pairs (rôle unique)',
            ],
        },
        CDTT: {
            titre: 'Chef Département Trade',
            portee: 'Régionale',
            icon: <MapPin size={24} />,
            privileges: [
                'Supervision département trade',
                'Évaluation subordonnés branches Commerciale + Marketing',
                'Portée géographique régionale',
                'Pas d\'auto-évaluation',
                'Pas d\'évaluation pairs (rôle unique)',
            ],
        },
    };
    
    const config = privileges[role];
    
    return (
        <Card className="p-6">
            <div className="flex items-center space-x-3 mb-4">
                <div className="p-3 bg-sabc-accent-light rounded-lg text-sabc-accent">
                    <Shield size={24} />
                </div>
                <div>
                    <h3 className="text-lg font-semibold text-sabc-gray-900 font-poppins">
                        Privilèges Spéciaux : {config.titre}
                    </h3>
                    <Badge variant="warning" className="mt-1">
                        {config.icon}
                        <span className="ml-2">Portée {config.portee}</span>
                    </Badge>
                </div>
            </div>
            
            <div className="space-y-3">
                {config.privileges.map((privilege, index) => (
                    <div key={index} className="flex items-start space-x-3">
                        <div className="mt-1">
                            {privilege.includes('Pas') ? (
                                <div className="w-2 h-2 rounded-full bg-red-500" />
                            ) : (
                                <div className="w-2 h-2 rounded-full bg-green-500" />
                            )}
                        </div>
                        <p className="text-sm text-sabc-gray-800">{privilege}</p>
                    </div>
                ))}
            </div>
            
            <div className="mt-6 p-4 bg-sabc-gray-50 rounded-lg">
                <div className="flex items-start space-x-2">
                    <Users size={16} className="text-sabc-accent mt-1" />
                    <p className="text-sm text-sabc-gray-600">
                        <strong>Cross-Branch :</strong> Peut évaluer des subordonnés 
                        dans différentes branches (Commerciale et Marketing) au sein de sa région.
                    </p>
                </div>
            </div>
        </Card>
    );
}
```

### Project Structure Notes

**Fichiers à créer :**
- `app/Services/CrossBranchService.php`
- `tests/Unit/Services/EligibilityServiceDRCDTTTest.php`
- `resources/js/Components/Evaluations/ExceptionsDRCDTT.tsx`

**Fichiers à modifier :**
- `app/Services/EligibilityService.php` : Ajouter méthodes DR/CDTT
- `app/Http/Controllers/Admin/EligibilitesController.php` : Intégrer CrossBranchService
- `resources/js/Pages/Admin/Evaluations/Eligibilites/Index.tsx` : Ajouter ExceptionsDRCDTT

**Dépendances Stories Précédentes :**
- Story 1.3 : Rôles avec peut_cross_branch, portee_geographique
- Story 1.5 : Hiérarchie utilisateurs avec manager_matricule
- Story 2.2 : EligibilityService de base

### Règles Métier SABC Critiques

**Restrictions DR/CDTT :**
- ❌ Pas d'auto-évaluation
- ❌ Pas d'évaluation pairs
- ✅ Évaluation subordonnés cross-branch

**Portée Géographique :**
- DR : `global` (toute la région)
- CDTT : `region` (département trade)

**Hiérarchie Cross-Branch :**
- DR peut évaluer tous subordonnés région (Commerciale + Marketing)
- CDTT peut évaluer subordonnés département trade (2 branches)

**Performance :**
- Cache Redis 5 minutes pour éligibilités
- Cache Redis 10 minutes pour branches accessibles
- Limitation profondeur récursion (max 10 niveaux)

### References

- [Source: epics.md#Epic 2 Story 2.3] - Acceptance criteria complets
- [Source: business-logic-rules.md#Chaîne de Commandement] - DR/CDTT privilèges
- [Source: business-logic-rules.md#Règles de Liens Hiérarchiques] - Cross-branch
- [Source: architecture.md#Security Governance] - Validation permissions
- [Source: project-context.md#Critical Implementation Rules] - Tests unitaires

## Dev Agent Record

### Agent Model Used

_À remplir par le dev agent_

### Debug Log References

_À remplir par le dev agent_

### Completion Notes List

_À remplir par le dev agent_

### File List

_À remplir par le dev agent_
