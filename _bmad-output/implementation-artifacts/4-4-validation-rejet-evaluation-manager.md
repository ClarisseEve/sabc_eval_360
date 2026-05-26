# Story 4.4: Validation/Rejet d'Évaluation par Manager

Status: ready-for-dev

## Story

En tant que manager,
Je veux valider ou rejeter les évaluations soumises,
Afin de contrôler la qualité des évaluations.

## Acceptance Criteria

**Given** je suis manager et une évaluation est en statut "soumis"
**When** je consulte l'évaluation
**Then** je peux la valider : `statut = validé`, `date_validation` enregistrée
**And** je peux la rejeter avec motif obligatoire : `statut = rejeté`, `motif_rejet` sauvegardé
**And** si rejetée, l'évaluation repasse en "brouillon" et l'évaluateur est notifié
**And** si validée, l'évaluation est comptabilisée dans les scores
**And** seul le manager direct (`manager_matricule`) peut valider/rejeter
**And** DR et CDTT peuvent valider les évaluations de leur région (cross-branche)

## Tasks / Subtasks

- [ ] Service ValidationManagerService (AC: 1, 2, 3, 5, 6)
  - [ ] Créer `app/Services/ValidationManagerService.php`
  - [ ] Méthode `valider()` : Validation évaluation
  - [ ] Méthode `rejeter()` : Rejet avec motif obligatoire
  - [ ] Méthode `peutValider()` : Vérifier permissions manager
  - [ ] Méthode `verifierManagerDirect()` : Manager direct uniquement
  - [ ] Méthode `verifierDRCDTT()` : Privilèges cross-branche

- [ ] Interface Manager Évaluations en Attente (AC: 1, 5, 6)
  - [ ] Page `resources/js/Pages/Manager/EvaluationsEnAttente/Index.tsx`
  - [ ] Liste évaluations statut 'soumis'
  - [ ] Filtres : Par évaluateur, évalué, type, date
  - [ ] Boutons : Consulter, Valider, Rejeter
  - [ ] Compteurs : Total en attente, anciennes (>7 jours)

- [ ] Page Consultation Évaluation Manager (AC: 1, 2, 3)
  - [ ] Page `resources/js/Pages/Manager/EvaluationsEnAttente/Show.tsx`
  - [ ] Affichage complet évaluation (notes, commentaires)
  - [ ] Récapitulatif : Score moyen, progression
  - [ ] Boutons : Valider, Rejeter avec motif
  - [ ] Historique actions (si rejet précédent)

- [ ] Composant ModalRejetEvaluation (AC: 2, 3)
  - [ ] Créer `resources/js/Components/Manager/ModalRejetEvaluation.tsx`
  - [ ] Champ motif rejet (obligatoire, min 20 caractères)
  - [ ] Avertissement : Retour brouillon pour évaluateur
  - [ ] Boutons : Annuler, Confirmer rejet
  - [ ] Design SABC

- [ ] NotificationEvaluateurService (AC: 3)
  - [ ] Créer `app/Services/NotificationEvaluateurService.php`
  - [ ] Méthode `notifierValidation()` : Notification validation
  - [ ] Méthode `notifierRejet()` : Notification rejet avec motif
  - [ ] Contenu : Manager, évalué, motif rejet

- [ ] ManagerEvaluationsController (AC: 1, 2, 3, 5, 6)
  - [ ] Créer `app/Http/Controllers/Manager/ManagerEvaluationsController.php`
  - [ ] Méthode `index()` : Liste évaluations en attente
  - [ ] Méthode `show()` : Afficher évaluation détaillée
  - [ ] Méthode `valider()` : Valider évaluation
  - [ ] Méthode `rejeter()` : Rejeter avec motif
  - [ ] Middleware `auth:api` + vérification manager

- [ ] Modification Modèle Evaluation (AC: 1, 2, 3)
  - [ ] Méthode `valider()` : Transition soumis → valide
  - [ ] Méthode `rejeter()` : Transition soumis → rejete → brouillon
  - [ ] Méthode `peutEtreValidee()` : Vérification statut

- [ ] Tests & Validation
  - [ ] Tester validation par manager direct
  - [ ] Tester rejet avec motif obligatoire
  - [ ] Tester notification évaluateur
  - [ ] Tester privilèges DR/CDTT cross-branche
  - [ ] Tester blocage validation si pas manager

## Dev Notes

### Architecture Validation/Rejet Manager

**Flux Validation :**
1. Manager accède liste évaluations en attente
2. Consultation évaluation détaillée
3. Clic "Valider"
4. Vérification permissions (manager direct ou DR/CDTT)
5. Mise à jour : statut = 'valide', date_validation = now(), validateur_matricule
6. Notification évaluateur (succès)
7. Comptabilisation dans scores (Story 6.x)

**Flux Rejet :**
1. Manager accède liste évaluations en attente
2. Consultation évaluation détaillée
3. Clic "Rejeter"
4. Modal avec champ motif obligatoire
5. Vérification permissions (manager direct ou DR/CDTT)
6. Mise à jour : statut = 'rejete', motif_rejet, validateur_matricule
7. Transition automatique : rejete → brouillon
8. Notification évaluateur (rejet + motif)

**Permissions Validation :**
- **Manager direct** : Peut valider évaluations de ses subordonnés directs
- **DR** : Peut valider toutes évaluations de sa région (cross-branche)
- **CDTT** : Peut valider toutes évaluations de sa région (cross-branche)
- **Autres** : Pas de permissions validation

**Règles Métier :**
- Motif rejet : Obligatoire, minimum 20 caractères
- Statut rejete : Transition automatique vers brouillon
- Notification : Obligatoire pour validation et rejet
- Comptabilisation : Uniquement évaluations validées

### ValidationManagerService

```php
namespace App\Services;

use App\Models\Evaluation;
use App\Models\Utilisateur;
use App\Exceptions\PermissionValidationException;

class ValidationManagerService
{
    protected $notificationService;
    
    public function __construct(NotificationEvaluateurService $notificationService)
    {
        $this->notificationService = $notificationService;
    }
    
    /**
     * Valider une évaluation
     */
    public function valider(Evaluation $evaluation, Utilisateur $manager): Evaluation
    {
        // Vérifier que l'évaluation est en statut soumis
        if ($evaluation->statut !== 'soumis') {
            throw new \Exception(
                "Seules les évaluations soumises peuvent être validées. " .
                "Statut actuel : {$evaluation->statut}"
            );
        }
        
        // Vérifier permissions
        if (!$this->peutValider($evaluation, $manager)) {
            throw new PermissionValidationException(
                "Vous n'avez pas les permissions pour valider cette évaluation"
            );
        }
        
        // Valider
        $evaluation->update([
            'statut' => 'valide',
            'date_validation' => now(),
            'validateur_matricule' => $manager->matricule,
        ]);
        
        // Notifier évaluateur
        $this->notificationService->notifierValidation($evaluation);
        
        return $evaluation->fresh();
    }
    
    /**
     * Rejeter une évaluation
     */
    public function rejeter(
        Evaluation $evaluation,
        Utilisateur $manager,
        string $motifRejet
    ): Evaluation {
        // Vérifier que l'évaluation est en statut soumis
        if ($evaluation->statut !== 'soumis') {
            throw new \Exception(
                "Seules les évaluations soumises peuvent être rejetées. " .
                "Statut actuel : {$evaluation->statut}"
            );
        }
        
        // Vérifier permissions
        if (!$this->peutValider($evaluation, $manager)) {
            throw new PermissionValidationException(
                "Vous n'avez pas les permissions pour rejeter cette évaluation"
            );
        }
        
        // Valider motif
        if (strlen($motifRejet) < 20) {
            throw new \InvalidArgumentException(
                "Le motif de rejet doit contenir au minimum 20 caractères"
            );
        }
        
        // Rejeter
        $evaluation->update([
            'statut' => 'rejete',
            'motif_rejet' => $motifRejet,
            'validateur_matricule' => $manager->matricule,
        ]);
        
        // Transition automatique vers brouillon
        $evaluation->update(['statut' => 'brouillon']);
        
        // Notifier évaluateur
        $this->notificationService->notifierRejet($evaluation, $motifRejet);
        
        return $evaluation->fresh();
    }
    
    /**
     * Vérifier si un manager peut valider une évaluation
     */
    public function peutValider(Evaluation $evaluation, Utilisateur $manager): bool
    {
        // Vérifier manager direct
        if ($this->verifierManagerDirect($evaluation, $manager)) {
            return true;
        }
        
        // Vérifier DR/CDTT cross-branche
        if ($this->verifierDRCDTT($evaluation, $manager)) {
            return true;
        }
        
        return false;
    }
    
    /**
     * Vérifier manager direct
     */
    protected function verifierManagerDirect(Evaluation $evaluation, Utilisateur $manager): bool
    {
        // Le manager de l'évalué doit être le validateur
        return $evaluation->evalue->manager_matricule === $manager->matricule;
    }
    
    /**
     * Vérifier privilèges DR/CDTT
     */
    protected function verifierDRCDTT(Evaluation $evaluation, Utilisateur $manager): bool
    {
        // Vérifier rôle DR ou CDTT
        if (!in_array($manager->role->nom_role, ['DR', 'CDTT'])) {
            return false;
        }
        
        // Vérifier même région
        if ($evaluation->evalue->id_region !== $manager->id_region) {
            return false;
        }
        
        // DR et CDTT peuvent valider toutes évaluations de leur région
        return true;
    }
}
```

### NotificationEvaluateurService

```php
namespace App\Services;

use App\Models\Evaluation;
use App\Models\Notification;

class NotificationEvaluateurService
{
    /**
     * Notifier l'évaluateur d'une validation
     */
    public function notifierValidation(Evaluation $evaluation): void
    {
        Notification::create([
            'matricule_destinataire' => $evaluation->evaluateur_matricule,
            'type' => 'validation_evaluation',
            'titre' => 'Évaluation validée',
            'message' => "Votre évaluation de {$evaluation->evalue->nom_complet} " .
                        "a été validée par {$evaluation->validateur->nom_complet}.",
            'data_json' => [
                'id_evaluation' => $evaluation->id_evaluation,
                'evalue_matricule' => $evaluation->evalue_matricule,
                'evalue_nom' => $evaluation->evalue->nom_complet,
                'validateur_matricule' => $evaluation->validateur_matricule,
                'validateur_nom' => $evaluation->validateur->nom_complet,
                'date_validation' => $evaluation->date_validation->format('Y-m-d H:i'),
            ],
            'lue' => false,
        ]);
    }
    
    /**
     * Notifier l'évaluateur d'un rejet
     */
    public function notifierRejet(Evaluation $evaluation, string $motifRejet): void
    {
        Notification::create([
            'matricule_destinataire' => $evaluation->evaluateur_matricule,
            'type' => 'rejet_evaluation',
            'titre' => 'Évaluation rejetée',
            'message' => "Votre évaluation de {$evaluation->evalue->nom_complet} " .
                        "a été rejetée par {$evaluation->validateur->nom_complet}. " .
                        "Motif : {$motifRejet}",
            'data_json' => [
                'id_evaluation' => $evaluation->id_evaluation,
                'evalue_matricule' => $evaluation->evalue_matricule,
                'evalue_nom' => $evaluation->evalue->nom_complet,
                'validateur_matricule' => $evaluation->validateur_matricule,
                'validateur_nom' => $evaluation->validateur->nom_complet,
                'motif_rejet' => $motifRejet,
            ],
            'lue' => false,
        ]);
    }
}
```

### ManagerEvaluationsController

```php
namespace App\Http\Controllers\Manager;

use App\Models\Evaluation;
use App\Services\ValidationManagerService;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response as InertiaResponse;

class ManagerEvaluationsController extends Controller
{
    protected $validationService;
    
    public function __construct(ValidationManagerService $validationService)
    {
        $this->middleware('auth:api');
        $this->validationService = $validationService;
    }
    
    public function index(): InertiaResponse
    {
        $manager = auth()->user();
        
        // Récupérer évaluations en attente
        $evaluations = Evaluation::with(['evaluateur', 'evalue', 'periode'])
            ->where('statut', 'soumis')
            ->where(function($query) use ($manager) {
                // Manager direct
                $query->whereHas('evalue', function($q) use ($manager) {
                    $q->where('manager_matricule', $manager->matricule);
                });
                
                // Ou DR/CDTT de la région
                if (in_array($manager->role->nom_role, ['DR', 'CDTT'])) {
                    $query->orWhereHas('evalue', function($q) use ($manager) {
                        $q->where('id_region', $manager->id_region);
                    });
                }
            })
            ->orderBy('date_soumission', 'asc')
            ->get();
        
        return Inertia::render('Manager/EvaluationsEnAttente/Index', [
            'evaluations' => $evaluations->map(function($eval) {
                return [
                    'id_evaluation' => $eval->id_evaluation,
                    'evaluateur' => [
                        'matricule' => $eval->evaluateur->matricule,
                        'nom_complet' => $eval->evaluateur->nom_complet,
                        'role_nom' => $eval->evaluateur->role->nom_role,
                    ],
                    'evalue' => [
                        'matricule' => $eval->evalue->matricule,
                        'nom_complet' => $eval->evalue->nom_complet,
                        'role_nom' => $eval->evalue->role->nom_role,
                    ],
                    'type_evaluation' => $eval->type_evaluation,
                    'periode_nom' => $eval->periode->nom_periode,
                    'date_soumission' => $eval->date_soumission->format('d/m/Y'),
                    'jours_attente' => $eval->date_soumission->diffInDays(now()),
                ];
            }),
            'statistiques' => [
                'total_en_attente' => $evaluations->count(),
                'anciennes' => $evaluations->filter(fn($e) => $e->date_soumission->diffInDays(now()) > 7)->count(),
            ],
        ]);
    }
    
    public function show(string $id): InertiaResponse
    {
        $manager = auth()->user();
        $evaluation = Evaluation::with([
            'evaluateur',
            'evalue',
            'periode',
            'template.regleEvaluation'
        ])->findOrFail($id);
        
        // Vérifier permissions
        if (!$this->validationService->peutValider($evaluation, $manager)) {
            abort(403, 'Vous n\'avez pas les permissions pour consulter cette évaluation');
        }
        
        return Inertia::render('Manager/EvaluationsEnAttente/Show', [
            'evaluation' => [
                'id_evaluation' => $evaluation->id_evaluation,
                'evaluateur' => [
                    'matricule' => $evaluation->evaluateur->matricule,
                    'nom_complet' => $evaluation->evaluateur->nom_complet,
                    'role_nom' => $evaluation->evaluateur->role->nom_role,
                ],
                'evalue' => [
                    'matricule' => $evaluation->evalue->matricule,
                    'nom_complet' => $evaluation->evalue->nom_complet,
                    'role_nom' => $evaluation->evalue->role->nom_role,
                ],
                'type_evaluation' => $evaluation->type_evaluation,
                'periode_nom' => $evaluation->periode->nom_periode,
                'date_soumission' => $evaluation->date_soumission->format('d/m/Y H:i'),
                'notations' => $evaluation->notations_json ?? [],
                'commentaires' => $evaluation->commentaires_json ?? [],
                'score_global' => $evaluation->score_global,
            ],
            'criteres' => $evaluation->template->regleEvaluation->criteres,
        ]);
    }
    
    public function valider(string $id)
    {
        $manager = auth()->user();
        $evaluation = Evaluation::findOrFail($id);
        
        try {
            $evaluation = $this->validationService->valider($evaluation, $manager);
            
            return response()->json([
                'success' => true,
                'message' => 'Évaluation validée avec succès',
            ]);
            
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 422);
        }
    }
    
    public function rejeter(Request $request, string $id)
    {
        $validated = $request->validate([
            'motif_rejet' => 'required|string|min:20|max:1000',
        ]);
        
        $manager = auth()->user();
        $evaluation = Evaluation::findOrFail($id);
        
        try {
            $evaluation = $this->validationService->rejeter(
                $evaluation,
                $manager,
                $validated['motif_rejet']
            );
            
            return response()->json([
                'success' => true,
                'message' => 'Évaluation rejetée avec succès',
            ]);
            
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 422);
        }
    }
}
```

### Modification Modèle Evaluation

```php
namespace App\Models;

class Evaluation extends Model
{
    // ... code existant ...
    
    /**
     * Valider l'évaluation
     */
    public function valider(string $validateurMatricule): bool
    {
        if ($this->statut !== 'soumis') {
            throw new \Exception("Seules les évaluations soumises peuvent être validées");
        }
        
        return $this->update([
            'statut' => 'valide',
            'date_validation' => now(),
            'validateur_matricule' => $validateurMatricule,
        ]);
    }
    
    /**
     * Rejeter l'évaluation
     */
    public function rejeter(string $validateurMatricule, string $motifRejet): bool
    {
        if ($this->statut !== 'soumis') {
            throw new \Exception("Seules les évaluations soumises peuvent être rejetées");
        }
        
        // Rejeter puis repasser en brouillon
        $this->update([
            'statut' => 'rejete',
            'motif_rejet' => $motifRejet,
            'validateur_matricule' => $validateurMatricule,
        ]);
        
        // Transition automatique vers brouillon
        return $this->update(['statut' => 'brouillon']);
    }
    
    /**
     * Vérifier si l'évaluation peut être validée
     */
    public function peutEtreValidee(): bool
    {
        return $this->statut === 'soumis';
    }
}
```

### Composant ModalRejetEvaluation

```tsx
// resources/js/Components/Manager/ModalRejetEvaluation.tsx
import { useState } from 'react';
import { AlertTriangle, XCircle } from 'lucide-react';
import { Button } from '@/Components/UI/Button';

interface ModalRejetEvaluationProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (motif: string) => void;
    evaluation: {
        evaluateur_nom: string;
        evalue_nom: string;
    };
}

export default function ModalRejetEvaluation({
    isOpen,
    onClose,
    onConfirm,
    evaluation
}: ModalRejetEvaluationProps) {
    const [motif, setMotif] = useState('');
    const [error, setError] = useState('');
    
    if (!isOpen) return null;
    
    const handleConfirm = () => {
        if (motif.length < 20) {
            setError('Le motif doit contenir au minimum 20 caractères');
            return;
        }
        
        onConfirm(motif);
        setMotif('');
        setError('');
    };
    
    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-lg w-full mx-4">
                <div className="flex items-center space-x-3 mb-4">
                    <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
                        <XCircle size={24} className="text-sabc-error" />
                    </div>
                    <h3 className="text-xl font-semibold text-sabc-gray-900 font-poppins">
                        Rejeter l'évaluation
                    </h3>
                </div>
                
                <div className="space-y-4 mb-6">
                    <p className="text-sabc-gray-800">
                        Vous êtes sur le point de rejeter l'évaluation de{' '}
                        <span className="font-semibold">{evaluation.evalue_nom}</span>
                        {' '}par{' '}
                        <span className="font-semibold">{evaluation.evaluateur_nom}</span>.
                    </p>
                    
                    <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg">
                        <div className="flex items-start space-x-2">
                            <AlertTriangle size={20} className="text-yellow-600 mt-0.5" />
                            <div className="text-sm text-yellow-800">
                                <p className="font-semibold mb-1">Attention</p>
                                <p>
                                    L'évaluation repassera en brouillon et l'évaluateur sera notifié.
                                    Il pourra la modifier et la soumettre à nouveau.
                                </p>
                            </div>
                        </div>
                    </div>
                    
                    <div>
                        <label className="block text-sm font-medium text-sabc-gray-800 mb-2">
                            Motif du rejet * (minimum 20 caractères)
                        </label>
                        <textarea
                            value={motif}
                            onChange={(e) => {
                                setMotif(e.target.value);
                                setError('');
                            }}
                            placeholder="Expliquez pourquoi vous rejetez cette évaluation..."
                            className={`w-full border rounded-lg p-3 ${
                                error ? 'border-sabc-error' : 'border-sabc-gray-200'
                            }`}
                            rows={4}
                            maxLength={1000}
                        />
                        <div className="flex justify-between items-center mt-1">
                            <span className="text-xs text-sabc-gray-600">
                                {motif.length}/1000 caractères
                            </span>
                            {error && (
                                <span className="text-xs text-sabc-error">{error}</span>
                            )}
                        </div>
                    </div>
                </div>
                
                <div className="flex space-x-3">
                    <Button
                        type="button"
                        onClick={onClose}
                        variant="secondary"
                        className="flex-1"
                    >
                        Annuler
                    </Button>
                    <Button
                        type="button"
                        onClick={handleConfirm}
                        className="flex-1 bg-sabc-error hover:bg-red-700"
                        disabled={motif.length < 20}
                    >
                        <XCircle size={16} className="mr-2" />
                        Confirmer le rejet
                    </Button>
                </div>
            </div>
        </div>
    );
}
```

### Project Structure Notes

**Fichiers à créer :**
- `app/Services/ValidationManagerService.php`
- `app/Services/NotificationEvaluateurService.php`
- `app/Exceptions/PermissionValidationException.php`
- `app/Http/Controllers/Manager/ManagerEvaluationsController.php`
- `resources/js/Pages/Manager/EvaluationsEnAttente/Index.tsx`
- `resources/js/Pages/Manager/EvaluationsEnAttente/Show.tsx`
- `resources/js/Components/Manager/ModalRejetEvaluation.tsx`

**Fichiers à modifier :**
- `app/Models/Evaluation.php` : Ajouter méthodes valider(), rejeter()
- `routes/web.php` : Ajouter routes manager évaluations

**Dépendances Stories Précédentes :**
- Story 4.3 : Évaluations soumises
- Story 1.1 : Table notifications
- Story 2.3 : Privilèges DR/CDTT

### Règles Métier SABC Critiques

**Permissions Validation :**
- Manager direct : Évaluations de ses subordonnés directs uniquement
- DR : Toutes évaluations de sa région (cross-branche)
- CDTT : Toutes évaluations de sa région (cross-branche)

**Motif Rejet :**
- Obligatoire : Minimum 20 caractères
- Maximum : 1000 caractères
- Contenu : Explication claire pour l'évaluateur

**Transitions Statut :**
- soumis → valide : Validation manager
- soumis → rejete → brouillon : Rejet manager (automatique)
- brouillon : Modifiable par évaluateur

**Notifications :**
- Validation : Notification évaluateur (succès)
- Rejet : Notification évaluateur (motif inclus)

**Comptabilisation :**
- Statut 'valide' : Comptabilisé dans scores (Story 6.x)
- Statut 'brouillon', 'soumis', 'rejete' : Non comptabilisé

### References

- [Source: epics.md#Epic 4 Story 4.4] - Acceptance criteria complets
- [Source: architecture.md#Workflow States] - Transitions statuts
- [Source: business-logic-rules.md#Validation Manager] - Permissions validation
- [Source: project-context.md#Critical Implementation Rules] - Notifications

## Dev Agent Record

### Agent Model Used

_À remplir par le dev agent_

### Debug Log References

_À remplir par le dev agent_

### Completion Notes List

_À remplir par le dev agent_

### File List

_À remplir par le dev agent_
