<?php

declare(strict_types=1);

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Symfony\Component\HttpFoundation\Response;

/**
 * Middleware to track HTTP metrics for Prometheus.
 */
class TrackMetrics
{
    /**
     * Handle an incoming request.
     */
    public function handle(Request $request, Closure $next): Response
    {
        if ($request->path() === 'metrics') {
            return $next($request);
        }

        $startTime = microtime(true);

        $response = $next($request);

        $duration = microtime(true) - $startTime;

        $this->recordMetrics($request, $response, $duration);

        return $response;
    }

    /**
     * Record metrics in cache for Prometheus to scrape.
     */
    private function recordMetrics(Request $request, Response $response, float $duration): void
    {
        // Skip metrics recording if cache is not available (local dev without Redis/MySQL)
        try {
            $statusCode = $response->getStatusCode();
            $statusClass = $this->getStatusClass($statusCode);
            $method = $request->method();
            $path = $this->normalizePath($request->path());

            // Increment request counter
            $counters = Cache::get('metrics:http_requests', []);
            $key = $statusClass;
            $counters[$key] = ($counters[$key] ?? 0) + 1;
            Cache::put('metrics:http_requests', $counters, now()->addHours(24));

            // Track request duration (simplified histogram)
            $durations = Cache::get('metrics:http_durations', []);
            $bucket = $this->getDurationBucket($duration);
            $durations[$bucket] = ($durations[$bucket] ?? 0) + 1;
            Cache::put('metrics:http_durations', $durations, now()->addHours(24));

            $durationSum = (float) Cache::get('metrics:http_duration_sum', 0);
            Cache::put('metrics:http_duration_sum', $durationSum + $duration, now()->addHours(24));

            $durationCount = (int) Cache::get('metrics:http_duration_count', 0);
            Cache::put('metrics:http_duration_count', $durationCount + 1, now()->addHours(24));

            // Track by route for more granular metrics
            $routeCounters = Cache::get('metrics:http_requests_by_route', []);
            $routeKey = "{$method}:{$path}:{$statusClass}";
            $routeCounters[$routeKey] = ($routeCounters[$routeKey] ?? 0) + 1;
            Cache::put('metrics:http_requests_by_route', $routeCounters, now()->addHours(24));
        } catch (\Throwable $e) {
            // Silently ignore cache errors in local development
        }
    }

    /**
     * Get status class (2xx, 3xx, 4xx, 5xx).
     */
    private function getStatusClass(int $statusCode): string
    {
        return match (true) {
            $statusCode >= 200 && $statusCode < 300 => '2xx',
            $statusCode >= 300 && $statusCode < 400 => '3xx',
            $statusCode >= 400 && $statusCode < 500 => '4xx',
            $statusCode >= 500 => '5xx',
            default => 'other',
        };
    }

    /**
     * Normalize path to prevent high cardinality.
     */
    private function normalizePath(string $path): string
    {
        // Replace UUIDs
        $path = preg_replace('/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i', '{uuid}', $path);

        // Replace numeric IDs
        $path = preg_replace('/\/\d+(?=\/|$)/', '/{id}', $path);

        // Replace matricules (5 chars)
        $path = preg_replace('/\/[A-Z0-9]{5}(?=\/|$)/', '/{matricule}', $path);

        return $path;
    }

    /**
     * Get duration bucket for histogram.
     */
    private function getDurationBucket(float $duration): string
    {
        return match (true) {
            $duration <= 0.01 => '0.01',
            $duration <= 0.025 => '0.025',
            $duration <= 0.05 => '0.05',
            $duration <= 0.1 => '0.1',
            $duration <= 0.25 => '0.25',
            $duration <= 0.5 => '0.5',
            $duration <= 1.0 => '1.0',
            $duration <= 2.5 => '2.5',
            $duration <= 5.0 => '5.0',
            $duration <= 10.0 => '10.0',
            default => '+Inf',
        };
    }
}
