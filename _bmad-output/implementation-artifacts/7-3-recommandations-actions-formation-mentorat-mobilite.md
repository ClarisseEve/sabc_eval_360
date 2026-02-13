# Story 7.3: Recommandations d'Actions (Formation/Mentorat/Mobilité)

Status: ready-for-dev

## Story

En tant que système,
Je veux proposer des recommandations d'actions basées sur les données,
Afin d'aider les admins dans leurs décisions.

## Acceptance Criteria

**Given** les scores et anomalies sont analysés
**When** le système génère des recommandations
**Then** des formations sont recommandées si critères < 3/5 sur un axe de compétence
**And** du mentorat est recommandé en matchant experts (score élevé) et apprenants (score faible) dans même région
**And** de la mobilité est recommandée pour talents avec forte progression et score global élevé
**And** les recommandations sont sauvegardées dans `recommandations` avec type, priorité, utilisateur concerné
**And** les admins peuvent consulter et valider les recommandations
**And** les recommandations validées génèrent des plans de développement

## Tasks / Subtasks

- [ ] Table recommandations (AC: 4)
- [ ] Scheduled Job GenerationRecommandations (AC: 1, 2, 3, 4)
- [ ] Service RecommandationsService (AC: 1, 2, 3, 4)
- [ ] Modèle Recommandation (AC: 4)
- [ ] Page Admin Recommandations (AC: 5, 6)
- [ ] RecommandationsController (AC: 5, 6)
- [ ] Tests & Validation

## Dev Notes

### Architecture Recommandations

**Types Recommandations :**
1. **Formation** : Critères < 3/5 sur axe compétence
2. **Mentorat** : Matching experts/apprenants même région
3. **Mobilité** : Talents forte progression + score élevé

**Flux Génération :**
1. Scheduled Job quotidien à 03:00
2. Analyse scores et anomalies
3. Génération recommandations par type
4. Sauvegarde table recommandations
5. Consultation admin dashboard
6. Validation admin → Plans développement

### Migration Table recommandations

```php
Schema::connection('pgsql')->create('recommandations', function (Blueprint $table) {
    $table->uuid('id_recommandation')->primary();
    $table->enum('type', ['formation', 'mentorat', 'mobilite']);
    $table->enum('priorite', ['faible', 'moyenne', 'elevee']);
    $table->string('matricule_concerne', 5);
    $table->jsonb('data_json');
    $table->enum('statut', ['en_attente', 'validee', 'rejetee'])->default('en_attente');
    $table->timestamp('date_generation');
    $table->timestamp('date_validation')->nullable();
    $table->string('validateur_matricule', 5)->nullable();
    $table->timestamps();
});
```

### RecommandationsService

```php
namespace App\Services;

use App\Models\Evaluation;
use App\Models\Utilisateur;
use App\Models\Recommandation;

class RecommandationsService
{
    public function genererRecommandationsFormation(): array
    {
        $recommandations = [];
        
        $evaluations = Evaluation::where('statut', 'valide')
            ->whereNotNull('notations_json')
            ->get();
        
        foreach ($evaluations as $evaluation) {
            $notations = $evaluation->notations_json;
            
            foreach ($notations as $critere => $notation) {
                if ($notation['note'] < 3) {
                    $recommandations[] = $this->creerRecommandation(
                        'formation',
                        'elevee',
                        $evaluation->evalue_matricule,
                        [
                            'critere' => $critere,
                            'note' => $notation['note'],
                            'formation_suggeree' => $this->suggererFormation($critere),
                        ]
                    );
                }
            }
        }
        
        return $recommandations;
    }
    
    public function genererRecommandationsMentorat(): array
    {
        $recommandations = [];
        $regions = Region::all();
        
        foreach ($regions as $region) {
            $experts = Utilisateur::where('id_region', $region->id_region)
                ->whereHas('evaluationsRecues', function($q) {
                    $q->where('statut', 'valide')
                      ->havingRaw('AVG(score_global) > 4');
                })
                ->get();
            
            $apprenants = Utilisateur::where('id_region', $region->id_region)
                ->whereHas('evaluationsRecues', function($q) {
                    $q->where('statut', 'valide')
                      ->havingRaw('AVG(score_global) < 3');
                })
                ->get();
            
            foreach ($apprenants as $apprenant) {
                if ($experts->isNotEmpty()) {
                    $expert = $experts->random();
                    
                    $recommandations[] = $this->creerRecommandation(
                        'mentorat',
                        'moyenne',
                        $apprenant->matricule,
                        [
                            'mentor_matricule' => $expert->matricule,
                            'mentor_nom' => $expert->nom_complet,
                            'region' => $region->nom_region,
                        ]
                    );
                }
            }
        }
        
        return $recommandations;
    }
    
    public function genererRecommandationsMobilite(): array
    {
        $recommandations = [];
        
        $talents = Utilisateur::whereHas('evaluationsRecues', function($q) {
            $q->where('statut', 'valide')
              ->havingRaw('AVG(score_global) > 4');
        })
        ->get();
        
        foreach ($talents as $talent) {
            $progression = $this->calculerProgression($talent);
            
            if ($progression > 0.5) {
                $recommandations[] = $this->creerRecommandation(
                    'mobilite',
                    'elevee',
                    $talent->matricule,
                    [
                        'score_global' => $this->getScoreGlobal($talent),
                        'progression' => $progression,
                        'postes_suggeres' => $this->suggererPostes($talent),
                    ]
                );
            }
        }
        
        return $recommandations;
    }
    
    protected function creerRecommandation(string $type, string $priorite, string $matricule, array $data): array
    {
        $recommandation = Recommandation::create([
            'id_recommandation' => Str::uuid(),
            'type' => $type,
            'priorite' => $priorite,
            'matricule_concerne' => $matricule,
            'data_json' => $data,
            'date_generation' => now(),
        ]);
        
        return $recommandation->toArray();
    }
}
```

### References

- [Source: epics.md#Epic 7 Story 7.3]
- [Source: business-logic-rules.md#Recommandations]

## Dev Agent Record

### Agent Model Used

_À remplir par le dev agent_

### File List

_À remplir par le dev agent_
