# Story 7.1: KPIs Globaux par Région/Branche/Rôle

Status: ready-for-dev

## Story

En tant qu'administrateur,
Je veux consulter des KPIs globaux segmentés,
Afin d'analyser la performance organisationnelle.

## Acceptance Criteria

**Given** je suis connecté en tant qu'admin
**When** j'accède au dashboard Analytics
**Then** je vois les KPIs : score moyen global, taux de complétion, taux de validation
**And** je peux segmenter par région (Littoral, Centre, Nord, Ouest)
**And** je peux segmenter par branche (Commerciale, Marketing)
**And** je peux segmenter par rôle (DR, CDTT, CSC, etc.)
**And** les données proviennent du Service Go Analytics via `/api/v2/analytics`
**And** les données sont mises en cache Redis avec TTL horaire
**And** un timestamp "last updated" est affiché

## Tasks / Subtasks

- [ ] Service Go Analytics (AC: 5, 6)
  - [ ] Créer microservice Go `/api/v2/analytics`
  - [ ] Endpoint `GET /api/v2/analytics/kpis-globaux`
  - [ ] Connexion ClickHouse pour agrégations
  - [ ] Calcul KPIs : score moyen, taux complétion, taux validation
  - [ ] Segmentation : région, branche, rôle
  - [ ] Cache Redis avec TTL 1 heure

- [ ] Service AnalyticsService Laravel (AC: 1, 2, 3, 4, 5, 6)
  - [ ] Créer `app/Services/AnalyticsService.php`
  - [ ] Méthode `getKPIsGlobaux()` : Appel API Go
  - [ ] Méthode `getKPIsParRegion()` : Segmentation région
  - [ ] Méthode `getKPIsParBranche()` : Segmentation branche
  - [ ] Méthode `getKPIsParRole()` : Segmentation rôle
  - [ ] Gestion cache Laravel + Redis

- [ ] AnalyticsController (AC: 1, 2, 3, 4, 7)
  - [ ] Créer `app/Http/Controllers/Admin/AnalyticsController.php`
  - [ ] Méthode `index()` : Dashboard analytics
  - [ ] Méthode `getKPIs()` : API KPIs avec filtres
  - [ ] Middleware `role:ADMIN`

- [ ] Page Dashboard Analytics (AC: 1, 2, 3, 4, 7)
  - [ ] Page `resources/js/Pages/Admin/Analytics/Index.tsx`
  - [ ] KPIs globaux : Score moyen, Taux complétion, Taux validation
  - [ ] Filtres : Région, Branche, Rôle
  - [ ] Graphiques : Bar charts par segmentation
  - [ ] Timestamp "last updated"

- [ ] Composant KPIsGlobaux (AC: 1, 7)
  - [ ] Créer `resources/js/Components/Admin/KPIsGlobaux.tsx`
  - [ ] Cards KPIs avec icônes
  - [ ] Valeurs avec tendances
  - [ ] Timestamp dernière mise à jour

- [ ] Composant GraphiquesSegmentation (AC: 2, 3, 4)
  - [ ] Créer `resources/js/Components/Admin/GraphiquesSegmentation.tsx`
  - [ ] Bar chart par région
  - [ ] Bar chart par branche
  - [ ] Bar chart par rôle
  - [ ] Recharts

- [ ] Configuration Redis Cache (AC: 6)
  - [ ] Configuration Laravel Redis
  - [ ] TTL 1 heure (3600 secondes)
  - [ ] Clés cache : `analytics:kpis:global`, `analytics:kpis:region:{id}`

- [ ] Tests & Validation
  - [ ] Tester appel API Go Analytics
  - [ ] Tester cache Redis
  - [ ] Tester segmentations
  - [ ] Tester affichage KPIs
  - [ ] Tester timestamp

## Dev Notes

### Architecture Analytics

**Flux Analytics :**
1. Admin accède dashboard Analytics
2. Laravel appelle Service Go `/api/v2/analytics/kpis-globaux`
3. Service Go interroge ClickHouse (agrégations)
4. Résultats mis en cache Redis (TTL 1h)
5. Laravel retourne données à React
6. Affichage KPIs + graphiques segmentés

**KPIs Calculés :**
- **Score Moyen Global** : Moyenne tous scores validés
- **Taux Complétion** : (Évaluations validées / Total attendu) * 100
- **Taux Validation** : (Évaluations validées / Évaluations soumises) * 100

**Segmentations :**
- **Par Région** : Littoral, Centre, Nord, Ouest, Sud, Est
- **Par Branche** : Commerciale, Marketing
- **Par Rôle** : DR, CDTT, CSC, CDV, CDS, RTM, TMO, SRMO, SS, AS

**Cache Redis :**
- Clé : `analytics:kpis:global`
- TTL : 3600 secondes (1 heure)
- Invalidation : Automatique après TTL

### Service Go Analytics (Microservice)

```go
// cmd/analytics/main.go
package main

import (
    "github.com/gin-gonic/gin"
    "github.com/go-redis/redis/v8"
    "github.com/ClickHouse/clickhouse-go/v2"
)

func main() {
    r := gin.Default()
    
    // Connexion ClickHouse
    clickhouse := connectClickHouse()
    
    // Connexion Redis
    redisClient := redis.NewClient(&redis.Options{
        Addr: "localhost:6379",
    })
    
    // Routes
    v2 := r.Group("/api/v2/analytics")
    {
        v2.GET("/kpis-globaux", getKPIsGlobaux(clickhouse, redisClient))
    }
    
    r.Run(":8001")
}

func getKPIsGlobaux(ch clickhouse.Conn, redis *redis.Client) gin.HandlerFunc {
    return func(c *gin.Context) {
        // Paramètres filtres
        region := c.Query("region")
        branche := c.Query("branche")
        role := c.Query("role")
        
        // Clé cache
        cacheKey := fmt.Sprintf("analytics:kpis:global:%s:%s:%s", region, branche, role)
        
        // Vérifier cache
        cached, err := redis.Get(c, cacheKey).Result()
        if err == nil {
            var kpis KPIs
            json.Unmarshal([]byte(cached), &kpis)
            c.JSON(200, kpis)
            return
        }
        
        // Calculer KPIs depuis ClickHouse
        kpis := calculateKPIs(ch, region, branche, role)
        
        // Mettre en cache (1 heure)
        kpisJSON, _ := json.Marshal(kpis)
        redis.Set(c, cacheKey, kpisJSON, time.Hour)
        
        c.JSON(200, kpis)
    }
}

func calculateKPIs(ch clickhouse.Conn, region, branche, role string) KPIs {
    query := `
        SELECT
            AVG(score_global) as score_moyen,
            COUNT(*) as total_evaluations,
            SUM(CASE WHEN statut = 'valide' THEN 1 ELSE 0 END) as evaluations_validees,
            SUM(CASE WHEN statut = 'soumis' THEN 1 ELSE 0 END) as evaluations_soumises
        FROM evaluations
        WHERE 1=1
    `
    
    // Ajouter filtres
    if region != "" {
        query += fmt.Sprintf(" AND region_nom = '%s'", region)
    }
    if branche != "" {
        query += fmt.Sprintf(" AND branche_nom = '%s'", branche)
    }
    if role != "" {
        query += fmt.Sprintf(" AND role_nom = '%s'", role)
    }
    
    var scoreMoyen float64
    var totalEvaluations, evaluationsValidees, evaluationsSoumises int
    
    row := ch.QueryRow(context.Background(), query)
    row.Scan(&scoreMoyen, &totalEvaluations, &evaluationsValidees, &evaluationsSoumises)
    
    tauxCompletion := 0.0
    if totalEvaluations > 0 {
        tauxCompletion = (float64(evaluationsValidees) / float64(totalEvaluations)) * 100
    }
    
    tauxValidation := 0.0
    if evaluationsSoumises > 0 {
        tauxValidation = (float64(evaluationsValidees) / float64(evaluationsSoumises)) * 100
    }
    
    return KPIs{
        ScoreMoyen:     scoreMoyen,
        TauxCompletion: tauxCompletion,
        TauxValidation: tauxValidation,
        LastUpdated:    time.Now(),
    }
}

type KPIs struct {
    ScoreMoyen     float64   `json:"score_moyen"`
    TauxCompletion float64   `json:"taux_completion"`
    TauxValidation float64   `json:"taux_validation"`
    LastUpdated    time.Time `json:"last_updated"`
}
```

### AnalyticsService Laravel

```php
namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Cache;

class AnalyticsService
{
    protected $analyticsApiUrl;
    
    public function __construct()
    {
        $this->analyticsApiUrl = config('services.analytics.url', 'http://localhost:8001');
    }
    
    /**
     * Récupérer les KPIs globaux
     */
    public function getKPIsGlobaux(array $filters = []): array
    {
        $cacheKey = $this->getCacheKey('global', $filters);
        
        return Cache::remember($cacheKey, 3600, function() use ($filters) {
            $response = Http::get("{$this->analyticsApiUrl}/api/v2/analytics/kpis-globaux", $filters);
            
            if ($response->successful()) {
                return $response->json();
            }
            
            throw new \Exception('Erreur lors de la récupération des KPIs');
        });
    }
    
    /**
     * Récupérer les KPIs par région
     */
    public function getKPIsParRegion(): array
    {
        $regions = ['Littoral', 'Centre', 'Nord', 'Ouest', 'Sud', 'Est'];
        $kpis = [];
        
        foreach ($regions as $region) {
            $kpis[$region] = $this->getKPIsGlobaux(['region' => $region]);
        }
        
        return $kpis;
    }
    
    /**
     * Récupérer les KPIs par branche
     */
    public function getKPIsParBranche(): array
    {
        $branches = ['Commerciale', 'Marketing'];
        $kpis = [];
        
        foreach ($branches as $branche) {
            $kpis[$branche] = $this->getKPIsGlobaux(['branche' => $branche]);
        }
        
        return $kpis;
    }
    
    /**
     * Récupérer les KPIs par rôle
     */
    public function getKPIsParRole(): array
    {
        $roles = ['DR', 'CDTT', 'CSC', 'CDV', 'CDS', 'RTM', 'TMO', 'SRMO', 'SS', 'AS'];
        $kpis = [];
        
        foreach ($roles as $role) {
            $kpis[$role] = $this->getKPIsGlobaux(['role' => $role]);
        }
        
        return $kpis;
    }
    
    /**
     * Générer la clé de cache
     */
    protected function getCacheKey(string $type, array $filters): string
    {
        $filterString = http_build_query($filters);
        return "analytics:kpis:{$type}:" . md5($filterString);
    }
}
```

### AnalyticsController

```php
namespace App\Http\Controllers\Admin;

use App\Services\AnalyticsService;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response as InertiaResponse;

class AnalyticsController extends Controller
{
    protected $analyticsService;
    
    public function __construct(AnalyticsService $analyticsService)
    {
        $this->middleware(['auth:api', 'role:ADMIN']);
        $this->analyticsService = $analyticsService;
    }
    
    public function index(): InertiaResponse
    {
        // KPIs globaux
        $kpisGlobaux = $this->analyticsService->getKPIsGlobaux();
        
        // KPIs par segmentation
        $kpisParRegion = $this->analyticsService->getKPIsParRegion();
        $kpisParBranche = $this->analyticsService->getKPIsParBranche();
        $kpisParRole = $this->analyticsService->getKPIsParRole();
        
        return Inertia::render('Admin/Analytics/Index', [
            'kpis_globaux' => $kpisGlobaux,
            'kpis_par_region' => $kpisParRegion,
            'kpis_par_branche' => $kpisParBranche,
            'kpis_par_role' => $kpisParRole,
        ]);
    }
    
    public function getKPIs(Request $request)
    {
        $filters = $request->only(['region', 'branche', 'role']);
        
        $kpis = $this->analyticsService->getKPIsGlobaux($filters);
        
        return response()->json($kpis);
    }
}
```

### Composant KPIsGlobaux

```tsx
// resources/js/Components/Admin/KPIsGlobaux.tsx
import { TrendingUp, CheckCircle, Award } from 'lucide-react';

interface KPIs {
    score_moyen: number;
    taux_completion: number;
    taux_validation: number;
    last_updated: string;
}

interface Props {
    kpis: KPIs;
}

export default function KPIsGlobaux({ kpis }: Props) {
    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleString('fr-FR');
    };
    
    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-sabc-gray-900 font-poppins">
                    KPIs Globaux
                </h2>
                <span className="text-sm text-sabc-gray-600">
                    Dernière mise à jour : {formatDate(kpis.last_updated)}
                </span>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Score Moyen Global */}
                <div className="bg-white border border-sabc-gray-200 rounded-lg p-6">
                    <div className="flex items-center space-x-3 mb-4">
                        <div className="w-12 h-12 rounded-full bg-sabc-red-light flex items-center justify-center">
                            <Award size={24} className="text-sabc-red-primary" />
                        </div>
                        <div>
                            <div className="text-sm text-sabc-gray-600">Score Moyen Global</div>
                            <div className="text-3xl font-bold text-sabc-red-primary">
                                {kpis.score_moyen.toFixed(1)}
                            </div>
                        </div>
                    </div>
                    <div className="text-xs text-sabc-gray-600">/ 5</div>
                </div>
                
                {/* Taux de Complétion */}
                <div className="bg-white border border-sabc-gray-200 rounded-lg p-6">
                    <div className="flex items-center space-x-3 mb-4">
                        <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
                            <CheckCircle size={24} className="text-sabc-success" />
                        </div>
                        <div>
                            <div className="text-sm text-sabc-gray-600">Taux de Complétion</div>
                            <div className="text-3xl font-bold text-sabc-success">
                                {kpis.taux_completion.toFixed(1)}%
                            </div>
                        </div>
                    </div>
                    <div className="text-xs text-sabc-gray-600">Évaluations complétées</div>
                </div>
                
                {/* Taux de Validation */}
                <div className="bg-white border border-sabc-gray-200 rounded-lg p-6">
                    <div className="flex items-center space-x-3 mb-4">
                        <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
                            <TrendingUp size={24} className="text-blue-600" />
                        </div>
                        <div>
                            <div className="text-sm text-sabc-gray-600">Taux de Validation</div>
                            <div className="text-3xl font-bold text-blue-600">
                                {kpis.taux_validation.toFixed(1)}%
                            </div>
                        </div>
                    </div>
                    <div className="text-xs text-sabc-gray-600">Évaluations validées</div>
                </div>
            </div>
        </div>
    );
}
```

### Project Structure Notes

**Fichiers à créer :**
- `cmd/analytics/main.go` (Microservice Go)
- `app/Services/AnalyticsService.php`
- `app/Http/Controllers/Admin/AnalyticsController.php`
- `resources/js/Pages/Admin/Analytics/Index.tsx`
- `resources/js/Components/Admin/KPIsGlobaux.tsx`
- `resources/js/Components/Admin/GraphiquesSegmentation.tsx`

**Fichiers à modifier :**
- `config/services.php` : Ajouter URL service Go Analytics
- `routes/web.php` : Ajouter routes analytics admin
- `routes/api.php` : Ajouter route API KPIs

**Dépendances Stories Précédentes :**
- Story 4.4 : Évaluations validées
- Architecture : ClickHouse pour analytics

### Règles Métier SABC Critiques

**KPIs Calculés :**
- Score Moyen : Moyenne tous scores validés
- Taux Complétion : (Validées / Total attendu) * 100
- Taux Validation : (Validées / Soumises) * 100

**Segmentations :**
- Région : 6 régions SABC
- Branche : Commerciale, Marketing
- Rôle : 10 rôles hiérarchiques

**Cache Redis :**
- TTL : 1 heure (3600 secondes)
- Clés : `analytics:kpis:global:{filters}`
- Invalidation : Automatique après TTL

**Service Go :**
- Port : 8001
- Base données : ClickHouse
- Cache : Redis
- Format : JSON

### References

- [Source: epics.md#Epic 7 Story 7.1] - Acceptance criteria complets
- [Source: architecture.md#Analytics] - Architecture analytics
- [Source: business-logic-rules.md#KPIs] - Calculs KPIs
- [Source: project-context.md#Critical Implementation Rules] - ClickHouse, Redis

## Dev Agent Record

### Agent Model Used

_À remplir par le dev agent_

### Debug Log References

_À remplir par le dev agent_

### Completion Notes List

_À remplir par le dev agent_

### File List

_À remplir par le dev agent_
