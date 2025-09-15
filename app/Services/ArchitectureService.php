<?php

namespace App\Services;

use Illuminate\Support\Facades\DB;
use App\Models\Utilisateur;
use App\Models\Business\Evaluation;
use App\Models\ScoreUtilisateur;
use App\Models\LogAnomalie;
use App\Models\Recommandation;

/**
 * Service Architecture 3 Bases selon règles métier SABC
 * Orchestration CORE (MySQL) + BUSINESS (PostgreSQL) + ANALYTICS (ClickHouse)
 */
class ArchitectureService
{
    /**
     * Synchronisation données entre les 3 bases selon règles SABC
     */
    public function synchroniserDonnees(): array
    {
        $resultats = [
            'core_to_business' => 0,
            'business_to_analytics' => 0,
            'anomalies_detectees' => 0,
            'recommandations_generees' => 0
        ];

        try {
            DB::beginTransaction();

            // 1. Synchronisation CORE → BUSINESS (utilisateurs actifs)
            $resultats['core_to_business'] = $this->synchroniserUtilisateursActifs();

            // 2. Synchronisation BUSINESS → ANALYTICS (scores et métriques)
            $resultats['business_to_analytics'] = $this->synchroniserScoresUtilisateurs();

            // 3. Détection anomalies selon règles SABC
            $resultats['anomalies_detectees'] = $this->detecterAnomalies();

            // 4. Génération recommandations selon règles SABC
            $resultats['recommandations_generees'] = $this->genererRecommandations();

            DB::commit();

        } catch (\Exception $e) {
            DB::rollBack();
            throw $e;
        }

        return $resultats;
    }

    /**
     * Synchronisation utilisateurs actifs CORE → BUSINESS selon règles SABC
     */
    private function synchroniserUtilisateursActifs(): int
    {
        // Récupération utilisateurs actifs depuis CORE (MySQL)
        $utilisateursActifs = Utilisateur::where('est_actif', true)
            ->where('est_indisponible', false)
            ->select('matricule', 'nom', 'prenom', 'id_region', 'role', 'manager_matricule')
            ->get();

        $count = 0;
        foreach ($utilisateursActifs as $user) {
            // Mise à jour référence dans BUSINESS (PostgreSQL)
            DB::connection('pgsql')->table('utilisateurs_ref')->updateOrInsert(
                ['matricule' => $user->matricule],
                [
                    'nom' => $user->nom,
                    'prenom' => $user->prenom,
                    'id_region' => $user->id_region,
                    'role' => $user->role,
                    'manager_matricule' => $user->manager_matricule,
                    'updated_at' => now()
                ]
            );
            $count++;
        }

        return $count;
    }

    /**
     * Synchronisation scores BUSINESS → ANALYTICS selon règles SABC
     */
    private function synchroniserScoresUtilisateurs(): int
    {
        // Récupération évaluations complétées depuis BUSINESS (PostgreSQL)
        $evaluationsCompletes = DB::connection('pgsql')
            ->table('evaluations')
            ->where('statut', 'validé')
            ->where('est_validee_manager', true)
            ->whereNotNull('note_globale')
            ->select('evalue_matricule', 'code_periode', 'note_globale', 'type_evaluation')
            ->get()
            ->groupBy(['evalue_matricule', 'code_periode']);

        $count = 0;
        foreach ($evaluationsCompletes as $matricule => $periodes) {
            foreach ($periodes as $codePeriode => $evaluations) {
                $scoreData = $this->calculerScoreGlobal($evaluations);
                
                // Insertion/Mise à jour dans ANALYTICS (ClickHouse)
                DB::connection('clickhouse')->table('scores_utilisateurs')->insert([
                    'matricule' => $matricule,
                    'periode_evaluation' => $codePeriode,
                    'score_global' => $scoreData['score_global'],
                    'score_auto_evaluation' => $scoreData['score_auto'],
                    'score_pairs' => $scoreData['score_pairs'],
                    'score_manager' => $scoreData['score_manager'],
                    'nb_evaluations_recues' => $scoreData['nb_evaluations'],
                    'statut_calcul' => 'complete',
                    'created_at' => now(),
                    'updated_at' => now()
                ]);
                $count++;
            }
        }

        return $count;
    }

    /**
     * Calcul score global selon pondération SABC (20% auto, 40% pairs, 40% manager)
     */
    private function calculerScoreGlobal($evaluations): array
    {
        $scoreAuto = null;
        $scorePairs = [];
        $scoreManager = null;

        foreach ($evaluations as $eval) {
            switch ($eval->type_evaluation) {
                case 'auto':
                    $scoreAuto = $eval->note_globale;
                    break;
                case 'pairs':
                    $scorePairs[] = $eval->note_globale;
                    break;
                case 'manager':
                    $scoreManager = $eval->note_globale;
                    break;
            }
        }

        $scorePairsMoyenne = !empty($scorePairs) ? array_sum($scorePairs) / count($scorePairs) : null;

        // Calcul selon pondération SABC
        $scoreGlobal = 0;
        $coefficients = 0;

        if ($scoreAuto !== null) {
            $scoreGlobal += $scoreAuto * 0.2;
            $coefficients += 0.2;
        }

        if ($scorePairsMoyenne !== null) {
            $scoreGlobal += $scorePairsMoyenne * 0.4;
            $coefficients += 0.4;
        }

        if ($scoreManager !== null) {
            $scoreGlobal += $scoreManager * 0.4;
            $coefficients += 0.4;
        }

        // Normalisation si tous les types ne sont pas présents
        if ($coefficients > 0) {
            $scoreGlobal = $scoreGlobal / $coefficients * 1.0;
        }

        return [
            'score_global' => round($scoreGlobal, 2),
            'score_auto' => $scoreAuto,
            'score_pairs' => $scorePairsMoyenne,
            'score_manager' => $scoreManager,
            'nb_evaluations' => count($evaluations)
        ];
    }

    /**
     * Détection anomalies selon règles métier SABC
     */
    private function detecterAnomalies(): int
    {
        $anomaliesDetectees = 0;

        // 1. Divergence Auto vs. Autres (seuil > 1.5 selon règles SABC)
        $divergences = DB::connection('clickhouse')
            ->select("
                SELECT matricule, periode_evaluation, score_auto_evaluation, 
                       (score_pairs + score_manager) / 2 as score_autres
                FROM scores_utilisateurs 
                WHERE score_auto_evaluation IS NOT NULL 
                AND (score_pairs IS NOT NULL OR score_manager IS NOT NULL)
                AND abs(score_auto_evaluation - (score_pairs + score_manager) / 2) > 1.5
            ");

        foreach ($divergences as $divergence) {
            $this->creerAnomalie(
                'divergence_auto_autres',
                $divergence->matricule,
                $divergence->periode_evaluation,
                "Divergence significative entre auto-évaluation ({$divergence->score_auto_evaluation}) et évaluations externes ({$divergence->score_autres})",
                abs($divergence->score_auto_evaluation - $divergence->score_autres)
            );
            $anomaliesDetectees++;
        }

        // 2. Baisse de performance (> 1 point selon règles SABC)
        $baisses = DB::connection('clickhouse')
            ->select("
                SELECT matricule, periode_evaluation, score_global, progression_vs_precedente
                FROM scores_utilisateurs 
                WHERE progression_vs_precedente < -1.0
            ");

        foreach ($baisses as $baisse) {
            $this->creerAnomalie(
                'baisse_performance',
                $baisse->matricule,
                $baisse->periode_evaluation,
                "Baisse significative de performance: {$baisse->progression_vs_precedente} points",
                abs($baisse->progression_vs_precedente)
            );
            $anomaliesDetectees++;
        }

        return $anomaliesDetectees;
    }

    /**
     * Création anomalie selon règles SABC
     */
    private function creerAnomalie(string $type, string $matricule, string $periode, string $description, float $severite): void
    {
        DB::connection('clickhouse')->table('logs_anomalies')->insert([
            'id_anomalie' => \Illuminate\Support\Str::uuid(),
            'type_anomalie' => $type,
            'matricule_concerne' => $matricule,
            'code_periode' => $periode,
            'description' => $description,
            'score_severite' => min($severite, 10.0),
            'statut' => 'detectee',
            'necessite_escalade' => $severite > 5.0 ? 1 : 0,
            'donnees_anomalie' => '{}',
            'created_at' => now(),
            'updated_at' => now()
        ]);
    }

    /**
     * Génération recommandations selon règles métier SABC
     */
    private function genererRecommandations(): int
    {
        $recommandationsGenerees = 0;

        // Recommandations pour scores faibles (< 3/5 selon règles SABC)
        $scoresFaibles = DB::connection('clickhouse')
            ->select("
                SELECT matricule, periode_evaluation, score_global, scores_par_critere
                FROM scores_utilisateurs 
                WHERE score_global < 3.0
                AND statut_calcul = 'complete'
            ");

        foreach ($scoresFaibles as $score) {
            $this->creerRecommandation(
                'plan_developpement',
                $score->matricule,
                "Plan de développement personnalisé",
                "Amélioration des compétences identifiées comme faibles",
                'haute',
                $score->periode_evaluation
            );
            $recommandationsGenerees++;
        }

        return $recommandationsGenerees;
    }

    /**
     * Création recommandation selon règles SABC
     */
    private function creerRecommandation(string $type, string $matricule, string $titre, string $description, string $priorite, string $periode): void
    {
        DB::connection('clickhouse')->table('recommandations')->insert([
            'id_recommandation' => \Illuminate\Support\Str::uuid(),
            'matricule_destinataire' => $matricule,
            'type_recommandation' => $type,
            'titre' => $titre,
            'description' => $description,
            'priorite' => $priorite,
            'statut' => 'proposee',
            'code_periode_origine' => $periode,
            'criteres_declencheurs' => '{}',
            'donnees_support' => '{}',
            'created_at' => now(),
            'updated_at' => now()
        ]);
    }

    /**
     * Vérification santé architecture 3 bases selon règles SABC
     */
    public function verifierSanteArchitecture(): array
    {
        return [
            'core_mysql' => $this->testerConnexion('mysql'),
            'business_postgresql' => $this->testerConnexion('pgsql'),
            'analytics_clickhouse' => $this->testerConnexion('clickhouse'),
            'synchronisation_ok' => $this->verifierSynchronisation()
        ];
    }

    /**
     * Test connexion base de données
     */
    private function testerConnexion(string $connection): bool
    {
        try {
            DB::connection($connection)->getPdo();
            return true;
        } catch (\Exception $e) {
            return false;
        }
    }

    /**
     * Vérification synchronisation entre bases selon règles SABC
     */
    private function verifierSynchronisation(): bool
    {
        try {
            $countCore = DB::connection('mysql')->table('utilisateurs')->where('est_actif', true)->count();
            $countBusiness = DB::connection('pgsql')->table('utilisateurs_ref')->count();
            
            // Tolérance de 5% selon règles SABC
            return abs($countCore - $countBusiness) <= ($countCore * 0.05);
        } catch (\Exception $e) {
            return false;
        }
    }
}
