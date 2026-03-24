<?php

namespace App\Policies;

use App\Models\Utilisateur;
use App\Models\Evaluation;
use App\Models\PeriodeEvaluation;
use Illuminate\Auth\Access\HandlesAuthorization;

class EvaluationPolicy
{
    use HandlesAuthorization;

    public function viewAny(Utilisateur $user): bool
    {
        return true;
    }

    public function view(Utilisateur $user, Evaluation $evaluation): bool
    {
        // L'évaluateur peut toujours voir son évaluation
        if ($evaluation->evaluateur_matricule === $user->matricule) {
            return true;
        }

        // L'évalué peut voir si l'évaluation est validée
        if ($evaluation->evalue_matricule === $user->matricule && $evaluation->statut === 'valide') {
            return true;
        }

        // Le manager peut voir l'évaluation de ses subordonnés
        $evalue = Utilisateur::where('matricule', $evaluation->evalue_matricule)->first();
        if ($evalue && $evalue->manager_matricule === $user->matricule) {
            return true;
        }

        // DR et CDTT peuvent voir toutes les évaluations de leur région
        if (in_array($user->role_nom, ['DR', 'CDTT']) && $evalue && $evalue->id_region === $user->id_region) {
            return true;
        }

        return false;
    }

    public function create(Utilisateur $user, Utilisateur $evalue): bool
    {
        if (in_array($user->role_nom, ['RTM', 'SRMO'])) {
            if ($evalue->manager_matricule !== $user->matricule) {
                return false;
            }
            if ($user->role_nom === 'RTM' && !in_array($evalue->role_nom, ['TMO', 'SS'])) {
                return false;
            }
            if ($user->role_nom === 'SRMO' && $evalue->role_nom !== 'TMO') {
                return false;
            }
        }

        return $user->peutEvaluer($evalue);
    }

    public function update(Utilisateur $user, Evaluation $evaluation): bool
    {
        if ($evaluation->evaluateur_matricule !== $user->matricule) {
            return false;
        }
        if ($evaluation->statut !== 'brouillon') {
            return false;
        }
        return $evaluation->periode?->estActive() ?? false;
    }

    public function delete(Utilisateur $user, Evaluation $evaluation): bool
    {
        if (!in_array($user->role_nom, ['DR', 'CDTT'])) {
            return false;
        }
        $evalue = Utilisateur::where('matricule', $evaluation->evalue_matricule)->first();
        if (!$evalue || $evalue->id_region !== $user->id_region) {
            return false;
        }
        return $evaluation->statut !== 'valide';
    }

    public function submit(Utilisateur $user, Evaluation $evaluation): bool
    {
        if ($evaluation->evaluateur_matricule !== $user->matricule) {
            return false;
        }
        if ($evaluation->statut !== 'brouillon') {
            return false;
        }
        return $evaluation->peutEtreSoumise();
    }

    public function validate(Utilisateur $user, Evaluation $evaluation): bool
    {
        if ($evaluation->statut !== 'soumis') {
            return false;
        }
        return $evaluation->peutEtreValidee($user);
    }

    public function reject(Utilisateur $user, Evaluation $evaluation): bool
    {
        return $this->validate($user, $evaluation);
    }

    public function viewHistory(Utilisateur $user, Utilisateur $targetUser): bool
    {
        if ($user->matricule === $targetUser->matricule) {
            return true;
        }
        if ($targetUser->manager_matricule === $user->matricule) {
            return true;
        }
        if (in_array($user->role_nom, ['DR', 'CDTT']) && $targetUser->id_region === $user->id_region) {
            return true;
        }
        return false;
    }

    public function generateReports(Utilisateur $user): bool
    {
        return $user->roleModel?->peutGenererRapports() ?? false;
    }

    public function sendReminders(Utilisateur $user): bool
    {
        return in_array($user->role_nom, ['DR', 'CDTT']);
    }

    public function viewPending(Utilisateur $user): bool
    {
        return true;
    }

    public function viewToValidate(Utilisateur $user): bool
    {
        return $user->roleModel?->peutValiderEvaluations() ?? false;
    }

    public function createPeriod(Utilisateur $user): bool
    {
        return $user->role_nom === 'DR';
    }

    public function updatePeriod(Utilisateur $user, PeriodeEvaluation $periode): bool
    {
        if ($user->role_nom !== 'DR') {
            return false;
        }
        return !$periode->estTerminee();
    }

    public function viewScores(Utilisateur $user, Utilisateur $targetUser): bool
    {
        if ($user->matricule === $targetUser->matricule) {
            return true;
        }
        if ($targetUser->manager_matricule === $user->matricule) {
            return true;
        }
        if (in_array($user->role_nom, ['DR', 'CDTT']) && $targetUser->id_region === $user->id_region) {
            return true;
        }
        return false;
    }

    public function export(Utilisateur $user): bool
    {
        return in_array($user->role_nom, ['DR', 'CDTT']);
    }

    public function viewAnalytics(Utilisateur $user): bool
    {
        return $user->roleModel?->peutVoirAnalytics() ?? false;
    }

    public function manageRules(Utilisateur $user): bool
    {
        return $user->role_nom === 'DR';
    }

    public function viewLogs(Utilisateur $user): bool
    {
        return in_array($user->role_nom, ['DR', 'CDTT']);
    }

    public function administrate(Utilisateur $user): bool
    {
        return $user->role_nom === 'DR';
    }
}
