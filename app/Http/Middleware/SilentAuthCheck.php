<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Symfony\Component\HttpFoundation\Response;

class SilentAuthCheck
{
    /**
     * Middleware pour gérer les vérifications d'authentification de manière silencieuse
     * sans générer de logs ou d'erreurs visibles qui pourraient exposer des informations
     *
     * @param  \Illuminate\Http\Request  $request
     * @param  \Closure  $next
     * @return mixed
     */
    public function handle(Request $request, Closure $next)
    {
        // Désactiver temporairement les logs pour cette requête si c'est une vérification d'auth
        if ($this->isAuthCheckRequest($request)) {
            // En production, ne pas logger les tentatives d'authentification échouées
            if (app()->environment('production')) {
                Log::getLogger()->pushHandler(new \Monolog\Handler\NullHandler());
            }
        }

        $response = $next($request);

        // Si c'est une réponse 401 pour une vérification d'auth, la rendre silencieuse
        if ($this->isAuthCheckRequest($request) && $response->getStatusCode() === 401) {
            // Supprimer les en-têtes qui pourraient révéler des informations
            $response->headers->remove('WWW-Authenticate');
            
            // Ajouter le token CSRF à la réponse pour faciliter l'authentification
            $response->headers->set('X-CSRF-TOKEN', csrf_token());
            
            // Retourner une réponse JSON propre sans détails
            if ($request->expectsJson()) {
                return response()->json(['authenticated' => false], 401);
            }
        }

        return $response;
    }

    /**
     * Détermine si la requête est une vérification d'authentification
     *
     * @param Request $request
     * @return bool
     */
    private function isAuthCheckRequest(Request $request): bool
    {
        return $request->is('auth/check') || 
               $request->is('api/user') || 
               str_contains($request->path(), 'auth/check');
    }
}
