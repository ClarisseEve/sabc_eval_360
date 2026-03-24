<?php

namespace App\Http\Controllers;

use App\Models\PeriodeEvaluation;
use App\Models\RegleEvaluation;
use App\Services\PeriodeEvaluationService;
use App\Exceptions\PeriodeChevauchementException;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response as InertiaResponse;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\DB;
use App\Traits\FormatsUserData;
use Carbon\Carbon;

class PeriodeEvaluationController extends Controller
{
    use FormatsUserData;
    
    protected PeriodeEvaluationService $periodeService;
    
    public function __construct(PeriodeEvaluationService $periodeService)
    {
        $this->periodeService = $periodeService;
    }

    public function index(): InertiaResponse
    {
        $user = Auth::user();

        $periodes = PeriodeEvaluation::with('regleEvaluation')
            ->withCount([
                'evaluations',
                'evaluations as evaluations_validees_count' => function ($query) {
                    $query->where('statut', 'valide');
                },
            ])
            ->orderByDesc('date_debut')
            ->get()
            ->map(function (PeriodeEvaluation $periode) {
                $statut = $periode->statut ?? ($periode->est_cloturee ? 'fermee' : ($periode->est_ouverte ? 'ouverte' : 'planifiee'));

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
                    'nb_evaluations' => (int) ($periode->evaluations_count ?? 0),
                    'nb_evaluations_completees' => (int) ($periode->evaluations_validees_count ?? 0),
                    'created_at' => $periode->created_at,
                    'updated_at' => $periode->updated_at,
                ];
            });

        $statistiques = [
            'total_periodes' => $periodes->count(),
            'periodes_actives' => $periodes->where('statut', 'ouverte')->count(),
            'periodes_ouvertes' => $periodes->where('est_ouverte', true)->count(),
            'periodes_terminees' => $periodes->whereIn('statut', ['fermee', 'archivee'])->count(),
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
            'dates_rappels' => 'nullable|array',
        ]);

        if ($validator->fails()) {
            return back()->withErrors($validator)->withInput();
        }

        try {
            $dateDebut = Carbon::parse($request->date_debut);
            $dateFin = Carbon::parse($request->date_fin);
            
            // Validation des dates selon règles SABC
            $this->periodeService->validateDates($dateDebut, $dateFin, true);
            
            // Validation chevauchement
            $this->periodeService->validateNoChevauchement($dateDebut, $dateFin);
            
            $nomPeriode = $request->titre;
            $codePeriode = $this->generatePeriodeCode();
            
            // Générer dates rappels si non fournies
            $datesRappels = $request->dates_rappels ?? 
                $this->periodeService->generateDatesRappels($dateFin);

            $periode = PeriodeEvaluation::create([
                'code_periode' => $codePeriode,
                'nom_periode' => $nomPeriode,
                'titre' => $nomPeriode,
                'description' => $request->description,
                'date_debut' => $dateDebut,
                'date_fin' => $dateFin,
                'statut' => 'planifiee',
                'est_ouverte' => false,
                'est_cloturee' => false,
                'id_regle' => $request->id_regle,
                'rappels_envoyes' => $datesRappels,
                'parametres_json' => $request->parametres_json ? json_decode($request->parametres_json, true) : null,
            ]);
            
            // Calculer statistiques initiales
            $this->periodeService->calculateStatistiques($periode);

            return redirect()->route('admin.evaluations.periodes.index')
                ->with('success', "Période d'évaluation créée avec succès.");
        } catch (PeriodeChevauchementException $e) {
            return back()
                ->withErrors(['dates' => $e->getMessage()])
                ->withInput();
        } catch (\InvalidArgumentException $e) {
            return back()
                ->withErrors(['dates' => $e->getMessage()])
                ->withInput();
        } catch (\Exception $e) {
            return back()
                ->withErrors(['error' => "Erreur lors de la création de la période: {$e->getMessage()}"])
                ->withInput();
        }
    }

    public function edit(string $id): InertiaResponse
    {
        $periode = PeriodeEvaluation::with('regleEvaluation')->findOrFail($id);
        
        if (!$periode->estModifiable()) {
            return redirect()->route('admin.evaluations.periodes.index')
                ->withErrors(['periode' => 'Cette période ne peut plus être modifiée car elle est ouverte ou fermée']);
        }
        
        $regles = RegleEvaluation::select('id_regle', 'nom_regle', 'criteres_evaluation_json')->get();
        
        return Inertia::render('Admin/Evaluations/EditPeriode', [
            'periode' => [
                'id_periode' => $periode->id_periode,
                'code_periode' => $periode->code_periode,
                'nom_periode' => $periode->nom_periode,
                'titre' => $periode->titre ?? $periode->nom_periode,
                'description' => $periode->description,
                'date_debut' => $periode->date_debut->format('Y-m-d'),
                'date_fin' => $periode->date_fin->format('Y-m-d'),
                'id_regle' => $periode->id_regle,
                'dates_rappels' => $periode->getDatesRappels(),
                'statut' => $periode->statut,
            ],
            'regles' => $regles,
            ...$this->getAdminPageData("Modifier la Période d'Évaluation", [], Auth::user()),
        ]);
    }
    
    public function update(Request $request, string $id)
    {
        $periode = PeriodeEvaluation::findOrFail($id);
        
        if (!$periode->estModifiable()) {
            return back()->withErrors([
                'periode' => 'Cette période ne peut plus être modifiée car elle est ouverte ou fermée'
            ]);
        }
        
        $validator = Validator::make($request->all(), [
            'titre' => 'required|string|max:255',
            'description' => 'nullable|string|max:1000',
            'date_debut' => 'required|date',
            'date_fin' => 'required|date|after:date_debut',
            'id_regle' => 'required|exists:regles_evaluation,id_regle',
            'dates_rappels' => 'nullable|array',
        ]);

        if ($validator->fails()) {
            return back()->withErrors($validator)->withInput();
        }

        try {
            $dateDebut = Carbon::parse($request->date_debut);
            $dateFin = Carbon::parse($request->date_fin);
            
            // Validation des dates
            $this->periodeService->validateDates($dateDebut, $dateFin, false);
            
            // Validation chevauchement (exclure période courante)
            $this->periodeService->validateNoChevauchement($dateDebut, $dateFin, $id);
            
            // Générer dates rappels si non fournies
            $datesRappels = $request->dates_rappels ?? 
                $this->periodeService->generateDatesRappels($dateFin);

            $periode->update([
                'nom_periode' => $request->titre,
                'titre' => $request->titre,
                'description' => $request->description,
                'date_debut' => $dateDebut,
                'date_fin' => $dateFin,
                'id_regle' => $request->id_regle,
                'rappels_envoyes' => $datesRappels,
            ]);

            return redirect()->route('admin.evaluations.periodes.index')
                ->with('success', "Période d'évaluation mise à jour avec succès.");
        } catch (PeriodeChevauchementException $e) {
            return back()
                ->withErrors(['dates' => $e->getMessage()])
                ->withInput();
        } catch (\InvalidArgumentException $e) {
            return back()
                ->withErrors(['dates' => $e->getMessage()])
                ->withInput();
        } catch (\Exception $e) {
            return back()
                ->withErrors(['error' => "Erreur lors de la mise à jour: {$e->getMessage()}"])
                ->withInput();
        }
    }
    
    public function show(string $id): InertiaResponse
    {
        $periode = PeriodeEvaluation::with(['regleEvaluation', 'evaluations.evaluateur', 'evaluations.evalue'])
            ->findOrFail($id);

        // Recalculer statistiques via le service
        $statistiques = $this->periodeService->calculateStatistiques($periode);
        
        $evaluations = $periode->evaluations;

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
                        'statut' => 'ouverte',
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
                        'statut' => 'ouverte',
                    ]);
                    $message = 'Période activée.';
                    break;

                case 'terminer':
                    $periode->update([
                        'est_ouverte' => false,
                        'est_cloturee' => true,
                        'statut' => 'archivee',
                    ]);
                    $message = 'Période archivée.';
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

            if (!$this->periodeService->canDelete($periode)) {
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
