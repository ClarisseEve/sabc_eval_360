<?php

declare(strict_types=1);

namespace App\Providers;

use App\Services\EvaluationServiceProxy;
use Illuminate\Support\ServiceProvider;

class EvaluationServiceProvider extends ServiceProvider
{
    /**
     * Register services.
     */
    public function register(): void
    {
        // Register the proxy as a singleton
        $this->app->singleton(EvaluationServiceProxy::class, function ($app) {
            return new EvaluationServiceProxy();
        });

        // Alias for easier access
        $this->app->alias(EvaluationServiceProxy::class, 'evaluation.proxy');
    }

    /**
     * Bootstrap services.
     */
    public function boot(): void
    {
        // Health check for the evaluation microservice
        if (config('services.evaluation.enabled')) {
            $this->registerHealthCheck();
        }
    }

    /**
     * Register health check for monitoring
     */
    private function registerHealthCheck(): void
    {
        // This can be used by monitoring tools
        $this->app->booted(function () {
            if ($this->app->runningInConsole()) {
                return;
            }

            // Optionally check service health on boot (disabled by default)
            // $proxy = $this->app->make(EvaluationServiceProxy::class);
            // if (!$proxy->healthCheck()) {
            //     \Log::warning('Evaluation microservice is not healthy at boot');
            // }
        });
    }
}
