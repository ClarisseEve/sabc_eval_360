<?php

namespace App\Console;

use Illuminate\Console\Scheduling\Schedule;
use Illuminate\Foundation\Console\Kernel as ConsoleKernel;

class Kernel extends ConsoleKernel
{
    /**
     * Define the application's command schedule.
     */
    protected function schedule(Schedule $schedule): void
    {
        // Ouverture automatique des périodes d'évaluation (tous les jours à 00:05)
        $schedule->command('periodes:ouvrir')
            ->dailyAt('00:05')
            ->timezone('Africa/Douala')
            ->withoutOverlapping()
            ->onSuccess(function () {
                \Log::info('Scheduled job periodes:ouvrir exécuté avec succès');
            })
            ->onFailure(function () {
                \Log::error('Scheduled job periodes:ouvrir a échoué');
            });
        
        // Fermeture automatique des périodes d'évaluation (tous les jours à 23:55)
        $schedule->command('periodes:fermer')
            ->dailyAt('23:55')
            ->timezone('Africa/Douala')
            ->withoutOverlapping()
            ->onSuccess(function () {
                \Log::info('Scheduled job periodes:fermer exécuté avec succès');
            })
            ->onFailure(function () {
                \Log::error('Scheduled job periodes:fermer a échoué');
            });
        
        // Envoi des rappels d'évaluations (tous les jours à 08:00)
        $schedule->command('evaluations:rappels')
            ->dailyAt('08:00')
            ->timezone('Africa/Douala')
            ->withoutOverlapping()
            ->onSuccess(function () {
                \Log::info('Scheduled job evaluations:rappels exécuté avec succès');
            })
            ->onFailure(function () {
                \Log::error('Scheduled job evaluations:rappels a échoué');
            });
        
        // Synchronisation MySQL vers PostgreSQL toutes les 15 minutes
        $schedule->call(function () {
            $syncService = app(\App\Services\DatabaseSyncService::class);
            $stats = $syncService->syncEvaluationsToPostgres(200);
            \Log::info('Synchronisation MySQL → PostgreSQL: ', $stats);
        })->name('sync-mysql-to-postgres')->everyFifteenMinutes()->withoutOverlapping();
        
        // Synchronisation PostgreSQL vers ClickHouse pour l'analytique quotidienne
        $schedule->call(function () {
            $syncService = app(\App\Services\DatabaseSyncService::class);
            $stats = $syncService->syncAnalyticsToClickHouse('day');
            \Log::info('Synchronisation PostgreSQL → ClickHouse (quotidienne): ', $stats);
        })->name('sync-postgres-to-clickhouse-daily')->dailyAt('01:00')->withoutOverlapping();
        
        // Synchronisation PostgreSQL vers ClickHouse pour l'analytique hebdomadaire
        $schedule->call(function () {
            $syncService = app(\App\Services\DatabaseSyncService::class);
            $stats = $syncService->syncAnalyticsToClickHouse('week');
            \Log::info('Synchronisation PostgreSQL → ClickHouse (hebdomadaire): ', $stats);
        })->name('sync-postgres-to-clickhouse-weekly')->weekly()->mondays()->at('02:00')->withoutOverlapping();
        
        // Vérification des connexions aux bases de données
        $schedule->command('db:test-connections')->hourly();
    }

    /**
     * Register the commands for the application.
     */
    protected function commands(): void
    {
        $this->load(__DIR__.'/Commands');

        require base_path('routes/console.php');
    }
}
