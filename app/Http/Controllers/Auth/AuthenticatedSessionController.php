<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\LoginRequest;
use App\Providers\RouteServiceProvider;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Route;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response as InertiaResponse;

class AuthenticatedSessionController extends Controller
{
    /**
     * Display the login view.
     */
    public function create(): InertiaResponse
    {
        // Vérifier si l'utilisateur est déjà authentifié
        if (Auth::check()) {
            return Inertia::render('Common/RoleRedirector');
        }
        
        return Inertia::render('Auth/Login');
    }

    /**
     * Handle an incoming authentication request.
     */
    public function store(LoginRequest $request): RedirectResponse|InertiaResponse
    {
        $request->authenticate();
        $request->session()->regenerate();
        
        // Récupérer les informations de l'utilisateur pour le logging
        $user = auth()->user();
        \Log::info('Utilisateur authentifié avec succès', [
            'matricule' => $user->matricule,
            'role' => $user->role_nom,
            'region' => $user->region_nom ?? 'Non définie'
        ]);
        
        // Redirection directe vers le tableau de bord spécifique au rôle
        // Conforme aux règles métier SABC pour la hiérarchie organisationnelle
        $dashboardRoutes = [
            // Administration
            'ADMIN' => 'dashboard.admin',
            
            // Branche Commerciale - Régions Tanières
            'DR' => 'dashboard.dr',     // Directeur Régional
            'CDTT' => 'dashboard.cdtt', // Chef Département Trade
            'CSC' => 'dashboard.csc',   // Chef Service Commercial
            'CDV' => 'dashboard.cdv',   // Chef District Vente
            'CDS' => 'dashboard.cds',   // Chef de Secteur
            
            // Branche Marketing
            'RTM' => 'dashboard.rtm',   // Regional Trade Marketing
            'TMO' => 'dashboard.tmo',   // Trade Marketing Operator
            'SRMO' => 'dashboard.srmo', // Superviseur Regional Marketing Operation
            'SS' => 'dashboard.ss',     // Superviseur Sponsoring
            'AS' => 'dashboard.as'      // Assistant Superviseur Sponsoring
        ];
        
        $roleName = strtoupper($user->role_nom);
        
        // Assurer que la session est correctement sauvegardée
        session()->save();
        
        // Pour Inertia, au lieu de faire une redirection, retourner directement la page du tableau de bord
        // Cela évite les problèmes de session entre la redirection et l'accès à la page protégée
        
        \Log::info('Retour direct de la page tableau de bord pour Inertia', [
            'role' => $roleName,
            'user_matricule' => $user->matricule
        ]);
        
        // Déterminer quelle page retourner selon le rôle
        $dashboardPages = [
            'ADMIN' => 'Admin/Dashboard/index',
            'DR' => 'DR/Dashboard/index',
            'CDTT' => 'CDTT/Dashboard/index',
            'CSC' => 'CSC/Dashboard/index',
            'CDV' => 'CDV/Dashboard/index', 
            'CDS' => 'CDS/Dashboard/index',
            'RTM' => 'RTM/Dashboard/index',
            'SRMO' => 'SRMO/Dashboard/index',
            'TMO' => 'TMO/Dashboard/index',
            'SS' => 'SS/Dashboard/index',
            'AS' => 'AS/Dashboard/index'
        ];
        
        $dashboardPage = $dashboardPages[$roleName] ?? 'Admin/Dashboard/index';
        
        \Log::info('Rendu direct de la page tableau de bord', [
            'role' => $roleName,
            'page' => $dashboardPage
        ]);
        
        // Retourner directement la page Inertia au lieu de faire une redirection
        return Inertia::render($dashboardPage, [
            'user' => [
                'matricule' => $user->matricule,
                'nom' => $user->nom,
                'prenom' => $user->prenom,
                'email' => $user->email,
                'role' => $user->role_nom,
                'region' => $user->region_nom,
                'est_admin' => $user->est_admin
            ]
        ]);
    }

    /**
     * Destroy an authenticated session.
     */
    public function destroy(Request $request): RedirectResponse
    {
        Auth::guard('web')->logout();

        $request->session()->invalidate();

        $request->session()->regenerateToken();

        return redirect('/');
    }
}
