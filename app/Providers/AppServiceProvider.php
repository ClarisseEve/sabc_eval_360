<?php

namespace App\Providers;

use App\Models\Core\PersonalAccessToken;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\ServiceProvider;
use Jaeger\Config as JaegerConfig;
use Laravel\Sanctum\Sanctum;
use OpenTracing\GlobalTracer;

class AppServiceProvider extends ServiceProvider
{
    private bool $recordingDbMetrics = false;

    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        // Configuration de Sanctum pour utiliser notre modèle personnalisé avec la connexion MySQL
        Sanctum::usePersonalAccessTokenModel(PersonalAccessToken::class);

        if ($this->shouldRecordDbMetrics()) {
            DB::listen(function ($query) {
                $durationSeconds = (float) $query->time / 1000;
                $connection = $query->connectionName ?? 'default';
                $this->recordDbQueryDuration($connection, $durationSeconds);
            });
        }

        $this->bootTracing();
    }

    private function bootTracing(): void
    {
        if ($this->app->runningInConsole()) {
            return;
        }

        if (!config('observability.tracing.enabled', false)) {
            return;
        }

        try {
            $config = new JaegerConfig(
                [
                    'sampler' => [
                        'type' => config('observability.tracing.sampler_type', 'const'),
                        'param' => (float) config('observability.tracing.sampler_param', 1),
                    ],
                    'logging' => (bool) config('observability.tracing.log_spans', false),
                    'local_agent' => [
                        'reporting_host' => config('observability.tracing.agent_host', 'jaeger'),
                        'reporting_port' => (int) config('observability.tracing.agent_port', 6831),
                    ],
                ],
                config('observability.tracing.service_name', config('app.name', 'laravel-app'))
            );

            $tracer = $config->initializeTracer();
            GlobalTracer::set($tracer);
        } catch (\Throwable $e) {
            Log::warning('Tracing initialization failed', ['error' => $e->getMessage()]);
        }
    }

    private function recordDbQueryDuration(string $connection, float $duration): void
    {
        if ($this->recordingDbMetrics) {
            return;
        }

        $this->recordingDbMetrics = true;

        try {
            $bucket = $this->getDbDurationBucket($duration);

            $bucketKey = "metrics:db_query_durations:{$connection}";
            $durations = Cache::get($bucketKey, []);
            $durations[$bucket] = ($durations[$bucket] ?? 0) + 1;
            Cache::put($bucketKey, $durations, now()->addHours(24));

            $sumKey = "metrics:db_query_duration_sum:{$connection}";
            $sum = (float) Cache::get($sumKey, 0);
            Cache::put($sumKey, $sum + $duration, now()->addHours(24));

            $countKey = "metrics:db_query_duration_count:{$connection}";
            $count = (int) Cache::get($countKey, 0);
            Cache::put($countKey, $count + 1, now()->addHours(24));
        } finally {
            $this->recordingDbMetrics = false;
        }
    }

    private function shouldRecordDbMetrics(): bool
    {
        $defaultStore = (string) config('cache.default');
        $driver = (string) config("cache.stores.{$defaultStore}.driver");

        return $driver !== 'database';
    }

    private function getDbDurationBucket(float $duration): string
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
