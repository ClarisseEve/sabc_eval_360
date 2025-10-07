<?php

namespace App\Models\Business;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Concerns\HasUuids;

class TemplateItem extends Model
{
    use HasUuids;

    protected $connection = 'pgsql';
    protected $table = 'template_items';
    protected $primaryKey = 'id';
    public $incrementing = false;
    protected $keyType = 'string';

    protected $fillable = [
        'template_id', 'competence_id', 'ordre', 'poids_critere',
        'require_comment_if_below', 'scale_min', 'scale_max',
        'section_label', 'section_order'
    ];

    public function template()
    {
        return $this->belongsTo(Template::class, 'template_id', 'id_template');
    }

    public function competence()
    {
        return $this->belongsTo(Competency::class, 'competence_id', 'id');
    }
}
