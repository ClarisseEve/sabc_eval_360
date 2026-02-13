<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Auth\AuthCheckController;
// use App\Http\Controllers\Api\UserController; // Temporarily commented out
use App\Http\Controllers\Api\EvaluationController;
use App\Http\Controllers\Api\HierarchyController;
use App\Http\Controllers\Api\UtilisateurController;
use App\Http\Controllers\Api\ReplacementController;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
|
| Here is where you can register API routes for your application. These
| routes are loaded by the RouteServiceProvider and all of them will
| be assigned to the "api" middleware group. Make something great!
|
*/

Route::middleware('auth:sanctum')->group(function () {
    // Route to get the authenticated user
    Route::get('/user', function (Request $request) {
        return $request->user();
    });

    // Route to check authentication status, used by the frontend
    Route::get('/auth/check', [AuthCheckController::class, 'check'])->name('auth.check');

    // User management routes - Temporarily commented out until UserController is created
    /*
    Route::prefix('users')->name('users.')->group(function () {
        Route::get('/', [UserController::class, 'index'])->name('index');
        Route::post('/', [UserController::class, 'store'])->name('store');
        Route::get('/{utilisateur}', [UserController::class, 'show'])->name('show');
        Route::put('/{utilisateur}', [UserController::class, 'update'])->name('update');
        Route::delete('/{utilisateur}', [UserController::class, 'destroy'])->name('destroy');
        Route::post('/{utilisateur}/change-role', [UserController::class, 'changeRole'])->name('change-role');
        Route::post('/{utilisateur}/toggle-status', [UserController::class, 'toggleStatus'])->name('toggle-status');
        Route::post('/{utilisateur}/reset-password', [UserController::class, 'resetPassword'])->name('reset-password');
        Route::get('/{utilisateur}/stats', [UserController::class, 'getUserStats'])->name('stats');
        Route::get('/export', [UserController::class, 'export'])->name('export');
        Route::post('/import', [UserController::class, 'import'])->name('import');
    });
    */

    // Utilisateurs API
    Route::prefix('utilisateurs')->name('api.utilisateurs.')->controller(UtilisateurController::class)->group(function () {
        Route::get('/', 'index')->name('index');
        Route::get('/{utilisateur}', 'show')->name('show');
        Route::get('/{utilisateur}/subordonnes', 'getSubordonnes')->name('subordonnes');
        Route::post('/remplacants-disponibles', 'getRemplacantsDisponibles')->name('remplacants-disponibles');
    });

    // Remplacements API
    Route::prefix('remplacements')->name('api.remplacements.')->controller(ReplacementController::class)->group(function () {
        Route::get('/actifs', 'getRemplacementsActifs')->name('actifs');
        Route::get('/a-venir', 'getRemplacementsAVenir')->name('a-venir');
        Route::get('/historique', 'getHistoriqueRemplacements')->name('historique');
        Route::get('/par-utilisateur', 'getRemplacementsPourUtilisateur')->name('par-utilisateur');
        Route::get('/utilisateur-info', 'getUtilisateurInfo')->name('utilisateur-info');
        Route::get('/subordonnes', 'getSubordonnes')->name('subordonnes');
        Route::post('/', 'store')->name('store');
        Route::post('/{idRemplacement}/terminer', 'terminer')->name('terminer');
    });

});
