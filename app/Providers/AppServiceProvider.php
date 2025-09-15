<?php

namespace App\Providers;

use Illuminate\Support\ServiceProvider;
use Laravel\Sanctum\Sanctum;
use App\Models\Core\PersonalAccessToken;

class AppServiceProvider extends ServiceProvider
{
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
    }
}
