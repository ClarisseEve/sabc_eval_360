<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Config;
use Symfony\Component\HttpFoundation\Response;

class SecurityHeaders
{
    /**
     * Ajoute des en-têtes de sécurité à toutes les réponses
     * conformément aux standards de sécurité SABC
     *
     * @param  \Illuminate\Http\Request  $request
     * @param  \Closure  $next
     * @return mixed
     */
    public function handle(Request $request, Closure $next)
    {
        try {
            $response = $next($request);
            
            // Vérifier que nous avons une réponse valide
            if (!$response || !method_exists($response, 'headers')) {
                return $response;
            }
            
            // Récupérer les en-têtes de sécurité depuis la configuration
            $securityHeaders = Config::get('security.headers', []);
            
            // Appliquer les en-têtes de sécurité à la réponse
            foreach ($securityHeaders as $headerName => $headerValue) {
                // Ne pas ajouter les en-têtes avec une valeur null
                if ($headerValue !== null && $headerValue !== '') {
                    $response->headers->set($headerName, $headerValue);
                }
            }
            
            // Supprimer les en-têtes qui pourraient révéler des informations sur le serveur
            $response->headers->remove('X-Powered-By');
            $response->headers->remove('Server');
            
            return $response;
        } catch (\Throwable $e) {
            // En cas d'erreur, laisser passer la réponse sans modification
            return $next($request);
        }
    }
}
