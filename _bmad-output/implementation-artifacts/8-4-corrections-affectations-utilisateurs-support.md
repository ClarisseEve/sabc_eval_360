# Story 8.4: Corrections Affectations Utilisateurs (Support)

Status: ready-for-dev

## Story

En tant qu'administrateur support,
Je veux corriger les affectations erronées d'utilisateurs,
Afin de résoudre les problèmes rapidement.

## Acceptance Criteria

**Given** je suis admin avec permissions support
**When** je corrige une affectation utilisateur (rôle, région, branche, manager)
**Then** la modification est appliquée immédiatement dans MySQL `utilisateurs`
**And** un log détaillé est créé dans `logs_administration` avec : ancienne valeur, nouvelle valeur, motif
**And** l'utilisateur reçoit une notification de la modification
**And** si le changement impacte des évaluations en cours, un avertissement est affiché
**And** je peux ajouter un commentaire expliquant la raison de la correction
**And** les corrections sont auditables et traçables

## Tasks / Subtasks

- [ ] Service CorrectionUtilisateurService (AC: 1, 2, 3, 4, 5, 6)
- [ ] Page Admin Correction Utilisateur (AC: 1, 2, 4, 5)
- [ ] CorrectionsController (AC: 1, 2, 3, 4, 5, 6)
- [ ] Composant FormCorrection (AC: 1, 2, 5)
- [ ] Composant AvertissementImpact (AC: 4)
- [ ] Notification utilisateur (AC: 3)
- [ ] Tests & Validation

## Dev Notes

### Architecture Corrections Support

**Champs Modifiables :**
- Rôle (role_id)
- Région (id_region)
- Branche (id_branche)
- Manager (manager_matricule)

**Flux Correction :**
1. Admin support accède page correction
2. Sélection utilisateur à corriger
3. Modification champs
4. Ajout commentaire motif
5. Vérification impact évaluations
6. Confirmation correction
7. Application modification MySQL
8. Logging logs_administration
9. Notification utilisateur

### CorrectionUtilisateurService

```php
namespace App\Services;

use App\Models\Utilisateur;
use App\Models\Evaluation;
use App\Services\AdminLogService;
use App\Services\NotificationService;

class CorrectionUtilisateurService
{
    protected $logService;
    protected $notificationService;
    
    public function __construct(
        AdminLogService $logService,
        NotificationService $notificationService
    ) {
        $this->logService = $logService;
        $this->notificationService = $notificationService;
    }
    
    public function corrigerAffectation(
        Utilisateur $utilisateur,
        array $modifications,
        string $motif,
        string $correcteurMatricule
    ): array {
        $anciennes_valeurs = [];
        $nouvelles_valeurs = [];
        $impacts = [];
        
        // Vérifier impacts évaluations
        $impacts = $this->verifierImpactEvaluations($utilisateur, $modifications);
        
        // Sauvegarder anciennes valeurs
        foreach ($modifications as $champ => $nouvelle_valeur) {
            $anciennes_valeurs[$champ] = $utilisateur->$champ;
            $nouvelles_valeurs[$champ] = $nouvelle_valeur;
        }
        
        // Appliquer modifications
        $utilisateur->update($modifications);
        
        // Logger correction
        $this->logService->logAction(
            $correcteurMatricule,
            'correction_affectation',
            'succes',
            [
                'matricule_concerne' => $utilisateur->matricule,
                'anciennes_valeurs' => $anciennes_valeurs,
                'nouvelles_valeurs' => $nouvelles_valeurs,
                'motif' => $motif,
                'impacts' => $impacts,
            ]
        );
        
        // Notifier utilisateur
        $this->notifierUtilisateur($utilisateur, $anciennes_valeurs, $nouvelles_valeurs, $motif);
        
        return [
            'success' => true,
            'impacts' => $impacts,
        ];
    }
    
    protected function verifierImpactEvaluations(Utilisateur $utilisateur, array $modifications): array
    {
        $impacts = [];
        
        // Vérifier évaluations en cours
        $evaluationsEnCours = Evaluation::where(function($q) use ($utilisateur) {
            $q->where('evaluateur_matricule', $utilisateur->matricule)
              ->orWhere('evalue_matricule', $utilisateur->matricule);
        })
        ->whereIn('statut', ['brouillon', 'soumis'])
        ->count();
        
        if ($evaluationsEnCours > 0) {
            $impacts[] = [
                'type' => 'evaluations_en_cours',
                'count' => $evaluationsEnCours,
                'message' => "{$evaluationsEnCours} évaluation(s) en cours seront impactées",
            ];
        }
        
        // Vérifier changement manager
        if (isset($modifications['manager_matricule'])) {
            $impacts[] = [
                'type' => 'changement_manager',
                'message' => 'Le changement de manager peut affecter les permissions d\'évaluation',
            ];
        }
        
        return $impacts;
    }
    
    protected function notifierUtilisateur(
        Utilisateur $utilisateur,
        array $anciennes_valeurs,
        array $nouvelles_valeurs,
        string $motif
    ): void {
        $modifications_texte = [];
        
        foreach ($nouvelles_valeurs as $champ => $nouvelle_valeur) {
            $ancienne_valeur = $anciennes_valeurs[$champ];
            $modifications_texte[] = "{$champ}: {$ancienne_valeur} → {$nouvelle_valeur}";
        }
        
        $this->notificationService->creerNotification(
            $utilisateur->matricule,
            'correction_affectation',
            'Modification de votre affectation',
            "Votre affectation a été modifiée par l'équipe support. " .
            "Modifications : " . implode(', ', $modifications_texte) . ". " .
            "Motif : {$motif}",
            [
                'anciennes_valeurs' => $anciennes_valeurs,
                'nouvelles_valeurs' => $nouvelles_valeurs,
                'motif' => $motif,
            ]
        );
    }
}
```

### Composant FormCorrection

```tsx
// resources/js/Components/Admin/FormCorrection.tsx
import { useState } from 'react';
import { Button } from '@/Components/UI/Button';
import { AlertTriangle } from 'lucide-react';

interface Props {
    utilisateur: {
        matricule: string;
        nom_complet: string;
        role_id: string;
        id_region: number;
        id_branche: number;
        manager_matricule: string;
    };
    roles: Array<{ id_role: string; nom_role: string }>;
    regions: Array<{ id_region: number; nom_region: string }>;
    branches: Array<{ id_branche: number; nom_branche: string }>;
    managers: Array<{ matricule: string; nom_complet: string }>;
    onSubmit: (modifications: any, motif: string) => void;
}

export default function FormCorrection({
    utilisateur,
    roles,
    regions,
    branches,
    managers,
    onSubmit
}: Props) {
    const [modifications, setModifications] = useState({
        role_id: utilisateur.role_id,
        id_region: utilisateur.id_region,
        id_branche: utilisateur.id_branche,
        manager_matricule: utilisateur.manager_matricule,
    });
    
    const [motif, setMotif] = useState('');
    const [impacts, setImpacts] = useState<any[]>([]);
    
    const hasChanges = () => {
        return Object.keys(modifications).some(
            key => modifications[key] !== utilisateur[key]
        );
    };
    
    const handleSubmit = () => {
        if (!motif || motif.length < 10) {
            alert('Le motif doit contenir au moins 10 caractères');
            return;
        }
        
        onSubmit(modifications, motif);
    };
    
    return (
        <div className="space-y-6">
            <div className="bg-white border border-sabc-gray-200 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-sabc-gray-900 mb-4">
                    Correction Affectation - {utilisateur.nom_complet}
                </h3>
                
                <div className="space-y-4">
                    {/* Formulaire champs */}
                    <div>
                        <label className="block text-sm font-medium text-sabc-gray-800 mb-2">
                            Rôle
                        </label>
                        <select
                            value={modifications.role_id}
                            onChange={(e) => setModifications({...modifications, role_id: e.target.value})}
                            className="w-full border border-sabc-gray-200 rounded-lg p-2"
                        >
                            {roles.map((role) => (
                                <option key={role.id_role} value={role.id_role}>
                                    {role.nom_role}
                                </option>
                            ))}
                        </select>
                    </div>
                    
                    {/* Motif */}
                    <div>
                        <label className="block text-sm font-medium text-sabc-gray-800 mb-2">
                            Motif de la correction *
                        </label>
                        <textarea
                            value={motif}
                            onChange={(e) => setMotif(e.target.value)}
                            placeholder="Expliquez la raison de cette correction..."
                            className="w-full border border-sabc-gray-200 rounded-lg p-3"
                            rows={4}
                            minLength={10}
                        />
                    </div>
                    
                    {/* Avertissements impacts */}
                    {impacts.length > 0 && (
                        <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg">
                            <div className="flex items-start space-x-2">
                                <AlertTriangle size={20} className="text-yellow-600 mt-0.5" />
                                <div>
                                    <p className="font-semibold text-yellow-800 mb-2">
                                        Impacts détectés :
                                    </p>
                                    <ul className="text-sm text-yellow-800 space-y-1">
                                        {impacts.map((impact, index) => (
                                            <li key={index}>• {impact.message}</li>
                                        ))}
                                    </ul>
                                </div>
                            </div>
                        </div>
                    )}
                    
                    <Button
                        onClick={handleSubmit}
                        disabled={!hasChanges() || !motif}
                        className="w-full bg-sabc-red-primary hover:bg-sabc-red-dark"
                    >
                        Appliquer la correction
                    </Button>
                </div>
            </div>
        </div>
    );
}
```

### References

- [Source: epics.md#Epic 8 Story 8.4]
- [Source: business-logic-rules.md#Support]

## Dev Agent Record

### Agent Model Used

_À remplir par le dev agent_

### File List

_À remplir par le dev agent_
