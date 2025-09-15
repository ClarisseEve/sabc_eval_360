<?php

namespace App\Policies;

use App\Models\Utilisateur;
use Illuminate\Auth\Access\HandlesAuthorization;

class UserPolicy
{
    use HandlesAuthorization;

    /**
     * Détermine si l'utilisateur peut voir la liste des utilisateurs
     */
    public function viewAny(Utilisateur $user): bool
    {
        // Tous les utilisateurs peuvent voir la liste (filtrée selon leurs permissions)
        return true;
    }

    /**
     * Détermine si l'utilisateur peut voir un utilisateur spécifique
     */
    public function view(Utilisateur $user, Utilisateur $targetUser): bool
    {
        // L'utilisateur peut toujours voir son propre profil
        if ($user->id_utilisateur === $targetUser->id_utilisateur) {
            return true;
        }

        // Un manager peut voir ses subordonnés directs
        if ($targetUser->id_manager === $user->id_utilisateur) {
            return true;
        }

        // DR et CDTT peuvent voir tous les utilisateurs de leur région
        if (in_array($user->role->nom_role, ['DR', 'CDTT']) && 
            $targetUser->id_region === $user->id_region) {
            return true;
        }

        // Les utilisateurs de même niveau peuvent se voir entre eux (pour évaluations par pairs)
        if ($user->role->niveau_hierarchique === $targetUser->role->niveau_hierarchique &&
            $user->id_region === $targetUser->id_region &&
            $user->role->branche === $targetUser->role->branche) {
            return true;
        }

        return false;
    }

    /**
     * Détermine si l'utilisateur peut créer un nouvel utilisateur
     */
    public function create(Utilisateur $user): bool
    {
        // Seuls les DR peuvent créer de nouveaux utilisateurs
        return $user->role->nom_role === 'DR';
    }

    /**
     * Détermine si l'utilisateur peut mettre à jour un utilisateur
     */
    public function update(Utilisateur $user, Utilisateur $targetUser): bool
    {
        // L'utilisateur peut toujours modifier son propre profil (données limitées)
        if ($user->id_utilisateur === $targetUser->id_utilisateur) {
            return true;
        }

        // DR et CDTT peuvent modifier les utilisateurs de leur région
        if (in_array($user->role->nom_role, ['DR', 'CDTT']) && 
            $targetUser->id_region === $user->id_region) {
            return true;
        }

        return false;
    }

    /**
     * Détermine si l'utilisateur peut supprimer un utilisateur
     */
    public function delete(Utilisateur $user, Utilisateur $targetUser): bool
    {
        // Seuls les DR peuvent supprimer des utilisateurs
        if ($user->role->nom_role !== 'DR') {
            return false;
        }

        // Vérifier que l'utilisateur cible est dans la même région
        if ($targetUser->id_region !== $user->id_region) {
            return false;
        }

        // Un utilisateur ne peut pas se supprimer lui-même
        if ($user->id_utilisateur === $targetUser->id_utilisateur) {
            return false;
        }

        return true;
    }

    /**
     * Détermine si l'utilisateur peut changer le rôle d'un autre utilisateur
     */
    public function changeRole(Utilisateur $user, Utilisateur $targetUser): bool
    {
        // Seuls les DR peuvent changer les rôles
        if ($user->role->nom_role !== 'DR') {
            return false;
        }

        // Vérifier que l'utilisateur cible est dans la même région
        if ($targetUser->id_region !== $user->id_region) {
            return false;
        }

        // Un DR ne peut pas changer son propre rôle
        if ($user->id_utilisateur === $targetUser->id_utilisateur) {
            return false;
        }

        return true;
    }

    /**
     * Détermine si l'utilisateur peut assigner un manager
     */
    public function assignManager(Utilisateur $user, Utilisateur $targetUser): bool
    {
        // Seuls les DR et CDTT peuvent assigner des managers
        if (!in_array($user->role->nom_role, ['DR', 'CDTT'])) {
            return false;
        }

        // Vérifier que l'utilisateur cible est dans la même région
        if ($targetUser->id_region !== $user->id_region) {
            return false;
        }

        return true;
    }

    /**
     * Détermine si l'utilisateur peut voir les subordonnés d'un autre utilisateur
     */
    public function viewSubordinates(Utilisateur $user, Utilisateur $targetUser): bool
    {
        // L'utilisateur peut voir ses propres subordonnés
        if ($user->id_utilisateur === $targetUser->id_utilisateur) {
            return true;
        }

        // Un manager peut voir les subordonnés de ses subordonnés
        $subordinates = collect();
        $this->getAllSubordinates($user, $subordinates);
        
        if ($subordinates->contains('id_utilisateur', $targetUser->id_utilisateur)) {
            return true;
        }

        // DR et CDTT peuvent voir les subordonnés de tous les utilisateurs de leur région
        if (in_array($user->role->nom_role, ['DR', 'CDTT']) && 
            $targetUser->id_region === $user->id_region) {
            return true;
        }

        return false;
    }

    /**
     * Détermine si l'utilisateur peut voir la hiérarchie
     */
    public function viewHierarchy(Utilisateur $user): bool
    {
        // Tous les utilisateurs peuvent voir la hiérarchie (filtrée selon leurs permissions)
        return true;
    }

    /**
     * Détermine si l'utilisateur peut modifier la hiérarchie
     */
    public function manageHierarchy(Utilisateur $user): bool
    {
        // Seuls les DR et CDTT peuvent gérer la hiérarchie
        return in_array($user->role->nom_role, ['DR', 'CDTT']);
    }

    /**
     * Détermine si l'utilisateur peut voir les statistiques d'un autre utilisateur
     */
    public function viewStatistics(Utilisateur $user, Utilisateur $targetUser): bool
    {
        // L'utilisateur peut voir ses propres statistiques
        if ($user->id_utilisateur === $targetUser->id_utilisateur) {
            return true;
        }

        // Un manager peut voir les statistiques de ses subordonnés directs
        if ($targetUser->id_manager === $user->id_utilisateur) {
            return true;
        }

        // DR et CDTT peuvent voir les statistiques de tous les utilisateurs de leur région
        if (in_array($user->role->nom_role, ['DR', 'CDTT']) && 
            $targetUser->id_region === $user->id_region) {
            return true;
        }

        return false;
    }

    /**
     * Détermine si l'utilisateur peut activer/désactiver un autre utilisateur
     */
    public function toggleStatus(Utilisateur $user, Utilisateur $targetUser): bool
    {
        // Seuls les DR peuvent activer/désactiver des utilisateurs
        if ($user->role->nom_role !== 'DR') {
            return false;
        }

        // Vérifier que l'utilisateur cible est dans la même région
        if ($targetUser->id_region !== $user->id_region) {
            return false;
        }

        // Un utilisateur ne peut pas se désactiver lui-même
        if ($user->id_utilisateur === $targetUser->id_utilisateur) {
            return false;
        }

        return true;
    }

    /**
     * Détermine si l'utilisateur peut réinitialiser le mot de passe d'un autre utilisateur
     */
    public function resetPassword(Utilisateur $user, Utilisateur $targetUser): bool
    {
        // DR et CDTT peuvent réinitialiser les mots de passe dans leur région
        if (in_array($user->role->nom_role, ['DR', 'CDTT']) && 
            $targetUser->id_region === $user->id_region) {
            return true;
        }

        return false;
    }

    /**
     * Détermine si l'utilisateur peut voir l'historique des connexions
     */
    public function viewLoginHistory(Utilisateur $user, Utilisateur $targetUser): bool
    {
        // L'utilisateur peut voir son propre historique
        if ($user->id_utilisateur === $targetUser->id_utilisateur) {
            return true;
        }

        // Seuls les DR peuvent voir l'historique des autres utilisateurs
        if ($user->role->nom_role === 'DR' && 
            $targetUser->id_region === $user->id_region) {
            return true;
        }

        return false;
    }

    /**
     * Détermine si l'utilisateur peut exporter la liste des utilisateurs
     */
    public function export(Utilisateur $user): bool
    {
        // Seuls les DR et CDTT peuvent exporter
        return in_array($user->role->nom_role, ['DR', 'CDTT']);
    }

    /**
     * Détermine si l'utilisateur peut importer des utilisateurs
     */
    public function import(Utilisateur $user): bool
    {
        // Seuls les DR peuvent importer des utilisateurs
        return $user->role->nom_role === 'DR';
    }

    /**
     * Détermine si l'utilisateur peut voir les notifications d'un autre utilisateur
     */
    public function viewNotifications(Utilisateur $user, Utilisateur $targetUser): bool
    {
        // L'utilisateur peut voir ses propres notifications
        if ($user->id_utilisateur === $targetUser->id_utilisateur) {
            return true;
        }

        // Seuls les DR peuvent voir les notifications des autres (pour debug)
        if ($user->role->nom_role === 'DR' && 
            $targetUser->id_region === $user->id_region) {
            return true;
        }

        return false;
    }

    /**
     * Détermine si l'utilisateur peut gérer les notifications système
     */
    public function manageNotifications(Utilisateur $user): bool
    {
        // Seuls les DR peuvent gérer les notifications système
        return $user->role->nom_role === 'DR';
    }

    /**
     * Détermine si l'utilisateur peut voir le profil complet d'un autre utilisateur
     */
    public function viewFullProfile(Utilisateur $user, Utilisateur $targetUser): bool
    {
        // L'utilisateur peut voir son propre profil complet
        if ($user->id_utilisateur === $targetUser->id_utilisateur) {
            return true;
        }

        // DR et CDTT peuvent voir les profils complets de leur région
        if (in_array($user->role->nom_role, ['DR', 'CDTT']) && 
            $targetUser->id_region === $user->id_region) {
            return true;
        }

        return false;
    }

    /**
     * Méthode helper pour récupérer tous les subordonnés récursivement
     */
    private function getAllSubordinates(Utilisateur $user, &$subordinates): void
    {
        $directSubordinates = Utilisateur::where('id_manager', $user->id_utilisateur)->get();
        
        foreach ($directSubordinates as $subordinate) {
            if (!$subordinates->contains('id_utilisateur', $subordinate->id_utilisateur)) {
                $subordinates->push($subordinate);
                $this->getAllSubordinates($subordinate, $subordinates);
            }
        }
    }
}