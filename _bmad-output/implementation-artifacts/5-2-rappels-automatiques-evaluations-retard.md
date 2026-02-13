# Story 5.2: Rappels Automatiques pour Évaluations en Retard

Status: ready-for-dev

## Story

En tant que système,
Je veux envoyer des rappels automatiques aux évaluateurs en retard,
Afin d'améliorer le taux de complétion.

## Acceptance Criteria

**Given** une évaluation en brouillon existe depuis > 7 jours
**When** le Scheduled Job quotidien s'exécute
**Then** une notification de rappel est envoyée à l'évaluateur
**And** le message indique : nom de l'évalué, jours restants avant clôture période
**And** les rappels sont envoyés à J-7, J-3, J-1 avant la `date_fin`
**And** après la `date_fin`, un rappel final est envoyé si évaluation non soumise
**And** le nombre de rappels envoyés est comptabilisé dans `rappels_envoyes`

## Tasks / Subtasks

- [ ] Scheduled Job RappelsEvaluationsRetard (AC: 1, 2, 3, 4, 5)
  - [ ] Créer `app/Console/Commands/RappelsEvaluationsRetard.php`
  - [ ] Logique : Détecter évaluations brouillon > 7 jours
  - [ ] Logique : Détecter rappels J-7, J-3, J-1 avant date_fin
  - [ ] Logique : Détecter évaluations non soumises après date_fin
  - [ ] Envoyer notifications rappel
  - [ ] Comptabiliser rappels_envoyes
  - [ ] Scheduled : Quotidien à 09:00

- [ ] Service RappelEvaluationService (AC: 1, 2, 3, 4, 5)
  - [ ] Créer `app/Services/RappelEvaluationService.php`
  - [ ] Méthode `getEvaluationsEnRetard()` : Liste évaluations brouillon > 7 jours
  - [ ] Méthode `getEvaluationsAvantEcheance()` : Liste évaluations J-7, J-3, J-1
  - [ ] Méthode `getEvaluationsApresEcheance()` : Liste évaluations non soumises après date_fin
  - [ ] Méthode `envoyerRappel()` : Envoi notification rappel
  - [ ] Méthode `incrementerRappels()` : Comptabiliser rappels_envoyes

- [ ] Ajout Colonne `rappels_envoyes` (AC: 5)
  - [ ] Migration `add_rappels_envoyes_to_evaluations_table.php`
  - [ ] Colonne : rappels_envoyes (integer, default 0)
  - [ ] Index sur rappels_envoyes

- [ ] Modification Modèle Evaluation (AC: 5)
  - [ ] Ajouter `rappels_envoyes` dans $fillable
  - [ ] Méthode `incrementerRappels()` : Incrémenter compteur

- [ ] Enregistrement Scheduled Job (AC: 1)
  - [ ] Modifier `app/Console/Kernel.php`
  - [ ] Enregistrer RappelsEvaluationsRetard (quotidien 09:00)
  - [ ] Configuration timezone 'Africa/Douala'

- [ ] Tests & Validation
  - [ ] Tester détection évaluations brouillon > 7 jours
  - [ ] Tester rappels J-7, J-3, J-1
  - [ ] Tester rappel final après date_fin
  - [ ] Tester comptabilisation rappels_envoyes
  - [ ] Tester notifications envoyées

## Dev Notes

### Architecture Rappels Automatiques

**Types de Rappels :**
1. **Rappel Brouillon Ancien** : Évaluation brouillon > 7 jours
2. **Rappel J-7** : 7 jours avant date_fin période
3. **Rappel J-3** : 3 jours avant date_fin période
4. **Rappel J-1** : 1 jour avant date_fin période
5. **Rappel Final** : Après date_fin si non soumise

**Flux Rappels :**
1. Scheduled Job s'exécute quotidiennement à 09:00
2. Détection évaluations en retard (3 catégories)
3. Envoi notifications rappel
4. Incrément compteur rappels_envoyes
5. Logging actions

**Contenu Notification Rappel :**
- Titre : "Rappel : Évaluation à compléter"
- Message : "Vous avez une évaluation de {nom_evalue} en attente. Il reste {jours_restants} jour(s) avant la clôture de la période {nom_periode}."
- Lien : /evaluations/{id_evaluation}/edit
- Type : 'rappel_evaluation'

**Règles Comptabilisation :**
- Incrément +1 à chaque rappel envoyé
- Pas de limite nombre rappels
- Historique complet dans table notifications

### Migration Colonne rappels_envoyes

```php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class AddRappelsEnvoyesToEvaluationsTable extends Migration
{
    public function up()
    {
        Schema::connection('pgsql')->table('evaluations', function (Blueprint $table) {
            $table->integer('rappels_envoyes')->default(0)->after('motif_rejet');
            $table->index('rappels_envoyes');
        });
    }
    
    public function down()
    {
        Schema::connection('pgsql')->table('evaluations', function (Blueprint $table) {
            $table->dropColumn('rappels_envoyes');
        });
    }
}
```

### Scheduled Job RappelsEvaluationsRetard

```php
namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Services\RappelEvaluationService;
use Carbon\Carbon;

class RappelsEvaluationsRetard extends Command
{
    protected $signature = 'evaluations:rappels';
    protected $description = 'Envoyer des rappels automatiques pour les évaluations en retard';
    
    protected $rappelService;
    
    public function __construct(RappelEvaluationService $rappelService)
    {
        parent::__construct();
        $this->rappelService = $rappelService;
    }
    
    public function handle()
    {
        $today = Carbon::today();
        $nbRappelsEnvoyes = 0;
        
        // 1. Rappels évaluations brouillon > 7 jours
        $evaluationsAnciennesBrouillon = $this->rappelService->getEvaluationsEnRetard();
        
        foreach ($evaluationsAnciennesBrouillon as $evaluation) {
            $this->rappelService->envoyerRappel($evaluation, 'brouillon_ancien');
            $nbRappelsEnvoyes++;
        }
        
        $this->info("Rappels brouillon ancien : {$nbRappelsEnvoyes}");
        
        // 2. Rappels J-7, J-3, J-1 avant date_fin
        $evaluationsAvantEcheance = $this->rappelService->getEvaluationsAvantEcheance();
        
        foreach ($evaluationsAvantEcheance as $evaluation) {
            $joursRestants = $evaluation['jours_restants'];
            
            if (in_array($joursRestants, [7, 3, 1])) {
                $this->rappelService->envoyerRappel($evaluation['evaluation'], "j_moins_{$joursRestants}");
                $nbRappelsEnvoyes++;
            }
        }
        
        $this->info("Rappels avant échéance : " . count($evaluationsAvantEcheance));
        
        // 3. Rappels finaux après date_fin
        $evaluationsApresEcheance = $this->rappelService->getEvaluationsApresEcheance();
        
        foreach ($evaluationsApresEcheance as $evaluation) {
            $this->rappelService->envoyerRappel($evaluation, 'apres_echeance');
            $nbRappelsEnvoyes++;
        }
        
        $this->info("Rappels après échéance : " . count($evaluationsApresEcheance));
        
        $this->info("Total rappels envoyés : {$nbRappelsEnvoyes}");
        
        return 0;
    }
}
```

### RappelEvaluationService

```php
namespace App\Services;

use App\Models\Evaluation;
use App\Models\Notification;
use Carbon\Carbon;

class RappelEvaluationService
{
    /**
     * Récupérer les évaluations en retard (brouillon > 7 jours)
     */
    public function getEvaluationsEnRetard(): \Illuminate\Support\Collection
    {
        $dateLimite = Carbon::now()->subDays(7);
        
        return Evaluation::with(['evaluateur', 'evalue', 'periode'])
            ->where('statut', 'brouillon')
            ->where('created_at', '<=', $dateLimite)
            ->whereHas('periode', function($q) {
                $q->where('est_ouverte', true);
            })
            ->get();
    }
    
    /**
     * Récupérer les évaluations avant échéance (J-7, J-3, J-1)
     */
    public function getEvaluationsAvantEcheance(): array
    {
        $today = Carbon::today();
        $evaluations = [];
        
        // Récupérer évaluations brouillon dans périodes ouvertes
        $evaluationsBrouillon = Evaluation::with(['evaluateur', 'evalue', 'periode'])
            ->where('statut', 'brouillon')
            ->whereHas('periode', function($q) {
                $q->where('est_ouverte', true);
            })
            ->get();
        
        foreach ($evaluationsBrouillon as $evaluation) {
            $dateFin = Carbon::parse($evaluation->periode->date_fin);
            $joursRestants = $today->diffInDays($dateFin, false);
            
            // Vérifier si on est à J-7, J-3 ou J-1
            if (in_array($joursRestants, [7, 3, 1])) {
                $evaluations[] = [
                    'evaluation' => $evaluation,
                    'jours_restants' => $joursRestants,
                ];
            }
        }
        
        return $evaluations;
    }
    
    /**
     * Récupérer les évaluations après échéance (non soumises après date_fin)
     */
    public function getEvaluationsApresEcheance(): \Illuminate\Support\Collection
    {
        $today = Carbon::today();
        
        return Evaluation::with(['evaluateur', 'evalue', 'periode'])
            ->where('statut', 'brouillon')
            ->whereHas('periode', function($q) use ($today) {
                $q->where('date_fin', '<', $today)
                  ->where('est_ouverte', false);
            })
            ->get();
    }
    
    /**
     * Envoyer un rappel
     */
    public function envoyerRappel(Evaluation $evaluation, string $typeRappel): void
    {
        $joursRestants = $this->calculerJoursRestants($evaluation);
        
        $messages = [
            'brouillon_ancien' => "Vous avez une évaluation de {$evaluation->evalue->nom_complet} en brouillon depuis plus de 7 jours. Merci de la compléter avant la clôture de la période.",
            'j_moins_7' => "Rappel : Il vous reste 7 jours pour compléter l'évaluation de {$evaluation->evalue->nom_complet} avant la clôture de la période {$evaluation->periode->nom_periode}.",
            'j_moins_3' => "Rappel urgent : Il vous reste 3 jours pour compléter l'évaluation de {$evaluation->evalue->nom_complet} avant la clôture de la période {$evaluation->periode->nom_periode}.",
            'j_moins_1' => "Rappel final : Il vous reste 1 jour pour compléter l'évaluation de {$evaluation->evalue->nom_complet} avant la clôture de la période {$evaluation->periode->nom_periode}.",
            'apres_echeance' => "La période {$evaluation->periode->nom_periode} est fermée mais vous avez encore une évaluation de {$evaluation->evalue->nom_complet} en brouillon. Merci de la compléter rapidement.",
        ];
        
        Notification::create([
            'matricule_destinataire' => $evaluation->evaluateur_matricule,
            'type' => 'rappel_evaluation',
            'titre' => 'Rappel : Évaluation à compléter',
            'message' => $messages[$typeRappel] ?? $messages['brouillon_ancien'],
            'data_json' => [
                'id_evaluation' => $evaluation->id_evaluation,
                'evalue_matricule' => $evaluation->evalue_matricule,
                'evalue_nom' => $evaluation->evalue->nom_complet,
                'periode_nom' => $evaluation->periode->nom_periode,
                'jours_restants' => $joursRestants,
                'type_rappel' => $typeRappel,
                'lien_action' => "/evaluations/{$evaluation->id_evaluation}/edit",
            ],
            'lue' => false,
        ]);
        
        // Incrémenter compteur rappels
        $this->incrementerRappels($evaluation);
    }
    
    /**
     * Calculer les jours restants avant clôture
     */
    protected function calculerJoursRestants(Evaluation $evaluation): int
    {
        $today = Carbon::today();
        $dateFin = Carbon::parse($evaluation->periode->date_fin);
        
        return max(0, $today->diffInDays($dateFin, false));
    }
    
    /**
     * Incrémenter le compteur de rappels
     */
    public function incrementerRappels(Evaluation $evaluation): void
    {
        $evaluation->increment('rappels_envoyes');
    }
}
```

### Modification Modèle Evaluation

```php
namespace App\Models;

class Evaluation extends Model
{
    // ... code existant ...
    
    protected $fillable = [
        'id_evaluation',
        'evaluateur_matricule',
        'evalue_matricule',
        'id_periode',
        'id_template',
        'type_evaluation',
        'statut',
        'notations_json',
        'commentaires_json',
        'date_soumission',
        'date_validation',
        'validateur_matricule',
        'motif_rejet',
        'rappels_envoyes', // Nouvelle colonne
    ];
    
    /**
     * Incrémenter le compteur de rappels
     */
    public function incrementerRappels(): void
    {
        $this->increment('rappels_envoyes');
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
        Commands\RappelsEvaluationsRetard::class, // Nouveau
    ];
    
    protected function schedule(Schedule $schedule)
    {
        // Timezone Cameroun
        $schedule->timezone('Africa/Douala');
        
        // ... autres scheduled jobs ...
        
        // Rappels évaluations en retard : Quotidien à 09:00
        $schedule->command('evaluations:rappels')
            ->dailyAt('09:00')
            ->withoutOverlapping()
            ->onSuccess(function () {
                \Log::info('Scheduled Job: Rappels évaluations exécuté avec succès');
            })
            ->onFailure(function () {
                \Log::error('Scheduled Job: Rappels évaluations échoué');
            });
    }
}
```

### Tests Unitaires

```php
namespace Tests\Unit\Services;

use Tests\TestCase;
use App\Models\Evaluation;
use App\Models\PeriodeEvaluation;
use App\Services\RappelEvaluationService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Carbon\Carbon;

class RappelEvaluationServiceTest extends TestCase
{
    use RefreshDatabase;
    
    protected $rappelService;
    
    protected function setUp(): void
    {
        parent::setUp();
        $this->rappelService = new RappelEvaluationService();
    }
    
    /** @test */
    public function detecte_evaluations_brouillon_anciennes()
    {
        // Créer période ouverte
        $periode = PeriodeEvaluation::factory()->create([
            'est_ouverte' => true,
            'date_debut' => Carbon::today()->subDays(30),
            'date_fin' => Carbon::today()->addDays(10),
        ]);
        
        // Créer évaluation brouillon > 7 jours
        $evaluation = Evaluation::factory()->create([
            'statut' => 'brouillon',
            'id_periode' => $periode->id_periode,
            'created_at' => Carbon::now()->subDays(10),
        ]);
        
        // Récupérer évaluations en retard
        $evaluationsRetard = $this->rappelService->getEvaluationsEnRetard();
        
        $this->assertCount(1, $evaluationsRetard);
        $this->assertEquals($evaluation->id_evaluation, $evaluationsRetard->first()->id_evaluation);
    }
    
    /** @test */
    public function detecte_evaluations_j_moins_7()
    {
        // Créer période ouverte avec date_fin dans 7 jours
        $periode = PeriodeEvaluation::factory()->create([
            'est_ouverte' => true,
            'date_debut' => Carbon::today()->subDays(20),
            'date_fin' => Carbon::today()->addDays(7),
        ]);
        
        // Créer évaluation brouillon
        $evaluation = Evaluation::factory()->create([
            'statut' => 'brouillon',
            'id_periode' => $periode->id_periode,
        ]);
        
        // Récupérer évaluations avant échéance
        $evaluationsAvantEcheance = $this->rappelService->getEvaluationsAvantEcheance();
        
        $this->assertCount(1, $evaluationsAvantEcheance);
        $this->assertEquals(7, $evaluationsAvantEcheance[0]['jours_restants']);
    }
    
    /** @test */
    public function incremente_compteur_rappels()
    {
        $evaluation = Evaluation::factory()->create([
            'statut' => 'brouillon',
            'rappels_envoyes' => 0,
        ]);
        
        $this->rappelService->envoyerRappel($evaluation, 'brouillon_ancien');
        
        $evaluation->refresh();
        $this->assertEquals(1, $evaluation->rappels_envoyes);
    }
}
```

### Project Structure Notes

**Fichiers à créer :**
- `app/Console/Commands/RappelsEvaluationsRetard.php`
- `app/Services/RappelEvaluationService.php`
- `database/migrations/xxxx_add_rappels_envoyes_to_evaluations_table.php`
- `tests/Unit/Services/RappelEvaluationServiceTest.php`

**Fichiers à modifier :**
- `app/Console/Kernel.php` : Enregistrer scheduled job
- `app/Models/Evaluation.php` : Ajouter colonne rappels_envoyes

**Dépendances Stories Précédentes :**
- Story 4.1 : Table evaluations
- Story 5.1 : Infrastructure notifications

### Règles Métier SABC Critiques

**Détection Évaluations en Retard :**
- Brouillon > 7 jours : Rappel général
- J-7 avant date_fin : Premier rappel échéance
- J-3 avant date_fin : Rappel urgent
- J-1 avant date_fin : Rappel final
- Après date_fin : Rappel période fermée

**Fréquence Rappels :**
- Quotidien à 09:00 (heure bureau Cameroun)
- Pas de limite nombre rappels
- Comptabilisation dans rappels_envoyes

**Contenu Notifications :**
- Nom évalué
- Jours restants (si applicable)
- Nom période
- Lien direct vers édition évaluation

**Règles Envoi :**
- Uniquement évaluations brouillon
- Uniquement périodes ouvertes (sauf rappel final)
- Pas de rappels pour évaluations soumises/validées

### References

- [Source: epics.md#Epic 5 Story 5.2] - Acceptance criteria complets
- [Source: architecture.md#Scheduled Jobs] - Jobs quotidiens
- [Source: business-logic-rules.md#Rappels] - Règles rappels
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
