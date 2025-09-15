<?php

return [
    /*
    |--------------------------------------------------------------------------
    | Configuration de sécurité SABC Eval360
    |--------------------------------------------------------------------------
    |
    | Ce fichier contient les paramètres de sécurité pour l'application SABC Eval360
    | conformément aux règles métier et aux standards de sécurité.
    |
    */

    // Paramètres de journalisation sécurisée
    'logging' => [
        // Données sensibles à ne jamais journaliser
        'masked_fields' => [
            'password', 'mot_de_passe', 'token', 'api_key', 'secret',
            'telephone', 'phone', 'adresse', 'address', 'code_postal',
            'carte_credit', 'credit_card', 'cvv', 'cvc'
        ],
        
        // Niveaux de journalisation par environnement
        'log_levels' => [
            'production' => 'error',
            'staging' => 'warning',
            'development' => 'debug',
            'local' => 'debug',
        ],
    ],
    
    // Configuration des en-têtes HTTP de sécurité
    'headers' => [
        'X-Content-Type-Options' => 'nosniff',
        'X-Frame-Options' => 'SAMEORIGIN',
        'X-XSS-Protection' => '1; mode=block',
        'Referrer-Policy' => 'strict-origin-when-cross-origin',
        // CSP adaptée pour le développement et la production
        'Content-Security-Policy' => env('APP_ENV') === 'production' 
            ? "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; img-src 'self' data: https:; font-src 'self' https://fonts.gstatic.com; connect-src 'self'; form-action 'self';"
            : null, // Désactiver la CSP en développement pour éviter les problèmes d'authentification
        // HSTS uniquement en production avec HTTPS
        'Strict-Transport-Security' => env('APP_ENV') === 'production' && str_starts_with(env('APP_URL', ''), 'https') 
            ? 'max-age=31536000; includeSubDomains' 
            : null,
    ],
    
    // Configuration de la protection CSRF
    'csrf' => [
        'refresh_after_login' => true,
        'refresh_after_logout' => true,
    ],
    
    // Configuration de la limitation de taux pour l'authentification
    'rate_limiting' => [
        'login' => [
            'max_attempts' => 5,
            'decay_minutes' => 10,
        ],
        'password_reset' => [
            'max_attempts' => 3,
            'decay_minutes' => 60,
        ],
        'api' => [
            'max_attempts' => 60,
            'decay_minutes' => 1,
        ],
    ],
];
