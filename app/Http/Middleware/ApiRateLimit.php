<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\RateLimiter;
use Symfony\Component\HttpFoundation\Response;

/**
 * Middleware de limitation de débit pour les API
 * Conforme aux règles de sécurité SABC
 */
class ApiRateLimit
{
    /**
     * Gère la limitation de débit pour les requêtes API
     *
     * @param  \Illuminate\Http\Request  $request
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     * @return \Symfony\Component\HttpFoundation\Response
     */
    public function handle(Request $request, Closure $next): Response
    {
        // Clé unique basée sur l'IP et l'identifiant utilisateur si authentifié
        $key = $request->ip() . '|' . ($request->user() ? $request->user()->matricule : 'guest');
        
        // Limite à 60 requêtes par minute
        if (RateLimiter::tooManyAttempts($key, 60)) {
            return response()->json([
                'message' => 'Trop de requêtes. Veuillez réessayer plus tard.',
                'error' => 'too_many_requests'
            ], 429);
        }
        
        // Incrémenter le compteur de tentatives
        RateLimiter::hit($key, 60);
        
        // Ajouter les en-têtes de limitation de débit
        $response = $next($request);
        $response->headers->add([
            'X-RateLimit-Limit' => 60,
            'X-RateLimit-Remaining' => RateLimiter::remaining($key, 60),
        ]);
        
        return $response;
    }
}
