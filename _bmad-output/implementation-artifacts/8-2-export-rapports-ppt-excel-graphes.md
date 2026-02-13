# Story 8.2: Export Rapports (PPT/Excel) et Graphes

Status: ready-for-dev

## Story

En tant qu'administrateur,
Je veux exporter mes rapports en PPT et Excel,
Afin de les partager avec la direction.

## Acceptance Criteria

**Given** j'ai créé un rapport complet
**When** je clique sur "Exporter"
**Then** je peux choisir le format : PowerPoint (.pptx) ou Excel (.xlsx)
**And** l'export PPT contient : slides par section, graphes intégrés, texte formaté
**And** l'export Excel contient : onglets par section, tableaux de données, graphes
**And** je peux exporter un graphe individuellement (PNG, SVG, PDF)
**And** les exports respectent le design system SABC (couleurs, logos)
**And** un historique des exports est conservé avec date et utilisateur

## Tasks / Subtasks

- [ ] Service ExportService (AC: 1, 2, 3, 4, 5, 6)
- [ ] Export PowerPoint avec PHPPresentation (AC: 2)
- [ ] Export Excel avec PhpSpreadsheet (AC: 3)
- [ ] Export graphes individuels (AC: 4)
- [ ] Table historique_exports (AC: 6)
- [ ] ExportsController (AC: 1, 2, 3, 4, 6)
- [ ] Tests & Validation

## Dev Notes

### Architecture Exports

**Formats Supportés :**
- PowerPoint (.pptx) : PHPPresentation
- Excel (.xlsx) : PhpSpreadsheet
- Graphes : PNG, SVG, PDF

**Flux Export :**
1. Admin finalise rapport
2. Clic "Exporter"
3. Sélection format
4. Génération fichier avec design SABC
5. Téléchargement
6. Enregistrement historique

### ExportService

```php
namespace App\Services;

use PhpOffice\PhpPresentation\PhpPresentation;
use PhpOffice\PhpSpreadsheet\Spreadsheet;

class ExportService
{
    public function exporterPowerPoint(Rapport $rapport): string
    {
        $presentation = new PhpPresentation();
        
        // Slide titre
        $slide = $presentation->getActiveSlide();
        $slide->createRichTextShape()
            ->setHeight(100)
            ->setWidth(600)
            ->setOffsetX(100)
            ->setOffsetY(200)
            ->getActiveParagraph()
            ->createTextRun($rapport->titre)
            ->getFont()
            ->setBold(true)
            ->setSize(32)
            ->setColor(new Color('E53E3E')); // Rouge SABC
        
        // Slides par section
        foreach ($rapport->sections_json as $section) {
            $slide = $presentation->createSlide();
            // Ajouter contenu section
        }
        
        $writer = IOFactory::createWriter($presentation, 'PowerPoint2007');
        $filename = storage_path("exports/{$rapport->id_rapport}.pptx");
        $writer->save($filename);
        
        return $filename;
    }
    
    public function exporterExcel(Rapport $rapport): string
    {
        $spreadsheet = new Spreadsheet();
        
        // Onglet par section
        foreach ($rapport->sections_json as $index => $section) {
            if ($index > 0) {
                $spreadsheet->createSheet();
            }
            $sheet = $spreadsheet->setActiveSheetIndex($index);
            $sheet->setTitle(substr($section['type'], 0, 31));
            
            // Ajouter données section
        }
        
        $writer = IOFactory::createWriter($spreadsheet, 'Xlsx');
        $filename = storage_path("exports/{$rapport->id_rapport}.xlsx");
        $writer->save($filename);
        
        return $filename;
    }
}
```

### References

- [Source: epics.md#Epic 8 Story 8.2]

## Dev Agent Record

### Agent Model Used

_À remplir par le dev agent_

### File List

_À remplir par le dev agent_
