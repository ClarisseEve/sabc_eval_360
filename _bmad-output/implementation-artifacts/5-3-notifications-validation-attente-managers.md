# Story 5.3: Notifications de Validation en Attente pour Managers

Status: ready-for-dev

## Story

En tant que système,
Je veux notifier les managers des évaluations en attente de validation,
Afin qu'ils traitent rapidement les validations.

## Acceptance Criteria

**Given** une évaluation est en statut "soumis" depuis > 3 jours
**When** le Scheduled Job quotidien s'exécute
**Then** une notification est envoyée au manager (`manager_matricule`)
**And** le message indique : nombre d'évaluations en attente, noms des évalués
**And** la notification contient un lien direct vers la page "Validations en Attente"
**And** les notifications sont envoyées quotidiennement jusqu'à validation/rejet
**And** DR et CDTT reçoivent les notifications pour leur périmètre (cross-branche)

## Tasks / Subtasks

- [ ] Scheduled Job NotificationsValidationsAttente (AC: 1, 2, 3, 4, 5)
  - [ ] Créer `app/Console/Commands/NotificationsValidationsAttente.php`
  - [ ] Logique : Détecter évaluations soumises > 3 jours
  - [ ] Grouper par manager
  - [ ] Envoyer notifications managers
  - [ ] Gérer DR/CDTT cross-branche
  - [ ] Scheduled : Quotidien à 10:00

- [ ] Service NotificationManagerService (AC: 1, 2, 3, 4, 5)
  - [ ] Créer `app/Services/NotificationManagerService.php`
  - [ ] Méthode `getEvaluationsEnAttenteParManager()` : Grouper par manager
  - [ ] Méthode `getEvaluationsEnAttenteDRCDTT()` : Périmètre cross-branche
  - [ ] Méthode `envoyerNotificationManager()` : Notification avec liste évalués
  - [ ] Méthode `formaterListeEvalues()` : Format message

- [ ] Enregistrement Scheduled Job (AC: 1)
  - [ ] Modifier `app/Console/Kernel.php`
  - [ ] Enregistrer NotificationsValidationsAttente (quotidien 10:00)
  - [ ] Configuration timezone 'Africa/Douala'

- [ ] Tests & Validation
  - [ ] Tester détection évaluations soumises > 3 jours
  - [ ] Tester groupement par manager
  - [ ] Tester notifications DR/CDTT cross-branche
  - [ ] Tester lien vers validations en attente
  - [ ] Tester envoi quotidien jusqu'à validation

## Dev Notes

### Architecture Notifications Managers

**Flux Notification :**
1. Scheduled Job s'exécute quotidiennement à 10:00
2. Détection évaluations soumises > 3 jours
3. Groupement par manager (manager_matricule)
4. Calcul nb évaluations en attente par manager
5. Envoi notification avec liste évalués
6. Gestion DR/CDTT cross-branche

**Contenu Notification Manager :**
- Titre : "Évaluations en attente de validation"
- Message : "Vous avez {nb_evaluations} évaluation(s) en attente de validation depuis plus de 3 jours : {liste_evalues}"
- Lien : /manager/evaluations/en-attente
- Type : 'validations_attente_manager'

**Règles DR/CDTT :**
- DR : Reçoit notifications pour toutes évaluations région (cross-branche)
- CDTT : Reçoit notifications pour toutes évaluations région (cross-branche)
- Managers directs : Reçoivent notifications pour leurs subordonnés uniquement

**Fréquence :**
- Quotidien à 10:00 (après rappels évaluateurs à 09:00)
- Envoi continu jusqu'à validation/rejet
- Pas de limite nombre notifications

### Scheduled Job NotificationsValidationsAttente

```php
namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Services\NotificationManagerService;
use Carbon\Carbon;

class NotificationsValidationsAttente extends Command
{
    protected $signature = 'managers:notifications-validations';
    protected $description = 'Notifier les managers des évaluations en attente de validation';
    
    protected $notificationService;
    
    public function __construct(NotificationManagerService $notificationService)
    {
        parent::__construct();
        $this->notificationService = $notificationService;
    }
    
    public function handle()
    {
        $nbNotificationsEnvoyees = 0;
        
        // 1. Notifications managers directs
        $evaluationsParManager = $this->notificationService->getEvaluationsEnAttenteParManager();
        
        foreach ($evaluationsParManager as $managerMatricule => $evaluations) {
            if (count($evaluations) > 0) {
                $this->notificationService->envoyerNotificationManager(
                    $managerMatricule,
                    $evaluations,
                    'manager_direct'
                );
                $nbNotificationsEnvoyees++;
            }
        }
        
        $this->info("Notifications managers directs : {$nbNotificationsEnvoyees}");
        
        // 2. Notifications DR/CDTT cross-branche
        $evaluationsParDRCDTT = $this->notificationService->getEvaluationsEnAttenteDRCDTT();
        
        foreach ($evaluationsParDRCDTT as $drcdttMatricule => $evaluations) {
            if (count($evaluations) > 0) {
                $this->notificationService->envoyerNotificationManager(
                    $drcdttMatricule,
                    $evaluations,
                    'dr_cdtt'
                );
                $nbNotificationsEnvoyees++;
            }
        }
        
        $this->info("Notifications DR/CDTT : " . count($evaluationsParDRCDTT));
        
        $this->info("Total notifications envoyées : {$nbNotificationsEnvoyees}");
        
        return 0;
    }
}
```

### NotificationManagerService

```php
namespace App\Services;

use App\Models\Evaluation;
use App\Models\Utilisateur;
use App\Models\Notification;
use Carbon\Carbon;

class NotificationManagerService
{
    /**
     * Récupérer les évaluations en attente groupées par manager
     */
    public function getEvaluationsEnAttenteParManager(): array
    {
        $dateLimite = Carbon::now()->subDays(3);
        
        // Récupérer évaluations soumises > 3 jours
        $evaluations = Evaluation::with(['evalue', 'evaluateur', 'periode'])
            ->where('statut', 'soumis')
            ->where('date_soumission', '<=', $dateLimite)
            ->get();
        
        // Grouper par manager
        $evaluationsParManager = [];
        
        foreach ($evaluations as $evaluation) {
            $managerMatricule = $evaluation->evalue->manager_matricule;
            
            if ($managerMatricule) {
                if (!isset($evaluationsParManager[$managerMatricule])) {
                    $evaluationsParManager[$managerMatricule] = [];
                }
                $evaluationsParManager[$managerMatricule][] = $evaluation;
            }
        }
        
        return $evaluationsParManager;
    }
    
    /**
     * Récupérer les évaluations en attente pour DR/CDTT (cross-branche)
     */
    public function getEvaluationsEnAttenteDRCDTT(): array
    {
        $dateLimite = Carbon::now()->subDays(3);
        
        // Récupérer DR et CDTT
        $drcdtt = Utilisateur::whereHas('role', function($q) {
            $q->whereIn('nom_role', ['DR', 'CDTT']);
        })->get();
        
        $evaluationsParDRCDTT = [];
        
        foreach ($drcdtt as $manager) {
            // Récupérer évaluations de la région
            $evaluations = Evaluation::with(['evalue', 'evaluateur', 'periode'])
                ->where('statut', 'soumis')
                ->where('date_soumission', '<=', $dateLimite)
                ->whereHas('evalue', function($q) use ($manager) {
                    $q->where('id_region', $manager->id_region);
                })
                ->get();
            
            if ($evaluations->count() > 0) {
                $evaluationsParDRCDTT[$manager->matricule] = $evaluations;
            }
        }
        
        return $evaluationsParDRCDTT;
    }
    
    /**
     * Envoyer notification au manager
     */
    public function envoyerNotificationManager(
        string $managerMatricule,
        $evaluations,
        string $typeManager
    ): void {
        $nbEvaluations = is_array($evaluations) ? count($evaluations) : $evaluations->count();
        $listeEvalues = $this->formaterListeEvalues($evaluations);
        
        $messages = [
            'manager_direct' => "Vous avez {$nbEvaluations} évaluation(s) en attente de validation depuis plus de 3 jours : {$listeEvalues}",
            'dr_cdtt' => "Il y a {$nbEvaluations} évaluation(s) en attente de validation dans votre région depuis plus de 3 jours : {$listeEvalues}",
        ];
        
        Notification::create([
            'matricule_destinataire' => $managerMatricule,
            'type' => 'validations_attente_manager',
            'titre' => 'Évaluations en attente de validation',
            'message' => $messages[$typeManager] ?? $messages['manager_direct'],
            'data_json' => [
                'nb_evaluations' => $nbEvaluations,
                'evaluations' => $this->formaterEvaluationsData($evaluations),
                'type_manager' => $typeManager,
                'lien_action' => '/manager/evaluations/en-attente',
            ],
            'lue' => false,
        ]);
    }
    
    /**
     * Formater la liste des évalués
     */
    protected function formaterListeEvalues($evaluations): string
    {
        $collection = is_array($evaluations) ? collect($evaluations) : $evaluations;
        
        $noms = $collection->map(function($eval) {
            return $eval->evalue->nom_complet;
        })->take(5)->toArray();
        
        $liste = implode(', ', $noms);
        
        if ($collection->count() > 5) {
            $reste = $collection->count() - 5;
            $liste .= " et {$reste} autre(s)";
        }
        
        return $liste;
    }
    
    /**
     * Formater les données des évaluations
     */
    protected function formaterEvaluationsData($evaluations): array
    {
        $collection = is_array($evaluations) ? collect($evaluations) : $evaluations;
        
        return $collection->map(function($eval) {
            return [
                'id_evaluation' => $eval->id_evaluation,
                'evaluateur_nom' => $eval->evaluateur->nom_complet,
                'evalue_nom' => $eval->evalue->nom_complet,
                'periode_nom' => $eval->periode->nom_periode,
                'date_soumission' => $eval->date_soumission->format('Y-m-d'),
                'jours_attente' => $eval->date_soumission->diffInDays(now()),
            ];
        })->toArray();
    }
}
```

### Enregistrement Scheduled Job dans Kernel.php

```php
namespace App\Console;

use Illuminate\Console\Scheduling\Schedule;
use Illuminate\Foundation\Console\Kernel as ConsoleKernel;

class Kernel extends ConsoleKernel
{
    protected $commands = [
        Commands\OuvrirPeriodesEvaluation::class,
        Commands\FermerPeriodesEvaluation::class,
        Commands\EnvoyerRappelsEvaluation::class,
        Commands\RappelsEvaluationsRetard::class,
        Commands\NotificationsValidationsAttente::class, // Nouveau
    ];
    
    protected function schedule(Schedule $schedule)
    {
        // Timezone Cameroun
        $schedule->timezone('Africa/Douala');
        
        // ... autres scheduled jobs ...
        
        // Notifications validations attente managers : Quotidien à 10:00
        $schedule->command('managers:notifications-validations')
            ->dailyAt('10:00')
            ->withoutOverlapping()
            ->onSuccess(function () {
                \Log::info('Scheduled Job: Notifications managers exécuté avec succès');
            })
            ->onFailure(function () {
                \Log::error('Scheduled Job: Notifications managers échoué');
            });
    }
}
```

### Tests Unitaires

```php
namespace Tests\Unit\Services;

use Tests\TestCase;
use App\Models\Evaluation;
use App\Models\Utilisateur;
use App\Models\PeriodeEvaluation;
use App\Services\NotificationManagerService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Carbon\Carbon;

class NotificationManagerServiceTest extends TestCase
{
    use RefreshDatabase;
    
    protected $notificationService;
    
    protected function setUp(): void
    {
        parent::setUp();
        $this->notificationService = new NotificationManagerService();
    }
    
    /** @test */
    public function groupe_evaluations_par_manager()
    {
        // Créer manager
        $manager = Utilisateur::factory()->create();
        
        // Créer subordonnés
        $subordonnes = Utilisateur::factory()->count(2)->create([
            'manager_matricule' => $manager->matricule,
        ]);
        
        // Créer période
        $periode = PeriodeEvaluation::factory()->create([
            'est_ouverte' => true,
        ]);
        
        // Créer évaluations soumises > 3 jours
        foreach ($subordonnes as $subordonne) {
            Evaluation::factory()->create([
                'evalue_matricule' => $subordonne->matricule,
                'statut' => 'soumis',
                'date_soumission' => Carbon::now()->subDays(5),
                'id_periode' => $periode->id_periode,
            ]);
        }
        
        // Récupérer évaluations par manager
        $evaluationsParManager = $this->notificationService->getEvaluationsEnAttenteParManager();
        
        $this->assertArrayHasKey($manager->matricule, $evaluationsParManager);
        $this->assertCount(2, $evaluationsParManager[$manager->matricule]);
    }
    
    /** @test */
    public function dr_recoit_notifications_cross_branche()
    {
        // Créer DR
        $roleDR = \App\Models\Role::factory()->create(['nom_role' => 'DR']);
        $dr = Utilisateur::factory()->create([
            'role_id' => $roleDR->id_role,
            'id_region' => 1,
        ]);
        
        // Créer évaluations dans la région
        $periode = PeriodeEvaluation::factory()->create(['est_ouverte' => true]);
        
        $evalue = Utilisateur::factory()->create(['id_region' => 1]);
        
        Evaluation::factory()->create([
            'evalue_matricule' => $evalue->matricule,
            'statut' => 'soumis',
            'date_soumission' => Carbon::now()->subDays(5),
            'id_periode' => $periode->id_periode,
        ]);
        
        // Récupérer évaluations DR/CDTT
        $evaluationsParDRCDTT = $this->notificationService->getEvaluationsEnAttenteDRCDTT();
        
        $this->assertArrayHasKey($dr->matricule, $evaluationsParDRCDTT);
        $this->assertCount(1, $evaluationsParDRCDTT[$dr->matricule]);
    }
    
    /** @test */
    public function formate_liste_evalues_correctement()
    {
        $evaluations = collect([
            (object)['evalue' => (object)['nom_complet' => 'Jean DUPONT']],
            (object)['evalue' => (object)['nom_complet' => 'Marie MARTIN']],
            (object)['evalue' => (object)['nom_complet' => 'Pierre DURAND']],
        ]);
        
        $reflection = new \ReflectionClass($this->notificationService);
        $method = $reflection->getMethod('formaterListeEvalues');
        $method->setAccessible(true);
        
        $liste = $method->invoke($this->notificationService, $evaluations);
        
        $this->assertStringContainsString('Jean DUPONT', $liste);
        $this->assertStringContainsString('Marie MARTIN', $liste);
        $this->assertStringContainsString('Pierre DURAND', $liste);
    }
}
```

### Project Structure Notes

**Fichiers à créer :**
- `app/Console/Commands/NotificationsValidationsAttente.php`
- `app/Services/NotificationManagerService.php`
- `tests/Unit/Services/NotificationManagerServiceTest.php`

**Fichiers à modifier :**
- `app/Console/Kernel.php` : Enregistrer scheduled job

**Dépendances Stories Précédentes :**
- Story 4.3 : Évaluations soumises
- Story 5.1 : Infrastructure notifications

### Règles Métier SABC Critiques

**Détection Évaluations en Attente :**
- Statut : soumis
- Délai : > 3 jours depuis date_soumission
- Groupement : Par manager_matricule

**Notifications Managers :**
- Managers directs : Subordonnés uniquement
- DR : Toutes évaluations région (cross-branche)
- CDTT : Toutes évaluations région (cross-branche)

**Contenu Notification :**
- Nb évaluations en attente
- Liste évalués (max 5 noms + "et X autre(s)")
- Lien direct : /manager/evaluations/en-attente

**Fréquence :**
- Quotidien à 10:00 (après rappels évaluateurs)
- Envoi continu jusqu'à validation/rejet
- Pas de limite nombre notifications

**Horaire :**
- 09:00 : Rappels évaluateurs (Story 5.2)
- 10:00 : Notifications managers (Story 5.3)
- Séquence logique : Évaluateurs d'abord, puis managers

### References

- [Source: epics.md#Epic 5 Story 5.3] - Acceptance criteria complets
- [Source: architecture.md#Scheduled Jobs] - Jobs quotidiens
- [Source: business-logic-rules.md#Notifications Managers] - Règles notifications
- [Source: project-context.md#Critical Implementation Rules] - DR/CDTT cross-branche

## Dev Agent Record

### Agent Model Used

_À remplir par le dev agent_

### Debug Log References

_À remplir par le dev agent_

### Completion Notes List

_À remplir par le dev agent_

### File List

_À remplir par le dev agent_
