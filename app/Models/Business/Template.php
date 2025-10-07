<?php

namespace App\Models\Business;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Concerns\HasUuids;

class Template extends Model
{
    use HasUuids;

    protected $connection = 'pgsql';
    protected $table = 'templates';
    protected $primaryKey = 'id_template';
    public $incrementing = false;
    protected $keyType = 'string';

    protected $fillable = [
        'nom', 'description', 'statut', 'version', 'evaluated_role', 'meta_json'
    ];

    protected $casts = [
        'meta_json' => 'array',
    ];

    public function items()
    {
        return $this->hasMany(TemplateItem::class, 'template_id', 'id_template')
            ->orderBy('section_order')
            ->orderBy('ordre');
    }

    public function evaluatorRoles()
    {
        return $this->hasMany(TemplateEvaluatorRole::class, 'template_id', 'id_template');
    }
}
