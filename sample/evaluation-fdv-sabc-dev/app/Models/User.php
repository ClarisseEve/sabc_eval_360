<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
    use HasApiTokens, HasFactory, Notifiable;

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    
     protected $primaryKey = 'matricule';
     protected $keyType = 'int';
     public $incrementing = false;
 
     protected $fillable = [
         'matricule',
         'name',
         'surname',
         'login',
         'email',
         'type',
         'parent_id',
         'password',
         'statut',
     ];
     
     protected $hidden = [
         'password',
         'remember_token',
     ];
 
     /**
      * Get the parent user (the supervisor)
      */
     public function parent()
     {
        return $this->belongsTo(User::class, 'parent_id', 'matricule');
     }
 
     /**
      * Get the child users (those who report to this user)
      */
     public function children()
     {
        return $this->hasMany(User::class, 'parent_id', 'matricule');
     }
 
     /**
      * Get all child users for a specific parent
      */
     public static function getChildUsers($parentId)
     {
        return self::where('parent_id', $parentId)->get();
     }
 
     // Relationship to services
     public function service()
     {
        return $this->belongsToMany(Services_cciaux::class, 'user_service', 'id_user', 'id_service', 'matricule', 'id');
     }
     
     public function districts()
     {
        return $this->belongsToMany(District::class, 'user_district', 'id_user', 'id_district');
     }
 
     public function notes()
     {
        return $this->hasMany(Notes::class, 'id_utilisateur', 'matricule');
     }

     public function isCDCTT()
    {
        return $this->type === 'CDCTT';
    }

    public function isDR()
    {
        return $this->type === 'DR';
    }

    public function isCSC()
    {
        return $this->type === 'CSC';
    }
}
