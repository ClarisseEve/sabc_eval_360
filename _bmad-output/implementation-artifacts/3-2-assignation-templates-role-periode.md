# Story 3.2: Assignation de Templates par Rôle et Période

Status: ready-for-dev

## Story

En tant qu'administrateur,
Je veux assigner des templates spécifiques à des rôles et périodes,
Afin que chaque rôle utilise le bon template.

## Acceptance Criteria

**Given** j'ai créé des templates d'évaluation
**When** j'assigne un template à un rôle (ex: CSC) et une période (ex: 2025-S1)
**Then** l'assignation est créée dans `templates_roles_periodes` avec `id_template`, `id_role`, `id_periode`
**And** lors de la création d'évaluation, le système sélectionne automatiquement le template assigné
**And** si aucun template n'est assigné, un message d'erreur est affiché
**And** je peux assigner plusieurs templates à un même rôle pour différentes périodes
**And** je peux modifier l'assignation avant l'ouverture de la période

## Tasks / Subtasks

- [ ] Création Table `templates_roles_periodes` PostgreSQL (AC: 1, 4, 5)
  - [ ] Migration `create_templates_roles_periodes_table.php`
  - [ ] Colonnes : id (auto), id_template (FK), id_role (FK), id_periode (FK)
  - [ ] Contrainte unique : (id_role, id_periode)
  - [ ] Index sur id_template, id_role, id_periode
  - [ ] Connexion PostgreSQL (sabc_business)

- [ ] Modèle Eloquent `TemplateRolePeriode` (AC: 1, 4, 5)
  - [ ] Créer `app/Models/TemplateRolePeriode.php`
  - [ ] Connexion PostgreSQL (sabc_business)
  - [ ] Relations : template, role, periode
  - [ ] Scopes : byRole, byPeriode, actif
  - [ ] Validation contrainte unique

- [ ] Service TemplateAssignationService (AC: 2, 3, 4, 5)
  - [ ] Créer `app/Services/TemplateAssignationService.php`
  - [ ] Méthode `getTemplateForRolePeriode()` : Récupérer template assigné
  - [ ] Méthode `assignTemplate()` : Créer assignation
  - [ ] Méthode `updateAssignation()` : Modifier assignation
  - [ ] Méthode `canModifyAssignation()` : Vérifier période non ouverte
  - [ ] Exception si aucun template assigné

- [ ] Interface Admin Assignation Templates (AC: 1, 4, 5, 6)
  - [ ] Page `resources/js/Pages/Admin/Evaluations/Assignations/Index.tsx`
  - [ ] Matrice rôles × périodes
  - [ ] Sélection template par cellule
  - [ ] Filtres par période
  - [ ] Indicateurs visuels : assigné, non assigné
  - [ ] Design SABC responsive

- [ ] Composant MatriceAssignations (AC: 1, 4, 5, 6)
  - [ ] Créer `resources/js/Components/Evaluations/MatriceAssignations.tsx`
  - [ ] Tableau 11 rôles × périodes
  - [ ] Dropdown sélection template par cellule
  - [ ] Badges statut : Assigné, Non assigné, Période ouverte (lecture seule)
  - [ ] Validation modification période ouverte

- [ ] TemplateAssignationsController (AC: 1, 2, 3, 4, 5, 6)
  - [ ] Créer `app/Http/Controllers/Admin/TemplateAssignationsController.php`
  - [ ] Méthode `index()` : Afficher matrice
  - [ ] Méthode `assign()` : Créer assignation
  - [ ] Méthode `update()` : Modifier assignation
  - [ ] Validation période non ouverte
  - [ ] Middleware `auth:api` + `role:ADMIN`

- [ ] Intégration Workflow Évaluation (AC: 2, 3)
  - [ ] Modifier création évaluation pour récupérer template
  - [ ] Exception si aucun template assigné
  - [ ] Message d'erreur explicite

- [ ] Tests & Validation
  - [ ] Tester assignation template à rôle/période
  - [ ] Tester sélection automatique template
  - [ ] Tester exception aucun template
  - [ ] Tester modification avant ouverture période
  - [ ] Tester blocage modification période ouverte

## Dev Notes

### Architecture Assignation Templates

**Principe :**
- Un template par (rôle, période)
- Contrainte unique : Pas de doublon
- Modification autorisée uniquement avant ouverture période

**Flux Sélection Template :**
1. Utilisateur crée évaluation
2. Système récupère `id_role` et `id_periode` courante
3. Recherche dans `templates_roles_periodes`
4. Si trouvé : Utiliser template assigné
5. Si non trouvé : Exception avec message explicite

**Règles de Modification :**
- Période non ouverte (`est_ouverte = false`) : Modification autorisée
- Période ouverte (`est_ouverte = true`) : Modification bloquée
- Message : "Impossible de modifier l'assignation, la période est ouverte"

### Migration Table `templates_roles_periodes`

```php
Schema::connection('pgsql')->create('templates_roles_periodes', function (Blueprint $table) {
    $table->id();
    $table->uuid('id_template');
    $table->unsignedBigInteger('id_role');
    $table->uuid('id_periode');
    $table->timestamps();
    
    // Contrainte unique : un template par (rôle, période)
    $table->unique(['id_role', 'id_periode'], 'unique_role_periode');
    
    $table->index('id_template');
    $table->index('id_role');
    $table->index('id_periode');
    
    $table->foreign('id_template')
        ->references('id_template')
        ->on('templates_evaluation')
        ->onDelete('restrict');
    
    $table->foreign('id_role')
        ->references('id_role')
        ->on('roles')
        ->onDelete('restrict');
    
    $table->foreign('id_periode')
        ->references('id_periode')
        ->on('periodes_evaluation')
        ->onDelete('restrict');
});
```

### Modèle TemplateRolePeriode

```php
namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class TemplateRolePeriode extends Model
{
    protected $connection = 'pgsql'; // sabc_business
    protected $table = 'templates_roles_periodes';
    
    protected $fillable = [
        'id_template',
        'id_role',
        'id_periode',
    ];
    
    // Relations
    public function template()
    {
        return $this->belongsTo(TemplateEvaluation::class, 'id_template', 'id_template');
    }
    
    public function role()
    {
        return $this->belongsTo(Role::class, 'id_role', 'id_role');
    }
    
    public function periode()
    {
        return $this->belongsTo(PeriodeEvaluation::class, 'id_periode', 'id_periode');
    }
    
    // Scopes
    public function scopeByRole($query, int $idRole)
    {
        return $query->where('id_role', $idRole);
    }
    
    public function scopeByPeriode($query, string $idPeriode)
    {
        return $query->where('id_periode', $idPeriode);
    }
    
    public function scopeActif($query)
    {
        return $query->whereHas('template', function($q) {
            $q->where('statut', 'publie');
        });
    }
}
```

### TemplateAssignationService

```php
namespace App\Services;

use App\Models\TemplateRolePeriode;
use App\Models\TemplateEvaluation;
use App\Models\PeriodeEvaluation;
use App\Exceptions\TemplateNotAssignedException;
use App\Exceptions\PeriodeOuverteException;
use Illuminate\Support\Facades\Cache;

class TemplateAssignationService
{
    /**
     * Récupérer le template assigné pour un rôle et une période
     */
    public function getTemplateForRolePeriode(int $idRole, string $idPeriode): TemplateEvaluation
    {
        $cacheKey = "template_role_{$idRole}_periode_{$idPeriode}";
        
        return Cache::remember($cacheKey, 600, function() use ($idRole, $idPeriode) {
            $assignation = TemplateRolePeriode::byRole($idRole)
                ->byPeriode($idPeriode)
                ->actif()
                ->with('template')
                ->first();
            
            if (!$assignation) {
                throw new TemplateNotAssignedException(
                    "Aucun template d'évaluation n'est assigné pour ce rôle et cette période. " .
                    "Veuillez contacter l'administrateur."
                );
            }
            
            return $assignation->template;
        });
    }
    
    /**
     * Assigner un template à un rôle et une période
     */
    public function assignTemplate(string $idTemplate, int $idRole, string $idPeriode): TemplateRolePeriode
    {
        // Vérifier que le template est publié
        $template = TemplateEvaluation::findOrFail($idTemplate);
        if ($template->statut !== 'publie') {
            throw new \Exception(
                "Seuls les templates publiés peuvent être assignés"
            );
        }
        
        // Vérifier si assignation existe déjà
        $existing = TemplateRolePeriode::byRole($idRole)
            ->byPeriode($idPeriode)
            ->first();
        
        if ($existing) {
            throw new \Exception(
                "Un template est déjà assigné pour ce rôle et cette période. " .
                "Utilisez la modification pour changer le template."
            );
        }
        
        // Créer assignation
        $assignation = TemplateRolePeriode::create([
            'id_template' => $idTemplate,
            'id_role' => $idRole,
            'id_periode' => $idPeriode,
        ]);
        
        // Invalider cache
        Cache::forget("template_role_{$idRole}_periode_{$idPeriode}");
        
        return $assignation;
    }
    
    /**
     * Modifier une assignation existante
     */
    public function updateAssignation(int $idRole, string $idPeriode, string $newIdTemplate): TemplateRolePeriode
    {
        // Vérifier que la période n'est pas ouverte
        if (!$this->canModifyAssignation($idPeriode)) {
            throw new PeriodeOuverteException(
                "Impossible de modifier l'assignation : la période d'évaluation est déjà ouverte"
            );
        }
        
        // Vérifier que le nouveau template est publié
        $template = TemplateEvaluation::findOrFail($newIdTemplate);
        if ($template->statut !== 'publie') {
            throw new \Exception(
                "Seuls les templates publiés peuvent être assignés"
            );
        }
        
        // Récupérer assignation existante
        $assignation = TemplateRolePeriode::byRole($idRole)
            ->byPeriode($idPeriode)
            ->firstOrFail();
        
        // Mettre à jour
        $assignation->update(['id_template' => $newIdTemplate]);
        
        // Invalider cache
        Cache::forget("template_role_{$idRole}_periode_{$idPeriode}");
        
        return $assignation;
    }
    
    /**
     * Vérifier si une assignation peut être modifiée
     */
    public function canModifyAssignation(string $idPeriode): bool
    {
        $periode = PeriodeEvaluation::findOrFail($idPeriode);
        
        // Modification autorisée uniquement si période non ouverte
        return !$periode->est_ouverte;
    }
    
    /**
     * Obtenir toutes les assignations pour une période
     */
    public function getAssignationsForPeriode(string $idPeriode): array
    {
        $assignations = TemplateRolePeriode::byPeriode($idPeriode)
            ->with(['template', 'role'])
            ->get();
        
        return $assignations->map(function($assignation) {
            return [
                'id_role' => $assignation->id_role,
                'nom_role' => $assignation->role->nom_role,
                'id_template' => $assignation->id_template,
                'nom_template' => $assignation->template->nom_template,
            ];
        })->toArray();
    }
    
    /**
     * Obtenir la matrice complète rôles × périodes
     */
    public function getMatriceAssignations(): array
    {
        $roles = \App\Models\Role::orderBy('niveau_hierarchique')->get();
        $periodes = PeriodeEvaluation::orderBy('date_debut', 'desc')->get();
        
        $matrice = [];
        
        foreach ($periodes as $periode) {
            $assignations = TemplateRolePeriode::byPeriode($periode->id_periode)
                ->with('template')
                ->get()
                ->keyBy('id_role');
            
            foreach ($roles as $role) {
                $assignation = $assignations->get($role->id_role);
                
                $matrice[] = [
                    'id_role' => $role->id_role,
                    'nom_role' => $role->nom_role,
                    'id_periode' => $periode->id_periode,
                    'nom_periode' => $periode->nom_periode,
                    'periode_ouverte' => $periode->est_ouverte,
                    'id_template' => $assignation?->id_template,
                    'nom_template' => $assignation?->template->nom_template,
                    'est_assigne' => $assignation !== null,
                    'peut_modifier' => !$periode->est_ouverte,
                ];
            }
        }
        
        return $matrice;
    }
}
```

### TemplateAssignationsController

```php
namespace App\Http\Controllers\Admin;

use App\Models\TemplateEvaluation;
use App\Models\Role;
use App\Models\PeriodeEvaluation;
use App\Services\TemplateAssignationService;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response as InertiaResponse;

class TemplateAssignationsController extends Controller
{
    protected $assignationService;
    
    public function __construct(TemplateAssignationService $assignationService)
    {
        $this->middleware(['auth:api', 'role:ADMIN']);
        $this->assignationService = $assignationService;
    }
    
    public function index(): InertiaResponse
    {
        $matrice = $this->assignationService->getMatriceAssignations();
        $templates = TemplateEvaluation::publie()->get();
        $roles = Role::orderBy('niveau_hierarchique')->get();
        $periodes = PeriodeEvaluation::orderBy('date_debut', 'desc')->get();
        
        return Inertia::render('Admin/Evaluations/Assignations/Index', [
            'matrice' => $matrice,
            'templates' => $templates->map(function($template) {
                return [
                    'id_template' => $template->id_template,
                    'nom_template' => $template->nom_template,
                    'regle_nom' => $template->regleEvaluation->nom_regle,
                ];
            }),
            'roles' => $roles->map(function($role) {
                return [
                    'id_role' => $role->id_role,
                    'nom_role' => $role->nom_role,
                    'nom_complet' => $role->nom_complet,
                ];
            }),
            'periodes' => $periodes->map(function($periode) {
                return [
                    'id_periode' => $periode->id_periode,
                    'nom_periode' => $periode->nom_periode,
                    'est_ouverte' => $periode->est_ouverte,
                ];
            }),
        ]);
    }
    
    public function assign(Request $request)
    {
        $validated = $request->validate([
            'id_template' => 'required|exists:templates_evaluation,id_template',
            'id_role' => 'required|exists:roles,id_role',
            'id_periode' => 'required|exists:periodes_evaluation,id_periode',
        ]);
        
        try {
            $this->assignationService->assignTemplate(
                $validated['id_template'],
                $validated['id_role'],
                $validated['id_periode']
            );
            
            return back()->with('success', 'Template assigné avec succès');
            
        } catch (\Exception $e) {
            return back()->withErrors(['assignation' => $e->getMessage()]);
        }
    }
    
    public function update(Request $request)
    {
        $validated = $request->validate([
            'id_template' => 'required|exists:templates_evaluation,id_template',
            'id_role' => 'required|exists:roles,id_role',
            'id_periode' => 'required|exists:periodes_evaluation,id_periode',
        ]);
        
        try {
            $this->assignationService->updateAssignation(
                $validated['id_role'],
                $validated['id_periode'],
                $validated['id_template']
            );
            
            return back()->with('success', 'Assignation mise à jour avec succès');
            
        } catch (\Exception $e) {
            return back()->withErrors(['assignation' => $e->getMessage()]);
        }
    }
}
```

### Composant MatriceAssignations

```tsx
// resources/js/Components/Evaluations/MatriceAssignations.tsx
import { useState } from 'react';
import { Card } from '@/Components/UI/Card';
import { Badge } from '@/Components/UI/Badge';
import { Select } from '@/Components/UI/Select';
import { Button } from '@/Components/UI/Button';
import { CheckCircle, AlertCircle, Lock } from 'lucide-react';
import { router } from '@inertiajs/react';

interface Template {
    id_template: string;
    nom_template: string;
    regle_nom: string;
}

interface Assignation {
    id_role: number;
    nom_role: string;
    id_periode: string;
    nom_periode: string;
    periode_ouverte: boolean;
    id_template?: string;
    nom_template?: string;
    est_assigne: boolean;
    peut_modifier: boolean;
}

interface MatriceAssignationsProps {
    matrice: Assignation[];
    templates: Template[];
    roles: Array<{ id_role: number; nom_role: string }>;
    periodes: Array<{ id_periode: string; nom_periode: string; est_ouverte: boolean }>;
}

export default function MatriceAssignations({
    matrice,
    templates,
    roles,
    periodes
}: MatriceAssignationsProps) {
    const [selectedPeriode, setSelectedPeriode] = useState(periodes[0]?.id_periode);
    
    const filteredMatrice = matrice.filter(item => item.id_periode === selectedPeriode);
    const periodeOuverte = periodes.find(p => p.id_periode === selectedPeriode)?.est_ouverte;
    
    const handleAssign = (idRole: number, idTemplate: string) => {
        const assignation = filteredMatrice.find(item => item.id_role === idRole);
        
        if (assignation?.est_assigne) {
            // Mise à jour
            router.post('/admin/evaluations/assignations/update', {
                id_role: idRole,
                id_periode: selectedPeriode,
                id_template: idTemplate,
            });
        } else {
            // Nouvelle assignation
            router.post('/admin/evaluations/assignations/assign', {
                id_role: idRole,
                id_periode: selectedPeriode,
                id_template: idTemplate,
            });
        }
    };
    
    return (
        <div className="space-y-6">
            {/* Filtre période */}
            <Card className="p-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                        <label className="text-sm font-medium text-sabc-gray-800">
                            Période :
                        </label>
                        <Select
                            value={selectedPeriode}
                            onChange={(e) => setSelectedPeriode(e.target.value)}
                            className="w-64"
                        >
                            {periodes.map((periode) => (
                                <option key={periode.id_periode} value={periode.id_periode}>
                                    {periode.nom_periode}
                                    {periode.est_ouverte && ' (Ouverte)'}
                                </option>
                            ))}
                        </Select>
                    </div>
                    
                    {periodeOuverte && (
                        <Badge variant="warning">
                            <Lock size={14} className="mr-1" />
                            Période ouverte - Modifications bloquées
                        </Badge>
                    )}
                </div>
            </Card>
            
            {/* Matrice */}
            <Card className="overflow-x-auto">
                <table className="w-full">
                    <thead>
                        <tr className="border-b-2 border-sabc-gray-200">
                            <th className="text-left p-4 font-semibold text-sabc-gray-900">
                                Rôle
                            </th>
                            <th className="text-left p-4 font-semibold text-sabc-gray-900">
                                Template Assigné
                            </th>
                            <th className="text-left p-4 font-semibold text-sabc-gray-900">
                                Statut
                            </th>
                            <th className="text-left p-4 font-semibold text-sabc-gray-900">
                                Action
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        {roles.map((role) => {
                            const assignation = filteredMatrice.find(
                                item => item.id_role === role.id_role
                            );
                            
                            return (
                                <tr key={role.id_role} className="border-b border-sabc-gray-100">
                                    <td className="p-4">
                                        <div className="font-medium text-sabc-gray-900">
                                            {role.nom_role}
                                        </div>
                                    </td>
                                    <td className="p-4">
                                        {assignation?.est_assigne ? (
                                            <div className="text-sm text-sabc-gray-800">
                                                {assignation.nom_template}
                                            </div>
                                        ) : (
                                            <span className="text-sm text-sabc-gray-400">
                                                Non assigné
                                            </span>
                                        )}
                                    </td>
                                    <td className="p-4">
                                        {assignation?.est_assigne ? (
                                            <Badge variant="success">
                                                <CheckCircle size={14} className="mr-1" />
                                                Assigné
                                            </Badge>
                                        ) : (
                                            <Badge variant="danger">
                                                <AlertCircle size={14} className="mr-1" />
                                                Non assigné
                                            </Badge>
                                        )}
                                    </td>
                                    <td className="p-4">
                                        {periodeOuverte ? (
                                            <Badge variant="secondary">
                                                <Lock size={14} className="mr-1" />
                                                Verrouillé
                                            </Badge>
                                        ) : (
                                            <Select
                                                value={assignation?.id_template || ''}
                                                onChange={(e) => handleAssign(role.id_role, e.target.value)}
                                                className="w-64"
                                            >
                                                <option value="">Sélectionner un template...</option>
                                                {templates.map((template) => (
                                                    <option 
                                                        key={template.id_template} 
                                                        value={template.id_template}
                                                    >
                                                        {template.nom_template}
                                                    </option>
                                                ))}
                                            </Select>
                                        )}
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </Card>
        </div>
    );
}
```

### Exceptions Personnalisées

```php
namespace App\Exceptions;

class TemplateNotAssignedException extends \Exception
{
    //
}

class PeriodeOuverteException extends \Exception
{
    //
}
```

### Project Structure Notes

**Fichiers à créer :**
- `database/migrations/xxxx_create_templates_roles_periodes_table.php`
- `app/Models/TemplateRolePeriode.php`
- `app/Services/TemplateAssignationService.php`
- `app/Exceptions/TemplateNotAssignedException.php`
- `app/Exceptions/PeriodeOuverteException.php`
- `app/Http/Controllers/Admin/TemplateAssignationsController.php`
- `resources/js/Pages/Admin/Evaluations/Assignations/Index.tsx`
- `resources/js/Components/Evaluations/MatriceAssignations.tsx`

**Fichiers à modifier :**
- `routes/web.php` : Ajouter routes assignations
- Workflow création évaluation : Intégrer `getTemplateForRolePeriode()`

**Dépendances Stories Précédentes :**
- Story 1.3 : Table roles
- Story 3.1 : Templates évaluation créés
- Story 3.3 : Périodes évaluation (à créer)

### Règles Métier SABC Critiques

**Contrainte Unique :**
- Un seul template par (rôle, période)
- Pas de doublon autorisé

**Modification :**
- Autorisée : Période non ouverte (`est_ouverte = false`)
- Bloquée : Période ouverte (`est_ouverte = true`)

**Sélection Automatique :**
- Lors création évaluation : Récupération automatique template
- Exception si aucun template : Message explicite à l'utilisateur

**Performance :**
- Cache Redis 10 minutes pour templates assignés
- Invalidation cache lors modification

### References

- [Source: epics.md#Epic 3 Story 3.2] - Acceptance criteria complets
- [Source: architecture.md#Data Models] - Structure assignations
- [Source: project-context.md#Critical Implementation Rules] - PostgreSQL, TypeScript strict

## Dev Agent Record

### Agent Model Used

_À remplir par le dev agent_

### Debug Log References

_À remplir par le dev agent_

### Completion Notes List

_À remplir par le dev agent_

### File List

_À remplir par le dev agent_
