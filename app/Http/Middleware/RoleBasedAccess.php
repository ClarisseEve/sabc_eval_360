<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Route;
use Illuminate\Support\Str;
use App\Models\Utilisateur;
use Symfony\Component\HttpFoundation\Response;

class RoleBasedAccess
{
    /**
     * Gère l'accès aux routes en fonction du rôle de l'utilisateur,
     * vérifie les permissions et redirige vers le tableau de bord approprié.
     * Ce middleware combine les fonctionnalités de vérification de rôle et de redirection.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next, ...$roles): Response
    {
        // Vérifier si l'utilisateur est authentifié de plusieurs façons
        $isAuthenticated = Auth::check();
        $user = Auth::user();
        $sessionHasUser = $request->session()->has('auth.user_id');
        $sessionId = $request->session()->getId();
        
        Log::info('RoleBasedAccess - Vérification d\'authentification détaillée', [
            'is_authenticated' => $isAuthenticated,
            'user_exists' => $user ? true : false,
            'user_matricule' => $user ? $user->matricule : null,
            'user_role' => $user ? $user->role_nom : null,
            'session_has_user' => $sessionHasUser,
            'request_path' => $request->path(),
            'request_url' => $request->url(),
            'request_method' => $request->method(),
            'required_roles' => $roles,
            'session_id' => $sessionId,
            'cookies' => count($request->cookies->all()),
        ]);
        
        // Vérifier si la requête est une requête AJAX/Inertia
        $isInertiaRequest = $request->header('X-Inertia') === 'true';
        
        // Si l'utilisateur n'est pas authentifié selon Auth::check()
        if (!$isAuthenticated) {
            // Tentative de récupération de l'utilisateur depuis la session ou cookie remember
            if ($sessionHasUser || $cookieHasRemember) {
                // Essayer de récupérer l'utilisateur depuis la session
                $userId = session('auth.user_id');
                
                if (!$userId) {
                    // Essayer de récupérer l'ID utilisateur depuis la clé de session Laravel standard
                    $userId = session('login_web_59ba36addc2b2f9401580f014c7f58ea4e30989d');
                }
                
                if ($userId) {
                    $user = Utilisateur::find($userId);
                    
                    if ($user) {
                        // Reconnecter l'utilisateur manuellement
                        Auth::login($user);
                        Log::info("RoleBasedAccess: Utilisateur reconnecté depuis la session", [
                            'user_id' => $userId,
                            'session_id' => $sessionId
                        ]);
                    } else {
                        Log::warning("RoleBasedAccess: Utilisateur introuvable malgré ID en session", [
                            'user_id' => $userId,
                            'session_id' => $sessionId
                        ]);
                        
                        // Si c'est une requête Inertia, renvoyer une réponse 409 pour forcer un rechargement
                        if ($isInertiaRequest) {
                            return response()->json(['message' => 'Session expirée'], 409);
                        }
                        
                        return redirect()->route('login');
                    }
                } else if ($cookieHasRemember) {
                    // Laisser Laravel essayer de reconnecter via le cookie remember
                    // Cette partie est gérée automatiquement par le middleware auth
                    Log::info("RoleBasedAccess: Tentative de reconnexion via cookie remember");
                }
            } else {
                Log::warning("RoleBasedAccess: Utilisateur non authentifié et non présent en session", [
                    'session_id' => $sessionId
                ]);
                
                // Si c'est une requête Inertia, renvoyer une réponse 409 pour forcer un rechargement
                if ($isInertiaRequest) {
                    return response()->json(['message' => 'Session expirée'], 409);
                }
                
                return redirect()->route('login');
            }
        }
        
        // À ce stade, l'utilisateur devrait être authentifié
        $user = Auth::user();
        
        // Double vérification que l'utilisateur est bien authentifié
        if (!$user) {
            Log::error("RoleBasedAccess: Auth::user() est null malgré Auth::check() positif");
            
            // Si c'est une requête Inertia, renvoyer une réponse 409 pour forcer un rechargement
            if ($isInertiaRequest) {
                return response()->json(['message' => 'Session expirée'], 409);
            }
            
            return redirect()->route('login');
        }
        
        // Régénérer l'ID de session pour éviter la fixation de session
        if (!$request->session()->has('_regenerated')) {
            $request->session()->put('_regenerated', true);
            $request->session()->regenerate();
        }
        
        // Si nous sommes sur la route /dashboard, rediriger vers le dashboard spécifique au rôle
        if ($request->is('dashboard')) {
            return $this->redirectToDashboard($user);
        }
        
        // Si aucun rôle n'est spécifié, autoriser l'accès
        if (empty($roles)) {
            return $next($request);
        }
        
        // Vérifier si l'utilisateur a l'un des rôles requis
        $userRoleRaw = $user->role_nom ?? $user->role ?? '';
        $userRole = strtolower($userRoleRaw);
        $normalizedUserRole = $this->normalizeRoleName($userRoleRaw);

        $normalizedRequiredRoles = array_map(function ($role) {
            if ($role === '*') {
                return '*';
            }

            return $this->normalizeRoleName($role);
        }, $roles);

        if (
            in_array('*', $roles, true) ||
            in_array($userRole, array_map('strtolower', $roles), true) ||
            in_array($normalizedUserRole, $normalizedRequiredRoles, true)
        ) {
            return $next($request);
        }
        
        // Rediriger vers le dashboard approprié si l'utilisateur n'a pas le bon rôle
        Log::notice("RoleBasedAccess: Accès refusé - rôle non autorisé", [
            'user_role' => $userRole,
            'normalized_user_role' => $normalizedUserRole,
            'required_roles' => $roles,
            'normalized_required_roles' => $normalizedRequiredRoles,
            'url' => $request->url()
        ]);
        
        return $this->redirectToDashboard($user);
    }
    
    /**
     * Redirige l'utilisateur vers son tableau de bord en fonction de son rôle et du type de région.
     * Cette méthode est utilisée à la fois pour les redirections de la route /dashboard
     * et pour les redirections en cas d'accès non autorisé.
     *
     * @param \App\Models\Utilisateur $user L'objet utilisateur
     * @return \Illuminate\Http\RedirectResponse
     */
    private function redirectToDashboard($user)
    {
        // S'assurer que nous avons un objet utilisateur valide
        if (!is_object($user) || !($user instanceof \App\Models\Utilisateur)) {
            Log::error("RoleBasedAccess: redirectToDashboard a reçu un paramètre invalide", [
                'user_type' => gettype($user),
                'is_object' => is_object($user),
                'class' => is_object($user) ? get_class($user) : 'N/A'
            ]);
            return redirect()->route('login');
        }
        
        // Récupérer le rôle de l'utilisateur et le normaliser en minuscules
        $roleName = strtolower(trim($user->role_nom));
        $regionType = strtolower(trim($user->type_region ?? ''));
        $isTaniere = $regionType === 'taniere' || (isset($user->region) && $user->region->est_taniere);
        $branchId = $user->id_branche;
        
        Log::info('RoleBasedAccess: Détermination du tableau de bord', [
            'role' => $roleName,
            'user_matricule' => $user->matricule,
            'region' => $user->region_nom,
            'type_region' => $regionType,
            'est_taniere' => $isTaniere ? 'oui' : 'non',
            'id_branche' => $branchId
        ]);
        
        // Mapper les rôles aux routes de tableau de bord correspondantes selon les règles métier SABC
        // Prendre en compte la distinction entre régions tanières et non-tanières
        $dashboardRoutes = [
            // Administration - indépendant du type de région
            'admin' => 'dashboard.admin',
            
            // Branche Commerciale - Régions Tanières (5 niveaux)
            'taniere' => [
                // Branche Commerciale
                'dr' => 'dashboard.dr.taniere',
                'cdtt' => 'dashboard.cdtt',
                'csc' => 'dashboard.csc.taniere',
                'cdv' => 'dashboard.cdv',
                'cds' => 'dashboard.cds.taniere',
                
                // Branche Marketing
                'rtm' => 'dashboard.rtm',
                'tmo' => 'dashboard.tmo.taniere',
                'ss' => 'dashboard.ss',
                'as' => 'dashboard.as'
            ],
            
            // Branche Commerciale - Régions Non-Tanières (3 niveaux)
            'non-taniere' => [
                // Branche Commerciale
                'dr' => 'dashboard.dr.non-taniere',
                'csc' => 'dashboard.csc.non-taniere',
                'cds' => 'dashboard.cds.non-taniere',
                
                // Branche Marketing
                'srmo' => 'dashboard.srmo',
                'tmo' => 'dashboard.tmo.non-taniere'
            ]
        ];
        
        // Routes génériques (fallback si les routes spécifiques n'existent pas)
        $genericRoutes = [
            'dr' => 'dashboard.dr',
            'cdtt' => 'dashboard.cdtt',
            'csc' => 'dashboard.csc',
            'cdv' => 'dashboard.cdv',
            'cds' => 'dashboard.cds',
            'rtm' => 'dashboard.rtm',
            'tmo' => 'dashboard.tmo',
            'srmo' => 'dashboard.srmo',
            'ss' => 'dashboard.ss',
            'as' => 'dashboard.as'
        ];
        
        // 1. Vérifier d'abord les routes spécifiques au type de région
        $regionKey = $isTaniere ? 'taniere' : 'non-taniere';
        if (isset($dashboardRoutes[$regionKey][$roleName])) {
            $route = $dashboardRoutes[$regionKey][$roleName];
            if (Route::has($route)) {
                Log::info('RoleBasedAccess: Redirection vers tableau de bord spécifique au type de région', [
                    'route' => $route,
                    'role' => $roleName,
                    'region_type' => $regionKey
                ]);
                return redirect()->route($route);
            }
        }
        
        // 2. Vérifier les routes génériques
        if (isset($genericRoutes[$roleName])) {
            $route = $genericRoutes[$roleName];
            if (Route::has($route)) {
                Log::info('RoleBasedAccess: Redirection vers tableau de bord générique', [
                    'route' => $route,
                    'role' => $roleName
                ]);
                return redirect()->route($route);
            }
        }
        
        // 3. Vérifier une route par convention de nommage
        $conventionRoute = 'dashboard.' . $roleName;
        if (Route::has($conventionRoute)) {
            Log::info('RoleBasedAccess: Redirection vers tableau de bord par convention de nommage', [
                'route' => $conventionRoute,
                'role' => $roleName
            ]);
            return redirect()->route($conventionRoute);
        }
        
        // 4. Si c'est un administrateur, rediriger vers le tableau de bord admin
        if ($roleName === 'admin' || $user->est_admin) {
            return redirect()->route('dashboard.admin');
        }
        
        // 5. Par défaut, rediriger vers une page d'accueil générique
        Log::warning('RoleBasedAccess: Rôle non reconnu pour redirection tableau de bord', [
            'role' => $roleName,
            'user_matricule' => $user->matricule,
            'region' => $user->region_nom,
            'est_taniere' => $isTaniere ? 'oui' : 'non'
        ]);
        
        // Rediriger vers la page de diagnostic d'authentification en cas d'échec
        // Cela permettra de diagnostiquer plus facilement les problèmes
        return redirect()->route('auth.debug', [
            'role_non_reconnu' => $roleName,
            'region_type' => $regionKey
        ]);
    }

    private function normalizeRoleName(?string $role): string
    {
        if (!$role) {
            return '';
        }

        $normalized = Str::upper(Str::ascii(trim($role)));

        if (str_contains($normalized, 'ADMIN')) {
            return 'ADMIN';
        }

        if ($normalized === 'DR' || str_contains($normalized, 'DIRECTEUR REGIONAL')) {
            return 'DR';
        }

        if (str_contains($normalized, 'CDTT') || str_contains($normalized, 'CHEF DEPARTEMENT TRADE')) {
            return 'CDTT';
        }

        if ($normalized === 'CSC' || str_contains($normalized, 'CHEF SERVICE COMMERCIAL')) {
            return 'CSC';
        }

        if ($normalized === 'CDV' || str_contains($normalized, 'CHEF DISTRICT VENTE')) {
            return 'CDV';
        }

        if ($normalized === 'CDS' || str_contains($normalized, 'CHEF DE SECTEUR')) {
            return 'CDS';
        }

        if ($normalized === 'RTM' || str_contains($normalized, 'REGIONAL TRADE MARKETING')) {
            return 'RTM';
        }

        if ($normalized === 'TMO' || str_contains($normalized, 'TRADE MARKETING OPERATOR')) {
            return 'TMO';
        }

        if ($normalized === 'SRMO' || str_contains($normalized, 'SUPERVISEUR REGIONAL MARKETING OPERATIONNEL')) {
            return 'SRMO';
        }

        if ($normalized === 'SS' || str_contains($normalized, 'SUPERVISEUR SPONSORING')) {
            return 'SS';
        }

        if ($normalized === 'AS' || str_contains($normalized, 'ASSISTANT SUPERVISEUR SPONSORING')) {
            return 'AS';
        }

        return 'CSC';
    }
}
