# Story 3.3: Création et Gestion des Périodes d'Évaluation

Status: in-progress

## Story

En tant qu'administrateur,
Je veux créer des périodes d'évaluation avec dates de début et fin,
Afin de planifier les campagnes semestrielles.

## Acceptance Criteria

**Given** je suis connecté en tant qu'admin
**When** je crée une période d'évaluation (ex: "2025-S1")
**Then** la période est créée dans PostgreSQL `periodes_evaluation` avec `date_debut`, `date_fin`, `est_ouverte`
**And** je peux définir des dates de rappels (J-7, J-3, J-1)
**And** la période peut être en statut : "planifiée", "ouverte", "fermée"
**And** je peux modifier les dates avant l'ouverture de la période
**And** une période ne peut pas chevaucher une autre période active
**And** les statistiques de la période sont calculées dans `statistiques_json`

## Tasks / Subtasks

- [x] Création Table `periodes_evaluation` PostgreSQL (AC: 1, 2, 3, 6)
  - [x] Migration existante (table déjà créée)
  - [x] Colonnes : id_periode, nom_periode, date_debut, date_fin
  - [x] Colonnes : est_ouverte (boolean), statut (enum)
  - [x] Colonnes : rappels_envoyes (JSONB), statistiques_json (JSONB)
  - [x] Connexion PostgreSQL (sabc_business)

- [x] Modèle Eloquent `PeriodeEvaluation` (AC: 1, 2, 3, 4, 6)
  - [x] Modèle `app/Models/PeriodeEvaluation.php` existant et complété
  - [x] Connexion PostgreSQL (sabc_business)
  - [x] Cast `rappels_envoyes`, `statistiques_json` en array
  - [x] Scopes : active, planifiee, ouverte, fermee
  - [x] Méthodes : estModifiable(), getDatesRappels(), ouvrir(), fermer()

- [x] Service PeriodeEvaluationService (AC: 4, 5, 6)
  - [x] Créer `app/Services/PeriodeEvaluationService.php`
  - [x] Méthode `validateNoChevauchement()` : Vérifier pas de chevauchement
  - [x] Méthode `canModifyDates()` : Vérifier période non ouverte
  - [x] Méthode `calculateStatistiques()` : Calculer stats période
  - [x] Méthode `getPeriodeActive()` : Récupérer période en cours
  - [x] Méthode `validateDates()` : Validation complète des dates
  - [x] Méthode `generateDatesRappels()` : Génération dates rappels

- [x] Exceptions personnalisées
  - [x] `app/Exceptions/PeriodeChevauchementException.php`
  - [x] `app/Exceptions/PeriodeNonModifiableException.php`

- [x] PeriodesEvaluationController (AC: 1, 2, 3, 4, 5, 6)
  - [x] Contrôleur `app/Http/Controllers/PeriodeEvaluationController.php` mis à jour
  - [x] Méthodes CRUD complètes (index, create, store, edit, update, show, destroy)
  - [x] Validation chevauchement via service
  - [x] Blocage modification si ouverte
  - [x] Calcul statistiques via service
  - [x] Injection PeriodeEvaluationService

- [ ] Interface Admin CRUD Périodes (AC: 1, 2, 3, 4, 5)
  - [x] Page `resources/js/Pages/Admin/Evaluations/Periodes.tsx` existante
  - [ ] Page `resources/js/Pages/Admin/Evaluations/CreatePeriode.tsx` à créer
  - [ ] Page `resources/js/Pages/Admin/Evaluations/EditPeriode.tsx` à créer
  - [ ] Formulaire création avec calendrier
  - [ ] Formulaire édition (si non ouverte)
  - [ ] Configuration dates rappels

- [ ] Tests & Validation
  - [ ] Tester création période avec dates valides
  - [ ] Tester validation chevauchement
  - [ ] Tester modification avant ouverture
  - [ ] Tester blocage modification après ouverture
  - [ ] Tester calcul statistiques

## Dev Notes

### Architecture Périodes d'Évaluation

**Cycle de Vie Période :**
1. **Planifiée** : Créée, dates définies, pas encore ouverte
2. **Ouverte** : Date début atteinte, évaluations possibles
3. **Fermée** : Date fin atteinte, évaluations terminées

**Règles de Modification :**
- Planifiée : Modification dates autorisée
- Ouverte : Modification dates bloquée
- Fermée : Modification dates bloquée

**Dates Rappels :**
- J-7 : 7 jours avant date_fin
- J-3 : 3 jours avant date_fin
- J-1 : 1 jour avant date_fin

**Statistiques Période :**
```json
{
  "nb_evaluations_attendues": 150,
  "nb_evaluations_completees": 120,
  "taux_completion": 80,
  "nb_evaluations_en_cours": 20,
  "nb_evaluations_non_demarrees": 10
}
```

### Migration Table `periodes_evaluation`

```php
Schema::connection('pgsql')->create('periodes_evaluation', function (Blueprint $table) {
    $table->uuid('id_periode')->primary();
    $table->string('nom_periode', 100)->unique(); // Ex: "2025-S1"
    $table->date('date_debut');
    $table->date('date_fin');
    $table->boolean('est_ouverte')->default(false);
    $table->enum('statut', ['planifiee', 'ouverte', 'fermee'])->default('planifiee');
    $table->jsonb('dates_rappels_json')->nullable(); // J-7, J-3, J-1
    $table->jsonb('statistiques_json')->nullable();
    $table->timestamps();
    
    $table->index('date_debut');
    $table->index('date_fin');
    $table->index('statut');
    $table->index('est_ouverte');
    
    // Contrainte : date_debut < date_fin
    $table->check('date_debut < date_fin');
});
```

### Modèle PeriodeEvaluation

```php
namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Str;
use Carbon\Carbon;

class PeriodeEvaluation extends Model
{
    protected $connection = 'pgsql'; // sabc_business
    protected $table = 'periodes_evaluation';
    protected $primaryKey = 'id_periode';
    public $incrementing = false;
    protected $keyType = 'string';
    
    protected $fillable = [
        'id_periode',
        'nom_periode',
        'date_debut',
        'date_fin',
        'est_ouverte',
        'statut',
        'dates_rappels_json',
        'statistiques_json',
    ];
    
    protected $casts = [
        'date_debut' => 'date',
        'date_fin' => 'date',
        'est_ouverte' => 'boolean',
        'dates_rappels_json' => 'array',
        'statistiques_json' => 'array',
    ];
    
    protected static function boot()
    {
        parent::boot();
        
        static::creating(function ($model) {
            if (empty($model->id_periode)) {
                $model->id_periode = (string) Str::uuid();
            }
        });
    }
    
    // Scopes
    public function scopeActive($query)
    {
        return $query->where('est_ouverte', true)
            ->where('statut', 'ouverte');
    }
    
    public function scopePlanifiee($query)
    {
        return $query->where('statut', 'planifiee');
    }
    
    public function scopeOuverte($query)
    {
        return $query->where('statut', 'ouverte');
    }
    
    public function scopeFermee($query)
    {
        return $query->where('statut', 'fermee');
    }
    
    // Accessors
    public function getDatesRappelsAttribute(): array
    {
        $data = $this->dates_rappels_json ?? [];
        
        if (empty($data)) {
            // Dates par défaut
            return [
                'j_moins_7' => $this->date_fin->copy()->subDays(7)->format('Y-m-d'),
                'j_moins_3' => $this->date_fin->copy()->subDays(3)->format('Y-m-d'),
                'j_moins_1' => $this->date_fin->copy()->subDays(1)->format('Y-m-d'),
            ];
        }
        
        return $data;
    }
    
    public function getStatistiquesAttribute(): array
    {
        return $this->statistiques_json ?? [
            'nb_evaluations_attendues' => 0,
            'nb_evaluations_completees' => 0,
            'taux_completion' => 0,
            'nb_evaluations_en_cours' => 0,
            'nb_evaluations_non_demarrees' => 0,
        ];
    }
    
    // Méthodes
    public function ouvrir(): bool
    {
        return $this->update([
            'est_ouverte' => true,
            'statut' => 'ouverte',
        ]);
    }
    
    public function fermer(): bool
    {
        return $this->update([
            'est_ouverte' => false,
            'statut' => 'fermee',
        ]);
    }
    
    public function estModifiable(): bool
    {
        return $this->statut === 'planifiee';
    }
    
    public function estEnCours(): bool
    {
        $now = Carbon::now();
        return $now->between($this->date_debut, $this->date_fin);
    }
}
```

### PeriodeEvaluationService

```php
namespace App\Services;

use App\Models\PeriodeEvaluation;
use App\Exceptions\PeriodeChevauchementException;
use App\Exceptions\PeriodeNonModifiableException;
use Carbon\Carbon;

class PeriodeEvaluationService
{
    /**
     * Valider qu'il n'y a pas de chevauchement avec une autre période
     */
    public function validateNoChevauchement(
        Carbon $dateDebut,
        Carbon $dateFin,
        ?string $excludeIdPeriode = null
    ): void {
        $query = PeriodeEvaluation::where(function($q) use ($dateDebut, $dateFin) {
            // Chevauchement si :
            // 1. Nouvelle période commence pendant une période existante
            $q->where(function($subQ) use ($dateDebut) {
                $subQ->where('date_debut', '<=', $dateDebut)
                     ->where('date_fin', '>=', $dateDebut);
            })
            // 2. Nouvelle période finit pendant une période existante
            ->orWhere(function($subQ) use ($dateFin) {
                $subQ->where('date_debut', '<=', $dateFin)
                     ->where('date_fin', '>=', $dateFin);
            })
            // 3. Nouvelle période englobe une période existante
            ->orWhere(function($subQ) use ($dateDebut, $dateFin) {
                $subQ->where('date_debut', '>=', $dateDebut)
                     ->where('date_fin', '<=', $dateFin);
            });
        });
        
        // Exclure la période en cours de modification
        if ($excludeIdPeriode) {
            $query->where('id_periode', '!=', $excludeIdPeriode);
        }
        
        $chevauchement = $query->first();
        
        if ($chevauchement) {
            throw new PeriodeChevauchementException(
                "La période chevauche une période existante : {$chevauchement->nom_periode} " .
                "({$chevauchement->date_debut->format('d/m/Y')} - {$chevauchement->date_fin->format('d/m/Y')})"
            );
        }
    }
    
    /**
     * Vérifier si une période peut être modifiée
     */
    public function canModifyDates(PeriodeEvaluation $periode): bool
    {
        return $periode->estModifiable();
    }
    
    /**
     * Calculer les statistiques d'une période
     */
    public function calculateStatistiques(PeriodeEvaluation $periode): array
    {
        // Cette méthode sera complétée dans Story 4.x (Workflow Évaluation)
        // Pour l'instant, retourner structure vide
        
        $stats = [
            'nb_evaluations_attendues' => 0,
            'nb_evaluations_completees' => 0,
            'taux_completion' => 0,
            'nb_evaluations_en_cours' => 0,
            'nb_evaluations_non_demarrees' => 0,
            'derniere_mise_a_jour' => now()->toIso8601String(),
        ];
        
        // Mettre à jour dans la base
        $periode->update(['statistiques_json' => $stats]);
        
        return $stats;
    }
    
    /**
     * Récupérer la période active en cours
     */
    public function getPeriodeActive(): ?PeriodeEvaluation
    {
        return PeriodeEvaluation::active()->first();
    }
    
    /**
     * Générer les dates de rappels par défaut
     */
    public function generateDatesRappels(Carbon $dateFin): array
    {
        return [
            'j_moins_7' => $dateFin->copy()->subDays(7)->format('Y-m-d'),
            'j_moins_3' => $dateFin->copy()->subDays(3)->format('Y-m-d'),
            'j_moins_1' => $dateFin->copy()->subDays(1)->format('Y-m-d'),
        ];
    }
}
```

### PeriodesEvaluationController

```php
namespace App\Http\Controllers\Admin;

use App\Models\PeriodeEvaluation;
use App\Services\PeriodeEvaluationService;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response as InertiaResponse;
use Carbon\Carbon;

class PeriodesEvaluationController extends Controller
{
    protected $periodeService;
    
    public function __construct(PeriodeEvaluationService $periodeService)
    {
        $this->middleware(['auth:api', 'role:ADMIN']);
        $this->periodeService = $periodeService;
    }
    
    public function index(): InertiaResponse
    {
        $periodes = PeriodeEvaluation::orderBy('date_debut', 'desc')->get();
        
        return Inertia::render('Admin/Evaluations/Periodes/Index', [
            'periodes' => $periodes->map(function($periode) {
                return [
                    'id_periode' => $periode->id_periode,
                    'nom_periode' => $periode->nom_periode,
                    'date_debut' => $periode->date_debut->format('Y-m-d'),
                    'date_fin' => $periode->date_fin->format('Y-m-d'),
                    'est_ouverte' => $periode->est_ouverte,
                    'statut' => $periode->statut,
                    'dates_rappels' => $periode->dates_rappels,
                    'statistiques' => $periode->statistiques,
                    'est_modifiable' => $periode->estModifiable(),
                ];
            }),
        ]);
    }
    
    public function create(): InertiaResponse
    {
        return Inertia::render('Admin/Evaluations/Periodes/Create');
    }
    
    public function store(Request $request)
    {
        $validated = $request->validate([
            'nom_periode' => 'required|string|max:100|unique:periodes_evaluation,nom_periode',
            'date_debut' => 'required|date|after:today',
            'date_fin' => 'required|date|after:date_debut',
            'dates_rappels' => 'nullable|array',
        ]);
        
        $dateDebut = Carbon::parse($validated['date_debut']);
        $dateFin = Carbon::parse($validated['date_fin']);
        
        // Validation chevauchement
        try {
            $this->periodeService->validateNoChevauchement($dateDebut, $dateFin);
        } catch (\Exception $e) {
            return back()->withErrors(['dates' => $e->getMessage()]);
        }
        
        // Générer dates rappels si non fournies
        $datesRappels = $validated['dates_rappels'] ?? 
            $this->periodeService->generateDatesRappels($dateFin);
        
        $periode = PeriodeEvaluation::create([
            'nom_periode' => $validated['nom_periode'],
            'date_debut' => $dateDebut,
            'date_fin' => $dateFin,
            'est_ouverte' => false,
            'statut' => 'planifiee',
            'dates_rappels_json' => $datesRappels,
        ]);
        
        // Calculer statistiques initiales
        $this->periodeService->calculateStatistiques($periode);
        
        return redirect()->route('admin.evaluations.periodes.index')
            ->with('success', 'Période d\'évaluation créée avec succès');
    }
    
    public function edit(string $id): InertiaResponse
    {
        $periode = PeriodeEvaluation::findOrFail($id);
        
        if (!$periode->estModifiable()) {
            return redirect()->route('admin.evaluations.periodes.index')
                ->withErrors(['periode' => 'Cette période ne peut plus être modifiée']);
        }
        
        return Inertia::render('Admin/Evaluations/Periodes/Edit', [
            'periode' => [
                'id_periode' => $periode->id_periode,
                'nom_periode' => $periode->nom_periode,
                'date_debut' => $periode->date_debut->format('Y-m-d'),
                'date_fin' => $periode->date_fin->format('Y-m-d'),
                'dates_rappels' => $periode->dates_rappels,
                'statut' => $periode->statut,
            ],
        ]);
    }
    
    public function update(Request $request, string $id)
    {
        $periode = PeriodeEvaluation::findOrFail($id);
        
        if (!$periode->estModifiable()) {
            return back()->withErrors([
                'periode' => 'Cette période ne peut plus être modifiée car elle est ouverte ou fermée'
            ]);
        }
        
        $validated = $request->validate([
            'nom_periode' => 'required|string|max:100|unique:periodes_evaluation,nom_periode,' . $id . ',id_periode',
            'date_debut' => 'required|date',
            'date_fin' => 'required|date|after:date_debut',
            'dates_rappels' => 'nullable|array',
        ]);
        
        $dateDebut = Carbon::parse($validated['date_debut']);
        $dateFin = Carbon::parse($validated['date_fin']);
        
        // Validation chevauchement (exclure période courante)
        try {
            $this->periodeService->validateNoChevauchement($dateDebut, $dateFin, $id);
        } catch (\Exception $e) {
            return back()->withErrors(['dates' => $e->getMessage()]);
        }
        
        // Générer dates rappels si non fournies
        $datesRappels = $validated['dates_rappels'] ?? 
            $this->periodeService->generateDatesRappels($dateFin);
        
        $periode->update([
            'nom_periode' => $validated['nom_periode'],
            'date_debut' => $dateDebut,
            'date_fin' => $dateFin,
            'dates_rappels_json' => $datesRappels,
        ]);
        
        return redirect()->route('admin.evaluations.periodes.index')
            ->with('success', 'Période d\'évaluation mise à jour avec succès');
    }
    
    public function show(string $id): InertiaResponse
    {
        $periode = PeriodeEvaluation::findOrFail($id);
        
        // Recalculer statistiques
        $stats = $this->periodeService->calculateStatistiques($periode);
        
        return Inertia::render('Admin/Evaluations/Periodes/Show', [
            'periode' => [
                'id_periode' => $periode->id_periode,
                'nom_periode' => $periode->nom_periode,
                'date_debut' => $periode->date_debut->format('d/m/Y'),
                'date_fin' => $periode->date_fin->format('d/m/Y'),
                'est_ouverte' => $periode->est_ouverte,
                'statut' => $periode->statut,
                'dates_rappels' => $periode->dates_rappels,
                'statistiques' => $stats,
            ],
        ]);
    }
}
```

### Composant PeriodeForm

```tsx
// resources/js/Components/Evaluations/PeriodeForm.tsx
import { useState } from 'react';
import { Input } from '@/Components/UI/Input';
import { Button } from '@/Components/UI/Button';
import { Card } from '@/Components/UI/Card';
import { Calendar } from 'lucide-react';

interface PeriodeFormProps {
    periode?: {
        nom_periode: string;
        date_debut: string;
        date_fin: string;
        dates_rappels?: {
            j_moins_7: string;
            j_moins_3: string;
            j_moins_1: string;
        };
    };
    onSubmit: (data: any) => void;
    errors?: Record<string, string>;
}

export default function PeriodeForm({ periode, onSubmit, errors }: PeriodeFormProps) {
    const [formData, setFormData] = useState({
        nom_periode: periode?.nom_periode || '',
        date_debut: periode?.date_debut || '',
        date_fin: periode?.date_fin || '',
        dates_rappels: periode?.dates_rappels || {
            j_moins_7: '',
            j_moins_3: '',
            j_moins_1: '',
        },
    });
    
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSubmit(formData);
    };
    
    const updateField = (field: string, value: any) => {
        setFormData({ ...formData, [field]: value });
    };
    
    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <Card className="p-6">
                <h3 className="text-lg font-semibold text-sabc-gray-900 mb-4 font-poppins">
                    Informations Générales
                </h3>
                
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-sabc-gray-800 mb-2">
                            Nom de la période *
                        </label>
                        <Input
                            type="text"
                            value={formData.nom_periode}
                            onChange={(e) => updateField('nom_periode', e.target.value)}
                            placeholder="Ex: 2025-S1"
                            required
                        />
                        {errors?.nom_periode && (
                            <p className="text-sm text-sabc-error mt-1">{errors.nom_periode}</p>
                        )}
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-sabc-gray-800 mb-2">
                                Date de début *
                            </label>
                            <div className="relative">
                                <Input
                                    type="date"
                                    value={formData.date_debut}
                                    onChange={(e) => updateField('date_debut', e.target.value)}
                                    required
                                />
                                <Calendar 
                                    size={16} 
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-sabc-gray-400 pointer-events-none"
                                />
                            </div>
                        </div>
                        
                        <div>
                            <label className="block text-sm font-medium text-sabc-gray-800 mb-2">
                                Date de fin *
                            </label>
                            <div className="relative">
                                <Input
                                    type="date"
                                    value={formData.date_fin}
                                    onChange={(e) => updateField('date_fin', e.target.value)}
                                    required
                                />
                                <Calendar 
                                    size={16} 
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-sabc-gray-400 pointer-events-none"
                                />
                            </div>
                        </div>
                    </div>
                    
                    {errors?.dates && (
                        <p className="text-sm text-sabc-error">{errors.dates}</p>
                    )}
                </div>
            </Card>
            
            <Card className="p-6">
                <h3 className="text-lg font-semibold text-sabc-gray-900 mb-4 font-poppins">
                    Dates de Rappels
                </h3>
                
                <div className="space-y-3">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-sabc-gray-800 mb-2">
                                J-7 (7 jours avant fin)
                            </label>
                            <Input
                                type="date"
                                value={formData.dates_rappels.j_moins_7}
                                onChange={(e) => updateField('dates_rappels', {
                                    ...formData.dates_rappels,
                                    j_moins_7: e.target.value
                                })}
                            />
                        </div>
                        
                        <div>
                            <label className="block text-sm font-medium text-sabc-gray-800 mb-2">
                                J-3 (3 jours avant fin)
                            </label>
                            <Input
                                type="date"
                                value={formData.dates_rappels.j_moins_3}
                                onChange={(e) => updateField('dates_rappels', {
                                    ...formData.dates_rappels,
                                    j_moins_3: e.target.value
                                })}
                            />
                        </div>
                        
                        <div>
                            <label className="block text-sm font-medium text-sabc-gray-800 mb-2">
                                J-1 (1 jour avant fin)
                            </label>
                            <Input
                                type="date"
                                value={formData.dates_rappels.j_moins_1}
                                onChange={(e) => updateField('dates_rappels', {
                                    ...formData.dates_rappels,
                                    j_moins_1: e.target.value
                                })}
                            />
                        </div>
                    </div>
                    
                    <p className="text-xs text-sabc-gray-600">
                        Les dates de rappels seront calculées automatiquement si non spécifiées
                    </p>
                </div>
            </Card>
            
            <div className="flex justify-end space-x-4">
                <Button type="button" variant="secondary" onClick={() => window.history.back()}>
                    Annuler
                </Button>
                <Button type="submit" className="bg-sabc-red-primary hover:bg-sabc-red-dark">
                    {periode ? 'Mettre à jour' : 'Créer'} la période
                </Button>
            </div>
        </form>
    );
}
```

### Exceptions Personnalisées

```php
namespace App\Exceptions;

class PeriodeChevauchementException extends \Exception
{
    //
}

class PeriodeNonModifiableException extends \Exception
{
    //
}
```

### Project Structure Notes

**Fichiers à créer :**
- `database/migrations/xxxx_create_periodes_evaluation_table.php`
- `app/Models/PeriodeEvaluation.php`
- `app/Services/PeriodeEvaluationService.php`
- `app/Exceptions/PeriodeChevauchementException.php`
- `app/Exceptions/PeriodeNonModifiableException.php`
- `app/Http/Controllers/Admin/PeriodesEvaluationController.php`
- `resources/js/Pages/Admin/Evaluations/Periodes/Index.tsx`
- `resources/js/Pages/Admin/Evaluations/Periodes/Create.tsx`
- `resources/js/Pages/Admin/Evaluations/Periodes/Edit.tsx`
- `resources/js/Pages/Admin/Evaluations/Periodes/Show.tsx`
- `resources/js/Components/Evaluations/PeriodeForm.tsx`

**Fichiers à modifier :**
- `routes/web.php` : Ajouter routes périodes évaluation

**Dépendances Stories Précédentes :**
- Story 1.1 : PostgreSQL (sabc_business) configuré
- Story 1.2 : Authentification Laravel Passport
- Story 1.3 : Middleware role:ADMIN

### Règles Métier SABC Critiques

**Validation Dates :**
- date_debut < date_fin (contrainte DB)
- Pas de chevauchement avec périodes existantes
- date_debut > aujourd'hui (création)

**Modification :**
- Autorisée : statut = 'planifiee'
- Bloquée : statut = 'ouverte' ou 'fermee'

**Dates Rappels :**
- J-7, J-3, J-1 avant date_fin
- Calculées automatiquement si non spécifiées

**Statistiques :**
- Calculées à la demande
- Stockées dans statistiques_json
- Mise à jour périodique (Story 3.4)

### References

- [Source: epics.md#Epic 3 Story 3.3] - Acceptance criteria complets
- [Source: architecture.md#Data Models] - Structure périodes
- [Source: project-context.md#Critical Implementation Rules] - PostgreSQL, TypeScript strict

## Dev Agent Record

### Agent Model Used

Claude 3.5 Sonnet (Cascade)

### Implementation Date

2026-01-16

### Completion Notes List

**Backend implémenté :**
- ✅ Service `PeriodeEvaluationService` créé avec toutes les validations SABC
- ✅ Exceptions personnalisées créées (PeriodeChevauchementException, PeriodeNonModifiableException)
- ✅ Modèle `PeriodeEvaluation` complété avec scopes et méthodes manquantes
- ✅ Contrôleur `PeriodeEvaluationController` mis à jour avec injection du service
- ✅ Validation chevauchement des périodes implémentée
- ✅ Validation des dates selon règles SABC (durée min/max, dates futures)
- ✅ Génération automatique des dates de rappels (J-7, J-3, J-1)
- ✅ Calcul des statistiques via le service
- ✅ Blocage modification des périodes ouvertes/fermées

**Frontend à compléter :**
- ⏳ Pages React CreatePeriode.tsx et EditPeriode.tsx à créer
- ⏳ Composant PeriodeForm.tsx à créer selon spécifications

**Règles métier SABC respectées :**
- ✅ Validation date_debut < date_fin
- ✅ Pas de chevauchement avec périodes existantes
- ✅ Modification autorisée uniquement si statut = 'planifiee'
- ✅ Durée minimale 7 jours, maximale 180 jours
- ✅ Dates de rappels calculées automatiquement
- ✅ Statistiques calculées et stockées dans statistiques_json

### File List

**Fichiers créés :**
- `app/Services/PeriodeEvaluationService.php` (nouveau)
- `app/Exceptions/PeriodeChevauchementException.php` (nouveau)
- `app/Exceptions/PeriodeNonModifiableException.php` (nouveau)

**Fichiers modifiés :**
- `app/Models/PeriodeEvaluation.php` (ajout scopes et méthodes)
- `app/Http/Controllers/PeriodeEvaluationController.php` (injection service, validations complètes)

**Fichiers existants utilisés :**
- `resources/js/Pages/Admin/Evaluations/Periodes.tsx` (page liste existante)

**Fichiers à créer (frontend) :**
- `resources/js/Pages/Admin/Evaluations/CreatePeriode.tsx`
- `resources/js/Pages/Admin/Evaluations/EditPeriode.tsx`
- `resources/js/Components/Evaluations/PeriodeForm.tsx`
