<?php

namespace App\Models\Business;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Concerns\HasUuids;

class Competency extends Model
{
    use HasUuids;

    protected $connection = 'pgsql';
    protected $table = 'competencies';
    protected $primaryKey = 'id';
    public $incrementing = false;
    protected $keyType = 'string';

    protected $fillable = [
        'libelle', 'description', 'categorie', 'actif'
    ];
}
