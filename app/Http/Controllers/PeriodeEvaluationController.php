<?php

namespace App\Http\Controllers;

use App\Models\PeriodeEvaluation;
use App\Models\RegleEvaluation;
use App\Models\Region;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Inertia\Inertia;
use Inertia\Response as InertiaResponse;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Validator;
use App\Traits\FormatsUserData;
use Carbon\Carbon;

class PeriodeEvaluationController extends Controller
{
    use FormatsUserData;
    /**
     * Affiche la liste des périodes d'évaluation (ADMIN uniquement)
     */
    public function index(): InertiaResponse
    {
        $user = Auth::user();
        
        // Récupérer toutes les périodes avec leurs relations
        $periodes = PeriodeEvaluation::with(['regleEvaluation', 'region'])
            ->orderBy('date_debut', 'desc')
            ->get()
            ->map(function ($periode) {
                return [
                    'id_periode' => $periode->id_periode,
                    'titre' => $periode->titre,
                    'description' => $periode->description,
                    'date_debut' => $periode->date_debut,
                    'date_fin' => $periode->date_fin,
                    'statut' => $periode->statut,
                    'est_ouverte' => $periode->est_ouverte,
                    'regle_nom' => $periode->regleEvaluation?->nom ?? 'N/A',
                    'region_nom' => $periode->region?->nom ?? 'Toutes les régions',
                    'nb_evaluations' => $periode->evaluations()->count(),
                    'nb_evaluations_completees' => $periode->evaluations()->where('statut', 'validé')->count(),
                    'created_at' => $periode->created_at,
                    'updated_at' => $periode->updated_at,
                ];
            });

        // Statistiques globales
        $statistiques = [
            'total_periodes' => $periodes->count(),
            'periodes_actives' => $periodes->where('statut', 'active')->count(),
            'periodes_ouvertes' => $periodes->where('est_ouverte', true)->count(),
            'periodes_terminees' => $periodes->where('statut', 'terminée')->count(),
        ];

        // Récupérer les données pour les formulaires
        $regles = RegleEvaluation::select('id_regle', 'nom_regle', 'criteres_evaluation_json')->get();
        $regions = Region::select('id_region', 'nom_region')->get();

        return Inertia::render('Admin/Evaluations/Periodes', [
            'periodes' => $periodes,
            'statistiques' => $statistiques,
            'regles' => $regles,
            'regions' => $regions,
            ...$this->getAdminPageData('Gestion des Périodes d\'Évaluation', [], $user),
        ]);
    }

    /**
     * Affiche le formulaire de création d'une nouvelle période
     */
    public function create(): InertiaResponse
    {
        $user = Auth::user();
        $regles = RegleEvaluation::select('id_regle', 'nom_regle', 'criteres_evaluation_json')->get();
        $regions = Region::select('id_region', 'nom_region')->get();

        return Inertia::render('Admin/Evaluations/CreatePeriode', [
            'regles' => $regles,
            'regions' => $regions,
            ...$this->getAdminPageData('Créer une Période d\'Évaluation', [], $user),
        ]);
    }

    /**
     * Stocke une nouvelle période d'évaluation
     */
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'titre' => 'required|string|max:255',
            'description' => 'nullable|string|max:1000',
            'date_debut' => 'required|date|after_or_equal:today',
            'date_fin' => 'required|date|after:date_debut',
            'id_regle' => 'required|exists:regles_evaluation,id_regle',
            'id_region' => 'nullable|exists:regions,id',
            'parametres_json' => 'nullable|json',
        ]);

        if ($validator->fails()) {
            return back()->withErrors($validator)->withInput();
        }

        try {
            $periode = PeriodeEvaluation::create([
                'titre' => $request->titre,
                'description' => $request->description,
                'date_debut' => $request->date_debut,
                'date_fin' => $request->date_fin,
                'statut' => 'planifiée', // Statut initial
                'est_ouverte' => false, // Fermée par défaut
                'id_regle' => $request->id_regle,
                'id_region' => $request->id_region,
                'parametres_json' => $request->parametres_json ? json_decode($request->parametres_json, true) : null,
            ]);

            return redirect()->route('admin.evaluations.periodes.index')
                ->with('success', 'Période d\'évaluation créée avec succès.');

        } catch (\Exception $e) {
            return back()->withErrors(['error' => 'Erreur lors de la création de la période: ' . $e->getMessage()])
                ->withInput();
        }
    }

    /**
     * Affiche une période spécifique
     */
    public function show(string $id): InertiaResponse
    {
        $periode = PeriodeEvaluation::with(['regleEvaluation', 'region', 'evaluations.evaluateur', 'evaluations.evalue'])
            ->findOrFail($id);

        // Statistiques détaillées de la période
        $evaluations = $periode->evaluations;
        $statistiques_detaillees = [
            'total_evaluations' => $evaluations->count(),
            'evaluations_brouillon' => $evaluations->where('statut', 'brouillon')->count(),
            'evaluations_soumises' => $evaluations->where('statut', 'soumis')->count(),
            'evaluations_validees' => $evaluations->where('statut', 'validé')->count(),
            'evaluations_rejetees' => $evaluations->where('statut', 'rejeté')->count(),
            'taux_completion' => $evaluations->count() > 0 
                ? round(($evaluations->where('statut', 'validé')->count() / $evaluations->count()) * 100, 2)
                : 0,
        ];

        return Inertia::render('Admin/Evaluations/ShowPeriode', [
            'periode' => [
                'id_periode' => $periode->id_periode,
                'titre' => $periode->titre,
                'description' => $periode->description,
                'date_debut' => $periode->date_debut,
                'date_fin' => $periode->date_fin,
                'statut' => $periode->statut,
                'est_ouverte' => $periode->est_ouverte,
                'regle' => $periode->regleEvaluation,
                'region' => $periode->region,
                'parametres_json' => $periode->parametres_json,
                'created_at' => $periode->created_at,
                'updated_at' => $periode->updated_at,
            ],
            'statistiques' => $statistiques_detaillees,
            'evaluations' => $evaluations->map(function ($eval) {
                return [
                    'id' => $eval->id,
                    'statut' => $eval->statut,
                    'evaluateur' => $eval->evaluateur?->nom . ' ' . $eval->evaluateur?->prenom,
                    'evalue' => $eval->evalue?->nom . ' ' . $eval->evalue?->prenom,
                    'date_soumission' => $eval->date_soumission,
                    'score_global' => $eval->score_global,
                ];
            }),
            ...$this->getAdminPageData('Détails de la Période d\'Évaluation', [], Auth::user()),
        ]);
    }

    /**
     * Active/désactive une période d'évaluation
     */
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
                        'statut' => 'active'
                    ]);
                    $message = 'Période ouverte aux évaluations.';
                    break;
                    
                case 'fermer':
                    $periode->update(['est_ouverte' => false]);
                    $message = 'Période fermée aux nouvelles évaluations.';
                    break;
                    
                case 'activer':
                    $periode->update(['statut' => 'active']);
                    $message = 'Période activée.';
                    break;
                    
                case 'terminer':
                    $periode->update([
                        'statut' => 'terminée',
                        'est_ouverte' => false
                    ]);
                    $message = 'Période terminée.';
                    break;
            }

            return back()->with('success', $message);

        } catch (\Exception $e) {
            return back()->withErrors(['error' => 'Erreur lors de la mise à jour: ' . $e->getMessage()]);
        }
    }

    /**
     * Supprime une période d'évaluation
     */
    public function destroy(string $id)
    {
        try {
            $periode = PeriodeEvaluation::findOrFail($id);
            
            // Vérifier s'il y a des évaluations liées
            if ($periode->evaluations()->count() > 0) {
                return back()->withErrors(['error' => 'Impossible de supprimer une période contenant des évaluations.']);
            }

            $periode->delete();

            return redirect()->route('admin.evaluations.periodes.index')
                ->with('success', 'Période d\'évaluation supprimée avec succès.');

        } catch (\Exception $e) {
            return back()->withErrors(['error' => 'Erreur lors de la suppression: ' . $e->getMessage()]);
        }
    }
}
