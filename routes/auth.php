<?php

use App\Http\Controllers\Auth\AuthenticatedSessionController;
use App\Http\Controllers\Auth\ConfirmablePasswordController;
use App\Http\Controllers\Auth\NewPasswordController;
use Illuminate\Support\Facades\Route;

// Note: Les contrôleurs suivants ont été supprimés car ils ne sont plus nécessaires
// dans le système d'authentification simplifié de SABC où l'administrateur crée les utilisateurs:
// - EmailVerificationNotificationController
// - EmailVerificationPromptController
// - VerifyEmailController

Route::middleware('guest')->group(function () {
    // Routes d'authentification - Conforme aux règles métier SABC
    // Les utilisateurs sont créés par l'administrateur, pas d'inscription publique
    
    // Login
    Route::get('login', [AuthenticatedSessionController::class, 'create'])
        ->name('login');
    Route::post('login', [AuthenticatedSessionController::class, 'store']);
    
    // Réinitialisation de mot de passe
    Route::get('reset-password/{token}', [NewPasswordController::class, 'create'])
        ->name('password.reset');
    Route::post('reset-password', [NewPasswordController::class, 'store'])
        ->name('password.store');
});

Route::middleware('auth')->group(function () {
    // Tolérer un GET /logout pour éviter erreurs si JS ne soumet pas en POST
    Route::get('logout', [AuthenticatedSessionController::class, 'destroy'])
        ->name('logout.get');
    // Confirmation de mot de passe pour les actions sensibles
    Route::get('confirm-password', [ConfirmablePasswordController::class, 'show'])
        ->name('password.confirm');
    Route::post('confirm-password', [ConfirmablePasswordController::class, 'store']);

    Route::post('logout', [AuthenticatedSessionController::class, 'destroy'])
        ->name('logout');
});
