<?php

namespace App\Helpers;

class SecurityHelper
{
    /**
     * Génère une CSP compatible avec Vite pour le développement
     * 
     * @return string|null
     */
    public static function getViteCompatibleCSP(): ?string
    {
        // En développement, désactiver complètement la CSP pour éviter les problèmes
        // d'authentification et de chargement des ressources Vite
        if (!app()->environment('production')) {
            return null;
        }
        
        // En production, utiliser une CSP stricte mais permettant l'authentification
        return "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; img-src 'self' data: https:; font-src 'self' https://fonts.gstatic.com; connect-src 'self'; form-action 'self';";
    }

    /**
     * Détermine si la CSP doit être appliquée en fonction de l'environnement
     * 
     * @return bool
     */
    public static function shouldApplyCSP(): bool
    {
        // En développement, on peut choisir de désactiver la CSP pour simplifier
        // En production, toujours l'appliquer
        return app()->environment('production') || env('FORCE_CSP_IN_DEV', false);
    }
}
