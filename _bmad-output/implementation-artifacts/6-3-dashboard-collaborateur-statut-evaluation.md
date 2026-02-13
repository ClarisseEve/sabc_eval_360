# Story 6.3: Dashboard Collaborateur - Statut Évaluation

Status: ready-for-dev

## Story

En tant que collaborateur,
Je veux voir mon statut d'évaluation,
Afin de savoir où j'en suis.

## Acceptance Criteria

**Given** je suis connecté en tant que collaborateur
**When** j'accède à mon dashboard
**Then** je vois mes évaluations à compléter (auto, pairs, subordonnés)
**And** je vois mes évaluations reçues avec statut (validées, en attente)
**And** je vois mon score global de performance (si calculé)
**And** je vois ma progression vs période précédente
**And** je peux accéder directement aux évaluations en brouillon
**And** les données respectent les permissions de visibilité selon mon rôle

## Tasks / Subtasks

- [ ] Service DashboardCollaborateurService (AC: 1, 2, 3, 4, 6)
  - [ ] Créer `app/Services/DashboardCollaborateurService.php`
  - [ ] Méthode `getEvaluationsACompleter()` : Liste évaluations brouillon
  - [ ] Méthode `getEvaluationsRecues()` : Liste évaluations reçues
  - [ ] Méthode `getScoreGlobal()` : Score performance si calculé
  - [ ] Méthode `getProgression()` : Progression vs période précédente
  - [ ] Respect permissions visibilité par rôle

- [ ] DashboardCollaborateurController (AC: 1, 2, 3, 4, 5, 6)
  - [ ] Créer `app/Http/Controllers/DashboardCollaborateurController.php`
  - [ ] Méthode `index()` : Dashboard principal
  - [ ] Filtrage selon permissions rôle
  - [ ] Middleware `auth:api`

- [ ] Page Dashboard Collaborateur (AC: 1, 2, 3, 4, 5)
  - [ ] Page `resources/js/Pages/Dashboard/Index.tsx`
  - [ ] Section "Mes Évaluations à Compléter"
  - [ ] Section "Mes Évaluations Reçues"
  - [ ] KPI Score Global
  - [ ] KPI Progression
  - [ ] Liens directs évaluations brouillon

- [ ] Composant MesEvaluationsACompleter (AC: 1, 5)
  - [ ] Créer `resources/js/Components/Dashboard/MesEvaluationsACompleter.tsx`
  - [ ] Liste évaluations brouillon
  - [ ] Badge type (Auto, Pairs, Subordonnés)
  - [ ] Progression par évaluation
  - [ ] Bouton "Reprendre"

- [ ] Composant MesEvaluationsRecues (AC: 2)
  - [ ] Créer `resources/js/Components/Dashboard/MesEvaluationsRecues.tsx`
  - [ ] Liste évaluations reçues
  - [ ] Badge statut (Validé, En attente)
  - [ ] Score si validé
  - [ ] Bouton "Consulter"

- [ ] Composant KPIScoreGlobal (AC: 3)
  - [ ] Créer `resources/js/Components/Dashboard/KPIScoreGlobal.tsx`
  - [ ] Affichage score global
  - [ ] Graphique radar compétences
  - [ ] Message si pas encore calculé

- [ ] Composant KPIProgression (AC: 4)
  - [ ] Créer `resources/js/Components/Dashboard/KPIProgression.tsx`
  - [ ] Progression vs période précédente
  - [ ] Flèche hausse/baisse
  - [ ] Pourcentage évolution

- [ ] Tests & Validation
  - [ ] Tester affichage évaluations à compléter
  - [ ] Tester affichage évaluations reçues
  - [ ] Tester score global
  - [ ] Tester progression
  - [ ] Tester permissions visibilité

## Dev Notes

### Architecture Dashboard Collaborateur

**Flux Dashboard :**
1. Collaborateur accède dashboard
2. Récupération évaluations à compléter (brouillon)
3. Récupération évaluations reçues (validées, en attente)
4. Calcul score global (si disponible)
5. Calcul progression vs période précédente
6. Affichage sections avec KPIs

**Sections Dashboard :**
- **Évaluations à Compléter** : Brouillon (auto, pairs, subordonnés)
- **Évaluations Reçues** : Validées et en attente
- **Score Global** : Performance si calculé
- **Progression** : Évolution vs période précédente

**Permissions Visibilité :**
- Évaluations brouillon : Visibles par évaluateur
- Évaluations reçues validées : Visibles par évalué
- Évaluations reçues en attente : Masquées
- Score global : Visible si calculé

### DashboardCollaborateurService

```php
namespace App\Services;

use App\Models\Utilisateur;
use App\Models\Evaluation;
use App\Models\PeriodeEvaluation;

class DashboardCollaborateurService
{
    /**
     * Récupérer les évaluations à compléter
     */
    public function getEvaluationsACompleter(Utilisateur $utilisateur): array
    {
        $periode = PeriodeEvaluation::where('est_ouverte', true)->first();
        
        if (!$periode) {
            return [];
        }
        
        $evaluations = Evaluation::with(['evalue', 'periode'])
            ->where('evaluateur_matricule', $utilisateur->matricule)
            ->where('id_periode', $periode->id_periode)
            ->where('statut', 'brouillon')
            ->get();
        
        return $evaluations->map(function($eval) {
            return [
                'id_evaluation' => $eval->id_evaluation,
                'evalue_nom' => $eval->evalue->nom_complet,
                'type_evaluation' => $eval->type_evaluation,
                'progression' => $eval->progression,
                'date_creation' => $eval->created_at->format('d/m/Y'),
            ];
        })->toArray();
    }
    
    /**
     * Récupérer les évaluations reçues
     */
    public function getEvaluationsRecues(Utilisateur $utilisateur): array
    {
        $periode = PeriodeEvaluation::where('est_ouverte', true)->first();
        
        if (!$periode) {
            return [];
        }
        
        // Uniquement évaluations validées (visibilité)
        $evaluations = Evaluation::with(['evaluateur', 'periode'])
            ->where('evalue_matricule', $utilisateur->matricule)
            ->where('id_periode', $periode->id_periode)
            ->whereIn('statut', ['valide', 'soumis'])
            ->get();
        
        return $evaluations->map(function($eval) {
            return [
                'id_evaluation' => $eval->id_evaluation,
                'evaluateur_nom' => $eval->evaluateur->nom_complet,
                'type_evaluation' => $eval->type_evaluation,
                'statut' => $eval->statut,
                'score_global' => $eval->statut === 'valide' ? $eval->score_global : null,
                'date_validation' => $eval->date_validation?->format('d/m/Y'),
            ];
        })->toArray();
    }
    
    /**
     * Récupérer le score global
     */
    public function getScoreGlobal(Utilisateur $utilisateur): ?array
    {
        // Cette logique sera complétée dans Story 7.x (Calcul scores)
        // Pour l'instant, retourner null si pas calculé
        
        $periode = PeriodeEvaluation::where('est_ouverte', true)->first();
        
        if (!$periode) {
            return null;
        }
        
        // Récupérer évaluations validées
        $evaluations = Evaluation::where('evalue_matricule', $utilisateur->matricule)
            ->where('id_periode', $periode->id_periode)
            ->where('statut', 'valide')
            ->get();
        
        if ($evaluations->isEmpty()) {
            return null;
        }
        
        // Calculer moyenne scores
        $scores = $evaluations->pluck('score_global')->filter();
        
        if ($scores->isEmpty()) {
            return null;
        }
        
        $scoreGlobal = $scores->avg();
        
        return [
            'score' => round($scoreGlobal, 1),
            'nb_evaluations' => $evaluations->count(),
        ];
    }
    
    /**
     * Récupérer la progression vs période précédente
     */
    public function getProgression(Utilisateur $utilisateur): ?array
    {
        $periodeActuelle = PeriodeEvaluation::where('est_ouverte', true)->first();
        
        if (!$periodeActuelle) {
            return null;
        }
        
        // Récupérer période précédente
        $periodePrecedente = PeriodeEvaluation::where('date_fin', '<', $periodeActuelle->date_debut)
            ->orderBy('date_fin', 'desc')
            ->first();
        
        if (!$periodePrecedente) {
            return null;
        }
        
        // Calculer scores
        $scoreActuel = $this->calculerScorePeriode($utilisateur, $periodeActuelle);
        $scorePrecedent = $this->calculerScorePeriode($utilisateur, $periodePrecedente);
        
        if (!$scoreActuel || !$scorePrecedent) {
            return null;
        }
        
        $evolution = $scoreActuel - $scorePrecedent;
        $pourcentage = $scorePrecedent > 0 
            ? round(($evolution / $scorePrecedent) * 100, 1) 
            : 0;
        
        return [
            'score_actuel' => $scoreActuel,
            'score_precedent' => $scorePrecedent,
            'evolution' => $evolution,
            'pourcentage' => $pourcentage,
            'tendance' => $evolution > 0 ? 'hausse' : ($evolution < 0 ? 'baisse' : 'stable'),
        ];
    }
    
    /**
     * Calculer le score pour une période
     */
    protected function calculerScorePeriode(Utilisateur $utilisateur, PeriodeEvaluation $periode): ?float
    {
        $evaluations = Evaluation::where('evalue_matricule', $utilisateur->matricule)
            ->where('id_periode', $periode->id_periode)
            ->where('statut', 'valide')
            ->get();
        
        if ($evaluations->isEmpty()) {
            return null;
        }
        
        $scores = $evaluations->pluck('score_global')->filter();
        
        return $scores->isEmpty() ? null : round($scores->avg(), 1);
    }
}
```

### DashboardCollaborateurController

```php
namespace App\Http\Controllers;

use App\Services\DashboardCollaborateurService;
use Inertia\Inertia;
use Inertia\Response as InertiaResponse;

class DashboardCollaborateurController extends Controller
{
    protected $dashboardService;
    
    public function __construct(DashboardCollaborateurService $dashboardService)
    {
        $this->middleware('auth:api');
        $this->dashboardService = $dashboardService;
    }
    
    public function index(): InertiaResponse
    {
        $utilisateur = auth()->user();
        
        // Récupérer données dashboard
        $evaluationsACompleter = $this->dashboardService->getEvaluationsACompleter($utilisateur);
        $evaluationsRecues = $this->dashboardService->getEvaluationsRecues($utilisateur);
        $scoreGlobal = $this->dashboardService->getScoreGlobal($utilisateur);
        $progression = $this->dashboardService->getProgression($utilisateur);
        
        return Inertia::render('Dashboard/Index', [
            'evaluations_a_completer' => $evaluationsACompleter,
            'evaluations_recues' => $evaluationsRecues,
            'score_global' => $scoreGlobal,
            'progression' => $progression,
        ]);
    }
}
```

### Composant MesEvaluationsACompleter

```tsx
// resources/js/Components/Dashboard/MesEvaluationsACompleter.tsx
import { Badge } from '@/Components/UI/Badge';
import { Button } from '@/Components/UI/Button';
import { Edit, AlertCircle } from 'lucide-react';
import { router } from '@inertiajs/react';

interface Evaluation {
    id_evaluation: string;
    evalue_nom: string;
    type_evaluation: string;
    progression: number;
    date_creation: string;
}

interface Props {
    evaluations: Evaluation[];
}

const TYPE_LABELS = {
    auto: 'Auto-évaluation',
    peer: 'Pairs',
    subordinate: 'Subordonnés',
};

const TYPE_COLORS = {
    auto: 'bg-sabc-accent',
    peer: 'bg-blue-500',
    subordinate: 'bg-sabc-red-primary',
};

export default function MesEvaluationsACompleter({ evaluations }: Props) {
    const handleReprendre = (id: string) => {
        router.visit(`/evaluations/${id}/edit`);
    };
    
    return (
        <div className="bg-white border border-sabc-gray-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-sabc-gray-900 mb-4 font-poppins">
                Mes Évaluations à Compléter
            </h3>
            
            {evaluations.length === 0 ? (
                <div className="text-center py-8 text-sabc-gray-600">
                    <AlertCircle size={48} className="mx-auto mb-4 text-sabc-gray-400" />
                    <p>Aucune évaluation à compléter</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {evaluations.map((evaluation) => (
                        <div
                            key={evaluation.id_evaluation}
                            className="border border-sabc-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                        >
                            <div className="flex items-start justify-between mb-3">
                                <div className="flex-1">
                                    <div className="flex items-center space-x-2 mb-2">
                                        <Badge className={TYPE_COLORS[evaluation.type_evaluation as keyof typeof TYPE_COLORS]}>
                                            {TYPE_LABELS[evaluation.type_evaluation as keyof typeof TYPE_LABELS]}
                                        </Badge>
                                    </div>
                                    <h4 className="font-semibold text-sabc-gray-900">
                                        {evaluation.evalue_nom}
                                    </h4>
                                    <p className="text-sm text-sabc-gray-600">
                                        Créée le {evaluation.date_creation}
                                    </p>
                                </div>
                                
                                <div className="text-right">
                                    <div className="text-2xl font-bold text-sabc-accent">
                                        {evaluation.progression}%
                                    </div>
                                    <div className="text-xs text-sabc-gray-600">complété</div>
                                </div>
                            </div>
                            
                            <div className="mb-3">
                                <div className="h-2 bg-sabc-gray-200 rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-sabc-accent transition-all duration-300"
                                        style={{ width: `${evaluation.progression}%` }}
                                    />
                                </div>
                            </div>
                            
                            <Button
                                onClick={() => handleReprendre(evaluation.id_evaluation)}
                                className="w-full bg-sabc-accent hover:bg-orange-600"
                            >
                                <Edit size={16} className="mr-2" />
                                Reprendre l'évaluation
                            </Button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
```

### Composant KPIScoreGlobal

```tsx
// resources/js/Components/Dashboard/KPIScoreGlobal.tsx
import { TrendingUp, AlertCircle } from 'lucide-react';

interface Props {
    scoreGlobal: {
        score: number;
        nb_evaluations: number;
    } | null;
}

export default function KPIScoreGlobal({ scoreGlobal }: Props) {
    return (
        <div className="bg-white border border-sabc-gray-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-sabc-gray-900 mb-4 font-poppins">
                Mon Score Global
            </h3>
            
            {!scoreGlobal ? (
                <div className="text-center py-8">
                    <AlertCircle size={48} className="mx-auto mb-4 text-sabc-gray-400" />
                    <p className="text-sabc-gray-600">
                        Score non encore calculé
                    </p>
                    <p className="text-sm text-sabc-gray-500 mt-2">
                        Complétez vos évaluations pour voir votre score
                    </p>
                </div>
            ) : (
                <div className="text-center">
                    <div className="mb-4">
                        <div className="text-6xl font-bold text-sabc-red-primary">
                            {scoreGlobal.score}
                        </div>
                        <div className="text-sm text-sabc-gray-600">/ 5</div>
                    </div>
                    
                    <div className="flex items-center justify-center space-x-2 text-sm text-sabc-gray-600">
                        <TrendingUp size={16} />
                        <span>
                            Basé sur {scoreGlobal.nb_evaluations} évaluation(s)
                        </span>
                    </div>
                </div>
            )}
        </div>
    );
}
```

### Project Structure Notes

**Fichiers à créer :**
- `app/Services/DashboardCollaborateurService.php`
- `app/Http/Controllers/DashboardCollaborateurController.php`
- `resources/js/Pages/Dashboard/Index.tsx`
- `resources/js/Components/Dashboard/MesEvaluationsACompleter.tsx`
- `resources/js/Components/Dashboard/MesEvaluationsRecues.tsx`
- `resources/js/Components/Dashboard/KPIScoreGlobal.tsx`
- `resources/js/Components/Dashboard/KPIProgression.tsx`

**Fichiers à modifier :**
- `routes/web.php` : Ajouter route /dashboard

**Dépendances Stories Précédentes :**
- Story 4.1 : Table evaluations
- Story 4.5 : Consultation évaluations reçues
- Story 4.6 : Consultation évaluations données

### Règles Métier SABC Critiques

**Évaluations à Compléter :**
- Statut : 'brouillon' uniquement
- Évaluateur : Utilisateur connecté
- Période : Ouverte uniquement
- Affichage : Type, progression, date création

**Évaluations Reçues :**
- Statut : 'valide' et 'soumis'
- Évalué : Utilisateur connecté
- Visibilité : Score uniquement si validé
- Masquage : Évaluations brouillon/rejetées

**Score Global :**
- Calcul : Moyenne évaluations validées
- Affichage : Si au moins 1 évaluation validée
- Message : "Non encore calculé" si aucune

**Progression :**
- Calcul : Score actuel - score période précédente
- Affichage : Évolution en points et %
- Tendance : Hausse, baisse, stable

### References

- [Source: epics.md#Epic 6 Story 6.3] - Acceptance criteria complets
- [Source: architecture.md#Dashboards] - Structure dashboards
- [Source: business-logic-rules.md#Visibilité] - Règles visibilité
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
