# Story 6.2: Dashboard Manager - Validations en Attente

Status: ready-for-dev

## Story

En tant que manager,
Je veux voir les évaluations en attente de validation,
Afin de les traiter rapidement.

## Acceptance Criteria

**Given** je suis manager
**When** j'accède à "Validations en Attente"
**Then** je vois toutes les évaluations en statut "soumis" pour mes subordonnés
**And** je vois : nom évaluateur, nom évalué, date soumission, jours en attente
**And** je peux cliquer pour consulter et valider/rejeter directement
**And** un badge rouge indique le nombre d'évaluations en attente > 3 jours
**And** je peux filtrer par évaluateur ou évalué
**And** les évaluations sont triées par ancienneté (plus anciennes en premier)

## Tasks / Subtasks

- [ ] Page Validations en Attente (AC: 1, 2, 3, 4, 5, 6)
  - [ ] Page `resources/js/Pages/Manager/Validations/Index.tsx`
  - [ ] Liste évaluations soumises
  - [ ] Table : Évaluateur, Évalué, Date soumission, Jours attente
  - [ ] Badge rouge si > 3 jours
  - [ ] Filtres : Évaluateur, Évalué
  - [ ] Tri par ancienneté
  - [ ] Actions : Consulter, Valider, Rejeter

- [ ] Composant TableValidationsAttente (AC: 2, 3, 4, 6)
  - [ ] Créer `resources/js/Components/Manager/TableValidationsAttente.tsx`
  - [ ] Colonnes : Évaluateur, Évalué, Type, Date, Jours, Actions
  - [ ] Badge rouge si jours > 3
  - [ ] Tri par date_soumission (ASC)
  - [ ] Boutons : Consulter, Valider, Rejeter

- [ ] Composant FiltresValidations (AC: 5)
  - [ ] Créer `resources/js/Components/Manager/FiltresValidations.tsx`
  - [ ] Filtre évaluateur (dropdown avec recherche)
  - [ ] Filtre évalué (dropdown avec recherche)
  - [ ] Bouton réinitialiser

- [ ] Composant ModalValidationRapide (AC: 3)
  - [ ] Créer `resources/js/Components/Manager/ModalValidationRapide.tsx`
  - [ ] Affichage résumé évaluation
  - [ ] Boutons : Valider, Rejeter avec motif
  - [ ] Redirection après action

- [ ] Réutilisation ManagerEvaluationsController (AC: 1, 2, 3)
  - [ ] Utiliser controller existant (Story 4.4)
  - [ ] Méthode `index()` déjà implémentée
  - [ ] Méthodes `valider()` et `rejeter()` déjà implémentées

- [ ] Tests & Validation
  - [ ] Tester affichage évaluations soumises
  - [ ] Tester badge rouge > 3 jours
  - [ ] Tester filtres évaluateur/évalué
  - [ ] Tester tri par ancienneté
  - [ ] Tester validation/rejet rapide

## Dev Notes

### Architecture Validations en Attente

**Flux Validations :**
1. Manager accède page "Validations en Attente"
2. Récupération évaluations statut 'soumis' pour subordonnés
3. Affichage table avec détails
4. Badge rouge si jours > 3
5. Filtres évaluateur/évalué
6. Actions : Consulter détaillée, Valider rapide, Rejeter avec motif

**Calcul Jours en Attente :**
- Formule : now() - date_soumission
- Badge rouge : jours >= 3
- Tri : date_soumission ASC (plus anciennes en premier)

**Actions Disponibles :**
- **Consulter** : Redirection vers page détails (Story 4.4)
- **Valider** : Modal confirmation → API valider
- **Rejeter** : Modal motif → API rejeter

**Réutilisation Code :**
- Controller : ManagerEvaluationsController (Story 4.4)
- Service : ValidationManagerService (Story 4.4)
- Routes : Déjà définies

### Page Validations en Attente

```tsx
// resources/js/Pages/Manager/Validations/Index.tsx
import { useState } from 'react';
import ManagerLayout from '@/Layouts/ManagerLayout';
import TableValidationsAttente from '@/Components/Manager/TableValidationsAttente';
import FiltresValidations from '@/Components/Manager/FiltresValidations';
import { AlertCircle } from 'lucide-react';

interface Evaluation {
    id_evaluation: string;
    evaluateur: {
        matricule: string;
        nom_complet: string;
        role_nom: string;
    };
    evalue: {
        matricule: string;
        nom_complet: string;
        role_nom: string;
    };
    type_evaluation: string;
    date_soumission: string;
    jours_attente: number;
}

interface Props {
    evaluations: Evaluation[];
    statistiques: {
        total_en_attente: number;
        anciennes: number; // > 3 jours
    };
}

export default function Index({ evaluations, statistiques }: Props) {
    const [filtres, setFiltres] = useState({
        evaluateur: '',
        evalue: '',
    });
    
    const evaluationsFiltrees = evaluations.filter((eval) => {
        if (filtres.evaluateur && !eval.evaluateur.nom_complet.toLowerCase().includes(filtres.evaluateur.toLowerCase())) {
            return false;
        }
        if (filtres.evalue && !eval.evalue.nom_complet.toLowerCase().includes(filtres.evalue.toLowerCase())) {
            return false;
        }
        return true;
    });
    
    return (
        <ManagerLayout>
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <h1 className="text-2xl font-bold text-sabc-gray-900 font-poppins">
                        Validations en Attente
                    </h1>
                    
                    {statistiques.anciennes > 0 && (
                        <div className="flex items-center space-x-2 bg-red-50 border border-red-200 px-4 py-2 rounded-lg">
                            <AlertCircle size={20} className="text-sabc-error" />
                            <span className="text-sm font-semibold text-sabc-error">
                                {statistiques.anciennes} évaluation(s) en attente depuis plus de 3 jours
                            </span>
                        </div>
                    )}
                </div>
                
                {/* Statistiques */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-white border border-sabc-gray-200 rounded-lg p-4">
                        <div className="text-sm text-sabc-gray-600 mb-1">Total en attente</div>
                        <div className="text-3xl font-bold text-sabc-gray-900">
                            {statistiques.total_en_attente}
                        </div>
                    </div>
                    
                    <div className="bg-white border border-red-200 rounded-lg p-4">
                        <div className="text-sm text-sabc-gray-600 mb-1">En retard (&gt; 3 jours)</div>
                        <div className="text-3xl font-bold text-sabc-error">
                            {statistiques.anciennes}
                        </div>
                    </div>
                </div>
                
                {/* Filtres */}
                <FiltresValidations
                    filtres={filtres}
                    onFiltresChange={setFiltres}
                    evaluations={evaluations}
                />
                
                {/* Table */}
                <TableValidationsAttente evaluations={evaluationsFiltrees} />
            </div>
        </ManagerLayout>
    );
}
```

### Composant TableValidationsAttente

```tsx
// resources/js/Components/Manager/TableValidationsAttente.tsx
import { useState } from 'react';
import { Badge } from '@/Components/UI/Badge';
import { Button } from '@/Components/UI/Button';
import { Eye, CheckCircle, XCircle } from 'lucide-react';
import { router } from '@inertiajs/react';
import ModalValidationRapide from './ModalValidationRapide';

interface Evaluation {
    id_evaluation: string;
    evaluateur: {
        nom_complet: string;
        role_nom: string;
    };
    evalue: {
        nom_complet: string;
        role_nom: string;
    };
    type_evaluation: string;
    date_soumission: string;
    jours_attente: number;
}

interface Props {
    evaluations: Evaluation[];
}

const TYPE_LABELS = {
    auto: 'Auto',
    peer: 'Pairs',
    subordinate: 'Manager',
};

export default function TableValidationsAttente({ evaluations }: Props) {
    const [selectedEvaluation, setSelectedEvaluation] = useState<Evaluation | null>(null);
    const [modalAction, setModalAction] = useState<'valider' | 'rejeter' | null>(null);
    
    const handleConsulter = (id: string) => {
        router.visit(`/manager/evaluations/${id}`);
    };
    
    const handleValider = (evaluation: Evaluation) => {
        setSelectedEvaluation(evaluation);
        setModalAction('valider');
    };
    
    const handleRejeter = (evaluation: Evaluation) => {
        setSelectedEvaluation(evaluation);
        setModalAction('rejeter');
    };
    
    // Tri par ancienneté (plus anciennes en premier)
    const evaluationsTriees = [...evaluations].sort((a, b) => b.jours_attente - a.jours_attente);
    
    return (
        <>
            <div className="bg-white border border-sabc-gray-200 rounded-lg overflow-hidden">
                <table className="min-w-full divide-y divide-sabc-gray-200">
                    <thead className="bg-sabc-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-sabc-gray-600 uppercase tracking-wider">
                                Évaluateur
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-sabc-gray-600 uppercase tracking-wider">
                                Évalué
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-sabc-gray-600 uppercase tracking-wider">
                                Type
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-sabc-gray-600 uppercase tracking-wider">
                                Date soumission
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-sabc-gray-600 uppercase tracking-wider">
                                Jours attente
                            </th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-sabc-gray-600 uppercase tracking-wider">
                                Actions
                            </th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-sabc-gray-200">
                        {evaluationsTriees.length === 0 ? (
                            <tr>
                                <td colSpan={6} className="px-6 py-8 text-center text-sabc-gray-600">
                                    Aucune évaluation en attente
                                </td>
                            </tr>
                        ) : (
                            evaluationsTriees.map((evaluation) => (
                                <tr key={evaluation.id_evaluation} className="hover:bg-sabc-gray-50">
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm font-medium text-sabc-gray-900">
                                            {evaluation.evaluateur.nom_complet}
                                        </div>
                                        <div className="text-xs text-sabc-gray-600">
                                            {evaluation.evaluateur.role_nom}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm font-medium text-sabc-gray-900">
                                            {evaluation.evalue.nom_complet}
                                        </div>
                                        <div className="text-xs text-sabc-gray-600">
                                            {evaluation.evalue.role_nom}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <Badge className="bg-blue-500">
                                            {TYPE_LABELS[evaluation.type_evaluation as keyof typeof TYPE_LABELS]}
                                        </Badge>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-sabc-gray-900">
                                        {evaluation.date_soumission}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <Badge className={evaluation.jours_attente >= 3 ? 'bg-sabc-error' : 'bg-sabc-warning'}>
                                            {evaluation.jours_attente} jour(s)
                                        </Badge>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                        <div className="flex items-center justify-end space-x-2">
                                            <Button
                                                onClick={() => handleConsulter(evaluation.id_evaluation)}
                                                variant="secondary"
                                                size="sm"
                                            >
                                                <Eye size={14} className="mr-1" />
                                                Consulter
                                            </Button>
                                            <Button
                                                onClick={() => handleValider(evaluation)}
                                                className="bg-sabc-success hover:bg-green-700"
                                                size="sm"
                                            >
                                                <CheckCircle size={14} className="mr-1" />
                                                Valider
                                            </Button>
                                            <Button
                                                onClick={() => handleRejeter(evaluation)}
                                                className="bg-sabc-error hover:bg-red-700"
                                                size="sm"
                                            >
                                                <XCircle size={14} className="mr-1" />
                                                Rejeter
                                            </Button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
            
            {selectedEvaluation && modalAction && (
                <ModalValidationRapide
                    isOpen={true}
                    onClose={() => {
                        setSelectedEvaluation(null);
                        setModalAction(null);
                    }}
                    evaluation={selectedEvaluation}
                    action={modalAction}
                />
            )}
        </>
    );
}
```

### Composant FiltresValidations

```tsx
// resources/js/Components/Manager/FiltresValidations.tsx
import { Input } from '@/Components/UI/Input';
import { Button } from '@/Components/UI/Button';
import { Filter, X } from 'lucide-react';

interface Props {
    filtres: {
        evaluateur: string;
        evalue: string;
    };
    onFiltresChange: (filtres: any) => void;
    evaluations: any[];
}

export default function FiltresValidations({ filtres, onFiltresChange, evaluations }: Props) {
    const handleReset = () => {
        onFiltresChange({ evaluateur: '', evalue: '' });
    };
    
    return (
        <div className="bg-white border border-sabc-gray-200 rounded-lg p-4">
            <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-sabc-gray-900 flex items-center">
                    <Filter size={20} className="mr-2" />
                    Filtres
                </h3>
                <Button onClick={handleReset} variant="secondary" size="sm">
                    <X size={16} className="mr-1" />
                    Réinitialiser
                </Button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-sabc-gray-800 mb-2">
                        Évaluateur
                    </label>
                    <Input
                        type="text"
                        placeholder="Rechercher un évaluateur..."
                        value={filtres.evaluateur}
                        onChange={(e) => onFiltresChange({ ...filtres, evaluateur: e.target.value })}
                    />
                </div>
                
                <div>
                    <label className="block text-sm font-medium text-sabc-gray-800 mb-2">
                        Évalué
                    </label>
                    <Input
                        type="text"
                        placeholder="Rechercher un évalué..."
                        value={filtres.evalue}
                        onChange={(e) => onFiltresChange({ ...filtres, evalue: e.target.value })}
                    />
                </div>
            </div>
        </div>
    );
}
```

### Project Structure Notes

**Fichiers à créer :**
- `resources/js/Pages/Manager/Validations/Index.tsx`
- `resources/js/Components/Manager/TableValidationsAttente.tsx`
- `resources/js/Components/Manager/FiltresValidations.tsx`
- `resources/js/Components/Manager/ModalValidationRapide.tsx`

**Fichiers à réutiliser :**
- `app/Http/Controllers/Manager/ManagerEvaluationsController.php` (Story 4.4)
- `app/Services/ValidationManagerService.php` (Story 4.4)

**Fichiers à modifier :**
- `routes/web.php` : Ajouter route /manager/validations (si pas déjà existante)

**Dépendances Stories Précédentes :**
- Story 4.4 : ManagerEvaluationsController, ValidationManagerService
- Story 4.3 : Évaluations soumises

### Règles Métier SABC Critiques

**Affichage Évaluations :**
- Statut : 'soumis' uniquement
- Périmètre : Subordonnés directs du manager
- Tri : Par ancienneté (date_soumission ASC)

**Badge Rouge :**
- Condition : jours_attente >= 3
- Calcul : now() - date_soumission
- Affichage : Colonne "Jours attente" + statistique globale

**Filtres :**
- Évaluateur : Recherche textuelle nom
- Évalué : Recherche textuelle nom
- Temps réel : Filtrage côté client

**Actions :**
- Consulter : Redirection page détails (Story 4.4)
- Valider : Modal confirmation → API /manager/evaluations/{id}/valider
- Rejeter : Modal motif → API /manager/evaluations/{id}/rejeter

### References

- [Source: epics.md#Epic 6 Story 6.2] - Acceptance criteria complets
- [Source: architecture.md#Manager Views] - Vues manager
- [Source: business-logic-rules.md#Validation Manager] - Règles validation
- [Source: Story 4.4] - Controller et service réutilisés

## Dev Agent Record

### Agent Model Used

_À remplir par le dev agent_

### Debug Log References

_À remplir par le dev agent_

### Completion Notes List

_À remplir par le dev agent_

### File List

_À remplir par le dev agent_
