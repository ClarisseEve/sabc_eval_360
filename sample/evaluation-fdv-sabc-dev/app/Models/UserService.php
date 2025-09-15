<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class UserService extends Model
{
    use HasFactory;

    protected $table = 'user_service';
    protected $primaryKey = 'id';

    protected $fillable = [
        'id_user',
        'id_service',
        'id',
    ];
}
