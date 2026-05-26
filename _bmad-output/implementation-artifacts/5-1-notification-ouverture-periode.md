# Story 5.1: Notification d'Ouverture de Période

Status: ready-for-dev

## Story

En tant que système,
Je veux notifier tous les utilisateurs concernés lors de l'ouverture d'une période,
Afin qu'ils sachent qu'ils peuvent commencer les évaluations.

## Acceptance Criteria

**Given** une période d'évaluation s'ouvre (`est_ouverte = true`)
**When** le Scheduled Job détecte l'ouverture
**Then** une notification est créée dans PostgreSQL `notifications` pour chaque utilisateur concerné
**And** le message indique : nom de la période, dates début/fin, nombre d'évaluations à compléter
**And** la notification est visible dans le dashboard et le notifications panel
**And** un email est envoyé si l'utilisateur a activé les notifications email
**And** la notification contient un lien direct vers la page "Évaluations à Compléter"

## Tasks / Subtasks

- [ ] Extension Scheduled Job OuvrirPeriodesEvaluation (AC: 1, 2, 3)
  - [ ] Modifier `app/Console/Commands/OuvrirPeriodesEvaluation.php`
  - [ ] Appeler NotificationOuverturePeriodeService après ouverture
  - [ ] Logger notifications envoyées

- [ ] Service NotificationOuverturePeriodeService (AC: 2, 3, 4, 5)
  - [ ] Créer `app/Services/NotificationOuverturePeriodeService.php`
  - [ ] Méthode `notifierOuverturePeriode()` : Notification tous utilisateurs
  - [ ] Méthode `getUtilisateursConcernes()` : Liste utilisateurs (sauf ADMIN)
  - [ ] Méthode `calculerNbEvaluationsACompleter()` : Comptage évaluations attendues
  - [ ] Création notifications dans table notifications
  - [ ] Envoi emails si préférences activées

- [ ] Service EmailNotificationService (AC: 4)
  - [ ] Créer `app/Services/EmailNotificationService.php`
  - [ ] Méthode `envoyerEmailOuverturePeriode()` : Email ouverture
  - [ ] Template email avec Laravel Mailable
  - [ ] Vérification préférences utilisateur
  - [ ] Queue emails pour performance

- [ ] Composant NotificationPanel (AC: 3)
  - [ ] Créer `resources/js/Components/Notifications/NotificationPanel.tsx`
  - [ ] Affichage notifications non lues
  - [ ] Badge compteur notifications
  - [ ] Liste déroulante notifications
  - [ ] Bouton "Marquer comme lu"
  - [ ] Lien vers page notifications complète

- [ ] Composant NotificationItem (AC: 3, 5)
  - [ ] Créer `resources/js/Components/Notifications/NotificationItem.tsx`
  - [ ] Affichage : Titre, message, date
  - [ ] Icône selon type notification
  - [ ] Lien action si présent
  - [ ] État lu/non lu

- [ ] Page Notifications Complète (AC: 3)
  - [ ] Page `resources/js/Pages/Notifications/Index.tsx`
  - [ ] Liste toutes notifications
  - [ ] Filtres : Type, statut (lu/non lu)
  - [ ] Pagination
  - [ ] Actions : Marquer lu, Supprimer

- [ ] NotificationsController (AC: 3)
  - [ ] Créer `app/Http/Controllers/NotificationsController.php`
  - [ ] Méthode `index()` : Liste notifications utilisateur
  - [ ] Méthode `markAsRead()` : Marquer comme lu
  - [ ] Méthode `delete()` : Supprimer notification
  - [ ] Middleware `auth:api`

- [ ] Tests & Validation
  - [ ] Tester notification ouverture période
  - [ ] Tester calcul nb évaluations à compléter
  - [ ] Tester envoi emails
  - [ ] Tester affichage notifications panel
  - [ ] Tester lien vers évaluations à compléter

## Dev Notes

### Architecture Notifications Ouverture Période

**Flux Notification :**
1. Scheduled Job OuvrirPeriodesEvaluation s'exécute (quotidien 00:01)
2. Détection périodes avec date_debut = aujourd'hui
3. Ouverture période (est_ouverte = true)
4. Appel NotificationOuverturePeriodeService
5. Récupération utilisateurs concernés (tous sauf ADMIN)
6. Calcul nb évaluations à compléter par utilisateur
7. Création notifications dans table notifications
8. Envoi emails si préférences activées
9. Affichage notifications dans panel

**Contenu Notification :**
- Titre : "Nouvelle période d'évaluation ouverte"
- Message : "La période {nom_periode} est maintenant ouverte. Vous avez {nb_evaluations} évaluations à compléter avant le {date_fin}."
- Lien : /evaluations/a-completer
- Type : 'ouverture_periode'

**Préférences Email :**
- Vérification colonne `preferences_notifications` dans table utilisateurs
- Envoi email uniquement si activé
- Queue emails pour performance (Laravel Queue)

### Extension OuvrirPeriodesEvaluation

```php
namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\PeriodeEvaluation;
use App\Services\NotificationPeriodeService;
use App\Services\NotificationOuverturePeriodeService;
use App\Services\AdminLogService;
use Carbon\Carbon;

class OuvrirPeriodesEvaluation extends Command
{
    protected $signature = 'periodes:ouvrir';
    protected $description = 'Ouvrir automatiquement les périodes d\'évaluation dont la date de début est atteinte';
    
    protected $notificationPeriodeService;
    protected $notificationOuvertureService;
    protected $logService;
    
    public function __construct(
        NotificationPeriodeService $notificationPeriodeService,
        NotificationOuverturePeriodeService $notificationOuvertureService,
        AdminLogService $logService
    ) {
        parent::__construct();
        $this->notificationPeriodeService = $notificationPeriodeService;
        $this->notificationOuvertureService = $notificationOuvertureService;
        $this->logService = $logService;
    }
    
    public function handle()
    {
        $today = Carbon::today();
        
        // Récupérer périodes planifiées avec date_debut = aujourd'hui
        $periodes = PeriodeEvaluation::where('statut', 'planifiee')
            ->whereDate('date_debut', $today)
            ->get();
        
        if ($periodes->isEmpty()) {
            $this->info('Aucune période à ouvrir aujourd\'hui.');
            return 0;
        }
        
        foreach ($periodes as $periode) {
            try {
                // Ouvrir la période
                $periode->ouvrir();
                
                // Envoyer notifications ouverture (Story 3.4)
                $this->notificationPeriodeService->notifierOuverturePeriode($periode);
                
                // Envoyer notifications détaillées avec nb évaluations (Story 5.1)
                $this->notificationOuvertureService->notifierOuverturePeriode($periode);
                
                // Logger l'action
                $this->logService->logAction(
                    'SYSTEM',
                    'ouverture_periode_automatique',
                    'succes',
                    [
                        'id_periode' => $periode->id_periode,
                        'nom_periode' => $periode->nom_periode,
                        'date_debut' => $periode->date_debut->format('Y-m-d'),
                    ]
                );
                
                $this->info("Période '{$periode->nom_periode}' ouverte avec succès.");
                
            } catch (\Exception $e) {
                $this->error("Erreur lors de l'ouverture de la période '{$periode->nom_periode}': {$e->getMessage()}");
                
                // Logger l'erreur
                $this->logService->logAction(
                    'SYSTEM',
                    'ouverture_periode_automatique',
                    'erreur',
                    [
                        'id_periode' => $periode->id_periode,
                        'nom_periode' => $periode->nom_periode,
                    ],
                    $e->getMessage()
                );
            }
        }
        
        return 0;
    }
}
```

### NotificationOuverturePeriodeService

```php
namespace App\Services;

use App\Models\PeriodeEvaluation;
use App\Models\Utilisateur;
use App\Models\Notification;

class NotificationOuverturePeriodeService
{
    protected $emailService;
    
    public function __construct(EmailNotificationService $emailService)
    {
        $this->emailService = $emailService;
    }
    
    /**
     * Notifier l'ouverture d'une période avec détails
     */
    public function notifierOuverturePeriode(PeriodeEvaluation $periode): void
    {
        $utilisateurs = $this->getUtilisateursConcernes();
        
        foreach ($utilisateurs as $utilisateur) {
            // Calculer nb évaluations à compléter
            $nbEvaluations = $this->calculerNbEvaluationsACompleter($utilisateur, $periode);
            
            // Créer notification
            $notification = Notification::create([
                'matricule_destinataire' => $utilisateur->matricule,
                'type' => 'ouverture_periode',
                'titre' => 'Nouvelle période d\'évaluation ouverte',
                'message' => "La période d'évaluation '{$periode->nom_periode}' est maintenant ouverte. " .
                            "Vous avez {$nbEvaluations} évaluation(s) à compléter avant le {$periode->date_fin->format('d/m/Y')}.",
                'data_json' => [
                    'id_periode' => $periode->id_periode,
                    'nom_periode' => $periode->nom_periode,
                    'date_debut' => $periode->date_debut->format('Y-m-d'),
                    'date_fin' => $periode->date_fin->format('Y-m-d'),
                    'nb_evaluations' => $nbEvaluations,
                    'lien_action' => '/evaluations/a-completer',
                ],
                'lue' => false,
            ]);
            
            // Envoyer email si préférences activées
            if ($this->doitEnvoyerEmail($utilisateur)) {
                $this->emailService->envoyerEmailOuverturePeriode(
                    $utilisateur,
                    $periode,
                    $nbEvaluations
                );
            }
        }
    }
    
    /**
     * Récupérer les utilisateurs concernés
     */
    protected function getUtilisateursConcernes(): \Illuminate\Support\Collection
    {
        // Tous les utilisateurs sauf ADMIN
        return Utilisateur::whereHas('role', function($q) {
            $q->where('nom_role', '!=', 'ADMIN');
        })->get();
    }
    
    /**
     * Calculer le nombre d'évaluations à compléter
     */
    protected function calculerNbEvaluationsACompleter(
        Utilisateur $utilisateur,
        PeriodeEvaluation $periode
    ): int {
        // Cette logique sera complétée dans Story 6.x (Calcul évaluations attendues)
        // Pour l'instant, estimation basée sur les règles d'éligibilité
        
        $nbEvaluations = 0;
        
        // Auto-évaluation (si autorisée)
        if ($utilisateur->role->peut_auto_evaluer) {
            $nbEvaluations++;
        }
        
        // Évaluations pairs (si autorisées)
        if ($utilisateur->role->peut_evaluer_pairs) {
            // Compter pairs dans même région/branche
            $nbPairs = Utilisateur::where('id_region', $utilisateur->id_region)
                ->where('id_branche', $utilisateur->id_branche)
                ->where('role_id', $utilisateur->role_id)
                ->where('matricule', '!=', $utilisateur->matricule)
                ->count();
            
            $nbEvaluations += min($nbPairs, 3); // Maximum 3 pairs
        }
        
        // Évaluations subordonnés (si autorisées)
        if ($utilisateur->role->peut_evaluer_subordonnes) {
            $nbSubordonnes = Utilisateur::where('manager_matricule', $utilisateur->matricule)
                ->count();
            
            $nbEvaluations += $nbSubordonnes;
        }
        
        return $nbEvaluations;
    }
    
    /**
     * Vérifier si l'utilisateur doit recevoir un email
     */
    protected function doitEnvoyerEmail(Utilisateur $utilisateur): bool
    {
        // Vérifier préférences notifications
        $preferences = $utilisateur->preferences_notifications ?? [];
        
        return $preferences['email_ouverture_periode'] ?? true; // Par défaut activé
    }
}
```

### EmailNotificationService

```php
namespace App\Services;

use App\Models\Utilisateur;
use App\Models\PeriodeEvaluation;
use App\Mail\OuverturePeriodeMail;
use Illuminate\Support\Facades\Mail;

class EmailNotificationService
{
    /**
     * Envoyer email ouverture période
     */
    public function envoyerEmailOuverturePeriode(
        Utilisateur $utilisateur,
        PeriodeEvaluation $periode,
        int $nbEvaluations
    ): void {
        // Vérifier que l'utilisateur a un email
        if (empty($utilisateur->email)) {
            \Log::warning("Utilisateur {$utilisateur->matricule} n'a pas d'email configuré");
            return;
        }
        
        // Envoyer email via queue pour performance
        Mail::to($utilisateur->email)
            ->queue(new OuverturePeriodeMail($utilisateur, $periode, $nbEvaluations));
    }
}
```

### Mailable OuverturePeriodeMail

```php
namespace App\Mail;

use App\Models\Utilisateur;
use App\Models\PeriodeEvaluation;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Queue\SerializesModels;

class OuverturePeriodeMail extends Mailable
{
    use Queueable, SerializesModels;
    
    public $utilisateur;
    public $periode;
    public $nbEvaluations;
    
    public function __construct(
        Utilisateur $utilisateur,
        PeriodeEvaluation $periode,
        int $nbEvaluations
    ) {
        $this->utilisateur = $utilisateur;
        $this->periode = $periode;
        $this->nbEvaluations = $nbEvaluations;
    }
    
    public function build()
    {
        return $this->subject("Nouvelle période d'évaluation : {$this->periode->nom_periode}")
            ->markdown('emails.ouverture-periode')
            ->with([
                'nom_utilisateur' => $this->utilisateur->nom_complet,
                'nom_periode' => $this->periode->nom_periode,
                'date_fin' => $this->periode->date_fin->format('d/m/Y'),
                'nb_evaluations' => $this->nbEvaluations,
                'lien_evaluations' => url('/evaluations/a-completer'),
            ]);
    }
}
```

### Template Email (Markdown)

```markdown
@component('mail::message')
# Nouvelle période d'évaluation ouverte

Bonjour {{ $nom_utilisateur }},

La période d'évaluation **{{ $nom_periode }}** est maintenant ouverte.

## Vos évaluations à compléter

Vous avez **{{ $nb_evaluations }} évaluation(s)** à compléter avant le **{{ $date_fin }}**.

@component('mail::button', ['url' => $lien_evaluations])
Accéder à mes évaluations
@endcomponent

N'oubliez pas de compléter vos évaluations avant la date limite pour contribuer au processus d'évaluation 360° de la SABC.

Cordialement,  
L'équipe SABC Eval360

@endcomponent
```

### Composant NotificationPanel

```tsx
// resources/js/Components/Notifications/NotificationPanel.tsx
import { useState, useEffect } from 'react';
import { Bell } from 'lucide-react';
import { router } from '@inertiajs/react';
import NotificationItem from './NotificationItem';

interface Notification {
    id: string;
    type: string;
    titre: string;
    message: string;
    data_json: any;
    lue: boolean;
    created_at: string;
}

export default function NotificationPanel() {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [isOpen, setIsOpen] = useState(false);
    const [unreadCount, setUnreadCount] = useState(0);
    
    useEffect(() => {
        fetchNotifications();
    }, []);
    
    const fetchNotifications = async () => {
        try {
            const response = await fetch('/api/notifications?limit=5');
            const data = await response.json();
            setNotifications(data.notifications);
            setUnreadCount(data.unread_count);
        } catch (error) {
            console.error('Erreur chargement notifications:', error);
        }
    };
    
    const handleMarkAsRead = async (notificationId: string) => {
        try {
            await fetch(`/api/notifications/${notificationId}/mark-as-read`, {
                method: 'POST',
            });
            fetchNotifications();
        } catch (error) {
            console.error('Erreur marquage notification:', error);
        }
    };
    
    return (
        <div className="relative">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="relative p-2 text-sabc-gray-600 hover:text-sabc-red-primary transition-colors"
            >
                <Bell size={24} />
                {unreadCount > 0 && (
                    <span className="absolute top-0 right-0 bg-sabc-error text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                        {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                )}
            </button>
            
            {isOpen && (
                <div className="absolute right-0 mt-2 w-96 bg-white border border-sabc-gray-200 rounded-lg shadow-lg z-50">
                    <div className="p-4 border-b border-sabc-gray-200">
                        <div className="flex items-center justify-between">
                            <h3 className="font-semibold text-sabc-gray-900">
                                Notifications
                            </h3>
                            <button
                                onClick={() => router.visit('/notifications')}
                                className="text-sm text-sabc-red-primary hover:underline"
                            >
                                Voir tout
                            </button>
                        </div>
                    </div>
                    
                    <div className="max-h-96 overflow-y-auto">
                        {notifications.length === 0 ? (
                            <div className="p-4 text-center text-sabc-gray-600">
                                Aucune notification
                            </div>
                        ) : (
                            notifications.map((notification) => (
                                <NotificationItem
                                    key={notification.id}
                                    notification={notification}
                                    onMarkAsRead={handleMarkAsRead}
                                />
                            ))
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
```

### NotificationsController

```php
namespace App\Http\Controllers;

use App\Models\Notification;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response as InertiaResponse;

class NotificationsController extends Controller
{
    public function __construct()
    {
        $this->middleware('auth:api');
    }
    
    public function index(): InertiaResponse
    {
        $utilisateur = auth()->user();
        
        $notifications = Notification::where('matricule_destinataire', $utilisateur->matricule)
            ->orderBy('created_at', 'desc')
            ->paginate(20);
        
        return Inertia::render('Notifications/Index', [
            'notifications' => $notifications,
        ]);
    }
    
    public function markAsRead(string $id)
    {
        $utilisateur = auth()->user();
        $notification = Notification::findOrFail($id);
        
        if ($notification->matricule_destinataire !== $utilisateur->matricule) {
            abort(403);
        }
        
        $notification->update(['lue' => true]);
        
        return response()->json(['success' => true]);
    }
    
    public function delete(string $id)
    {
        $utilisateur = auth()->user();
        $notification = Notification::findOrFail($id);
        
        if ($notification->matricule_destinataire !== $utilisateur->matricule) {
            abort(403);
        }
        
        $notification->delete();
        
        return response()->json(['success' => true]);
    }
}
```

### Project Structure Notes

**Fichiers à créer :**
- `app/Services/NotificationOuverturePeriodeService.php`
- `app/Services/EmailNotificationService.php`
- `app/Mail/OuverturePeriodeMail.php`
- `resources/views/emails/ouverture-periode.blade.php`
- `app/Http/Controllers/NotificationsController.php`
- `resources/js/Components/Notifications/NotificationPanel.tsx`
- `resources/js/Components/Notifications/NotificationItem.tsx`
- `resources/js/Pages/Notifications/Index.tsx`

**Fichiers à modifier :**
- `app/Console/Commands/OuvrirPeriodesEvaluation.php` : Ajouter appel NotificationOuverturePeriodeService
- `routes/web.php` : Ajouter routes notifications
- `routes/api.php` : Ajouter routes API notifications

**Dépendances Stories Précédentes :**
- Story 3.4 : Scheduled Job OuvrirPeriodesEvaluation
- Story 1.1 : Table notifications

### Règles Métier SABC Critiques

**Utilisateurs Concernés :**
- Tous utilisateurs sauf ADMIN
- Notifications individuelles par utilisateur

**Contenu Notification :**
- Nom période
- Dates début/fin
- Nb évaluations à compléter (estimation)
- Lien vers /evaluations/a-completer

**Envoi Email :**
- Vérification préférences utilisateur
- Queue emails pour performance
- Template Markdown Laravel

**Affichage Notifications :**
- Panel notifications dans navbar
- Badge compteur non lues
- Page notifications complète
- Actions : Marquer lu, Supprimer

### References

- [Source: epics.md#Epic 5 Story 5.1] - Acceptance criteria complets
- [Source: architecture.md#Notifications] - Système notifications
- [Source: business-logic-rules.md#Notifications] - Règles notifications
- [Source: project-context.md#Critical Implementation Rules] - Emails, Queue

## Dev Agent Record

### Agent Model Used

_À remplir par le dev agent_

### Debug Log References

_À remplir par le dev agent_

### Completion Notes List

_À remplir par le dev agent_

### File List

_À remplir par le dev agent_
