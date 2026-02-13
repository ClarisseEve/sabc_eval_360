<?php

namespace App\Exceptions;

use Exception;

class PeriodeChevauchementException extends Exception
{
    /**
     * Créer une nouvelle instance de l'exception
     *
     * @param string $message
     * @param int $code
     * @param \Throwable|null $previous
     */
    public function __construct(string $message = "La période chevauche une période existante", int $code = 422, ?\Throwable $previous = null)
    {
        parent::__construct($message, $code, $previous);
    }
}
