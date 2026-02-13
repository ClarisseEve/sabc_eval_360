<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use Illuminate\Http\Response;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Queue;
use Illuminate\Support\Facades\Schema;

/**
 * Prometheus Metrics Controller.
 *
 * Exposes application metrics in Prometheus format.
 * Endpoint: GET /metrics
 */
class MetricsController extends Controller
{
    /**
     * Return metrics in Prometheus format.
     */
    public function __invoke(): Response
    {
        $metrics = $this->collectMetrics();

        return response($metrics, 200, [
            'Content-Type' => 'text/plain; charset=utf-8',
        ]);
    }

    /**
     * Collect all application metrics.
     */
    private function collectMetrics(): string
    {
        $lines = [];

        // Application info
        $lines[] = '# HELP laravel_app_info Application information';
        $lines[] = '# TYPE laravel_app_info gauge';
        $lines[] = sprintf(
            'laravel_app_info{app="%s",environment="%s",php_version="%s"} 1',
            config('app.name'),
            config('app.env'),
            PHP_VERSION
        );

        // Database connections
        $lines = array_merge($lines, $this->getDatabaseMetrics());

        // Queue metrics
        $lines = array_merge($lines, $this->getQueueMetrics());

        // Cache metrics
        $lines = array_merge($lines, $this->getCacheMetrics());

        // HTTP request metrics (from application counters)
        $lines = array_merge($lines, $this->getHttpMetrics());

        // Database query metrics (from application counters)
        $lines = array_merge($lines, $this->getDbQueryMetrics());

        // Business metrics
        $lines = array_merge($lines, $this->getBusinessMetrics());

        return implode("\n", $lines) . "\n";
    }

    /**
     * Database connection metrics.
     */
    private function getDatabaseMetrics(): array
    {
        $lines = [];

        $lines[] = '';
        $lines[] = '# HELP db_connections_active Active database connections';
        $lines[] = '# TYPE db_connections_active gauge';
        $lines[] = '# HELP db_connections_max Maximum database connections';
        $lines[] = '# TYPE db_connections_max gauge';
        $lines[] = '# HELP db_connection_up Database connectivity check';
        $lines[] = '# TYPE db_connection_up gauge';

        // MySQL
        $mysqlUp = 0;
        try {
            $mysqlConnections = DB::connection('mysql')
                ->select("SHOW STATUS LIKE 'Threads_connected'");
            $count = $mysqlConnections[0]->Value ?? 0;
            $lines[] = sprintf('db_connections_active{database="mysql"} %d', $count);

            $mysqlMaxConnections = DB::connection('mysql')
                ->select("SHOW VARIABLES LIKE 'max_connections'");
            $maxCount = $mysqlMaxConnections[0]->Value ?? 0;
            $lines[] = sprintf('db_connections_max{database="mysql"} %d', $maxCount);
            $mysqlUp = 1;
        } catch (\Exception $e) {
            $lines[] = 'db_connections_active{database="mysql"} 0';
            $lines[] = 'db_connections_max{database="mysql"} 0';
        }
        $lines[] = sprintf('db_connection_up{database="mysql"} %d', $mysqlUp);

        // PostgreSQL
        $pgUp = 0;
        try {
            $pgConnections = DB::connection('pgsql')
                ->select("SELECT count(*) as count FROM pg_stat_activity WHERE state = 'active'");
            $count = $pgConnections[0]->count ?? 0;
            $lines[] = sprintf('db_connections_active{database="postgresql"} %d', $count);

            $pgMaxConnections = DB::connection('pgsql')
                ->select('SHOW max_connections');
            $maxCount = $pgMaxConnections[0]->max_connections ?? 0;
            $lines[] = sprintf('db_connections_max{database="postgresql"} %d', $maxCount);
            $pgUp = 1;
        } catch (\Exception $e) {
            $lines[] = 'db_connections_active{database="postgresql"} 0';
            $lines[] = 'db_connections_max{database="postgresql"} 0';
        }
        $lines[] = sprintf('db_connection_up{database="postgresql"} %d', $pgUp);

        // ClickHouse
        $clickhouseUp = 0;
        try {
            DB::connection('clickhouse')->select('SELECT 1');
            $clickhouseUp = 1;
        } catch (\Exception $e) {
            $clickhouseUp = 0;
        }
        $lines[] = sprintf('db_connection_up{database="clickhouse"} %d', $clickhouseUp);

        return $lines;
    }

    /**
     * Queue metrics.
     */
    private function getQueueMetrics(): array
    {
        $lines = [];

        $lines[] = '';
        $lines[] = '# HELP laravel_queue_size Number of jobs in queue';
        $lines[] = '# TYPE laravel_queue_size gauge';

        $queues = ['default', 'evaluations', 'analytics', 'notifications', 'scores', 'sync'];

        foreach ($queues as $queue) {
            try {
                $size = Queue::size($queue);
                $lines[] = sprintf('laravel_queue_size{queue="%s"} %d', $queue, $size);
            } catch (\Exception $e) {
                $lines[] = sprintf('laravel_queue_size{queue="%s"} 0', $queue);
            }
        }

        // Failed jobs
        $lines[] = '';
        $lines[] = '# HELP laravel_queue_jobs_failed_total Total failed jobs';
        $lines[] = '# TYPE laravel_queue_jobs_failed_total counter';

        try {
            $failedCount = DB::table('failed_jobs')->count();
            $lines[] = sprintf('laravel_queue_jobs_failed_total %d', $failedCount);
        } catch (\Exception $e) {
            $lines[] = 'laravel_queue_jobs_failed_total 0';
        }

        return $lines;
    }

    /**
     * Cache metrics.
     */
    private function getCacheMetrics(): array
    {
        $lines = [];

        $lines[] = '';
        $lines[] = '# HELP laravel_cache_hits_total Total cache hits';
        $lines[] = '# TYPE laravel_cache_hits_total counter';

        // Get Redis info if available
        try {
            $redis = Cache::store('redis')->getStore()->connection();
            $info = $redis->info('stats');

            $hits = $info['keyspace_hits'] ?? 0;
            $misses = $info['keyspace_misses'] ?? 0;

            $lines[] = sprintf('laravel_cache_hits_total %d', $hits);

            $lines[] = '';
            $lines[] = '# HELP laravel_cache_misses_total Total cache misses';
            $lines[] = '# TYPE laravel_cache_misses_total counter';
            $lines[] = sprintf('laravel_cache_misses_total %d', $misses);

            // Memory usage
            $memoryInfo = $redis->info('memory');
            $usedMemory = $memoryInfo['used_memory'] ?? 0;
            $maxMemory = $memoryInfo['maxmemory'] ?? 268435456; // 256MB default

            $lines[] = '';
            $lines[] = '# HELP redis_memory_used_bytes Redis memory usage in bytes';
            $lines[] = '# TYPE redis_memory_used_bytes gauge';
            $lines[] = sprintf('redis_memory_used_bytes %d', $usedMemory);

            $lines[] = '';
            $lines[] = '# HELP redis_memory_max_bytes Redis max memory in bytes';
            $lines[] = '# TYPE redis_memory_max_bytes gauge';
            $lines[] = sprintf('redis_memory_max_bytes %d', $maxMemory > 0 ? $maxMemory : 268435456);
        } catch (\Exception $e) {
            $lines[] = 'laravel_cache_hits_total 0';
        }

        return $lines;
    }

    /**
     * HTTP request metrics from application counters.
     */
    private function getHttpMetrics(): array
    {
        $lines = [];

        // These would normally come from middleware tracking
        // For now, we'll expose what we can track

        $lines[] = '';
        $lines[] = '# HELP http_requests_total Total HTTP requests';
        $lines[] = '# TYPE http_requests_total counter';

        // Get from cache if tracked by middleware
        $requestCounts = Cache::get('metrics:http_requests', []);
        foreach ($requestCounts as $status => $count) {
            $lines[] = sprintf('http_requests_total{status="%s",job="laravel-app"} %d', $status, $count);
        }

        if (empty($requestCounts)) {
            $lines[] = 'http_requests_total{status="2xx",job="laravel-app"} 0';
        }

        $lines[] = '';
        $lines[] = '# HELP http_request_duration_seconds HTTP request duration histogram';
        $lines[] = '# TYPE http_request_duration_seconds histogram';

        $durations = Cache::get('metrics:http_durations', []);
        $sum = (float) Cache::get('metrics:http_duration_sum', 0);
        $count = (int) Cache::get('metrics:http_duration_count', 0);

        $bucketOrder = ['0.01', '0.025', '0.05', '0.1', '0.25', '0.5', '1.0', '2.5', '5.0', '10.0', '+Inf'];
        $cumulative = 0;

        foreach ($bucketOrder as $bucket) {
            $bucketCount = (int) ($durations[$bucket] ?? 0);
            $cumulative += $bucketCount;
            $lines[] = sprintf(
                'http_request_duration_seconds_bucket{le="%s",job="laravel-app"} %d',
                $bucket,
                $cumulative
            );
        }

        $lines[] = sprintf('http_request_duration_seconds_sum{job="laravel-app"} %s', $sum);
        $lines[] = sprintf('http_request_duration_seconds_count{job="laravel-app"} %d', $count);

        return $lines;
    }

    /**
     * Database query duration metrics.
     */
    private function getDbQueryMetrics(): array
    {
        $lines = [];

        $lines[] = '';
        $lines[] = '# HELP db_query_duration_seconds Database query duration histogram';
        $lines[] = '# TYPE db_query_duration_seconds histogram';

        $bucketOrder = ['0.01', '0.025', '0.05', '0.1', '0.25', '0.5', '1.0', '2.5', '5.0', '10.0', '+Inf'];
        $connections = ['mysql', 'pgsql', 'clickhouse'];

        foreach ($connections as $connection) {
            $durations = Cache::get("metrics:db_query_durations:{$connection}", []);
            $sum = (float) Cache::get("metrics:db_query_duration_sum:{$connection}", 0);
            $count = (int) Cache::get("metrics:db_query_duration_count:{$connection}", 0);

            $cumulative = 0;
            foreach ($bucketOrder as $bucket) {
                $bucketCount = (int) ($durations[$bucket] ?? 0);
                $cumulative += $bucketCount;
                $lines[] = sprintf(
                    'db_query_duration_seconds_bucket{le="%s",database="%s",job="laravel-app"} %d',
                    $bucket,
                    $connection,
                    $cumulative
                );
            }

            $lines[] = sprintf(
                'db_query_duration_seconds_sum{database="%s",job="laravel-app"} %s',
                $connection,
                $sum
            );
            $lines[] = sprintf(
                'db_query_duration_seconds_count{database="%s",job="laravel-app"} %d',
                $connection,
                $count
            );
        }

        return $lines;
    }

    /**
     * Business metrics specific to SABC Eval360.
     */
    private function getBusinessMetrics(): array
    {
        $lines = [];

        // Evaluations metrics
        $lines[] = '';
        $lines[] = '# HELP evaluations_total Total evaluations in system';
        $lines[] = '# TYPE evaluations_total gauge';

        try {
            $totalEvaluations = DB::connection('pgsql')
                ->table('evaluations')
                ->count();
            $lines[] = sprintf('evaluations_total %d', $totalEvaluations);
        } catch (\Exception $e) {
            $lines[] = 'evaluations_total 0';
        }

        // By status
        $lines[] = '';
        $lines[] = '# HELP evaluations_by_status Evaluations by status';
        $lines[] = '# TYPE evaluations_by_status gauge';

        try {
            $byStatus = DB::connection('pgsql')
                ->table('evaluations')
                ->selectRaw('statut, count(*) as count')
                ->groupBy('statut')
                ->get();

            foreach ($byStatus as $row) {
                $lines[] = sprintf(
                    'evaluations_by_status{status="%s"} %d',
                    $row->statut ?? 'unknown',
                    $row->count
                );
            }
        } catch (\Exception $e) {
            $lines[] = 'evaluations_by_status{status="unknown"} 0';
        }

        // By type/channel
        $lines[] = '';
        $lines[] = '# HELP evaluations_by_channel Evaluations by channel';
        $lines[] = '# TYPE evaluations_by_channel gauge';

        try {
            $column = null;
            $schema = Schema::connection('pgsql');
            if ($schema->hasColumn('evaluations', 'type_evaluation')) {
                $column = 'type_evaluation';
            } elseif ($schema->hasColumn('evaluations', 'id_type_evaluation')) {
                $column = 'id_type_evaluation';
            }

            if ($column) {
                $byChannel = DB::connection('pgsql')
                    ->table('evaluations')
                    ->selectRaw("{$column} as channel, count(*) as count")
                    ->groupBy($column)
                    ->get();

                foreach ($byChannel as $row) {
                    $lines[] = sprintf(
                        'evaluations_by_channel{channel="%s"} %d',
                        $row->channel ?? 'unknown',
                        $row->count
                    );
                }
            } else {
                $lines[] = 'evaluations_by_channel{channel="unknown"} 0';
            }
        } catch (\Exception $e) {
            $lines[] = 'evaluations_by_channel{channel="unknown"} 0';
        }

        // Active period evaluations
        $lines[] = '';
        $lines[] = '# HELP evaluations_current_period Evaluations in current period';
        $lines[] = '# TYPE evaluations_current_period gauge';

        try {
            $currentPeriodCount = DB::connection('pgsql')
                ->table('evaluations')
                ->whereRaw("date_evaluation >= date_trunc('month', CURRENT_DATE)")
                ->count();
            $lines[] = sprintf('evaluations_current_period %d', $currentPeriodCount);
        } catch (\Exception $e) {
            $lines[] = 'evaluations_current_period 0';
        }

        // Period completion metrics
        $lines[] = '';
        $lines[] = '# HELP evaluations_expected_total Expected evaluations by period';
        $lines[] = '# TYPE evaluations_expected_total gauge';
        $lines[] = '# HELP evaluations_completed_total Completed evaluations by period';
        $lines[] = '# TYPE evaluations_completed_total gauge';
        $lines[] = '# HELP evaluation_deadline_timestamp Evaluation deadline timestamp (seconds)';
        $lines[] = '# TYPE evaluation_deadline_timestamp gauge';

        try {
            if (Schema::connection('pgsql')->hasTable('periodes_evaluation')) {
                $periods = DB::connection('pgsql')
                    ->table('periodes_evaluation')
                    ->select('id_periode', 'code_periode', 'date_fin', 'nb_evaluations_attendues', 'nb_evaluations_completees')
                    ->get();

                foreach ($periods as $period) {
                    $label = $period->code_periode ?? (string) $period->id_periode;
                    $expected = (int) ($period->nb_evaluations_attendues ?? 0);
                    $completed = (int) ($period->nb_evaluations_completees ?? 0);

                    $lines[] = sprintf('evaluations_expected_total{periode="%s"} %d', $label, $expected);
                    $lines[] = sprintf('evaluations_completed_total{periode="%s"} %d', $label, $completed);

                    if (!empty($period->date_fin)) {
                        $timestamp = strtotime($period->date_fin);
                        if ($timestamp !== false) {
                            $lines[] = sprintf('evaluation_deadline_timestamp{periode="%s"} %d', $label, $timestamp);
                        }
                    }
                }
            }
        } catch (\Exception $e) {
            $lines[] = 'evaluations_expected_total{periode="unknown"} 0';
            $lines[] = 'evaluations_completed_total{periode="unknown"} 0';
        }

        // Users metrics
        $lines[] = '';
        $lines[] = '# HELP users_total Total users in system';
        $lines[] = '# TYPE users_total gauge';

        try {
            $totalUsers = DB::connection('mysql')
                ->table('utilisateurs')
                ->count();
            $lines[] = sprintf('users_total %d', $totalUsers);
        } catch (\Exception $e) {
            $lines[] = 'users_total 0';
        }

        // Active users (logged in last 30 days)
        $lines[] = '';
        $lines[] = '# HELP users_active_30d Users active in last 30 days';
        $lines[] = '# TYPE users_active_30d gauge';

        try {
            if (Schema::connection('mysql')->hasColumn('utilisateurs', 'last_login_at')) {
                $activeUsers = DB::connection('mysql')
                    ->table('utilisateurs')
                    ->where('last_login_at', '>=', now()->subDays(30))
                    ->count();
                $lines[] = sprintf('users_active_30d %d', $activeUsers);
            } else {
                $lines[] = 'users_active_30d 0';
            }
        } catch (\Exception $e) {
            $lines[] = 'users_active_30d 0';
        }

        // Anomalies metrics (from ClickHouse)
        $lines[] = '';
        $lines[] = '# HELP anomalies_detected_total Total anomalies detected';
        $lines[] = '# TYPE anomalies_detected_total gauge';

        try {
            $rows = DB::connection('clickhouse')->select("
                SELECT
                    sumIf(1, score_severite >= 7) AS high,
                    sumIf(1, score_severite >= 4 AND score_severite < 7) AS medium,
                    sumIf(1, score_severite < 4) AS low
                FROM logs_anomalies
            ");

            $high = $rows[0]->high ?? 0;
            $medium = $rows[0]->medium ?? 0;
            $low = $rows[0]->low ?? 0;

            $lines[] = sprintf('anomalies_detected_total{severity="high"} %d', $high);
            $lines[] = sprintf('anomalies_detected_total{severity="medium"} %d', $medium);
            $lines[] = sprintf('anomalies_detected_total{severity="low"} %d', $low);
        } catch (\Exception $e) {
            $lines[] = 'anomalies_detected_total{severity="high"} 0';
            $lines[] = 'anomalies_detected_total{severity="medium"} 0';
            $lines[] = 'anomalies_detected_total{severity="low"} 0';
        }

        return $lines;
    }
}
