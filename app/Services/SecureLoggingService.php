<?php

namespace App\Services;

use Illuminate\Support\Facades\Log;

class SecureLoggingService
{
    /**
     * Champs sensibles à masquer dans les logs
     */
    private static array $sensitiveFields = [
        'password', 'mot_de_passe', 'token', 'api_key', 'secret',
        'telephone', 'phone', 'adresse', 'address', 'matricule',
        'email', 'carte_credit', 'credit_card', 'cvv', 'cvc'
    ];

    /**
     * Log sécurisé qui masque automatiquement les informations sensibles
     *
     * @param string $level
     * @param string $message
     * @param array $context
     * @return void
     */
    public static function secureLog(string $level, string $message, array $context = []): void
    {
        // En production, ne pas logger les tentatives d'authentification échouées
        if (self::isProduction() && str_contains($message, 'auth')) {
            return;
        }

        // Masquer les informations sensibles dans le contexte
        $sanitizedContext = self::sanitizeContext($context);

        // Masquer les informations sensibles dans le message
        $sanitizedMessage = self::sanitizeMessage($message);

        Log::log($level, $sanitizedMessage, $sanitizedContext);
    }

    /**
     * Masque les informations sensibles dans le contexte
     *
     * @param array $context
     * @return array
     */
    private static function sanitizeContext(array $context): array
    {
        $sanitized = [];

        foreach ($context as $key => $value) {
            if (self::isSensitiveField($key)) {
                $sanitized[$key] = '***MASKED***';
            } elseif (is_array($value)) {
                $sanitized[$key] = self::sanitizeContext($value);
            } else {
                $sanitized[$key] = $value;
            }
        }

        return $sanitized;
    }

    /**
     * Masque les informations sensibles dans le message
     *
     * @param string $message
     * @return string
     */
    private static function sanitizeMessage(string $message): string
    {
        // Masquer les adresses email
        $message = preg_replace('/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/', '***EMAIL***', $message);
        
        // Masquer les matricules (format US-XX)
        $message = preg_replace('/US-\d+/', '***MATRICULE***', $message);
        
        // Masquer les numéros de téléphone
        $message = preg_replace('/\+?[0-9]{8,15}/', '***PHONE***', $message);

        return $message;
    }

    /**
     * Vérifie si un champ est sensible
     *
     * @param string $fieldName
     * @return bool
     */
    private static function isSensitiveField(string $fieldName): bool
    {
        $fieldName = strtolower($fieldName);
        
        foreach (self::$sensitiveFields as $sensitiveField) {
            if (str_contains($fieldName, $sensitiveField)) {
                return true;
            }
        }

        return false;
    }

    /**
     * Log d'authentification sécurisé
     *
     * @param string $action
     * @param array $context
     * @return void
     */
    public static function logAuthAction(string $action, array $context = []): void
    {
        // En production, ne pas logger les actions d'authentification
        if (self::isProduction()) {
            return;
        }

        self::secureLog('info', "Action d'authentification: {$action}", $context);
    }

    private static function isProduction(): bool
    {
        if (!function_exists('app')) {
            return false;
        }

        $app = app();

        return method_exists($app, 'environment') && $app->environment('production');
    }
}
