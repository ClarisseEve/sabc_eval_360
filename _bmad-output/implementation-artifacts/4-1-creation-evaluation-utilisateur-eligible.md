# Story 4.1: Création d'Évaluation pour Utilisateur Éligible

Status: ready-for-dev

## Story

En tant qu'évaluateur,
Je veux créer une évaluation pour un utilisateur éligible,
Afin de commencer le processus d'évaluation 360°.

## Acceptance Criteria

**Given** je suis connecté et une période d'évaluation est ouverte
**When** je sélectionne un utilisateur éligible à évaluer
**Then** le système vérifie mes permissions d'évaluation (auto/pairs/descendante)
**And** une évaluation est créée dans PostgreSQL `evaluations` avec `statut = brouillon`
**And** le template assigné au rôle de l'évalué est chargé automatiquement
**And** les critères d'évaluation sont affichés avec échelle 1-5
**And** je peux sauvegarder en brouillon à tout moment sans validation
**And** l'évaluation est liée à `evaluateur_matricule`, `evalue_matricule`, `id_periode`, `id_template`

## Tasks / Subtasks

- [ ] Création Table `evaluations` PostgreSQL (AC: 2, 4, 6)
  - [ ] Migration `create_evaluations_table.php`
  - [ ] Colonnes : id_evaluation (UUID), evaluateur_matricule, evalue_matricule
  - [ ] Colonnes : id_periode, id_template, type_evaluation (enum: auto, peer, subordinate)
  - [ ] Colonnes : statut (enum: brouillon, soumis, valide, rejete), notations_json (JSONB)
  - [ ] Colonnes : commentaires_json (JSONB), date_soumission, date_validation
  - [ ] Index sur evaluateur_matricule, evalue_matricule, id_periode, statut
  - [ ] Connexion PostgreSQL (sabc_business)

- [ ] Modèle Eloquent `Evaluation` (AC: 2, 4, 6)
  - [ ] Créer `app/Models/Evaluation.php`
  - [ ] Connexion PostgreSQL (sabc_business)
  - [ ] Cast `notations_json`, `commentaires_json` en array
  - [ ] Relations : evaluateur, evalue, periode, template
  - [ ] Scopes : brouillon, soumis, valide, byEvaluateur, byPeriode
  - [ ] Accessors : score_global, progression

- [ ] Service EvaluationCreationService (AC: 1, 2, 3, 4, 5)
  - [ ] Créer `app/Services/EvaluationCreationService.php`
  - [ ] Méthode `creerEvaluation()` : Création évaluation avec validation
  - [ ] Méthode `getUtilisateursEligibles()` : Liste utilisateurs évaluables
  - [ ] Méthode `determinerTypeEvaluation()` : Auto/Peer/Subordinate
  - [ ] Méthode `chargerTemplate()` : Template assigné au rôle
  - [ ] Validation permissions via EvaluationPermissionValidator

- [ ] Interface Création Évaluation (AC: 1, 2, 3, 4, 5, 6)
  - [ ] Page `resources/js/Pages/Evaluations/Create.tsx`
  - [ ] Sélection utilisateur éligible (dropdown avec recherche)
  - [ ] Affichage type évaluation détecté
  - [ ] Chargement automatique template
  - [ ] Affichage critères avec échelle 1-5
  - [ ] Bouton "Sauvegarder brouillon"
  - [ ] Design SABC responsive

- [ ] Composant SelectionUtilisateurEligible (AC: 1, 2)
  - [ ] Créer `resources/js/Components/Evaluations/SelectionUtilisateurEligible.tsx`
  - [ ] Dropdown avec recherche (nom, matricule)
  - [ ] Filtrage utilisateurs éligibles uniquement
  - [ ] Affichage : Photo, nom, rôle, région
  - [ ] Badge type évaluation (Auto, Pairs, Manager)

- [ ] Composant AffichageCriteres (AC: 3, 4)
  - [ ] Créer `resources/js/Components/Evaluations/AffichageCriteres.tsx`
  - [ ] Affichage critères par catégorie
  - [ ] Échelle notation 1-5 (radio buttons ou étoiles)
  - [ ] Champ commentaire par critère
  - [ ] Indicateur obligatoire/optionnel

- [ ] EvaluationsController (AC: 1, 2, 3, 4, 5, 6)
  - [ ] Créer `app/Http/Controllers/EvaluationsController.php`
  - [ ] Méthode `create()` : Afficher formulaire création
  - [ ] Méthode `store()` : Créer évaluation brouillon
  - [ ] Méthode `getEligibles()` : API utilisateurs éligibles
  - [ ] Validation permissions
  - [ ] Middleware `auth:api`

- [ ] Tests & Validation
  - [ ] Tester création évaluation avec permissions valides
  - [ ] Tester blocage si permissions invalides
  - [ ] Tester chargement template automatique
  - [ ] Tester sauvegarde brouillon
  - [ ] Tester détection type évaluation

## Dev Notes

### Architecture Création Évaluation

**Flux Création :**
1. Utilisateur accède page création évaluation
2. Système vérifie période ouverte
3. Récupération utilisateurs éligibles (via EligibilityService)
4. Sélection utilisateur à évaluer
5. Détection type évaluation (auto/peer/subordinate)
6. Validation permissions (via EvaluationPermissionValidator)
7. Chargement template assigné au rôle de l'évalué
8. Création évaluation statut brouillon
9. Affichage formulaire avec critères

**Types Évaluation :**
- **Auto** : evaluateur_matricule == evalue_matricule
- **Peer** : Même niveau hiérarchique + même branche
- **Subordinate** : Manager → Subordonné direct

**Statuts Évaluation :**
- **brouillon** : En cours de rédaction, modifiable
- **soumis** : Soumise, en attente validation manager
- **valide** : Validée par manager, comptabilisée
- **rejete** : Rejetée par manager, retour brouillon

### Migration Table `evaluations`

```php
Schema::connection('pgsql')->create('evaluations', function (Blueprint $table) {
    $table->uuid('id_evaluation')->primary();
    $table->string('evaluateur_matricule', 5);
    $table->string('evalue_matricule', 5);
    $table->uuid('id_periode');
    $table->uuid('id_template');
    $table->enum('type_evaluation', ['auto', 'peer', 'subordinate']);
    $table->enum('statut', ['brouillon', 'soumis', 'valide', 'rejete'])->default('brouillon');
    $table->jsonb('notations_json')->nullable();
    $table->jsonb('commentaires_json')->nullable();
    $table->timestamp('date_soumission')->nullable();
    $table->timestamp('date_validation')->nullable();
    $table->string('validateur_matricule', 5)->nullable();
    $table->text('motif_rejet')->nullable();
    $table->timestamps();
    
    $table->index('evaluateur_matricule');
    $table->index('evalue_matricule');
    $table->index('id_periode');
    $table->index('statut');
    $table->index(['evaluateur_matricule', 'evalue_matricule', 'id_periode'], 'idx_eval_unique');
    
    $table->foreign('evaluateur_matricule')
        ->references('matricule')
        ->on('utilisateurs')
        ->onDelete('restrict');
    
    $table->foreign('evalue_matricule')
        ->references('matricule')
        ->on('utilisateurs')
        ->onDelete('restrict');
    
    $table->foreign('id_periode')
        ->references('id_periode')
        ->on('periodes_evaluation')
        ->onDelete('restrict');
    
    $table->foreign('id_template')
        ->references('id_template')
        ->on('templates_evaluation')
        ->onDelete('restrict');
    
    $table->foreign('validateur_matricule')
        ->references('matricule')
        ->on('utilisateurs')
        ->onDelete('set null');
});
```

### Modèle Evaluation

```php
namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Str;

class Evaluation extends Model
{
    protected $connection = 'pgsql'; // sabc_business
    protected $table = 'evaluations';
    protected $primaryKey = 'id_evaluation';
    public $incrementing = false;
    protected $keyType = 'string';
    
    protected $fillable = [
        'id_evaluation',
        'evaluateur_matricule',
        'evalue_matricule',
        'id_periode',
        'id_template',
        'type_evaluation',
        'statut',
        'notations_json',
        'commentaires_json',
        'date_soumission',
        'date_validation',
        'validateur_matricule',
        'motif_rejet',
    ];
    
    protected $casts = [
        'notations_json' => 'array',
        'commentaires_json' => 'array',
        'date_soumission' => 'datetime',
        'date_validation' => 'datetime',
    ];
    
    protected static function boot()
    {
        parent::boot();
        
        static::creating(function ($model) {
            if (empty($model->id_evaluation)) {
                $model->id_evaluation = (string) Str::uuid();
            }
        });
    }
    
    // Relations
    public function evaluateur()
    {
        return $this->belongsTo(Utilisateur::class, 'evaluateur_matricule', 'matricule');
    }
    
    public function evalue()
    {
        return $this->belongsTo(Utilisateur::class, 'evalue_matricule', 'matricule');
    }
    
    public function periode()
    {
        return $this->belongsTo(PeriodeEvaluation::class, 'id_periode', 'id_periode');
    }
    
    public function template()
    {
        return $this->belongsTo(TemplateEvaluation::class, 'id_template', 'id_template');
    }
    
    public function validateur()
    {
        return $this->belongsTo(Utilisateur::class, 'validateur_matricule', 'matricule');
    }
    
    // Scopes
    public function scopeBrouillon($query)
    {
        return $query->where('statut', 'brouillon');
    }
    
    public function scopeSoumis($query)
    {
        return $query->where('statut', 'soumis');
    }
    
    public function scopeValide($query)
    {
        return $query->where('statut', 'valide');
    }
    
    public function scopeByEvaluateur($query, string $matricule)
    {
        return $query->where('evaluateur_matricule', $matricule);
    }
    
    public function scopeByEvalue($query, string $matricule)
    {
        return $query->where('evalue_matricule', $matricule);
    }
    
    public function scopeByPeriode($query, string $idPeriode)
    {
        return $query->where('id_periode', $idPeriode);
    }
    
    // Accessors
    public function getScoreGlobalAttribute(): ?float
    {
        if (empty($this->notations_json)) {
            return null;
        }
        
        $notes = array_values($this->notations_json);
        return count($notes) > 0 ? array_sum($notes) / count($notes) : null;
    }
    
    public function getProgressionAttribute(): int
    {
        if (empty($this->notations_json)) {
            return 0;
        }
        
        $criteres = $this->template->regleEvaluation->criteres;
        $nbCriteres = count($criteres);
        $nbNotes = count($this->notations_json);
        
        return $nbCriteres > 0 ? (int) (($nbNotes / $nbCriteres) * 100) : 0;
    }
    
    // Méthodes
    public function estModifiable(): bool
    {
        return in_array($this->statut, ['brouillon', 'rejete']);
    }
    
    public function peutEtreSoumise(): bool
    {
        // Vérifier que tous les critères obligatoires sont notés
        $criteres = $this->template->regleEvaluation->criteres;
        $notations = $this->notations_json ?? [];
        
        foreach ($criteres as $critere) {
            if (!isset($notations[$critere['id']])) {
                return false;
            }
        }
        
        return true;
    }
}
```

### EvaluationCreationService

```php
namespace App\Services;

use App\Models\Evaluation;
use App\Models\Utilisateur;
use App\Models\PeriodeEvaluation;
use App\Services\EligibilityService;
use App\Services\EvaluationPermissionValidator;
use App\Services\TemplateAssignationService;
use App\Exceptions\PeriodeFermeeException;

class EvaluationCreationService
{
    protected $eligibilityService;
    protected $permissionValidator;
    protected $templateService;
    
    public function __construct(
        EligibilityService $eligibilityService,
        EvaluationPermissionValidator $permissionValidator,
        TemplateAssignationService $templateService
    ) {
        $this->eligibilityService = $eligibilityService;
        $this->permissionValidator = $permissionValidator;
        $this->templateService = $templateService;
    }
    
    /**
     * Créer une nouvelle évaluation
     */
    public function creerEvaluation(
        Utilisateur $evaluateur,
        Utilisateur $evalue,
        PeriodeEvaluation $periode
    ): Evaluation {
        // Vérifier que la période est ouverte
        if (!$periode->est_ouverte) {
            throw new PeriodeFermeeException(
                "La période d'évaluation '{$periode->nom_periode}' n'est pas ouverte"
            );
        }
        
        // Déterminer le type d'évaluation
        $type = $this->determinerTypeEvaluation($evaluateur, $evalue);
        
        // Valider les permissions
        $this->permissionValidator->validateEvaluationPermission(
            $evaluateur,
            $evalue,
            $type
        );
        
        // Charger le template assigné au rôle de l'évalué
        $template = $this->chargerTemplate($evalue, $periode);
        
        // Créer l'évaluation
        $evaluation = Evaluation::create([
            'evaluateur_matricule' => $evaluateur->matricule,
            'evalue_matricule' => $evalue->matricule,
            'id_periode' => $periode->id_periode,
            'id_template' => $template->id_template,
            'type_evaluation' => $type,
            'statut' => 'brouillon',
        ]);
        
        return $evaluation;
    }
    
    /**
     * Récupérer les utilisateurs éligibles pour un évaluateur
     */
    public function getUtilisateursEligibles(Utilisateur $evaluateur): array
    {
        return $this->eligibilityService->getEligibleEvaluees($evaluateur);
    }
    
    /**
     * Déterminer le type d'évaluation
     */
    public function determinerTypeEvaluation(
        Utilisateur $evaluateur,
        Utilisateur $evalue
    ): string {
        // Auto-évaluation
        if ($evaluateur->matricule === $evalue->matricule) {
            return 'auto';
        }
        
        // Évaluation pairs
        if ($evaluateur->role->niveau_hierarchique === $evalue->role->niveau_hierarchique &&
            $evaluateur->id_branche === $evalue->id_branche) {
            return 'peer';
        }
        
        // Évaluation descendante (manager → subordonné)
        if ($evalue->manager_matricule === $evaluateur->matricule ||
            $this->eligibilityService->isInHierarchy($evaluateur, $evalue)) {
            return 'subordinate';
        }
        
        // Par défaut (ne devrait pas arriver si permissions validées)
        return 'subordinate';
    }
    
    /**
     * Charger le template assigné au rôle de l'évalué
     */
    protected function chargerTemplate(
        Utilisateur $evalue,
        PeriodeEvaluation $periode
    ): \App\Models\TemplateEvaluation {
        return $this->templateService->getTemplateForRolePeriode(
            $evalue->id_role,
            $periode->id_periode
        );
    }
}
```

### EvaluationsController

```php
namespace App\Http\Controllers;

use App\Models\Utilisateur;
use App\Models\PeriodeEvaluation;
use App\Services\EvaluationCreationService;
use App\Services\PeriodeEvaluationService;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response as InertiaResponse;

class EvaluationsController extends Controller
{
    protected $evaluationService;
    protected $periodeService;
    
    public function __construct(
        EvaluationCreationService $evaluationService,
        PeriodeEvaluationService $periodeService
    ) {
        $this->middleware('auth:api');
        $this->evaluationService = $evaluationService;
        $this->periodeService = $periodeService;
    }
    
    public function create(): InertiaResponse
    {
        $utilisateur = auth()->user();
        
        // Récupérer la période active
        $periode = $this->periodeService->getPeriodeActive();
        
        if (!$periode) {
            return Inertia::render('Evaluations/NoPeriode', [
                'message' => 'Aucune période d\'évaluation n\'est actuellement ouverte',
            ]);
        }
        
        // Récupérer les utilisateurs éligibles
        $eligibles = $this->evaluationService->getUtilisateursEligibles($utilisateur);
        
        return Inertia::render('Evaluations/Create', [
            'periode' => [
                'id_periode' => $periode->id_periode,
                'nom_periode' => $periode->nom_periode,
                'date_fin' => $periode->date_fin->format('d/m/Y'),
            ],
            'eligibles' => $eligibles,
        ]);
    }
    
    public function store(Request $request)
    {
        $validated = $request->validate([
            'evalue_matricule' => 'required|exists:utilisateurs,matricule',
        ]);
        
        $evaluateur = auth()->user();
        $evalue = Utilisateur::findOrFail($validated['evalue_matricule']);
        $periode = $this->periodeService->getPeriodeActive();
        
        if (!$periode) {
            return back()->withErrors([
                'periode' => 'Aucune période d\'évaluation n\'est ouverte',
            ]);
        }
        
        try {
            $evaluation = $this->evaluationService->creerEvaluation(
                $evaluateur,
                $evalue,
                $periode
            );
            
            return redirect()->route('evaluations.edit', $evaluation->id_evaluation)
                ->with('success', 'Évaluation créée avec succès');
            
        } catch (\Exception $e) {
            return back()->withErrors([
                'evaluation' => $e->getMessage(),
            ]);
        }
    }
    
    public function getEligibles()
    {
        $utilisateur = auth()->user();
        $eligibles = $this->evaluationService->getUtilisateursEligibles($utilisateur);
        
        return response()->json($eligibles);
    }
}
```

### Composant SelectionUtilisateurEligible

```tsx
// resources/js/Components/Evaluations/SelectionUtilisateurEligible.tsx
import { useState } from 'react';
import { Input } from '@/Components/UI/Input';
import { Badge } from '@/Components/UI/Badge';
import { User, Search } from 'lucide-react';

interface UtilisateurEligible {
    matricule: string;
    nom_complet: string;
    role_nom: string;
    region_nom: string;
    type_evaluation: 'auto' | 'peer' | 'subordinate';
}

interface SelectionUtilisateurEligibleProps {
    eligibles: UtilisateurEligible[];
    onSelect: (matricule: string) => void;
    selected?: string;
}

export default function SelectionUtilisateurEligible({
    eligibles,
    onSelect,
    selected
}: SelectionUtilisateurEligibleProps) {
    const [search, setSearch] = useState('');
    
    const filteredEligibles = eligibles.filter(user =>
        user.nom_complet.toLowerCase().includes(search.toLowerCase()) ||
        user.matricule.toLowerCase().includes(search.toLowerCase())
    );
    
    const getTypeBadge = (type: string) => {
        switch (type) {
            case 'auto':
                return <Badge className="bg-sabc-accent">Auto-évaluation</Badge>;
            case 'peer':
                return <Badge className="bg-blue-500">Pairs</Badge>;
            case 'subordinate':
                return <Badge className="bg-sabc-red-primary">Manager</Badge>;
            default:
                return null;
        }
    };
    
    return (
        <div className="space-y-4">
            <div className="relative">
                <Search size={20} className="absolute left-3 top-1/2 -translate-y-1/2 text-sabc-gray-400" />
                <Input
                    type="text"
                    placeholder="Rechercher par nom ou matricule..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-10"
                />
            </div>
            
            <div className="space-y-2 max-h-96 overflow-y-auto">
                {filteredEligibles.map((user) => (
                    <div
                        key={user.matricule}
                        onClick={() => onSelect(user.matricule)}
                        className={`p-4 border rounded-lg cursor-pointer transition-all ${
                            selected === user.matricule
                                ? 'border-sabc-red-primary bg-sabc-red-light'
                                : 'border-sabc-gray-200 hover:border-sabc-accent'
                        }`}
                    >
                        <div className="flex items-start justify-between">
                            <div className="flex items-center space-x-3">
                                <div className="w-10 h-10 rounded-full bg-sabc-gray-200 flex items-center justify-center">
                                    <User size={20} className="text-sabc-gray-600" />
                                </div>
                                <div>
                                    <div className="font-semibold text-sabc-gray-900">
                                        {user.nom_complet}
                                    </div>
                                    <div className="text-sm text-sabc-gray-600">
                                        {user.matricule} • {user.role_nom}
                                    </div>
                                    <div className="text-xs text-sabc-gray-500">
                                        {user.region_nom}
                                    </div>
                                </div>
                            </div>
                            {getTypeBadge(user.type_evaluation)}
                        </div>
                    </div>
                ))}
                
                {filteredEligibles.length === 0 && (
                    <div className="text-center py-8 text-sabc-gray-500">
                        Aucun utilisateur trouvé
                    </div>
                )}
            </div>
        </div>
    );
}
```

### Project Structure Notes

**Fichiers à créer :**
- `database/migrations/xxxx_create_evaluations_table.php`
- `app/Models/Evaluation.php`
- `app/Services/EvaluationCreationService.php`
- `app/Exceptions/PeriodeFermeeException.php`
- `app/Http/Controllers/EvaluationsController.php`
- `resources/js/Pages/Evaluations/Create.tsx`
- `resources/js/Pages/Evaluations/NoPeriode.tsx`
- `resources/js/Components/Evaluations/SelectionUtilisateurEligible.tsx`
- `resources/js/Components/Evaluations/AffichageCriteres.tsx`

**Fichiers à modifier :**
- `routes/web.php` : Ajouter routes évaluations

**Dépendances Stories Précédentes :**
- Story 2.2 : EligibilityService
- Story 2.4 : EvaluationPermissionValidator
- Story 3.1 : Templates évaluation
- Story 3.2 : TemplateAssignationService
- Story 3.3 : Périodes évaluation

### Règles Métier SABC Critiques

**Validation Création :**
- Période ouverte obligatoire
- Permissions validées via EvaluationPermissionValidator
- Template assigné au rôle de l'évalué

**Types Évaluation :**
- Auto : evaluateur == evalue
- Peer : Même niveau + branche
- Subordinate : Lien hiérarchique

**Statut Brouillon :**
- Modifiable à tout moment
- Pas de validation complétude
- Sauvegarde automatique

**Unicité :**
- Une seule évaluation par (evaluateur, evalue, periode)
- Index unique sur ces 3 colonnes

### References

- [Source: epics.md#Epic 4 Story 4.1] - Acceptance criteria complets
- [Source: architecture.md#Data Models] - Structure evaluations
- [Source: business-logic-rules.md#Workflow Évaluation] - Statuts et transitions
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
