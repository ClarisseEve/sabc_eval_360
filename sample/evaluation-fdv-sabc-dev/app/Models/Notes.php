<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Notes extends Model
{
    use HasFactory;

    protected $table = 'notes';
    protected $primaryKey = 'id_note';

    protected $fillable = [
        'id_utilisateur',
        'nom_utilisateur',
        'notes',
        'total',
        'creator_id'
    ];

    protected $casts = [
        'notes' => 'json'
    ];

    public function user()
    {
        return $this->belongsTo(User::class, 'id_utilisateur', 'matricule');
    }

    public function creator()
    {
        return $this->belongsTo(User::class, 'creator_id', 'matricule');
    }
}
