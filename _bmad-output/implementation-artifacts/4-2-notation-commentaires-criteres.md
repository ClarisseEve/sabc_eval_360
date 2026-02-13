# Story 4.2: Notation et Commentaires sur Critères

Status: ready-for-dev

## Story

En tant qu'évaluateur,
Je veux noter chaque critère et ajouter des commentaires,
Afin de fournir une évaluation détaillée.

## Acceptance Criteria

**Given** j'ai une évaluation en brouillon
**When** je note les critères d'évaluation
**Then** chaque note est un entier entre 1 et 5
**And** les notes sont sauvegardées dans `notations_json` (JSONB PostgreSQL)
**And** je peux ajouter un commentaire pour chaque critère
**And** les commentaires sont obligatoires si la note est < 3
**And** je peux sauvegarder en brouillon sans compléter tous les critères
**And** un indicateur de progression affiche le % de critères complétés

## Tasks / Subtasks

- [ ] Interface Notation Critères (AC: 1, 2, 3, 4, 5, 6)
  - [ ] Page `resources/js/Pages/Evaluations/Edit.tsx`
  - [ ] Affichage critères par catégorie
  - [ ] Composant notation par critère (échelle 1-5)
  - [ ] Champ commentaire par critère
  - [ ] Validation commentaire obligatoire si note < 3
  - [ ] Indicateur progression (% complété)
  - [ ] Bouton "Sauvegarder brouillon"

- [ ] Composant NotationCritere (AC: 1, 2, 3, 4)
  - [ ] Créer `resources/js/Components/Evaluations/NotationCritere.tsx`
  - [ ] Affichage échelle 1-5 (radio buttons ou étoiles)
  - [ ] Labels échelle : 1=Insuffisant, 2=À améliorer, 3=Satisfaisant, 4=Bon, 5=Excellent
  - [ ] Champ commentaire avec compteur caractères
  - [ ] Validation temps réel commentaire si note < 3
  - [ ] État visuel : Non noté, Noté, Commentaire requis

- [ ] Composant ProgressionEvaluation (AC: 6)
  - [ ] Créer `resources/js/Components/Evaluations/ProgressionEvaluation.tsx`
  - [ ] Barre progression avec %
  - [ ] Compteur : X critères complétés sur Y
  - [ ] Indicateur critères manquants
  - [ ] Design SABC

- [ ] Service NotationService (AC: 1, 2, 3, 4, 5)
  - [ ] Créer `app/Services/NotationService.php`
  - [ ] Méthode `sauvegarderNotation()` : Sauvegarde note + commentaire
  - [ ] Méthode `validerNotation()` : Validation note 1-5
  - [ ] Méthode `validerCommentaire()` : Validation commentaire si note < 3
  - [ ] Méthode `calculerProgression()` : % critères complétés

- [ ] EvaluationsController Méthodes Edit/Update (AC: 1, 2, 3, 4, 5, 6)
  - [ ] Méthode `edit()` : Afficher formulaire notation
  - [ ] Méthode `update()` : Sauvegarder notations brouillon
  - [ ] Validation notes 1-5
  - [ ] Validation commentaires si note < 3
  - [ ] Calcul progression automatique
  - [ ] Retour JSON avec progression

- [ ] Validation Backend (AC: 1, 2, 4)
  - [ ] Request `UpdateEvaluationRequest.php`
  - [ ] Validation notes : integer, between:1,5
  - [ ] Validation commentaires : required_if:note,<,3
  - [ ] Validation structure notations_json
  - [ ] Messages d'erreur français explicites

- [ ] Tests & Validation
  - [ ] Tester notation critère avec note 1-5
  - [ ] Tester validation commentaire obligatoire si note < 3
  - [ ] Tester sauvegarde brouillon partielle
  - [ ] Tester calcul progression
  - [ ] Tester validation backend

## Dev Notes

### Architecture Notation Critères

**Structure notations_json :**
```json
{
  "critere-1": {
    "note": 4,
    "commentaire": "Très bon travail sur ce critère"
  },
  "critere-2": {
    "note": 2,
    "commentaire": "Nécessite des améliorations significatives dans ce domaine"
  },
  "critere-3": {
    "note": 5,
    "commentaire": "Excellence démontrée"
  }
}
```

**Structure commentaires_json :**
```json
{
  "critere-1": "Très bon travail sur ce critère",
  "critere-2": "Nécessite des améliorations significatives dans ce domaine",
  "critere-3": "Excellence démontrée"
}
```

**Règles Validation :**
- Note : Integer entre 1 et 5 (obligatoire)
- Commentaire : String (obligatoire si note < 3)
- Sauvegarde brouillon : Partielle autorisée
- Progression : (nb_criteres_notes / nb_criteres_total) * 100

**Échelle Notation :**
- 1 : Insuffisant
- 2 : À améliorer
- 3 : Satisfaisant
- 4 : Bon
- 5 : Excellent

### NotationService

```php
namespace App\Services;

use App\Models\Evaluation;

class NotationService
{
    /**
     * Sauvegarder une notation
     */
    public function sauvegarderNotation(
        Evaluation $evaluation,
        string $critereId,
        int $note,
        ?string $commentaire = null
    ): Evaluation {
        // Valider la note
        $this->validerNotation($note);
        
        // Valider le commentaire si note < 3
        $this->validerCommentaire($note, $commentaire);
        
        // Récupérer notations existantes
        $notations = $evaluation->notations_json ?? [];
        $commentaires = $evaluation->commentaires_json ?? [];
        
        // Ajouter/Mettre à jour notation
        $notations[$critereId] = [
            'note' => $note,
            'commentaire' => $commentaire,
        ];
        
        // Ajouter/Mettre à jour commentaire
        if ($commentaire) {
            $commentaires[$critereId] = $commentaire;
        }
        
        // Sauvegarder
        $evaluation->update([
            'notations_json' => $notations,
            'commentaires_json' => $commentaires,
        ]);
        
        return $evaluation->fresh();
    }
    
    /**
     * Valider une note
     */
    public function validerNotation(int $note): void
    {
        if ($note < 1 || $note > 5) {
            throw new \InvalidArgumentException(
                "La note doit être comprise entre 1 et 5. Note fournie : {$note}"
            );
        }
    }
    
    /**
     * Valider un commentaire
     */
    public function validerCommentaire(int $note, ?string $commentaire): void
    {
        if ($note < 3 && empty($commentaire)) {
            throw new \InvalidArgumentException(
                "Un commentaire est obligatoire pour les notes inférieures à 3"
            );
        }
    }
    
    /**
     * Calculer la progression
     */
    public function calculerProgression(Evaluation $evaluation): array
    {
        $criteres = $evaluation->template->regleEvaluation->criteres;
        $nbCriteresTotal = count($criteres);
        
        $notations = $evaluation->notations_json ?? [];
        $nbCriteresNotes = count($notations);
        
        $progression = $nbCriteresTotal > 0 
            ? (int) (($nbCriteresNotes / $nbCriteresTotal) * 100) 
            : 0;
        
        return [
            'nb_criteres_total' => $nbCriteresTotal,
            'nb_criteres_notes' => $nbCriteresNotes,
            'nb_criteres_manquants' => $nbCriteresTotal - $nbCriteresNotes,
            'progression' => $progression,
        ];
    }
    
    /**
     * Obtenir les critères non notés
     */
    public function getCriteresNonNotes(Evaluation $evaluation): array
    {
        $criteres = $evaluation->template->regleEvaluation->criteres;
        $notations = $evaluation->notations_json ?? [];
        
        $criteresNonNotes = [];
        
        foreach ($criteres as $critere) {
            if (!isset($notations[$critere['id']])) {
                $criteresNonNotes[] = $critere;
            }
        }
        
        return $criteresNonNotes;
    }
}
```

### EvaluationsController (Edit/Update)

```php
namespace App\Http\Controllers;

use App\Models\Evaluation;
use App\Services\NotationService;
use App\Http\Requests\UpdateEvaluationRequest;
use Inertia\Inertia;
use Inertia\Response as InertiaResponse;

class EvaluationsController extends Controller
{
    protected $notationService;
    
    public function __construct(NotationService $notationService)
    {
        $this->middleware('auth:api');
        $this->notationService = $notationService;
    }
    
    public function edit(string $id): InertiaResponse
    {
        $evaluation = Evaluation::with([
            'evalue',
            'periode',
            'template.regleEvaluation'
        ])->findOrFail($id);
        
        // Vérifier que l'utilisateur est l'évaluateur
        if ($evaluation->evaluateur_matricule !== auth()->user()->matricule) {
            abort(403, 'Vous n\'êtes pas autorisé à modifier cette évaluation');
        }
        
        // Vérifier que l'évaluation est modifiable
        if (!$evaluation->estModifiable()) {
            return redirect()->route('evaluations.show', $id)
                ->withErrors(['evaluation' => 'Cette évaluation ne peut plus être modifiée']);
        }
        
        // Calculer progression
        $progression = $this->notationService->calculerProgression($evaluation);
        
        // Récupérer critères par catégorie
        $criteres = $evaluation->template->regleEvaluation->criteres;
        $criteresParCategorie = [];
        
        foreach ($criteres as $critere) {
            $categorie = $critere['categorie'];
            if (!isset($criteresParCategorie[$categorie])) {
                $criteresParCategorie[$categorie] = [];
            }
            $criteresParCategorie[$categorie][] = $critere;
        }
        
        return Inertia::render('Evaluations/Edit', [
            'evaluation' => [
                'id_evaluation' => $evaluation->id_evaluation,
                'evalue' => [
                    'matricule' => $evaluation->evalue->matricule,
                    'nom_complet' => $evaluation->evalue->nom_complet,
                    'role_nom' => $evaluation->evalue->role->nom_role,
                    'region_nom' => $evaluation->evalue->region_nom,
                ],
                'periode' => [
                    'nom_periode' => $evaluation->periode->nom_periode,
                    'date_fin' => $evaluation->periode->date_fin->format('d/m/Y'),
                ],
                'type_evaluation' => $evaluation->type_evaluation,
                'statut' => $evaluation->statut,
                'notations' => $evaluation->notations_json ?? [],
                'commentaires' => $evaluation->commentaires_json ?? [],
            ],
            'criteres_par_categorie' => $criteresParCategorie,
            'progression' => $progression,
        ]);
    }
    
    public function update(UpdateEvaluationRequest $request, string $id)
    {
        $evaluation = Evaluation::findOrFail($id);
        
        // Vérifier que l'utilisateur est l'évaluateur
        if ($evaluation->evaluateur_matricule !== auth()->user()->matricule) {
            abort(403);
        }
        
        // Vérifier que l'évaluation est modifiable
        if (!$evaluation->estModifiable()) {
            return back()->withErrors([
                'evaluation' => 'Cette évaluation ne peut plus être modifiée'
            ]);
        }
        
        $validated = $request->validated();
        
        // Sauvegarder chaque notation
        foreach ($validated['notations'] as $critereId => $notation) {
            $this->notationService->sauvegarderNotation(
                $evaluation,
                $critereId,
                $notation['note'],
                $notation['commentaire'] ?? null
            );
        }
        
        // Calculer progression
        $progression = $this->notationService->calculerProgression($evaluation->fresh());
        
        return back()->with([
            'success' => 'Évaluation sauvegardée avec succès',
            'progression' => $progression,
        ]);
    }
}
```

### UpdateEvaluationRequest

```php
namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateEvaluationRequest extends FormRequest
{
    public function authorize()
    {
        return true;
    }
    
    public function rules()
    {
        return [
            'notations' => 'required|array',
            'notations.*.note' => 'required|integer|between:1,5',
            'notations.*.commentaire' => 'nullable|string|max:1000',
        ];
    }
    
    public function messages()
    {
        return [
            'notations.*.note.required' => 'La note est obligatoire',
            'notations.*.note.integer' => 'La note doit être un nombre entier',
            'notations.*.note.between' => 'La note doit être comprise entre 1 et 5',
            'notations.*.commentaire.max' => 'Le commentaire ne peut pas dépasser 1000 caractères',
        ];
    }
    
    public function withValidator($validator)
    {
        $validator->after(function ($validator) {
            $notations = $this->input('notations', []);
            
            foreach ($notations as $critereId => $notation) {
                $note = $notation['note'] ?? null;
                $commentaire = $notation['commentaire'] ?? null;
                
                // Vérifier commentaire obligatoire si note < 3
                if ($note < 3 && empty($commentaire)) {
                    $validator->errors()->add(
                        "notations.{$critereId}.commentaire",
                        "Un commentaire est obligatoire pour les notes inférieures à 3"
                    );
                }
            }
        });
    }
}
```

### Composant NotationCritere

```tsx
// resources/js/Components/Evaluations/NotationCritere.tsx
import { useState } from 'react';
import { Star } from 'lucide-react';

interface NotationCritereProps {
    critere: {
        id: string;
        nom: string;
        description?: string;
        ponderation: number;
    };
    notation?: {
        note: number;
        commentaire?: string;
    };
    onChange: (critereId: string, note: number, commentaire: string) => void;
}

const ECHELLE_LABELS = {
    1: 'Insuffisant',
    2: 'À améliorer',
    3: 'Satisfaisant',
    4: 'Bon',
    5: 'Excellent',
};

export default function NotationCritere({
    critere,
    notation,
    onChange
}: NotationCritereProps) {
    const [note, setNote] = useState(notation?.note || 0);
    const [commentaire, setCommentaire] = useState(notation?.commentaire || '');
    const [showCommentaireError, setShowCommentaireError] = useState(false);
    
    const handleNoteChange = (newNote: number) => {
        setNote(newNote);
        
        // Vérifier si commentaire obligatoire
        if (newNote < 3 && !commentaire) {
            setShowCommentaireError(true);
        } else {
            setShowCommentaireError(false);
        }
        
        onChange(critere.id, newNote, commentaire);
    };
    
    const handleCommentaireChange = (newCommentaire: string) => {
        setCommentaire(newCommentaire);
        
        // Vérifier si commentaire obligatoire
        if (note < 3 && !newCommentaire) {
            setShowCommentaireError(true);
        } else {
            setShowCommentaireError(false);
        }
        
        if (note > 0) {
            onChange(critere.id, note, newCommentaire);
        }
    };
    
    return (
        <div className="p-4 border border-sabc-gray-200 rounded-lg space-y-4">
            <div>
                <h4 className="font-semibold text-sabc-gray-900">
                    {critere.nom}
                    <span className="ml-2 text-sm font-normal text-sabc-gray-600">
                        (Pondération: {critere.ponderation}%)
                    </span>
                </h4>
                {critere.description && (
                    <p className="text-sm text-sabc-gray-600 mt-1">
                        {critere.description}
                    </p>
                )}
            </div>
            
            {/* Échelle notation */}
            <div className="space-y-2">
                <label className="block text-sm font-medium text-sabc-gray-800">
                    Note *
                </label>
                <div className="flex items-center space-x-2">
                    {[1, 2, 3, 4, 5].map((value) => (
                        <button
                            key={value}
                            type="button"
                            onClick={() => handleNoteChange(value)}
                            className={`flex items-center justify-center w-12 h-12 rounded-lg border-2 transition-all ${
                                note === value
                                    ? 'border-sabc-red-primary bg-sabc-red-light'
                                    : 'border-sabc-gray-200 hover:border-sabc-accent'
                            }`}
                        >
                            <Star
                                size={20}
                                className={note >= value ? 'fill-sabc-accent text-sabc-accent' : 'text-sabc-gray-400'}
                            />
                        </button>
                    ))}
                </div>
                <div className="flex justify-between text-xs text-sabc-gray-600">
                    <span>1 - Insuffisant</span>
                    <span>5 - Excellent</span>
                </div>
                {note > 0 && (
                    <p className="text-sm font-medium text-sabc-accent">
                        {ECHELLE_LABELS[note as keyof typeof ECHELLE_LABELS]}
                    </p>
                )}
            </div>
            
            {/* Commentaire */}
            <div className="space-y-2">
                <label className="block text-sm font-medium text-sabc-gray-800">
                    Commentaire {note < 3 && note > 0 && <span className="text-sabc-error">*</span>}
                </label>
                <textarea
                    value={commentaire}
                    onChange={(e) => handleCommentaireChange(e.target.value)}
                    placeholder="Ajoutez un commentaire pour justifier votre notation..."
                    className={`w-full border rounded-lg p-3 ${
                        showCommentaireError
                            ? 'border-sabc-error'
                            : 'border-sabc-gray-200'
                    }`}
                    rows={3}
                    maxLength={1000}
                />
                <div className="flex justify-between items-center">
                    <span className="text-xs text-sabc-gray-600">
                        {commentaire.length}/1000 caractères
                    </span>
                    {showCommentaireError && (
                        <span className="text-xs text-sabc-error">
                            Commentaire obligatoire pour les notes &lt; 3
                        </span>
                    )}
                </div>
            </div>
        </div>
    );
}
```

### Composant ProgressionEvaluation

```tsx
// resources/js/Components/Evaluations/ProgressionEvaluation.tsx
import { CheckCircle, AlertCircle } from 'lucide-react';

interface ProgressionEvaluationProps {
    progression: {
        nb_criteres_total: number;
        nb_criteres_notes: number;
        nb_criteres_manquants: number;
        progression: number;
    };
}

export default function ProgressionEvaluation({ progression }: ProgressionEvaluationProps) {
    const { nb_criteres_total, nb_criteres_notes, nb_criteres_manquants, progression: pourcentage } = progression;
    
    return (
        <div className="bg-white border border-sabc-gray-200 rounded-lg p-6 space-y-4">
            <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-sabc-gray-900 font-poppins">
                    Progression de l'évaluation
                </h3>
                <span className="text-2xl font-bold text-sabc-red-primary">
                    {pourcentage}%
                </span>
            </div>
            
            {/* Barre de progression */}
            <div className="relative">
                <div className="h-3 bg-sabc-gray-200 rounded-full overflow-hidden">
                    <div
                        className="h-full bg-sabc-red-primary transition-all duration-300"
                        style={{ width: `${pourcentage}%` }}
                    />
                </div>
            </div>
            
            {/* Statistiques */}
            <div className="grid grid-cols-3 gap-4">
                <div className="text-center">
                    <div className="text-2xl font-bold text-sabc-gray-900">
                        {nb_criteres_total}
                    </div>
                    <div className="text-xs text-sabc-gray-600">
                        Total critères
                    </div>
                </div>
                
                <div className="text-center">
                    <div className="flex items-center justify-center space-x-1">
                        <CheckCircle size={20} className="text-sabc-success" />
                        <span className="text-2xl font-bold text-sabc-success">
                            {nb_criteres_notes}
                        </span>
                    </div>
                    <div className="text-xs text-sabc-gray-600">
                        Complétés
                    </div>
                </div>
                
                <div className="text-center">
                    <div className="flex items-center justify-center space-x-1">
                        <AlertCircle size={20} className="text-sabc-warning" />
                        <span className="text-2xl font-bold text-sabc-warning">
                            {nb_criteres_manquants}
                        </span>
                    </div>
                    <div className="text-xs text-sabc-gray-600">
                        Restants
                    </div>
                </div>
            </div>
            
            {/* Message */}
            {pourcentage === 100 ? (
                <div className="flex items-center space-x-2 text-sabc-success bg-green-50 p-3 rounded-lg">
                    <CheckCircle size={16} />
                    <span className="text-sm font-medium">
                        Tous les critères ont été notés. Vous pouvez soumettre l'évaluation.
                    </span>
                </div>
            ) : (
                <div className="flex items-center space-x-2 text-sabc-warning bg-yellow-50 p-3 rounded-lg">
                    <AlertCircle size={16} />
                    <span className="text-sm font-medium">
                        Il reste {nb_criteres_manquants} critère(s) à noter avant de pouvoir soumettre.
                    </span>
                </div>
            )}
        </div>
    );
}
```

### Project Structure Notes

**Fichiers à créer :**
- `app/Services/NotationService.php`
- `app/Http/Requests/UpdateEvaluationRequest.php`
- `resources/js/Pages/Evaluations/Edit.tsx`
- `resources/js/Components/Evaluations/NotationCritere.tsx`
- `resources/js/Components/Evaluations/ProgressionEvaluation.tsx`

**Fichiers à modifier :**
- `app/Http/Controllers/EvaluationsController.php` : Ajouter méthodes edit(), update()
- `routes/web.php` : Ajouter routes edit/update évaluations

**Dépendances Stories Précédentes :**
- Story 4.1 : Table evaluations, modèle Evaluation
- Story 2.1 : Règles évaluation avec critères
- Story 3.1 : Templates évaluation

### Règles Métier SABC Critiques

**Validation Notes :**
- Obligatoire : Integer entre 1 et 5
- Échelle : 1=Insuffisant, 2=À améliorer, 3=Satisfaisant, 4=Bon, 5=Excellent

**Validation Commentaires :**
- Obligatoire si note < 3
- Maximum 1000 caractères
- Optionnel si note >= 3

**Sauvegarde Brouillon :**
- Partielle autorisée (pas tous les critères)
- Pas de validation complétude
- Progression calculée automatiquement

**Progression :**
- Formule : (nb_criteres_notes / nb_criteres_total) * 100
- Affichage temps réel
- Indicateur critères manquants

### References

- [Source: epics.md#Epic 4 Story 4.2] - Acceptance criteria complets
- [Source: architecture.md#Data Models] - Structure notations_json
- [Source: business-logic-rules.md#Validation Évaluations] - Règles validation
- [Source: project-context.md#Critical Implementation Rules] - PostgreSQL JSONB

## Dev Agent Record

### Agent Model Used

_À remplir par le dev agent_

### Debug Log References

_À remplir par le dev agent_

### Completion Notes List

_À remplir par le dev agent_

### File List

_À remplir par le dev agent_
