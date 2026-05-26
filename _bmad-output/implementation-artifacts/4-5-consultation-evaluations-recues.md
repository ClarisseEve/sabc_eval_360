# Story 4.5: Consultation des Évaluations Reçues

Status: ready-for-dev

## Story

En tant qu'utilisateur évalué,
Je veux consulter les évaluations que j'ai reçues,
Afin de connaître mon feedback.

## Acceptance Criteria

**Given** je suis connecté
**When** j'accède à "Mes Évaluations Reçues"
**Then** je vois toutes les évaluations où `evalue_matricule = mon_matricule`
**And** je vois le statut de chaque évaluation (brouillon, soumis, validé, rejeté)
**And** je peux consulter les évaluations validées avec notes et commentaires
**And** je ne peux pas voir les évaluations en brouillon ou rejetées
**And** je vois le type d'évaluation (auto, pairs, manager, subordonnés)
**And** les évaluations sont filtrables par période

## Tasks / Subtasks

- [ ] Interface Liste Évaluations Reçues (AC: 1, 2, 4, 5, 6)
  - [ ] Page `resources/js/Pages/Evaluations/Recues/Index.tsx`
  - [ ] Liste évaluations où evalue_matricule = utilisateur connecté
  - [ ] Affichage : Évaluateur, type, statut, période, date
  - [ ] Filtres : Par période, type évaluation, statut
  - [ ] Masquage évaluations brouillon/rejetées
  - [ ] Statistiques : Total reçues, validées, en attente

- [ ] Page Détails Évaluation Reçue (AC: 3)
  - [ ] Page `resources/js/Pages/Evaluations/Recues/Show.tsx`
  - [ ] Affichage complet : Notes, commentaires, score global
  - [ ] Affichage par catégorie de critères
  - [ ] Graphique radar compétences
  - [ ] Commentaires détaillés par critère
  - [ ] Informations évaluateur (anonymisé si pairs)

- [ ] Composant CardEvaluationRecue (AC: 2, 4, 5)
  - [ ] Créer `resources/js/Components/Evaluations/CardEvaluationRecue.tsx`
  - [ ] Affichage : Évaluateur, type, statut, date
  - [ ] Badge type évaluation (Auto, Pairs, Manager, Subordonnés)
  - [ ] Badge statut (Soumis, Validé)
  - [ ] Score global si validé
  - [ ] Bouton "Consulter" si validé

- [ ] Composant FiltresEvaluationsRecues (AC: 6)
  - [ ] Créer `resources/js/Components/Evaluations/FiltresEvaluationsRecues.tsx`
  - [ ] Filtre période (dropdown)
  - [ ] Filtre type évaluation (checkboxes)
  - [ ] Filtre statut (checkboxes)
  - [ ] Bouton réinitialiser filtres

- [ ] EvaluationsRecuesController (AC: 1, 2, 3, 4, 6)
  - [ ] Créer `app/Http/Controllers/EvaluationsRecuesController.php`
  - [ ] Méthode `index()` : Liste évaluations reçues
  - [ ] Méthode `show()` : Détails évaluation validée
  - [ ] Filtrage : Masquer brouillon/rejetées
  - [ ] Filtrage : Par période, type
  - [ ] Middleware `auth:api`

- [ ] Service EvaluationsRecuesService (AC: 1, 4)
  - [ ] Créer `app/Services/EvaluationsRecuesService.php`
  - [ ] Méthode `getEvaluationsRecues()` : Liste filtrée
  - [ ] Méthode `peutConsulter()` : Vérification permissions
  - [ ] Méthode `anonymiserEvaluateur()` : Anonymisation pairs si nécessaire

- [ ] Tests & Validation
  - [ ] Tester affichage évaluations reçues
  - [ ] Tester masquage brouillon/rejetées
  - [ ] Tester consultation évaluation validée
  - [ ] Tester filtres période et type
  - [ ] Tester anonymisation évaluateurs pairs

## Dev Notes

### Architecture Consultation Évaluations Reçues

**Flux Consultation :**
1. Utilisateur accède "Mes Évaluations Reçues"
2. Récupération évaluations où evalue_matricule = utilisateur
3. Filtrage : Masquer brouillon et rejetées
4. Affichage liste avec statuts
5. Consultation détaillée si validée
6. Anonymisation évaluateurs pairs si nécessaire

**Règles Visibilité :**
- **Visible** : Évaluations soumises et validées
- **Masqué** : Évaluations brouillon et rejetées
- **Détails** : Uniquement évaluations validées

**Types Évaluation :**
- **Auto** : Auto-évaluation
- **Peer** : Évaluation par pairs
- **Subordinate** : Évaluation par manager
- **Upward** : Évaluation par subordonnés (si applicable)

**Anonymisation :**
- Évaluations pairs : Évaluateur anonymisé (optionnel selon règles SABC)
- Autres types : Évaluateur visible

### EvaluationsRecuesController

```php
namespace App\Http\Controllers;

use App\Models\Evaluation;
use App\Services\EvaluationsRecuesService;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response as InertiaResponse;

class EvaluationsRecuesController extends Controller
{
    protected $evaluationsService;
    
    public function __construct(EvaluationsRecuesService $evaluationsService)
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
            'statut' => $request->input('statut', ['soumis', 'valide']), // Par défaut, masquer brouillon/rejetées
        ];
        
        // Récupérer évaluations reçues
        $evaluations = $this->evaluationsService->getEvaluationsRecues(
            $utilisateur,
            $filters
        );
        
        // Statistiques
        $stats = [
            'total_recues' => $evaluations->count(),
            'validees' => $evaluations->where('statut', 'valide')->count(),
            'en_attente' => $evaluations->where('statut', 'soumis')->count(),
        ];
        
        return Inertia::render('Evaluations/Recues/Index', [
            'evaluations' => $evaluations->map(function($eval) {
                return [
                    'id_evaluation' => $eval->id_evaluation,
                    'evaluateur' => [
                        'matricule' => $eval->evaluateur->matricule,
                        'nom_complet' => $eval->evaluateur->nom_complet,
                        'role_nom' => $eval->evaluateur->role->nom_role,
                    ],
                    'type_evaluation' => $eval->type_evaluation,
                    'statut' => $eval->statut,
                    'periode_nom' => $eval->periode->nom_periode,
                    'date_soumission' => $eval->date_soumission?->format('d/m/Y'),
                    'date_validation' => $eval->date_validation?->format('d/m/Y'),
                    'score_global' => $eval->statut === 'valide' ? $eval->score_global : null,
                ];
            }),
            'statistiques' => $stats,
            'periodes' => $this->getPeriodes(),
            'filters' => $filters,
        ]);
    }
    
    public function show(string $id): InertiaResponse
    {
        $utilisateur = auth()->user();
        $evaluation = Evaluation::with([
            'evaluateur',
            'periode',
            'template.regleEvaluation'
        ])->findOrFail($id);
        
        // Vérifier que l'utilisateur est l'évalué
        if ($evaluation->evalue_matricule !== $utilisateur->matricule) {
            abort(403, 'Vous n\'êtes pas autorisé à consulter cette évaluation');
        }
        
        // Vérifier que l'évaluation est validée
        if ($evaluation->statut !== 'valide') {
            return redirect()->route('evaluations.recues.index')
                ->withErrors(['evaluation' => 'Seules les évaluations validées peuvent être consultées']);
        }
        
        // Anonymiser évaluateur si pairs (optionnel)
        $evaluateurInfo = [
            'matricule' => $evaluation->evaluateur->matricule,
            'nom_complet' => $evaluation->evaluateur->nom_complet,
            'role_nom' => $evaluation->evaluateur->role->nom_role,
        ];
        
        // Organiser critères par catégorie
        $criteres = $evaluation->template->regleEvaluation->criteres;
        $criteresParCategorie = [];
        
        foreach ($criteres as $critere) {
            $categorie = $critere['categorie'];
            if (!isset($criteresParCategorie[$categorie])) {
                $criteresParCategorie[$categorie] = [];
            }
            
            $critereId = $critere['id'];
            $notation = $evaluation->notations_json[$critereId] ?? null;
            
            $criteresParCategorie[$categorie][] = [
                'nom' => $critere['nom'],
                'description' => $critere['description'] ?? null,
                'ponderation' => $critere['ponderation'],
                'note' => $notation['note'] ?? null,
                'commentaire' => $notation['commentaire'] ?? null,
            ];
        }
        
        return Inertia::render('Evaluations/Recues/Show', [
            'evaluation' => [
                'id_evaluation' => $evaluation->id_evaluation,
                'evaluateur' => $evaluateurInfo,
                'type_evaluation' => $evaluation->type_evaluation,
                'periode_nom' => $evaluation->periode->nom_periode,
                'date_validation' => $evaluation->date_validation->format('d/m/Y'),
                'score_global' => $evaluation->score_global,
            ],
            'criteres_par_categorie' => $criteresParCategorie,
        ]);
    }
    
    protected function getPeriodes()
    {
        return \App\Models\PeriodeEvaluation::select('id_periode', 'nom_periode')
            ->orderBy('date_debut', 'desc')
            ->get();
    }
}
```

### EvaluationsRecuesService

```php
namespace App\Services;

use App\Models\Utilisateur;
use App\Models\Evaluation;
use Illuminate\Support\Collection;

class EvaluationsRecuesService
{
    /**
     * Récupérer les évaluations reçues par un utilisateur
     */
    public function getEvaluationsRecues(
        Utilisateur $utilisateur,
        array $filters = []
    ): Collection {
        $query = Evaluation::with(['evaluateur', 'periode'])
            ->where('evalue_matricule', $utilisateur->matricule);
        
        // Filtrer par statut (masquer brouillon et rejetées par défaut)
        if (isset($filters['statut'])) {
            $query->whereIn('statut', $filters['statut']);
        } else {
            $query->whereIn('statut', ['soumis', 'valide']);
        }
        
        // Filtrer par période
        if (isset($filters['periode']) && !empty($filters['periode'])) {
            $query->where('id_periode', $filters['periode']);
        }
        
        // Filtrer par type
        if (isset($filters['type']) && !empty($filters['type'])) {
            $query->whereIn('type_evaluation', $filters['type']);
        }
        
        return $query->orderBy('date_soumission', 'desc')->get();
    }
    
    /**
     * Vérifier si un utilisateur peut consulter une évaluation
     */
    public function peutConsulter(Evaluation $evaluation, Utilisateur $utilisateur): bool
    {
        // L'utilisateur doit être l'évalué
        if ($evaluation->evalue_matricule !== $utilisateur->matricule) {
            return false;
        }
        
        // L'évaluation doit être validée
        if ($evaluation->statut !== 'valide') {
            return false;
        }
        
        return true;
    }
    
    /**
     * Anonymiser l'évaluateur si nécessaire (pairs)
     */
    public function anonymiserEvaluateur(Evaluation $evaluation): array
    {
        // Si évaluation par pairs, anonymiser (optionnel selon règles SABC)
        if ($evaluation->type_evaluation === 'peer') {
            return [
                'matricule' => 'ANONYME',
                'nom_complet' => 'Collègue (anonyme)',
                'role_nom' => $evaluation->evaluateur->role->nom_role,
            ];
        }
        
        // Sinon, retourner informations complètes
        return [
            'matricule' => $evaluation->evaluateur->matricule,
            'nom_complet' => $evaluation->evaluateur->nom_complet,
            'role_nom' => $evaluation->evaluateur->role->nom_role,
        ];
    }
}
```

### Composant CardEvaluationRecue

```tsx
// resources/js/Components/Evaluations/CardEvaluationRecue.tsx
import { Badge } from '@/Components/UI/Badge';
import { Button } from '@/Components/UI/Button';
import { Eye, Clock, CheckCircle } from 'lucide-react';
import { router } from '@inertiajs/react';

interface CardEvaluationRecueProps {
    evaluation: {
        id_evaluation: string;
        evaluateur: {
            nom_complet: string;
            role_nom: string;
        };
        type_evaluation: 'auto' | 'peer' | 'subordinate';
        statut: 'soumis' | 'valide';
        periode_nom: string;
        date_soumission?: string;
        date_validation?: string;
        score_global?: number;
    };
}

const TYPE_LABELS = {
    auto: 'Auto-évaluation',
    peer: 'Évaluation Pairs',
    subordinate: 'Évaluation Manager',
};

const TYPE_COLORS = {
    auto: 'bg-sabc-accent',
    peer: 'bg-blue-500',
    subordinate: 'bg-sabc-red-primary',
};

export default function CardEvaluationRecue({ evaluation }: CardEvaluationRecueProps) {
    const handleConsulter = () => {
        if (evaluation.statut === 'valide') {
            router.visit(`/evaluations/recues/${evaluation.id_evaluation}`);
        }
    };
    
    return (
        <div className="bg-white border border-sabc-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                        <Badge className={TYPE_COLORS[evaluation.type_evaluation]}>
                            {TYPE_LABELS[evaluation.type_evaluation]}
                        </Badge>
                        {evaluation.statut === 'valide' ? (
                            <Badge className="bg-sabc-success">
                                <CheckCircle size={12} className="mr-1" />
                                Validé
                            </Badge>
                        ) : (
                            <Badge className="bg-sabc-warning">
                                <Clock size={12} className="mr-1" />
                                En attente
                            </Badge>
                        )}
                    </div>
                    
                    <h3 className="font-semibold text-sabc-gray-900 mb-1">
                        Par {evaluation.evaluateur.nom_complet}
                    </h3>
                    <p className="text-sm text-sabc-gray-600">
                        {evaluation.evaluateur.role_nom}
                    </p>
                </div>
                
                {evaluation.statut === 'valide' && evaluation.score_global && (
                    <div className="text-right">
                        <div className="text-3xl font-bold text-sabc-red-primary">
                            {evaluation.score_global.toFixed(1)}
                        </div>
                        <div className="text-xs text-sabc-gray-600">/ 5</div>
                    </div>
                )}
            </div>
            
            <div className="space-y-2 mb-4">
                <div className="flex items-center justify-between text-sm">
                    <span className="text-sabc-gray-600">Période :</span>
                    <span className="font-medium text-sabc-gray-900">
                        {evaluation.periode_nom}
                    </span>
                </div>
                
                {evaluation.statut === 'valide' && evaluation.date_validation && (
                    <div className="flex items-center justify-between text-sm">
                        <span className="text-sabc-gray-600">Validé le :</span>
                        <span className="font-medium text-sabc-gray-900">
                            {evaluation.date_validation}
                        </span>
                    </div>
                )}
                
                {evaluation.statut === 'soumis' && evaluation.date_soumission && (
                    <div className="flex items-center justify-between text-sm">
                        <span className="text-sabc-gray-600">Soumis le :</span>
                        <span className="font-medium text-sabc-gray-900">
                            {evaluation.date_soumission}
                        </span>
                    </div>
                )}
            </div>
            
            {evaluation.statut === 'valide' && (
                <Button
                    onClick={handleConsulter}
                    className="w-full bg-sabc-red-primary hover:bg-sabc-red-dark"
                >
                    <Eye size={16} className="mr-2" />
                    Consulter l'évaluation
                </Button>
            )}
            
            {evaluation.statut === 'soumis' && (
                <div className="text-center text-sm text-sabc-gray-600 py-2">
                    En attente de validation par votre manager
                </div>
            )}
        </div>
    );
}
```

### Composant FiltresEvaluationsRecues

```tsx
// resources/js/Components/Evaluations/FiltresEvaluationsRecues.tsx
import { useState } from 'react';
import { router } from '@inertiajs/react';
import { Button } from '@/Components/UI/Button';
import { Filter, X } from 'lucide-react';

interface FiltresEvaluationsRecuesProps {
    periodes: Array<{ id_periode: string; nom_periode: string }>;
    filters: {
        periode?: string;
        type?: string[];
        statut?: string[];
    };
}

export default function FiltresEvaluationsRecues({
    periodes,
    filters: initialFilters
}: FiltresEvaluationsRecuesProps) {
    const [filters, setFilters] = useState(initialFilters);
    const [isOpen, setIsOpen] = useState(false);
    
    const handleApply = () => {
        router.get('/evaluations/recues', filters, {
            preserveState: true,
            preserveScroll: true,
        });
        setIsOpen(false);
    };
    
    const handleReset = () => {
        const resetFilters = {
            periode: '',
            type: [],
            statut: ['soumis', 'valide'],
        };
        setFilters(resetFilters);
        router.get('/evaluations/recues', resetFilters);
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
                            { value: 'subordinate', label: 'Manager' },
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
- `app/Controllers/EvaluationsRecuesController.php`
- `app/Services/EvaluationsRecuesService.php`
- `resources/js/Pages/Evaluations/Recues/Index.tsx`
- `resources/js/Pages/Evaluations/Recues/Show.tsx`
- `resources/js/Components/Evaluations/CardEvaluationRecue.tsx`
- `resources/js/Components/Evaluations/FiltresEvaluationsRecues.tsx`

**Fichiers à modifier :**
- `routes/web.php` : Ajouter routes évaluations reçues

**Dépendances Stories Précédentes :**
- Story 4.4 : Évaluations validées disponibles
- Story 4.1 : Table evaluations
- Story 3.3 : Périodes évaluation

### Règles Métier SABC Critiques

**Visibilité Évaluations :**
- Visible : Statuts 'soumis' et 'valide'
- Masqué : Statuts 'brouillon' et 'rejete'
- Détails : Uniquement 'valide'

**Anonymisation :**
- Évaluations pairs : Évaluateur anonymisé (optionnel)
- Autres types : Évaluateur visible

**Filtres :**
- Par période : Toutes périodes disponibles
- Par type : Auto, Pairs, Manager, Subordonnés
- Par statut : Soumis, Validé (brouillon/rejeté masqués)

**Affichage Détails :**
- Notes par critère
- Commentaires par critère
- Score global
- Graphique radar compétences (optionnel)

### References

- [Source: epics.md#Epic 4 Story 4.5] - Acceptance criteria complets
- [Source: architecture.md#Data Access] - Permissions consultation
- [Source: business-logic-rules.md#Visibilité Évaluations] - Règles visibilité
- [Source: project-context.md#Critical Implementation Rules] - Anonymisation

## Dev Agent Record

### Agent Model Used

_À remplir par le dev agent_

### Debug Log References

_À remplir par le dev agent_

### Completion Notes List

_À remplir par le dev agent_

### File List

_À remplir par le dev agent_
