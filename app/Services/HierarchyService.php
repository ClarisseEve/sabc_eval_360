<?php

namespace App\Services;

use App\Models\Utilisateur;
use App\Models\Region;
use App\Models\Role;
use Illuminate\Support\Collection;

class HierarchyService
{
    /**
     * Récupère la hiérarchie complète d'une région
     * 
     * @param int $idRegion
     * @return array
     */
    public function getHierarchieRegion(int $idRegion): array
    {
        $region = Region::with([
            'utilisateurs.role'
        ])->find($idRegion);
        
        if (!$region) {
            return [];
        }
        
        $hierarchie = [
            'region' => [
                'id' => $region->id_region,
                'nom' => $region->nom_region,
                'type' => $region->getTypeRegionAttribute(),
                'est_taniere' => $region->est_taniere,
            ],
            'structure' => $this->construireStructureHierarchique($region),
            'utilisateurs' => $this->organiserUtilisateursParNiveau($region),
        ];
        
        return $hierarchie;
    }
    
    /**
     * Construit la structure hiérarchique selon le type de région
     * 
     * @param Region $region
     * @return array
     */
    private function construireStructureHierarchique(Region $region): array
    {
        $structure = [];
        
        if ($region->est_taniere) {
            // Structure à 5 niveaux pour les régions tanières
            $structure = [
                'niveau_1' => 'Directeur Régional (DR)',
                'niveau_2' => 'Chef Département Trade (CDTT)',
                'niveau_3' => 'Chef Service Commercial (CSC) / Regional Trade Marketing (RTM)',
                'niveau_4' => 'Chef District Vente (CDV) / Trade Marketing Operator (TMO)',
                'niveau_5' => 'Chef de Secteur (CDS) / Assistant Superviseur Sponsoring (AS)',
            ];
        } else {
            // Structure à 3 niveaux pour les régions non-tanières
            $structure = [
                'niveau_1' => 'Directeur Régional (DR)',
                'niveau_2' => 'Chef Service Commercial (CSC) / Superviseur Régional Marketing Opérationnel (SRMO)',
                'niveau_3' => 'Chef de Secteur (CDS) / Trade Marketing Operator (TMO)',
            ];
        }
        
        return $structure;
    }
    
    /**
     * Organise les utilisateurs par niveau hiérarchique
     * 
     * @param Region $region
     * @return array
     */
    private function organiserUtilisateursParNiveau(Region $region): array
    {
        $utilisateurs = $region->utilisateurs->groupBy(function ($utilisateur) use ($region) {
            return $utilisateur->role->getNiveauHierarchique($region->est_taniere);
        });
        
        $organisation = [];
        
        foreach ($utilisateurs as $niveau => $usersParNiveau) {
            $organisation["niveau_{$niveau}"] = $usersParNiveau->map(function ($utilisateur) {
                return [
                    'id' => $utilisateur->id_utilisateur,
                    'nom_complet' => "{$utilisateur->prenom} {$utilisateur->nom}",
                    'role' => $utilisateur->role->nom_role,
                    'matricule' => $utilisateur->matricule,
                    'email' => $utilisateur->email,
                    'manager_id' => $utilisateur->id_manager,
                ];
            })->toArray();
        }
        
        return $organisation;
    }
    
    /**
     * Récupère les subordonnés directs d'un utilisateur
     * 
     * @param int $idUtilisateur
     * @return Collection
     */
    public function getSubordonnesDirects(int $idUtilisateur): Collection
    {
        return Utilisateur::where('id_manager', $idUtilisateur)
            ->with(['role', 'region'])
            ->get();
    }
    
    /**
     * Récupère tous les subordonnés (directs et indirects) d'un utilisateur
     * 
     * @param int $idUtilisateur
     * @return Collection
     */
    public function getTousSubordonnes(int $idUtilisateur): Collection
    {
        $subordonnes = collect();
        $subordonnesDirects = $this->getSubordonnesDirects($idUtilisateur);
        
        foreach ($subordonnesDirects as $subalterne) {
            $subordonnes->push($subalterne);
            $subordonnes = $subordonnes->merge($this->getTousSubordonnes($subalterne->id_utilisateur));
        }
        
        return $subordonnes;
    }
    
    /**
     * Récupère la chaîne hiérarchique complète d'un utilisateur
     * 
     * @param int $idUtilisateur
     * @return array
     */
    public function getChaineHierarchique(int $idUtilisateur): array
    {
        $utilisateur = Utilisateur::with(['role', 'region', 'manager'])->find($idUtilisateur);
        
        if (!$utilisateur) {
            return [];
        }
        
        $chaine = [];
        $utilisateurCourant = $utilisateur;
        
        // Remonter la hiérarchie jusqu'au DR
        while ($utilisateurCourant) {
            $chaine[] = [
                'id' => $utilisateurCourant->id_utilisateur,
                'nom_complet' => "{$utilisateurCourant->prenom} {$utilisateurCourant->nom}",
                'role' => $utilisateurCourant->role->nom_role,
                'niveau' => $utilisateurCourant->role->getNiveauHierarchique($utilisateurCourant->region->est_taniere),
                'matricule' => $utilisateurCourant->matricule,
            ];
            
            $utilisateurCourant = $utilisateurCourant->manager;
        }
        
        return array_reverse($chaine); // Du plus haut niveau au plus bas
    }
    
    /**
     * Vérifie si un utilisateur peut superviser un autre utilisateur
     * 
     * @param int $idSuperviseur
     * @param int $idSubordonne
     * @return bool
     */
    public function peutSuperviser(int $idSuperviseur, int $idSubordonne): bool
    {
        $superviseur = Utilisateur::with(['role', 'region'])->find($idSuperviseur);
        $subordonne = Utilisateur::with(['role', 'region'])->find($idSubordonne);
        
        if (!$superviseur || !$subordonne) {
            return false;
        }
        
        // Vérifier que les utilisateurs sont dans la même région
        if ($superviseur->id_region !== $subordonne->id_region) {
            return false;
        }
        
        // Vérifier les niveaux hiérarchiques
        $niveauSuperviseur = $superviseur->role->getNiveauHierarchique($superviseur->region->est_taniere);
        $niveauSubordonne = $subordonne->role->getNiveauHierarchique($subordonne->region->est_taniere);
        
        // Le superviseur doit être à un niveau supérieur (numéro plus petit)
        if ($niveauSuperviseur >= $niveauSubordonne) {
            return false;
        }
        
        // Vérifier les règles de supervision inter-branches
        $rolesSuperviseurCrossBranch = ['DR', 'CDTT'];
        if ($superviseur->role->id_branche !== $subordonne->role->id_branche) {
            return in_array($superviseur->role->nom_role, $rolesSuperviseurCrossBranch);
        }
        
        return true;
    }
    
    /**
     * Récupère les utilisateurs éligibles pour être évalués par un évaluateur
     * 
     * @param int $idEvaluateur
     * @return Collection
     */
    public function getUtilisateursEligiblesPourEvaluation(int $idEvaluateur): Collection
    {
        $evaluateur = Utilisateur::with(['role', 'region'])->find($idEvaluateur);
        
        if (!$evaluateur) {
            return collect();
        }
        
        // Récupérer tous les utilisateurs de la même région
        $utilisateursRegion = Utilisateur::where('id_region', $evaluateur->id_region)
            ->where('id_utilisateur', '!=', $idEvaluateur)
            ->with(['role'])
            ->get();
        
        // Filtrer selon les règles d'évaluation
        return $utilisateursRegion->filter(function ($utilisateur) use ($evaluateur) {
            return $evaluateur->peutEvaluer($utilisateur);
        });
    }
    
    /**
     * Valide l'assignation d'un manager à un utilisateur
     * 
     * @param int $idUtilisateur
     * @param int $idManager
     * @return array
     */
    public function validerAssignationManager(int $idUtilisateur, int $idManager): array
    {
        $utilisateur = Utilisateur::with(['role', 'region'])->find($idUtilisateur);
        $manager = Utilisateur::with(['role', 'region'])->find($idManager);
        
        $erreurs = [];
        
        if (!$utilisateur || !$manager) {
            $erreurs[] = 'Utilisateur ou manager introuvable';
            return ['valide' => false, 'erreurs' => $erreurs];
        }
        
        // Vérifier que les utilisateurs sont dans la même région
        if ($utilisateur->id_region !== $manager->id_region) {
            $erreurs[] = 'Le manager doit être dans la même région que l\'utilisateur';
        }
        
        // Vérifier les niveaux hiérarchiques
        $niveauUtilisateur = $utilisateur->role->getNiveauHierarchique($utilisateur->region->est_taniere);
        $niveauManager = $manager->role->getNiveauHierarchique($manager->region->est_taniere);
        
        if ($niveauManager >= $niveauUtilisateur) {
            $erreurs[] = 'Le manager doit être à un niveau hiérarchique supérieur';
        }
        
        // Vérifier les règles de supervision inter-branches
        if ($utilisateur->role->id_branche !== $manager->role->id_branche) {
            $rolesCrossBranch = ['DR', 'CDTT'];
            if (!in_array($manager->role->nom_role, $rolesCrossBranch)) {
                $erreurs[] = 'Seuls les DR et CDTT peuvent superviser des utilisateurs d\'autres branches';
            }
        }
        
        // Vérifier qu'il n'y a pas de cycle dans la hiérarchie
        if ($this->detecterCycleHierarchique($idUtilisateur, $idManager)) {
            $erreurs[] = 'Cette assignation créerait un cycle dans la hiérarchie';
        }
        
        return [
            'valide' => empty($erreurs),
            'erreurs' => $erreurs,
        ];
    }
    
    /**
     * Détecte les cycles dans la hiérarchie
     * 
     * @param int $idUtilisateur
     * @param int $idManager
     * @return bool
     */
    private function detecterCycleHierarchique(int $idUtilisateur, int $idManager): bool
    {
        $chaineManager = $this->getChaineHierarchique($idManager);
        
        foreach ($chaineManager as $niveau) {
            if ($niveau['id'] === $idUtilisateur) {
                return true; // Cycle détecté
            }
        }
        
        return false;
    }
}
