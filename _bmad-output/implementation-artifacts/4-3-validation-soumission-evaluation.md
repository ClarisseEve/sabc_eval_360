# Story 4.3: Validation et Soumission d'Évaluation

Status: done

## Story

En tant qu'évaluateur,
Je veux soumettre mon évaluation complétée,
Afin qu'elle soit validée par le manager.

## Acceptance Criteria

**Given** j'ai complété tous les critères d'évaluation
**When** je clique sur "Soumettre"
**Then** le système valide la complétude : tous les critères notés, commentaires si note < 3
**And** le système valide les bornes : toutes les notes entre 1 et 5
**And** le `statut` passe de "brouillon" à "soumis"
**And** la `date_soumission` est enregistrée
**And** une notification est envoyée au manager pour validation
**And** l'évaluateur ne peut plus modifier l'évaluation soumise
**And** un message de confirmation est affiché

## Tasks / Subtasks

- [ ] Service ValidationSoumissionService (AC: 1, 2, 3, 4)
  - [ ] Créer `app/Services/ValidationSoumissionService.php`
  - [ ] Méthode `validerCompletude()` : Vérifier tous critères notés
  - [ ] Méthode `validerCommentairesObligatoires()` : Vérifier commentaires si note < 3
  - [ ] Méthode `validerBornesNotes()` : Vérifier notes entre 1-5
  - [ ] Méthode `soumettre()` : Soumission complète avec validation
  - [ ] Exceptions personnalisées avec messages explicites

- [ ] Interface Bouton Soumission (AC: 1, 5, 7)
  - [ ] Modifier `resources/js/Pages/Evaluations/Edit.tsx`
  - [ ] Bouton "Soumettre l'évaluation" (désactivé si incomplet)
  - [ ] Modal confirmation avant soumission
  - [ ] Affichage erreurs validation
  - [ ] Message succès après soumission
  - [ ] Redirection vers liste évaluations

- [ ] Composant ModalConfirmationSoumission (AC: 7)
  - [ ] Créer `resources/js/Components/Evaluations/ModalConfirmationSoumission.tsx`
  - [ ] Récapitulatif évaluation (évalué, nb critères, score moyen)
  - [ ] Avertissement : "Vous ne pourrez plus modifier après soumission"
  - [ ] Boutons : Annuler, Confirmer soumission
  - [ ] Design SABC

- [ ] NotificationManagerService (AC: 5)
  - [ ] Créer `app/Services/NotificationManagerService.php`
  - [ ] Méthode `notifierSoumissionEvaluation()` : Notification manager
  - [ ] Récupération manager de l'évalué
  - [ ] Création notification dans table notifications
  - [ ] Contenu : Évaluateur, évalué, type évaluation

- [ ] EvaluationsController Méthode Submit (AC: 1, 2, 3, 4, 5, 6)
  - [ ] Méthode `submit()` : Soumettre évaluation
  - [ ] Validation complétude via ValidationSoumissionService
  - [ ] Mise à jour statut + date_soumission
  - [ ] Envoi notification manager
  - [ ] Retour JSON succès ou erreurs

- [ ] Modification Modèle Evaluation (AC: 6)
  - [ ] Méthode `soumettre()` : Transition brouillon → soumis
  - [ ] Méthode `peutEtreSoumise()` : Vérification complétude
  - [ ] Méthode `estModifiable()` : Bloquer modification si soumis

- [ ] Tests & Validation
  - [ ] Tester validation complétude (tous critères notés)
  - [ ] Tester validation commentaires obligatoires
  - [ ] Tester validation bornes notes
  - [ ] Tester blocage soumission si incomplet
  - [ ] Tester notification manager
  - [ ] Tester blocage modification après soumission

## Dev Notes

### Architecture Validation et Soumission

**Flux Soumission :**
1. Utilisateur clique "Soumettre"
2. Modal confirmation affichée
3. Confirmation → Validation complétude
4. Validation bornes notes
5. Validation commentaires obligatoires
6. Mise à jour : statut = 'soumis', date_soumission = now()
7. Notification manager
8. Message succès + redirection

**Validations Obligatoires :**
- **Complétude** : Tous les critères notés
- **Bornes** : Toutes les notes entre 1 et 5
- **Commentaires** : Obligatoires si note < 3
- **Période** : Période toujours ouverte

**Règles Blocage :**
- Statut 'soumis' : Modification bloquée
- Statut 'valide' : Modification bloquée
- Statut 'rejete' : Modification autorisée (retour brouillon)

### ValidationSoumissionService

```php
namespace App\Services;

use App\Models\Evaluation;
use App\Exceptions\EvaluationIncompletException;
use App\Exceptions\CommentaireManquantException;
use App\Exceptions\NoteInvalideException;

class ValidationSoumissionService
{
    /**
     * Valider la complétude d'une évaluation
     */
    public function validerCompletude(Evaluation $evaluation): void
    {
        $criteres = $evaluation->template->regleEvaluation->criteres;
        $notations = $evaluation->notations_json ?? [];
        
        $criteresManquants = [];
        
        foreach ($criteres as $critere) {
            if (!isset($notations[$critere['id']])) {
                $criteresManquants[] = $critere['nom'];
            }
        }
        
        if (!empty($criteresManquants)) {
            throw new EvaluationIncompletException(
                "L'évaluation est incomplète. Critères manquants : " . 
                implode(', ', $criteresManquants)
            );
        }
    }
    
    /**
     * Valider les commentaires obligatoires
     */
    public function validerCommentairesObligatoires(Evaluation $evaluation): void
    {
        $notations = $evaluation->notations_json ?? [];
        $criteresManquants = [];
        
        foreach ($notations as $critereId => $notation) {
            $note = $notation['note'] ?? null;
            $commentaire = $notation['commentaire'] ?? null;
            
            if ($note < 3 && empty($commentaire)) {
                // Récupérer le nom du critère
                $critere = collect($evaluation->template->regleEvaluation->criteres)
                    ->firstWhere('id', $critereId);
                
                $criteresManquants[] = $critere['nom'] ?? $critereId;
            }
        }
        
        if (!empty($criteresManquants)) {
            throw new CommentaireManquantException(
                "Des commentaires sont obligatoires pour les notes inférieures à 3. " .
                "Critères concernés : " . implode(', ', $criteresManquants)
            );
        }
    }
    
    /**
     * Valider les bornes des notes
     */
    public function validerBornesNotes(Evaluation $evaluation): void
    {
        $notations = $evaluation->notations_json ?? [];
        $notesInvalides = [];
        
        foreach ($notations as $critereId => $notation) {
            $note = $notation['note'] ?? null;
            
            if ($note < 1 || $note > 5) {
                $critere = collect($evaluation->template->regleEvaluation->criteres)
                    ->firstWhere('id', $critereId);
                
                $notesInvalides[] = [
                    'critere' => $critere['nom'] ?? $critereId,
                    'note' => $note,
                ];
            }
        }
        
        if (!empty($notesInvalides)) {
            $details = collect($notesInvalides)
                ->map(fn($item) => "{$item['critere']} (note: {$item['note']})")
                ->implode(', ');
            
            throw new NoteInvalideException(
                "Certaines notes sont invalides (doivent être entre 1 et 5). " .
                "Critères concernés : {$details}"
            );
        }
    }
    
    /**
     * Soumettre une évaluation
     */
    public function soumettre(Evaluation $evaluation): Evaluation
    {
        // Vérifier que l'évaluation est en brouillon
        if ($evaluation->statut !== 'brouillon') {
            throw new \Exception(
                "Seules les évaluations en brouillon peuvent être soumises. " .
                "Statut actuel : {$evaluation->statut}"
            );
        }
        
        // Vérifier que la période est ouverte
        if (!$evaluation->periode->est_ouverte) {
            throw new \Exception(
                "La période d'évaluation '{$evaluation->periode->nom_periode}' est fermée. " .
                "Vous ne pouvez plus soumettre d'évaluations."
            );
        }
        
        // Validations
        $this->validerCompletude($evaluation);
        $this->validerCommentairesObligatoires($evaluation);
        $this->validerBornesNotes($evaluation);
        
        // Soumettre
        $evaluation->update([
            'statut' => 'soumis',
            'date_soumission' => now(),
        ]);
        
        return $evaluation->fresh();
    }
}
```

### NotificationManagerService

```php
namespace App\Services;

use App\Models\Evaluation;
use App\Models\Notification;

class NotificationManagerService
{
    /**
     * Notifier le manager d'une soumission d'évaluation
     */
    public function notifierSoumissionEvaluation(Evaluation $evaluation): void
    {
        // Récupérer le manager de l'évalué
        $manager = $evaluation->evalue->manager;
        
        if (!$manager) {
            // Si pas de manager, notifier le DR de la région
            $manager = $this->getDirecteurRegional($evaluation->evalue->id_region);
        }
        
        if (!$manager) {
            \Log::warning("Aucun manager trouvé pour notifier la soumission de l'évaluation {$evaluation->id_evaluation}");
            return;
        }
        
        // Créer notification
        Notification::create([
            'matricule_destinataire' => $manager->matricule,
            'type' => 'soumission_evaluation',
            'titre' => 'Nouvelle évaluation à valider',
            'message' => "Une évaluation de {$evaluation->evalue->nom_complet} " .
                        "par {$evaluation->evaluateur->nom_complet} " .
                        "a été soumise et nécessite votre validation.",
            'data_json' => [
                'id_evaluation' => $evaluation->id_evaluation,
                'evaluateur_matricule' => $evaluation->evaluateur_matricule,
                'evaluateur_nom' => $evaluation->evaluateur->nom_complet,
                'evalue_matricule' => $evaluation->evalue_matricule,
                'evalue_nom' => $evaluation->evalue->nom_complet,
                'type_evaluation' => $evaluation->type_evaluation,
                'periode_nom' => $evaluation->periode->nom_periode,
            ],
            'lue' => false,
        ]);
    }
    
    /**
     * Récupérer le directeur régional
     */
    protected function getDirecteurRegional(int $idRegion): ?\App\Models\Utilisateur
    {
        return \App\Models\Utilisateur::whereHas('role', function($q) {
            $q->where('nom_role', 'DR');
        })
        ->where('id_region', $idRegion)
        ->first();
    }
}
```

### EvaluationsController (Submit)

```php
namespace App\Http\Controllers;

use App\Models\Evaluation;
use App\Services\ValidationSoumissionService;
use App\Services\NotificationManagerService;
use Illuminate\Http\Request;

class EvaluationsController extends Controller
{
    protected $validationService;
    protected $notificationService;
    
    public function __construct(
        ValidationSoumissionService $validationService,
        NotificationManagerService $notificationService
    ) {
        $this->middleware('auth:api');
        $this->validationService = $validationService;
        $this->notificationService = $notificationService;
    }
    
    public function submit(string $id)
    {
        $evaluation = Evaluation::with([
            'evaluateur',
            'evalue',
            'periode',
            'template.regleEvaluation'
        ])->findOrFail($id);
        
        // Vérifier que l'utilisateur est l'évaluateur
        if ($evaluation->evaluateur_matricule !== auth()->user()->matricule) {
            abort(403, 'Vous n\'êtes pas autorisé à soumettre cette évaluation');
        }
        
        try {
            // Soumettre l'évaluation
            $evaluation = $this->validationService->soumettre($evaluation);
            
            // Envoyer notification au manager
            $this->notificationService->notifierSoumissionEvaluation($evaluation);
            
            return response()->json([
                'success' => true,
                'message' => 'Évaluation soumise avec succès. Votre manager sera notifié pour validation.',
                'evaluation' => [
                    'id_evaluation' => $evaluation->id_evaluation,
                    'statut' => $evaluation->statut,
                    'date_soumission' => $evaluation->date_soumission->format('d/m/Y H:i'),
                ],
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
     * Soumettre l'évaluation
     */
    public function soumettre(): bool
    {
        if ($this->statut !== 'brouillon') {
            throw new \Exception("Seules les évaluations en brouillon peuvent être soumises");
        }
        
        return $this->update([
            'statut' => 'soumis',
            'date_soumission' => now(),
        ]);
    }
    
    /**
     * Vérifier si l'évaluation peut être soumise
     */
    public function peutEtreSoumise(): bool
    {
        if ($this->statut !== 'brouillon') {
            return false;
        }
        
        // Vérifier que tous les critères sont notés
        $criteres = $this->template->regleEvaluation->criteres;
        $notations = $this->notations_json ?? [];
        
        foreach ($criteres as $critere) {
            if (!isset($notations[$critere['id']])) {
                return false;
            }
        }
        
        // Vérifier commentaires obligatoires
        foreach ($notations as $critereId => $notation) {
            $note = $notation['note'] ?? null;
            $commentaire = $notation['commentaire'] ?? null;
            
            if ($note < 3 && empty($commentaire)) {
                return false;
            }
        }
        
        return true;
    }
    
    /**
     * Vérifier si l'évaluation est modifiable
     */
    public function estModifiable(): bool
    {
        return in_array($this->statut, ['brouillon', 'rejete']);
    }
}
```

### Composant ModalConfirmationSoumission

```tsx
// resources/js/Components/Evaluations/ModalConfirmationSoumission.tsx
import { AlertTriangle, CheckCircle } from 'lucide-react';
import { Button } from '@/Components/UI/Button';

interface ModalConfirmationSoumissionProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    evaluation: {
        evalue_nom: string;
        nb_criteres: number;
        score_moyen: number;
    };
}

export default function ModalConfirmationSoumission({
    isOpen,
    onClose,
    onConfirm,
    evaluation
}: ModalConfirmationSoumissionProps) {
    if (!isOpen) return null;
    
    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
                <div className="flex items-center space-x-3 mb-4">
                    <div className="w-12 h-12 rounded-full bg-sabc-accent bg-opacity-20 flex items-center justify-center">
                        <AlertTriangle size={24} className="text-sabc-accent" />
                    </div>
                    <h3 className="text-xl font-semibold text-sabc-gray-900 font-poppins">
                        Confirmer la soumission
                    </h3>
                </div>
                
                <div className="space-y-4 mb-6">
                    <p className="text-sabc-gray-800">
                        Vous êtes sur le point de soumettre l'évaluation de{' '}
                        <span className="font-semibold">{evaluation.evalue_nom}</span>.
                    </p>
                    
                    <div className="bg-sabc-gray-50 p-4 rounded-lg space-y-2">
                        <div className="flex justify-between">
                            <span className="text-sm text-sabc-gray-600">Critères évalués :</span>
                            <span className="font-semibold text-sabc-gray-900">
                                {evaluation.nb_criteres}
                            </span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-sm text-sabc-gray-600">Score moyen :</span>
                            <span className="font-semibold text-sabc-gray-900">
                                {evaluation.score_moyen.toFixed(1)} / 5
                            </span>
                        </div>
                    </div>
                    
                    <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg">
                        <div className="flex items-start space-x-2">
                            <AlertTriangle size={20} className="text-yellow-600 mt-0.5" />
                            <div className="text-sm text-yellow-800">
                                <p className="font-semibold mb-1">Attention</p>
                                <p>
                                    Une fois soumise, vous ne pourrez plus modifier cette évaluation.
                                    Elle sera transmise à votre manager pour validation.
                                </p>
                            </div>
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
                        onClick={onConfirm}
                        className="flex-1 bg-sabc-red-primary hover:bg-sabc-red-dark"
                    >
                        <CheckCircle size={16} className="mr-2" />
                        Confirmer la soumission
                    </Button>
                </div>
            </div>
        </div>
    );
}
```

### Modification Page Edit.tsx

```tsx
// Ajout dans resources/js/Pages/Evaluations/Edit.tsx
import { useState } from 'react';
import { router } from '@inertiajs/react';
import ModalConfirmationSoumission from '@/Components/Evaluations/ModalConfirmationSoumission';

export default function Edit({ evaluation, criteres_par_categorie, progression }) {
    const [showModal, setShowModal] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    
    const handleSubmit = () => {
        setIsSubmitting(true);
        
        router.post(`/evaluations/${evaluation.id_evaluation}/submit`, {}, {
            onSuccess: () => {
                setShowModal(false);
                // Redirection vers liste évaluations
                router.visit('/evaluations');
            },
            onError: (errors) => {
                setIsSubmitting(false);
                setShowModal(false);
                // Afficher erreurs
                alert(errors.message || 'Erreur lors de la soumission');
            },
        });
    };
    
    const peutSoumettre = progression.progression === 100;
    
    return (
        <div>
            {/* ... contenu existant ... */}
            
            <div className="flex justify-end space-x-4 mt-6">
                <Button
                    type="button"
                    variant="secondary"
                    onClick={() => router.visit('/evaluations')}
                >
                    Retour
                </Button>
                
                <Button
                    type="button"
                    onClick={() => setShowModal(true)}
                    disabled={!peutSoumettre || isSubmitting}
                    className="bg-sabc-red-primary hover:bg-sabc-red-dark"
                >
                    Soumettre l'évaluation
                </Button>
            </div>
            
            <ModalConfirmationSoumission
                isOpen={showModal}
                onClose={() => setShowModal(false)}
                onConfirm={handleSubmit}
                evaluation={{
                    evalue_nom: evaluation.evalue.nom_complet,
                    nb_criteres: progression.nb_criteres_total,
                    score_moyen: evaluation.score_global || 0,
                }}
            />
        </div>
    );
}
```

### Exceptions Personnalisées

```php
namespace App\Exceptions;

class EvaluationIncompletException extends \Exception
{
    //
}

class CommentaireManquantException extends \Exception
{
    //
}

class NoteInvalideException extends \Exception
{
    //
}
```

### Project Structure Notes

**Fichiers à créer :**
- `app/Services/ValidationSoumissionService.php`
- `app/Services/NotificationManagerService.php`
- `app/Exceptions/EvaluationIncompletException.php`
- `app/Exceptions/CommentaireManquantException.php`
- `app/Exceptions/NoteInvalideException.php`
- `resources/js/Components/Evaluations/ModalConfirmationSoumission.tsx`

**Fichiers à modifier :**
- `app/Http/Controllers/EvaluationsController.php` : Ajouter méthode submit()
- `app/Models/Evaluation.php` : Ajouter méthodes soumettre(), peutEtreSoumise()
- `resources/js/Pages/Evaluations/Edit.tsx` : Ajouter bouton soumission + modal
- `routes/web.php` : Ajouter route POST /evaluations/{id}/submit

**Dépendances Stories Précédentes :**
- Story 4.1 : Table evaluations, modèle Evaluation
- Story 4.2 : Notations sauvegardées
- Story 1.1 : Table notifications

### Règles Métier SABC Critiques

**Validations Soumission :**
- Complétude : 100% critères notés
- Commentaires : Obligatoires si note < 3
- Bornes : Notes entre 1 et 5
- Période : Ouverte obligatoire

**Transition Statut :**
- brouillon → soumis : Autorisée si validations OK
- soumis → brouillon : Interdite (sauf rejet manager)
- soumis → valide : Via manager (Story 4.4)
- soumis → rejete : Via manager (Story 4.4)

**Notification Manager :**
- Destinataire : Manager direct de l'évalué
- Fallback : DR de la région si pas de manager
- Type : 'soumission_evaluation'
- Contenu : Évaluateur, évalué, type, période

**Blocage Modification :**
- Statut 'soumis' : Lecture seule
- Statut 'valide' : Lecture seule
- Statut 'rejete' : Modifiable (retour brouillon)

### References

- [Source: epics.md#Epic 4 Story 4.3] - Acceptance criteria complets
- [Source: architecture.md#Workflow States] - Transitions statuts
- [Source: business-logic-rules.md#Validation Évaluations] - Règles validation
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
