<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class District extends Model
{
    use HasFactory;

    protected $fillable = [
        'district',
        'id_service'
    ];

    public function service()
    {
        return $this->belongsTo(Services_cciaux::class, 'id_service');
    }

    public function users()
    {
        return $this->belongsToMany(User::class, 'user_district', 'id_district', 'id_user')
                    ->withPivot('id');
    }
}
