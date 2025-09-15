<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Inertia\Response;
use App\Traits\FormatsUserData;

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
     * Tableau de bord principal - redirige vers le dashboard spécifique au rôle
     */
    public function index(): \Illuminate\Http\RedirectResponse
    {
        \Log::debug('Route dashboard atteinte - redirection directe vers dashboard.admin');
        return redirect()->route('dashboard.admin');
    }
    
    /**
     * Tableau de bord Administrateur (ADMIN)
     */
    public function admin(): Response
    {
        $user = Auth::user();
        
        return Inertia::render('Admin/Dashboard/index', [
            ...$this->getAdminPageData('Tableau de Bord Administrateur', [], $user),
        ]);
    }
    
    /**
     * Tableau de bord Directeur Régional (DR)
     */
    public function dr(): Response
    {
        $user = Auth::user();
        
        return Inertia::render('DR/Dashboard/index', [
            ...$this->getPageData('Tableau de Bord Directeur Régional', [], $user),
        ]);
    }
    
    /**
     * Tableau de bord Chef Département Trade (CDTT)
     */
    public function cdtt(): Response
    {
        $user = Auth::user();
        
        return Inertia::render('CDTT/Dashboard/index', [
            ...$this->getPageData('Tableau de Bord Chef Département', [], $user),
        ]);
    }
    
    /**
     * Tableau de bord Chef Service Commercial (CSC)
     */
    public function csc(): Response
    {
        $user = Auth::user();
        
        return Inertia::render('CSC/Dashboard/index', [
            ...$this->getPageData('Tableau de Bord Chef Service', [], $user),
        ]);
    }
    
    /**
     * Tableau de bord Chef District Vente (CDV)
     */
    public function cdv(): Response
    {
        $user = Auth::user();
        
        return Inertia::render('CDV/Dashboard/index', [
            ...$this->getPageData('Tableau de Bord Chef District', [], $user),
        ]);
    }
    
    /**
     * Tableau de bord Chef de Secteur (CDS)
     */
    public function cds(): Response
    {
        $user = Auth::user();
        
        return Inertia::render('CDS/Dashboard/index', [
            ...$this->getPageData('Tableau de Bord Chef de Secteur', [], $user),
        ]);
    }
    
    /**
     * Tableau de bord Regional Trade Marketing (RTM)
     */
    public function rtm(): Response
    {
        $user = Auth::user();
        
        return Inertia::render('RTM/Dashboard/index', [
            ...$this->getPageData('Tableau de Bord Marketing Régional', [], $user),
        ]);
    }
    
    /**
     * Tableau de bord Trade Marketing Operator (TMO)
     */
    public function tmo(): Response
    {
        $user = Auth::user();
        
        return Inertia::render('TMO/Dashboard/index', [
            ...$this->getPageData('Tableau de Bord Marketing Opérationnel', [], $user),
        ]);
    }
    
    /**
     * Tableau de bord Superviseur Régional Marketing Opérationnel (SRMO)
     */
    public function srmo(): Response
    {
        $user = Auth::user();
        
        return Inertia::render('SRMO/Dashboard/index', [
            ...$this->getPageData('Tableau de Bord Superviseur Marketing', [], $user),
        ]);
    }
    
    /**
     * Tableau de bord Superviseur Sponsoring (SS)
     */
    public function ss(): Response
    {
        $user = Auth::user();
        
        return Inertia::render('SS/Dashboard/index', [
            ...$this->getPageData('Tableau de Bord Superviseur Sponsoring', [], $user),
        ]);
    }
    
    /**
     * Tableau de bord Assistant Superviseur Sponsoring (AS)
     */
    public function as(): Response
    {
        $user = Auth::user();
        
        return Inertia::render('AS/Dashboard/index', [
            ...$this->getPageData('Tableau de Bord Assistant Superviseur', [], $user),
        ]);
    }
}
