# Story 8.1: Report Builder avec Sections Templatisées

Status: ready-for-dev

## Story

En tant qu'administrateur,
Je veux créer un rapport avec sections templatisées,
Afin de générer des rapports personnalisés.

## Acceptance Criteria

**Given** je suis connecté en tant qu'admin
**When** je crée un nouveau rapport
**Then** je peux choisir parmi des sections templatisées (Executive Summary, KPIs, Tendances, Recommandations)
**And** je peux ajouter du texte libre dans chaque section
**And** je peux ajouter des graphes depuis l'analytics (drag & drop)
**And** je peux réorganiser les sections par drag & drop
**And** le rapport est sauvegardé en brouillon et peut être édité
**And** je peux prévisualiser le rapport avant export

## Tasks / Subtasks

- [ ] Table rapports (AC: 5)
- [ ] Service ReportBuilderService (AC: 1, 2, 3, 4, 5, 6)
- [ ] ReportsController (AC: 1, 2, 3, 4, 5, 6)
- [ ] Page Report Builder (AC: 1, 2, 3, 4, 5, 6)
- [ ] Composants sections templatisées (AC: 1, 2)
- [ ] Drag & drop sections (AC: 4)
- [ ] Prévisualisation rapport (AC: 6)
- [ ] Tests & Validation

## Dev Notes

### Architecture Report Builder

**Sections Templatisées :**
- Executive Summary
- KPIs Globaux
- Tendances Performance
- Recommandations Actions

**Flux Création :**
1. Admin crée nouveau rapport
2. Sélection sections templatisées
3. Ajout texte libre par section
4. Drag & drop graphes analytics
5. Réorganisation sections
6. Sauvegarde brouillon
7. Prévisualisation
8. Export (Story 8.2)

### Migration Table rapports

```php
Schema::connection('pgsql')->create('rapports', function (Blueprint $table) {
    $table->uuid('id_rapport')->primary();
    $table->string('titre', 200);
    $table->string('createur_matricule', 5);
    $table->jsonb('sections_json'); // Structure sections
    $table->enum('statut', ['brouillon', 'finalise'])->default('brouillon');
    $table->timestamp('date_creation');
    $table->timestamp('date_modification')->nullable();
    $table->timestamps();
});
```

### ReportBuilderService

```php
namespace App\Services;

class ReportBuilderService
{
    public function creerRapport(string $titre, string $createurMatricule): Rapport
    {
        return Rapport::create([
            'id_rapport' => Str::uuid(),
            'titre' => $titre,
            'createur_matricule' => $createurMatricule,
            'sections_json' => [],
            'date_creation' => now(),
        ]);
    }
    
    public function ajouterSection(Rapport $rapport, string $type, array $contenu): Rapport
    {
        $sections = $rapport->sections_json ?? [];
        
        $sections[] = [
            'id' => Str::uuid(),
            'type' => $type,
            'contenu' => $contenu,
            'ordre' => count($sections) + 1,
        ];
        
        $rapport->update(['sections_json' => $sections]);
        
        return $rapport->fresh();
    }
    
    public function reorganiserSections(Rapport $rapport, array $nouvelOrdre): Rapport
    {
        $sections = $rapport->sections_json;
        
        $sectionsReorganisees = [];
        foreach ($nouvelOrdre as $index => $sectionId) {
            $section = collect($sections)->firstWhere('id', $sectionId);
            if ($section) {
                $section['ordre'] = $index + 1;
                $sectionsReorganisees[] = $section;
            }
        }
        
        $rapport->update(['sections_json' => $sectionsReorganisees]);
        
        return $rapport->fresh();
    }
}
```

### References

- [Source: epics.md#Epic 8 Story 8.1]

## Dev Agent Record

### Agent Model Used

_À remplir par le dev agent_

### File List

_À remplir par le dev agent_
