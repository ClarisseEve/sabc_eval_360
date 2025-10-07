<?php

namespace App\Models\Business;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Concerns\HasUuids;

class TemplateEvaluatorRole extends Model
{
    use HasUuids;

    protected $connection = 'pgsql';
    protected $table = 'template_evaluator_roles';
    protected $primaryKey = 'id';
    public $incrementing = false;
    protected $keyType = 'string';

    protected $fillable = [
        'template_id', 'role_evaluateur'
    ];

    public function template()
    {
        return $this->belongsTo(Template::class, 'template_id', 'id_template');
    }
}
