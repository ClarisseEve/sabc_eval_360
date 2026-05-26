# Story 1.7: Composants Dashboard Réutilisables & Dashboards par Rôle

Status: ready-for-dev

## Story

En tant qu'utilisateur SABC,
Je veux accéder à un dashboard adapté à mon rôle,
Afin de visualiser les informations pertinentes pour mes responsabilités.

## Acceptance Criteria

**Given** je suis connecté avec un rôle spécifique (DR, CDTT, CSC, CDV, CDS, RTM, TMO, SRMO, SS, AS)
**When** j'accède à mon dashboard
**Then** je vois un dashboard composé de composants réutilisables adaptés à mon rôle
**And** les composants réutilisables disponibles sont : KPI Cards, Charts (radar, line, bar), Tables, Filtres (période, région, branche), Notifications panel, Quick actions
**And** le dashboard DR affiche : KPIs globaux région, progression équipes, évaluations en attente validation
**And** le dashboard CDTT affiche : KPIs département trade, supervision branches Commerciale et Marketing
**And** les dashboards CSC/CDV/CDS affichent : KPIs équipe, évaluations à compléter, progression subordonnés
**And** les dashboards RTM/TMO/SRMO affichent : KPIs marketing, campagnes en cours, performance sponsoring
**And** tous les dashboards respectent le design system SABC (couleurs #E53E3E, #FF9800, Poppins/Inter)
**And** les dashboards sont responsive mobile-first (320px-768px priorité)
**And** le filtrage par région/branche est appliqué automatiquement selon les permissions de l'utilisateur

## Tasks / Subtasks

- [ ] Création Composants UI Réutilisables (AC: 2, 9)
  - [ ] Créer `resources/js/Components/Dashboard/KPICard.tsx`
  - [ ] Créer `resources/js/Components/Dashboard/RadarChart.tsx`
  - [ ] Créer `resources/js/Components/Dashboard/LineChart.tsx`
  - [ ] Créer `resources/js/Components/Dashboard/BarChart.tsx`
  - [ ] Créer `resources/js/Components/Dashboard/DataTable.tsx`
  - [ ] Créer `resources/js/Components/Dashboard/PeriodFilter.tsx`
  - [ ] Créer `resources/js/Components/Dashboard/NotificationsPanel.tsx`
  - [ ] Créer `resources/js/Components/Dashboard/QuickActions.tsx`
  - [ ] Design SABC : couleurs #E53E3E, #FF9800, Poppins/Inter
  - [ ] Responsive mobile-first (320px-768px)

- [ ] DashboardController avec Méthodes par Rôle (AC: 1, 3-8, 11)
  - [ ] Créer `app/Http/Controllers/DashboardController.php`
  - [ ] Méthode `dr()` : Dashboard Directeur Régional
  - [ ] Méthode `cdtt()` : Dashboard Chef Département Trade
  - [ ] Méthode `csc()` : Dashboard Chef Service Commercial
  - [ ] Méthode `cdv()` : Dashboard Chef District Vente
  - [ ] Méthode `cds()` : Dashboard Chef de Secteur
  - [ ] Méthode `rtm()` : Dashboard Regional Trade Marketing
  - [ ] Méthode `tmo()` : Dashboard Trade Marketing Operator
  - [ ] Méthode `srmo()` : Dashboard Superviseur Régional Marketing
  - [ ] Méthode `ss()` : Dashboard Superviseur Sponsoring
  - [ ] Méthode `as()` : Dashboard Assistant Superviseur Sponsoring
  - [ ] Filtrage automatique région/branche selon utilisateur
  - [ ] Middleware `auth:api`

- [ ] Pages Dashboard Inertia par Rôle (AC: 1, 3-8, 9, 10)
  - [ ] Créer `resources/js/Pages/Dashboard/DR/Index.tsx`
  - [ ] Créer `resources/js/Pages/Dashboard/CDTT/Index.tsx`
  - [ ] Créer `resources/js/Pages/Dashboard/CSC/Index.tsx`
  - [ ] Créer `resources/js/Pages/Dashboard/CDV/Index.tsx`
  - [ ] Créer `resources/js/Pages/Dashboard/CDS/Index.tsx`
  - [ ] Créer `resources/js/Pages/Dashboard/RTM/Index.tsx`
  - [ ] Créer `resources/js/Pages/Dashboard/TMO/Index.tsx`
  - [ ] Créer `resources/js/Pages/Dashboard/SRMO/Index.tsx`
  - [ ] Créer `resources/js/Pages/Dashboard/SS/Index.tsx`
  - [ ] Créer `resources/js/Pages/Dashboard/AS/Index.tsx`
  - [ ] Composition avec composants réutilisables
  - [ ] Layout responsive mobile-first

- [ ] Service DashboardDataService (AC: 3-8, 11)
  - [ ] Créer `app/Services/DashboardDataService.php`
  - [ ] Méthode `getKPIsForRole()` : KPIs selon rôle
  - [ ] Méthode `getTeamProgress()` : Progression équipe
  - [ ] Méthode `getPendingEvaluations()` : Évaluations en attente
  - [ ] Méthode `getSubordinatesPerformance()` : Performance subordonnés
  - [ ] Filtrage automatique région/branche
  - [ ] Cache Redis pour performance

- [ ] Routes Dashboard (AC: 1)
  - [ ] Route `/dashboard/dr` → DashboardController@dr
  - [ ] Route `/dashboard/cdtt` → DashboardController@cdtt
  - [ ] Route `/dashboard/csc` → DashboardController@csc
  - [ ] Route `/dashboard/cdv` → DashboardController@cdv
  - [ ] Route `/dashboard/cds` → DashboardController@cds
  - [ ] Route `/dashboard/rtm` → DashboardController@rtm
  - [ ] Route `/dashboard/tmo` → DashboardController@tmo
  - [ ] Route `/dashboard/srmo` → DashboardController@srmo
  - [ ] Route `/dashboard/ss` → DashboardController@ss
  - [ ] Route `/dashboard/as` → DashboardController@as
  - [ ] Middleware `auth:api` sur toutes les routes

- [ ] Tests & Validation
  - [ ] Tester affichage dashboard pour chaque rôle
  - [ ] Tester composants réutilisables (KPI, Charts, Tables)
  - [ ] Tester filtrage automatique région/branche
  - [ ] Tester responsive mobile (320px-768px)
  - [ ] Tester design system SABC

## Dev Notes

### Architecture Dashboards par Rôle

**10 Dashboards Spécifiques :**
- **DR** : Vue stratégique région, KPIs globaux, progression équipes
- **CDTT** : Supervision département trade, branches Commerciale + Marketing
- **CSC/CDV/CDS** : Gestion équipe commerciale, évaluations, subordonnés
- **RTM/TMO/SRMO** : Marketing opérationnel, campagnes, sponsoring
- **SS/AS** : Sponsoring, événements, performance

**Composants Réutilisables :**
- KPICard : Affichage métrique avec tendance
- Charts : Radar, Line, Bar (Recharts)
- DataTable : Tableau avec tri/filtres
- PeriodFilter : Sélection période (mois, trimestre, année)
- NotificationsPanel : Alertes et notifications
- QuickActions : Actions rapides selon rôle

### Composants Dashboard Réutilisables

**KPICard Component :**
```tsx
// resources/js/Components/Dashboard/KPICard.tsx
import { ArrowUp, ArrowDown } from 'lucide-react';
import { Card } from '@/Components/UI/Card';

interface KPICardProps {
    title: string;
    value: string | number;
    trend?: number; // Pourcentage de variation
    icon?: React.ReactNode;
    color?: 'primary' | 'success' | 'warning' | 'danger';
}

export default function KPICard({ title, value, trend, icon, color = 'primary' }: KPICardProps) {
    const colorClasses = {
        primary: 'bg-sabc-red-light text-sabc-red-primary',
        success: 'bg-green-100 text-green-600',
        warning: 'bg-orange-100 text-orange-600',
        danger: 'bg-red-100 text-red-600',
    };
    
    return (
        <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-medium text-sabc-gray-600">{title}</h3>
                {icon && (
                    <div className={`p-2 rounded-lg ${colorClasses[color]}`}>
                        {icon}
                    </div>
                )}
            </div>
            
            <div className="flex items-end justify-between">
                <div className="text-3xl font-bold text-sabc-gray-900 font-poppins">
                    {value}
                </div>
                
                {trend !== undefined && (
                    <div className={`flex items-center text-sm font-medium ${
                        trend >= 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                        {trend >= 0 ? <ArrowUp size={16} /> : <ArrowDown size={16} />}
                        <span className="ml-1">{Math.abs(trend)}%</span>
                    </div>
                )}
            </div>
        </Card>
    );
}
```

**BarChart Component :**
```tsx
// resources/js/Components/Dashboard/BarChart.tsx
import { BarChart as RechartsBarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Card } from '@/Components/UI/Card';

interface BarChartProps {
    title: string;
    data: Array<{ name: string; value: number }>;
    color?: string;
}

export default function BarChart({ title, data, color = '#E53E3E' }: BarChartProps) {
    return (
        <Card className="p-6">
            <h3 className="text-lg font-semibold text-sabc-gray-900 mb-4 font-poppins">
                {title}
            </h3>
            
            <ResponsiveContainer width="100%" height={300}>
                <RechartsBarChart data={data}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E0E0E0" />
                    <XAxis dataKey="name" stroke="#9E9E9E" />
                    <YAxis stroke="#9E9E9E" />
                    <Tooltip />
                    <Bar dataKey="value" fill={color} radius={[8, 8, 0, 0]} />
                </RechartsBarChart>
            </ResponsiveContainer>
        </Card>
    );
}
```

**DataTable Component :**
```tsx
// resources/js/Components/Dashboard/DataTable.tsx
import { Card } from '@/Components/UI/Card';
import { Badge } from '@/Components/UI/Badge';

interface Column {
    key: string;
    label: string;
    render?: (value: any, row: any) => React.ReactNode;
}

interface DataTableProps {
    title: string;
    columns: Column[];
    data: any[];
}

export default function DataTable({ title, columns, data }: DataTableProps) {
    return (
        <Card className="p-6">
            <h3 className="text-lg font-semibold text-sabc-gray-900 mb-4 font-poppins">
                {title}
            </h3>
            
            <div className="overflow-x-auto">
                <table className="w-full">
                    <thead>
                        <tr className="border-b border-sabc-gray-200">
                            {columns.map((col) => (
                                <th key={col.key} className="text-left p-3 text-sm font-medium text-sabc-gray-600">
                                    {col.label}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {data.map((row, idx) => (
                            <tr key={idx} className="border-b border-sabc-gray-100">
                                {columns.map((col) => (
                                    <td key={col.key} className="p-3 text-sm text-sabc-gray-800">
                                        {col.render ? col.render(row[col.key], row) : row[col.key]}
                                    </td>
                                ))}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </Card>
    );
}
```

### DashboardController

```php
namespace App\Http\Controllers;

use App\Services\DashboardDataService;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response as InertiaResponse;

class DashboardController extends Controller
{
    protected $dashboardService;
    
    public function __construct(DashboardDataService $dashboardService)
    {
        $this->middleware('auth:api');
        $this->dashboardService = $dashboardService;
    }
    
    public function dr(Request $request): InertiaResponse
    {
        $user = $request->user();
        
        $data = [
            'kpis' => $this->dashboardService->getKPIsForRole($user, 'DR'),
            'teamProgress' => $this->dashboardService->getTeamProgress($user),
            'pendingValidations' => $this->dashboardService->getPendingEvaluations($user, 'validation'),
            'regionStats' => $this->dashboardService->getRegionStats($user->id_region),
        ];
        
        return Inertia::render('Dashboard/DR/Index', $data);
    }
    
    public function cdtt(Request $request): InertiaResponse
    {
        $user = $request->user();
        
        $data = [
            'kpis' => $this->dashboardService->getKPIsForRole($user, 'CDTT'),
            'commercialStats' => $this->dashboardService->getBrancheStats($user, 1), // Commerciale
            'marketingStats' => $this->dashboardService->getBrancheStats($user, 2), // Marketing
            'teamProgress' => $this->dashboardService->getTeamProgress($user),
        ];
        
        return Inertia::render('Dashboard/CDTT/Index', $data);
    }
    
    public function csc(Request $request): InertiaResponse
    {
        $user = $request->user();
        
        $data = [
            'kpis' => $this->dashboardService->getKPIsForRole($user, 'CSC'),
            'teamProgress' => $this->dashboardService->getTeamProgress($user),
            'pendingEvaluations' => $this->dashboardService->getPendingEvaluations($user, 'to_complete'),
            'subordinatesPerformance' => $this->dashboardService->getSubordinatesPerformance($user),
        ];
        
        return Inertia::render('Dashboard/CSC/Index', $data);
    }
    
    // Méthodes similaires pour CDV, CDS, RTM, TMO, SRMO, SS, AS
    // ...
}
```

### DashboardDataService

```php
namespace App\Services;

use App\Models\Utilisateur;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Cache;

class DashboardDataService
{
    public function getKPIsForRole(Utilisateur $user, string $role): array
    {
        $cacheKey = "dashboard_kpis_{$user->matricule}_{$role}";
        
        return Cache::remember($cacheKey, 300, function() use ($user, $role) {
            // KPIs selon rôle
            $kpis = [
                'evaluations_completed' => $this->getCompletedEvaluationsCount($user),
                'team_size' => $this->getTeamSize($user),
                'average_score' => $this->getAverageScore($user),
                'pending_actions' => $this->getPendingActionsCount($user),
            ];
            
            // KPIs spécifiques par rôle
            if (in_array($role, ['DR', 'CDTT'])) {
                $kpis['region_performance'] = $this->getRegionPerformance($user);
                $kpis['branches_comparison'] = $this->getBranchesComparison($user);
            }
            
            return $kpis;
        });
    }
    
    public function getTeamProgress(Utilisateur $user): array
    {
        // Progression équipe (subordonnés directs)
        $subordinates = Utilisateur::where('manager_matricule', $user->matricule)
            ->actif()
            ->get();
        
        return $subordinates->map(function($subordinate) {
            return [
                'name' => $subordinate->nom_complet,
                'role' => $subordinate->role->nom_role,
                'evaluations_completed' => $this->getCompletedEvaluationsCount($subordinate),
                'progress' => $this->calculateProgress($subordinate),
            ];
        })->toArray();
    }
    
    public function getPendingEvaluations(Utilisateur $user, string $type = 'to_complete'): array
    {
        // Évaluations en attente selon type
        // 'to_complete' : À compléter par l'utilisateur
        // 'validation' : En attente de validation (managers)
        
        // Implémentation dépend de Story 4.x (Workflow Évaluation)
        return [];
    }
    
    public function getSubordinatesPerformance(Utilisateur $user): array
    {
        // Performance des subordonnés
        $subordinates = Utilisateur::where('manager_matricule', $user->matricule)
            ->actif()
            ->with('role')
            ->get();
        
        return $subordinates->map(function($subordinate) {
            return [
                'name' => $subordinate->nom_complet,
                'role' => $subordinate->role->nom_role,
                'score' => $this->getAverageScore($subordinate),
                'trend' => $this->getScoreTrend($subordinate),
            ];
        })->toArray();
    }
    
    private function getCompletedEvaluationsCount(Utilisateur $user): int
    {
        // Implémentation dépend de Story 4.x
        return 0;
    }
    
    private function getTeamSize(Utilisateur $user): int
    {
        return Utilisateur::where('manager_matricule', $user->matricule)
            ->actif()
            ->count();
    }
    
    private function getAverageScore(Utilisateur $user): float
    {
        // Implémentation dépend de Story 4.x
        return 0.0;
    }
    
    private function getPendingActionsCount(Utilisateur $user): int
    {
        // Implémentation dépend de Story 4.x et 5.x
        return 0;
    }
}
```

### Dashboard DR Example

```tsx
// resources/js/Pages/Dashboard/DR/Index.tsx
import { Users, TrendingUp, CheckCircle, AlertCircle } from 'lucide-react';
import KPICard from '@/Components/Dashboard/KPICard';
import BarChart from '@/Components/Dashboard/BarChart';
import DataTable from '@/Components/Dashboard/DataTable';

interface Props {
    kpis: {
        evaluations_completed: number;
        team_size: number;
        average_score: number;
        pending_actions: number;
        region_performance: number;
    };
    teamProgress: Array<{
        name: string;
        role: string;
        evaluations_completed: number;
        progress: number;
    }>;
    pendingValidations: any[];
    regionStats: any;
}

export default function DRDashboard({ kpis, teamProgress, pendingValidations, regionStats }: Props) {
    return (
        <div className="p-6">
            <h1 className="text-2xl font-bold text-sabc-gray-900 mb-6 font-poppins">
                Tableau de Bord Directeur Régional
            </h1>

            {/* KPIs */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
                <KPICard
                    title="Évaluations Complétées"
                    value={kpis.evaluations_completed}
                    trend={12}
                    icon={<CheckCircle size={24} />}
                    color="success"
                />
                <KPICard
                    title="Taille de l'Équipe"
                    value={kpis.team_size}
                    icon={<Users size={24} />}
                    color="primary"
                />
                <KPICard
                    title="Score Moyen Région"
                    value={`${kpis.average_score}/5`}
                    trend={5}
                    icon={<TrendingUp size={24} />}
                    color="success"
                />
                <KPICard
                    title="Actions en Attente"
                    value={kpis.pending_actions}
                    icon={<AlertCircle size={24} />}
                    color="warning"
                />
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                <BarChart
                    title="Performance par Service"
                    data={regionStats?.services || []}
                    color="#E53E3E"
                />
                
                <DataTable
                    title="Progression de l'Équipe"
                    columns={[
                        { key: 'name', label: 'Nom' },
                        { key: 'role', label: 'Rôle' },
                        { 
                            key: 'progress', 
                            label: 'Progression',
                            render: (value) => (
                                <div className="flex items-center">
                                    <div className="w-full bg-sabc-gray-200 rounded-full h-2 mr-2">
                                        <div 
                                            className="bg-sabc-red-primary h-2 rounded-full" 
                                            style={{ width: `${value}%` }}
                                        />
                                    </div>
                                    <span className="text-sm">{value}%</span>
                                </div>
                            )
                        },
                    ]}
                    data={teamProgress}
                />
            </div>
        </div>
    );
}
```

### Routes Dashboard

```php
// routes/web.php
Route::middleware(['auth:api'])->group(function () {
    Route::prefix('dashboard')->group(function () {
        Route::get('/dr', [DashboardController::class, 'dr'])->name('dashboard.dr');
        Route::get('/cdtt', [DashboardController::class, 'cdtt'])->name('dashboard.cdtt');
        Route::get('/csc', [DashboardController::class, 'csc'])->name('dashboard.csc');
        Route::get('/cdv', [DashboardController::class, 'cdv'])->name('dashboard.cdv');
        Route::get('/cds', [DashboardController::class, 'cds'])->name('dashboard.cds');
        Route::get('/rtm', [DashboardController::class, 'rtm'])->name('dashboard.rtm');
        Route::get('/tmo', [DashboardController::class, 'tmo'])->name('dashboard.tmo');
        Route::get('/srmo', [DashboardController::class, 'srmo'])->name('dashboard.srmo');
        Route::get('/ss', [DashboardController::class, 'ss'])->name('dashboard.ss');
        Route::get('/as', [DashboardController::class, 'as'])->name('dashboard.as');
    });
});
```

### Project Structure Notes

**Fichiers à créer :**
- `app/Http/Controllers/DashboardController.php`
- `app/Services/DashboardDataService.php`
- `resources/js/Components/Dashboard/KPICard.tsx`
- `resources/js/Components/Dashboard/BarChart.tsx`
- `resources/js/Components/Dashboard/LineChart.tsx`
- `resources/js/Components/Dashboard/RadarChart.tsx`
- `resources/js/Components/Dashboard/DataTable.tsx`
- `resources/js/Components/Dashboard/PeriodFilter.tsx`
- `resources/js/Components/Dashboard/NotificationsPanel.tsx`
- `resources/js/Components/Dashboard/QuickActions.tsx`
- `resources/js/Pages/Dashboard/DR/Index.tsx`
- `resources/js/Pages/Dashboard/CDTT/Index.tsx`
- `resources/js/Pages/Dashboard/CSC/Index.tsx`
- `resources/js/Pages/Dashboard/CDV/Index.tsx`
- `resources/js/Pages/Dashboard/CDS/Index.tsx`
- `resources/js/Pages/Dashboard/RTM/Index.tsx`
- `resources/js/Pages/Dashboard/TMO/Index.tsx`
- `resources/js/Pages/Dashboard/SRMO/Index.tsx`
- `resources/js/Pages/Dashboard/SS/Index.tsx`
- `resources/js/Pages/Dashboard/AS/Index.tsx`

**Fichiers à modifier :**
- `routes/web.php` : Ajouter routes dashboard
- `package.json` : Ajouter recharts si nécessaire

**Dépendances NPM :**
```bash
pnpm add recharts lucide-react
```

**Dépendances Stories Précédentes :**
- Story 1.1-1.6 : Toute la fondation (auth, RBAC, structure, utilisateurs)
- Composants UI de base (Card, Badge, Button, Input)

### Règles Métier SABC Critiques

**Filtrage Automatique :**
- Données filtrées par `id_region` de l'utilisateur
- DR/CDTT : Accès cross-branch si `peut_cross_branch = true`
- Autres rôles : Données limitées à leur `id_branche`

**Design System SABC :**
- Couleurs primaires : #E53E3E (rouge SABC), #FF9800 (orange accent)
- Typographie : Poppins (titres), Inter (contenu)
- Responsive : Mobile-first 320px-768px priorité

**Performance :**
- Cache Redis pour KPIs (TTL 5 minutes)
- Lazy loading des charts
- Pagination tables (50 items)

### References

- [Source: epics.md#Epic 1 Story 1.7] - Acceptance criteria complets
- [Source: ux-design-specification.md#Dashboards] - Design dashboards par rôle
- [Source: graphic-rules.md] - Design system SABC complet
- [Source: architecture.md#Frontend Architecture] - Component library structure
- [Source: project-context.md#Critical Implementation Rules] - TypeScript strict, Inertia pages

## Dev Agent Record

### Agent Model Used

_À remplir par le dev agent_

### Debug Log References

_À remplir par le dev agent_

### Completion Notes List

_À remplir par le dev agent_

### File List

_À remplir par le dev agent_
