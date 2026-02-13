<?php

namespace App\Exceptions;

use Exception;

class PeriodeNonModifiableException extends Exception
{
    /**
     * Créer une nouvelle instance de l'exception
     *
     * @param string $message
     * @param int $code
     * @param \Throwable|null $previous
     */
    public function __construct(string $message = "Cette période ne peut plus être modifiée", int $code = 403, ?\Throwable $previous = null)
    {
        parent::__construct($message, $code, $previous);
    }
}
