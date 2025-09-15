<?php

namespace App\Policies;

use App\Models\Utilisateur;
use App\Models\Evaluation;
use App\Models\PeriodeEvaluation;
use Illuminate\Auth\Access\HandlesAuthorization;

class EvaluationPolicy
{
    use HandlesAuthorization;

    /**
     * Détermine si l'utilisateur peut voir les évaluations
     */
    public function viewAny(Utilisateur $user): bool
    {
        // Tous les utilisateurs peuvent voir leurs propres évaluations
        return true;
    }

    /**
     * Détermine si l'utilisateur peut voir une évaluation spécifique
     */
    public function view(Utilisateur $user, Evaluation $evaluation): bool
    {
        // L'évaluateur peut toujours voir son évaluation
        if ($evaluation->id_evaluateur === $user->id_utilisateur) {
            return true;
        }

        // L'évalué peut voir l'évaluation si elle est validée
        if ($evaluation->id_evalue === $user->id_utilisateur && $evaluation->statut === 'valide') {
            return true;
        }

        // Le manager peut voir l'évaluation de ses subordonnés
        if ($evaluation->evalue->id_manager === $user->id_utilisateur) {
            return true;
        }

        // DR et CDTT peuvent voir toutes les évaluations de leur région
        if (in_array($user->role->nom_role, ['DR', 'CDTT']) && 
            $evaluation->evalue->id_region === $user->id_region) {
            return true;
        }

        return false;
    }

    /**
     * Détermine si l'utilisateur peut créer une évaluation
     */
    public function create(Utilisateur $user, Utilisateur $evalue): bool
    {
        // Vérifications spécifiques pour RTM et SRMO
        if (in_array($user->role->nom_role, ['RTM', 'SRMO'])) {
            // Vérifier que l'utilisateur évalué est un subordonné direct
            if ($evalue->id_manager !== $user->id_utilisateur) {
                return false;
            }
            
            // RTM (tanière) ne peut évaluer que TMO et SS directement (pas AS)
            if ($user->role->nom_role === 'RTM') {
                if (!in_array($evalue->role->nom_role, ['TMO', 'SS'])) {
                    return false;
                }
            }
            
            // SRMO (non-tanière) ne peut évaluer que TMO directement
            if ($user->role->nom_role === 'SRMO') {
                if ($evalue->role->nom_role !== 'TMO') {
                    return false;
                }
            }
        }
        
        // Utiliser la méthode du modèle Utilisateur pour les autres vérifications
        return $user->peutEvaluer($evalue);
    }

    /**
     * Détermine si l'utilisateur peut mettre à jour une évaluation
     */
    public function update(Utilisateur $user, Evaluation $evaluation): bool
    {
        // Seul l'évaluateur peut modifier son évaluation
        if ($evaluation->id_evaluateur !== $user->id_utilisateur) {
            return false;
        }

        // L'évaluation doit être en brouillon
        if ($evaluation->statut !== 'brouillon') {
            return false;
        }

        // Vérifier que la période est encore active
        return $evaluation->periode->estActive();
    }

    /**
     * Détermine si l'utilisateur peut supprimer une évaluation
     */
    public function delete(Utilisateur $user, Evaluation $evaluation): bool
    {
        // Seuls les DR et CDTT peuvent supprimer des évaluations
        if (!in_array($user->role->nom_role, ['DR', 'CDTT'])) {
            return false;
        }

        // Vérifier que l'évaluation est dans la même région
        if ($evaluation->evalue->id_region !== $user->id_region) {
            return false;
        }

        // Ne pas permettre la suppression d'évaluations validées
        return $evaluation->statut !== 'valide';
    }

    /**
     * Détermine si l'utilisateur peut soumettre une évaluation
     */
    public function submit(Utilisateur $user, Evaluation $evaluation): bool
    {
        // Seul l'évaluateur peut soumettre son évaluation
        if ($evaluation->id_evaluateur !== $user->id_utilisateur) {
            return false;
        }

        // L'évaluation doit être en brouillon
        if ($evaluation->statut !== 'brouillon') {
            return false;
        }

        // Vérifier que l'évaluation peut être soumise (complète)
        return $evaluation->peutEtreSoumise();
    }

    /**
     * Détermine si l'utilisateur peut valider une évaluation
     */
    public function validate(Utilisateur $user, Evaluation $evaluation): bool
    {
        // L'évaluation doit être soumise
        if ($evaluation->statut !== 'soumis') {
            return false;
        }

        // Utiliser la méthode du modèle Evaluation
        return $evaluation->peutEtreValidee($user);
    }

    /**
     * Détermine si l'utilisateur peut rejeter une évaluation
     */
    public function reject(Utilisateur $user, Evaluation $evaluation): bool
    {
        // Même logique que pour valider
        return $this->validate($user, $evaluation);
    }

    /**
     * Détermine si l'utilisateur peut voir l'historique des évaluations
     */
    public function viewHistory(Utilisateur $user, Utilisateur $targetUser): bool
    {
        // L'utilisateur peut voir son propre historique
        if ($user->id_utilisateur === $targetUser->id_utilisateur) {
            return true;
        }

        // Un manager peut voir l'historique de ses subordonnés directs
        if ($targetUser->id_manager === $user->id_utilisateur) {
            return true;
        }

        // DR et CDTT peuvent voir l'historique de tous les utilisateurs de leur région
        if (in_array($user->role->nom_role, ['DR', 'CDTT']) && 
            $targetUser->id_region === $user->id_region) {
            return true;
        }

        return false;
    }

    /**
     * Détermine si l'utilisateur peut générer des rapports d'évaluation
     */
    public function generateReports(Utilisateur $user): bool
    {
        // Utiliser la méthode du modèle Role
        return $user->role->peutGenererRapports();
    }

    /**
     * Détermine si l'utilisateur peut envoyer des rappels
     */
    public function sendReminders(Utilisateur $user): bool
    {
        // Seuls les DR et CDTT peuvent envoyer des rappels
        return in_array($user->role->nom_role, ['DR', 'CDTT']);
    }

    /**
     * Détermine si l'utilisateur peut voir les évaluations en attente
     */
    public function viewPending(Utilisateur $user): bool
    {
        // Tous les utilisateurs peuvent voir leurs évaluations en attente
        return true;
    }

    /**
     * Détermine si l'utilisateur peut voir les évaluations à valider
     */
    public function viewToValidate(Utilisateur $user): bool
    {
        // Les managers peuvent voir les évaluations à valider
        return $user->role->peutValiderEvaluations();
    }

    /**
     * Détermine si l'utilisateur peut créer une période d'évaluation
     */
    public function createPeriod(Utilisateur $user): bool
    {
        // Seuls les DR peuvent créer des périodes d'évaluation
        return $user->role->nom_role === 'DR';
    }

    /**
     * Détermine si l'utilisateur peut modifier une période d'évaluation
     */
    public function updatePeriod(Utilisateur $user, PeriodeEvaluation $periode): bool
    {
        // Seuls les DR peuvent modifier les périodes
        if ($user->role->nom_role !== 'DR') {
            return false;
        }

        // Vérifier que la période concerne la région de l'utilisateur
        if ($periode->id_region && $periode->id_region !== $user->id_region) {
            return false;
        }

        // Ne pas permettre la modification d'une période terminée
        return !$periode->estTerminee();
    }

    /**
     * Détermine si l'utilisateur peut voir les scores d'un autre utilisateur
     */
    public function viewScores(Utilisateur $user, Utilisateur $targetUser): bool
    {
        // L'utilisateur peut voir ses propres scores
        if ($user->id_utilisateur === $targetUser->id_utilisateur) {
            return true;
        }

        // Un manager peut voir les scores de ses subordonnés directs
        if ($targetUser->id_manager === $user->id_utilisateur) {
            return true;
        }

        // DR et CDTT peuvent voir les scores de tous les utilisateurs de leur région
        if (in_array($user->role->nom_role, ['DR', 'CDTT']) && 
            $targetUser->id_region === $user->id_region) {
            return true;
        }

        return false;
    }

    /**
     * Détermine si l'utilisateur peut exporter des données d'évaluation
     */
    public function export(Utilisateur $user): bool
    {
        // Seuls les DR et CDTT peuvent exporter
        return in_array($user->role->nom_role, ['DR', 'CDTT']);
    }

    /**
     * Détermine si l'utilisateur peut voir les analytics détaillées
     */
    public function viewAnalytics(Utilisateur $user): bool
    {
        // Les managers et au-dessus peuvent voir les analytics
        return $user->role->peutVoirAnalytics();
    }

    /**
     * Détermine si l'utilisateur peut modifier les règles d'évaluation
     */
    public function manageRules(Utilisateur $user): bool
    {
        // Seuls les DR peuvent gérer les règles d'évaluation
        return $user->role->nom_role === 'DR';
    }

    /**
     * Détermine si l'utilisateur peut voir les logs d'administration
     */
    public function viewLogs(Utilisateur $user): bool
    {
        // Seuls les DR et CDTT peuvent voir les logs
        return in_array($user->role->nom_role, ['DR', 'CDTT']);
    }

    /**
     * Détermine si l'utilisateur peut effectuer des actions d'administration
     */
    public function administrate(Utilisateur $user): bool
    {
        // Seuls les DR peuvent effectuer des actions d'administration
        return $user->role->nom_role === 'DR';
    }
}