<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Inertia\Response;
use App\Traits\FormatsUserData;
use App\Models\Evaluation;
use App\Models\PeriodeEvaluation;

/**
 * Contrôleur centralisé pour tous les tableaux de bord SABC
 * 
 * Conforme aux règles métier SABC pour l'affichage cohérent des données utilisateur
 * dans la navbar et les composants de l'interface
 */
class DashboardController extends Controller
{
    use FormatsUserData;

    /**
     * Calcule les statistiques de base pour le dashboard d'un utilisateur
     */
    private function getDashboardStats($user): array
    {
        if (!$user) {
            return [];
        }

        $matricule = $user->matricule;

        $enAttente = Evaluation::where('evaluateur_matricule', $matricule)
            ->whereIn('statut', ['brouillon', 'soumis'])
            ->count();

        $total = Evaluation::where('evaluateur_matricule', $matricule)->count();

        $scorePersonnel = Evaluation::where('evalue_matricule', $matricule)
            ->where('statut', 'valide')
            ->whereNotNull('note_globale')
            ->orderByDesc('created_at')
            ->value('note_globale');

        $periodeActive = PeriodeEvaluation::where('statut', 'ouverte')->first();

        return [
            'evaluations_en_attente' => $enAttente,
            'evaluations_total'      => $total,
            'score_personnel'        => $scorePersonnel ? round($scorePersonnel, 1) : null,
            'periode_active'         => $periodeActive ? [
                'id'   => $periodeActive->id_periode,
                'nom'  => $periodeActive->nom_periode,
                'fin'  => $periodeActive->date_fin,
            ] : null,
        ];
    }

    /**
     * Tableau de bord principal - redirige vers le dashboard du rôle de l'utilisateur connecté
     */
    public function index(): \Illuminate\Http\RedirectResponse
    {
        $roleNom = strtolower(\Illuminate\Support\Facades\Auth::user()?->role_nom ?? 'admin');

        $routeMap = [
            'admin' => 'dashboard.admin',
            'dr'    => 'dashboard.dr',
            'cdtt'  => 'dashboard.cdtt',
            'csc'   => 'dashboard.csc',
            'cdv'   => 'dashboard.cdv',
            'cds'   => 'dashboard.cds',
            'rtm'   => 'dashboard.rtm',
            'tmo'   => 'dashboard.tmo',
            'srmo'  => 'dashboard.srmo',
            'ss'    => 'dashboard.ss',
            'as'    => 'dashboard.as',
        ];

        $route = $routeMap[$roleNom] ?? 'dashboard.admin';

        return redirect()->route($route);
    }
    
    /**
     * Tableau de bord Administrateur (ADMIN)
     */
    public function admin(): Response
    {
        $user = Auth::user();

        return Inertia::render('Admin/Dashboard/index', [
            ...$this->getAdminPageData('Tableau de Bord Administrateur', [], $user),
            'dashboardStats' => $this->getDashboardStats($user),
        ]);
    }

    public function dr(): Response
    {
        $user = Auth::user();

        return Inertia::render('DR/Dashboard/index', [
            ...$this->getPageData('Tableau de Bord Directeur Régional', [], $user),
            'dashboardStats' => $this->getDashboardStats($user),
        ]);
    }

    public function cdtt(): Response
    {
        $user = Auth::user();

        return Inertia::render('CDTT/Dashboard/index', [
            ...$this->getPageData('Tableau de Bord Chef Département', [], $user),
            'dashboardStats' => $this->getDashboardStats($user),
        ]);
    }

    public function csc(): Response
    {
        $user = Auth::user();

        return Inertia::render('CSC/Dashboard/index', [
            ...$this->getPageData('Tableau de Bord Chef Service', [], $user),
            'dashboardStats' => $this->getDashboardStats($user),
        ]);
    }

    public function cdv(): Response
    {
        $user = Auth::user();

        return Inertia::render('CDV/Dashboard/index', [
            ...$this->getPageData('Tableau de Bord Chef District', [], $user),
            'dashboardStats' => $this->getDashboardStats($user),
        ]);
    }

    public function cds(): Response
    {
        $user = Auth::user();

        return Inertia::render('CDS/Dashboard/index', [
            ...$this->getPageData('Tableau de Bord Chef de Secteur', [], $user),
            'dashboardStats' => $this->getDashboardStats($user),
        ]);
    }

    public function rtm(): Response
    {
        $user = Auth::user();

        return Inertia::render('RTM/Dashboard/index', [
            ...$this->getPageData('Tableau de Bord Marketing Régional', [], $user),
            'dashboardStats' => $this->getDashboardStats($user),
        ]);
    }

    public function tmo(): Response
    {
        $user = Auth::user();

        return Inertia::render('TMO/Dashboard/index', [
            ...$this->getPageData('Tableau de Bord Marketing Opérationnel', [], $user),
            'dashboardStats' => $this->getDashboardStats($user),
        ]);
    }

    public function srmo(): Response
    {
        $user = Auth::user();

        return Inertia::render('SRMO/Dashboard/index', [
            ...$this->getPageData('Tableau de Bord Superviseur Marketing', [], $user),
            'dashboardStats' => $this->getDashboardStats($user),
        ]);
    }

    public function ss(): Response
    {
        $user = Auth::user();

        return Inertia::render('SS/Dashboard/index', [
            ...$this->getPageData('Tableau de Bord Superviseur Sponsoring', [], $user),
            'dashboardStats' => $this->getDashboardStats($user),
        ]);
    }

    public function as(): Response
    {
        $user = Auth::user();

        return Inertia::render('AS/Dashboard/index', [
            ...$this->getPageData('Tableau de Bord Assistant Superviseur', [], $user),
            'dashboardStats' => $this->getDashboardStats($user),
        ]);
    }
}
