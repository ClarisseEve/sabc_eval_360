<?php

namespace App\Http\Controllers;

use App\Models\PeriodeEvaluation;
use App\Models\RegleEvaluation;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response as InertiaResponse;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\DB;
use App\Traits\FormatsUserData;

class PeriodeEvaluationController extends Controller
{
    use FormatsUserData;

    public function index(): InertiaResponse
    {
        $user = Auth::user();

        $periodes = PeriodeEvaluation::with('regleEvaluation')
            ->orderByDesc('date_debut')
            ->get()
            ->map(function (PeriodeEvaluation $periode) {
                $statut = $periode->statut ?? ($periode->est_cloturee ? 'terminee' : ($periode->est_ouverte ? 'active' : 'planifiee'));

                $nbEvaluations = 0;
                $nbValidees = 0;

                try {
                    $nbEvaluations = $periode->evaluations()->count();
                    $nbValidees = $periode->evaluations()->where('statut', 'valide')->count();
                } catch (\Throwable $exception) {
                    \Log::warning('Unable to count evaluations for période', [
                        'periode' => $periode->id_periode,
                        'message' => $exception->getMessage(),
                    ]);
                }

                return [
                    'id_periode' => $periode->id_periode,
                    'code_periode' => $periode->code_periode,
                    'nom_periode' => $periode->nom_periode,
                    'titre' => $periode->titre ?? $periode->nom_periode,
                    'description' => $periode->description,
                    'date_debut' => $periode->date_debut,
                    'date_fin' => $periode->date_fin,
                    'statut' => $statut,
                    'est_ouverte' => (bool) $periode->est_ouverte,
                    'est_cloturee' => (bool) $periode->est_cloturee,
                    'regle_nom' => $periode->regleEvaluation?->nom_regle ?? 'N/A',
                    'nb_evaluations' => $nbEvaluations,
                    'nb_evaluations_completees' => $nbValidees,
                    'created_at' => $periode->created_at,
                    'updated_at' => $periode->updated_at,
                ];
            });

        $statistiques = [
            'total_periodes' => $periodes->count(),
            'periodes_actives' => $periodes->where('statut', 'active')->count(),
            'periodes_ouvertes' => $periodes->where('est_ouverte', true)->count(),
            'periodes_terminees' => $periodes->where('statut', 'terminee')->count(),
        ];

        $regles = RegleEvaluation::select('id_regle', 'nom_regle', 'criteres_evaluation_json')->get();

        return Inertia::render('Admin/Evaluations/Periodes', [
            'periodes' => $periodes,
            'statistiques' => $statistiques,
            'regles' => $regles,
            'regions' => collect(),
            ...$this->getAdminPageData("Gestion des Périodes d'Évaluation", [], $user),
        ]);
    }

    public function create(): InertiaResponse
    {
        $user = Auth::user();
        $regles = RegleEvaluation::select('id_regle', 'nom_regle', 'criteres_evaluation_json')->get();

        return Inertia::render('Admin/Evaluations/CreatePeriode', [
            'regles' => $regles,
            'regions' => collect(),
            ...$this->getAdminPageData("Créer une Période d'Évaluation", [], $user),
        ]);
    }

    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'titre' => 'required|string|max:255',
            'description' => 'nullable|string|max:1000',
            'date_debut' => 'required|date|after_or_equal:today',
            'date_fin' => 'required|date|after:date_debut',
            'id_regle' => 'required|exists:regles_evaluation,id_regle',
            'parametres_json' => 'nullable|json',
        ]);

        if ($validator->fails()) {
            return back()->withErrors($validator)->withInput();
        }

        try {
            $nomPeriode = $request->titre;
            $codePeriode = $this->generatePeriodeCode();

            PeriodeEvaluation::create([
                'code_periode' => $codePeriode,
                'nom_periode' => $nomPeriode,
                'titre' => $nomPeriode,
                'description' => $request->description,
                'date_debut' => $request->date_debut,
                'date_fin' => $request->date_fin,
                'statut' => 'planifiee',
                'est_ouverte' => false,
                'est_cloturee' => false,
                'id_regle' => $request->id_regle,
                'parametres_json' => $request->parametres_json ? json_decode($request->parametres_json, true) : null,
            ]);

            return redirect()->route('admin.evaluations.periodes.index')
                ->with('success', "Période d'évaluation créée avec succès.");
        } catch (\Exception $e) {
            return back()
                ->withErrors(['error' => "Erreur lors de la création de la période: {$e->getMessage()}"])
                ->withInput();
        }
    }

    public function show(string $id): InertiaResponse
    {
        $periode = PeriodeEvaluation::with(['regleEvaluation', 'evaluations.evaluateur', 'evaluations.evalue'])
            ->findOrFail($id);

        $evaluations = $periode->evaluations;
        $statistiques = [
            'total_evaluations' => $evaluations->count(),
            'evaluations_brouillon' => $evaluations->where('statut', 'brouillon')->count(),
            'evaluations_soumises' => $evaluations->where('statut', 'soumis')->count(),
            'evaluations_validees' => $evaluations->where('statut', 'valide')->count(),
            'evaluations_rejetees' => $evaluations->where('statut', 'rejete')->count(),
            'taux_completion' => $evaluations->count() > 0
                ? round(($evaluations->where('statut', 'valide')->count() / $evaluations->count()) * 100, 2)
                : 0,
        ];

        return Inertia::render('Admin/Evaluations/ShowPeriode', [
            'periode' => [
                'id_periode' => $periode->id_periode,
                'code_periode' => $periode->code_periode,
                'nom_periode' => $periode->nom_periode,
                'titre' => $periode->titre ?? $periode->nom_periode,
                'description' => $periode->description,
                'date_debut' => $periode->date_debut,
                'date_fin' => $periode->date_fin,
                'statut' => $periode->statut,
                'est_ouverte' => $periode->est_ouverte,
                'est_cloturee' => $periode->est_cloturee,
                'regle' => $periode->regleEvaluation,
                'parametres_json' => $periode->parametres_json,
                'created_at' => $periode->created_at,
                'updated_at' => $periode->updated_at,
            ],
            'statistiques' => $statistiques,
            'evaluations' => $evaluations->map(function ($evaluation) {
                return [
                    'id' => $evaluation->id,
                    'statut' => $evaluation->statut,
                    'evaluateur' => trim(($evaluation->evaluateur?->nom ?? '') . ' ' . ($evaluation->evaluateur?->prenom ?? '')),
                    'evalue' => trim(($evaluation->evalue?->nom ?? '') . ' ' . ($evaluation->evalue?->prenom ?? '')),
                    'date_soumission' => $evaluation->date_soumission,
                    'score_global' => $evaluation->note_globale,
                ];
            }),
            ...$this->getAdminPageData("Détails de la Période d'Évaluation", [], Auth::user()),
        ]);
    }

    public function toggleStatus(Request $request, string $id)
    {
        $periode = PeriodeEvaluation::findOrFail($id);

        $validator = Validator::make($request->all(), [
            'action' => 'required|in:ouvrir,fermer,activer,terminer',
        ]);

        if ($validator->fails()) {
            return back()->withErrors($validator);
        }

        try {
            switch ($request->action) {
                case 'ouvrir':
                    $periode->update([
                        'est_ouverte' => true,
                        'est_cloturee' => false,
                        'statut' => 'active',
                    ]);
                    $message = 'Période ouverte aux évaluations.';
                    break;

                case 'fermer':
                    $periode->update([
                        'est_ouverte' => false,
                        'est_cloturee' => true,
                        'statut' => 'fermee',
                    ]);
                    $message = 'Période fermée aux nouvelles évaluations.';
                    break;

                case 'activer':
                    $periode->update([
                        'est_ouverte' => true,
                        'est_cloturee' => false,
                        'statut' => 'active',
                    ]);
                    $message = 'Période activée.';
                    break;

                case 'terminer':
                    $periode->update([
                        'est_ouverte' => false,
                        'est_cloturee' => true,
                        'statut' => 'terminee',
                    ]);
                    $message = 'Période terminée.';
                    break;

                default:
                    $message = 'Action effectuée sur la période.';
                    break;
            }

            return back()->with('success', $message);
        } catch (\Exception $e) {
            return back()->withErrors(['error' => "Erreur lors de la mise à jour: {$e->getMessage()}"]); 
        }
    }

    public function destroy(string $id)
    {
        try {
            $periode = PeriodeEvaluation::findOrFail($id);

            if ($periode->evaluations()->count() > 0) {
                return back()->withErrors(['error' => 'Impossible de supprimer une période contenant des évaluations.']);
            }

            $periode->delete();

            return redirect()->route('admin.evaluations.periodes.index')
                ->with('success', "Période d'évaluation supprimée avec succès.");
        } catch (\Exception $e) {
            return back()->withErrors(['error' => "Erreur lors de la suppression: {$e->getMessage()}"]); 
        }
    }

    private function generatePeriodeCode(): string
    {
        $connection = DB::connection('pgsql');

        $next = (int) $connection->table('periodes_evaluation')->max('id_periode') + 1;
        $code = 'L' . str_pad((string) $next, 6, '0', STR_PAD_LEFT);

        while ($connection->table('periodes_evaluation')->where('code_periode', $code)->exists()) {
            $next++;
            $code = 'L' . str_pad((string) $next, 6, '0', STR_PAD_LEFT);
        }

        return $code;
    }
}
