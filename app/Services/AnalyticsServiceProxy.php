<?php

declare(strict_types=1);

namespace App\Services;

use Illuminate\Http\Client\RequestException;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use OpenTracing\Formats;
use OpenTracing\GlobalTracer;

/**
 * Proxy for the Analytics microservice (Strangler Pattern).
 *
 * Implements the business logic from business-logic-rules.md:
 * - Score formula: 20% auto + 40% pairs + 40% manager
 * - Anomaly detection thresholds
 * - Cache TTLs from perf-rules.md
 *
 * @see .windsurf/rules/business-logic-rules.md
 * @see .windsurf/rules/perf-rules.md
 */
class AnalyticsServiceProxy
{
    private string $serviceUrl;
    private string $serviceKey;
    private bool $microserviceEnabled;
    private int $timeout;

    // Cache TTLs (from perf-rules.md)
    private const CACHE_TTL_KPI = 600;           // 10 minutes for KPIs
    private const CACHE_TTL_TRENDS = 1800;       // 30 minutes for trends
    private const CACHE_TTL_ANOMALIES = 300;     // 5 minutes for anomalies
    private const CACHE_TTL_RECOMMENDATIONS = 3600; // 1 hour for recommendations

    public function __construct()
    {
        $this->serviceUrl = config('services.analytics.url', env('ANALYTICS_SERVICE_URL', 'http://analytics-service:8080'));
        $this->serviceKey = config('services.analytics.key', env('ANALYTICS_SERVICE_KEY', 'internal-service-key'));
        $this->microserviceEnabled = (bool) config('services.analytics.enabled', env('ANALYTICS_MICROSERVICE_ENABLED', false));
        $this->timeout = (int) config('services.analytics.timeout', env('ANALYTICS_SERVICE_TIMEOUT', 60));
    }

    /**
     * Fetch the full analytics dataset from the microservice.
     */
    public function getDataset(array $filters = []): ?array
    {
        if (!$this->microserviceEnabled) {
            return $this->getDatasetFallback($filters);
        }

        try {
            $response = $this->get('/api/v2/analytics', $filters);
            $payload = $response->json();

            return $payload['data'] ?? null;
        } catch (RequestException $e) {
            Log::warning('Analytics microservice failed, using fallback', [
                'error' => $e->getMessage(),
                'operation' => 'getDataset',
            ]);

            return $this->getDatasetFallback($filters);
        }
    }

    /**
     * Fetch KPI metrics (Score moyen, Total évaluations, Collaborateurs évalués).
     */
    public function getKpis(array $filters = []): array
    {
        $cacheKey = 'analytics:kpis:' . md5(json_encode($filters));

        return Cache::remember($cacheKey, self::CACHE_TTL_KPI, function () use ($filters) {
            if ($this->microserviceEnabled) {
                try {
                    $response = $this->get('/api/v2/analytics/kpis', $filters);
                    $payload = $response->json();
                    return $payload['data'] ?? $this->getKpisFallback($filters);
                } catch (RequestException $e) {
                    Log::warning('Analytics KPIs failed, using fallback', ['error' => $e->getMessage()]);
                }
            }

            return $this->getKpisFallback($filters);
        });
    }

    /**
     * Fetch channel distribution (auto 20%, pairs 40%, manager 40%).
     */
    public function getChannelMix(array $filters = []): array
    {
        $cacheKey = 'analytics:channel_mix:' . md5(json_encode($filters));

        return Cache::remember($cacheKey, self::CACHE_TTL_TRENDS, function () use ($filters) {
            if ($this->microserviceEnabled) {
                try {
                    $response = $this->get('/api/v2/analytics/channels', $filters);
                    $payload = $response->json();
                    return $payload['data'] ?? $this->getChannelMixFallback($filters);
                } catch (RequestException $e) {
                    Log::warning('Analytics channels failed, using fallback', ['error' => $e->getMessage()]);
                }
            }

            return $this->getChannelMixFallback($filters);
        });
    }

    /**
     * Fetch performance trends over time.
     */
    public function getTrends(array $filters = []): array
    {
        $cacheKey = 'analytics:trends:' . md5(json_encode($filters));

        return Cache::remember($cacheKey, self::CACHE_TTL_TRENDS, function () use ($filters) {
            if ($this->microserviceEnabled) {
                try {
                    $response = $this->get('/api/v2/analytics/trends', $filters);
                    $payload = $response->json();
                    return $payload['data'] ?? $this->getTrendsFallback($filters);
                } catch (RequestException $e) {
                    Log::warning('Analytics trends failed, using fallback', ['error' => $e->getMessage()]);
                }
            }

            return $this->getTrendsFallback($filters);
        });
    }

    /**
     * Fetch detected anomalies based on business rules.
     *
     * Thresholds from business-logic-rules.md:
     * - divergence_auto_autres: > 1.5 points
     * - baisse_performance: > -1 point over 3 months
     * - uniformite_evaluations: variance < 0.5
     */
    public function getAnomalies(array $filters = []): array
    {
        $cacheKey = 'analytics:anomalies:' . md5(json_encode($filters));

        return Cache::remember($cacheKey, self::CACHE_TTL_ANOMALIES, function () use ($filters) {
            if ($this->microserviceEnabled) {
                try {
                    $response = $this->get('/api/v2/analytics/anomalies', $filters);
                    $payload = $response->json();
                    return $payload['data'] ?? $this->getAnomaliesFallback($filters);
                } catch (RequestException $e) {
                    Log::warning('Analytics anomalies failed, using fallback', ['error' => $e->getMessage()]);
                }
            }

            return $this->getAnomaliesFallback($filters);
        });
    }

    /**
     * Fetch recommendations for a user.
     */
    public function getRecommendations(string $matricule): array
    {
        $cacheKey = "analytics:recommendations:{$matricule}";

        return Cache::remember($cacheKey, self::CACHE_TTL_RECOMMENDATIONS, function () use ($matricule) {
            if ($this->microserviceEnabled) {
                try {
                    $response = $this->get("/api/v2/analytics/recommendations/{$matricule}");
                    $payload = $response->json();
                    return $payload['data'] ?? $this->getRecommendationsFallback($matricule);
                } catch (RequestException $e) {
                    Log::warning('Analytics recommendations failed, using fallback', ['error' => $e->getMessage()]);
                }
            }

            return $this->getRecommendationsFallback($matricule);
        });
    }

    /**
     * Fetch user score with breakdown.
     */
    public function getUserScore(string $matricule, ?string $periode = null): ?array
    {
        $cacheKey = "analytics:user_score:{$matricule}:" . ($periode ?? 'current');

        return Cache::remember($cacheKey, self::CACHE_TTL_KPI, function () use ($matricule, $periode) {
            if ($this->microserviceEnabled) {
                try {
                    $response = $this->get("/api/v2/analytics/scores/{$matricule}", array_filter(['periode' => $periode]));
                    $payload = $response->json();
                    return $payload['data'] ?? $this->getUserScoreFallback($matricule, $periode);
                } catch (RequestException $e) {
                    Log::warning('Analytics user score failed, using fallback', ['error' => $e->getMessage()]);
                }
            }

            return $this->getUserScoreFallback($matricule, $periode);
        });
    }

    /**
     * Fetch regional performance comparison.
     */
    public function getRegionalPerformance(array $filters = []): array
    {
        $cacheKey = 'analytics:regional:' . md5(json_encode($filters));

        return Cache::remember($cacheKey, self::CACHE_TTL_TRENDS, function () use ($filters) {
            if ($this->microserviceEnabled) {
                try {
                    $response = $this->get('/api/v2/analytics/regional', $filters);
                    $payload = $response->json();
                    return $payload['data'] ?? $this->getRegionalPerformanceFallback($filters);
                } catch (RequestException $e) {
                    Log::warning('Analytics regional failed, using fallback', ['error' => $e->getMessage()]);
                }
            }

            return $this->getRegionalPerformanceFallback($filters);
        });
    }

    /**
     * Check service health.
     */
    public function healthCheck(): bool
    {
        if (!$this->microserviceEnabled) {
            return false;
        }

        try {
            $response = Http::timeout(5)->get("{$this->serviceUrl}/health");
            return $response->successful();
        } catch (\Exception $e) {
            return false;
        }
    }

    /**
     * Check if microservice is enabled.
     */
    public function isEnabled(): bool
    {
        return $this->microserviceEnabled;
    }

    /**
     * Clear analytics cache.
     */
    public function clearCache(?string $pattern = null): void
    {
        if ($pattern) {
            Cache::forget($pattern);
        } else {
            // Clear all analytics cache keys
            $prefixes = ['kpis', 'channel_mix', 'trends', 'anomalies', 'recommendations', 'user_score', 'regional'];
            foreach ($prefixes as $prefix) {
                Cache::forget("analytics:{$prefix}:*");
            }
        }
    }

    // =========================================================================
    // Private HTTP Methods
    // =========================================================================

    private function get(string $path, array $query = [])
    {
        return Http::timeout($this->timeout)
            ->acceptJson()
            ->withHeaders($this->getHeaders())
            ->get($this->serviceUrl . $path, $query)
            ->throw();
    }

    private function post(string $path, array $data = [])
    {
        return Http::timeout($this->timeout)
            ->acceptJson()
            ->withHeaders($this->getHeaders())
            ->post($this->serviceUrl . $path, $data)
            ->throw();
    }

    private function getHeaders(): array
    {
        $headers = [
            'X-Service-Key' => $this->serviceKey,
        ];

        if (app()->bound('tracing.span')) {
            $span = app('tracing.span');
            $carrier = [];
            GlobalTracer::get()->inject($span->getContext(), Formats::HTTP_HEADERS, $carrier);
            $headers = array_merge($headers, $carrier);
        }

        return $headers;
    }

    // =========================================================================
    // Fallback Methods (Query MySQL/PostgreSQL directly)
    // =========================================================================

    /**
     * Fallback: Build complete dataset from primary databases.
     */
    private function getDatasetFallback(array $filters): array
    {
        return [
            'kpis' => $this->getKpisFallback($filters),
            'channel_distribution' => $this->getChannelMixFallback($filters),
            'performance_trend' => $this->getTrendsFallback($filters),
            'anomalies' => $this->getAnomaliesFallback($filters),
        ];
    }

    /**
     * Fallback: Calculate KPIs from PostgreSQL.
     */
    private function getKpisFallback(array $filters): array
    {
        $startDate = $filters['start_date'] ?? now()->subMonths(6)->format('Y-m-d');
        $endDate = $filters['end_date'] ?? now()->format('Y-m-d');

        $stats = DB::connection('pgsql')->table('evaluations')
            ->whereBetween('date_evaluation', [$startDate, $endDate])
            ->selectRaw('
                COUNT(*) as total_evaluations,
                COUNT(DISTINCT evalue_matricule) as unique_users,
                AVG(note_moyenne) as average_score
            ')
            ->first();

        return [
            [
                'id' => 'avg_score',
                'label' => 'Score moyen',
                'value' => round((float) ($stats->average_score ?? 0), 2),
                'unit' => '/5',
                'description' => 'Score moyen calculé sur la période',
            ],
            [
                'id' => 'total_evaluations',
                'label' => 'Évaluations',
                'value' => (int) ($stats->total_evaluations ?? 0),
            ],
            [
                'id' => 'unique_users',
                'label' => 'Collaborateurs évalués',
                'value' => (int) ($stats->unique_users ?? 0),
            ],
        ];
    }

    /**
     * Fallback: Calculate channel distribution from PostgreSQL.
     * Business rule: 20% auto + 40% pairs + 40% manager
     */
    private function getChannelMixFallback(array $filters): array
    {
        $startDate = $filters['start_date'] ?? now()->subMonths(6)->format('Y-m-d');
        $endDate = $filters['end_date'] ?? now()->format('Y-m-d');

        $channels = DB::connection('pgsql')->table('evaluations')
            ->whereBetween('date_evaluation', [$startDate, $endDate])
            ->selectRaw('
                id_type_evaluation as channel,
                COUNT(*) as total,
                AVG(note_moyenne) as average_score
            ')
            ->groupBy('id_type_evaluation')
            ->get();

        $totalEvaluations = $channels->sum('total');

        return $channels->map(function ($channel) use ($totalEvaluations) {
            $percentage = $totalEvaluations > 0
                ? round(($channel->total / $totalEvaluations) * 100, 1)
                : 0;

            return [
                'channel' => $this->normalizeChannel($channel->channel),
                'label' => $this->channelLabel($channel->channel),
                'value' => $percentage,
                'count' => (int) $channel->total,
                'average_score' => round((float) $channel->average_score, 2),
            ];
        })->values()->toArray();
    }

    /**
     * Fallback: Get performance trends from PostgreSQL.
     */
    private function getTrendsFallback(array $filters): array
    {
        $startDate = $filters['start_date'] ?? now()->subMonths(6)->format('Y-m-d');
        $endDate = $filters['end_date'] ?? now()->format('Y-m-d');

        $trends = DB::connection('pgsql')->table('evaluations')
            ->whereBetween('date_evaluation', [$startDate, $endDate])
            ->selectRaw("
                TO_CHAR(date_evaluation, 'YYYY-MM') as period,
                AVG(note_moyenne) as average_score,
                COUNT(*) as total_evaluations
            ")
            ->groupByRaw("TO_CHAR(date_evaluation, 'YYYY-MM')")
            ->orderBy('period')
            ->get();

        $maxTotal = $trends->max('total_evaluations') ?: 1;

        return $trends->map(function ($trend) use ($maxTotal) {
            $participation = round(($trend->total_evaluations / $maxTotal) * 100, 1);

            return [
                'period' => $trend->period,
                'score' => round((float) $trend->average_score, 2),
                'participation' => $participation,
                'count' => (int) $trend->total_evaluations,
            ];
        })->values()->toArray();
    }

    /**
     * Fallback: Detect anomalies from PostgreSQL.
     * Uses thresholds from business-logic-rules.md
     */
    private function getAnomaliesFallback(array $filters): array
    {
        // Return empty for fallback - anomaly detection requires ClickHouse
        // for complex queries and pattern detection
        return [];
    }

    /**
     * Fallback: Get recommendations from PostgreSQL.
     */
    private function getRecommendationsFallback(string $matricule): array
    {
        // Return empty for fallback - recommendations are generated by analytics engine
        return [];
    }

    /**
     * Fallback: Get user score from PostgreSQL.
     * Uses formula: 20% auto + 40% pairs + 40% manager
     */
    private function getUserScoreFallback(string $matricule, ?string $periode): ?array
    {
        $query = DB::connection('pgsql')->table('evaluations')
            ->where('evalue_matricule', $matricule);

        if ($periode) {
            $query->where('code_periode', $periode);
        }

        $scores = $query->selectRaw('
                id_type_evaluation as channel,
                AVG(note_moyenne) as average_score,
                COUNT(*) as count
            ')
            ->groupBy('id_type_evaluation')
            ->get()
            ->keyBy('channel');

        $autoScore = (float) ($scores->get('auto')?->average_score ?? 0);
        $pairsScore = (float) ($scores->get('pairs')?->average_score ?? 0);
        $managerScore = (float) ($scores->get('descendante')?->average_score ?? $scores->get('manager')?->average_score ?? 0);

        // Formula from business-logic-rules.md: 20% auto + 40% pairs + 40% manager
        $globalScore = ($autoScore * 0.20) + ($pairsScore * 0.40) + ($managerScore * 0.40);

        return [
            'matricule' => $matricule,
            'periode' => $periode,
            'score_global' => round($globalScore, 2),
            'score_auto' => round($autoScore, 2),
            'score_pairs' => round($pairsScore, 2),
            'score_manager' => round($managerScore, 2),
            'nb_evaluations' => $scores->sum('count'),
        ];
    }

    /**
     * Fallback: Get regional performance from MySQL/PostgreSQL.
     */
    private function getRegionalPerformanceFallback(array $filters): array
    {
        // Query regions from MySQL (CORE)
        $regions = DB::connection('mysql')->table('regions')
            ->select('id', 'nom', 'est_taniere')
            ->get();

        // Query performance from PostgreSQL (BUSINESS)
        $startDate = $filters['start_date'] ?? now()->subMonths(6)->format('Y-m-d');
        $endDate = $filters['end_date'] ?? now()->format('Y-m-d');

        // Join would require cross-database query, so we do it in PHP
        $evaluations = DB::connection('pgsql')->table('evaluations')
            ->whereBetween('date_evaluation', [$startDate, $endDate])
            ->selectRaw('
                id_region,
                AVG(note_moyenne) as average_score,
                COUNT(*) as total_evaluations
            ')
            ->groupBy('id_region')
            ->get()
            ->keyBy('id_region');

        return $regions->map(function ($region) use ($evaluations) {
            $eval = $evaluations->get($region->id);

            return [
                'region_id' => $region->id,
                'region_nom' => $region->nom,
                'est_taniere' => (bool) $region->est_taniere,
                'score_moyen' => round((float) ($eval?->average_score ?? 0), 2),
                'nombre_evaluations' => (int) ($eval?->total_evaluations ?? 0),
            ];
        })->values()->toArray();
    }

    // =========================================================================
    // Helper Methods
    // =========================================================================

    private function normalizeChannel(string $raw): string
    {
        $value = strtolower(trim($raw));

        return match ($value) {
            'auto' => 'auto',
            'pairs', 'pair' => 'pairs',
            'descendante', 'manager', 'descendant', 'desc' => 'descendante',
            default => $value,
        };
    }

    private function channelLabel(string $channel): string
    {
        return match ($this->normalizeChannel($channel)) {
            'auto' => 'Auto-évaluations',
            'pairs' => 'Pairs',
            'descendante' => 'Descendantes',
            default => ucfirst($channel),
        };
    }
}
