<?php

namespace App\Models\Core;

use Illuminate\Database\Eloquent\Factories\HasFactory;

class Permission extends CoreModel
{
    use HasFactory;
    
    /**
     * La table associée au modèle.
     *
     * @var string
     */
    protected $table = 'permissions';
    
    /**
     * La clé primaire associée à la table.
     *
     * @var string
     */
    protected $primaryKey = 'id_permission';
    
    /**
     * Les attributs qui sont assignables en masse.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'nom_permission',
        'description',
        'code',
        'module',
    ];
    
    /**
     * Relation avec les rôles
     */
    public function roles()
    {
        return $this->belongsToMany(
            \App\Models\Role::class,
            'role_permissions',
            'id_permission',
            'id_role'
        );
    }
    
    /**
     * Vérifie si un utilisateur a une permission spécifique
     * 
     * @param \App\Models\Utilisateur $utilisateur
     * @param string $permissionCode
     * @return bool
     */
    public static function utilisateurHasPermission($utilisateur, $permissionCode)
    {
        $role = \App\Models\Role::find($utilisateur->id_role);
        
        if (!$role) {
            return false;
        }
        
        return $role->permissions()
            ->where('code', $permissionCode)
            ->exists();
    }
    
    /**
     * Récupère toutes les permissions pour un rôle spécifique
     * 
     * @param string $id_role
     * @return \Illuminate\Database\Eloquent\Collection
     */
    public static function getPermissionsForRole($id_role)
    {
        $role = \App\Models\Role::find($id_role);
        
        if (!$role) {
            return collect([]);
        }
        
        return $role->permissions;
    }
}
