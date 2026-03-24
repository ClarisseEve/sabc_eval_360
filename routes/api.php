<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Auth\AuthCheckController;
// use App\Http\Controllers\Api\UserController; // Temporarily commented out
use App\Http\Controllers\Api\AnalyticsController;
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

    // Evaluations API
    Route::prefix('evaluations')->name('api.evaluations.')->controller(EvaluationController::class)->group(function () {
        Route::get('/', 'index')->name('index');
        Route::post('/', 'store')->name('store');
        Route::get('/periodes-actives', 'getPeriodesActives')->name('periodes-actives');
        Route::get('/eligibles', 'getUtilisateursEligibles')->name('eligibles');
        Route::get('/historique', 'historique')->name('historique');
        Route::get('/{id}', 'show')->name('show');
        Route::put('/{id}', 'update')->name('update');
        Route::post('/{id}/submit', 'submit')->name('submit');
        Route::post('/{id}/validate', 'validate')->name('validate');
        Route::get('/rapport/{idPeriode}', 'rapport')->name('rapport');
        Route::post('/rappels/{idPeriode}', 'envoyerRappels')->name('rappels');
    });

    // Hierarchy API
    Route::prefix('hierarchy')->name('api.hierarchy.')->controller(HierarchyController::class)->group(function () {
        Route::get('/region/{idRegion}', 'getHierarchieRegion')->name('region');
        Route::get('/region/{idRegion}/stats', 'getStatistiquesRegion')->name('region.stats');
        Route::get('/subordonnes', 'getSubordonnesDirects')->name('subordonnes');
        Route::get('/tous-subordonnes', 'getTousSubordonnes')->name('tous-subordonnes');
        Route::get('/chaine', 'getChaineHierarchique')->name('chaine');
        Route::get('/managers-eligibles/{idUtilisateur}', 'getManagersEligibles')->name('managers-eligibles');
        Route::post('/verifier-supervision', 'verifierSupervision')->name('verifier-supervision');
        Route::post('/valider-assignation', 'validerAssignationManager')->name('valider-assignation');
        Route::post('/assigner-manager', 'assignerManager')->name('assigner-manager');
    });

    // Analytics API
    Route::prefix('analytics')->name('api.analytics.')->controller(AnalyticsController::class)->group(function () {
        Route::get('/dashboard', 'dashboard')->name('dashboard');
        Route::get('/evaluations', 'evaluations')->name('evaluations');
        Route::get('/performances', 'performances')->name('performances');
        Route::get('/region/{idRegion}', 'region')->name('region');
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
