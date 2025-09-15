<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Symfony\Component\HttpFoundation\Response;
use Throwable;

class SecureErrorHandling
{
    /**
     * Middleware pour gérer les erreurs de manière sécurisée
     * en évitant d'exposer des informations sensibles
     *
     * @param  \Illuminate\Http\Request  $request
     * @param  \Closure  $next
     * @return mixed
     */
    public function handle(Request $request, Closure $next)
    {
        try {
            return $next($request);
        } catch (Throwable $exception) {
            // Journaliser l'erreur de manière sécurisée
            Log::error('Erreur d\'authentification', [
                'route' => $request->path(),
                'method' => $request->method(),
                'error_type' => get_class($exception),
                // Ne pas logger les détails de l'erreur en production
                'details' => app()->environment('local') ? $exception->getMessage() : 'Masqué en production'
            ]);

            // En production, retourner une réponse générique
            if (app()->environment('production')) {
                if ($request->expectsJson()) {
                    return response()->json([
                        'message' => 'Une erreur est survenue lors du traitement de votre demande.'
                    ], Response::HTTP_INTERNAL_SERVER_ERROR);
                }
                
                return redirect()->route('login')
                    ->with('status', 'Une erreur est survenue. Veuillez vous reconnecter.');
            }

            // En développement, laisser l'erreur se propager
            throw $exception;
        }
    }
}
