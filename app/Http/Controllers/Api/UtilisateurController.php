<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Utilisateur;
use App\Models\Role;
use App\Models\Region;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
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
        $query = Utilisateur::with(['role', 'region']);
        
        // Filtres
        if ($request->has('exclude')) {
            $query->where('id_utilisateur', '!=', $request->exclude);
        }
        
        if ($request->has('statut')) {
            $query->where('statut', $request->statut);
        }
        
        if ($request->has('id_role')) {
            $query->where('id_role', $request->id_role);
        }
        
        if ($request->has('id_region')) {
            $query->where('id_region', $request->id_region);
        }
        
        if ($request->has('search')) {
            $search = $request->search;
            $query->where(function($q) use ($search) {
                $q->where('nom', 'like', "%{$search}%")
                  ->orWhere('prenom', 'like', "%{$search}%")
                  ->orWhere('matricule', 'like', "%{$search}%")
                  ->orWhere('email', 'like', "%{$search}%");
            });
        }
        
        $utilisateurs = $query->select(
            'id_utilisateur', 'matricule', 'nom', 'prenom', 'email',
            'id_role', 'id_region', 'statut', 'date_debut_indisponibilite',
            'date_fin_indisponibilite', 'roles_support_json'
        )->orderBy('nom')->orderBy('prenom')->get();
        
        // Ajouter des attributs calculés
        foreach ($utilisateurs as $utilisateur) {
            $utilisateur->est_indisponible = $utilisateur->estIndisponible();
            $utilisateur->est_remplacant = $utilisateur->estRemplacantActif();
        }
        
        return response()->json($utilisateurs);
    }
    
    /**
     * Récupère les détails d'un utilisateur
     *
     * @param  \App\Models\Utilisateur  $utilisateur
     * @return \Illuminate\Http\Response
     */
    public function show(Utilisateur $utilisateur)
    {
        $utilisateur->load(['role', 'region', 'manager']);
        
        // Ajouter des attributs calculés
        $utilisateur->est_indisponible = $utilisateur->estIndisponible();
        $utilisateur->est_remplacant = $utilisateur->estRemplacantActif();
        
        // Récupérer les remplacements actifs
        $remplacementActif = $utilisateur->remplacementActifCommeRemplacant();
        if ($remplacementActif) {
            $remplacementActif->load('titulaire');
            $utilisateur->remplacement_actif = $remplacementActif;
        }
        
        return response()->json($utilisateur);
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
        $subordonnes = Utilisateur::where('id_manager', $utilisateur->id_utilisateur)
            ->select('id_utilisateur', 'matricule', 'nom', 'prenom', 'id_role', 'id_region', 'statut')
            ->with(['role:id_role,nom_role', 'region:id_region,nom_region'])
            ->orderBy('nom')
            ->orderBy('prenom')
            ->get();
            
        foreach ($subordonnes as $subordonne) {
            $subordonne->est_indisponible = $subordonne->estIndisponible();
            $subordonne->est_remplacant = $subordonne->estRemplacantActif();
        }
        
        return response()->json($subordonnes);
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
            'id_titulaire' => 'required|exists:utilisateurs,id_utilisateur',
            'date_debut' => 'required|date',
            'date_fin' => 'nullable|date|after:date_debut',
        ]);
        
        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }
        
        $titulaire = Utilisateur::findOrFail($request->id_titulaire);
        
        // Récupérer les utilisateurs qui ne sont pas déjà indisponibles ou remplaçants
        $query = Utilisateur::where('id_utilisateur', '!=', $titulaire->id_utilisateur)
            ->where('statut', 'Actif')
            ->whereNull('date_debut_indisponibilite')
            ->whereNull('roles_support_json')
            ->with(['role', 'region']);
            
        // Filtrer par région si demandé
        if ($request->has('meme_region') && $request->meme_region) {
            $query->where('id_region', $titulaire->id_region);
        }
        
        // Filtrer par niveau hiérarchique si demandé
        if ($request->has('niveau_hierarchique_min')) {
            $query->whereHas('role', function($q) use ($request, $titulaire) {
                $q->where('niveau_hierarchique', '>=', $request->niveau_hierarchique_min);
            });
        }
        
        $remplacantsPotentiels = $query->select(
            'id_utilisateur', 'matricule', 'nom', 'prenom', 'email',
            'id_role', 'id_region', 'statut'
        )->orderBy('nom')->orderBy('prenom')->get();
        
        return response()->json($remplacantsPotentiels);
    }
}
