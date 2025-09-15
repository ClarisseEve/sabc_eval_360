<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Providers\RouteServiceProvider;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

class ConfirmablePasswordController extends Controller
{
    /**
     * Show the confirm password view.
     */
    public function show(): Response
    {
        return Inertia::render('auth/ConfirmPassword');
    }

    /**
     * Confirm the user's password.
     */
    public function store(Request $request): RedirectResponse
    {
        if (! Auth::guard('web')->validate([
            'matricule' => $request->user()->matricule,
            'password' => $request->password,
        ])) {
            throw ValidationException::withMessages([
                'password' => __('auth.password'),
            ]);
        }

        $request->session()->put('auth.password_confirmed_at', time());
        
        // Récupération du rôle de l'utilisateur pour redirection spécifique
        $user = $request->user();
        $roleName = strtoupper($user->role_nom);
        
        // Mapping des rôles vers les routes de tableau de bord
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
        
        // Redirection vers le tableau de bord spécifique ou admin par défaut
        $targetRoute = isset($dashboardRoutes[$roleName]) ? $dashboardRoutes[$roleName] : 'dashboard.admin';
        return redirect()->intended(route($targetRoute));
    }
}
