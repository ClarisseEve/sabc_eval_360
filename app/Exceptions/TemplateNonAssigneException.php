<?php

namespace App\Exceptions;

use Exception;

class TemplateNonAssigneException extends Exception
{
    /**
     * Créer une nouvelle instance de l'exception
     *
     * @param string $message
     * @param int $code
     * @param \Throwable|null $previous
     */
    public function __construct(string $message = "Aucun template n'est assigné pour ce rôle et cette période", int $code = 404, ?\Throwable $previous = null)
    {
        parent::__construct($message, $code, $previous);
    }
}
