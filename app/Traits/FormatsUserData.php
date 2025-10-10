<?php

namespace App\Traits;

use App\Models\Utilisateur;
use Illuminate\Support\Facades\Auth;

/**
 * Trait pour formater les données utilisateur selon les standards SABC
 * 
 * Conforme aux règles métier SABC pour l'affichage cohérent des utilisateurs
 * dans tous les composants de l'interface (Header, Dashboard, etc.)
 */
trait FormatsUserData
{
    /**
     * Formate les données utilisateur pour l'affichage dans les composants UI
     * 
     * @param Utilisateur|null $user
     * @return array
     */
    protected function formatUserForUI(?Utilisateur $user = null): array
    {
        if (!$user) {
            $user = Auth::user();
        }
        
        if (!$user) {
            return [
                'name' => 'Utilisateur',
                'email' => '',
                'role' => '',
                'matricule' => '',
                'region' => '',
                'branche' => '',
                'avatar' => null,
                'full_name' => 'Utilisateur',
                'display_name' => 'Utilisateur',
                'role_display' => '',
            ];
        }
        
        return [
            'matricule' => $user->matricule,
            'name' => $this->getDisplayName($user),
            'initials' => $this->getInitials($user),
            'role' => $user->role_nom,
            'role_display' => $this->getRoleDisplay($user->role_nom),
            'avatar' => $user->avatar ?? null,
            'is_admin' => (bool) $user->est_admin,
        ];
    }
    
    /**
     * Génère le nom d'affichage selon les règles SABC
     * 
     * @param Utilisateur $user
     * @return string
     */
    private function getDisplayName(Utilisateur $user): string
    {
        $prenom = $user->prenom ?? '';
        $nom = $user->nom ?? '';
        
        if (empty($prenom) && empty($nom)) {
            return $user->matricule ?? 'Utilisateur';
        }
        
        if (empty($prenom)) {
            return $nom;
        }
        
        if (empty($nom)) {
            return $prenom;
        }
        
        // Format SABC : Prénom NOM (nom en majuscules)
        return $prenom . ' ' . strtoupper($nom);
    }
    
    /**
     * Formate le nom du rôle pour l'affichage selon les règles SABC
     * 
     * @param string|null $roleNom
     * @return string
     */
    private function getRoleDisplay(?string $roleNom): string
    {
        if (!$roleNom) {
            return '';
        }
        
        // Mapping des rôles SABC pour affichage
        $roleMapping = [
            'ADMIN' => 'Administrateur',
            'DR' => 'Directeur Régional',
            'CDTT' => 'Chef Département Trade',
            'CSC' => 'Chef Service Commercial',
            'RTM' => 'Regional Trade Marketing',
            'CDV' => 'Chef District Vente',
            'TMO' => 'Trade Marketing Operator',
            'CDS' => 'Chef de Secteur',
            'SRMO' => 'Superviseur Régional Marketing Opérationnel',
            'SS' => 'Superviseur Sponsoring',
            'AS' => 'Assistant Superviseur Sponsoring',
        ];
        
        return $roleMapping[$roleNom] ?? $roleNom;
    }

    /**
     * Retourne les initiales de l'utilisateur.
     */
    private function getInitials(Utilisateur $user): string
    {
        $parts = array_filter([
            $user->prenom ? strtoupper(substr($user->prenom, 0, 1)) : null,
            $user->nom ? strtoupper(substr($user->nom, 0, 1)) : null,
        ]);

        if (empty($parts)) {
            return strtoupper(substr($user->matricule ?? 'U', 0, 2));
        }

        return implode('', $parts);
    }
    
    /**
     * Génère les données complètes pour les pages avec titre et breadcrumb
     * 
     * @param string $pageTitle
     * @param array $breadcrumb
     * @param Utilisateur|null $user
     * @return array
     */
    protected function getPageData(string $pageTitle, array $breadcrumb = [], ?Utilisateur $user = null): array
    {
        return [
            'user' => $this->formatUserForUI($user),
            'pageTitle' => $pageTitle,
            'breadcrumb' => $breadcrumb,
            'timestamp' => now()->toISOString(),
        ];
    }
    
    /**
     * Génère les données pour les pages admin avec statistiques
     * 
     * @param string $pageTitle
     * @param array $additionalData
     * @param Utilisateur|null $user
     * @return array
     */
    protected function getAdminPageData(string $pageTitle, array $additionalData = [], ?Utilisateur $user = null): array
    {
        $baseData = $this->getPageData($pageTitle, [], $user);
        
        return array_merge($baseData, $additionalData, [
            'isAdmin' => true,
            'permissions' => $this->getUserPermissions($user),
        ]);
    }
    
    /**
     * Récupère les permissions utilisateur selon les règles SABC
     * 
     * @param Utilisateur|null $user
     * @return array
     */
    private function getUserPermissions(?Utilisateur $user = null): array
    {
        if (!$user) {
            $user = Auth::user();
        }
        
        if (!$user) {
            return [];
        }
        
        // Permissions basées sur le rôle SABC
        $rolePermissions = [
            'ADMIN' => ['manage_users', 'manage_evaluations', 'view_all_reports', 'manage_periods'],
            'DR' => ['view_region_reports', 'manage_team', 'cross_branch_evaluation'],
            'CDTT' => ['view_department_reports', 'manage_team', 'cross_branch_evaluation'],
            'CSC' => ['view_service_reports', 'manage_team', 'self_evaluation'],
            'RTM' => ['view_marketing_reports', 'manage_team', 'self_evaluation'],
            'CDV' => ['view_district_reports', 'manage_team', 'self_evaluation'],
            'TMO' => ['view_own_reports', 'self_evaluation', 'peer_evaluation'],
            'CDS' => ['view_own_reports', 'self_evaluation', 'peer_evaluation'],
            'SRMO' => ['view_marketing_reports', 'manage_team', 'self_evaluation'],
            'SS' => ['view_sponsoring_reports', 'manage_team', 'self_evaluation'],
            'AS' => ['view_own_reports', 'self_evaluation', 'peer_evaluation'],
        ];
        
        return $rolePermissions[$user->role_nom] ?? [];
    }
}
