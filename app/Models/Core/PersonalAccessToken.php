<?php

namespace App\Models\Core;

use Laravel\Sanctum\PersonalAccessToken as SanctumPersonalAccessToken;

class PersonalAccessToken extends SanctumPersonalAccessToken
{
    /**
     * Spécifie la connexion à la base de données MySQL (sabc_core)
     * pour les tokens d'accès personnels de Sanctum
     *
     * @var string
     */
    protected $connection = 'mysql';
}
