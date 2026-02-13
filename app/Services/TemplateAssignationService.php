<?php

namespace App\Services;

use App\Models\TemplateRolePeriode;
use App\Models\Business\Template;
use App\Models\PeriodeEvaluation;
use App\Exceptions\TemplateNonAssigneException;
use App\Exceptions\PeriodeNonModifiableException;
use Illuminate\Support\Facades\DB;

class TemplateAssignationService
{
    /**
     * Récupérer le template assigné pour un rôle et une période
     * 
     * @param string $idRole
     * @param int $idPeriode
     * @throws TemplateNonAssigneException
     * @return Template
     */
    public function getTemplateForRolePeriode(string $idRole, int $idPeriode): Template
    {
        $assignation = TemplateRolePeriode::with('template')
            ->where('id_role', $idRole)
            ->where('id_periode', $idPeriode)
            ->where('est_actif', true)
            ->first();
        
        if (!$assignation || !$assignation->template) {
            throw new TemplateNonAssigneException(
                "Aucun template n'est assigné au rôle {$idRole} pour cette période. " .
                "Veuillez contacter l'administrateur."
            );
        }
        
        // Vérifier que le template est publié
        if ($assignation->template->statut !== 'publie') {
            throw new TemplateNonAssigneException(
                "Le template assigné n'est pas publié. Veuillez contacter l'administrateur."
            );
        }
        
        return $assignation->template;
    }
    
    /**
     * Assigner un template à un rôle pour une période
     * 
     * @param string $idTemplate
     * @param string $idRole
     * @param int $idPeriode
     * @throws PeriodeNonModifiableException
     * @return TemplateRolePeriode
     */
    public function assignTemplate(string $idTemplate, string $idRole, int $idPeriode): TemplateRolePeriode
    {
        // Vérifier que la période peut être modifiée
        $periode = PeriodeEvaluation::find($idPeriode);
        if ($periode && !$this->canModifyAssignation($periode)) {
            throw new PeriodeNonModifiableException(
                "Impossible de modifier l'assignation, la période est ouverte ou fermée"
            );
        }
        
        // Vérifier que le template existe et est publié
        $template = Template::find($idTemplate);
        if (!$template) {
            throw new \InvalidArgumentException("Template introuvable");
        }
        
        if ($template->statut !== 'publie') {
            throw new \InvalidArgumentException("Seuls les templates publiés peuvent être assignés");
        }
        
        // Créer ou mettre à jour l'assignation
        $assignation = TemplateRolePeriode::updateOrCreate(
            [
                'id_role' => $idRole,
                'id_periode' => $idPeriode,
            ],
            [
                'id_template' => $idTemplate,
                'est_actif' => true,
            ]
        );
        
        return $assignation;
    }
    
    /**
     * Mettre à jour une assignation existante
     * 
     * @param int $idAssignation
     * @param string $idTemplate
     * @throws PeriodeNonModifiableException
     * @return TemplateRolePeriode
     */
    public function updateAssignation(int $idAssignation, string $idTemplate): TemplateRolePeriode
    {
        $assignation = TemplateRolePeriode::with('periode')->findOrFail($idAssignation);
        
        // Vérifier que la période peut être modifiée
        if (!$assignation->peutEtreModifiee()) {
            throw new PeriodeNonModifiableException(
                "Impossible de modifier l'assignation, la période est ouverte ou fermée"
            );
        }
        
        // Vérifier que le template existe et est publié
        $template = Template::find($idTemplate);
        if (!$template) {
            throw new \InvalidArgumentException("Template introuvable");
        }
        
        if ($template->statut !== 'publie') {
            throw new \InvalidArgumentException("Seuls les templates publiés peuvent être assignés");
        }
        
        $assignation->update(['id_template' => $idTemplate]);
        
        return $assignation;
    }
    
    /**
     * Supprimer une assignation
     * 
     * @param int $idAssignation
     * @throws PeriodeNonModifiableException
     * @return bool
     */
    public function deleteAssignation(int $idAssignation): bool
    {
        $assignation = TemplateRolePeriode::with('periode')->findOrFail($idAssignation);
        
        // Vérifier que la période peut être modifiée
        if (!$assignation->peutEtreModifiee()) {
            throw new PeriodeNonModifiableException(
                "Impossible de supprimer l'assignation, la période est ouverte ou fermée"
            );
        }
        
        return $assignation->delete();
    }
    
    /**
     * Vérifier si une assignation peut être modifiée
     * 
     * @param PeriodeEvaluation $periode
     * @return bool
     */
    public function canModifyAssignation(PeriodeEvaluation $periode): bool
    {
        // Modification autorisée uniquement si période planifiée (non ouverte, non fermée)
        return !$periode->est_ouverte && !$periode->est_cloturee;
    }
    
    /**
     * Récupérer toutes les assignations pour une période
     * 
     * @param int $idPeriode
     * @return \Illuminate\Support\Collection
     */
    public function getAssignationsByPeriode(int $idPeriode)
    {
        return TemplateRolePeriode::with(['template', 'role', 'periode'])
            ->where('id_periode', $idPeriode)
            ->where('est_actif', true)
            ->get();
    }
    
    /**
     * Récupérer la matrice complète des assignations pour une période
     * (tous les rôles × template assigné ou null)
     * 
     * @param int $idPeriode
     * @return array
     */
    public function getMatriceAssignations(int $idPeriode): array
    {
        $assignations = $this->getAssignationsByPeriode($idPeriode);
        
        // Récupérer tous les rôles SABC (hors ADMIN)
        $roles = DB::connection('mysql')
            ->table('roles')
            ->where('nom_role', '!=', 'ADMIN')
            ->orderBy('niveau_taniere')
            ->get();
        
        $matrice = [];
        foreach ($roles as $role) {
            $assignation = $assignations->firstWhere('id_role', $role->id_role);
            
            $matrice[] = [
                'id_role' => $role->id_role,
                'nom_role' => $role->nom_role,
                'template_assigne' => $assignation ? [
                    'id_template' => $assignation->template->id_template,
                    'nom' => $assignation->template->nom,
                    'statut' => $assignation->template->statut,
                ] : null,
                'est_assigne' => $assignation !== null,
            ];
        }
        
        return $matrice;
    }
    
    /**
     * Assigner en masse des templates pour une période
     * 
     * @param int $idPeriode
     * @param array $assignations Format: [['id_role' => 'CSC', 'id_template' => 'uuid'], ...]
     * @throws PeriodeNonModifiableException
     * @return int Nombre d'assignations créées
     */
    public function assignBulk(int $idPeriode, array $assignations): int
    {
        $periode = PeriodeEvaluation::find($idPeriode);
        if ($periode && !$this->canModifyAssignation($periode)) {
            throw new PeriodeNonModifiableException(
                "Impossible de modifier les assignations, la période est ouverte ou fermée"
            );
        }
        
        $count = 0;
        foreach ($assignations as $assignation) {
            try {
                $this->assignTemplate(
                    $assignation['id_template'],
                    $assignation['id_role'],
                    $idPeriode
                );
                $count++;
            } catch (\Exception $e) {
                // Logger l'erreur mais continuer
                \Log::warning("Erreur assignation template", [
                    'role' => $assignation['id_role'],
                    'template' => $assignation['id_template'],
                    'error' => $e->getMessage()
                ]);
            }
        }
        
        return $count;
    }
}
