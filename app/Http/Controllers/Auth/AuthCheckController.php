<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Auth;

class AuthCheckController extends Controller
{
    /**
     * Vérifier l'état d'authentification de l'utilisateur
     * 
     * Cette méthode est utilisée par le frontend pour vérifier si l'utilisateur
     * est toujours authentifié et récupérer ses informations
     *
     * @param Request $request
     * @return JsonResponse
     */
    public function check(Request $request): JsonResponse
    {
        try {
            // Vérifier l'authentification avec plus de détails pour le débogage
            $isAuthenticated = Auth::check();
            $user = Auth::user();
            
            // Ne pas régénérer la session lors des vérifications - cela cause des déconnexions
            // La session est déjà valide si l'utilisateur est authentifié
            
            \Log::info('Vérification d\'authentification', [
                'is_authenticated' => $isAuthenticated,
                'user_exists' => $user ? true : false,
                'user_matricule' => $user ? $user->matricule : null,
                'user_role' => $user ? $user->role_nom : null,
                'session_id' => $request->session()->getId(),
                'user_agent' => $request->userAgent(),
                'request_path' => $request->path(),
                'request_ip' => $request->ip()
            ]);
            
            if ($isAuthenticated && $user) {
                // Retourner les informations utilisateur avec un flag d'authentification
                $userData = [
                    'authenticated' => true,
                    'matricule' => $user->matricule,
                    'email' => $user->email,
                    'nom' => $user->nom,
                    'prenom' => $user->prenom,
                    'name' => $user->nom . ' ' . $user->prenom,
                    // Informations de rôle et hiérarchie nécessaires pour la redirection
                    'role' => $user->role_nom,
                    'role_nom' => $user->role_nom,
                    'region_nom' => $user->region_nom,
                    'type_region' => $user->type_region,
                    'id_branche' => $user->id_branche,
                    'branche_nom' => $user->branche_nom,
                    'niveau_hierarchique' => $user->niveau_hierarchique,
                    'manager_matricule' => $user->manager_matricule,
                    'date_prise_poste' => $user->date_prise_poste,
                    // Informations d'autorisation
                    'est_actif' => $user->est_actif,
                    'est_admin' => $user->est_admin,
                    'est_indisponible' => $user->est_indisponible
                ];
                
                \Log::info('Utilisateur authentifié dans /auth/check', [
                    'matricule' => $user->matricule,
                    'role' => $user->role_nom
                ]);
                
                return response()->json($userData);
            }

            \Log::warning('Utilisateur non authentifié dans /auth/check');
            return response()->json(['authenticated' => false, 'message' => 'Non authentifié'], 401);
        } catch (\Exception $e) {
            \Log::error('Erreur lors de la vérification d\'authentification', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            
            return response()->json(['authenticated' => false, 'message' => 'Erreur interne'], 500);
        }
    }
}
