# Story 6.1: Dashboard Manager - Progression Équipe

Status: ready-for-dev

## Story

En tant que manager,
Je veux voir la progression de mon équipe,
Afin de suivre l'avancement des évaluations.

## Acceptance Criteria

**Given** je suis connecté en tant que manager (CSC, CDV, RTM, etc.)
**When** j'accède à mon dashboard
**Then** je vois le KPI "Reste d'évaluations" : nombre total vs complétées
**And** je vois la liste de mes subordonnés directs avec leur statut
**And** pour chaque subordonné : nombre d'évaluations reçues, données, en attente
**And** je peux filtrer par période d'évaluation
**And** je vois un graphique de progression (line chart) sur les 6 derniers mois
**And** les données sont mises à jour en temps réel (TanStack Query)

## Tasks / Subtasks

- [ ] Service DashboardManagerService (AC: 1, 2, 3, 4, 5)
  - [ ] Créer `app/Services/DashboardManagerService.php`
  - [ ] Méthode `getProgressionEquipe()` : Statistiques équipe
  - [ ] Méthode `getSubordonnesAvecStatuts()` : Liste subordonnés + statuts
  - [ ] Méthode `getProgressionHistorique()` : Données 6 derniers mois
  - [ ] Méthode `calculerEvaluationsRestantes()` : Total vs complétées

- [ ] DashboardManagerController (AC: 1, 2, 3, 4, 5)
  - [ ] Créer `app/Http/Controllers/Manager/DashboardManagerController.php`
  - [ ] Méthode `index()` : Dashboard principal
  - [ ] Méthode `getProgression()` : API progression temps réel
  - [ ] Filtrage par période
  - [ ] Middleware `auth:api`

- [ ] Page Dashboard Manager (AC: 1, 2, 3, 4, 5, 6)
  - [ ] Page `resources/js/Pages/Manager/Dashboard/Index.tsx`
  - [ ] KPI "Reste d'évaluations"
  - [ ] Liste subordonnés avec statuts
  - [ ] Graphique progression (Line Chart)
  - [ ] Filtre période
  - [ ] TanStack Query pour temps réel

- [ ] Composant KPIRestantEvaluations (AC: 1)
  - [ ] Créer `resources/js/Components/Manager/KPIRestantEvaluations.tsx`
  - [ ] Affichage : Total vs Complétées
  - [ ] Barre progression
  - [ ] Pourcentage complété
  - [ ] Design SABC

- [ ] Composant ListeSubordonnes (AC: 2, 3)
  - [ ] Créer `resources/js/Components/Manager/ListeSubordonnes.tsx`
  - [ ] Table : Nom, Évaluations reçues, données, en attente
  - [ ] Badge statut par subordonné
  - [ ] Tri et filtrage
  - [ ] Actions : Voir détails

- [ ] Composant GraphiqueProgression (AC: 5)
  - [ ] Créer `resources/js/Components/Manager/GraphiqueProgression.tsx`
  - [ ] Line Chart (Recharts)
  - [ ] Données 6 derniers mois
  - [ ] Légende : Complétées, En cours, En retard
  - [ ] Responsive

- [ ] Configuration TanStack Query (AC: 6)
  - [ ] Setup TanStack Query dans projet
  - [ ] Hook `useProgressionEquipe()`
  - [ ] Polling automatique (30 secondes)
  - [ ] Cache et invalidation

- [ ] Tests & Validation
  - [ ] Tester calcul évaluations restantes
  - [ ] Tester liste subordonnés avec statuts
  - [ ] Tester graphique progression
  - [ ] Tester filtre période
  - [ ] Tester mise à jour temps réel

## Dev Notes

### Architecture Dashboard Manager

**Flux Dashboard :**
1. Manager accède dashboard
2. Récupération données équipe (subordonnés directs)
3. Calcul statistiques : Total, complétées, en attente
4. Récupération historique 6 derniers mois
5. Affichage KPI + liste + graphique
6. Polling TanStack Query (30s) pour temps réel

**Données Affichées :**
- **KPI Reste** : Total évaluations - Complétées
- **Liste Subordonnés** : Nom, évaluations reçues/données/en attente
- **Graphique** : Progression 6 derniers mois (line chart)

**Calcul Évaluations :**
- Total : Évaluations attendues pour la période
- Complétées : Évaluations validées
- En attente : Évaluations brouillon + soumises
- Restantes : Total - Complétées

### DashboardManagerService

```php
namespace App\Services;

use App\Models\Utilisateur;
use App\Models\Evaluation;
use App\Models\PeriodeEvaluation;
use Carbon\Carbon;

class DashboardManagerService
{
    /**
     * Récupérer la progression de l'équipe
     */
    public function getProgressionEquipe(Utilisateur $manager, ?string $idPeriode = null): array
    {
        $subordonnes = $this->getSubordonnesDirects($manager);
        
        $periode = $idPeriode 
            ? PeriodeEvaluation::findOrFail($idPeriode)
            : PeriodeEvaluation::where('est_ouverte', true)->first();
        
        if (!$periode) {
            return [
                'total' => 0,
                'completees' => 0,
                'en_attente' => 0,
                'restantes' => 0,
                'pourcentage' => 0,
            ];
        }
        
        $total = 0;
        $completees = 0;
        $en_attente = 0;
        
        foreach ($subordonnes as $subordonne) {
            $stats = $this->getStatistiquesSubordonne($subordonne, $periode);
            $total += $stats['total'];
            $completees += $stats['completees'];
            $en_attente += $stats['en_attente'];
        }
        
        $restantes = $total - $completees;
        $pourcentage = $total > 0 ? (int)(($completees / $total) * 100) : 0;
        
        return [
            'total' => $total,
            'completees' => $completees,
            'en_attente' => $en_attente,
            'restantes' => $restantes,
            'pourcentage' => $pourcentage,
        ];
    }
    
    /**
     * Récupérer les subordonnés avec leurs statuts
     */
    public function getSubordonnesAvecStatuts(Utilisateur $manager, ?string $idPeriode = null): array
    {
        $subordonnes = $this->getSubordonnesDirects($manager);
        
        $periode = $idPeriode 
            ? PeriodeEvaluation::findOrFail($idPeriode)
            : PeriodeEvaluation::where('est_ouverte', true)->first();
        
        if (!$periode) {
            return [];
        }
        
        return $subordonnes->map(function($subordonne) use ($periode) {
            $stats = $this->getStatistiquesSubordonne($subordonne, $periode);
            
            return [
                'matricule' => $subordonne->matricule,
                'nom_complet' => $subordonne->nom_complet,
                'role_nom' => $subordonne->role->nom_role,
                'evaluations_recues' => $stats['recues'],
                'evaluations_donnees' => $stats['donnees'],
                'evaluations_en_attente' => $stats['en_attente'],
                'pourcentage_completion' => $stats['pourcentage'],
            ];
        })->toArray();
    }
    
    /**
     * Récupérer la progression historique (6 derniers mois)
     */
    public function getProgressionHistorique(Utilisateur $manager): array
    {
        $subordonnes = $this->getSubordonnesDirects($manager);
        $matricules = $subordonnes->pluck('matricule')->toArray();
        
        $mois = [];
        $data = [];
        
        for ($i = 5; $i >= 0; $i--) {
            $date = Carbon::now()->subMonths($i);
            $moisLabel = $date->format('M Y');
            $mois[] = $moisLabel;
            
            // Compter évaluations par statut pour ce mois
            $completees = Evaluation::whereIn('evalue_matricule', $matricules)
                ->where('statut', 'valide')
                ->whereYear('date_validation', $date->year)
                ->whereMonth('date_validation', $date->month)
                ->count();
            
            $en_cours = Evaluation::whereIn('evalue_matricule', $matricules)
                ->whereIn('statut', ['brouillon', 'soumis'])
                ->whereYear('created_at', $date->year)
                ->whereMonth('created_at', $date->month)
                ->count();
            
            $data[] = [
                'mois' => $moisLabel,
                'completees' => $completees,
                'en_cours' => $en_cours,
            ];
        }
        
        return $data;
    }
    
    /**
     * Récupérer les subordonnés directs
     */
    protected function getSubordonnesDirects(Utilisateur $manager): \Illuminate\Support\Collection
    {
        return Utilisateur::where('manager_matricule', $manager->matricule)->get();
    }
    
    /**
     * Récupérer les statistiques d'un subordonné
     */
    protected function getStatistiquesSubordonne(Utilisateur $subordonne, PeriodeEvaluation $periode): array
    {
        // Évaluations reçues
        $recues = Evaluation::where('evalue_matricule', $subordonne->matricule)
            ->where('id_periode', $periode->id_periode)
            ->count();
        
        // Évaluations données
        $donnees = Evaluation::where('evaluateur_matricule', $subordonne->matricule)
            ->where('id_periode', $periode->id_periode)
            ->count();
        
        // Évaluations en attente (brouillon + soumis)
        $en_attente = Evaluation::where('evaluateur_matricule', $subordonne->matricule)
            ->where('id_periode', $periode->id_periode)
            ->whereIn('statut', ['brouillon', 'soumis'])
            ->count();
        
        // Évaluations complétées
        $completees = Evaluation::where('evaluateur_matricule', $subordonne->matricule)
            ->where('id_periode', $periode->id_periode)
            ->where('statut', 'valide')
            ->count();
        
        // Total attendu (estimation)
        $total = $donnees > 0 ? $donnees : 1;
        
        $pourcentage = $total > 0 ? (int)(($completees / $total) * 100) : 0;
        
        return [
            'recues' => $recues,
            'donnees' => $donnees,
            'en_attente' => $en_attente,
            'completees' => $completees,
            'total' => $total,
            'pourcentage' => $pourcentage,
        ];
    }
}
```

### DashboardManagerController

```php
namespace App\Http\Controllers\Manager;

use App\Services\DashboardManagerService;
use App\Models\PeriodeEvaluation;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response as InertiaResponse;

class DashboardManagerController extends Controller
{
    protected $dashboardService;
    
    public function __construct(DashboardManagerService $dashboardService)
    {
        $this->middleware('auth:api');
        $this->dashboardService = $dashboardService;
    }
    
    public function index(Request $request): InertiaResponse
    {
        $manager = auth()->user();
        $idPeriode = $request->input('periode');
        
        // Récupérer progression équipe
        $progression = $this->dashboardService->getProgressionEquipe($manager, $idPeriode);
        
        // Récupérer subordonnés avec statuts
        $subordonnes = $this->dashboardService->getSubordonnesAvecStatuts($manager, $idPeriode);
        
        // Récupérer historique
        $historique = $this->dashboardService->getProgressionHistorique($manager);
        
        // Récupérer périodes pour filtre
        $periodes = PeriodeEvaluation::select('id_periode', 'nom_periode')
            ->orderBy('date_debut', 'desc')
            ->get();
        
        return Inertia::render('Manager/Dashboard/Index', [
            'progression' => $progression,
            'subordonnes' => $subordonnes,
            'historique' => $historique,
            'periodes' => $periodes,
            'periode_selectionnee' => $idPeriode,
        ]);
    }
    
    public function getProgression(Request $request)
    {
        $manager = auth()->user();
        $idPeriode = $request->input('periode');
        
        $progression = $this->dashboardService->getProgressionEquipe($manager, $idPeriode);
        $subordonnes = $this->dashboardService->getSubordonnesAvecStatuts($manager, $idPeriode);
        
        return response()->json([
            'progression' => $progression,
            'subordonnes' => $subordonnes,
        ]);
    }
}
```

### Composant KPIRestantEvaluations

```tsx
// resources/js/Components/Manager/KPIRestantEvaluations.tsx
import { AlertCircle, CheckCircle, Clock } from 'lucide-react';

interface KPIRestantEvaluationsProps {
    progression: {
        total: number;
        completees: number;
        en_attente: number;
        restantes: number;
        pourcentage: number;
    };
}

export default function KPIRestantEvaluations({ progression }: KPIRestantEvaluationsProps) {
    return (
        <div className="bg-white border border-sabc-gray-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-sabc-gray-900 mb-4 font-poppins">
                Progression de l'équipe
            </h3>
            
            <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="text-center">
                    <div className="text-3xl font-bold text-sabc-gray-900">
                        {progression.total}
                    </div>
                    <div className="text-sm text-sabc-gray-600">Total</div>
                </div>
                
                <div className="text-center">
                    <div className="flex items-center justify-center space-x-1">
                        <CheckCircle size={20} className="text-sabc-success" />
                        <span className="text-3xl font-bold text-sabc-success">
                            {progression.completees}
                        </span>
                    </div>
                    <div className="text-sm text-sabc-gray-600">Complétées</div>
                </div>
                
                <div className="text-center">
                    <div className="flex items-center justify-center space-x-1">
                        <AlertCircle size={20} className="text-sabc-warning" />
                        <span className="text-3xl font-bold text-sabc-warning">
                            {progression.restantes}
                        </span>
                    </div>
                    <div className="text-sm text-sabc-gray-600">Restantes</div>
                </div>
            </div>
            
            <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                    <span className="text-sabc-gray-600">Progression</span>
                    <span className="font-semibold text-sabc-red-primary">
                        {progression.pourcentage}%
                    </span>
                </div>
                
                <div className="relative">
                    <div className="h-3 bg-sabc-gray-200 rounded-full overflow-hidden">
                        <div
                            className="h-full bg-sabc-red-primary transition-all duration-300"
                            style={{ width: `${progression.pourcentage}%` }}
                        />
                    </div>
                </div>
            </div>
            
            {progression.en_attente > 0 && (
                <div className="mt-4 flex items-center space-x-2 text-sm text-sabc-warning bg-yellow-50 p-3 rounded-lg">
                    <Clock size={16} />
                    <span>
                        {progression.en_attente} évaluation(s) en attente de traitement
                    </span>
                </div>
            )}
        </div>
    );
}
```

### Hook TanStack Query

```tsx
// resources/js/hooks/useProgressionEquipe.ts
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';

interface ProgressionData {
    progression: {
        total: number;
        completees: number;
        en_attente: number;
        restantes: number;
        pourcentage: number;
    };
    subordonnes: Array<{
        matricule: string;
        nom_complet: string;
        role_nom: string;
        evaluations_recues: number;
        evaluations_donnees: number;
        evaluations_en_attente: number;
        pourcentage_completion: number;
    }>;
}

export function useProgressionEquipe(periode?: string) {
    return useQuery<ProgressionData>({
        queryKey: ['progression-equipe', periode],
        queryFn: async () => {
            const params = periode ? { periode } : {};
            const response = await axios.get('/api/manager/dashboard/progression', { params });
            return response.data;
        },
        refetchInterval: 30000, // Polling toutes les 30 secondes
        staleTime: 25000, // Données considérées fraîches pendant 25s
    });
}
```

### Project Structure Notes

**Fichiers à créer :**
- `app/Services/DashboardManagerService.php`
- `app/Http/Controllers/Manager/DashboardManagerController.php`
- `resources/js/Pages/Manager/Dashboard/Index.tsx`
- `resources/js/Components/Manager/KPIRestantEvaluations.tsx`
- `resources/js/Components/Manager/ListeSubordonnes.tsx`
- `resources/js/Components/Manager/GraphiqueProgression.tsx`
- `resources/js/hooks/useProgressionEquipe.ts`

**Fichiers à modifier :**
- `routes/web.php` : Ajouter routes dashboard manager
- `routes/api.php` : Ajouter route API progression
- `package.json` : Ajouter @tanstack/react-query, recharts

**Dépendances Stories Précédentes :**
- Story 4.1 : Table evaluations
- Story 3.3 : Périodes évaluation

### Règles Métier SABC Critiques

**Calcul Évaluations :**
- Total : Évaluations attendues (estimation)
- Complétées : Statut 'valide'
- En attente : Statuts 'brouillon' + 'soumis'
- Restantes : Total - Complétées

**Subordonnés Directs :**
- Filtre : manager_matricule = manager connecté
- Affichage : Nom, rôle, statistiques évaluations

**Historique :**
- Période : 6 derniers mois
- Données : Complétées, En cours par mois
- Graphique : Line chart (Recharts)

**Temps Réel :**
- TanStack Query polling : 30 secondes
- Cache : 25 secondes (staleTime)
- Invalidation automatique

### References

- [Source: epics.md#Epic 6 Story 6.1] - Acceptance criteria complets
- [Source: architecture.md#Dashboards] - Structure dashboards
- [Source: business-logic-rules.md#Statistiques] - Calculs statistiques
- [Source: project-context.md#Critical Implementation Rules] - TanStack Query, Recharts

## Dev Agent Record

### Agent Model Used

_À remplir par le dev agent_

### Debug Log References

_À remplir par le dev agent_

### Completion Notes List

_À remplir par le dev agent_

### File List

_À remplir par le dev agent_
