<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Utilisateur;
use App\Services\ReplacementService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Validator;

class ReplacementController extends Controller
{
    protected $replacementService;
    
    /**
     * Constructeur
     */
    public function __construct(ReplacementService $replacementService)
    {
        $this->replacementService = $replacementService;
        $this->middleware(['auth:sanctum']);
    }
    
    /**
     * Récupère la liste des remplacements actifs
     *
     * @return \Illuminate\Http\Response
     */
    public function getRemplacementsActifs()
    {
        $remplacements = $this->replacementService->getRemplacementsActifs();
        return response()->json($remplacements);
    }
    
    /**
     * Récupère la liste des remplacements à venir
     *
     * @return \Illuminate\Http\Response
     */
    public function getRemplacementsAVenir()
    {
        $remplacements = $this->replacementService->getRemplacementsAVenir();
        return response()->json($remplacements);
    }
    
    /**
     * Récupère l'historique des remplacements
     *
     * @param  \Illuminate\Http\Request  $request
     * @return \Illuminate\Http\Response
     */
    public function getHistoriqueRemplacements(Request $request)
    {
        $limit = (int) $request->input('limit', 50);
        $remplacements = $this->replacementService->getHistoriqueRemplacements($limit);
        return response()->json($remplacements);
    }
    
    /**
     * Récupère les remplacements pour un utilisateur
     *
     * @param  \Illuminate\Http\Request  $request
     * @return \Illuminate\Http\Response
     */
    public function getRemplacementsPourUtilisateur(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'matricule' => 'required|exists:utilisateurs,matricule',
            'actif_seulement' => 'boolean',
        ]);
        
        if ($validator->fails()) {
            return response()->json(['error' => $validator->errors()], 422);
        }
        
        $actifSeulement = $request->input('actif_seulement', false);
        $remplacements = $this->replacementService->getRemplacementsPourUtilisateur(
            $request->matricule,
            $actifSeulement
        );
        
        return response()->json($remplacements);
    }
    
    /**
     * Récupère les informations d'un utilisateur
     *
     * @param  \Illuminate\Http\Request  $request
     * @return \Illuminate\Http\Response
     */
    public function getUtilisateurInfo(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'matricule' => 'required|exists:utilisateurs,matricule',
        ]);
        
        if ($validator->fails()) {
            return response()->json(['error' => $validator->errors()], 422);
        }
        
        $utilisateur = Utilisateur::where('matricule', $request->matricule)
            ->with([
                'roleModel:id_role,nom_role',
                'regionEntity:id_region,nom_region',
            ])
            ->first();
            
        if (!$utilisateur) {
            return response()->json(['error' => 'Utilisateur non trouvé'], 404);
        }
        
        // Vérifier si l'utilisateur est déjà indisponible
        if ($utilisateur->estIndisponible()) {
            return response()->json([
                'error' => 'Cet utilisateur est actuellement indisponible',
                'date_debut' => $utilisateur->date_debut_indisponibilite,
                'date_fin' => $utilisateur->date_fin_indisponibilite
            ], 422);
        }
        
        // Vérifier si l'utilisateur est déjà remplaçant
        if ($utilisateur->estRemplacantActif()) {
            $remplacement = $utilisateur->remplacementsActifsEnTantQueRemplacant()
                ->with(['titulaire:matricule,nom,prenom,role,id_region'])
                ->first();
            return response()->json([
                'error' => 'Cet utilisateur est déjà remplaçant',
                'remplacement' => $remplacement
            ], 422);
        }
        
        return response()->json([
            'id_utilisateur' => $utilisateur->id_utilisateur,
            'matricule' => $utilisateur->matricule,
            'nom' => $utilisateur->nom,
            'prenom' => $utilisateur->prenom,
            'email' => $utilisateur->email,
            'role' => $utilisateur->roleModel?->nom_role ?? $utilisateur->role,
            'id_role' => $utilisateur->roleModel?->id_role,
            'region' => $utilisateur->regionEntity?->nom_region,
            'id_region' => $utilisateur->id_region,
            'statut' => $utilisateur->statut
        ]);
    }
    
    /**
     * Récupère les subordonnés directs d'un utilisateur
     *
     * @param  \Illuminate\Http\Request  $request
     * @return \Illuminate\Http\Response
     */
    public function getSubordonnes(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'matricule' => 'required|exists:utilisateurs,matricule',
        ]);
        
        if ($validator->fails()) {
            return response()->json(['error' => $validator->errors()], 422);
        }
        
        $utilisateur = Utilisateur::where('matricule', $request->matricule)->first();
        
        if (!$utilisateur) {
            return response()->json(['error' => 'Utilisateur non trouvé'], 404);
        }
        
        $subordonnes = Utilisateur::where('manager_matricule', $utilisateur->matricule)
            ->with([
                'roleModel:id_role,nom_role',
                'regionEntity:id_region,nom_region',
            ])
            ->select('matricule', 'nom', 'prenom', 'role', 'id_region', 'statut')
            ->get();

        $payload = $subordonnes->map(function (Utilisateur $subordonne) {
            return [
                'id_utilisateur' => $subordonne->id_utilisateur,
                'matricule' => $subordonne->matricule,
                'nom' => $subordonne->nom,
                'prenom' => $subordonne->prenom,
                'role' => $subordonne->roleModel?->nom_role ?? $subordonne->role,
                'id_role' => $subordonne->roleModel?->id_role,
                'region' => $subordonne->regionEntity?->nom_region,
                'id_region' => $subordonne->id_region,
                'statut' => $subordonne->statut,
                'est_indisponible' => $subordonne->estIndisponible(),
                'est_remplacant' => $subordonne->estRemplacantActif(),
            ];
        });
        
        return response()->json($payload->values());
    }
    
    /**
     * Crée un nouveau remplacement temporaire
     *
     * @param  \Illuminate\Http\Request  $request
     * @return \Illuminate\Http\Response
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
            return response()->json(['errors' => $validator->errors()], 422);
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

            if (!$remplacement) {
                return response()->json([
                    'success' => false,
                    'message' => 'Erreur lors de la création du remplacement'
                ], 500);
            }
            
            if ($request->has('notifier_equipe') && $request->notifier_equipe) {
                $this->replacementService->envoyerNotifications($remplacement->id_remplacement, true);
            } else {
                $this->replacementService->envoyerNotifications($remplacement->id_remplacement, false);
            }
            
            return response()->json([
                'success' => true,
                'message' => 'Remplacement temporaire créé avec succès',
                'remplacement' => $remplacement
            ]);
        } catch (\Throwable $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la création du remplacement: ' . $e->getMessage()
            ], 500);
        }
    }
    
    /**
     * Termine un remplacement temporaire
     *
     * @param  \Illuminate\Http\Request  $request
     * @param  int  $idRemplacement
     * @return \Illuminate\Http\Response
     */
    public function terminer(Request $request, $idRemplacement)
    {
        $validator = Validator::make($request->all(), [
            'date_fin_effective' => 'nullable|date',
            'notifier_equipe' => 'boolean',
        ]);
        
        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }
        
        try {
            $success = $this->replacementService->terminerRemplacement(
                $idRemplacement,
                $request->date_fin_effective
            );

            if (!$success) {
                return response()->json([
                    'success' => false,
                    'message' => 'Erreur lors de la terminaison du remplacement'
                ], 500);
            }
            
            if ($request->has('notifier_equipe') && $request->notifier_equipe) {
                $this->replacementService->envoyerNotifications($idRemplacement, true);
            }
            
            return response()->json([
                'success' => true,
                'message' => 'Remplacement temporaire terminé avec succès'
            ]);
        } catch (\Throwable $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la terminaison du remplacement: ' . $e->getMessage()
            ], 500);
        }
    }
}
