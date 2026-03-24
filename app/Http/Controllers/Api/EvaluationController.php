<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\EvaluationService;
use App\Models\Evaluation;
use App\Models\Utilisateur;
use App\Models\PeriodeEvaluation;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;

class EvaluationController extends Controller
{
    protected EvaluationService $evaluationService;

    public function __construct(EvaluationService $evaluationService)
    {
        $this->evaluationService = $evaluationService;
    }

    /**
     * Récupère les évaluations de l'utilisateur connecté
     */
    public function index(Request $request): JsonResponse
    {
        $utilisateur = Auth::user();

        $enAttente = DB::connection('pgsql')
            ->table('evaluations')
            ->where('evaluateur_matricule', $utilisateur->matricule)
            ->where('statut', 'brouillon')
            ->orderByDesc('date_evaluation')
            ->get();

        $aValider = DB::connection('pgsql')
            ->table('evaluations')
            ->where('statut', 'soumis')
            ->whereIn('evalue_matricule', function ($q) use ($utilisateur) {
                $q->select('matricule')
                    ->from(DB::connection('mysql')->getDatabaseName() . '.utilisateurs')
                    ->where('manager_matricule', $utilisateur->matricule);
            })
            ->orderByDesc('date_soumission')
            ->get();

        return response()->json([
            'success' => true,
            'data'    => [
                'en_attente' => $enAttente,
                'a_valider'  => $aValider,
            ],
        ]);
    }

    /**
     * Crée une nouvelle évaluation (brouillon)
     */
    public function store(Request $request): JsonResponse
    {
        $request->validate([
            'evalue_matricule' => 'required|string',
            'id_periode'       => 'nullable|string',
            'id_regle'         => 'nullable|string',
        ]);

        $utilisateur = Auth::user();
        $evalue = Utilisateur::where('matricule', $request->evalue_matricule)->first();

        if (!$evalue) {
            return response()->json(['success' => false, 'message' => 'Utilisateur évalué introuvable'], 404);
        }

        if (!$utilisateur->peutEvaluer($evalue)) {
            return response()->json(['success' => false, 'message' => 'Permission refusée'], 403);
        }

        // Période active si non fournie
        $idPeriode = $request->id_periode;
        if (!$idPeriode) {
            $periode = PeriodeEvaluation::where('statut', 'ouverte')->first();
            $idPeriode = $periode?->id_periode;
        }

        if (!$idPeriode) {
            return response()->json(['success' => false, 'message' => 'Aucune période active'], 422);
        }

        // Évaluation déjà existante ?
        $exists = DB::connection('pgsql')->table('evaluations')
            ->where('evaluateur_matricule', $utilisateur->matricule)
            ->where('evalue_matricule', $request->evalue_matricule)
            ->where('id_periode', $idPeriode)
            ->exists();

        if ($exists) {
            return response()->json(['success' => false, 'message' => 'Une évaluation existe déjà pour cette période'], 409);
        }

        $id = \Illuminate\Support\Str::uuid()->toString();
        DB::connection('pgsql')->table('evaluations')->insert([
            'id_evaluation'       => $id,
            'evaluateur_matricule' => $utilisateur->matricule,
            'evalue_matricule'    => $request->evalue_matricule,
            'id_periode'          => $idPeriode,
            'id_regle'            => $request->id_regle,
            'date_evaluation'     => now()->toDateString(),
            'statut'              => 'brouillon',
            'notations_json'      => json_encode([]),
            'type_evaluation'     => '360',
            'created_at'          => now(),
            'updated_at'          => now(),
        ]);

        $evaluation = DB::connection('pgsql')->table('evaluations')->where('id_evaluation', $id)->first();

        return response()->json([
            'success' => true,
            'message' => 'Évaluation créée avec succès',
            'data'    => $evaluation,
        ], 201);
    }

    /**
     * Affiche une évaluation spécifique
     */
    public function show(string $id): JsonResponse
    {
        $evaluation = DB::connection('pgsql')->table('evaluations')->where('id_evaluation', $id)->first();

        if (!$evaluation) {
            return response()->json(['success' => false, 'message' => 'Évaluation introuvable'], 404);
        }

        $utilisateur = Auth::user();

        if (!$this->peutAccederEvaluation($utilisateur, $evaluation)) {
            return response()->json(['success' => false, 'message' => 'Accès non autorisé'], 403);
        }

        return response()->json(['success' => true, 'data' => $evaluation]);
    }

    /**
     * Met à jour les notes d'une évaluation
     */
    public function update(Request $request, string $id): JsonResponse
    {
        $request->validate([
            'notes'              => 'required|array',
            'commentaire_general' => 'nullable|string|max:1000',
        ]);

        $evaluation = DB::connection('pgsql')->table('evaluations')->where('id_evaluation', $id)->first();

        if (!$evaluation) {
            return response()->json(['success' => false, 'message' => 'Évaluation introuvable'], 404);
        }

        $utilisateur = Auth::user();

        if ($evaluation->evaluateur_matricule !== $utilisateur->matricule) {
            return response()->json(['success' => false, 'message' => 'Non autorisé'], 403);
        }

        if ($evaluation->statut !== 'brouillon') {
            return response()->json(['success' => false, 'message' => 'L\'évaluation ne peut plus être modifiée'], 400);
        }

        DB::connection('pgsql')->table('evaluations')->where('id_evaluation', $id)->update([
            'notations_json'      => json_encode($request->notes),
            'commentaire_general' => $request->commentaire_general,
            'updated_at'          => now(),
        ]);

        return response()->json(['success' => true, 'message' => 'Évaluation mise à jour', 'data' => DB::connection('pgsql')->table('evaluations')->where('id_evaluation', $id)->first()]);
    }

    /**
     * Soumet une évaluation pour validation
     */
    public function submit(string $id): JsonResponse
    {
        $evaluation = DB::connection('pgsql')->table('evaluations')->where('id_evaluation', $id)->first();

        if (!$evaluation) {
            return response()->json(['success' => false, 'message' => 'Évaluation introuvable'], 404);
        }

        $utilisateur = Auth::user();

        if ($evaluation->evaluateur_matricule !== $utilisateur->matricule) {
            return response()->json(['success' => false, 'message' => 'Non autorisé'], 403);
        }

        if ($evaluation->statut !== 'brouillon') {
            return response()->json(['success' => false, 'message' => 'L\'évaluation n\'est pas en brouillon'], 400);
        }

        $notes = json_decode($evaluation->notations_json, true) ?? [];
        if (empty($notes)) {
            return response()->json(['success' => false, 'message' => 'L\'évaluation est vide'], 400);
        }

        DB::connection('pgsql')->table('evaluations')->where('id_evaluation', $id)->update([
            'statut'          => 'soumis',
            'date_soumission' => now(),
            'updated_at'      => now(),
        ]);

        // Notifier le manager de l'évalué
        $evalue = Utilisateur::where('matricule', $evaluation->evalue_matricule)->first();
        if ($evalue?->manager_matricule) {
            \App\Models\Notification::creer(
                $evalue->manager_matricule,
                'Évaluation à valider',
                "Une évaluation de {$evalue->prenom} {$evalue->nom} est en attente de validation.",
                'validation'
            );
        }

        return response()->json(['success' => true, 'message' => 'Évaluation soumise avec succès']);
    }

    /**
     * Valide ou rejette une évaluation
     */
    public function validate(Request $request, string $id): JsonResponse
    {
        $request->validate([
            'est_validee'            => 'required|boolean',
            'commentaire_validation' => 'nullable|string|max:1000',
        ]);

        $evaluation = DB::connection('pgsql')->table('evaluations')->where('id_evaluation', $id)->first();

        if (!$evaluation || $evaluation->statut !== 'soumis') {
            return response()->json(['success' => false, 'message' => 'Évaluation introuvable ou non soumise'], 404);
        }

        $utilisateur = Auth::user();

        // Vérifier que le validateur est le manager de l'évalué
        $evalue = Utilisateur::where('matricule', $evaluation->evalue_matricule)->first();
        if (!$evalue || $evalue->manager_matricule !== $utilisateur->matricule) {
            return response()->json(['success' => false, 'message' => 'Non autorisé à valider cette évaluation'], 403);
        }

        $nouveauStatut = $request->est_validee ? 'valide' : 'rejete';

        DB::connection('pgsql')->table('evaluations')->where('id_evaluation', $id)->update([
            'statut'     => $nouveauStatut,
            'updated_at' => now(),
        ]);

        // Si rejeté, remettre en brouillon pour correction
        if (!$request->est_validee) {
            DB::connection('pgsql')->table('evaluations')->where('id_evaluation', $id)->update(['statut' => 'brouillon']);
        }

        $message = $request->est_validee ? 'Évaluation validée' : 'Évaluation renvoyée en brouillon';

        return response()->json(['success' => true, 'message' => $message]);
    }

    /**
     * Récupère les périodes d'évaluation actives
     */
    public function getPeriodesActives(): JsonResponse
    {
        $periodes = PeriodeEvaluation::where('statut', 'ouverte')
            ->where('date_debut', '<=', now())
            ->where('date_fin', '>=', now())
            ->get();

        return response()->json(['success' => true, 'data' => $periodes]);
    }

    /**
     * Historique des évaluations reçues par un utilisateur
     */
    public function historique(Request $request): JsonResponse
    {
        $utilisateur  = Auth::user();
        $matriculeCible = $request->matricule ?? $utilisateur->matricule;

        // Vérifier les droits
        if ($matriculeCible !== $utilisateur->matricule) {
            $cible = Utilisateur::where('matricule', $matriculeCible)->first();
            if (!$cible) {
                return response()->json(['success' => false, 'message' => 'Utilisateur introuvable'], 404);
            }
            $peutVoir = $cible->manager_matricule === $utilisateur->matricule
                || in_array($utilisateur->role_nom, ['ADMIN', 'DR', 'CDTT']);
            if (!$peutVoir) {
                return response()->json(['success' => false, 'message' => 'Accès non autorisé'], 403);
            }
        }

        $evaluations = DB::connection('pgsql')
            ->table('evaluations')
            ->where('evalue_matricule', $matriculeCible)
            ->where('statut', 'valide')
            ->orderByDesc('date_evaluation')
            ->limit($request->limit ?? 20)
            ->get();

        return response()->json(['success' => true, 'data' => $evaluations]);
    }

    // ─────────────────────────────────────────────────────────────────────────

    private function peutAccederEvaluation($utilisateur, $evaluation): bool
    {
        if ($evaluation->evaluateur_matricule === $utilisateur->matricule) {
            return true;
        }
        if ($evaluation->evalue_matricule === $utilisateur->matricule && $evaluation->statut === 'valide') {
            return true;
        }
        // Manager de l'évalué
        $evalue = Utilisateur::where('matricule', $evaluation->evalue_matricule)->first();
        if ($evalue && $evalue->manager_matricule === $utilisateur->matricule) {
            return true;
        }
        // DR/CDTT de la même région
        if (in_array($utilisateur->role_nom, ['ADMIN', 'DR', 'CDTT'])) {
            return !$evalue || $evalue->id_region === $utilisateur->id_region
                || $utilisateur->role_nom === 'ADMIN';
        }
        return false;
    }
}
