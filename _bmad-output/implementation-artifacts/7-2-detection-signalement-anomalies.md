# Story 7.2: Détection et Signalement d'Anomalies

Status: ready-for-dev

## Story

En tant que système,
Je veux détecter automatiquement les anomalies dans les évaluations,
Afin d'alerter les admins.

## Acceptance Criteria

**Given** les évaluations sont validées et les scores calculés
**When** le système analyse les données (batch quotidien)
**Then** une anomalie "Divergence auto vs autres" est détectée si |score_auto - score_pairs/manager| > 1.5
**And** une anomalie "Baisse de performance" est détectée si progression_vs_precedente < -1 sur 3 mois
**And** une anomalie "Uniformité excessive" est détectée si variance notations < 0.5
**And** une anomalie "Biais évaluateur" est détectée si moyenne systématiquement élevée/basse
**And** les anomalies sont sauvegardées dans `logs_anomalies` avec type, sévérité, utilisateur concerné
**And** les admins reçoivent une notification pour anomalies sévères

## Tasks / Subtasks

- [ ] Table logs_anomalies (AC: 5)
  - [ ] Migration `create_logs_anomalies_table.php`
  - [ ] Colonnes : id, type_anomalie, severite, matricule_concerne, data_json, date_detection
  - [ ] Index sur type_anomalie, severite, matricule_concerne

- [ ] Scheduled Job DetectionAnomalies (AC: 1, 2, 3, 4, 5, 6)
  - [ ] Créer `app/Console/Commands/DetectionAnomalies.php`
  - [ ] Logique détection 4 types anomalies
  - [ ] Sauvegarde dans logs_anomalies
  - [ ] Notification admins si sévère
  - [ ] Scheduled : Quotidien à 02:00

- [ ] Service DetectionAnomaliesService (AC: 1, 2, 3, 4, 5)
  - [ ] Créer `app/Services/DetectionAnomaliesService.php`
  - [ ] Méthode `detecterDivergenceAutoVsAutres()` : |score_auto - score_autres| > 1.5
  - [ ] Méthode `detecterBaissePerformance()` : progression < -1 sur 3 mois
  - [ ] Méthode `detecterUniformiteExcessive()` : variance < 0.5
  - [ ] Méthode `detecterBiaisEvaluateur()` : moyenne systématique élevée/basse
  - [ ] Méthode `sauvegarderAnomalie()` : Enregistrement logs_anomalies

- [ ] Modèle LogAnomalie (AC: 5)
  - [ ] Créer `app/Models/LogAnomalie.php`
  - [ ] Relations : utilisateur concerné
  - [ ] Scopes : par type, par sévérité

- [ ] Service NotificationAdminService (AC: 6)
  - [ ] Créer `app/Services/NotificationAdminService.php`
  - [ ] Méthode `notifierAnomaliesSeveres()` : Notification admins
  - [ ] Filtrage : Sévérité 'elevee' uniquement

- [ ] Page Admin Anomalies (AC: 5)
  - [ ] Page `resources/js/Pages/Admin/Anomalies/Index.tsx`
  - [ ] Liste anomalies détectées
  - [ ] Filtres : Type, sévérité, utilisateur
  - [ ] Statistiques : Total, par type, par sévérité
  - [ ] Actions : Voir détails, Marquer résolu

- [ ] Composant CardAnomalie (AC: 5)
  - [ ] Créer `resources/js/Components/Admin/CardAnomalie.tsx`
  - [ ] Affichage : Type, sévérité, utilisateur, date
  - [ ] Badge sévérité avec couleurs
  - [ ] Bouton détails

- [ ] AnomaliesController (AC: 5)
  - [ ] Créer `app/Http/Controllers/Admin/AnomaliesController.php`
  - [ ] Méthode `index()` : Liste anomalies
  - [ ] Méthode `show()` : Détails anomalie
  - [ ] Middleware `role:ADMIN`

- [ ] Tests & Validation
  - [ ] Tester détection divergence auto vs autres
  - [ ] Tester détection baisse performance
  - [ ] Tester détection uniformité excessive
  - [ ] Tester détection biais évaluateur
  - [ ] Tester notifications admins

## Dev Notes

### Architecture Détection Anomalies

**Types Anomalies :**
1. **Divergence Auto vs Autres** : |score_auto - score_pairs/manager| > 1.5
2. **Baisse Performance** : progression_vs_precedente < -1 sur 3 mois
3. **Uniformité Excessive** : variance notations < 0.5
4. **Biais Évaluateur** : moyenne systématiquement élevée (>4.5) ou basse (<2)

**Flux Détection :**
1. Scheduled Job s'exécute quotidiennement à 02:00
2. Récupération évaluations validées
3. Analyse par type anomalie
4. Sauvegarde dans logs_anomalies
5. Notification admins si sévérité élevée

**Sévérités :**
- **Faible** : Écart mineur, surveillance
- **Moyenne** : Écart notable, attention
- **Élevée** : Écart important, action requise

**Notification Admins :**
- Condition : Sévérité 'elevee'
- Destinataires : Tous utilisateurs rôle ADMIN
- Type : 'anomalie_detectee'

### Migration Table logs_anomalies

```php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class CreateLogsAnomaliesTable extends Migration
{
    public function up()
    {
        Schema::connection('pgsql')->create('logs_anomalies', function (Blueprint $table) {
            $table->uuid('id_anomalie')->primary();
            $table->string('type_anomalie', 100); // divergence_auto, baisse_performance, uniformite_excessive, biais_evaluateur
            $table->enum('severite', ['faible', 'moyenne', 'elevee']);
            $table->string('matricule_concerne', 5);
            $table->jsonb('data_json'); // Détails anomalie
            $table->timestamp('date_detection');
            $table->boolean('resolue')->default(false);
            $table->timestamp('date_resolution')->nullable();
            $table->timestamps();
            
            $table->foreign('matricule_concerne')->references('matricule')->on('mysql.utilisateurs');
            $table->index('type_anomalie');
            $table->index('severite');
            $table->index('matricule_concerne');
            $table->index('resolue');
        });
    }
    
    public function down()
    {
        Schema::connection('pgsql')->dropIfExists('logs_anomalies');
    }
}
```

### Scheduled Job DetectionAnomalies

```php
namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Services\DetectionAnomaliesService;
use App\Services\NotificationAdminService;

class DetectionAnomalies extends Command
{
    protected $signature = 'anomalies:detecter';
    protected $description = 'Détecter automatiquement les anomalies dans les évaluations';
    
    protected $detectionService;
    protected $notificationService;
    
    public function __construct(
        DetectionAnomaliesService $detectionService,
        NotificationAdminService $notificationService
    ) {
        parent::__construct();
        $this->detectionService = $detectionService;
        $this->notificationService = $notificationService;
    }
    
    public function handle()
    {
        $this->info('Démarrage de la détection d\'anomalies...');
        
        $anomaliesDetectees = [];
        
        // 1. Détection divergence auto vs autres
        $divergences = $this->detectionService->detecterDivergenceAutoVsAutres();
        $anomaliesDetectees = array_merge($anomaliesDetectees, $divergences);
        $this->info("Divergences auto vs autres : " . count($divergences));
        
        // 2. Détection baisse de performance
        $baisses = $this->detectionService->detecterBaissePerformance();
        $anomaliesDetectees = array_merge($anomaliesDetectees, $baisses);
        $this->info("Baisses de performance : " . count($baisses));
        
        // 3. Détection uniformité excessive
        $uniformites = $this->detectionService->detecterUniformiteExcessive();
        $anomaliesDetectees = array_merge($anomaliesDetectees, $uniformites);
        $this->info("Uniformités excessives : " . count($uniformites));
        
        // 4. Détection biais évaluateur
        $biais = $this->detectionService->detecterBiaisEvaluateur();
        $anomaliesDetectees = array_merge($anomaliesDetectees, $biais);
        $this->info("Biais évaluateurs : " . count($biais));
        
        // Notifier admins pour anomalies sévères
        $anomaliesSeveres = array_filter($anomaliesDetectees, function($a) {
            return $a['severite'] === 'elevee';
        });
        
        if (count($anomaliesSeveres) > 0) {
            $this->notificationService->notifierAnomaliesSeveres($anomaliesSeveres);
            $this->warn("Anomalies sévères détectées : " . count($anomaliesSeveres));
        }
        
        $this->info("Total anomalies détectées : " . count($anomaliesDetectees));
        
        return 0;
    }
}
```

### DetectionAnomaliesService

```php
namespace App\Services;

use App\Models\Evaluation;
use App\Models\Utilisateur;
use App\Models\LogAnomalie;
use Illuminate\Support\Str;
use Carbon\Carbon;

class DetectionAnomaliesService
{
    /**
     * Détecter divergence auto-évaluation vs autres
     */
    public function detecterDivergenceAutoVsAutres(): array
    {
        $anomalies = [];
        
        // Récupérer utilisateurs avec auto-évaluation et autres évaluations
        $utilisateurs = Utilisateur::whereHas('evaluationsRecues', function($q) {
            $q->where('statut', 'valide');
        })->get();
        
        foreach ($utilisateurs as $utilisateur) {
            $evaluations = Evaluation::where('evalue_matricule', $utilisateur->matricule)
                ->where('statut', 'valide')
                ->get();
            
            $scoreAuto = $evaluations->where('type_evaluation', 'auto')->avg('score_global');
            $scoreAutres = $evaluations->whereIn('type_evaluation', ['peer', 'subordinate'])->avg('score_global');
            
            if ($scoreAuto && $scoreAutres) {
                $divergence = abs($scoreAuto - $scoreAutres);
                
                if ($divergence > 1.5) {
                    $severite = $divergence > 2.5 ? 'elevee' : ($divergence > 2 ? 'moyenne' : 'faible');
                    
                    $anomalie = $this->sauvegarderAnomalie(
                        'divergence_auto',
                        $severite,
                        $utilisateur->matricule,
                        [
                            'score_auto' => $scoreAuto,
                            'score_autres' => $scoreAutres,
                            'divergence' => $divergence,
                        ]
                    );
                    
                    $anomalies[] = $anomalie;
                }
            }
        }
        
        return $anomalies;
    }
    
    /**
     * Détecter baisse de performance
     */
    public function detecterBaissePerformance(): array
    {
        $anomalies = [];
        $dateDebut = Carbon::now()->subMonths(3);
        
        $utilisateurs = Utilisateur::whereHas('evaluationsRecues', function($q) {
            $q->where('statut', 'valide');
        })->get();
        
        foreach ($utilisateurs as $utilisateur) {
            // Calculer progression sur 3 mois
            $scoreActuel = Evaluation::where('evalue_matricule', $utilisateur->matricule)
                ->where('statut', 'valide')
                ->where('date_validation', '>=', $dateDebut)
                ->avg('score_global');
            
            $scorePrecedent = Evaluation::where('evalue_matricule', $utilisateur->matricule)
                ->where('statut', 'valide')
                ->where('date_validation', '<', $dateDebut)
                ->where('date_validation', '>=', $dateDebut->copy()->subMonths(3))
                ->avg('score_global');
            
            if ($scoreActuel && $scorePrecedent) {
                $progression = $scoreActuel - $scorePrecedent;
                
                if ($progression < -1) {
                    $severite = $progression < -2 ? 'elevee' : 'moyenne';
                    
                    $anomalie = $this->sauvegarderAnomalie(
                        'baisse_performance',
                        $severite,
                        $utilisateur->matricule,
                        [
                            'score_actuel' => $scoreActuel,
                            'score_precedent' => $scorePrecedent,
                            'progression' => $progression,
                        ]
                    );
                    
                    $anomalies[] = $anomalie;
                }
            }
        }
        
        return $anomalies;
    }
    
    /**
     * Détecter uniformité excessive des notations
     */
    public function detecterUniformiteExcessive(): array
    {
        $anomalies = [];
        
        $evaluations = Evaluation::where('statut', 'valide')
            ->whereNotNull('notations_json')
            ->get();
        
        foreach ($evaluations as $evaluation) {
            $notations = $evaluation->notations_json;
            
            if (empty($notations)) continue;
            
            $notes = array_column($notations, 'note');
            
            if (count($notes) < 3) continue;
            
            // Calculer variance
            $moyenne = array_sum($notes) / count($notes);
            $variance = array_sum(array_map(function($n) use ($moyenne) {
                return pow($n - $moyenne, 2);
            }, $notes)) / count($notes);
            
            if ($variance < 0.5) {
                $severite = $variance < 0.2 ? 'elevee' : 'moyenne';
                
                $anomalie = $this->sauvegarderAnomalie(
                    'uniformite_excessive',
                    $severite,
                    $evaluation->evaluateur_matricule,
                    [
                        'id_evaluation' => $evaluation->id_evaluation,
                        'variance' => $variance,
                        'notes' => $notes,
                    ]
                );
                
                $anomalies[] = $anomalie;
            }
        }
        
        return $anomalies;
    }
    
    /**
     * Détecter biais évaluateur
     */
    public function detecterBiaisEvaluateur(): array
    {
        $anomalies = [];
        
        $evaluateurs = Utilisateur::whereHas('evaluationsDonnees', function($q) {
            $q->where('statut', 'valide');
        })->get();
        
        foreach ($evaluateurs as $evaluateur) {
            $moyenneEvaluations = Evaluation::where('evaluateur_matricule', $evaluateur->matricule)
                ->where('statut', 'valide')
                ->avg('score_global');
            
            if ($moyenneEvaluations > 4.5 || $moyenneEvaluations < 2) {
                $type = $moyenneEvaluations > 4.5 ? 'biais_positif' : 'biais_negatif';
                $severite = ($moyenneEvaluations > 4.8 || $moyenneEvaluations < 1.5) ? 'elevee' : 'moyenne';
                
                $anomalie = $this->sauvegarderAnomalie(
                    'biais_evaluateur',
                    $severite,
                    $evaluateur->matricule,
                    [
                        'moyenne_evaluations' => $moyenneEvaluations,
                        'type_biais' => $type,
                    ]
                );
                
                $anomalies[] = $anomalie;
            }
        }
        
        return $anomalies;
    }
    
    /**
     * Sauvegarder une anomalie
     */
    protected function sauvegarderAnomalie(
        string $type,
        string $severite,
        string $matricule,
        array $data
    ): array {
        $anomalie = LogAnomalie::create([
            'id_anomalie' => Str::uuid(),
            'type_anomalie' => $type,
            'severite' => $severite,
            'matricule_concerne' => $matricule,
            'data_json' => $data,
            'date_detection' => now(),
        ]);
        
        return [
            'id_anomalie' => $anomalie->id_anomalie,
            'type' => $type,
            'severite' => $severite,
            'matricule' => $matricule,
            'data' => $data,
        ];
    }
}
```

### NotificationAdminService

```php
namespace App\Services;

use App\Models\Utilisateur;
use App\Models\Notification;

class NotificationAdminService
{
    /**
     * Notifier les admins des anomalies sévères
     */
    public function notifierAnomaliesSeveres(array $anomalies): void
    {
        $admins = Utilisateur::whereHas('role', function($q) {
            $q->where('nom_role', 'ADMIN');
        })->get();
        
        $nbAnomalies = count($anomalies);
        
        foreach ($admins as $admin) {
            Notification::create([
                'matricule_destinataire' => $admin->matricule,
                'type' => 'anomalie_detectee',
                'titre' => 'Anomalies sévères détectées',
                'message' => "{$nbAnomalies} anomalie(s) sévère(s) ont été détectées dans les évaluations. Veuillez consulter le dashboard Analytics pour plus de détails.",
                'data_json' => [
                    'nb_anomalies' => $nbAnomalies,
                    'anomalies' => array_map(function($a) {
                        return [
                            'id_anomalie' => $a['id_anomalie'],
                            'type' => $a['type'],
                            'matricule' => $a['matricule'],
                        ];
                    }, $anomalies),
                    'lien_action' => '/admin/anomalies',
                ],
                'lue' => false,
            ]);
        }
    }
}
```

### Modèle LogAnomalie

```php
namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class LogAnomalie extends Model
{
    protected $connection = 'pgsql';
    protected $table = 'logs_anomalies';
    protected $primaryKey = 'id_anomalie';
    public $incrementing = false;
    protected $keyType = 'string';
    
    protected $fillable = [
        'id_anomalie',
        'type_anomalie',
        'severite',
        'matricule_concerne',
        'data_json',
        'date_detection',
        'resolue',
        'date_resolution',
    ];
    
    protected $casts = [
        'data_json' => 'array',
        'date_detection' => 'datetime',
        'date_resolution' => 'datetime',
        'resolue' => 'boolean',
    ];
    
    public function utilisateur()
    {
        return $this->belongsTo(Utilisateur::class, 'matricule_concerne', 'matricule');
    }
    
    public function scopeParType($query, string $type)
    {
        return $query->where('type_anomalie', $type);
    }
    
    public function scopeParSeverite($query, string $severite)
    {
        return $query->where('severite', $severite);
    }
    
    public function scopeNonResolues($query)
    {
        return $query->where('resolue', false);
    }
}
```

### Project Structure Notes

**Fichiers à créer :**
- `database/migrations/xxxx_create_logs_anomalies_table.php`
- `app/Console/Commands/DetectionAnomalies.php`
- `app/Services/DetectionAnomaliesService.php`
- `app/Services/NotificationAdminService.php`
- `app/Models/LogAnomalie.php`
- `app/Http/Controllers/Admin/AnomaliesController.php`
- `resources/js/Pages/Admin/Anomalies/Index.tsx`
- `resources/js/Components/Admin/CardAnomalie.tsx`

**Fichiers à modifier :**
- `app/Console/Kernel.php` : Enregistrer scheduled job
- `routes/web.php` : Ajouter routes anomalies admin

**Dépendances Stories Précédentes :**
- Story 4.4 : Évaluations validées
- Story 5.1 : Infrastructure notifications

### Règles Métier SABC Critiques

**Types Anomalies :**
- Divergence auto : |score_auto - score_autres| > 1.5
- Baisse performance : progression < -1 sur 3 mois
- Uniformité excessive : variance < 0.5
- Biais évaluateur : moyenne > 4.5 ou < 2

**Sévérités :**
- Faible : Surveillance
- Moyenne : Attention
- Élevée : Action requise + notification admins

**Fréquence :**
- Quotidien à 02:00 (nuit)
- Batch après calculs scores

**Notifications :**
- Condition : Sévérité 'elevee'
- Destinataires : Tous ADMIN
- Lien : /admin/anomalies

### References

- [Source: epics.md#Epic 7 Story 7.2] - Acceptance criteria complets
- [Source: architecture.md#Anomalies] - Détection anomalies
- [Source: business-logic-rules.md#Anomalies] - Règles détection
- [Source: project-context.md#Critical Implementation Rules] - Logging, notifications

## Dev Agent Record

### Agent Model Used

_À remplir par le dev agent_

### Debug Log References

_À remplir par le dev agent_

### Completion Notes List

_À remplir par le dev agent_

### File List

_À remplir par le dev agent_
