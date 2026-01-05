<?php

use App\Services\SecureLoggingService;
use Illuminate\Support\Facades\Log;

test('secure logging masks sensitive context and message', function () {
    Log::shouldReceive('log')
        ->once()
        ->withArgs(function (string $level, string $message, array $context) {
            return $level === 'info'
                && str_contains($message, '***EMAIL***')
                && str_contains($message, '***PHONE***')
                && str_contains($message, '***MATRICULE***')
                && ($context['password'] ?? null) === '***MASKED***'
                && ($context['email'] ?? null) === '***MASKED***'
                && ($context['profil']['telephone'] ?? null) === '***MASKED***';
        });

    SecureLoggingService::secureLog('info', 'Contact test@sabc.cm +237699001122 US-01', [
        'password' => 'secret',
        'email' => 'test@sabc.cm',
        'profil' => [
            'telephone' => '+237699001122',
        ],
    ]);
});
