# Story 4.6: Consultation des Évaluations Données

Status: done

## Story

En tant qu'évaluateur,
Je veux consulter les évaluations que j'ai données,
Afin de suivre mes contributions.

## Acceptance Criteria

**Given** je suis connecté
**When** j'accède à "Mes Évaluations Données"
**Then** je vois toutes les évaluations où `evaluateur_matricule = mon_matricule`
**And** je vois le statut de chaque évaluation
**And** je peux reprendre une évaluation en brouillon
**And** je peux consulter mes évaluations soumises et validées
**And** si une évaluation est rejetée, je vois le motif et peux la corriger
**And** les évaluations sont filtrables par période et type

## Tasks / Subtasks

- [ ] Interface Liste Évaluations Données (AC: 1, 2, 5, 6)
  - [ ] Page `resources/js/Pages/Evaluations/Donnees/Index.tsx`
  - [ ] Liste évaluations où evaluateur_matricule = utilisateur connecté
  - [ ] Affichage : Évalué, type, statut, période, date
  - [ ] Filtres : Par période, type évaluation, statut
  - [ ] Actions : Reprendre brouillon, Consulter, Corriger rejetée
  - [ ] Statistiques : Total données, brouillon, soumises, validées, rejetées

- [ ] Page Reprise Évaluation Brouillon (AC: 3)
  - [ ] Redirection vers `Evaluations/Edit.tsx` existante
  - [ ] Chargement évaluation brouillon
  - [ ] Modification et sauvegarde
  - [ ] Soumission possible

- [ ] Page Correction Évaluation Rejetée (AC: 4, 5)
  - [ ] Affichage motif rejet en haut de page
  - [ ] Redirection vers `Evaluations/Edit.tsx`
  - [ ] Chargement évaluation rejetée
  - [ ] Modification selon motif
  - [ ] Nouvelle soumission

- [ ] Composant CardEvaluationDonnee (AC: 2, 3, 4, 5)
  - [ ] Créer `resources/js/Components/Evaluations/CardEvaluationDonnee.tsx`
  - [ ] Affichage : Évalué, type, statut, date
  - [ ] Badge statut avec couleurs SABC
  - [ ] Boutons actions selon statut
  - [ ] Affichage motif rejet si rejetée

- [ ] Composant FiltresEvaluationsDonnees (AC: 6)
  - [ ] Créer `resources/js/Components/Evaluations/FiltresEvaluationsDonnees.tsx`
  - [ ] Filtre période (dropdown)
  - [ ] Filtre type évaluation (checkboxes)
  - [ ] Filtre statut (checkboxes)
  - [ ] Bouton réinitialiser filtres

- [ ] EvaluationsDonneesController (AC: 1, 2, 3, 4, 6)
  - [ ] Créer `app/Http/Controllers/EvaluationsDonneesController.php`
  - [ ] Méthode `index()` : Liste évaluations données
  - [ ] Méthode `reprendre()` : Reprendre brouillon
  - [ ] Méthode `corriger()` : Corriger rejetée
  - [ ] Filtrage : Par période, type, statut
  - [ ] Middleware `auth:api`

- [ ] Service EvaluationsDonneesService (AC: 1, 3, 4)
  - [ ] Créer `app/Services/EvaluationsDonneesService.php`
  - [ ] Méthode `getEvaluationsDonnees()` : Liste filtrée
  - [ ] Méthode `peutReprendre()` : Vérification brouillon
  - [ ] Méthode `peutCorriger()` : Vérification rejetée

- [ ] Tests & Validation
  - [ ] Tester affichage évaluations données
  - [ ] Tester reprise évaluation brouillon
  - [ ] Tester correction évaluation rejetée
  - [ ] Tester affichage motif rejet
  - [ ] Tester filtres période, type, statut

## Dev Notes

### Architecture Consultation Évaluations Données

**Flux Consultation :**
1. Utilisateur accède "Mes Évaluations Données"
2. Récupération évaluations où evaluateur_matricule = utilisateur
3. Affichage liste avec tous statuts
4. Actions selon statut :
   - Brouillon : Reprendre édition
   - Soumis : Consulter (lecture seule)
   - Validé : Consulter (lecture seule)
   - Rejeté : Corriger avec motif affiché

**Statuts et Actions :**
- **Brouillon** : Bouton "Reprendre" → Edit page
- **Soumis** : Bouton "Consulter" → Show page (lecture seule)
- **Validé** : Bouton "Consulter" → Show page (lecture seule)
- **Rejeté** : Bouton "Corriger" + Affichage motif → Edit page

**Règles Modification :**
- Brouillon : Modifiable et soumissible
- Rejeté : Modifiable et soumissible (retour automatique brouillon)
- Soumis : Lecture seule
- Validé : Lecture seule

### EvaluationsDonneesController

```php
namespace App\Http\Controllers;

use App\Models\Evaluation;
use App\Services\EvaluationsDonneesService;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response as InertiaResponse;

class EvaluationsDonneesController extends Controller
{
    protected $evaluationsService;
    
    public function __construct(EvaluationsDonneesService $evaluationsService)
    {
        $this->middleware('auth:api');
        $this->evaluationsService = $evaluationsService;
    }
    
    public function index(Request $request): InertiaResponse
    {
        $utilisateur = auth()->user();
        
        // Récupérer filtres
        $filters = [
            'periode' => $request->input('periode'),
            'type' => $request->input('type'),
            'statut' => $request->input('statut'),
        ];
        
        // Récupérer évaluations données
        $evaluations = $this->evaluationsService->getEvaluationsDonnees(
            $utilisateur,
            $filters
        );
        
        // Statistiques
        $stats = [
            'total_donnees' => $evaluations->count(),
            'brouillon' => $evaluations->where('statut', 'brouillon')->count(),
            'soumises' => $evaluations->where('statut', 'soumis')->count(),
            'validees' => $evaluations->where('statut', 'valide')->count(),
            'rejetees' => $evaluations->where('statut', 'rejete')->count(),
        ];
        
        return Inertia::render('Evaluations/Donnees/Index', [
            'evaluations' => $evaluations->map(function($eval) {
                return [
                    'id_evaluation' => $eval->id_evaluation,
                    'evalue' => [
                        'matricule' => $eval->evalue->matricule,
                        'nom_complet' => $eval->evalue->nom_complet,
                        'role_nom' => $eval->evalue->role->nom_role,
                    ],
                    'type_evaluation' => $eval->type_evaluation,
                    'statut' => $eval->statut,
                    'periode_nom' => $eval->periode->nom_periode,
                    'date_creation' => $eval->created_at->format('d/m/Y'),
                    'date_soumission' => $eval->date_soumission?->format('d/m/Y'),
                    'date_validation' => $eval->date_validation?->format('d/m/Y'),
                    'motif_rejet' => $eval->motif_rejet,
                    'progression' => $eval->progression,
                ];
            }),
            'statistiques' => $stats,
            'periodes' => $this->getPeriodes(),
            'filters' => $filters,
        ]);
    }
    
    public function reprendre(string $id)
    {
        $utilisateur = auth()->user();
        $evaluation = Evaluation::findOrFail($id);
        
        // Vérifier que l'utilisateur est l'évaluateur
        if ($evaluation->evaluateur_matricule !== $utilisateur->matricule) {
            abort(403, 'Vous n\'êtes pas autorisé à reprendre cette évaluation');
        }
        
        // Vérifier que l'évaluation est en brouillon
        if (!$this->evaluationsService->peutReprendre($evaluation)) {
            return back()->withErrors([
                'evaluation' => 'Seules les évaluations en brouillon peuvent être reprises'
            ]);
        }
        
        return redirect()->route('evaluations.edit', $id);
    }
    
    public function corriger(string $id)
    {
        $utilisateur = auth()->user();
        $evaluation = Evaluation::findOrFail($id);
        
        // Vérifier que l'utilisateur est l'évaluateur
        if ($evaluation->evaluateur_matricule !== $utilisateur->matricule) {
            abort(403, 'Vous n\'êtes pas autorisé à corriger cette évaluation');
        }
        
        // Vérifier que l'évaluation est rejetée
        if (!$this->evaluationsService->peutCorriger($evaluation)) {
            return back()->withErrors([
                'evaluation' => 'Seules les évaluations rejetées peuvent être corrigées'
            ]);
        }
        
        // Rediriger vers édition avec motif rejet
        return redirect()->route('evaluations.edit', $id)
            ->with('motif_rejet', $evaluation->motif_rejet);
    }
    
    protected function getPeriodes()
    {
        return \App\Models\PeriodeEvaluation::select('id_periode', 'nom_periode')
            ->orderBy('date_debut', 'desc')
            ->get();
    }
}
```

### EvaluationsDonneesService

```php
namespace App\Services;

use App\Models\Utilisateur;
use App\Models\Evaluation;
use Illuminate\Support\Collection;

class EvaluationsDonneesService
{
    /**
     * Récupérer les évaluations données par un utilisateur
     */
    public function getEvaluationsDonnees(
        Utilisateur $utilisateur,
        array $filters = []
    ): Collection {
        $query = Evaluation::with(['evalue', 'periode'])
            ->where('evaluateur_matricule', $utilisateur->matricule);
        
        // Filtrer par période
        if (isset($filters['periode']) && !empty($filters['periode'])) {
            $query->where('id_periode', $filters['periode']);
        }
        
        // Filtrer par type
        if (isset($filters['type']) && !empty($filters['type'])) {
            $query->whereIn('type_evaluation', $filters['type']);
        }
        
        // Filtrer par statut
        if (isset($filters['statut']) && !empty($filters['statut'])) {
            $query->whereIn('statut', $filters['statut']);
        }
        
        return $query->orderBy('created_at', 'desc')->get();
    }
    
    /**
     * Vérifier si une évaluation peut être reprise
     */
    public function peutReprendre(Evaluation $evaluation): bool
    {
        return $evaluation->statut === 'brouillon';
    }
    
    /**
     * Vérifier si une évaluation peut être corrigée
     */
    public function peutCorriger(Evaluation $evaluation): bool
    {
        return $evaluation->statut === 'rejete';
    }
}
```

### Composant CardEvaluationDonnee

```tsx
// resources/js/Components/Evaluations/CardEvaluationDonnee.tsx
import { Badge } from '@/Components/UI/Badge';
import { Button } from '@/Components/UI/Button';
import { Edit, Eye, AlertTriangle, Clock, CheckCircle, XCircle } from 'lucide-react';
import { router } from '@inertiajs/react';

interface CardEvaluationDonneeProps {
    evaluation: {
        id_evaluation: string;
        evalue: {
            nom_complet: string;
            role_nom: string;
        };
        type_evaluation: 'auto' | 'peer' | 'subordinate';
        statut: 'brouillon' | 'soumis' | 'valide' | 'rejete';
        periode_nom: string;
        date_creation: string;
        date_soumission?: string;
        date_validation?: string;
        motif_rejet?: string;
        progression?: number;
    };
}

const TYPE_LABELS = {
    auto: 'Auto-évaluation',
    peer: 'Évaluation Pairs',
    subordinate: 'Évaluation Subordonné',
};

const TYPE_COLORS = {
    auto: 'bg-sabc-accent',
    peer: 'bg-blue-500',
    subordinate: 'bg-sabc-red-primary',
};

const STATUT_CONFIG = {
    brouillon: {
        label: 'Brouillon',
        color: 'bg-sabc-gray-400',
        icon: Edit,
    },
    soumis: {
        label: 'Soumis',
        color: 'bg-sabc-warning',
        icon: Clock,
    },
    valide: {
        label: 'Validé',
        color: 'bg-sabc-success',
        icon: CheckCircle,
    },
    rejete: {
        label: 'Rejeté',
        color: 'bg-sabc-error',
        icon: XCircle,
    },
};

export default function CardEvaluationDonnee({ evaluation }: CardEvaluationDonneeProps) {
    const handleAction = () => {
        if (evaluation.statut === 'brouillon') {
            router.post(`/evaluations/donnees/${evaluation.id_evaluation}/reprendre`);
        } else if (evaluation.statut === 'rejete') {
            router.post(`/evaluations/donnees/${evaluation.id_evaluation}/corriger`);
        } else {
            router.visit(`/evaluations/${evaluation.id_evaluation}`);
        }
    };
    
    const statutConfig = STATUT_CONFIG[evaluation.statut];
    const StatutIcon = statutConfig.icon;
    
    return (
        <div className="bg-white border border-sabc-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                        <Badge className={TYPE_COLORS[evaluation.type_evaluation]}>
                            {TYPE_LABELS[evaluation.type_evaluation]}
                        </Badge>
                        <Badge className={statutConfig.color}>
                            <StatutIcon size={12} className="mr-1" />
                            {statutConfig.label}
                        </Badge>
                    </div>
                    
                    <h3 className="font-semibold text-sabc-gray-900 mb-1">
                        {evaluation.evalue.nom_complet}
                    </h3>
                    <p className="text-sm text-sabc-gray-600">
                        {evaluation.evalue.role_nom}
                    </p>
                </div>
                
                {evaluation.statut === 'brouillon' && evaluation.progression !== undefined && (
                    <div className="text-right">
                        <div className="text-3xl font-bold text-sabc-accent">
                            {evaluation.progression}%
                        </div>
                        <div className="text-xs text-sabc-gray-600">complété</div>
                    </div>
                )}
            </div>
            
            {evaluation.statut === 'rejete' && evaluation.motif_rejet && (
                <div className="bg-red-50 border border-red-200 p-3 rounded-lg mb-4">
                    <div className="flex items-start space-x-2">
                        <AlertTriangle size={16} className="text-sabc-error mt-0.5" />
                        <div className="flex-1">
                            <p className="text-sm font-semibold text-sabc-error mb-1">
                                Motif du rejet :
                            </p>
                            <p className="text-sm text-sabc-gray-800">
                                {evaluation.motif_rejet}
                            </p>
                        </div>
                    </div>
                </div>
            )}
            
            <div className="space-y-2 mb-4">
                <div className="flex items-center justify-between text-sm">
                    <span className="text-sabc-gray-600">Période :</span>
                    <span className="font-medium text-sabc-gray-900">
                        {evaluation.periode_nom}
                    </span>
                </div>
                
                <div className="flex items-center justify-between text-sm">
                    <span className="text-sabc-gray-600">Créée le :</span>
                    <span className="font-medium text-sabc-gray-900">
                        {evaluation.date_creation}
                    </span>
                </div>
                
                {evaluation.date_soumission && (
                    <div className="flex items-center justify-between text-sm">
                        <span className="text-sabc-gray-600">Soumise le :</span>
                        <span className="font-medium text-sabc-gray-900">
                            {evaluation.date_soumission}
                        </span>
                    </div>
                )}
                
                {evaluation.date_validation && (
                    <div className="flex items-center justify-between text-sm">
                        <span className="text-sabc-gray-600">Validée le :</span>
                        <span className="font-medium text-sabc-gray-900">
                            {evaluation.date_validation}
                        </span>
                    </div>
                )}
            </div>
            
            <Button
                onClick={handleAction}
                className={`w-full ${
                    evaluation.statut === 'brouillon'
                        ? 'bg-sabc-accent hover:bg-orange-600'
                        : evaluation.statut === 'rejete'
                        ? 'bg-sabc-error hover:bg-red-700'
                        : 'bg-sabc-red-primary hover:bg-sabc-red-dark'
                }`}
            >
                {evaluation.statut === 'brouillon' && (
                    <>
                        <Edit size={16} className="mr-2" />
                        Reprendre l'évaluation
                    </>
                )}
                {evaluation.statut === 'rejete' && (
                    <>
                        <Edit size={16} className="mr-2" />
                        Corriger l'évaluation
                    </>
                )}
                {(evaluation.statut === 'soumis' || evaluation.statut === 'valide') && (
                    <>
                        <Eye size={16} className="mr-2" />
                        Consulter l'évaluation
                    </>
                )}
            </Button>
        </div>
    );
}
```

### Composant FiltresEvaluationsDonnees

```tsx
// resources/js/Components/Evaluations/FiltresEvaluationsDonnees.tsx
import { useState } from 'react';
import { router } from '@inertiajs/react';
import { Button } from '@/Components/UI/Button';
import { Filter, X } from 'lucide-react';

interface FiltresEvaluationsDonneesProps {
    periodes: Array<{ id_periode: string; nom_periode: string }>;
    filters: {
        periode?: string;
        type?: string[];
        statut?: string[];
    };
}

export default function FiltresEvaluationsDonnees({
    periodes,
    filters: initialFilters
}: FiltresEvaluationsDonneesProps) {
    const [filters, setFilters] = useState(initialFilters);
    
    const handleApply = () => {
        router.get('/evaluations/donnees', filters, {
            preserveState: true,
            preserveScroll: true,
        });
    };
    
    const handleReset = () => {
        const resetFilters = {
            periode: '',
            type: [],
            statut: [],
        };
        setFilters(resetFilters);
        router.get('/evaluations/donnees', resetFilters);
    };
    
    return (
        <div className="bg-white border border-sabc-gray-200 rounded-lg p-4">
            <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-sabc-gray-900 flex items-center">
                    <Filter size={20} className="mr-2" />
                    Filtres
                </h3>
                <Button
                    onClick={handleReset}
                    variant="secondary"
                    size="sm"
                >
                    <X size={16} className="mr-1" />
                    Réinitialiser
                </Button>
            </div>
            
            <div className="space-y-4">
                {/* Filtre Période */}
                <div>
                    <label className="block text-sm font-medium text-sabc-gray-800 mb-2">
                        Période
                    </label>
                    <select
                        value={filters.periode || ''}
                        onChange={(e) => setFilters({ ...filters, periode: e.target.value })}
                        className="w-full border border-sabc-gray-200 rounded-lg p-2"
                    >
                        <option value="">Toutes les périodes</option>
                        {periodes.map((periode) => (
                            <option key={periode.id_periode} value={periode.id_periode}>
                                {periode.nom_periode}
                            </option>
                        ))}
                    </select>
                </div>
                
                {/* Filtre Type */}
                <div>
                    <label className="block text-sm font-medium text-sabc-gray-800 mb-2">
                        Type d'évaluation
                    </label>
                    <div className="space-y-2">
                        {[
                            { value: 'auto', label: 'Auto-évaluation' },
                            { value: 'peer', label: 'Pairs' },
                            { value: 'subordinate', label: 'Subordonnés' },
                        ].map((type) => (
                            <label key={type.value} className="flex items-center">
                                <input
                                    type="checkbox"
                                    checked={filters.type?.includes(type.value)}
                                    onChange={(e) => {
                                        const newTypes = e.target.checked
                                            ? [...(filters.type || []), type.value]
                                            : (filters.type || []).filter(t => t !== type.value);
                                        setFilters({ ...filters, type: newTypes });
                                    }}
                                    className="mr-2"
                                />
                                <span className="text-sm text-sabc-gray-800">{type.label}</span>
                            </label>
                        ))}
                    </div>
                </div>
                
                {/* Filtre Statut */}
                <div>
                    <label className="block text-sm font-medium text-sabc-gray-800 mb-2">
                        Statut
                    </label>
                    <div className="space-y-2">
                        {[
                            { value: 'brouillon', label: 'Brouillon' },
                            { value: 'soumis', label: 'Soumis' },
                            { value: 'valide', label: 'Validé' },
                            { value: 'rejete', label: 'Rejeté' },
                        ].map((statut) => (
                            <label key={statut.value} className="flex items-center">
                                <input
                                    type="checkbox"
                                    checked={filters.statut?.includes(statut.value)}
                                    onChange={(e) => {
                                        const newStatuts = e.target.checked
                                            ? [...(filters.statut || []), statut.value]
                                            : (filters.statut || []).filter(s => s !== statut.value);
                                        setFilters({ ...filters, statut: newStatuts });
                                    }}
                                    className="mr-2"
                                />
                                <span className="text-sm text-sabc-gray-800">{statut.label}</span>
                            </label>
                        ))}
                    </div>
                </div>
                
                <Button
                    onClick={handleApply}
                    className="w-full bg-sabc-red-primary hover:bg-sabc-red-dark"
                >
                    Appliquer les filtres
                </Button>
            </div>
        </div>
    );
}
```

### Project Structure Notes

**Fichiers à créer :**
- `app/Controllers/EvaluationsDonneesController.php`
- `app/Services/EvaluationsDonneesService.php`
- `resources/js/Pages/Evaluations/Donnees/Index.tsx`
- `resources/js/Components/Evaluations/CardEvaluationDonnee.tsx`
- `resources/js/Components/Evaluations/FiltresEvaluationsDonnees.tsx`

**Fichiers à modifier :**
- `routes/web.php` : Ajouter routes évaluations données
- `resources/js/Pages/Evaluations/Edit.tsx` : Afficher motif rejet si présent

**Dépendances Stories Précédentes :**
- Story 4.1 : Table evaluations, création évaluations
- Story 4.2 : Édition évaluations
- Story 4.3 : Soumission évaluations
- Story 4.4 : Rejet évaluations avec motif

### Règles Métier SABC Critiques

**Visibilité Évaluations :**
- Tous statuts visibles : brouillon, soumis, valide, rejete
- Affichage motif rejet si statut = 'rejete'

**Actions par Statut :**
- Brouillon : Reprendre édition (modifiable)
- Soumis : Consulter (lecture seule)
- Validé : Consulter (lecture seule)
- Rejeté : Corriger avec motif (modifiable)

**Filtres :**
- Par période : Toutes périodes disponibles
- Par type : Auto, Pairs, Subordonnés
- Par statut : Brouillon, Soumis, Validé, Rejeté

**Statistiques :**
- Total données
- Brouillon (en cours)
- Soumises (en attente validation)
- Validées (comptabilisées)
- Rejetées (à corriger)

### References

- [Source: epics.md#Epic 4 Story 4.6] - Acceptance criteria complets
- [Source: architecture.md#Workflow States] - Statuts évaluations
- [Source: business-logic-rules.md#Workflow Évaluation] - Règles modification
- [Source: project-context.md#Critical Implementation Rules] - Permissions

## Dev Agent Record

### Agent Model Used

_À remplir par le dev agent_

### Debug Log References

_À remplir par le dev agent_

### Completion Notes List

_À remplir par le dev agent_

### File List

_À remplir par le dev agent_
