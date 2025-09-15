<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Models\RemplacementTemporaire;
use App\Models\Utilisateur;
use App\Services\ReplacementService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Validator;
use Carbon\Carbon;

class ReplacementController extends Controller
{
    protected $replacementService;
    
    /**
     * Constructeur
     */
    public function __construct(ReplacementService $replacementService)
    {
        $this->replacementService = $replacementService;
        $this->middleware(['auth', 'role:Admin']);
    }
    
    /**
     * Affiche la liste des remplacements temporaires
     */
    public function index()
    {
        $remplacementsActifs = $this->replacementService->getRemplacementsActifs();
        $remplacementsAVenir = $this->replacementService->getRemplacementsAVenir();
        $historiqueRemplacements = $this->replacementService->getHistoriqueRemplacements(20);
        
        return view('admin.remplacements.index', [
            'remplacementsActifs' => $remplacementsActifs,
            'remplacementsAVenir' => $remplacementsAVenir,
            'historiqueRemplacements' => $historiqueRemplacements
        ]);
    }
    
    /**
     * Affiche le formulaire de création d'un remplacement
     */
    public function create()
    {
        return view('admin.remplacements.create');
    }
    
    /**
     * Enregistre un nouveau remplacement
     */
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'titulaire_matricule' => 'required|exists:utilisateurs,matricule',
            'remplacant_matricule' => 'required|exists:utilisateurs,matricule|different:titulaire_matricule',
            'role_remplace' => 'required|string|max:100',
            'region_remplacement' => 'required|string|max:100',
            'motif' => 'required|string|min:10|max:500',
            'date_debut' => 'required|date|after_or_equal:today',
            'date_fin' => 'nullable|date|after:date_debut',
            'duree_prevue_jours' => 'required|integer|min:30',
            'service_remplacement' => 'nullable|string|max:100',
            'notifier_equipe' => 'boolean',
        ]);
        
        if ($validator->fails()) {
            return redirect()->back()
                ->withErrors($validator)
                ->withInput();
        }
        
        try {
            $remplacement = $this->replacementService->creerRemplacement(
                $request->titulaire_matricule,
                $request->remplacant_matricule,
                $request->role_remplace,
                $request->region_remplacement,
                $request->motif,
                $request->date_debut,
                $request->date_fin,
                $request->duree_prevue_jours,
                $request->service_remplacement,
                Auth::user()->matricule
            );
            
            if ($request->has('notifier_equipe') && $request->notifier_equipe) {
                $this->replacementService->envoyerNotifications($remplacement->id_remplacement, true);
            } else {
                $this->replacementService->envoyerNotifications($remplacement->id_remplacement, false);
            }
            
            return redirect()->route('admin.remplacements.index')
                ->with('success', 'Remplacement temporaire créé avec succès.');
        } catch (\Exception $e) {
            return redirect()->back()
                ->with('error', 'Erreur lors de la création du remplacement: ' . $e->getMessage())
                ->withInput();
        }
    }
    
    /**
     * Affiche les détails d'un remplacement
     */
    public function show(RemplacementTemporaire $remplacement)
    {
        $remplacement->load(['titulaire', 'remplacant', 'createur', 'approbateur', 'evaluations']);
        
        return view('admin.remplacements.show', [
            'remplacement' => $remplacement
        ]);
    }
    
    /**
     * Affiche le formulaire d'édition d'un remplacement
     */
    public function edit(RemplacementTemporaire $remplacement)
    {
        $remplacement->load(['titulaire', 'remplacant']);
        
        return view('admin.remplacements.edit', [
            'remplacement' => $remplacement
        ]);
    }
    
    /**
     * Met à jour un remplacement
     */
    public function update(Request $request, RemplacementTemporaire $remplacement)
    {
        $validator = Validator::make($request->all(), [
            'motif' => 'required|string|min:10|max:500',
            'date_fin' => 'nullable|date|after:date_debut',
            'notifier_equipe' => 'boolean',
        ]);
        
        if ($validator->fails()) {
            return redirect()->back()
                ->withErrors($validator)
                ->withInput();
        }
        
        try {
            // Seuls certains champs peuvent être modifiés
            $remplacement->motif = $request->motif;
            $remplacement->date_fin = $request->date_fin;
            
            if ($request->date_fin) {
                // Calculer la durée en jours
                $dateDebut = Carbon::parse($remplacement->date_debut);
                $dateFin = Carbon::parse($request->date_fin);
                $remplacement->duree_prevue_jours = $dateDebut->diffInDays($dateFin);
            }
            
            $remplacement->save();
            
            // Mettre à jour le titulaire
            $titulaire = Utilisateur::where('matricule', $remplacement->titulaire_matricule)->first();
            if ($titulaire) {
                $titulaire->date_fin_indisponibilite = $request->date_fin;
                $titulaire->save();
            }
            
            if ($request->has('notifier_equipe') && $request->notifier_equipe) {
                $this->replacementService->envoyerNotifications($remplacement->id_remplacement, true);
            }
            
            return redirect()->route('admin.remplacements.show', $remplacement->id_remplacement)
                ->with('success', 'Remplacement temporaire mis à jour avec succès.');
        } catch (\Exception $e) {
            return redirect()->back()
                ->with('error', 'Erreur lors de la mise à jour du remplacement: ' . $e->getMessage())
                ->withInput();
        }
    }
    
    /**
     * Termine un remplacement
     */
    public function terminer(Request $request, RemplacementTemporaire $remplacement)
    {
        $validator = Validator::make($request->all(), [
            'date_fin_effective' => 'nullable|date',
            'notifier_equipe' => 'boolean',
        ]);
        
        if ($validator->fails()) {
            return redirect()->back()
                ->withErrors($validator)
                ->withInput();
        }
        
        try {
            $this->replacementService->terminerRemplacement(
                $remplacement->id_remplacement,
                $request->date_fin_effective
            );
            
            if ($request->has('notifier_equipe') && $request->notifier_equipe) {
                $this->replacementService->envoyerNotifications($remplacement->id_remplacement, true);
            }
            
            return redirect()->route('admin.remplacements.index')
                ->with('success', 'Remplacement temporaire terminé avec succès.');
        } catch (\Exception $e) {
            return redirect()->back()
                ->with('error', 'Erreur lors de la terminaison du remplacement: ' . $e->getMessage())
                ->withInput();
        }
    }
    
    /**
     * Supprime un remplacement (uniquement pour les remplacements à venir)
     */
    public function destroy(RemplacementTemporaire $remplacement)
    {
        try {
            // Vérifier que le remplacement n'a pas encore commencé
            if (!$remplacement->estAVenir()) {
                return redirect()->back()
                    ->with('error', 'Seuls les remplacements à venir peuvent être supprimés.');
            }
            
            // Réinitialiser le statut du titulaire
            $titulaire = Utilisateur::where('matricule', $remplacement->titulaire_matricule)->first();
            if ($titulaire) {
                $titulaire->statut = 'Actif';
                $titulaire->date_debut_indisponibilite = null;
                $titulaire->date_fin_indisponibilite = null;
                $titulaire->save();
            }
            
            $remplacement->delete();
            
            return redirect()->route('admin.remplacements.index')
                ->with('success', 'Remplacement temporaire supprimé avec succès.');
        } catch (\Exception $e) {
            return redirect()->back()
                ->with('error', 'Erreur lors de la suppression du remplacement: ' . $e->getMessage());
        }
    }
}
