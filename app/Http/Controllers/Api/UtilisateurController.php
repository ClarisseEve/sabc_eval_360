<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Utilisateur;
use App\Models\Role;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class UtilisateurController extends Controller
{
    /**
     * Récupère la liste des utilisateurs avec filtres optionnels
     *
     * @param  \Illuminate\Http\Request  $request
     * @return \Illuminate\Http\Response
     */
    public function index(Request $request)
    {
        $query = Utilisateur::with([
            'roleModel:id_role,nom_role',
            'regionEntity:id_region,nom_region',
        ]);
        
        // Filtres
        if ($request->filled('exclude')) {
            $query->where('matricule', '!=', $request->input('exclude'));
        }
        
        if ($request->filled('statut')) {
            $query->where('statut', $request->input('statut'));
        }
        
        if ($request->filled('id_role')) {
            $nomRole = Role::where('id_role', $request->input('id_role'))->value('nom_role');
            if ($nomRole) {
                $query->where('role', $nomRole);
            }
        }
        
        if ($request->filled('id_region')) {
            $query->where('id_region', $request->input('id_region'));
        }
        
        if ($request->filled('search')) {
            $search = $request->input('search');
            $query->where(function($q) use ($search) {
                $q->where('nom', 'like', "%{$search}%")
                  ->orWhere('prenom', 'like', "%{$search}%")
                  ->orWhere('matricule', 'like', "%{$search}%")
                  ->orWhere('email', 'like', "%{$search}%");
            });
        }
        
        $utilisateurs = $query->orderBy('nom')
            ->orderBy('prenom')
            ->get([
                'matricule',
                'nom',
                'prenom',
                'email',
                'role',
                'id_region',
                'manager_matricule',
                'statut',
                'date_debut_indisponibilite',
                'date_fin_indisponibilite',
                'roles_support_json',
            ]);

        $payload = $utilisateurs->map(function (Utilisateur $utilisateur) {
            return [
                'id_utilisateur' => $utilisateur->id_utilisateur,
                'matricule' => $utilisateur->matricule,
                'nom' => $utilisateur->nom,
                'prenom' => $utilisateur->prenom,
                'email' => $utilisateur->email,
                'role' => $utilisateur->roleModel?->nom_role ?? $utilisateur->role,
                'id_role' => $utilisateur->roleModel?->id_role,
                'region' => $utilisateur->regionEntity?->nom_region,
                'id_region' => $utilisateur->id_region,
                'manager_matricule' => $utilisateur->manager_matricule,
                'statut' => $utilisateur->statut,
                'date_debut_indisponibilite' => $utilisateur->date_debut_indisponibilite,
                'date_fin_indisponibilite' => $utilisateur->date_fin_indisponibilite,
                'roles_support_json' => $utilisateur->roles_support_json,
                'est_indisponible' => $utilisateur->estIndisponible(),
                'est_remplacant' => $utilisateur->estRemplacantActif(),
            ];
        });

        return response()->json($payload->values());
    }
    
    /**
     * Récupère les détails d'un utilisateur
     *
     * @param  \App\Models\Utilisateur  $utilisateur
     * @return \Illuminate\Http\Response
     */
    public function show(Utilisateur $utilisateur)
    {
        $utilisateur->load([
            'roleModel:id_role,nom_role',
            'regionEntity:id_region,nom_region',
            'manager:matricule,nom,prenom',
        ]);

        $remplacementActif = $utilisateur->remplacementsActifsEnTantQueRemplacant()
            ->with(['titulaire:matricule,nom,prenom,role,id_region'])
            ->first();

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
            'manager_matricule' => $utilisateur->manager_matricule,
            'manager_nom' => $utilisateur->manager
                ? trim($utilisateur->manager->prenom . ' ' . $utilisateur->manager->nom)
                : null,
            'statut' => $utilisateur->statut,
            'est_indisponible' => $utilisateur->estIndisponible(),
            'est_remplacant' => $utilisateur->estRemplacantActif(),
            'remplacement_actif' => $remplacementActif,
        ]);
    }
    
    /**
     * Récupère les subordonnés directs d'un utilisateur
     *
     * @param  \Illuminate\Http\Request  $request
     * @param  \App\Models\Utilisateur  $utilisateur
     * @return \Illuminate\Http\Response
     */
    public function getSubordonnes(Request $request, Utilisateur $utilisateur)
    {
        $subordonnes = Utilisateur::where('manager_matricule', $utilisateur->matricule)
            ->with([
                'roleModel:id_role,nom_role',
                'regionEntity:id_region,nom_region',
            ])
            ->orderBy('nom')
            ->orderBy('prenom')
            ->get([
                'matricule',
                'nom',
                'prenom',
                'role',
                'id_region',
                'statut',
                'manager_matricule',
            ]);

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
     * Récupère les utilisateurs disponibles pour un remplacement
     *
     * @param  \Illuminate\Http\Request  $request
     * @return \Illuminate\Http\Response
     */
    public function getRemplacantsDisponibles(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'titulaire_matricule' => 'required_without:id_titulaire|exists:utilisateurs,matricule',
            'id_titulaire' => 'required_without:titulaire_matricule|exists:utilisateurs,matricule',
            'date_debut' => 'required|date',
            'date_fin' => 'nullable|date|after:date_debut',
        ]);
        
        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }
        
        $titulaireMatricule = $request->input('titulaire_matricule', $request->input('id_titulaire'));
        $titulaire = Utilisateur::where('matricule', $titulaireMatricule)->firstOrFail();
        
        // Récupérer les utilisateurs qui ne sont pas déjà indisponibles ou remplaçants
        $query = Utilisateur::where('matricule', '!=', $titulaire->matricule)
            ->where('statut', 'Actif')
            ->whereNull('date_debut_indisponibilite')
            ->whereNull('roles_support_json')
            ->with([
                'roleModel:id_role,nom_role,niveau_taniere,niveau_non_taniere',
                'regionEntity:id_region,nom_region',
            ]);
            
        // Filtrer par région si demandé
        if ($request->boolean('meme_region')) {
            $query->where('id_region', $titulaire->id_region);
        }
        
        // Filtrer par niveau hiérarchique si demandé
        if ($request->filled('niveau_hierarchique_min')) {
            $niveauMin = (int) $request->input('niveau_hierarchique_min');
            $query->whereHas('roleModel', function($q) use ($niveauMin) {
                $q->where('niveau_taniere', '>=', $niveauMin)
                    ->orWhere('niveau_non_taniere', '>=', $niveauMin);
            });
        }
        
        $remplacantsPotentiels = $query->select(
            'matricule', 'nom', 'prenom', 'email',
            'role', 'id_region', 'statut', 'manager_matricule'
        )->orderBy('nom')->orderBy('prenom')->get();

        $payload = $remplacantsPotentiels->map(function (Utilisateur $utilisateur) {
            return [
                'id_utilisateur' => $utilisateur->id_utilisateur,
                'matricule' => $utilisateur->matricule,
                'nom' => $utilisateur->nom,
                'prenom' => $utilisateur->prenom,
                'email' => $utilisateur->email,
                'role' => $utilisateur->roleModel?->nom_role ?? $utilisateur->role,
                'id_role' => $utilisateur->roleModel?->id_role,
                'region' => $utilisateur->regionEntity?->nom_region,
                'id_region' => $utilisateur->id_region,
                'manager_matricule' => $utilisateur->manager_matricule,
                'statut' => $utilisateur->statut,
            ];
        });

        return response()->json($payload->values());
    }
}
