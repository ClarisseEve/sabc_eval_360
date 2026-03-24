<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\RemplacementTemporaire;
use App\Models\Utilisateur;
use App\Models\Role;
use App\Models\Region;
use App\Services\ReplacementService;
use App\Traits\FormatsUserData;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Validator;
use Inertia\Inertia;
use Inertia\Response as InertiaResponse;
use Carbon\Carbon;

class ReplacementController extends Controller
{
    use FormatsUserData;
    
    protected $replacementService;
    
    public function __construct(ReplacementService $replacementService)
    {
        $this->replacementService = $replacementService;
    }
    
    /**
     * Affiche la liste des remplacements temporaires
     *
     * @return \Illuminate\Http\Response
     */
    public function index()
    {
        $remplacementsActifs = $this->replacementService->getRemplacementsActifs();
        $remplacementsAVenir = $this->replacementService->getRemplacementsAVenir();
        $historiqueRemplacements = $this->replacementService->getHistoriqueRemplacements(20);
        
        return Inertia::render('Admin/Remplacements/index', [
            'remplacementsActifs' => $remplacementsActifs,
            'remplacementsAVenir' => $remplacementsAVenir,
            'historiqueRemplacements' => $historiqueRemplacements,
        ]);
    }
    
    /**
     * Affiche le formulaire de création d'un remplacement
     *
     * @return \Illuminate\Http\Response
     */
    public function create()
    {
        $utilisateurs = Utilisateur::where('statut', 'Actif')
            ->orderBy('nom')
            ->orderBy('prenom')
            ->get();
            
        $regions = Region::all();
        $roles = Role::all();
        
        return view('admin.remplacements.create', [
            'utilisateurs' => $utilisateurs,
            'regions' => $regions,
            'roles' => $roles,
        ]);
    }
    
    /**
     * Enregistre un nouveau remplacement
     *
     * @param  \Illuminate\Http\Request  $request
     * @return \Illuminate\Http\Response
     */
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'titulaire_matricule' => 'required|exists:utilisateurs,matricule',
            'remplacant_matricule' => 'required|exists:utilisateurs,matricule|different:titulaire_matricule',
            'role_remplace' => 'required|string|max:50',
            'region_remplacement' => 'required|string|max:100',
            'service_remplacement' => 'nullable|string|max:100',
            'date_debut' => 'required|date|after_or_equal:today',
            'date_fin' => 'nullable|date|after:date_debut',
            'duree_prevue_jours' => 'required|integer|min:30',
            'motif' => 'required|string|max:100',
            'notifier_equipe' => 'boolean',
        ]);
        
        if ($validator->fails()) {
            return redirect()->back()
                ->withErrors($validator)
                ->withInput();
        }
        
        $titulaire = Utilisateur::where('matricule', $request->titulaire_matricule)->first();
        $remplacant = Utilisateur::where('matricule', $request->remplacant_matricule)->first();
        
        if (!$titulaire || !$remplacant) {
            return redirect()->back()
                ->with('error', 'Titulaire ou remplaçant introuvable')
                ->withInput();
        }
        
        // Vérifier que le titulaire n'est pas déjà indisponible
        if ($titulaire->estIndisponible()) {
            return redirect()->back()
                ->with('error', 'Le titulaire est déjà indisponible')
                ->withInput();
        }
        
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
            Auth::user()->matricule,
            null,
            $request->has('notifier_equipe')
        );
        
        if (!$remplacement) {
            return redirect()->back()
                ->with('error', 'Une erreur est survenue lors de la création du remplacement')
                ->withInput();
        }
        
        // Envoyer les notifications
        $this->replacementService->envoyerNotifications(
            $remplacement->id_remplacement,
            $request->has('notifier_equipe')
        );
        
        return redirect()->route('admin.remplacements.index')
            ->with('success', 'Remplacement créé avec succès');
    }
    
    /**
     * Affiche les détails d'un remplacement
     *
     * @param  int  $id
     * @return \Illuminate\Http\Response
     */
    public function show($id)
    {
        $remplacement = RemplacementTemporaire::with(['titulaire', 'remplacant'])
            ->findOrFail($id);
            
        return view('admin.remplacements.show', [
            'remplacement' => $remplacement,
        ]);
    }
    
    /**
     * Affiche le formulaire de modification d'un remplacement
     *
     * @param  int  $id
     * @return \Illuminate\Http\Response
     */
    public function edit($id)
    {
        $remplacement = RemplacementTemporaire::findOrFail($id);
        
        // On ne peut modifier que les remplacements à venir
        if ($remplacement->date_debut <= Carbon::today() || !$remplacement->est_actif) {
            return redirect()->route('admin.remplacements.show', $id)
                ->with('error', 'Seuls les remplacements à venir peuvent être modifiés');
        }
        
        $utilisateurs = Utilisateur::where('statut', 'Actif')
            ->orderBy('nom')
            ->orderBy('prenom')
            ->get();
            
        $regions = Region::all();
        $roles = Role::all();
        
        return view('admin.remplacements.edit', [
            'remplacement' => $remplacement,
            'utilisateurs' => $utilisateurs,
            'regions' => $regions,
            'roles' => $roles,
        ]);
    }
    
    /**
     * Met à jour un remplacement
     *
     * @param  \Illuminate\Http\Request  $request
     * @param  int  $id
     * @return \Illuminate\Http\Response
     */
    public function update(Request $request, $id)
    {
        $remplacement = RemplacementTemporaire::findOrFail($id);
        
        // On ne peut modifier que les remplacements à venir
        if ($remplacement->date_debut <= Carbon::today() || !$remplacement->est_actif) {
            return redirect()->route('admin.remplacements.show', $id)
                ->with('error', 'Seuls les remplacements à venir peuvent être modifiés');
        }
        
        $validator = Validator::make($request->all(), [
            'date_debut' => 'required|date|after_or_equal:today',
            'date_fin' => 'nullable|date|after:date_debut',
            'duree_prevue_jours' => 'required|integer|min:30',
            'motif' => 'required|string|max:100',
            'service_remplacement' => 'nullable|string|max:100',
        ]);
        
        if ($validator->fails()) {
            return redirect()->back()
                ->withErrors($validator)
                ->withInput();
        }
        
        // Mettre à jour le remplacement
        $remplacement->date_debut = $request->date_debut;
        $remplacement->date_fin = $request->date_fin;
        $remplacement->duree_prevue_jours = $request->duree_prevue_jours;
        $remplacement->motif = $request->motif;
        $remplacement->service_remplacement = $request->service_remplacement;
        $remplacement->save();
        
        // Mettre à jour le titulaire
        $titulaire = Utilisateur::where('matricule', $remplacement->titulaire_matricule)->first();
        if ($titulaire) {
            $titulaire->date_debut_indisponibilite = $request->date_debut;
            $titulaire->date_fin_indisponibilite = $request->date_fin;
            $titulaire->motif_indisponibilite = $request->motif;
            $titulaire->save();
        }
        
        return redirect()->route('admin.remplacements.show', $id)
            ->with('success', 'Remplacement mis à jour avec succès');
    }
    
    /**
     * Termine un remplacement via requête DELETE (compat front Inertia)
     *
     * @param  int  $id
     * @return \Illuminate\Http\Response
     */
    public function destroy($id)
    {
        $success = $this->replacementService->terminerRemplacement($id, Carbon::today()->format('Y-m-d'));

        if (!$success) {
            return redirect()->back()
                ->with('error', 'Une erreur est survenue lors de la suppression du remplacement');
        }

        return redirect()->route('admin.remplacements.index')
            ->with('success', 'Remplacement supprimé avec succès');
    }

    /**
     * Termine un remplacement
     *
     * @param  int  $id
     * @return \Illuminate\Http\Response
     */
    public function terminer(Request $request, $id)
    {
        $validator = Validator::make($request->all(), [
            'date_fin_effective' => 'nullable|date',
            'confirmation' => 'required|accepted',
        ]);
        
        if ($validator->fails()) {
            return redirect()->back()
                ->withErrors($validator)
                ->withInput();
        }
        
        $dateFin = $request->date_fin_effective ?? Carbon::today()->format('Y-m-d');
        
        $success = $this->replacementService->terminerRemplacement($id, $dateFin);
        
        if (!$success) {
            return redirect()->back()
                ->with('error', 'Une erreur est survenue lors de la terminaison du remplacement');
        }
        
        return redirect()->route('admin.remplacements.index')
            ->with('success', 'Remplacement terminé avec succès');
    }
    
    /**
     * Récupère les informations d'un utilisateur (pour AJAX)
     *
     * @param  \Illuminate\Http\Request  $request
     * @return \Illuminate\Http\Response
     */
    public function getUtilisateurInfo(Request $request)
    {
        $matricule = $request->matricule;
        
        $utilisateur = Utilisateur::with(['role', 'region'])
            ->where('matricule', $matricule)
            ->first();
            
        if (!$utilisateur) {
            return response()->json(['error' => 'Utilisateur introuvable'], 404);
        }
        
        return response()->json([
            'id_utilisateur' => $utilisateur->id_utilisateur,
            'nom' => $utilisateur->nom,
            'prenom' => $utilisateur->prenom,
            'role' => $utilisateur->role->nom_role,
            'id_role' => $utilisateur->id_role,
            'region' => $utilisateur->region->nom_region,
            'id_region' => $utilisateur->id_region,
            'statut' => $utilisateur->statut,
            'est_indisponible' => $utilisateur->estIndisponible(),
            'est_remplacant' => $utilisateur->estRemplacantActif(),
        ]);
    }
    
    /**
     * Récupère les subordonnés d'un utilisateur (pour AJAX)
     *
     * @param  \Illuminate\Http\Request  $request
     * @return \Illuminate\Http\Response
     */
    public function getSubordonnes(Request $request)
    {
        $matricule = $request->matricule;
        
        $utilisateur = Utilisateur::where('matricule', $matricule)->first();
        
        if (!$utilisateur) {
            return response()->json(['error' => 'Utilisateur introuvable'], 404);
        }
        
        $subordonnes = Utilisateur::where('manager_matricule', $utilisateur->matricule)
            ->select('matricule', 'nom', 'prenom', 'role')
            ->get();
            
        return response()->json($subordonnes);
    }
}
