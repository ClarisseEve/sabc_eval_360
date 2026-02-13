# Story 8.3: Logs d'Audit et Traçabilité

Status: ready-for-dev

## Story

En tant qu'administrateur,
Je veux consulter les logs d'audit complets,
Afin d'assurer la conformité et le diagnostic.

## Acceptance Criteria

**Given** je suis connecté en tant qu'admin
**When** j'accède aux "Logs d'Audit"
**Then** je vois tous les logs de `logs_administration` avec : date, utilisateur, action, résultat, adresse IP
**And** je peux filtrer par : date, utilisateur, type d'action (création, modification, suppression, accès)
**And** je peux filtrer par résultat (succès, erreur)
**And** les tentatives d'accès non autorisées sont marquées en rouge
**And** je peux exporter les logs en CSV pour analyse externe
**And** les logs sont conservés pendant 2 ans (politique de rétention)

## Tasks / Subtasks

- [ ] Page Admin Logs Audit (AC: 1, 2, 3, 4, 5)
- [ ] AuditLogsController (AC: 1, 2, 3, 4, 5)
- [ ] Service AuditLogsService (AC: 1, 2, 3, 5, 6)
- [ ] Composant TableLogsAudit (AC: 1, 2, 3, 4)
- [ ] Composant FiltresLogsAudit (AC: 2, 3)
- [ ] Export CSV logs (AC: 5)
- [ ] Scheduled Job CleanupOldLogs (AC: 6)
- [ ] Tests & Validation

## Dev Notes

### Architecture Logs Audit

**Données Affichées :**
- Date/heure action
- Utilisateur (matricule + nom)
- Type action (création, modification, suppression, accès)
- Résultat (succès, erreur)
- Adresse IP
- Détails action (data_json)

**Filtres :**
- Période (date début - date fin)
- Utilisateur (dropdown)
- Type action (checkboxes)
- Résultat (succès/erreur)

**Export CSV :**
- Toutes colonnes
- Filtres appliqués
- Format UTF-8 avec BOM

### AuditLogsService

```php
namespace App\Services;

use App\Models\LogAdministration;
use Carbon\Carbon;

class AuditLogsService
{
    public function getLogs(array $filters = []): \Illuminate\Pagination\LengthAwarePaginator
    {
        $query = LogAdministration::with('utilisateur')
            ->orderBy('date_action', 'desc');
        
        // Filtre période
        if (isset($filters['date_debut'])) {
            $query->where('date_action', '>=', $filters['date_debut']);
        }
        if (isset($filters['date_fin'])) {
            $query->where('date_action', '<=', $filters['date_fin']);
        }
        
        // Filtre utilisateur
        if (isset($filters['matricule'])) {
            $query->where('matricule_utilisateur', $filters['matricule']);
        }
        
        // Filtre type action
        if (isset($filters['type_action']) && !empty($filters['type_action'])) {
            $query->whereIn('type_action', $filters['type_action']);
        }
        
        // Filtre résultat
        if (isset($filters['resultat'])) {
            $query->where('resultat', $filters['resultat']);
        }
        
        return $query->paginate(50);
    }
    
    public function exporterCSV(array $filters = []): string
    {
        $logs = $this->getLogs($filters)->items();
        
        $filename = storage_path('exports/logs_audit_' . now()->format('Y-m-d_His') . '.csv');
        $file = fopen($filename, 'w');
        
        // BOM UTF-8
        fprintf($file, chr(0xEF).chr(0xBB).chr(0xBF));
        
        // En-têtes
        fputcsv($file, [
            'Date',
            'Utilisateur',
            'Type Action',
            'Résultat',
            'Adresse IP',
            'Détails',
        ]);
        
        // Données
        foreach ($logs as $log) {
            fputcsv($file, [
                $log->date_action->format('Y-m-d H:i:s'),
                $log->utilisateur->nom_complet ?? $log->matricule_utilisateur,
                $log->type_action,
                $log->resultat,
                $log->adresse_ip,
                json_encode($log->data_json),
            ]);
        }
        
        fclose($file);
        
        return $filename;
    }
    
    public function nettoyerLogsAnciens(): int
    {
        $dateLimit = Carbon::now()->subYears(2);
        
        return LogAdministration::where('date_action', '<', $dateLimit)->delete();
    }
}
```

### Scheduled Job CleanupOldLogs

```php
namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Services\AuditLogsService;

class CleanupOldLogs extends Command
{
    protected $signature = 'logs:cleanup';
    protected $description = 'Nettoyer les logs d\'audit de plus de 2 ans';
    
    protected $auditService;
    
    public function __construct(AuditLogsService $auditService)
    {
        parent::__construct();
        $this->auditService = $auditService;
    }
    
    public function handle()
    {
        $nbSupprimes = $this->auditService->nettoyerLogsAnciens();
        
        $this->info("Logs supprimés : {$nbSupprimes}");
        
        return 0;
    }
}
```

### References

- [Source: epics.md#Epic 8 Story 8.3]
- [Source: business-logic-rules.md#Audit]

## Dev Agent Record

### Agent Model Used

_À remplir par le dev agent_

### File List

_À remplir par le dev agent_
