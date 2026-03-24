<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Evaluation;
use App\Models\Utilisateur;
use App\Models\PeriodeEvaluation;
use App\Models\ScoreUtilisateur;
use App\Services\AnalyticsServiceProxy;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;

class AnalyticsController extends Controller
{
    protected AnalyticsServiceProxy $analyticsProxy;

    public function __construct(AnalyticsServiceProxy $analyticsProxy)
    {
        $this->analyticsProxy = $analyticsProxy;
    }

    /**
     * Données agrégées pour le dashboard analytique (admin/DR)
     */
    public function dashboard(Request $request): JsonResponse
    {
        $utilisateur = Auth::user();

        $roleNom = $utilisateur->role_nom ?? ($utilisateur->role->nom_role ?? '');

        // Essayer le microservice analytics d'abord, fallback sur MySQL
        try {
            $data = $this->analyticsProxy->getDashboardData($utilisateur);
            if ($data) {
                return response()->json(['success' => true, 'data' => $data, 'source' => 'microservice']);
            }
        } catch (\Throwable $e) {
            // fallback silencieux vers MySQL
        }

        // Fallback : calculs directs depuis MySQL
        $idRegion = $utilisateur->id_region ?? null;

        $baseQuery = Evaluation::query();
        if (!in_array($roleNom, ['ADMIN']) && $idRegion) {
            $baseQuery->whereHas('evalue', fn($q) => $q->where('id_region', $idRegion));
        }

        $total = (clone $baseQuery)->count();
        $valides = (clone $baseQuery)->where('statut', 'valide')->count();
        $en_attente = (clone $baseQuery)->where('statut', 'brouillon')->count();
        $soumises = (clone $baseQuery)->where('statut', 'soumis')->count();

        $scoresMoyen = (clone $baseQuery)
            ->where('statut', 'valide')
            ->whereNotNull('note_globale')
            ->avg('note_globale');

        $periodeActive = PeriodeEvaluation::where('statut', 'ouverte')->first();

        return response()->json([
            'success' => true,
            'source' => 'mysql',
            'data' => [
                'evaluations' => [
                    'total'      => $total,
                    'validees'   => $valides,
                    'en_attente' => $en_attente,
                    'soumises'   => $soumises,
                    'taux_completion' => $total > 0 ? round(($valides / $total) * 100, 1) : 0,
                ],
                'score_moyen'   => $scoresMoyen ? round($scoresMoyen, 2) : null,
                'periode_active' => $periodeActive ? [
                    'id'         => $periodeActive->id_periode,
                    'nom'        => $periodeActive->nom_periode,
                    'date_debut' => $periodeActive->date_debut,
                    'date_fin'   => $periodeActive->date_fin,
                ] : null,
            ],
        ]);
    }

    /**
     * Statistiques des évaluations pour la période courante
     */
    public function evaluations(Request $request): JsonResponse
    {
        $utilisateur = Auth::user();
        $idRegion = $utilisateur->id_region ?? null;
        $roleNom = $utilisateur->role_nom ?? ($utilisateur->role->nom_role ?? '');

        $query = Evaluation::with(['evalue.role', 'periode'])
            ->select('statut', DB::raw('count(*) as total'))
            ->groupBy('statut');

        if (!in_array($roleNom, ['ADMIN']) && $idRegion) {
            $query->whereHas('evalue', fn($q) => $q->where('id_region', $idRegion));
        }

        $stats = $query->get()->keyBy('statut');

        return response()->json([
            'success' => true,
            'data' => [
                'brouillon' => $stats['brouillon']->total ?? 0,
                'soumis'    => $stats['soumis']->total ?? 0,
                'valide'    => $stats['valide']->total ?? 0,
                'rejete'    => $stats['rejete']->total ?? 0,
            ],
        ]);
    }

    /**
     * Performances par rôle pour la région de l'utilisateur
     */
    public function performances(Request $request): JsonResponse
    {
        $utilisateur = Auth::user();
        $idRegion = $utilisateur->id_region ?? null;
        $roleNom = $utilisateur->role_nom ?? ($utilisateur->role->nom_role ?? '');

        $query = ScoreUtilisateur::with(['utilisateur.role'])
            ->select('id_role', DB::raw('avg(score_global) as score_moyen'), DB::raw('count(*) as nb'))
            ->groupBy('id_role');

        if (!in_array($roleNom, ['ADMIN']) && $idRegion) {
            $query->whereHas('utilisateur', fn($q) => $q->where('id_region', $idRegion));
        }

        $performances = $query->get()->map(function ($item) {
            return [
                'id_role'     => $item->id_role,
                'role_nom'    => $item->utilisateur->role->nom_role ?? 'N/A',
                'score_moyen' => round($item->score_moyen, 2),
                'nb_evalues'  => $item->nb,
            ];
        });

        return response()->json([
            'success' => true,
            'data' => $performances,
        ]);
    }

    /**
     * Analytics pour une région spécifique (DR/ADMIN)
     */
    public function region(Request $request, int $idRegion): JsonResponse
    {
        $utilisateur = Auth::user();
        $roleNom = $utilisateur->role_nom ?? ($utilisateur->role->nom_role ?? '');

        // Seuls DR (de leur région) et ADMIN peuvent accéder
        if (!in_array($roleNom, ['ADMIN', 'DR']) && $utilisateur->id_region !== $idRegion) {
            return response()->json(['success' => false, 'message' => 'Accès non autorisé'], 403);
        }

        $utilisateursRegion = Utilisateur::where('id_region', $idRegion)
            ->with('role')
            ->get();

        $evaluationsRegion = Evaluation::whereHas('evalue', fn($q) => $q->where('id_region', $idRegion))
            ->select('statut', DB::raw('count(*) as total'))
            ->groupBy('statut')
            ->get()
            ->keyBy('statut');

        return response()->json([
            'success' => true,
            'data' => [
                'total_utilisateurs'     => $utilisateursRegion->count(),
                'repartition_par_role'   => $utilisateursRegion->groupBy('role.nom_role')->map->count(),
                'evaluations_brouillon'  => $evaluationsRegion['brouillon']->total ?? 0,
                'evaluations_soumises'   => $evaluationsRegion['soumis']->total ?? 0,
                'evaluations_validees'   => $evaluationsRegion['valide']->total ?? 0,
            ],
        ]);
    }
}
