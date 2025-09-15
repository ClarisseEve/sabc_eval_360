<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Auth\AuthCheckController;
// use App\Http\Controllers\Api\UserController; // Temporarily commented out
use App\Http\Controllers\Api\EvaluationController;
use App\Http\Controllers\Api\HierarchyController;

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

    // Other API routes can be added here

});
