# Story 5.4: Processus d'Escalade Automatique (3j → 7j → 10j → Admin)

Status: ready-for-dev

## Story

En tant que système,
Je veux escalader automatiquement les retards selon les règles SABC,
Afin d'assurer le traitement des évaluations.

## Acceptance Criteria

**Given** une évaluation en brouillon ou en attente de validation
**When** les délais sont dépassés
**Then** après 3 jours : rappel à l'évaluateur/manager
**And** après 7 jours : notification au manager de l'évaluateur/manager
**And** après 10 jours : alerte au DR de la région
**And** après 15 jours : alerte à l'administrateur système
**And** chaque escalade est loggée dans `logs_administration`
**And** les escalades sont affichées dans le dashboard admin

## Tasks / Subtasks

- [ ] Scheduled Job ProcessusEscaladeAutomatique (AC: 1, 2, 3, 4, 5, 6)
  - [ ] Créer `app/Console/Commands/ProcessusEscaladeAutomatique.php`
  - [ ] Logique : Détecter retards par niveau (3j, 7j, 10j, 15j)
  - [ ] Envoyer notifications selon niveau escalade
  - [ ] Logger chaque escalade dans logs_administration
  - [ ] Scheduled : Quotidien à 11:00

- [ ] Service EscaladeService (AC: 1, 2, 3, 4, 5)
  - [ ] Créer `app/Services/EscaladeService.php`
  - [ ] Méthode `detecterEscalades()` : Détecter retards par niveau
  - [ ] Méthode `escaladerNiveau1()` : 3j - Rappel évaluateur/manager
  - [ ] Méthode `escaladerNiveau2()` : 7j - Manager N+1
  - [ ] Méthode `escaladerNiveau3()` : 10j - DR région
  - [ ] Méthode `escaladerNiveau4()` : 15j - Administrateur
  - [ ] Méthode `loggerEscalade()` : Logging logs_administration

- [ ] Ajout Colonne `niveau_escalade` (AC: 5)
  - [ ] Migration `add_niveau_escalade_to_evaluations_table.php`
  - [ ] Colonne : niveau_escalade (integer, default 0)
  - [ ] Index sur niveau_escalade

- [ ] Modification Modèle Evaluation (AC: 5)
  - [ ] Ajouter `niveau_escalade` dans $fillable
  - [ ] Méthode `incrementerEscalade()` : Incrémenter niveau

- [ ] Dashboard Admin Escalades (AC: 6)
  - [ ] Page `resources/js/Pages/Admin/Escalades/Index.tsx`
  - [ ] Liste escalades actives
  - [ ] Filtres : Niveau, région, statut
  - [ ] Statistiques : Total escalades, par niveau
  - [ ] Actions : Voir détails, Résoudre

- [ ] Composant CardEscalade (AC: 6)
  - [ ] Créer `resources/js/Components/Admin/CardEscalade.tsx`
  - [ ] Affichage : Niveau, évaluation, délai, responsable
  - [ ] Badge niveau avec couleurs SABC
  - [ ] Bouton action selon niveau

- [ ] EscaladesController (AC: 6)
  - [ ] Créer `app/Http/Controllers/Admin/EscaladesController.php`
  - [ ] Méthode `index()` : Liste escalades
  - [ ] Méthode `show()` : Détails escalade
  - [ ] Middleware `role:ADMIN`

- [ ] Enregistrement Scheduled Job (AC: 1)
  - [ ] Modifier `app/Console/Kernel.php`
  - [ ] Enregistrer ProcessusEscaladeAutomatique (quotidien 11:00)

- [ ] Tests & Validation
  - [ ] Tester détection escalades par niveau
  - [ ] Tester notifications selon niveau
  - [ ] Tester logging logs_administration
  - [ ] Tester dashboard admin escalades

## Dev Notes

### Architecture Processus Escalade

**Niveaux Escalade :**
1. **Niveau 1 (3 jours)** : Rappel évaluateur/manager direct
2. **Niveau 2 (7 jours)** : Notification manager N+1
3. **Niveau 3 (10 jours)** : Alerte DR région
4. **Niveau 4 (15 jours)** : Alerte Administrateur système

**Flux Escalade :**
1. Scheduled Job s'exécute quotidiennement à 11:00
2. Détection retards par niveau
3. Vérification niveau_escalade actuel
4. Envoi notification selon niveau
5. Incrément niveau_escalade
6. Logging dans logs_administration

**Règles Escalade :**
- Évaluations brouillon : Escalade évaluateur
- Évaluations soumises : Escalade manager
- Chaque niveau une seule fois
- Logging obligatoire chaque escalade

**Contenu Notifications :**
- Niveau 1 : "Rappel urgent : Évaluation en retard depuis 3 jours"
- Niveau 2 : "Escalade : Évaluation en retard depuis 7 jours - Action requise"
- Niveau 3 : "Alerte DR : Évaluation en retard depuis 10 jours"
- Niveau 4 : "Alerte Admin : Évaluation en retard depuis 15 jours - Intervention requise"

### Migration Colonne niveau_escalade

```php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class AddNiveauEscaladeToEvaluationsTable extends Migration
{
    public function up()
    {
        Schema::connection('pgsql')->table('evaluations', function (Blueprint $table) {
            $table->integer('niveau_escalade')->default(0)->after('rappels_envoyes');
            $table->timestamp('date_derniere_escalade')->nullable()->after('niveau_escalade');
            $table->index('niveau_escalade');
        });
    }
    
    public function down()
    {
        Schema::connection('pgsql')->table('evaluations', function (Blueprint $table) {
            $table->dropColumn(['niveau_escalade', 'date_derniere_escalade']);
        });
    }
}
```

### Scheduled Job ProcessusEscaladeAutomatique

```php
namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Services\EscaladeService;

class ProcessusEscaladeAutomatique extends Command
{
    protected $signature = 'escalades:processus';
    protected $description = 'Gérer le processus d\'escalade automatique des retards';
    
    protected $escaladeService;
    
    public function __construct(EscaladeService $escaladeService)
    {
        parent::__construct();
        $this->escaladeService = $escaladeService;
    }
    
    public function handle()
    {
        $this->info('Démarrage du processus d\'escalade automatique...');
        
        // Détecter et traiter les escalades
        $escalades = $this->escaladeService->detecterEscalades();
        
        $stats = [
            'niveau_1' => 0,
            'niveau_2' => 0,
            'niveau_3' => 0,
            'niveau_4' => 0,
        ];
        
        foreach ($escalades as $escalade) {
            $niveau = $escalade['niveau'];
            
            switch ($niveau) {
                case 1:
                    $this->escaladeService->escaladerNiveau1($escalade['evaluation']);
                    $stats['niveau_1']++;
                    break;
                case 2:
                    $this->escaladeService->escaladerNiveau2($escalade['evaluation']);
                    $stats['niveau_2']++;
                    break;
                case 3:
                    $this->escaladeService->escaladerNiveau3($escalade['evaluation']);
                    $stats['niveau_3']++;
                    break;
                case 4:
                    $this->escaladeService->escaladerNiveau4($escalade['evaluation']);
                    $stats['niveau_4']++;
                    break;
            }
        }
        
        $this->info("Escalades traitées :");
        $this->info("  - Niveau 1 (3j) : {$stats['niveau_1']}");
        $this->info("  - Niveau 2 (7j) : {$stats['niveau_2']}");
        $this->info("  - Niveau 3 (10j) : {$stats['niveau_3']}");
        $this->info("  - Niveau 4 (15j) : {$stats['niveau_4']}");
        
        return 0;
    }
}
```

### EscaladeService

```php
namespace App\Services;

use App\Models\Evaluation;
use App\Models\Utilisateur;
use App\Models\Notification;
use App\Services\AdminLogService;
use Carbon\Carbon;

class EscaladeService
{
    protected $logService;
    
    public function __construct(AdminLogService $logService)
    {
        $this->logService = $logService;
    }
    
    /**
     * Détecter les escalades nécessaires
     */
    public function detecterEscalades(): array
    {
        $today = Carbon::today();
        $escalades = [];
        
        // Récupérer évaluations en retard (brouillon ou soumises)
        $evaluations = Evaluation::with(['evaluateur', 'evalue', 'periode'])
            ->whereIn('statut', ['brouillon', 'soumis'])
            ->whereHas('periode', function($q) {
                $q->where('est_ouverte', true);
            })
            ->get();
        
        foreach ($evaluations as $evaluation) {
            $dateReference = $evaluation->statut === 'brouillon' 
                ? $evaluation->created_at 
                : $evaluation->date_soumission;
            
            $joursRetard = $today->diffInDays($dateReference);
            $niveauActuel = $evaluation->niveau_escalade;
            
            // Déterminer le niveau d'escalade nécessaire
            if ($joursRetard >= 15 && $niveauActuel < 4) {
                $escalades[] = ['evaluation' => $evaluation, 'niveau' => 4];
            } elseif ($joursRetard >= 10 && $niveauActuel < 3) {
                $escalades[] = ['evaluation' => $evaluation, 'niveau' => 3];
            } elseif ($joursRetard >= 7 && $niveauActuel < 2) {
                $escalades[] = ['evaluation' => $evaluation, 'niveau' => 2];
            } elseif ($joursRetard >= 3 && $niveauActuel < 1) {
                $escalades[] = ['evaluation' => $evaluation, 'niveau' => 1];
            }
        }
        
        return $escalades;
    }
    
    /**
     * Escalade Niveau 1 : Rappel évaluateur/manager (3 jours)
     */
    public function escaladerNiveau1(Evaluation $evaluation): void
    {
        $destinataire = $evaluation->statut === 'brouillon' 
            ? $evaluation->evaluateur 
            : $evaluation->evalue->manager;
        
        if (!$destinataire) return;
        
        Notification::create([
            'matricule_destinataire' => $destinataire->matricule,
            'type' => 'escalade_niveau_1',
            'titre' => 'Rappel urgent : Évaluation en retard',
            'message' => "Une évaluation de {$evaluation->evalue->nom_complet} est en retard depuis 3 jours. Merci de traiter cette évaluation rapidement.",
            'data_json' => [
                'id_evaluation' => $evaluation->id_evaluation,
                'niveau_escalade' => 1,
                'jours_retard' => $this->calculerJoursRetard($evaluation),
                'lien_action' => $this->getLienAction($evaluation),
            ],
            'lue' => false,
        ]);
        
        $this->incrementerEscalade($evaluation, 1);
        $this->loggerEscalade($evaluation, 1, $destinataire->matricule);
    }
    
    /**
     * Escalade Niveau 2 : Manager N+1 (7 jours)
     */
    public function escaladerNiveau2(Evaluation $evaluation): void
    {
        $responsable = $evaluation->statut === 'brouillon' 
            ? $evaluation->evaluateur->manager 
            : $evaluation->evalue->manager?->manager;
        
        if (!$responsable) {
            // Fallback : DR de la région
            $responsable = $this->getDRRegion($evaluation->evalue->id_region);
        }
        
        if (!$responsable) return;
        
        Notification::create([
            'matricule_destinataire' => $responsable->matricule,
            'type' => 'escalade_niveau_2',
            'titre' => 'Escalade : Évaluation en retard depuis 7 jours',
            'message' => "Une évaluation de {$evaluation->evalue->nom_complet} est en retard depuis 7 jours. Action requise de votre part.",
            'data_json' => [
                'id_evaluation' => $evaluation->id_evaluation,
                'niveau_escalade' => 2,
                'jours_retard' => $this->calculerJoursRetard($evaluation),
                'responsable_initial' => $evaluation->statut === 'brouillon' 
                    ? $evaluation->evaluateur->nom_complet 
                    : $evaluation->evalue->manager?->nom_complet,
            ],
            'lue' => false,
        ]);
        
        $this->incrementerEscalade($evaluation, 2);
        $this->loggerEscalade($evaluation, 2, $responsable->matricule);
    }
    
    /**
     * Escalade Niveau 3 : DR région (10 jours)
     */
    public function escaladerNiveau3(Evaluation $evaluation): void
    {
        $dr = $this->getDRRegion($evaluation->evalue->id_region);
        
        if (!$dr) return;
        
        Notification::create([
            'matricule_destinataire' => $dr->matricule,
            'type' => 'escalade_niveau_3',
            'titre' => 'Alerte DR : Évaluation en retard depuis 10 jours',
            'message' => "Une évaluation de {$evaluation->evalue->nom_complet} est en retard depuis 10 jours. Intervention urgente requise.",
            'data_json' => [
                'id_evaluation' => $evaluation->id_evaluation,
                'niveau_escalade' => 3,
                'jours_retard' => $this->calculerJoursRetard($evaluation),
                'region' => $evaluation->evalue->region_nom,
            ],
            'lue' => false,
        ]);
        
        $this->incrementerEscalade($evaluation, 3);
        $this->loggerEscalade($evaluation, 3, $dr->matricule);
    }
    
    /**
     * Escalade Niveau 4 : Administrateur (15 jours)
     */
    public function escaladerNiveau4(Evaluation $evaluation): void
    {
        // Récupérer tous les administrateurs
        $admins = Utilisateur::whereHas('role', function($q) {
            $q->where('nom_role', 'ADMIN');
        })->get();
        
        foreach ($admins as $admin) {
            Notification::create([
                'matricule_destinataire' => $admin->matricule,
                'type' => 'escalade_niveau_4',
                'titre' => 'Alerte Admin : Évaluation en retard depuis 15 jours',
                'message' => "Une évaluation de {$evaluation->evalue->nom_complet} est en retard depuis 15 jours. Intervention système requise.",
                'data_json' => [
                    'id_evaluation' => $evaluation->id_evaluation,
                    'niveau_escalade' => 4,
                    'jours_retard' => $this->calculerJoursRetard($evaluation),
                    'region' => $evaluation->evalue->region_nom,
                    'statut' => $evaluation->statut,
                ],
                'lue' => false,
            ]);
        }
        
        $this->incrementerEscalade($evaluation, 4);
        $this->loggerEscalade($evaluation, 4, 'ADMIN');
    }
    
    /**
     * Incrémenter le niveau d'escalade
     */
    protected function incrementerEscalade(Evaluation $evaluation, int $niveau): void
    {
        $evaluation->update([
            'niveau_escalade' => $niveau,
            'date_derniere_escalade' => now(),
        ]);
    }
    
    /**
     * Logger l'escalade
     */
    protected function loggerEscalade(Evaluation $evaluation, int $niveau, string $destinataire): void
    {
        $this->logService->logAction(
            'SYSTEM',
            'escalade_automatique',
            'succes',
            [
                'id_evaluation' => $evaluation->id_evaluation,
                'niveau_escalade' => $niveau,
                'destinataire' => $destinataire,
                'jours_retard' => $this->calculerJoursRetard($evaluation),
                'statut_evaluation' => $evaluation->statut,
            ]
        );
    }
    
    /**
     * Calculer les jours de retard
     */
    protected function calculerJoursRetard(Evaluation $evaluation): int
    {
        $dateReference = $evaluation->statut === 'brouillon' 
            ? $evaluation->created_at 
            : $evaluation->date_soumission;
        
        return Carbon::today()->diffInDays($dateReference);
    }
    
    /**
     * Obtenir le lien d'action
     */
    protected function getLienAction(Evaluation $evaluation): string
    {
        return $evaluation->statut === 'brouillon' 
            ? "/evaluations/{$evaluation->id_evaluation}/edit" 
            : "/manager/evaluations/en-attente";
    }
    
    /**
     * Récupérer le DR de la région
     */
    protected function getDRRegion(int $idRegion): ?Utilisateur
    {
        return Utilisateur::whereHas('role', function($q) {
            $q->where('nom_role', 'DR');
        })
        ->where('id_region', $idRegion)
        ->first();
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
        'rappels_envoyes',
        'niveau_escalade', // Nouvelle colonne
        'date_derniere_escalade', // Nouvelle colonne
    ];
    
    protected $casts = [
        'notations_json' => 'array',
        'commentaires_json' => 'array',
        'date_soumission' => 'datetime',
        'date_validation' => 'datetime',
        'date_derniere_escalade' => 'datetime',
    ];
}
```

### Dashboard Admin Escalades

```tsx
// resources/js/Pages/Admin/Escalades/Index.tsx
import { useState } from 'react';
import AdminLayout from '@/Layouts/AdminLayout';
import CardEscalade from '@/Components/Admin/CardEscalade';
import { AlertTriangle } from 'lucide-react';

interface Escalade {
    id_evaluation: string;
    niveau_escalade: number;
    jours_retard: number;
    evaluation: {
        evalue_nom: string;
        evaluateur_nom: string;
        statut: string;
        region_nom: string;
    };
}

interface Props {
    escalades: Escalade[];
    statistiques: {
        total: number;
        niveau_1: number;
        niveau_2: number;
        niveau_3: number;
        niveau_4: number;
    };
}

export default function Index({ escalades, statistiques }: Props) {
    return (
        <AdminLayout>
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <h1 className="text-2xl font-bold text-sabc-gray-900 font-poppins">
                        Escalades Automatiques
                    </h1>
                </div>
                
                {/* Statistiques */}
                <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                    <div className="bg-white border border-sabc-gray-200 rounded-lg p-4">
                        <div className="text-sm text-sabc-gray-600 mb-1">Total</div>
                        <div className="text-3xl font-bold text-sabc-gray-900">
                            {statistiques.total}
                        </div>
                    </div>
                    
                    <div className="bg-white border border-yellow-200 rounded-lg p-4">
                        <div className="text-sm text-sabc-gray-600 mb-1">Niveau 1 (3j)</div>
                        <div className="text-3xl font-bold text-yellow-600">
                            {statistiques.niveau_1}
                        </div>
                    </div>
                    
                    <div className="bg-white border border-orange-200 rounded-lg p-4">
                        <div className="text-sm text-sabc-gray-600 mb-1">Niveau 2 (7j)</div>
                        <div className="text-3xl font-bold text-orange-600">
                            {statistiques.niveau_2}
                        </div>
                    </div>
                    
                    <div className="bg-white border border-red-200 rounded-lg p-4">
                        <div className="text-sm text-sabc-gray-600 mb-1">Niveau 3 (10j)</div>
                        <div className="text-3xl font-bold text-red-600">
                            {statistiques.niveau_3}
                        </div>
                    </div>
                    
                    <div className="bg-white border border-sabc-error rounded-lg p-4">
                        <div className="text-sm text-sabc-gray-600 mb-1">Niveau 4 (15j)</div>
                        <div className="text-3xl font-bold text-sabc-error">
                            {statistiques.niveau_4}
                        </div>
                    </div>
                </div>
                
                {/* Liste escalades */}
                <div className="space-y-4">
                    {escalades.length === 0 ? (
                        <div className="bg-white border border-sabc-gray-200 rounded-lg p-8 text-center">
                            <AlertTriangle size={48} className="mx-auto text-sabc-gray-400 mb-4" />
                            <p className="text-sabc-gray-600">Aucune escalade active</p>
                        </div>
                    ) : (
                        escalades.map((escalade) => (
                            <CardEscalade key={escalade.id_evaluation} escalade={escalade} />
                        ))
                    )}
                </div>
            </div>
        </AdminLayout>
    );
}
```

### Project Structure Notes

**Fichiers à créer :**
- `app/Console/Commands/ProcessusEscaladeAutomatique.php`
- `app/Services/EscaladeService.php`
- `database/migrations/xxxx_add_niveau_escalade_to_evaluations_table.php`
- `app/Http/Controllers/Admin/EscaladesController.php`
- `resources/js/Pages/Admin/Escalades/Index.tsx`
- `resources/js/Components/Admin/CardEscalade.tsx`

**Fichiers à modifier :**
- `app/Console/Kernel.php` : Enregistrer scheduled job
- `app/Models/Evaluation.php` : Ajouter colonnes niveau_escalade, date_derniere_escalade

**Dépendances Stories Précédentes :**
- Story 4.1 : Table evaluations
- Story 5.1-5.3 : Infrastructure notifications
- Story 2.4 : AdminLogService

### Règles Métier SABC Critiques

**Niveaux Escalade :**
- Niveau 1 (3j) : Rappel responsable direct
- Niveau 2 (7j) : Manager N+1
- Niveau 3 (10j) : DR région
- Niveau 4 (15j) : Administrateur système

**Règles Application :**
- Chaque niveau une seule fois
- Logging obligatoire chaque escalade
- Dashboard admin pour suivi
- Notifications selon hiérarchie

**Horaire :**
- 11:00 : Processus escalade (après notifications managers 10:00)

**Logging :**
- Type action : 'escalade_automatique'
- Données : niveau, destinataire, jours_retard, statut
- Consultation dashboard admin

### References

- [Source: epics.md#Epic 5 Story 5.4] - Acceptance criteria complets
- [Source: architecture.md#Escalades] - Processus escalade
- [Source: business-logic-rules.md#Escalades] - Règles escalade
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
