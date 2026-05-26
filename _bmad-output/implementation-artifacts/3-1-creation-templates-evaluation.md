# Story 3.1: Création de Templates d'Évaluation

Status: ready-for-dev

## Story

En tant qu'administrateur,
Je veux créer des templates de fiches d'évaluation,
Afin de standardiser les évaluations selon les rôles.

## Acceptance Criteria

**Given** je suis connecté en tant qu'admin
**When** je crée un template d'évaluation
**Then** le template est créé dans PostgreSQL `templates_evaluation` avec nom, description, structure JSON
**And** le template référence une `id_regle` (règle d'évaluation avec critères)
**And** je peux définir des sections personnalisées (Objectifs, Compétences, Développement)
**And** je peux ajouter des champs texte libre pour commentaires
**And** le template peut être marqué comme "publié" ou "brouillon"
**And** seuls les templates publiés sont accessibles aux évaluateurs

## Tasks / Subtasks

- [ ] Création Table `templates_evaluation` PostgreSQL (AC: 1, 2, 5, 6)
  - [ ] Migration `create_templates_evaluation_table.php`
  - [ ] Colonnes : id_template (UUID), nom_template, description, structure_json (JSONB)
  - [ ] Colonnes : id_regle (FK regles_evaluation), statut (enum: brouillon, publie)
  - [ ] Colonnes : created_by, created_at, updated_at
  - [ ] Index sur nom_template, statut, id_regle
  - [ ] Connexion PostgreSQL (sabc_business)

- [ ] Modèle Eloquent `TemplateEvaluation` (AC: 1, 2, 3, 4, 5)
  - [ ] Créer `app/Models/TemplateEvaluation.php`
  - [ ] Connexion PostgreSQL (sabc_business)
  - [ ] Cast `structure_json` en array
  - [ ] Relation `regleEvaluation()` belongsTo
  - [ ] Scopes : publie, brouillon, byRegle
  - [ ] Validation structure JSON

- [ ] Service TemplateStructureValidator (AC: 3, 4)
  - [ ] Créer `app/Services/TemplateStructureValidator.php`
  - [ ] Méthode `validateStructure()` : Validation structure JSON
  - [ ] Méthode `validateSections()` : Sections valides
  - [ ] Méthode `validateChamps()` : Champs texte libre
  - [ ] Exceptions personnalisées

- [ ] Interface Admin CRUD Templates (AC: 1, 2, 3, 4, 5, 6)
  - [ ] Page `resources/js/Pages/Admin/Evaluations/Templates/Index.tsx`
  - [ ] Liste templates avec filtres (statut, règle)
  - [ ] Formulaire création avec éditeur structure
  - [ ] Formulaire édition
  - [ ] Action publication/brouillon
  - [ ] Design SABC responsive

- [ ] Composant TemplateStructureEditor (AC: 3, 4)
  - [ ] Créer `resources/js/Components/Evaluations/TemplateStructureEditor.tsx`
  - [ ] Ajout/suppression sections dynamique
  - [ ] Sections prédéfinies : Objectifs, Compétences, Développement
  - [ ] Champs texte libre pour commentaires
  - [ ] Prévisualisation template
  - [ ] Validation temps réel

- [ ] TemplatesEvaluationController (AC: 1, 2, 3, 4, 5, 6)
  - [ ] Créer `app/Http/Controllers/Admin/TemplatesEvaluationController.php`
  - [ ] Méthodes CRUD complètes
  - [ ] Validation structure JSON
  - [ ] Action publication (brouillon → publié)
  - [ ] Middleware `auth:api` + `role:ADMIN`

- [ ] Seeder Templates de Test (AC: 1, 2, 3, 4, 5)
  - [ ] Créer `TemplatesEvaluationSeeder.php`
  - [ ] Seeder 3 templates types :
    - Template Standard (3 sections)
    - Template Leadership (4 sections)
    - Template Technique (3 sections)
  - [ ] Lier aux règles d'évaluation existantes

- [ ] Tests & Validation
  - [ ] Tester création template avec structure valide
  - [ ] Tester validation structure JSON
  - [ ] Tester publication/brouillon
  - [ ] Tester filtrage templates publiés
  - [ ] Tester sections personnalisées

## Dev Notes

### Architecture Templates d'Évaluation

**Structure Template :**
- **Identité** : id_template (UUID), nom_template, description
- **Règle** : id_regle (FK vers regles_evaluation)
- **Structure** : structure_json (JSONB PostgreSQL)
- **Statut** : brouillon, publié

**Structure JSON Template :**
```json
{
  "sections": [
    {
      "id": "sect-1",
      "titre": "Objectifs",
      "description": "Évaluation de l'atteinte des objectifs",
      "ordre": 1,
      "champs": [
        {
          "id": "champ-1",
          "type": "criteres",
          "source": "regle_evaluation",
          "obligatoire": true
        },
        {
          "id": "champ-2",
          "type": "texte_libre",
          "label": "Commentaires sur les objectifs",
          "max_length": 500,
          "obligatoire": false
        }
      ]
    },
    {
      "id": "sect-2",
      "titre": "Compétences",
      "description": "Évaluation des compétences techniques et soft skills",
      "ordre": 2,
      "champs": [
        {
          "id": "champ-3",
          "type": "criteres",
          "source": "regle_evaluation",
          "obligatoire": true
        }
      ]
    },
    {
      "id": "sect-3",
      "titre": "Développement",
      "description": "Plan de développement et axes d'amélioration",
      "ordre": 3,
      "champs": [
        {
          "id": "champ-4",
          "type": "texte_libre",
          "label": "Points forts",
          "max_length": 300,
          "obligatoire": false
        },
        {
          "id": "champ-5",
          "type": "texte_libre",
          "label": "Axes d'amélioration",
          "max_length": 300,
          "obligatoire": true
        }
      ]
    }
  ],
  "metadata": {
    "version": "1.0",
    "created_at": "2025-01-15T12:00:00Z"
  }
}
```

**Types de Champs :**
- `criteres` : Référence aux critères de la règle d'évaluation
- `texte_libre` : Champ texte pour commentaires

**Sections Prédéfinies :**
- Objectifs
- Compétences
- Développement
- (Personnalisables par admin)

### Migration Table `templates_evaluation`

```php
Schema::connection('pgsql')->create('templates_evaluation', function (Blueprint $table) {
    $table->uuid('id_template')->primary();
    $table->string('nom_template', 200)->unique();
    $table->text('description')->nullable();
    $table->uuid('id_regle');
    $table->jsonb('structure_json');
    $table->enum('statut', ['brouillon', 'publie'])->default('brouillon');
    $table->string('created_by', 5); // Matricule admin créateur
    $table->timestamps();
    
    $table->index('nom_template');
    $table->index('statut');
    $table->index('id_regle');
    
    $table->foreign('id_regle')
        ->references('id_regle')
        ->on('regles_evaluation')
        ->onDelete('restrict');
    
    $table->foreign('created_by')
        ->references('matricule')
        ->on('utilisateurs')
        ->onDelete('restrict');
});
```

### Modèle TemplateEvaluation

```php
namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Str;

class TemplateEvaluation extends Model
{
    protected $connection = 'pgsql'; // sabc_business
    protected $table = 'templates_evaluation';
    protected $primaryKey = 'id_template';
    public $incrementing = false;
    protected $keyType = 'string';
    
    protected $fillable = [
        'id_template',
        'nom_template',
        'description',
        'id_regle',
        'structure_json',
        'statut',
        'created_by',
    ];
    
    protected $casts = [
        'structure_json' => 'array',
    ];
    
    protected static function boot()
    {
        parent::boot();
        
        static::creating(function ($model) {
            if (empty($model->id_template)) {
                $model->id_template = (string) Str::uuid();
            }
        });
    }
    
    // Relations
    public function regleEvaluation()
    {
        return $this->belongsTo(RegleEvaluation::class, 'id_regle', 'id_regle');
    }
    
    public function createur()
    {
        return $this->belongsTo(Utilisateur::class, 'created_by', 'matricule');
    }
    
    // Scopes
    public function scopePublie($query)
    {
        return $query->where('statut', 'publie');
    }
    
    public function scopeBrouillon($query)
    {
        return $query->where('statut', 'brouillon');
    }
    
    public function scopeByRegle($query, string $idRegle)
    {
        return $query->where('id_regle', $idRegle);
    }
    
    // Accessors
    public function getSectionsAttribute(): array
    {
        $data = $this->structure_json;
        return $data['sections'] ?? [];
    }
    
    public function getNbSectionsAttribute(): int
    {
        return count($this->sections);
    }
    
    // Méthodes
    public function publier(): bool
    {
        return $this->update(['statut' => 'publie']);
    }
    
    public function mettreEnBrouillon(): bool
    {
        return $this->update(['statut' => 'brouillon']);
    }
}
```

### TemplateStructureValidator

```php
namespace App\Services;

use App\Exceptions\TemplateStructureValidationException;

class TemplateStructureValidator
{
    const SECTIONS_PREDEFINIES = [
        'Objectifs',
        'Compétences',
        'Développement',
        'Performance',
        'Leadership',
        'Innovation',
    ];
    
    const TYPES_CHAMPS_VALIDES = [
        'criteres',
        'texte_libre',
    ];
    
    /**
     * Valider la structure complète d'un template
     */
    public function validateStructure(array $structure): void
    {
        // Vérifier présence sections
        if (!isset($structure['sections']) || !is_array($structure['sections'])) {
            throw new TemplateStructureValidationException(
                "La structure doit contenir un tableau 'sections'"
            );
        }
        
        // Minimum 1 section
        if (count($structure['sections']) < 1) {
            throw new TemplateStructureValidationException(
                "Le template doit contenir au minimum 1 section"
            );
        }
        
        // Valider chaque section
        foreach ($structure['sections'] as $index => $section) {
            $this->validateSection($section, $index);
        }
    }
    
    /**
     * Valider une section
     */
    protected function validateSection(array $section, int $index): void
    {
        // Champs obligatoires
        $requiredFields = ['id', 'titre', 'ordre', 'champs'];
        
        foreach ($requiredFields as $field) {
            if (!isset($section[$field])) {
                throw new TemplateStructureValidationException(
                    "La section #{$index} est invalide : champ '{$field}' manquant"
                );
            }
        }
        
        // Valider titre
        if (empty($section['titre'])) {
            throw new TemplateStructureValidationException(
                "La section #{$index} : le titre ne peut pas être vide"
            );
        }
        
        // Valider ordre
        if (!is_numeric($section['ordre']) || $section['ordre'] < 1) {
            throw new TemplateStructureValidationException(
                "La section #{$index} : l'ordre doit être un nombre positif"
            );
        }
        
        // Valider champs
        if (!is_array($section['champs']) || count($section['champs']) < 1) {
            throw new TemplateStructureValidationException(
                "La section #{$index} : doit contenir au minimum 1 champ"
            );
        }
        
        // Valider chaque champ
        foreach ($section['champs'] as $champIndex => $champ) {
            $this->validateChamp($champ, $index, $champIndex);
        }
    }
    
    /**
     * Valider un champ
     */
    protected function validateChamp(array $champ, int $sectionIndex, int $champIndex): void
    {
        // Champs obligatoires
        $requiredFields = ['id', 'type', 'obligatoire'];
        
        foreach ($requiredFields as $field) {
            if (!isset($champ[$field])) {
                throw new TemplateStructureValidationException(
                    "Section #{$sectionIndex}, Champ #{$champIndex} : champ '{$field}' manquant"
                );
            }
        }
        
        // Valider type
        if (!in_array($champ['type'], self::TYPES_CHAMPS_VALIDES)) {
            throw new TemplateStructureValidationException(
                "Section #{$sectionIndex}, Champ #{$champIndex} : type '{$champ['type']}' invalide. " .
                "Types valides : " . implode(', ', self::TYPES_CHAMPS_VALIDES)
            );
        }
        
        // Validation spécifique par type
        if ($champ['type'] === 'criteres') {
            if (!isset($champ['source']) || $champ['source'] !== 'regle_evaluation') {
                throw new TemplateStructureValidationException(
                    "Section #{$sectionIndex}, Champ #{$champIndex} : " .
                    "les champs de type 'criteres' doivent avoir source='regle_evaluation'"
                );
            }
        }
        
        if ($champ['type'] === 'texte_libre') {
            if (!isset($champ['label']) || empty($champ['label'])) {
                throw new TemplateStructureValidationException(
                    "Section #{$sectionIndex}, Champ #{$champIndex} : " .
                    "les champs de type 'texte_libre' doivent avoir un label"
                );
            }
            
            if (isset($champ['max_length']) && (!is_numeric($champ['max_length']) || $champ['max_length'] < 1)) {
                throw new TemplateStructureValidationException(
                    "Section #{$sectionIndex}, Champ #{$champIndex} : " .
                    "max_length doit être un nombre positif"
                );
            }
        }
    }
}
```

### TemplatesEvaluationController

```php
namespace App\Http\Controllers\Admin;

use App\Models\TemplateEvaluation;
use App\Models\RegleEvaluation;
use App\Services\TemplateStructureValidator;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response as InertiaResponse;

class TemplatesEvaluationController extends Controller
{
    protected $validator;
    
    public function __construct(TemplateStructureValidator $validator)
    {
        $this->middleware(['auth:api', 'role:ADMIN']);
        $this->validator = $validator;
    }
    
    public function index(): InertiaResponse
    {
        $templates = TemplateEvaluation::with(['regleEvaluation', 'createur'])
            ->orderBy('created_at', 'desc')
            ->get();
        
        return Inertia::render('Admin/Evaluations/Templates/Index', [
            'templates' => $templates->map(function($template) {
                return [
                    'id_template' => $template->id_template,
                    'nom_template' => $template->nom_template,
                    'description' => $template->description,
                    'regle_nom' => $template->regleEvaluation->nom_regle,
                    'nb_sections' => $template->nb_sections,
                    'statut' => $template->statut,
                    'created_by' => $template->createur->nom_complet,
                    'created_at' => $template->created_at->format('Y-m-d'),
                ];
            }),
        ]);
    }
    
    public function create(): InertiaResponse
    {
        $regles = RegleEvaluation::actif()->get();
        
        return Inertia::render('Admin/Evaluations/Templates/Create', [
            'regles' => $regles->map(function($regle) {
                return [
                    'id_regle' => $regle->id_regle,
                    'nom_regle' => $regle->nom_regle,
                    'nb_criteres' => count($regle->criteres),
                ];
            }),
            'sections_predefinies' => TemplateStructureValidator::SECTIONS_PREDEFINIES,
        ]);
    }
    
    public function store(Request $request)
    {
        $validated = $request->validate([
            'nom_template' => 'required|string|max:200|unique:templates_evaluation,nom_template',
            'description' => 'nullable|string',
            'id_regle' => 'required|exists:regles_evaluation,id_regle',
            'structure' => 'required|array',
            'structure.sections' => 'required|array|min:1',
        ]);
        
        // Validation structure
        try {
            $this->validator->validateStructure($validated['structure']);
        } catch (\Exception $e) {
            return back()->withErrors(['structure' => $e->getMessage()]);
        }
        
        // Ajouter metadata
        $structure = $validated['structure'];
        $structure['metadata'] = [
            'version' => '1.0',
            'created_at' => now()->toIso8601String(),
        ];
        
        $template = TemplateEvaluation::create([
            'nom_template' => $validated['nom_template'],
            'description' => $validated['description'],
            'id_regle' => $validated['id_regle'],
            'structure_json' => $structure,
            'statut' => 'brouillon',
            'created_by' => $request->user()->matricule,
        ]);
        
        return redirect()->route('admin.evaluations.templates.index')
            ->with('success', 'Template d\'évaluation créé avec succès');
    }
    
    public function edit(string $id): InertiaResponse
    {
        $template = TemplateEvaluation::with('regleEvaluation')->findOrFail($id);
        $regles = RegleEvaluation::actif()->get();
        
        return Inertia::render('Admin/Evaluations/Templates/Edit', [
            'template' => [
                'id_template' => $template->id_template,
                'nom_template' => $template->nom_template,
                'description' => $template->description,
                'id_regle' => $template->id_regle,
                'structure' => $template->structure_json,
                'statut' => $template->statut,
            ],
            'regles' => $regles->map(function($regle) {
                return [
                    'id_regle' => $regle->id_regle,
                    'nom_regle' => $regle->nom_regle,
                    'nb_criteres' => count($regle->criteres),
                ];
            }),
            'sections_predefinies' => TemplateStructureValidator::SECTIONS_PREDEFINIES,
        ]);
    }
    
    public function update(Request $request, string $id)
    {
        $template = TemplateEvaluation::findOrFail($id);
        
        $validated = $request->validate([
            'nom_template' => 'required|string|max:200|unique:templates_evaluation,nom_template,' . $id . ',id_template',
            'description' => 'nullable|string',
            'id_regle' => 'required|exists:regles_evaluation,id_regle',
            'structure' => 'required|array',
            'structure.sections' => 'required|array|min:1',
        ]);
        
        // Validation structure
        try {
            $this->validator->validateStructure($validated['structure']);
        } catch (\Exception $e) {
            return back()->withErrors(['structure' => $e->getMessage()]);
        }
        
        // Mettre à jour metadata
        $structure = $validated['structure'];
        $structure['metadata'] = array_merge(
            $structure['metadata'] ?? [],
            [
                'version' => '1.0',
                'updated_at' => now()->toIso8601String(),
            ]
        );
        
        $template->update([
            'nom_template' => $validated['nom_template'],
            'description' => $validated['description'],
            'id_regle' => $validated['id_regle'],
            'structure_json' => $structure,
        ]);
        
        return redirect()->route('admin.evaluations.templates.index')
            ->with('success', 'Template d\'évaluation mis à jour avec succès');
    }
    
    public function publier(string $id)
    {
        $template = TemplateEvaluation::findOrFail($id);
        $template->publier();
        
        return back()->with('success', 'Template publié avec succès');
    }
    
    public function mettreEnBrouillon(string $id)
    {
        $template = TemplateEvaluation::findOrFail($id);
        $template->mettreEnBrouillon();
        
        return back()->with('success', 'Template mis en brouillon avec succès');
    }
}
```

### Composant TemplateStructureEditor

```tsx
// resources/js/Components/Evaluations/TemplateStructureEditor.tsx
import { useState, useEffect } from 'react';
import { Button } from '@/Components/UI/Button';
import { Input } from '@/Components/UI/Input';
import { Select } from '@/Components/UI/Select';
import { Card } from '@/Components/UI/Card';
import { Trash2, Plus, MoveUp, MoveDown } from 'lucide-react';

interface Champ {
    id: string;
    type: 'criteres' | 'texte_libre';
    label?: string;
    source?: string;
    max_length?: number;
    obligatoire: boolean;
}

interface Section {
    id: string;
    titre: string;
    description?: string;
    ordre: number;
    champs: Champ[];
}

interface TemplateStructureEditorProps {
    value: { sections: Section[] };
    onChange: (structure: { sections: Section[] }) => void;
    sectionsPredefinies: string[];
    errors?: string;
}

export default function TemplateStructureEditor({
    value,
    onChange,
    sectionsPredefinies,
    errors
}: TemplateStructureEditorProps) {
    const [sections, setSections] = useState<Section[]>(value?.sections || []);
    
    useEffect(() => {
        onChange({ sections });
    }, [sections]);
    
    const addSection = () => {
        const newSection: Section = {
            id: `sect-${Date.now()}`,
            titre: '',
            description: '',
            ordre: sections.length + 1,
            champs: [],
        };
        setSections([...sections, newSection]);
    };
    
    const removeSection = (index: number) => {
        const updated = sections.filter((_, i) => i !== index);
        // Réorganiser les ordres
        updated.forEach((section, i) => {
            section.ordre = i + 1;
        });
        setSections(updated);
    };
    
    const moveSection = (index: number, direction: 'up' | 'down') => {
        const newIndex = direction === 'up' ? index - 1 : index + 1;
        if (newIndex < 0 || newIndex >= sections.length) return;
        
        const updated = [...sections];
        [updated[index], updated[newIndex]] = [updated[newIndex], updated[index]];
        
        // Réorganiser les ordres
        updated.forEach((section, i) => {
            section.ordre = i + 1;
        });
        
        setSections(updated);
    };
    
    const updateSection = (index: number, field: string, value: any) => {
        const updated = [...sections];
        updated[index] = { ...updated[index], [field]: value };
        setSections(updated);
    };
    
    const addChamp = (sectionIndex: number) => {
        const updated = [...sections];
        const newChamp: Champ = {
            id: `champ-${Date.now()}`,
            type: 'texte_libre',
            label: '',
            obligatoire: false,
        };
        updated[sectionIndex].champs.push(newChamp);
        setSections(updated);
    };
    
    const removeChamp = (sectionIndex: number, champIndex: number) => {
        const updated = [...sections];
        updated[sectionIndex].champs = updated[sectionIndex].champs.filter((_, i) => i !== champIndex);
        setSections(updated);
    };
    
    const updateChamp = (sectionIndex: number, champIndex: number, field: string, value: any) => {
        const updated = [...sections];
        updated[sectionIndex].champs[champIndex] = {
            ...updated[sectionIndex].champs[champIndex],
            [field]: value,
        };
        setSections(updated);
    };
    
    return (
        <div className="space-y-6">
            {/* Liste sections */}
            {sections.map((section, sectionIndex) => (
                <Card key={section.id} className="p-6">
                    <div className="flex items-start justify-between mb-4">
                        <h4 className="text-lg font-semibold text-sabc-gray-900">
                            Section {section.ordre}
                        </h4>
                        <div className="flex items-center space-x-2">
                            <Button
                                type="button"
                                onClick={() => moveSection(sectionIndex, 'up')}
                                variant="secondary"
                                size="sm"
                                disabled={sectionIndex === 0}
                            >
                                <MoveUp size={16} />
                            </Button>
                            <Button
                                type="button"
                                onClick={() => moveSection(sectionIndex, 'down')}
                                variant="secondary"
                                size="sm"
                                disabled={sectionIndex === sections.length - 1}
                            >
                                <MoveDown size={16} />
                            </Button>
                            <Button
                                type="button"
                                onClick={() => removeSection(sectionIndex)}
                                variant="danger"
                                size="sm"
                            >
                                <Trash2 size={16} />
                            </Button>
                        </div>
                    </div>
                    
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-sabc-gray-800 mb-2">
                                Titre de la section
                            </label>
                            <Select
                                value={section.titre}
                                onChange={(e) => updateSection(sectionIndex, 'titre', e.target.value)}
                                required
                            >
                                <option value="">Sélectionner...</option>
                                {sectionsPredefinies.map((titre) => (
                                    <option key={titre} value={titre}>{titre}</option>
                                ))}
                                <option value="custom">Personnalisé...</option>
                            </Select>
                            
                            {section.titre === 'custom' && (
                                <Input
                                    type="text"
                                    placeholder="Titre personnalisé"
                                    className="mt-2"
                                    onChange={(e) => updateSection(sectionIndex, 'titre', e.target.value)}
                                />
                            )}
                        </div>
                        
                        <div>
                            <label className="block text-sm font-medium text-sabc-gray-800 mb-2">
                                Description
                            </label>
                            <textarea
                                value={section.description || ''}
                                onChange={(e) => updateSection(sectionIndex, 'description', e.target.value)}
                                className="w-full border border-sabc-gray-200 rounded-lg p-2"
                                rows={2}
                            />
                        </div>
                        
                        {/* Champs de la section */}
                        <div className="border-t border-sabc-gray-200 pt-4">
                            <h5 className="text-sm font-semibold text-sabc-gray-900 mb-3">
                                Champs de la section
                            </h5>
                            
                            {section.champs.map((champ, champIndex) => (
                                <div key={champ.id} className="bg-sabc-gray-50 p-4 rounded-lg mb-3">
                                    <div className="flex items-start justify-between mb-3">
                                        <span className="text-sm font-medium text-sabc-gray-800">
                                            Champ {champIndex + 1}
                                        </span>
                                        <Button
                                            type="button"
                                            onClick={() => removeChamp(sectionIndex, champIndex)}
                                            variant="danger"
                                            size="sm"
                                        >
                                            <Trash2 size={14} />
                                        </Button>
                                    </div>
                                    
                                    <div className="grid grid-cols-2 gap-3">
                                        <div>
                                            <label className="block text-xs font-medium text-sabc-gray-700 mb-1">
                                                Type
                                            </label>
                                            <Select
                                                value={champ.type}
                                                onChange={(e) => updateChamp(sectionIndex, champIndex, 'type', e.target.value)}
                                            >
                                                <option value="criteres">Critères (Règle)</option>
                                                <option value="texte_libre">Texte libre</option>
                                            </Select>
                                        </div>
                                        
                                        {champ.type === 'texte_libre' && (
                                            <>
                                                <div>
                                                    <label className="block text-xs font-medium text-sabc-gray-700 mb-1">
                                                        Label
                                                    </label>
                                                    <Input
                                                        type="text"
                                                        value={champ.label || ''}
                                                        onChange={(e) => updateChamp(sectionIndex, champIndex, 'label', e.target.value)}
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-xs font-medium text-sabc-gray-700 mb-1">
                                                        Longueur max
                                                    </label>
                                                    <Input
                                                        type="number"
                                                        value={champ.max_length || 500}
                                                        onChange={(e) => updateChamp(sectionIndex, champIndex, 'max_length', Number(e.target.value))}
                                                    />
                                                </div>
                                            </>
                                        )}
                                        
                                        <div className="flex items-center">
                                            <input
                                                type="checkbox"
                                                checked={champ.obligatoire}
                                                onChange={(e) => updateChamp(sectionIndex, champIndex, 'obligatoire', e.target.checked)}
                                                className="mr-2"
                                            />
                                            <label className="text-xs font-medium text-sabc-gray-700">
                                                Obligatoire
                                            </label>
                                        </div>
                                    </div>
                                </div>
                            ))}
                            
                            <Button
                                type="button"
                                onClick={() => addChamp(sectionIndex)}
                                className="w-full bg-sabc-accent hover:bg-sabc-accent-light"
                                size="sm"
                            >
                                <Plus size={14} className="mr-2" />
                                Ajouter un champ
                            </Button>
                        </div>
                    </div>
                </Card>
            ))}
            
            {/* Bouton ajouter section */}
            <Button
                type="button"
                onClick={addSection}
                className="w-full bg-sabc-red-primary hover:bg-sabc-red-dark"
            >
                <Plus size={16} className="mr-2" />
                Ajouter une section
            </Button>
            
            {errors && (
                <p className="text-sm text-sabc-error">{errors}</p>
            )}
        </div>
    );
}
```

### TemplatesEvaluationSeeder

```php
namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\TemplateEvaluation;
use App\Models\RegleEvaluation;
use App\Models\Utilisateur;

class TemplatesEvaluationSeeder extends Seeder
{
    public function run()
    {
        $regleStandard = RegleEvaluation::where('nom_regle', 'Évaluation Standard SABC')->first();
        $regleLeadership = RegleEvaluation::where('nom_regle', 'Évaluation Leadership')->first();
        $admin = Utilisateur::where('matricule', 'ADMIN')->first();
        
        $templates = [
            [
                'nom_template' => 'Template Standard SABC',
                'description' => 'Template d\'évaluation standard pour tous les collaborateurs',
                'id_regle' => $regleStandard->id_regle,
                'structure' => [
                    'sections' => [
                        [
                            'id' => 'sect-1',
                            'titre' => 'Objectifs',
                            'description' => 'Évaluation de l\'atteinte des objectifs',
                            'ordre' => 1,
                            'champs' => [
                                [
                                    'id' => 'champ-1',
                                    'type' => 'criteres',
                                    'source' => 'regle_evaluation',
                                    'obligatoire' => true,
                                ],
                                [
                                    'id' => 'champ-2',
                                    'type' => 'texte_libre',
                                    'label' => 'Commentaires sur les objectifs',
                                    'max_length' => 500,
                                    'obligatoire' => false,
                                ],
                            ],
                        ],
                        [
                            'id' => 'sect-2',
                            'titre' => 'Compétences',
                            'description' => 'Évaluation des compétences',
                            'ordre' => 2,
                            'champs' => [
                                [
                                    'id' => 'champ-3',
                                    'type' => 'criteres',
                                    'source' => 'regle_evaluation',
                                    'obligatoire' => true,
                                ],
                            ],
                        ],
                        [
                            'id' => 'sect-3',
                            'titre' => 'Développement',
                            'description' => 'Plan de développement',
                            'ordre' => 3,
                            'champs' => [
                                [
                                    'id' => 'champ-4',
                                    'type' => 'texte_libre',
                                    'label' => 'Points forts',
                                    'max_length' => 300,
                                    'obligatoire' => false,
                                ],
                                [
                                    'id' => 'champ-5',
                                    'type' => 'texte_libre',
                                    'label' => 'Axes d\'amélioration',
                                    'max_length' => 300,
                                    'obligatoire' => true,
                                ],
                            ],
                        ],
                    ],
                    'metadata' => [
                        'version' => '1.0',
                        'created_at' => now()->toIso8601String(),
                    ],
                ],
                'statut' => 'publie',
            ],
        ];
        
        foreach ($templates as $templateData) {
            TemplateEvaluation::create([
                'nom_template' => $templateData['nom_template'],
                'description' => $templateData['description'],
                'id_regle' => $templateData['id_regle'],
                'structure_json' => $templateData['structure'],
                'statut' => $templateData['statut'],
                'created_by' => $admin->matricule,
            ]);
        }
    }
}
```

### Project Structure Notes

**Fichiers à créer :**
- `database/migrations/xxxx_create_templates_evaluation_table.php`
- `database/seeders/TemplatesEvaluationSeeder.php`
- `app/Models/TemplateEvaluation.php`
- `app/Services/TemplateStructureValidator.php`
- `app/Exceptions/TemplateStructureValidationException.php`
- `app/Http/Controllers/Admin/TemplatesEvaluationController.php`
- `resources/js/Pages/Admin/Evaluations/Templates/Index.tsx`
- `resources/js/Pages/Admin/Evaluations/Templates/Create.tsx`
- `resources/js/Pages/Admin/Evaluations/Templates/Edit.tsx`
- `resources/js/Components/Evaluations/TemplateStructureEditor.tsx`

**Fichiers à modifier :**
- `routes/web.php` : Ajouter routes templates évaluation
- `database/seeders/DatabaseSeeder.php` : Appeler TemplatesEvaluationSeeder
- `resources/js/types/index.ts` : Ajouter interfaces TemplateEvaluation, Section, Champ

**Dépendances Stories Précédentes :**
- Story 1.1 : PostgreSQL (sabc_business) configuré
- Story 1.2 : Authentification Laravel Passport
- Story 1.3 : Middleware role:ADMIN
- Story 2.1 : Règles d'évaluation créées

### Règles Métier SABC Critiques

**Structure Template :**
- Minimum 1 section par template
- Minimum 1 champ par section
- Types champs : criteres (règle), texte_libre (commentaires)

**Statuts :**
- brouillon : En cours d'édition
- publié : Accessible aux évaluateurs

**Sections Prédéfinies :**
- Objectifs, Compétences, Développement, Performance, Leadership, Innovation

**Validation :**
- Structure JSON stricte
- Champs obligatoires validés
- Ordre sections cohérent

### References

- [Source: epics.md#Epic 3 Story 3.1] - Acceptance criteria complets
- [Source: architecture.md#Data Models] - Structure templates
- [Source: project-context.md#Critical Implementation Rules] - TypeScript strict, PostgreSQL

## Dev Agent Record

### Agent Model Used

_À remplir par le dev agent_

### Debug Log References

_À remplir par le dev agent_

### Completion Notes List

_À remplir par le dev agent_

### File List

_À remplir par le dev agent_
