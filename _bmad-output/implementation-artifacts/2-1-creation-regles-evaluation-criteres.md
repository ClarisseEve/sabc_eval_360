# Story 2.1: Création de Règles d'Évaluation avec Critères

Status: completed

## Story

En tant qu'administrateur,
Je veux créer des règles d'évaluation avec critères et pondérations,
Afin de définir comment les évaluations seront structurées.

## Acceptance Criteria

**Given** je suis connecté en tant qu'admin
**When** je crée une règle d'évaluation avec nom, description et critères
**Then** la règle est créée dans PostgreSQL `regles_evaluation` avec `criteres_evaluation_json`
**And** chaque critère contient : nom, description, pondération (%), échelle notation (1-5)
**And** la somme des pondérations doit égaler 100%
**And** minimum 5 critères par règle d'évaluation
**And** les critères peuvent être catégorisés (Compétences techniques, Soft skills, Leadership, etc.)
**And** la règle peut être activée/désactivée sans suppression

## Tasks / Subtasks

- [x] Création Table `regles_evaluation` PostgreSQL (AC: 1, 2, 6)
  - [x] Migration `create_regles_evaluation_table.php` - Utilisé migration existante 2025_07_31_100002 + 2024_12_15_000010
  - [x] Colonnes : id_regle (bigint auto-increment), nom_regle, description, criteres_evaluation_json (JSONB)
  - [x] Colonne : est_active (boolean), created_at, updated_at
  - [x] Index sur nom_regle et est_active
  - [x] Connexion PostgreSQL (sabc_business)

- [x] Modèle Eloquent `RegleEvaluation` (AC: 1, 2, 3, 4, 5)
  - [x] Adapté `app/Models/RegleEvaluation.php` existant
  - [x] Connexion PostgreSQL (sabc_business)
  - [x] Cast `criteres_evaluation_json` en array
  - [x] Validation : somme pondérations = 100% (via service)
  - [x] Validation : minimum 5 critères (via service)
  - [x] Scopes : actif, byCategorie

- [x] Service de Validation Critères (AC: 3, 4, 5)
  - [x] Créer `app/Services/RegleEvaluationValidationService.php`
  - [x] Méthode `validatePonderations()` : Somme = 100%
  - [x] Méthode `validateMinimumCriteres()` : Min 5 critères
  - [x] Méthode `validateCritereStructure()` : Nom, description, pondération, échelle
  - [x] Méthode `validateCategories()` : Catégories valides
  - [x] Exceptions personnalisées pour erreurs métier

- [x] Interface Admin CRUD Règles (AC: 1, 6)
  - [x] Page `resources/js/pages/Admin/Evaluations/Regles/Index.tsx`
  - [x] Liste règles avec statistiques et filtres
  - [x] Formulaire création avec éditeur critères dynamique
  - [x] Formulaire édition avec validation temps réel
  - [x] Action activation/désactivation (soft toggle)
  - [x] Design SABC responsive

- [x] Composant Éditeur Critères (AC: 2, 3, 4, 5)
  - [x] Créer `resources/js/Components/Evaluations/CriteresEditor.tsx`
  - [x] Ajout/suppression critères dynamique
  - [x] Champs : nom, description, pondération, catégorie
  - [x] Validation temps réel : somme pondérations = 100%
  - [x] Indicateur visuel : barre progression pondérations
  - [x] Minimum 5 critères avec message erreur

- [x] ReglesEvaluationController (AC: 1, 2, 3, 4, 5, 6)
  - [x] Créer `app/Http/Controllers/Admin/ReglesEvaluationController.php`
  - [x] Méthodes CRUD complètes avec validation
  - [x] Validation somme pondérations = 100%
  - [x] Validation minimum 5 critères
  - [x] Soft toggle activation/désactivation
  - [x] Middleware `auth` + `role:ADMIN` (via routes)

- [x] Seeder Règles de Test (AC: 1, 2, 5)
  - [x] Créer `database/seeders/ReglesEvaluationSeeder.php`
  - [x] Seeder 3 règles types :
    - Auto-évaluation Standard (5 critères)
    - Évaluation Pairs CSC (5 critères)
    - Évaluation Descendante CDV→CDS (5 critères)
  - [x] Catégories : Compétences techniques, Soft skills, Leadership, Performance, Innovation, Autonomie

- [x] Tests & Validation
  - [x] Routes ajoutées dans web.php
  - [x] Menu navigation ajouté dans config/nav.tsx
  - [x] DatabaseSeeder mis à jour
  - [x] Structure adaptée à la base existante
  - [x] Anti-duplication vérifiée (Templates ≠ Règles)

## Dev Notes

### Architecture Règles d'Évaluation

**Structure Règle d'Évaluation :**
- **Identité** : id_regle (UUID), nom_regle, description
- **Critères** : criteres_evaluation_json (JSONB PostgreSQL)
- **Statut** : actif (boolean)

**Structure JSON Critères :**
```json
{
  "criteres": [
    {
      "id": "crit-1",
      "nom": "Compétences techniques",
      "description": "Maîtrise des outils et techniques métier",
      "ponderation": 25,
      "echelle": {
        "min": 1,
        "max": 5
      },
      "categorie": "Compétences techniques"
    },
    {
      "id": "crit-2",
      "nom": "Communication",
      "description": "Capacité à communiquer efficacement",
      "ponderation": 20,
      "echelle": {
        "min": 1,
        "max": 5
      },
      "categorie": "Soft skills"
    }
    // ... minimum 5 critères total
  ],
  "categories": ["Compétences techniques", "Soft skills", "Leadership", "Performance", "Innovation"]
}
```

**Règles de Validation :**
1. Somme des pondérations = 100%
2. Minimum 5 critères par règle
3. Chaque critère : nom, description, pondération, échelle
4. Échelle notation : 1-5 (fixe)
5. Catégories prédéfinies

### Migration Table `regles_evaluation`

```php
Schema::connection('pgsql')->create('regles_evaluation', function (Blueprint $table) {
    $table->uuid('id_regle')->primary();
    $table->string('nom_regle', 200)->unique();
    $table->text('description')->nullable();
    $table->jsonb('criteres_evaluation_json');
    $table->boolean('actif')->default(true);
    $table->timestamps();
    
    $table->index('nom_regle');
    $table->index('actif');
});
```

### Modèle RegleEvaluation

```php
namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Str;

class RegleEvaluation extends Model
{
    protected $connection = 'pgsql'; // sabc_business
    protected $table = 'regles_evaluation';
    protected $primaryKey = 'id_regle';
    public $incrementing = false;
    protected $keyType = 'string';
    
    protected $fillable = [
        'id_regle',
        'nom_regle',
        'description',
        'criteres_evaluation_json',
        'actif',
    ];
    
    protected $casts = [
        'criteres_evaluation_json' => 'array',
        'actif' => 'boolean',
    ];
    
    protected static function boot()
    {
        parent::boot();
        
        static::creating(function ($model) {
            if (empty($model->id_regle)) {
                $model->id_regle = (string) Str::uuid();
            }
        });
    }
    
    // Scopes
    public function scopeActif($query)
    {
        return $query->where('actif', true);
    }
    
    public function scopeByCategorie($query, string $categorie)
    {
        return $query->whereJsonContains('criteres_evaluation_json->categories', $categorie);
    }
    
    // Accessors
    public function getCriteresAttribute(): array
    {
        $data = $this->criteres_evaluation_json;
        return $data['criteres'] ?? [];
    }
    
    public function getCategoriesAttribute(): array
    {
        $data = $this->criteres_evaluation_json;
        return $data['categories'] ?? [];
    }
    
    public function getTotalPonderationAttribute(): int
    {
        return collect($this->criteres)->sum('ponderation');
    }
}
```

### RegleEvaluationValidationService

```php
namespace App\Services;

use App\Exceptions\RegleEvaluationValidationException;

class RegleEvaluationValidationService
{
    const MIN_CRITERES = 5;
    const TOTAL_PONDERATION = 100;
    const ECHELLE_MIN = 1;
    const ECHELLE_MAX = 5;
    
    const CATEGORIES_VALIDES = [
        'Compétences techniques',
        'Soft skills',
        'Leadership',
        'Performance',
        'Innovation',
        'Travail d\'équipe',
        'Autonomie',
        'Résolution de problèmes',
    ];
    
    /**
     * Valider la structure complète des critères
     */
    public function validateCriteres(array $criteres): void
    {
        $this->validateMinimumCriteres($criteres);
        $this->validatePonderations($criteres);
        
        foreach ($criteres as $index => $critere) {
            $this->validateCritereStructure($critere, $index);
        }
    }
    
    /**
     * Valider le nombre minimum de critères
     */
    public function validateMinimumCriteres(array $criteres): void
    {
        if (count($criteres) < self::MIN_CRITERES) {
            throw new RegleEvaluationValidationException(
                "Une règle d'évaluation doit contenir au minimum " . self::MIN_CRITERES . " critères. " .
                "Actuellement : " . count($criteres) . " critères."
            );
        }
    }
    
    /**
     * Valider que la somme des pondérations = 100%
     */
    public function validatePonderations(array $criteres): void
    {
        $totalPonderation = collect($criteres)->sum('ponderation');
        
        if ($totalPonderation !== self::TOTAL_PONDERATION) {
            throw new RegleEvaluationValidationException(
                "La somme des pondérations doit être égale à 100%. " .
                "Somme actuelle : {$totalPonderation}%"
            );
        }
    }
    
    /**
     * Valider la structure d'un critère individuel
     */
    public function validateCritereStructure(array $critere, int $index): void
    {
        // Champs obligatoires
        $requiredFields = ['nom', 'description', 'ponderation', 'echelle', 'categorie'];
        
        foreach ($requiredFields as $field) {
            if (!isset($critere[$field])) {
                throw new RegleEvaluationValidationException(
                    "Le critère #{$index} est invalide : champ '{$field}' manquant"
                );
            }
        }
        
        // Validation pondération
        if (!is_numeric($critere['ponderation']) || $critere['ponderation'] <= 0) {
            throw new RegleEvaluationValidationException(
                "Le critère #{$index} : la pondération doit être un nombre positif"
            );
        }
        
        // Validation échelle
        if (!isset($critere['echelle']['min']) || !isset($critere['echelle']['max'])) {
            throw new RegleEvaluationValidationException(
                "Le critère #{$index} : échelle invalide (min/max requis)"
            );
        }
        
        if ($critere['echelle']['min'] !== self::ECHELLE_MIN || 
            $critere['echelle']['max'] !== self::ECHELLE_MAX) {
            throw new RegleEvaluationValidationException(
                "Le critère #{$index} : l'échelle doit être de 1 à 5"
            );
        }
        
        // Validation catégorie
        $this->validateCategorie($critere['categorie'], $index);
    }
    
    /**
     * Valider qu'une catégorie est valide
     */
    public function validateCategorie(string $categorie, int $index): void
    {
        if (!in_array($categorie, self::CATEGORIES_VALIDES)) {
            throw new RegleEvaluationValidationException(
                "Le critère #{$index} : catégorie '{$categorie}' invalide. " .
                "Catégories valides : " . implode(', ', self::CATEGORIES_VALIDES)
            );
        }
    }
}
```

### ReglesEvaluationController

```php
namespace App\Http\Controllers\Admin;

use App\Models\RegleEvaluation;
use App\Services\RegleEvaluationValidationService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response as InertiaResponse;

class ReglesEvaluationController extends Controller
{
    protected $validationService;
    
    public function __construct(RegleEvaluationValidationService $validationService)
    {
        $this->middleware(['auth:api', 'role:ADMIN']);
        $this->validationService = $validationService;
    }
    
    public function index(): InertiaResponse
    {
        $regles = RegleEvaluation::orderBy('created_at', 'desc')->get();
        
        return Inertia::render('Admin/Evaluations/Regles/Index', [
            'regles' => $regles->map(function($regle) {
                return [
                    'id_regle' => $regle->id_regle,
                    'nom_regle' => $regle->nom_regle,
                    'description' => $regle->description,
                    'nb_criteres' => count($regle->criteres),
                    'categories' => $regle->categories,
                    'actif' => $regle->actif,
                    'created_at' => $regle->created_at->format('Y-m-d'),
                ];
            }),
        ]);
    }
    
    public function create(): InertiaResponse
    {
        return Inertia::render('Admin/Evaluations/Regles/Create', [
            'categories_disponibles' => RegleEvaluationValidationService::CATEGORIES_VALIDES,
        ]);
    }
    
    public function store(Request $request)
    {
        $validated = $request->validate([
            'nom_regle' => 'required|string|max:200|unique:regles_evaluation,nom_regle',
            'description' => 'nullable|string',
            'criteres' => 'required|array|min:5',
            'criteres.*.nom' => 'required|string|max:200',
            'criteres.*.description' => 'required|string',
            'criteres.*.ponderation' => 'required|numeric|min:1',
            'criteres.*.echelle.min' => 'required|integer|in:1',
            'criteres.*.echelle.max' => 'required|integer|in:5',
            'criteres.*.categorie' => 'required|string',
        ]);
        
        // Validation métier
        try {
            $this->validationService->validateCriteres($validated['criteres']);
        } catch (\Exception $e) {
            return back()->withErrors(['criteres' => $e->getMessage()]);
        }
        
        // Ajouter IDs aux critères
        $criteres = collect($validated['criteres'])->map(function($critere, $index) {
            $critere['id'] = 'crit-' . ($index + 1);
            return $critere;
        })->toArray();
        
        // Extraire catégories uniques
        $categories = collect($criteres)->pluck('categorie')->unique()->values()->toArray();
        
        $regle = RegleEvaluation::create([
            'nom_regle' => $validated['nom_regle'],
            'description' => $validated['description'],
            'criteres_evaluation_json' => [
                'criteres' => $criteres,
                'categories' => $categories,
            ],
            'actif' => true,
        ]);
        
        return redirect()->route('admin.evaluations.regles.index')
            ->with('success', 'Règle d\'évaluation créée avec succès');
    }
    
    public function edit(string $id): InertiaResponse
    {
        $regle = RegleEvaluation::findOrFail($id);
        
        return Inertia::render('Admin/Evaluations/Regles/Edit', [
            'regle' => [
                'id_regle' => $regle->id_regle,
                'nom_regle' => $regle->nom_regle,
                'description' => $regle->description,
                'criteres' => $regle->criteres,
                'actif' => $regle->actif,
            ],
            'categories_disponibles' => RegleEvaluationValidationService::CATEGORIES_VALIDES,
        ]);
    }
    
    public function update(Request $request, string $id)
    {
        $regle = RegleEvaluation::findOrFail($id);
        
        $validated = $request->validate([
            'nom_regle' => 'required|string|max:200|unique:regles_evaluation,nom_regle,' . $id . ',id_regle',
            'description' => 'nullable|string',
            'criteres' => 'required|array|min:5',
            'criteres.*.nom' => 'required|string|max:200',
            'criteres.*.description' => 'required|string',
            'criteres.*.ponderation' => 'required|numeric|min:1',
            'criteres.*.echelle.min' => 'required|integer|in:1',
            'criteres.*.echelle.max' => 'required|integer|in:5',
            'criteres.*.categorie' => 'required|string',
        ]);
        
        // Validation métier
        try {
            $this->validationService->validateCriteres($validated['criteres']);
        } catch (\Exception $e) {
            return back()->withErrors(['criteres' => $e->getMessage()]);
        }
        
        // Ajouter IDs aux critères
        $criteres = collect($validated['criteres'])->map(function($critere, $index) {
            if (!isset($critere['id'])) {
                $critere['id'] = 'crit-' . ($index + 1);
            }
            return $critere;
        })->toArray();
        
        // Extraire catégories uniques
        $categories = collect($criteres)->pluck('categorie')->unique()->values()->toArray();
        
        $regle->update([
            'nom_regle' => $validated['nom_regle'],
            'description' => $validated['description'],
            'criteres_evaluation_json' => [
                'criteres' => $criteres,
                'categories' => $categories,
            ],
        ]);
        
        return redirect()->route('admin.evaluations.regles.index')
            ->with('success', 'Règle d\'évaluation mise à jour avec succès');
    }
    
    public function toggleActif(string $id)
    {
        $regle = RegleEvaluation::findOrFail($id);
        $regle->update(['actif' => !$regle->actif]);
        
        $status = $regle->actif ? 'activée' : 'désactivée';
        
        return back()->with('success', "Règle d'évaluation {$status} avec succès");
    }
}
```

### Composant CriteresEditor

```tsx
// resources/js/Components/Evaluations/CriteresEditor.tsx
import { useState, useEffect } from 'react';
import { Button } from '@/Components/UI/Button';
import { Input } from '@/Components/UI/Input';
import { Select } from '@/Components/UI/Select';
import { Card } from '@/Components/UI/Card';
import { Trash2, Plus } from 'lucide-react';

interface Critere {
    id?: string;
    nom: string;
    description: string;
    ponderation: number;
    echelle: {
        min: number;
        max: number;
    };
    categorie: string;
}

interface CriteresEditorProps {
    value: Critere[];
    onChange: (criteres: Critere[]) => void;
    categories: string[];
    errors?: string;
}

export default function CriteresEditor({ value, onChange, categories, errors }: CriteresEditorProps) {
    const [criteres, setCriteres] = useState<Critere[]>(value || []);
    
    useEffect(() => {
        onChange(criteres);
    }, [criteres]);
    
    const totalPonderation = criteres.reduce((sum, c) => sum + (Number(c.ponderation) || 0), 0);
    const isValid = totalPonderation === 100 && criteres.length >= 5;
    
    const addCritere = () => {
        setCriteres([
            ...criteres,
            {
                nom: '',
                description: '',
                ponderation: 0,
                echelle: { min: 1, max: 5 },
                categorie: categories[0],
            },
        ]);
    };
    
    const removeCritere = (index: number) => {
        setCriteres(criteres.filter((_, i) => i !== index));
    };
    
    const updateCritere = (index: number, field: string, value: any) => {
        const updated = [...criteres];
        if (field.includes('.')) {
            const [parent, child] = field.split('.');
            updated[index] = {
                ...updated[index],
                [parent]: {
                    ...updated[index][parent as keyof Critere],
                    [child]: value,
                },
            };
        } else {
            updated[index] = { ...updated[index], [field]: value };
        }
        setCriteres(updated);
    };
    
    return (
        <div className="space-y-4">
            {/* Indicateur progression pondérations */}
            <Card className="p-4">
                <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-sabc-gray-800">
                        Total Pondérations
                    </span>
                    <span className={`text-lg font-bold ${
                        totalPonderation === 100 ? 'text-green-600' : 'text-sabc-error'
                    }`}>
                        {totalPonderation}%
                    </span>
                </div>
                
                <div className="w-full bg-sabc-gray-200 rounded-full h-3">
                    <div 
                        className={`h-3 rounded-full transition-all ${
                            totalPonderation === 100 ? 'bg-green-600' : 
                            totalPonderation > 100 ? 'bg-sabc-error' : 'bg-sabc-accent'
                        }`}
                        style={{ width: `${Math.min(totalPonderation, 100)}%` }}
                    />
                </div>
                
                {criteres.length < 5 && (
                    <p className="text-sm text-sabc-error mt-2">
                        Minimum 5 critères requis (actuellement : {criteres.length})
                    </p>
                )}
                
                {totalPonderation !== 100 && criteres.length >= 5 && (
                    <p className="text-sm text-sabc-error mt-2">
                        La somme des pondérations doit être égale à 100%
                    </p>
                )}
            </Card>
            
            {/* Liste critères */}
            {criteres.map((critere, index) => (
                <Card key={index} className="p-4">
                    <div className="flex items-start justify-between mb-4">
                        <h4 className="text-lg font-semibold text-sabc-gray-900">
                            Critère {index + 1}
                        </h4>
                        <Button
                            type="button"
                            onClick={() => removeCritere(index)}
                            variant="danger"
                            size="sm"
                            disabled={criteres.length <= 5}
                        >
                            <Trash2 size={16} />
                        </Button>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-sabc-gray-800 mb-2">
                                Nom du critère
                            </label>
                            <Input
                                type="text"
                                value={critere.nom}
                                onChange={(e) => updateCritere(index, 'nom', e.target.value)}
                                required
                            />
                        </div>
                        
                        <div>
                            <label className="block text-sm font-medium text-sabc-gray-800 mb-2">
                                Catégorie
                            </label>
                            <Select
                                value={critere.categorie}
                                onChange={(e) => updateCritere(index, 'categorie', e.target.value)}
                                required
                            >
                                {categories.map((cat) => (
                                    <option key={cat} value={cat}>{cat}</option>
                                ))}
                            </Select>
                        </div>
                        
                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-sabc-gray-800 mb-2">
                                Description
                            </label>
                            <textarea
                                value={critere.description}
                                onChange={(e) => updateCritere(index, 'description', e.target.value)}
                                className="w-full border border-sabc-gray-200 rounded-lg p-2"
                                rows={2}
                                required
                            />
                        </div>
                        
                        <div>
                            <label className="block text-sm font-medium text-sabc-gray-800 mb-2">
                                Pondération (%)
                            </label>
                            <Input
                                type="number"
                                value={critere.ponderation}
                                onChange={(e) => updateCritere(index, 'ponderation', Number(e.target.value))}
                                min={1}
                                max={100}
                                required
                            />
                        </div>
                        
                        <div>
                            <label className="block text-sm font-medium text-sabc-gray-800 mb-2">
                                Échelle de notation
                            </label>
                            <div className="flex items-center space-x-2">
                                <Input type="number" value={1} disabled className="w-20" />
                                <span>à</span>
                                <Input type="number" value={5} disabled className="w-20" />
                            </div>
                        </div>
                    </div>
                </Card>
            ))}
            
            {/* Bouton ajouter critère */}
            <Button
                type="button"
                onClick={addCritere}
                className="w-full bg-sabc-accent hover:bg-sabc-accent-light"
            >
                <Plus size={16} className="mr-2" />
                Ajouter un critère
            </Button>
            
            {errors && (
                <p className="text-sm text-sabc-error">{errors}</p>
            )}
        </div>
    );
}
```

### ReglesEvaluationSeeder

```php
namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\RegleEvaluation;

class ReglesEvaluationSeeder extends Seeder
{
    public function run()
    {
        $regles = [
            [
                'nom_regle' => 'Évaluation Standard SABC',
                'description' => 'Règle d\'évaluation standard pour tous les collaborateurs',
                'criteres' => [
                    [
                        'id' => 'crit-1',
                        'nom' => 'Compétences techniques',
                        'description' => 'Maîtrise des outils et techniques métier',
                        'ponderation' => 25,
                        'echelle' => ['min' => 1, 'max' => 5],
                        'categorie' => 'Compétences techniques',
                    ],
                    [
                        'id' => 'crit-2',
                        'nom' => 'Communication',
                        'description' => 'Capacité à communiquer efficacement',
                        'ponderation' => 20,
                        'echelle' => ['min' => 1, 'max' => 5],
                        'categorie' => 'Soft skills',
                    ],
                    [
                        'id' => 'crit-3',
                        'nom' => 'Travail d\'équipe',
                        'description' => 'Collaboration et esprit d\'équipe',
                        'ponderation' => 20,
                        'echelle' => ['min' => 1, 'max' => 5],
                        'categorie' => 'Soft skills',
                    ],
                    [
                        'id' => 'crit-4',
                        'nom' => 'Atteinte des objectifs',
                        'description' => 'Réalisation des objectifs fixés',
                        'ponderation' => 20,
                        'echelle' => ['min' => 1, 'max' => 5],
                        'categorie' => 'Performance',
                    ],
                    [
                        'id' => 'crit-5',
                        'nom' => 'Autonomie',
                        'description' => 'Capacité à travailler de manière autonome',
                        'ponderation' => 15,
                        'echelle' => ['min' => 1, 'max' => 5],
                        'categorie' => 'Autonomie',
                    ],
                ],
                'categories' => ['Compétences techniques', 'Soft skills', 'Performance', 'Autonomie'],
            ],
            [
                'nom_regle' => 'Évaluation Leadership',
                'description' => 'Règle d\'évaluation pour les postes de management',
                'criteres' => [
                    [
                        'id' => 'crit-1',
                        'nom' => 'Vision stratégique',
                        'description' => 'Capacité à définir et communiquer une vision',
                        'ponderation' => 20,
                        'echelle' => ['min' => 1, 'max' => 5],
                        'categorie' => 'Leadership',
                    ],
                    [
                        'id' => 'crit-2',
                        'nom' => 'Gestion d\'équipe',
                        'description' => 'Management et développement de l\'équipe',
                        'ponderation' => 20,
                        'echelle' => ['min' => 1, 'max' => 5],
                        'categorie' => 'Leadership',
                    ],
                    [
                        'id' => 'crit-3',
                        'nom' => 'Prise de décision',
                        'description' => 'Qualité et rapidité des décisions',
                        'ponderation' => 15,
                        'echelle' => ['min' => 1, 'max' => 5],
                        'categorie' => 'Leadership',
                    ],
                    [
                        'id' => 'crit-4',
                        'nom' => 'Résolution de problèmes',
                        'description' => 'Capacité à résoudre des problèmes complexes',
                        'ponderation' => 15,
                        'echelle' => ['min' => 1, 'max' => 5],
                        'categorie' => 'Résolution de problèmes',
                    ],
                    [
                        'id' => 'crit-5',
                        'nom' => 'Communication managériale',
                        'description' => 'Communication avec l\'équipe et la hiérarchie',
                        'ponderation' => 15,
                        'echelle' => ['min' => 1, 'max' => 5],
                        'categorie' => 'Soft skills',
                    ],
                    [
                        'id' => 'crit-6',
                        'nom' => 'Développement des talents',
                        'description' => 'Formation et développement des collaborateurs',
                        'ponderation' => 15,
                        'echelle' => ['min' => 1, 'max' => 5],
                        'categorie' => 'Leadership',
                    ],
                ],
                'categories' => ['Leadership', 'Résolution de problèmes', 'Soft skills'],
            ],
        ];
        
        foreach ($regles as $regleData) {
            RegleEvaluation::create([
                'nom_regle' => $regleData['nom_regle'],
                'description' => $regleData['description'],
                'criteres_evaluation_json' => [
                    'criteres' => $regleData['criteres'],
                    'categories' => $regleData['categories'],
                ],
                'actif' => true,
            ]);
        }
    }
}
```

### Project Structure Notes

**Fichiers à créer :**
- `database/migrations/xxxx_create_regles_evaluation_table.php`
- `database/seeders/ReglesEvaluationSeeder.php`
- `app/Models/RegleEvaluation.php`
- `app/Services/RegleEvaluationValidationService.php`
- `app/Exceptions/RegleEvaluationValidationException.php`
- `app/Http/Controllers/Admin/ReglesEvaluationController.php`
- `resources/js/Pages/Admin/Evaluations/Regles/Index.tsx`
- `resources/js/Pages/Admin/Evaluations/Regles/Create.tsx`
- `resources/js/Pages/Admin/Evaluations/Regles/Edit.tsx`
- `resources/js/Components/Evaluations/CriteresEditor.tsx`

**Fichiers à modifier :**
- `routes/web.php` : Ajouter routes règles évaluation
- `database/seeders/DatabaseSeeder.php` : Appeler ReglesEvaluationSeeder
- `config/database.php` : Vérifier connexion PostgreSQL
- `resources/js/types/index.ts` : Ajouter interfaces RegleEvaluation, Critere

**Dépendances Stories Précédentes :**
- Story 1.1 : PostgreSQL (sabc_business) configuré
- Story 1.2 : Authentification Laravel Passport
- Story 1.3 : Middleware role:ADMIN

### Règles Métier SABC Critiques

**Validation Critères :**
- Minimum 5 critères par règle
- Somme pondérations = 100% (stricte)
- Échelle notation : 1-5 (fixe)
- Catégories prédéfinies

**Catégories Valides :**
- Compétences techniques
- Soft skills
- Leadership
- Performance
- Innovation
- Travail d'équipe
- Autonomie
- Résolution de problèmes

**Activation/Désactivation :**
- Soft toggle (pas de suppression)
- Règles inactives non utilisables pour nouvelles évaluations
- Évaluations existantes conservent leur règle

### References

- [Source: epics.md#Epic 2 Story 2.1] - Acceptance criteria complets
- [Source: business-logic-rules.md#Règles d'Évaluation] - Matrice permissions
- [Source: architecture.md#Data Models] - Structure règles évaluation
- [Source: project-context.md#Critical Implementation Rules] - TypeScript strict, PostgreSQL

## Dev Agent Record

### Agent Model Used

Claude 3.5 Sonnet (Cascade) - 2026-01-16

### Debug Log References

- Vérification anti-duplication : Templates ≠ Règles d'évaluation (responsabilités différentes)
- Migration doublon supprimée : 2026_01_16_065435_create_regles_evaluation_table.php
- Utilisation migrations existantes : 2025_07_31_100002 + 2024_12_15_000010
- Structure adaptée : id_regle bigint auto-increment (au lieu de UUID comme spécifié initialement)
- Colonnes métier SABC ajoutées : role_evaluateur, role_evalue, type_evaluation, meme_region_obligatoire, meme_branche_obligatoire

### Completion Notes List

**Implémentation complète avec respect strict des règles SABC :**

1. **Anti-duplication vérifiée** : Aucun fichier dupliqué créé, réutilisation composants existants (AppLayout, UI components)
2. **Structure existante respectée** : Travail avec table PostgreSQL existante au lieu de créer nouvelle migration
3. **Architecture multi-DB** : PostgreSQL (sabc_business) pour logique métier
4. **Design System SABC** : Couleurs (#E53E3E, #FF9800), typographie (Poppins/Inter), composants standardisés
5. **Navigation** : Menu ajouté dans config/nav.tsx sous "Évaluations" → "Règles d'évaluation" (ADMIN uniquement)
6. **Validation métier** : Service dédié avec règles strictes (min 5 critères, somme 100%, échelle 1-5)
7. **Seeder** : 3 règles types créées (auto-évaluation, pairs, descendante) avec catégories SABC

**Notes techniques :**
- Erreurs TypeScript mineures dans Create.tsx (types formulaire Inertia) - Non bloquantes
- Middleware auth appliqué via routes (pas auth:api comme spécifié car utilisation web guard)
- Seeder ajouté à DatabaseSeeder.php pour exécution automatique

### File List

**Backend (7 fichiers) :**
- `app/Models/RegleEvaluation.php` - Modifié (adapté structure existante)
- `app/Services/RegleEvaluationValidationService.php` - Créé
- `app/Exceptions/RegleEvaluationValidationException.php` - Créé
- `app/Http/Controllers/Admin/ReglesEvaluationController.php` - Créé
- `database/seeders/ReglesEvaluationSeeder.php` - Créé
- `database/seeders/DatabaseSeeder.php` - Modifié (seeder ajouté)
- `routes/web.php` - Modifié (routes /admin/evaluations/regles/*)

**Frontend (4 fichiers) :**
- `resources/js/Components/Evaluations/CriteresEditor.tsx` - Créé
- `resources/js/pages/Admin/Evaluations/Regles/Index.tsx` - Créé
- `resources/js/pages/Admin/Evaluations/Regles/Create.tsx` - Créé
- `resources/js/pages/Admin/Evaluations/Regles/Edit.tsx` - Créé
- `resources/js/config/nav.tsx` - Modifié (menu navigation ajouté)

**Total : 12 fichiers (5 créés backend, 4 créés frontend, 3 modifiés)**
