<?php

namespace App\Services;

use App\Models\Evaluation;
use App\Models\Utilisateur;
use App\Models\PeriodeEvaluation;
use App\Models\RegleEvaluation;
use App\Models\ScoreUtilisateur;
use App\Models\Notification;
use App\Models\LogAdministration;
use App\Models\EvaluationPermission;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class EvaluationService
{
    /**
     * Vérifie si un utilisateur (par matricule) peut créer une évaluation
     */
    public function canCreateEvaluation(string $evaluateurMatricule, string $evalueMatricule, ?string $idRegle = null): bool
    {
        $evaluateur = Utilisateur::where('matricule', $evaluateurMatricule)->first();
        $evalue     = Utilisateur::where('matricule', $evalueMatricule)->first();

        if (!$evaluateur || !$evalue) {
            return false;
        }

        if (!$evaluateur->peutEvaluer($evalue)) {
            return false;
        }

        $periodeActive = PeriodeEvaluation::where('statut', 'ouverte')
            ->where('date_debut', '<=', now())
            ->where('date_fin', '>=', now())
            ->orderByDesc('date_debut')
            ->first();

        if (!$periodeActive) {
            return false;
        }

        $exists = DB::connection('pgsql')
            ->table('evaluations')
            ->where('evaluateur_matricule', $evaluateurMatricule)
            ->where('evalue_matricule', $evalueMatricule)
            ->where('id_periode', $periodeActive->id_periode)
            ->when($idRegle, fn($q) => $q->where('id_regle', $idRegle))
            ->exists();

        return !$exists;
    }

    /**
     * Crée une nouvelle évaluation (brouillon)
     *
     * @param string $evaluateurMatricule
     * @param string $evalueMatricule
     * @param string $idPeriode  UUID
     * @param string|null $idRegle  UUID
     */
    public function creerEvaluation(string $evaluateurMatricule, string $evalueMatricule, string $idPeriode, ?string $idRegle = null): ?object
    {
        $evaluateur = Utilisateur::where('matricule', $evaluateurMatricule)->first();
        $evalue     = Utilisateur::where('matricule', $evalueMatricule)->first();
        $periode    = PeriodeEvaluation::find($idPeriode);

        if (!$evaluateur || !$evalue || !$periode) {
            return null;
        }

        if (!$evaluateur->peutEvaluer($evalue)) {
            return null;
        }

        if (!$periode->estActive()) {
            return null;
        }

        // Évaluation existante ?
        $existante = DB::connection('pgsql')->table('evaluations')
            ->where('evaluateur_matricule', $evaluateurMatricule)
            ->where('evalue_matricule', $evalueMatricule)
            ->where('id_periode', $idPeriode)
            ->first();

        if ($existante) {
            return $existante;
        }

        $id = Str::uuid()->toString();

        DB::connection('pgsql')->table('evaluations')->insert([
            'id_evaluation'        => $id,
            'evaluateur_matricule' => $evaluateurMatricule,
            'evalue_matricule'     => $evalueMatricule,
            'id_periode'           => $idPeriode,
            'id_regle'             => $idRegle,
            'date_evaluation'      => now()->toDateString(),
            'statut'               => 'brouillon',
            'notations_json'       => json_encode([]),
            'type_evaluation'      => $this->determinerTypeEvaluation($evaluateur, $evalue),
            'created_at'           => now(),
            'updated_at'           => now(),
        ]);

        LogAdministration::enregistrerAction(
            $evaluateurMatricule,
            'creation',
            'evaluations',
            $id,
            null,
            compact('evaluateurMatricule', 'evalueMatricule', 'idPeriode')
        );

        Notification::notifierNouvelleEvaluation($evalueMatricule, $evaluateurMatricule);

        return DB::connection('pgsql')->table('evaluations')->where('id_evaluation', $id)->first();
    }

    /**
     * Met à jour les notes d'une évaluation (brouillon)
     *
     * @param string $idEvaluation  UUID
     */
    public function mettreAJourNotes(string $idEvaluation, array $notes, ?string $commentaireGeneral = null): bool
    {
        $evaluation = DB::connection('pgsql')->table('evaluations')->where('id_evaluation', $idEvaluation)->first();

        if (!$evaluation || $evaluation->statut !== 'brouillon') {
            return false;
        }

        DB::connection('pgsql')->table('evaluations')->where('id_evaluation', $idEvaluation)->update([
            'notations_json'      => json_encode($notes),
            'commentaire_general' => $commentaireGeneral,
            'updated_at'          => now(),
        ]);

        LogAdministration::enregistrerAction(
            $evaluation->evaluateur_matricule,
            'modification',
            'evaluations',
            $idEvaluation,
            ['notations_json' => $evaluation->notations_json],
            ['notations_json' => $notes]
        );

        return true;
    }

    /**
     * Soumet une évaluation pour validation
     *
     * @param string $idEvaluation  UUID
     */
    public function soumettrePourValidation(string $idEvaluation): array
    {
        $evaluation = DB::connection('pgsql')->table('evaluations')->where('id_evaluation', $idEvaluation)->first();

        if (!$evaluation) {
            return ['success' => false, 'message' => 'Évaluation introuvable'];
        }

        if ($evaluation->statut !== 'brouillon') {
            return ['success' => false, 'message' => 'L\'évaluation n\'est pas en brouillon'];
        }

        $notes = json_decode($evaluation->notations_json, true) ?? [];
        if (empty($notes)) {
            return ['success' => false, 'message' => 'L\'évaluation est vide'];
        }

        DB::connection('pgsql')->table('evaluations')->where('id_evaluation', $idEvaluation)->update([
            'statut'          => 'soumis',
            'date_soumission' => now(),
            'updated_at'      => now(),
        ]);

        LogAdministration::enregistrerAction(
            $evaluation->evaluateur_matricule,
            'soumission',
            'evaluations',
            $idEvaluation,
            ['statut' => 'brouillon'],
            ['statut' => 'soumis']
        );

        // Notifier le manager de l'évalué
        $evalue = Utilisateur::where('matricule', $evaluation->evalue_matricule)->first();
        if ($evalue?->manager_matricule) {
            Notification::creer(
                $evalue->manager_matricule,
                'Évaluation à valider',
                "Une évaluation de {$evalue->prenom} {$evalue->nom} est en attente de validation.",
                'validation'
            );
        }

        return ['success' => true, 'message' => 'Évaluation soumise avec succès'];
    }

    /**
     * Valide ou rejette une évaluation
     *
     * @param string $idEvaluation  UUID
     * @param string $validateurMatricule
     */
    public function validerEvaluation(string $idEvaluation, string $validateurMatricule, bool $estValidee, ?string $commentaireValidation = null): array
    {
        $evaluation = DB::connection('pgsql')->table('evaluations')->where('id_evaluation', $idEvaluation)->first();
        $validateur = Utilisateur::where('matricule', $validateurMatricule)->first();

        if (!$evaluation || !$validateur) {
            return ['success' => false, 'message' => 'Évaluation ou validateur introuvable'];
        }

        if ($evaluation->statut !== 'soumis') {
            return ['success' => false, 'message' => 'L\'évaluation n\'est pas soumise'];
        }

        // Le validateur doit être le manager de l'évalué
        $evalue = Utilisateur::where('matricule', $evaluation->evalue_matricule)->first();
        if (!$evalue || $evalue->manager_matricule !== $validateurMatricule) {
            return ['success' => false, 'message' => 'Non autorisé à valider cette évaluation'];
        }

        $nouveauStatut = $estValidee ? 'valide' : 'brouillon';

        DB::connection('pgsql')->table('evaluations')->where('id_evaluation', $idEvaluation)->update([
            'statut'     => $nouveauStatut,
            'updated_at' => now(),
        ]);

        LogAdministration::enregistrerAction(
            $validateurMatricule,
            $estValidee ? 'validation' : 'rejet',
            'evaluations',
            $idEvaluation,
            ['statut' => 'soumis'],
            ['statut' => $nouveauStatut]
        );

        Notification::notifierValidationEvaluation($evaluation->evaluateur_matricule, $estValidee);

        if ($estValidee) {
            $this->mettreAJourScores($evaluation->evalue_matricule, $evaluation->id_periode);
        }

        $message = $estValidee ? 'Évaluation validée avec succès' : 'Évaluation renvoyée en brouillon';
        return ['success' => true, 'message' => $message];
    }

    /**
     * Met à jour les scores d'un utilisateur pour une période
     *
     * @param string $matricule
     * @param string $idPeriode  UUID
     */
    public function mettreAJourScores(string $matricule, string $idPeriode): void
    {
        $evaluationsValidees = DB::connection('pgsql')
            ->table('evaluations')
            ->where('evalue_matricule', $matricule)
            ->where('id_periode', $idPeriode)
            ->where('statut', 'valide')
            ->get();

        if ($evaluationsValidees->isEmpty()) {
            return;
        }

        $evalue = Utilisateur::where('matricule', $matricule)->first();

        $scoreAuto    = null;
        $scorePairs   = null;
        $scoreManager = null;

        foreach ($evaluationsValidees as $eval) {
            $notes    = json_decode($eval->notations_json, true) ?? [];
            $moyenne  = $this->calculerMoyenneNotes($notes);
            if ($moyenne === null) continue;

            if ($eval->evaluateur_matricule === $matricule) {
                // auto-évaluation
                $scoreAuto = $moyenne;
            } elseif ($evalue && $eval->evaluateur_matricule === $evalue->manager_matricule) {
                // évaluation manager
                $scoreManager = isset($scoreManager) ? round(($scoreManager + $moyenne) / 2, 2) : $moyenne;
            } else {
                // pairs
                $scorePairs = isset($scorePairs) ? round(($scorePairs + $moyenne) / 2, 2) : $moyenne;
            }
        }

        ScoreUtilisateur::updateOrCreate(
            ['matricule' => $matricule, 'id_periode' => $idPeriode],
            [
                'score_auto'    => $scoreAuto,
                'score_pairs'   => $scorePairs,
                'score_manager' => $scoreManager,
                'derniere_maj'  => now(),
            ]
        )->mettreAJourScoreGlobal();
    }

    /**
     * Calcule la moyenne d'un tableau de notes
     */
    private function calculerMoyenneNotes(array $notes): ?float
    {
        if (empty($notes)) {
            return null;
        }

        $somme = 0;
        $poids = 0;

        foreach ($notes as $n) {
            if (isset($n['note'])) {
                $p = $n['poids'] ?? $n['ponderation'] ?? 1;
                $somme += $n['note'] * $p;
                $poids += $p;
            }
        }

        return $poids > 0 ? round($somme / $poids, 2) : null;
    }

    /**
     * Récupère les évaluations en attente pour un utilisateur
     *
     * @param string $matricule
     */
    public function getEvaluationsEnAttente(string $matricule): Collection
    {
        $rows = DB::connection('pgsql')
            ->table('evaluations')
            ->where('evaluateur_matricule', $matricule)
            ->whereIn('statut', ['brouillon', 'soumis'])
            ->orderByDesc('date_evaluation')
            ->get();

        return $rows;
    }

    /**
     * Récupère les évaluations à valider pour un manager
     *
     * @param string $managerMatricule
     */
    public function getEvaluationsAValider(string $managerMatricule): Collection
    {
        // Récupérer les matricules des subordonnés directs (MySQL)
        $subMatricules = Utilisateur::where('manager_matricule', $managerMatricule)
            ->pluck('matricule')
            ->toArray();

        if (empty($subMatricules)) {
            return collect();
        }

        return DB::connection('pgsql')
            ->table('evaluations')
            ->where('statut', 'soumis')
            ->whereIn('evalue_matricule', $subMatricules)
            ->orderByDesc('date_soumission')
            ->get();
    }

    /**
     * Envoie des rappels pour les évaluations en retard
     *
     * @param string $idPeriode  UUID
     */
    public function envoyerRappelsEvaluations(string $idPeriode): int
    {
        $periode = PeriodeEvaluation::find($idPeriode);

        if (!$periode || !$periode->estActive()) {
            return 0;
        }

        $joursRestants = now()->diffInDays($periode->date_fin);

        if ($joursRestants > 7) {
            return 0;
        }

        $evaluationsEnRetard = DB::connection('pgsql')
            ->table('evaluations')
            ->where('id_periode', $idPeriode)
            ->where('statut', 'brouillon')
            ->where('created_at', '<', now()->subDays(3))
            ->get();

        $rappelsEnvoyes = 0;

        foreach ($evaluationsEnRetard as $evaluation) {
            Notification::notifierRappelEvaluation(
                $evaluation->evaluateur_matricule,
                $joursRestants
            );
            $rappelsEnvoyes++;
        }

        return $rappelsEnvoyes;
    }

    /**
     * Récupère les évaluations à compléter selon les permissions du rôle
     */
    public function getEvaluationsACompleter(Utilisateur $utilisateur): array
    {
        $periodeActive = PeriodeEvaluation::where('statut', 'ouverte')
            ->where('date_debut', '<=', now())
            ->where('date_fin', '>=', now())
            ->first();

        if (!$periodeActive) {
            return [];
        }

        $permissions = EvaluationPermission::getPermissionsPourRole($utilisateur->role_nom ?? $utilisateur->role);
        $evaluations = [];

        foreach ($permissions as $permission) {
            $cibles = $this->getCiblesEvaluation($utilisateur, $permission);

            foreach ($cibles as $cible) {
                $existante = DB::connection('pgsql')->table('evaluations')
                    ->where('evaluateur_matricule', $utilisateur->matricule)
                    ->where('evalue_matricule', $cible->matricule)
                    ->where('id_periode', $periodeActive->id_periode)
                    ->first();

                if (!$existante) {
                    $evaluations[] = [
                        'type'     => $permission->type_evaluation,
                        'cible'    => $cible,
                        'statut'   => 'a_faire',
                        'deadline' => $periodeActive->date_fin,
                    ];
                } elseif ($existante->statut === 'brouillon') {
                    $evaluations[] = [
                        'type'       => $permission->type_evaluation,
                        'cible'      => $cible,
                        'evaluation' => $existante,
                        'statut'     => 'a_terminer',
                        'deadline'   => $periodeActive->date_fin,
                    ];
                }
            }
        }

        return $evaluations;
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Helpers privés
    // ─────────────────────────────────────────────────────────────────────────

    private function determinerTypeEvaluation(Utilisateur $evaluateur, Utilisateur $evalue): string
    {
        if ($evaluateur->matricule === $evalue->matricule) {
            return 'auto';
        }
        if ($evalue->manager_matricule === $evaluateur->matricule) {
            return 'descendante';
        }
        if ($evaluateur->manager_matricule === $evalue->matricule) {
            return 'ascendante';
        }
        if ($evaluateur->niveau_hierarchique === $evalue->niveau_hierarchique
            && $evaluateur->id_region === $evalue->id_region) {
            return 'pairs';
        }
        return '360';
    }

    private function getCiblesEvaluation(Utilisateur $utilisateur, $permission): Collection
    {
        switch ($permission->type_evaluation) {
            case 'auto':
                return collect([$utilisateur]);

            case 'descendante':
                return Utilisateur::where('manager_matricule', $utilisateur->matricule)
                    ->where('role', $permission->role_evalue)
                    ->where('est_actif', true)
                    ->get();

            case 'pairs':
                return Utilisateur::where('niveau_hierarchique', $utilisateur->niveau_hierarchique)
                    ->where('id_region', $utilisateur->id_region)
                    ->where('id_branche', $utilisateur->id_branche)
                    ->where('role', $permission->role_evalue)
                    ->where('matricule', '!=', $utilisateur->matricule)
                    ->where('est_actif', true)
                    ->get();

            default:
                return collect();
        }
    }
}
