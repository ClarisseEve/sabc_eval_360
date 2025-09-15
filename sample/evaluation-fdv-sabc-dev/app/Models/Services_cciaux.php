<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Services_cciaux extends Model
{
    use HasFactory;

    protected $table = 'services_cciaux';
    public $timestamps = false;
    protected $fillable = [
        'sce_ccial',
        'taniere',
        'region'
    ];

    protected $casts = [
        'taniere' => 'boolean'
    ];

    public function region()
    {
        return $this->belongsTo(Regions::class, 'regions', 'id');
    }

    public function districts()
    {
        return $this->hasMany(District::class, 'id_service');
    }

    public function users()
    {
        return $this->belongsToMany(User::class, 'user_service', 'id_service', 'id_user')
                    ->withPivot('id');
    }
}
