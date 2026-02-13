# Story 3.4: Ouverture/Fermeture Automatique des Périodes

Status: ready-for-dev

## Story

En tant que système,
Je veux ouvrir et fermer automatiquement les périodes selon le calendrier,
Afin d'automatiser la gestion des campagnes.

## Acceptance Criteria

**Given** une période d'évaluation avec `date_debut` et `date_fin` configurées
**When** la date système atteint `date_debut`
**Then** le Scheduled Job Laravel met `est_ouverte = true` automatiquement
**And** une notification est envoyée à tous les utilisateurs concernés
**And** les évaluateurs peuvent créer des évaluations pour cette période
**And** quand la date système atteint `date_fin`, `est_ouverte = false` automatiquement
**And** les évaluations en brouillon sont conservées mais ne peuvent plus être soumises
**And** un rapport de clôture est généré avec statistiques de participation

## Tasks / Subtasks

- [ ] Scheduled Job Ouverture Périodes (AC: 1, 2, 3)
  - [ ] Créer `app/Console/Commands/OuvrirPeriodesEvaluation.php`
  - [ ] Logique : Vérifier périodes avec date_debut = aujourd'hui
  - [ ] Mettre à jour : est_ouverte = true, statut = 'ouverte'
  - [ ] Envoyer notifications utilisateurs concernés
  - [ ] Logger action dans logs_administration
  - [ ] Scheduled : Quotidien à 00:01

- [ ] Scheduled Job Fermeture Périodes (AC: 4, 5, 6)
  - [ ] Créer `app/Console/Commands/FermerPeriodesEvaluation.php`
  - [ ] Logique : Vérifier périodes avec date_fin = aujourd'hui
  - [ ] Mettre à jour : est_ouverte = false, statut = 'fermee'
  - [ ] Bloquer soumission évaluations brouillon
  - [ ] Générer rapport clôture avec statistiques
  - [ ] Scheduled : Quotidien à 23:59

- [ ] Scheduled Job Rappels Périodes (AC: 2)
  - [ ] Créer `app/Console/Commands/EnvoyerRappelsEvaluation.php`
  - [ ] Logique : Vérifier dates_rappels_json (J-7, J-3, J-1)
  - [ ] Envoyer notifications rappel utilisateurs
  - [ ] Statistiques utilisateurs en retard
  - [ ] Scheduled : Quotidien à 09:00

- [ ] Service NotificationPeriodeService (AC: 2, 4)
  - [ ] Créer `app/Services/NotificationPeriodeService.php`
  - [ ] Méthode `notifierOuverturePeriode()` : Notification ouverture
  - [ ] Méthode `notifierFermeturePeriode()` : Notification fermeture
  - [ ] Méthode `notifierRappelEvaluation()` : Rappel J-7, J-3, J-1
  - [ ] Méthode `getUtilisateursConcernes()` : Utilisateurs à notifier

- [ ] Service RapportCloturePeriodeService (AC: 6)
  - [ ] Créer `app/Services/RapportCloturePeriodeService.php`
  - [ ] Méthode `genererRapportCloture()` : Rapport complet
  - [ ] Statistiques : Taux participation, évaluations complètes, en retard
  - [ ] Export PDF rapport
  - [ ] Stockage dans storage/rapports/

- [ ] Enregistrement Scheduled Jobs (AC: 1, 4)
  - [ ] Modifier `app/Console/Kernel.php`
  - [ ] Enregistrer OuvrirPeriodesEvaluation (quotidien 00:01)
  - [ ] Enregistrer FermerPeriodesEvaluation (quotidien 23:59)
  - [ ] Enregistrer EnvoyerRappelsEvaluation (quotidien 09:00)
  - [ ] Configuration timezone 'Africa/Douala'

- [ ] Tests & Validation
  - [ ] Tester ouverture automatique période
  - [ ] Tester fermeture automatique période
  - [ ] Tester notifications utilisateurs
  - [ ] Tester rappels J-7, J-3, J-1
  - [ ] Tester génération rapport clôture
  - [ ] Tester blocage soumission après fermeture

## Dev Notes

### Architecture Scheduled Jobs Laravel

**Principe :**
- Laravel Task Scheduling (Cron Jobs)
- Exécution quotidienne automatique
- Logs actions dans logs_administration
- Notifications via table notifications

**Jobs Quotidiens :**
1. **00:01** : Ouverture périodes (date_debut = aujourd'hui)
2. **09:00** : Rappels évaluations (J-7, J-3, J-1)
3. **23:59** : Fermeture périodes (date_fin = aujourd'hui)

**Flux Ouverture Période :**
1. Job vérifie périodes planifiées avec date_debut = aujourd'hui
2. Mise à jour : est_ouverte = true, statut = 'ouverte'
3. Récupération utilisateurs concernés (tous évaluateurs région)
4. Envoi notifications ouverture
5. Logging action

**Flux Fermeture Période :**
1. Job vérifie périodes ouvertes avec date_fin = aujourd'hui
2. Mise à jour : est_ouverte = false, statut = 'fermee'
3. Génération rapport clôture
4. Envoi notifications fermeture
5. Logging action

### Command OuvrirPeriodesEvaluation

```php
namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\PeriodeEvaluation;
use App\Services\NotificationPeriodeService;
use App\Services\AdminLogService;
use Carbon\Carbon;

class OuvrirPeriodesEvaluation extends Command
{
    protected $signature = 'periodes:ouvrir';
    protected $description = 'Ouvrir automatiquement les périodes d\'évaluation dont la date de début est atteinte';
    
    protected $notificationService;
    protected $logService;
    
    public function __construct(
        NotificationPeriodeService $notificationService,
        AdminLogService $logService
    ) {
        parent::__construct();
        $this->notificationService = $notificationService;
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
                
                // Envoyer notifications
                $this->notificationService->notifierOuverturePeriode($periode);
                
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

### Command FermerPeriodesEvaluation

```php
namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\PeriodeEvaluation;
use App\Services\NotificationPeriodeService;
use App\Services\RapportCloturePeriodeService;
use App\Services\AdminLogService;
use Carbon\Carbon;

class FermerPeriodesEvaluation extends Command
{
    protected $signature = 'periodes:fermer';
    protected $description = 'Fermer automatiquement les périodes d\'évaluation dont la date de fin est atteinte';
    
    protected $notificationService;
    protected $rapportService;
    protected $logService;
    
    public function __construct(
        NotificationPeriodeService $notificationService,
        RapportCloturePeriodeService $rapportService,
        AdminLogService $logService
    ) {
        parent::__construct();
        $this->notificationService = $notificationService;
        $this->rapportService = $rapportService;
        $this->logService = $logService;
    }
    
    public function handle()
    {
        $today = Carbon::today();
        
        // Récupérer périodes ouvertes avec date_fin = aujourd'hui
        $periodes = PeriodeEvaluation::where('statut', 'ouverte')
            ->whereDate('date_fin', $today)
            ->get();
        
        if ($periodes->isEmpty()) {
            $this->info('Aucune période à fermer aujourd\'hui.');
            return 0;
        }
        
        foreach ($periodes as $periode) {
            try {
                // Générer rapport de clôture
                $rapport = $this->rapportService->genererRapportCloture($periode);
                
                // Fermer la période
                $periode->fermer();
                
                // Envoyer notifications
                $this->notificationService->notifierFermeturePeriode($periode, $rapport);
                
                // Logger l'action
                $this->logService->logAction(
                    'SYSTEM',
                    'fermeture_periode_automatique',
                    'succes',
                    [
                        'id_periode' => $periode->id_periode,
                        'nom_periode' => $periode->nom_periode,
                        'date_fin' => $periode->date_fin->format('Y-m-d'),
                        'taux_participation' => $rapport['taux_participation'],
                    ]
                );
                
                $this->info("Période '{$periode->nom_periode}' fermée avec succès. Taux participation: {$rapport['taux_participation']}%");
                
            } catch (\Exception $e) {
                $this->error("Erreur lors de la fermeture de la période '{$periode->nom_periode}': {$e->getMessage()}");
                
                // Logger l'erreur
                $this->logService->logAction(
                    'SYSTEM',
                    'fermeture_periode_automatique',
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

### Command EnvoyerRappelsEvaluation

```php
namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\PeriodeEvaluation;
use App\Services\NotificationPeriodeService;
use Carbon\Carbon;

class EnvoyerRappelsEvaluation extends Command
{
    protected $signature = 'periodes:rappels';
    protected $description = 'Envoyer les rappels d\'évaluation (J-7, J-3, J-1)';
    
    protected $notificationService;
    
    public function __construct(NotificationPeriodeService $notificationService)
    {
        parent::__construct();
        $this->notificationService = $notificationService;
    }
    
    public function handle()
    {
        $today = Carbon::today();
        
        // Récupérer périodes ouvertes
        $periodes = PeriodeEvaluation::where('statut', 'ouverte')->get();
        
        foreach ($periodes as $periode) {
            $datesRappels = $periode->dates_rappels;
            
            // Vérifier si aujourd'hui correspond à une date de rappel
            if (isset($datesRappels['j_moins_7']) && Carbon::parse($datesRappels['j_moins_7'])->isSameDay($today)) {
                $this->notificationService->notifierRappelEvaluation($periode, 7);
                $this->info("Rappel J-7 envoyé pour la période '{$periode->nom_periode}'");
            }
            
            if (isset($datesRappels['j_moins_3']) && Carbon::parse($datesRappels['j_moins_3'])->isSameDay($today)) {
                $this->notificationService->notifierRappelEvaluation($periode, 3);
                $this->info("Rappel J-3 envoyé pour la période '{$periode->nom_periode}'");
            }
            
            if (isset($datesRappels['j_moins_1']) && Carbon::parse($datesRappels['j_moins_1'])->isSameDay($today)) {
                $this->notificationService->notifierRappelEvaluation($periode, 1);
                $this->info("Rappel J-1 envoyé pour la période '{$periode->nom_periode}'");
            }
        }
        
        return 0;
    }
}
```

### NotificationPeriodeService

```php
namespace App\Services;

use App\Models\PeriodeEvaluation;
use App\Models\Utilisateur;
use App\Models\Notification;

class NotificationPeriodeService
{
    /**
     * Notifier l'ouverture d'une période
     */
    public function notifierOuverturePeriode(PeriodeEvaluation $periode): void
    {
        $utilisateurs = $this->getUtilisateursConcernes($periode);
        
        foreach ($utilisateurs as $utilisateur) {
            Notification::create([
                'matricule_destinataire' => $utilisateur->matricule,
                'type' => 'ouverture_periode',
                'titre' => 'Nouvelle période d\'évaluation ouverte',
                'message' => "La période d'évaluation '{$periode->nom_periode}' est maintenant ouverte. " .
                            "Vous pouvez créer vos évaluations jusqu'au {$periode->date_fin->format('d/m/Y')}.",
                'data_json' => [
                    'id_periode' => $periode->id_periode,
                    'nom_periode' => $periode->nom_periode,
                    'date_fin' => $periode->date_fin->format('Y-m-d'),
                ],
                'lue' => false,
            ]);
        }
    }
    
    /**
     * Notifier la fermeture d'une période
     */
    public function notifierFermeturePeriode(PeriodeEvaluation $periode, array $rapport): void
    {
        $utilisateurs = $this->getUtilisateursConcernes($periode);
        
        foreach ($utilisateurs as $utilisateur) {
            Notification::create([
                'matricule_destinataire' => $utilisateur->matricule,
                'type' => 'fermeture_periode',
                'titre' => 'Période d\'évaluation fermée',
                'message' => "La période d'évaluation '{$periode->nom_periode}' est maintenant fermée. " .
                            "Taux de participation: {$rapport['taux_participation']}%.",
                'data_json' => [
                    'id_periode' => $periode->id_periode,
                    'nom_periode' => $periode->nom_periode,
                    'taux_participation' => $rapport['taux_participation'],
                ],
                'lue' => false,
            ]);
        }
    }
    
    /**
     * Notifier un rappel d'évaluation
     */
    public function notifierRappelEvaluation(PeriodeEvaluation $periode, int $joursRestants): void
    {
        // Récupérer utilisateurs avec évaluations non complétées
        $utilisateursEnRetard = $this->getUtilisateursEnRetard($periode);
        
        foreach ($utilisateursEnRetard as $utilisateur) {
            Notification::create([
                'matricule_destinataire' => $utilisateur->matricule,
                'type' => 'rappel_evaluation',
                'titre' => "Rappel : {$joursRestants} jour(s) restant(s)",
                'message' => "Il vous reste {$joursRestants} jour(s) pour compléter vos évaluations " .
                            "de la période '{$periode->nom_periode}'. " .
                            "Date limite : {$periode->date_fin->format('d/m/Y')}.",
                'data_json' => [
                    'id_periode' => $periode->id_periode,
                    'nom_periode' => $periode->nom_periode,
                    'jours_restants' => $joursRestants,
                    'nb_evaluations_restantes' => $utilisateur->nb_evaluations_restantes,
                ],
                'lue' => false,
            ]);
        }
    }
    
    /**
     * Récupérer les utilisateurs concernés par une période
     */
    protected function getUtilisateursConcernes(PeriodeEvaluation $periode): \Illuminate\Support\Collection
    {
        // Tous les utilisateurs sauf ADMIN
        return Utilisateur::whereHas('role', function($q) {
            $q->where('nom_role', '!=', 'ADMIN');
        })->get();
    }
    
    /**
     * Récupérer les utilisateurs en retard pour une période
     */
    protected function getUtilisateursEnRetard(PeriodeEvaluation $periode): \Illuminate\Support\Collection
    {
        // Cette méthode sera complétée dans Story 4.x (Workflow Évaluation)
        // Pour l'instant, retourner tous les utilisateurs concernés
        return $this->getUtilisateursConcernes($periode);
    }
}
```

### RapportCloturePeriodeService

```php
namespace App\Services;

use App\Models\PeriodeEvaluation;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Support\Facades\Storage;

class RapportCloturePeriodeService
{
    /**
     * Générer le rapport de clôture d'une période
     */
    public function genererRapportCloture(PeriodeEvaluation $periode): array
    {
        // Cette méthode sera complétée dans Story 4.x (Workflow Évaluation)
        // Pour l'instant, générer structure de base
        
        $stats = [
            'id_periode' => $periode->id_periode,
            'nom_periode' => $periode->nom_periode,
            'date_debut' => $periode->date_debut->format('d/m/Y'),
            'date_fin' => $periode->date_fin->format('d/m/Y'),
            'nb_evaluations_attendues' => 0,
            'nb_evaluations_completees' => 0,
            'nb_evaluations_en_cours' => 0,
            'nb_evaluations_non_demarrees' => 0,
            'taux_participation' => 0,
            'date_generation' => now()->format('d/m/Y H:i'),
        ];
        
        // Mettre à jour statistiques dans la période
        $periode->update(['statistiques_json' => $stats]);
        
        // Générer PDF
        $this->genererPdfRapport($stats);
        
        return $stats;
    }
    
    /**
     * Générer le PDF du rapport
     */
    protected function genererPdfRapport(array $stats): string
    {
        $pdf = Pdf::loadView('rapports.cloture-periode', ['stats' => $stats]);
        
        $filename = "rapport-cloture-{$stats['id_periode']}-" . now()->format('Y-m-d') . ".pdf";
        $path = "rapports/{$filename}";
        
        Storage::put($path, $pdf->output());
        
        return $path;
    }
}
```

### Enregistrement dans Kernel.php

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
    ];
    
    protected function schedule(Schedule $schedule)
    {
        // Timezone Cameroun
        $schedule->timezone('Africa/Douala');
        
        // Ouverture périodes : Quotidien à 00:01
        $schedule->command('periodes:ouvrir')
            ->dailyAt('00:01')
            ->withoutOverlapping()
            ->onSuccess(function () {
                \Log::info('Scheduled Job: Ouverture périodes exécuté avec succès');
            })
            ->onFailure(function () {
                \Log::error('Scheduled Job: Ouverture périodes échoué');
            });
        
        // Rappels évaluations : Quotidien à 09:00
        $schedule->command('periodes:rappels')
            ->dailyAt('09:00')
            ->withoutOverlapping()
            ->onSuccess(function () {
                \Log::info('Scheduled Job: Rappels évaluations exécuté avec succès');
            })
            ->onFailure(function () {
                \Log::error('Scheduled Job: Rappels évaluations échoué');
            });
        
        // Fermeture périodes : Quotidien à 23:59
        $schedule->command('periodes:fermer')
            ->dailyAt('23:59')
            ->withoutOverlapping()
            ->onSuccess(function () {
                \Log::info('Scheduled Job: Fermeture périodes exécuté avec succès');
            })
            ->onFailure(function () {
                \Log::error('Scheduled Job: Fermeture périodes échoué');
            });
    }
}
```

### Configuration Cron (Serveur Production)

```bash
# Ajouter dans crontab du serveur
* * * * * cd /path-to-project && php artisan schedule:run >> /dev/null 2>&1
```

### Tests Unitaires

```php
namespace Tests\Unit\Console\Commands;

use Tests\TestCase;
use App\Models\PeriodeEvaluation;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Carbon\Carbon;

class OuvrirPeriodesEvaluationTest extends TestCase
{
    use RefreshDatabase;
    
    /** @test */
    public function ouvre_periode_quand_date_debut_atteinte()
    {
        // Créer période planifiée avec date_debut = aujourd'hui
        $periode = PeriodeEvaluation::factory()->create([
            'statut' => 'planifiee',
            'date_debut' => Carbon::today(),
            'date_fin' => Carbon::today()->addDays(30),
        ]);
        
        // Exécuter commande
        $this->artisan('periodes:ouvrir')
            ->assertExitCode(0);
        
        // Vérifier période ouverte
        $periode->refresh();
        $this->assertTrue($periode->est_ouverte);
        $this->assertEquals('ouverte', $periode->statut);
    }
    
    /** @test */
    public function n_ouvre_pas_periode_si_date_debut_future()
    {
        // Créer période planifiée avec date_debut future
        $periode = PeriodeEvaluation::factory()->create([
            'statut' => 'planifiee',
            'date_debut' => Carbon::today()->addDays(5),
            'date_fin' => Carbon::today()->addDays(35),
        ]);
        
        // Exécuter commande
        $this->artisan('periodes:ouvrir')
            ->assertExitCode(0);
        
        // Vérifier période toujours planifiée
        $periode->refresh();
        $this->assertFalse($periode->est_ouverte);
        $this->assertEquals('planifiee', $periode->statut);
    }
}

class FermerPeriodesEvaluationTest extends TestCase
{
    use RefreshDatabase;
    
    /** @test */
    public function ferme_periode_quand_date_fin_atteinte()
    {
        // Créer période ouverte avec date_fin = aujourd'hui
        $periode = PeriodeEvaluation::factory()->create([
            'statut' => 'ouverte',
            'est_ouverte' => true,
            'date_debut' => Carbon::today()->subDays(30),
            'date_fin' => Carbon::today(),
        ]);
        
        // Exécuter commande
        $this->artisan('periodes:fermer')
            ->assertExitCode(0);
        
        // Vérifier période fermée
        $periode->refresh();
        $this->assertFalse($periode->est_ouverte);
        $this->assertEquals('fermee', $periode->statut);
    }
    
    /** @test */
    public function genere_rapport_cloture_lors_fermeture()
    {
        $periode = PeriodeEvaluation::factory()->create([
            'statut' => 'ouverte',
            'est_ouverte' => true,
            'date_debut' => Carbon::today()->subDays(30),
            'date_fin' => Carbon::today(),
        ]);
        
        $this->artisan('periodes:fermer')
            ->assertExitCode(0);
        
        // Vérifier statistiques générées
        $periode->refresh();
        $this->assertNotNull($periode->statistiques_json);
        $this->assertArrayHasKey('taux_participation', $periode->statistiques_json);
    }
}
```

### Project Structure Notes

**Fichiers à créer :**
- `app/Console/Commands/OuvrirPeriodesEvaluation.php`
- `app/Console/Commands/FermerPeriodesEvaluation.php`
- `app/Console/Commands/EnvoyerRappelsEvaluation.php`
- `app/Services/NotificationPeriodeService.php`
- `app/Services/RapportCloturePeriodeService.php`
- `resources/views/rapports/cloture-periode.blade.php`
- `tests/Unit/Console/Commands/OuvrirPeriodesEvaluationTest.php`
- `tests/Unit/Console/Commands/FermerPeriodesEvaluationTest.php`

**Fichiers à modifier :**
- `app/Console/Kernel.php` : Enregistrer scheduled jobs
- `composer.json` : Ajouter dépendance barryvdh/laravel-dompdf (si pas déjà présent)

**Dépendances Stories Précédentes :**
- Story 3.3 : Périodes évaluation créées
- Story 2.4 : AdminLogService pour logging
- Story 1.1 : Table notifications

### Règles Métier SABC Critiques

**Horaires Scheduled Jobs :**
- 00:01 : Ouverture périodes (début journée)
- 09:00 : Rappels évaluations (heure bureau)
- 23:59 : Fermeture périodes (fin journée)

**Timezone :**
- Africa/Douala (UTC+1)
- Respect horaires locaux Cameroun

**Notifications :**
- Ouverture : Tous utilisateurs (sauf ADMIN)
- Rappels : Utilisateurs en retard uniquement
- Fermeture : Tous utilisateurs + rapport

**Rapport Clôture :**
- Format PDF
- Stockage storage/rapports/
- Statistiques complètes période

**Logging :**
- Toutes actions loggées dans logs_administration
- Succès et erreurs tracés
- Matricule SYSTEM pour actions automatiques

### References

- [Source: epics.md#Epic 3 Story 3.4] - Acceptance criteria complets
- [Source: architecture.md#Background Jobs] - Scheduled jobs Laravel
- [Source: project-context.md#Critical Implementation Rules] - Timezone, notifications

## Dev Agent Record

### Agent Model Used

_À remplir par le dev agent_

### Debug Log References

_À remplir par le dev agent_

### Completion Notes List

_À remplir par le dev agent_

### File List

_À remplir par le dev agent_
