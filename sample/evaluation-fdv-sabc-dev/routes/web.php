<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\{
    AuthController,
    UserController as Profile,
    Cds\DashboardController as CDS,
    Cdv\DashboardController as CDV,
    Csc\DashboardController as CSC,
    Dr\DashboardController as DR,
    Cdctt\DashboardController as CDC,
    Csc\EvaluationController as EvaluationCSC,
    Cdv\EvaluationController as EvaluationCDV,
    Admin\UserController as User,
    Admin\AdminController as Admin,
    Admin\ServiceController as Service,
};
use App\Http\Middleware\{
    CheckAdmin,
    CheckCDV,
    CheckCDS,
    CheckCSC,
    CheckDR,
    CheckCDCTT,
};

/*
|--------------------------------------------------------------------------
| Web Routes
|--------------------------------------------------------------------------
|
| Here is where you can register web routes for your application. These
| routes are loaded by the RouteServiceProvider and all of them will
| be assigned to the "web" middleware group. Make something great!
|
*/

// Public Routes
Route::controller(AuthController::class)->group(function () {
    Route::get('/login', 'showLoginForm')->name('login');
    Route::get('/', 'showLoginForm')->name('index');
    Route::post('/login', 'login');
    Route::post('/logout', 'logout')->name('logout');
});

// Authenticated Routes
Route::middleware('auth')->group(function () {

    Route::controller(AuthController::class)->group(function () {
        Route::get('/profile',  'index')->name('profile');
        Route::get('/password', 'showChangePasswordForm')->name('password');
        Route::post('/password/',  'changePassword')->name('password.store');
        Route::get('/password/default', 'defaultPassword')->name('password.default');
    });
    
    // CDV Routes
    Route::prefix('cdv')
    ->middleware(CheckCDV::class)
    ->name('cdv.')
    ->group(function () {
        Route::get('/', [CDV::class, 'dashboard'])->name('dashboard');
        Route::get('/evaluation', [CDV::class, 'create'])->name('note.create');
        Route::get('/{userId}', [CDV::class, 'index'])->name('index');
        Route::post('/evaluation', [CDV::class, 'store'])->name('note.store');
        Route::get('/evaluations/{noteId}', [CDV::class, 'show'])->name('note.show');
        Route::get('/evaluations/{noteId}/delete', [CDS::class, 'deleteEvaluation'])->name('note.delete');

        // CDS-specific CSC Routes
        Route::prefix('cds')->group(function () {
            Route::get('/{userId}', [CDV::class, 'indexCDS'])->name('cds.index');
            Route::get('/evaluate/{noteId}', [CDV::class, 'showReportCDS'])->name('cds.note.show');
            Route::get('/evaluations/{noteId}/delete', [CDS::class, 'deleteEvaluation'])->name('cds.note.delete');

            Route::prefix('evaluate/{userId}')->group(function () {
                Route::get('/create', [CDV::class, 'createCDS'])->name('cds.note.create');
                Route::post('/store', [CDV::class, 'storeCDS'])->name('cds.note.store');
            });
        });
    });

    // CDS Routes
    Route::prefix('cds')
    ->middleware(CheckCDS::class)
    ->name('cds.')
    ->group(function () 
    {
        Route::get('/', [CDS::class, 'index'])->name('dashboard');
        
        Route::get('/{userId}', [CDS::class, 'show'])->name('show');
        Route::get('/evaluation/{userId}', [CDS::class, 'create'])->name('note.create');
        Route::post('/evaluation', [CDS::class, 'store'])->name('note.store');
        Route::get('/evaluations/{noteId}', [CDS::class, 'show'])->name('note.show');
        Route::get('/evaluations/{noteId}/delete', [CDS::class, 'deleteEvaluation'])->name('note.delete');
    });

    // CSC Routes
    Route::prefix('csc')
    ->middleware(CheckCSC::class)
    ->name('csc.')
    ->group(function () {
        Route::get('/', [CSC::class, 'index'])->name('dashboard');
        Route::get('/{userId}', [CSC::class, 'show'])->name('show');
        Route::get('evaluate/{noteId}/', [CSC::class, 'showReport'])->name('note.show');
        Route::get('/evaluations/{noteId}/delete', [CDS::class, 'deleteEvaluation'])->name('note.delete');

        // Evaluation Routes
        Route::prefix('evaluate/{userId}')->group(function () {
            Route::get('/create', [CSC::class, 'create'])->name('note.create');
            Route::post('/store', [EvaluationCSC::class, 'store'])->name('note.store');
        });

        // CDV-specific CSC Routes
        Route::prefix('cdv')->group(function () {
            Route::get('/{userId}', [CSC::class, 'indexCDV'])->name('cdv.index');
            Route::get('/evaluate/{noteId}', [CSC::class, 'showReportCDV'])->name('cdv.note.show');
            Route::get('/evaluations/{noteId}/delete', [CDS::class, 'deleteEvaluation'])->name('cdv.note.delete');

            Route::prefix('evaluate/{userId}')->group(function () {
                Route::get('/create', [EvaluationCSC::class, 'createCDV'])->name('cdv.create');
                Route::post('/store', [EvaluationCSC::class, 'storeCDV'])->name('cdv.note.store');
            });
        });
        
        // CDS-specific CSC Routes
        Route::prefix('cds')->group(function () {
            Route::get('/{userId}', [CSC::class, 'indexCDS'])->name('cds.index');
            Route::get('/evaluations/{noteId}/delete', [CDS::class, 'deleteEvaluation'])->name('cds.note.delete');

            Route::get('/evaluate/{noteId}', [CSC::class, 'showReportCDS'])->name('cds.note.show');
            Route::prefix('evaluate/{userId}')->group(function () {
                Route::get('/create', [EvaluationCSC::class, 'createCDS'])->name('cds.create');
                Route::post('/store', [EvaluationCSC::class, 'storeCDS'])->name('cds.note.store');
            });
        });
    });


        // admin Routes
    Route::prefix('admin')
    ->middleware(CheckAdmin::class)
    ->name('admin.')
    ->group(function () {
        Route::get('/', [Admin::class, 'index'])->name('dashboard');
        Route::get('/notes/rapport', [Admin::class, 'notes'])->name('notes');
        Route::get('/notes/rapport/final', [Admin::class, 'result'])->name('notes.result');
        Route::get('/notes/{noteId}/delete', [Admin::class, 'deleteNote'])->name('note.delete');
        Route::get('/notes/{noteId}/delete/confirm', [Admin::class, 'confirmDeleteNote'])->name('note.confirm.delete');
        
        // User Resource Routes
        Route::resource('users', User::class);
        Route::get('/services-by-region', [User::class, 'getServicesByRegion'])
        ->name('services.by.region');
        Route::get('/users-by-service', [User::class, 'getUsersByService'])
            ->name('users.by.service');
        Route::get('/dr-by-region', [User::class, 'getUsersDrByRegion'])
            ->name('users.dr.by.region');
        Route::get('users/{userId}/note/{noteId}', [User::class, 'note'])->name('users.note.show');


        // Service Resource Routes
        Route::resource('services', Service::class)->except(['show']);
    });


    // DR Routes
    Route::prefix('dr')
    ->middleware(CheckDR::class)
    ->name('dr.')
    ->group(function () {
        Route::get('/', [DR::class, 'index'])->name('dashboard');
        Route::get('/{userId}', [DR::class, 'show'])->name('csc.show');
        Route::get('/evaluation/{userId}', [DR::class, 'create'])->name('csc.note.create');
        Route::post('/evaluation', [DR::class, 'store'])->name('csc.note.store');
        Route::get('/evaluations/{noteId}', [DR::class, 'detail'])->name('csc.note.show');
        Route::get('/evaluations/{noteId}/delete', [CDS::class, 'deleteEvaluation'])->name('csc.note.delete');

    });
    
    // CDC TT Routes
    Route::prefix('cdctt')
    ->middleware(CheckCDCTT::class)
    ->name('cdctt.')
    ->group(function () {
        Route::get('/', [CDC::class, 'index'])->name('dashboard');
        Route::get('/{userId}', [CDC::class, 'show'])->name('csc.show');
        Route::get('/evaluation/{userId}', [CDC::class, 'create'])->name('csc.note.create');
        Route::post('/evaluation', [CDC::class, 'store'])->name('csc.note.store');
        Route::get('/evaluations/{noteId}', [CDC::class, 'detail'])->name('csc.note.show');
        Route::get('/evaluations/{noteId}/delete', [CDS::class, 'deleteEvaluation'])->name('csc.note.delete');

    });

        
});
