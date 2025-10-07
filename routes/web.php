<?php

use App\Http\Controllers\ProfileController;
use App\Http\Controllers\Auth\AuthCheckController;
use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

// Rediriger la route principale vers la page de login
Route::get('/', function () {
    return redirect()->route('login');
})->name('home');

// Route de diagnostic d'authentification pour débugger les problèmes de session
Route::get('/test-auth', function () {
    $user = Auth::user();
    $sessionData = session()->all();
    
    // Vérifier les sessions en base de données
    $sessionsInDb = DB::table('sessions')
        ->select('id', 'user_id', 'ip_address', 'last_activity')
        ->orderBy('last_activity', 'desc')
        ->limit(3)
        ->get();
    
    return response()->json([
        'authenticated' => Auth::check(),
        'user' => $user ? [
            'matricule' => $user->matricule,
            'nom' => $user->nom,
            'prenom' => $user->prenom,
            'role' => $user->role_nom,
            'region' => $user->region_nom,
            'date_naissance' => $user->date_naissance
        ] : null,
        'session_id' => session()->getId(),
        'session_data_keys' => array_keys($sessionData),
        'has_auth_data' => session()->has('login_web_' . sha1('App\Models\Utilisateur')),
        'sessions_in_db' => $sessionsInDb,
        'cookies' => request()->cookies->all(),
        'debug_info' => [
            'timestamp' => now()->toISOString(),
            'ip' => request()->ip(),
            'user_agent' => request()->userAgent(),
            'sessions_table_fixed' => 'user_id is now varchar(5) to accept matricules'
        ]
    ]);
})->name('test.auth');

// Route de diagnostic d'authentification frontend (page Inertia)
Route::get('/auth-debug', function () {
    return Inertia::render('common/auth-debug');
})->middleware(['auth'])->name('auth.debug');

Route::middleware(['auth'])->group(function () {
    // Vérification d'authentification pour le frontend (session web)
    Route::get('/auth/check', [App\Http\Controllers\Auth\AuthCheckController::class, 'check'])->name('auth.check.web');

    // Templates applicables à l'évaluateur courant (JSON, guard web)
    Route::get('/evaluations/templates/applicables', [App\Http\Controllers\TemplatesController::class, 'applicables'])
        ->name('evaluations.templates.applicables');
    // Route principale du tableau de bord - redirection directe vers admin dashboard
    // Pour éviter les boucles de redirection, on ne passe plus par le middleware role.redirect
    // Routes pour les tableaux de bord - utilisation du DashboardController avec FormatsUserData
    // Conformes à la hiérarchie organisationnelle SABC
    Route::get('dashboard', [App\Http\Controllers\DashboardController::class, 'index'])->name('dashboard');
    
    // Tableaux de bord spécifiques à chaque rôle avec données utilisateur formatées
    Route::get('admin/dashboard', [App\Http\Controllers\DashboardController::class, 'admin'])->name('dashboard.admin')->middleware('role:ADMIN');
    Route::get('dr/dashboard', [App\Http\Controllers\DashboardController::class, 'dr'])->name('dashboard.dr')->middleware('role:DR');
    Route::get('cdtt/dashboard', [App\Http\Controllers\DashboardController::class, 'cdtt'])->name('dashboard.cdtt')->middleware('role:CDTT');
    Route::get('csc/dashboard', [App\Http\Controllers\DashboardController::class, 'csc'])->name('dashboard.csc')->middleware('role:CSC');
    Route::get('cdv/dashboard', [App\Http\Controllers\DashboardController::class, 'cdv'])->name('dashboard.cdv')->middleware('role:CDV');
    Route::get('cds/dashboard', [App\Http\Controllers\DashboardController::class, 'cds'])->name('dashboard.cds')->middleware('role:CDS');
    Route::get('rtm/dashboard', [App\Http\Controllers\DashboardController::class, 'rtm'])->name('dashboard.rtm')->middleware('role:RTM');
    Route::get('tmo/dashboard', [App\Http\Controllers\DashboardController::class, 'tmo'])->name('dashboard.tmo')->middleware('role:TMO');
    Route::get('srmo/dashboard', [App\Http\Controllers\DashboardController::class, 'srmo'])->name('dashboard.srmo')->middleware('role:SRMO');
    Route::get('ss/dashboard', [App\Http\Controllers\DashboardController::class, 'ss'])->name('dashboard.ss')->middleware('role:SS');
    Route::get('as/dashboard', [App\Http\Controllers\DashboardController::class, 'as'])->name('dashboard.as')->middleware('role:AS');
    
    // Routes pour les évaluations (communes à tous les rôles)
    Route::prefix('common/evaluations')->name('evaluations.')->controller(\App\Http\Controllers\EvaluationController::class)->group(function () {
        // Page d'accueil des évaluations
        Route::get('/', 'index')->name('index');
        
        // Mes évaluations - affiche les types d'évaluations disponibles selon le rôle
        Route::get('/mine', 'mine')->name('mine');
        
        // Évaluations à compléter selon les règles SABC
        Route::get('/pending', [\App\Http\Controllers\EvaluationsACompleterController::class, 'index'])->name('pending');
        
        // Création d'une nouvelle évaluation
        Route::get('/create', 'create')->name('create');

        // Détails JSON pour le modal
        Route::get('/details', 'details')->name('details');
        
        // Affichage d'une évaluation spécifique
        Route::get('/{id}', 'show')->name('show');
        
        // Édition d'une évaluation
        Route::get('/{id}/edit', 'edit')->name('edit');
        Route::put('/{id}', 'update')->name('update');
        Route::post('/', 'store')->name('store');
    });
    

    
    // Routes pour l'administration (accessibles uniquement par l'admin)
    Route::middleware(['role:ADMIN'])->prefix('admin')->name('admin.')->group(function () {
        
        // Routes pour les remplacements temporaires
        Route::prefix('remplacements')->name('remplacements.')->controller(\App\Http\Controllers\Admin\ReplacementController::class)->group(function () {
            Route::get('/', 'index')->name('index');
            Route::get('/create', 'create')->name('create');
            Route::post('/', 'store')->name('store');
            Route::get('/{id}', 'show')->name('show');
            Route::get('/{id}/edit', 'edit')->name('edit');
            Route::put('/{id}', 'update')->name('update');
            Route::delete('/{id}', 'destroy')->name('destroy');
        });
        
        // Routes pour la gestion des rôles
        Route::prefix('roles')->name('roles.')->controller(\App\Http\Controllers\Admin\RolesController::class)->group(function () {
            Route::get('/', 'index')->name('index');
            Route::get('/permissions', 'permissions')->name('permissions');
            Route::post('/permissions/update', 'updatePermissions')->name('permissions.update');
            Route::get('/create', 'create')->name('create');
            Route::post('/', 'store')->name('store');
            
            // Routes pour les règles d'évaluation selon les règles SABC
            Route::prefix('rules')->name('rules.')->group(function () {
                Route::get('/create', 'createRule')->name('create');
                Route::post('/', 'storeRule')->name('store');
                Route::post('/update', 'updateRule')->name('update');
            });
            Route::get('/{id}', 'show')->name('show');
            Route::get('/{id}/edit', 'edit')->name('edit');
            Route::put('/{id}', 'update')->name('update');
            Route::delete('/{id}', 'destroy')->name('destroy');
        });
        
        // Routes pour la structure organisationnelle
        Route::prefix('structure')->name('structure.')->controller(\App\Http\Controllers\Admin\StructureController::class)->group(function () {
            // Gestion des régions
            Route::get('/regions', 'regions')->name('regions');
            Route::post('/regions', 'storeRegion')->name('regions.store');
            Route::put('/regions/{id}', 'updateRegion')->name('regions.update');
            Route::delete('/regions/{id}', 'destroyRegion')->name('regions.destroy');
            
            // Gestion des services commerciaux
            Route::get('/services', 'services')->name('services');
            Route::post('/services', 'storeService')->name('services.store');
            Route::put('/services/{id}', 'updateService')->name('services.update');
            Route::delete('/services/{id}', 'destroyService')->name('services.destroy');
            
            // Gestion des districts
            Route::get('/districts', 'districts')->name('districts');
            Route::post('/districts', 'storeDistrict')->name('districts.store');
            Route::put('/districts/{id}', 'updateDistrict')->name('districts.update');
            Route::delete('/districts/{id}', 'destroyDistrict')->name('districts.destroy');
            
            // Gestion des secteurs
            Route::get('/secteurs', 'secteurs')->name('secteurs');
            Route::post('/secteurs', 'storeSecteur')->name('secteurs.store');
            Route::put('/secteurs/{id}', 'updateSecteur')->name('secteurs.update');
            Route::delete('/secteurs/{id}', 'destroySecteur')->name('secteurs.destroy');
        });
        // Routes pour les évaluations admin
        Route::prefix('evaluations')->name('admin.evaluations.')->group(function () {
            // Historique des évaluations (admin uniquement)
            Route::get('/history', function () {
                return Inertia::render('Admin/Evaluations/History');
            })->name('history');
            
            // Gestion globale des évaluations
            Route::get('/management', function () {
                return Inertia::render('Admin/Evaluations/Management');
            })->name('management');
            
            // Gestion des templates d'évaluation
            Route::prefix('templates')->name('templates.')->group(function () {
                // Liste des templates
                Route::get('/', function () {
                    return Inertia::render('Admin/Evaluations/Templates/Index');
                })->name('index');
                
                // Création d'un nouveau template
                Route::get('/create', function () {
                    return Inertia::render('Admin/Evaluations/Templates/Create');
                })->name('create');
                
                // Édition d'un template
                Route::get('/{id}/edit', function ($id) {
                    return Inertia::render('Admin/Evaluations/Templates/Edit', ['id' => $id]);
                })->name('edit');
            });
            
            // Gestion des périodes d'évaluation
            Route::prefix('periodes')->name('periodes.')->controller(\App\Http\Controllers\PeriodeEvaluationController::class)->group(function () {
                // Liste des périodes
                Route::get('/', 'index')->name('index');
                
                // Création d'une nouvelle période
                Route::get('/create', 'create')->name('create');
                Route::post('/', 'store')->name('store');
                
                // Affichage d'une période spécifique
                Route::get('/{id}', 'show')->name('show');
                
                // Édition d'une période
                Route::get('/{id}/edit', 'edit')->name('edit');
                Route::put('/{id}', 'update')->name('update');
                
                // Actions sur les périodes (activer, fermer, terminer)
                Route::patch('/{id}/toggle', 'toggleStatus')->name('toggle');
                
                // Suppression d'une période
                Route::delete('/{id}', 'destroy')->name('destroy');
                
                // Affichage d'un template
                Route::get('/{id}', function ($id) {
                    return Inertia::render('Admin/Evaluations/Templates/Show', ['id' => $id]);
                })->name('show');
            });
        });
        
        // Routes pour la gestion des utilisateurs (ADMIN uniquement)
        Route::prefix('utilisateurs')->name('utilisateurs.')->controller(\App\Http\Controllers\UtilisateursController::class)->group(function () {
            // Liste des utilisateurs avec vue hiérarchique et liste
            Route::get('/', 'index')->name('index');
            
            // Analyse des gaps de performance
            Route::get('/gaps', 'gaps')->name('gaps');
            
            // Création d'un nouvel utilisateur
            Route::get('/create', 'create')->name('create');
            Route::post('/', 'store')->name('store');
            
            // Détails d'un utilisateur avec gap analysis
            Route::get('/{matricule}', 'show')->name('show');
            
            // Édition d'un utilisateur
            Route::get('/{matricule}/edit', 'edit')->name('edit');
            Route::put('/{matricule}', 'update')->name('update');
        });
        
        // Page principale d'administration (ancienne route maintenue pour compatibilité)
        Route::get('evaluation', function () {
            return redirect()->route('admin.evaluations.management');
        })->name('admin.evaluation.index');
        
        // Gestion des templates d'évaluation
        Route::get('evaluation/templates', function () {
            return Inertia::render('Admin/Evaluations/Templates');
        })->name('admin.evaluation.templates');
        
        Route::get('evaluation/templates/create', function () {
            return Inertia::render('Admin/Evaluations/Templates/Create');
        })->name('admin.evaluation.templates.create');
        
        Route::post('evaluation/templates/store', function () {
            // Logique de stockage du template
            return redirect()->route('admin.evaluation.templates');
        })->name('admin.evaluation.templates.store');
        
        Route::get('evaluation/templates/{id}/edit', function ($id) {
            // Récupérer les données du template depuis la base de données
            $template = []; // À remplacer par la récupération réelle du template
            return Inertia::render('Admin/Evaluations/Templates/Edit', ['template' => $template]);
        })->name('admin.evaluation.templates.edit');
        
        Route::put('evaluation/templates/{id}', function ($id) {
            // Logique de mise à jour du template
            return redirect()->route('admin.evaluation.templates');
        })->name('admin.evaluation.templates.update');
        
        // Nouvelle route pour la gestion des templates d'évaluation
        Route::get('evaluation/templates/{id}/duplicate', function ($id) {
            // Logique de duplication du template
            return redirect()->route('admin.evaluation.templates');
        })->name('admin.evaluation.templates.duplicate');

    });
    
    // Route de test pour vérifier l'authentification
    Route::get('test-auth', function () {
        $user = Auth::user();
        return response()->json([
            'authenticated' => Auth::check(),
            'user' => $user ? [
                'matricule' => $user->matricule,
                'nom' => $user->nom,
                'prenom' => $user->prenom,
                'role_nom' => $user->role_nom,
            ] : null
        ]);
    })->name('test.auth');
    
    // Route de test pour vérifier la redirection basée sur les rôles
    Route::get('test-redirection', function () {
        return Inertia::render('Auth/TestRedirection');
    })->name('test.redirection');
});

require __DIR__.'/settings.php';
require __DIR__.'/auth.php';
