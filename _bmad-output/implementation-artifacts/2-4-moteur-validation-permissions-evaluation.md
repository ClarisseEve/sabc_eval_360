# Story 2.4: Moteur de Validation des Permissions d'Évaluation

Status: ready-for-dev

## Story

En tant que système,
Je veux valider automatiquement chaque action d'évaluation,
Afin de bloquer les actions non conformes aux règles.

## Acceptance Criteria

**Given** un utilisateur tente de créer une évaluation
**When** le système valide les permissions
**Then** la validation vérifie : `id_region` identique (évaluateur = évalué)
**And** pour auto-évaluation : `peut_auto_evaluer = true` ET `evaluateur_matricule = evalue_matricule`
**And** pour évaluation pairs : `peut_evaluer_pairs = true` ET même niveau ET même branche (sauf DR/CDTT)
**And** pour évaluation descendante : `peut_evaluer_subordonnes = true` ET `manager_matricule` valide
**And** toute action non conforme est bloquée avec message d'erreur explicite
**And** les tentatives bloquées sont loggées dans `logs_administration`

## Tasks / Subtasks

- [ ] Service EvaluationPermissionValidator (AC: 1, 2, 3, 4, 5, 6)
  - [ ] Créer `app/Services/EvaluationPermissionValidator.php`
  - [ ] Méthode `validateEvaluationPermission()` : Validation complète
  - [ ] Méthode `validateRegionRestriction()` : Même région obligatoire
  - [ ] Méthode `validateAutoEvaluation()` : Règles auto-évaluation
  - [ ] Méthode `validatePeerEvaluation()` : Règles évaluation pairs
  - [ ] Méthode `validateSubordinateEvaluation()` : Règles descendante
  - [ ] Exceptions personnalisées avec messages explicites

- [ ] Middleware ValidateEvaluationPermission (AC: 1, 5, 6)
  - [ ] Créer `app/Http/Middleware/ValidateEvaluationPermission.php`
  - [ ] Interception requêtes création évaluation
  - [ ] Validation automatique avant traitement
  - [ ] Blocage avec HTTP 403 si non conforme
  - [ ] Messages d'erreur explicites JSON

- [ ] Logging Tentatives Bloquées (AC: 6)
  - [ ] Table `logs_administration` MySQL
  - [ ] Colonnes : utilisateur, action, resultat, details_json, adresse_ip
  - [ ] Service `AdminLogService` pour logging
  - [ ] Enregistrement tentatives bloquées
  - [ ] Dashboard admin pour consultation logs

- [ ] Exceptions Personnalisées (AC: 5)
  - [ ] Créer `app/Exceptions/EvaluationPermissionException.php`
  - [ ] Exception `RegionMismatchException`
  - [ ] Exception `AutoEvaluationNotAllowedException`
  - [ ] Exception `PeerEvaluationNotAllowedException`
  - [ ] Exception `SubordinateEvaluationNotAllowedException`
  - [ ] Messages d'erreur français explicites

- [ ] Tests Unitaires Validation (AC: 1, 2, 3, 4, 5)
  - [ ] Test validation région identique
  - [ ] Test auto-évaluation autorisée/bloquée
  - [ ] Test évaluation pairs autorisée/bloquée
  - [ ] Test évaluation descendante autorisée/bloquée
  - [ ] Test exceptions DR/CDTT
  - [ ] Test logging tentatives bloquées

- [ ] Interface Admin Logs (AC: 6)
  - [ ] Page `resources/js/Pages/Admin/Logs/Index.tsx`
  - [ ] Liste tentatives bloquées avec filtres
  - [ ] Détails tentative (utilisateur, action, raison)
  - [ ] Statistiques tentatives par type
  - [ ] Export CSV logs

- [ ] Documentation Validation
  - [ ] Documenter règles validation complètes
  - [ ] Exemples cas d'usage
  - [ ] Diagramme flux validation
  - [ ] Guide troubleshooting erreurs

## Dev Notes

### Architecture Moteur de Validation

**Flux de Validation :**
1. Utilisateur tente créer évaluation
2. Middleware `ValidateEvaluationPermission` intercepte
3. `EvaluationPermissionValidator` valide permissions
4. Si conforme : Continuer traitement
5. Si non conforme : Bloquer + Logger + Erreur 403

**Règles de Validation (Ordre) :**
1. **Région** : `evaluateur.id_region == evalue.id_region`
2. **Type évaluation** : Auto / Pairs / Descendante
3. **Permissions rôle** : Flags `peut_*`
4. **Contraintes métier** : Niveau, branche, manager
5. **Exceptions** : DR/CDTT cross-branch

**Messages d'Erreur Explicites :**
- "Vous ne pouvez évaluer que des utilisateurs de votre région"
- "Votre rôle ne permet pas l'auto-évaluation"
- "Vous ne pouvez évaluer que vos subordonnés directs"
- "Vous ne pouvez évaluer que des pairs de même niveau et branche"

### Migration Table logs_administration

```php
Schema::connection('mysql')->create('logs_administration', function (Blueprint $table) {
    $table->id();
    $table->string('matricule_utilisateur', 5);
    $table->string('action', 100); // 'tentative_evaluation', 'modification_utilisateur', etc.
    $table->enum('resultat', ['succes', 'erreur'])->default('erreur');
    $table->json('details_json')->nullable(); // Détails action tentée
    $table->string('adresse_ip', 45)->nullable();
    $table->text('message_erreur')->nullable();
    $table->timestamps();
    
    $table->index('matricule_utilisateur');
    $table->index('action');
    $table->index('resultat');
    $table->index('created_at');
    
    $table->foreign('matricule_utilisateur')
        ->references('matricule')
        ->on('utilisateurs')
        ->onDelete('cascade');
});
```

### EvaluationPermissionValidator

```php
namespace App\Services;

use App\Models\Utilisateur;
use App\Exceptions\EvaluationPermissionException;
use App\Exceptions\RegionMismatchException;
use App\Exceptions\AutoEvaluationNotAllowedException;
use App\Exceptions\PeerEvaluationNotAllowedException;
use App\Exceptions\SubordinateEvaluationNotAllowedException;

class EvaluationPermissionValidator
{
    protected $eligibilityService;
    protected $adminLogService;
    
    public function __construct(
        EligibilityService $eligibilityService,
        AdminLogService $adminLogService
    ) {
        $this->eligibilityService = $eligibilityService;
        $this->adminLogService = $adminLogService;
    }
    
    /**
     * Valider une permission d'évaluation complète
     */
    public function validateEvaluationPermission(
        Utilisateur $evaluateur,
        Utilisateur $evalue,
        string $type
    ): bool {
        try {
            // 1. Validation région
            $this->validateRegionRestriction($evaluateur, $evalue);
            
            // 2. Validation selon type
            switch ($type) {
                case 'auto':
                    $this->validateAutoEvaluation($evaluateur, $evalue);
                    break;
                
                case 'peer':
                    $this->validatePeerEvaluation($evaluateur, $evalue);
                    break;
                
                case 'subordinate':
                case 'manager':
                    $this->validateSubordinateEvaluation($evaluateur, $evalue);
                    break;
                
                default:
                    throw new EvaluationPermissionException(
                        "Type d'évaluation invalide : {$type}"
                    );
            }
            
            // Logging succès
            $this->adminLogService->logAction(
                $evaluateur->matricule,
                'tentative_evaluation',
                'succes',
                [
                    'evalue_matricule' => $evalue->matricule,
                    'type' => $type,
                ]
            );
            
            return true;
            
        } catch (EvaluationPermissionException $e) {
            // Logging échec
            $this->adminLogService->logAction(
                $evaluateur->matricule,
                'tentative_evaluation',
                'erreur',
                [
                    'evalue_matricule' => $evalue->matricule,
                    'type' => $type,
                    'raison' => $e->getMessage(),
                ],
                $e->getMessage()
            );
            
            throw $e;
        }
    }
    
    /**
     * Valider restriction géographique (même région)
     */
    protected function validateRegionRestriction(
        Utilisateur $evaluateur,
        Utilisateur $evalue
    ): void {
        if ($evaluateur->id_region !== $evalue->id_region) {
            throw new RegionMismatchException(
                "Vous ne pouvez évaluer que des utilisateurs de votre région. " .
                "Votre région : {$evaluateur->region->nom_region}, " .
                "Région de l'évalué : {$evalue->region->nom_region}"
            );
        }
    }
    
    /**
     * Valider auto-évaluation
     */
    protected function validateAutoEvaluation(
        Utilisateur $evaluateur,
        Utilisateur $evalue
    ): void {
        // Vérifier que c'est bien une auto-évaluation
        if ($evaluateur->matricule !== $evalue->matricule) {
            throw new AutoEvaluationNotAllowedException(
                "L'auto-évaluation requiert que l'évaluateur et l'évalué soient la même personne"
            );
        }
        
        // Vérifier permission rôle
        if (!$evaluateur->role->peut_auto_evaluer) {
            throw new AutoEvaluationNotAllowedException(
                "Votre rôle ({$evaluateur->role->nom_role}) ne permet pas l'auto-évaluation"
            );
        }
    }
    
    /**
     * Valider évaluation pairs
     */
    protected function validatePeerEvaluation(
        Utilisateur $evaluateur,
        Utilisateur $evalue
    ): void {
        // Vérifier permission rôle
        if (!$evaluateur->role->peut_evaluer_pairs) {
            throw new PeerEvaluationNotAllowedException(
                "Votre rôle ({$evaluateur->role->nom_role}) ne permet pas l'évaluation de pairs"
            );
        }
        
        // Vérifier que ce n'est pas soi-même
        if ($evaluateur->matricule === $evalue->matricule) {
            throw new PeerEvaluationNotAllowedException(
                "Vous ne pouvez pas vous évaluer en tant que pair. Utilisez l'auto-évaluation."
            );
        }
        
        // Vérifier rôles uniques (DR, CDTT, RTM, SRMO)
        $rolesUniques = ['DR', 'CDTT', 'RTM', 'SRMO'];
        if (in_array($evaluateur->role->nom_role, $rolesUniques)) {
            throw new PeerEvaluationNotAllowedException(
                "Les rôles uniques par région ({$evaluateur->role->nom_role}) ne peuvent pas évaluer leurs pairs"
            );
        }
        
        // Vérifier même niveau hiérarchique
        if ($evaluateur->role->niveau_hierarchique !== $evalue->role->niveau_hierarchique) {
            throw new PeerEvaluationNotAllowedException(
                "Vous ne pouvez évaluer que des pairs de même niveau hiérarchique. " .
                "Votre niveau : {$evaluateur->role->niveau_hierarchique}, " .
                "Niveau de l'évalué : {$evalue->role->niveau_hierarchique}"
            );
        }
        
        // Vérifier même branche
        if ($evaluateur->id_branche !== $evalue->id_branche) {
            throw new PeerEvaluationNotAllowedException(
                "Vous ne pouvez évaluer que des pairs de la même branche. " .
                "Votre branche : {$evaluateur->branche->nom_branche}, " .
                "Branche de l'évalué : {$evalue->branche->nom_branche}"
            );
        }
    }
    
    /**
     * Valider évaluation descendante (manager → subordonné)
     */
    protected function validateSubordinateEvaluation(
        Utilisateur $evaluateur,
        Utilisateur $evalue
    ): void {
        // Vérifier permission rôle
        if (!$evaluateur->role->peut_evaluer_subordonnes) {
            throw new SubordinateEvaluationNotAllowedException(
                "Votre rôle ({$evaluateur->role->nom_role}) ne permet pas l'évaluation de subordonnés"
            );
        }
        
        // Vérifier lien hiérarchique
        // Pour DR/CDTT : vérifier hiérarchie récursive (cross-branch)
        if ($evaluateur->role->peut_cross_branch) {
            if (!$this->eligibilityService->isInHierarchy($evaluateur, $evalue)) {
                throw new SubordinateEvaluationNotAllowedException(
                    "Vous ne pouvez évaluer que vos subordonnés (directs ou indirects) dans votre région"
                );
            }
        } else {
            // Autres rôles : lien hiérarchique direct uniquement
            if ($evalue->manager_matricule !== $evaluateur->matricule) {
                throw new SubordinateEvaluationNotAllowedException(
                    "Vous ne pouvez évaluer que vos subordonnés directs. " .
                    "Le manager de {$evalue->nom_complet} est : " .
                    ($evalue->manager ? $evalue->manager->nom_complet : 'Non défini')
                );
            }
        }
    }
}
```

### Middleware ValidateEvaluationPermission

```php
namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use App\Services\EvaluationPermissionValidator;
use App\Models\Utilisateur;
use App\Exceptions\EvaluationPermissionException;

class ValidateEvaluationPermission
{
    protected $validator;
    
    public function __construct(EvaluationPermissionValidator $validator)
    {
        $this->validator = $validator;
    }
    
    public function handle(Request $request, Closure $next)
    {
        // Récupérer évaluateur (utilisateur connecté)
        $evaluateur = $request->user();
        
        // Récupérer évalué depuis la requête
        $evalueMatricule = $request->input('evalue_matricule');
        $evalue = Utilisateur::findOrFail($evalueMatricule);
        
        // Récupérer type évaluation
        $type = $request->input('type_evaluation', 'subordinate');
        
        try {
            // Valider permission
            $this->validator->validateEvaluationPermission(
                $evaluateur,
                $evalue,
                $type
            );
            
            // Permission validée : continuer
            return $next($request);
            
        } catch (EvaluationPermissionException $e) {
            // Permission refusée : bloquer avec erreur 403
            return response()->json([
                'message' => 'Permission refusée',
                'error' => $e->getMessage(),
                'code' => 'EVALUATION_PERMISSION_DENIED',
            ], 403);
        }
    }
}
```

### AdminLogService

```php
namespace App\Services;

use App\Models\LogAdministration;
use Illuminate\Support\Facades\Request;

class AdminLogService
{
    /**
     * Logger une action administrative
     */
    public function logAction(
        string $matricule,
        string $action,
        string $resultat = 'succes',
        array $details = [],
        ?string $messageErreur = null
    ): void {
        LogAdministration::create([
            'matricule_utilisateur' => $matricule,
            'action' => $action,
            'resultat' => $resultat,
            'details_json' => $details,
            'adresse_ip' => Request::ip(),
            'message_erreur' => $messageErreur,
        ]);
    }
    
    /**
     * Obtenir statistiques tentatives bloquées
     */
    public function getBlockedAttemptsStats(int $days = 30): array
    {
        $startDate = now()->subDays($days);
        
        $stats = LogAdministration::where('resultat', 'erreur')
            ->where('created_at', '>=', $startDate)
            ->selectRaw('action, COUNT(*) as count')
            ->groupBy('action')
            ->get();
        
        return [
            'total_blocked' => $stats->sum('count'),
            'by_action' => $stats->pluck('count', 'action')->toArray(),
            'period_days' => $days,
        ];
    }
}
```

### Modèle LogAdministration

```php
namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class LogAdministration extends Model
{
    protected $connection = 'mysql'; // sabc_core
    protected $table = 'logs_administration';
    
    protected $fillable = [
        'matricule_utilisateur',
        'action',
        'resultat',
        'details_json',
        'adresse_ip',
        'message_erreur',
    ];
    
    protected $casts = [
        'details_json' => 'array',
    ];
    
    // Relations
    public function utilisateur()
    {
        return $this->belongsTo(Utilisateur::class, 'matricule_utilisateur', 'matricule');
    }
    
    // Scopes
    public function scopeErreurs($query)
    {
        return $query->where('resultat', 'erreur');
    }
    
    public function scopeSucces($query)
    {
        return $query->where('resultat', 'succes');
    }
    
    public function scopeByAction($query, string $action)
    {
        return $query->where('action', $action);
    }
}
```

### Exceptions Personnalisées

```php
namespace App\Exceptions;

class EvaluationPermissionException extends \Exception
{
    //
}

class RegionMismatchException extends EvaluationPermissionException
{
    //
}

class AutoEvaluationNotAllowedException extends EvaluationPermissionException
{
    //
}

class PeerEvaluationNotAllowedException extends EvaluationPermissionException
{
    //
}

class SubordinateEvaluationNotAllowedException extends EvaluationPermissionException
{
    //
}
```

### Tests Unitaires

```php
namespace Tests\Unit\Services;

use Tests\TestCase;
use App\Models\Utilisateur;
use App\Models\Role;
use App\Services\EvaluationPermissionValidator;
use App\Exceptions\RegionMismatchException;
use App\Exceptions\AutoEvaluationNotAllowedException;
use App\Exceptions\PeerEvaluationNotAllowedException;
use App\Exceptions\SubordinateEvaluationNotAllowedException;
use Illuminate\Foundation\Testing\RefreshDatabase;

class EvaluationPermissionValidatorTest extends TestCase
{
    use RefreshDatabase;
    
    protected $validator;
    
    protected function setUp(): void
    {
        parent::setUp();
        $this->validator = app(EvaluationPermissionValidator::class);
    }
    
    /** @test */
    public function blocks_evaluation_across_different_regions()
    {
        $evaluateur = Utilisateur::factory()->create(['id_region' => 1]);
        $evalue = Utilisateur::factory()->create(['id_region' => 2]);
        
        $this->expectException(RegionMismatchException::class);
        
        $this->validator->validateEvaluationPermission($evaluateur, $evalue, 'subordinate');
    }
    
    /** @test */
    public function allows_auto_evaluation_when_permitted()
    {
        $user = Utilisateur::factory()->create([
            'id_role' => Role::where('nom_role', 'CSC')->first()->id_role,
        ]);
        
        $result = $this->validator->validateEvaluationPermission($user, $user, 'auto');
        
        $this->assertTrue($result);
    }
    
    /** @test */
    public function blocks_auto_evaluation_for_dr()
    {
        $dr = Utilisateur::factory()->create([
            'id_role' => Role::where('nom_role', 'DR')->first()->id_role,
        ]);
        
        $this->expectException(AutoEvaluationNotAllowedException::class);
        
        $this->validator->validateEvaluationPermission($dr, $dr, 'auto');
    }
    
    /** @test */
    public function blocks_peer_evaluation_for_different_levels()
    {
        $csc = Utilisateur::factory()->create([
            'id_role' => Role::where('nom_role', 'CSC')->first()->id_role,
            'id_region' => 1,
            'id_branche' => 1,
        ]);
        
        $cdv = Utilisateur::factory()->create([
            'id_role' => Role::where('nom_role', 'CDV')->first()->id_role,
            'id_region' => 1,
            'id_branche' => 1,
        ]);
        
        $this->expectException(PeerEvaluationNotAllowedException::class);
        
        $this->validator->validateEvaluationPermission($csc, $cdv, 'peer');
    }
    
    /** @test */
    public function allows_subordinate_evaluation_with_valid_hierarchy()
    {
        $manager = Utilisateur::factory()->create([
            'id_role' => Role::where('nom_role', 'CSC')->first()->id_role,
        ]);
        
        $subordinate = Utilisateur::factory()->create([
            'manager_matricule' => $manager->matricule,
            'id_region' => $manager->id_region,
        ]);
        
        $result = $this->validator->validateEvaluationPermission(
            $manager,
            $subordinate,
            'subordinate'
        );
        
        $this->assertTrue($result);
    }
    
    /** @test */
    public function blocks_subordinate_evaluation_without_hierarchy_link()
    {
        $manager = Utilisateur::factory()->create();
        $notSubordinate = Utilisateur::factory()->create([
            'id_region' => $manager->id_region,
        ]);
        
        $this->expectException(SubordinateEvaluationNotAllowedException::class);
        
        $this->validator->validateEvaluationPermission(
            $manager,
            $notSubordinate,
            'subordinate'
        );
    }
    
    /** @test */
    public function logs_blocked_attempts()
    {
        $evaluateur = Utilisateur::factory()->create(['id_region' => 1]);
        $evalue = Utilisateur::factory()->create(['id_region' => 2]);
        
        try {
            $this->validator->validateEvaluationPermission($evaluateur, $evalue, 'subordinate');
        } catch (\Exception $e) {
            // Exception attendue
        }
        
        $this->assertDatabaseHas('logs_administration', [
            'matricule_utilisateur' => $evaluateur->matricule,
            'action' => 'tentative_evaluation',
            'resultat' => 'erreur',
        ]);
    }
}
```

### Page Admin Logs

```tsx
// resources/js/Pages/Admin/Logs/Index.tsx
import { useState } from 'react';
import { Card } from '@/Components/UI/Card';
import { Badge } from '@/Components/UI/Badge';
import { AlertCircle, CheckCircle, Filter } from 'lucide-react';

interface Log {
    id: number;
    matricule_utilisateur: string;
    utilisateur_nom: string;
    action: string;
    resultat: 'succes' | 'erreur';
    details_json: any;
    message_erreur?: string;
    adresse_ip: string;
    created_at: string;
}

interface Props {
    logs: Log[];
    stats: {
        total_blocked: number;
        by_action: Record<string, number>;
    };
}

export default function LogsIndex({ logs, stats }: Props) {
    const [filter, setFilter] = useState<'all' | 'erreur' | 'succes'>('all');
    
    const filteredLogs = filter === 'all' 
        ? logs 
        : logs.filter(log => log.resultat === filter);
    
    return (
        <div className="p-6">
            <h1 className="text-2xl font-bold text-sabc-gray-900 mb-6 font-poppins">
                Logs Administration
            </h1>
            
            {/* Statistiques */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                <Card className="p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-sabc-gray-600">Total Tentatives Bloquées</p>
                            <p className="text-3xl font-bold text-sabc-error mt-2">
                                {stats.total_blocked}
                            </p>
                        </div>
                        <AlertCircle size={40} className="text-sabc-error" />
                    </div>
                </Card>
                
                <Card className="p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-sabc-gray-600">Tentatives Évaluation</p>
                            <p className="text-3xl font-bold text-sabc-accent mt-2">
                                {stats.by_action['tentative_evaluation'] || 0}
                            </p>
                        </div>
                        <Filter size={40} className="text-sabc-accent" />
                    </div>
                </Card>
                
                <Card className="p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-sabc-gray-600">Période</p>
                            <p className="text-3xl font-bold text-sabc-gray-900 mt-2">
                                30 jours
                            </p>
                        </div>
                    </div>
                </Card>
            </div>
            
            {/* Filtres */}
            <Card className="p-4 mb-6">
                <div className="flex items-center space-x-4">
                    <span className="text-sm font-medium text-sabc-gray-800">Filtrer :</span>
                    <button
                        onClick={() => setFilter('all')}
                        className={`px-4 py-2 rounded-lg ${
                            filter === 'all' 
                                ? 'bg-sabc-red-primary text-white' 
                                : 'bg-sabc-gray-100 text-sabc-gray-800'
                        }`}
                    >
                        Tous
                    </button>
                    <button
                        onClick={() => setFilter('erreur')}
                        className={`px-4 py-2 rounded-lg ${
                            filter === 'erreur' 
                                ? 'bg-sabc-error text-white' 
                                : 'bg-sabc-gray-100 text-sabc-gray-800'
                        }`}
                    >
                        Erreurs
                    </button>
                    <button
                        onClick={() => setFilter('succes')}
                        className={`px-4 py-2 rounded-lg ${
                            filter === 'succes' 
                                ? 'bg-sabc-success text-white' 
                                : 'bg-sabc-gray-100 text-sabc-gray-800'
                        }`}
                    >
                        Succès
                    </button>
                </div>
            </Card>
            
            {/* Liste logs */}
            <Card className="overflow-x-auto">
                <table className="w-full">
                    <thead>
                        <tr className="border-b-2 border-sabc-gray-200">
                            <th className="text-left p-4 font-semibold text-sabc-gray-900">Date</th>
                            <th className="text-left p-4 font-semibold text-sabc-gray-900">Utilisateur</th>
                            <th className="text-left p-4 font-semibold text-sabc-gray-900">Action</th>
                            <th className="text-left p-4 font-semibold text-sabc-gray-900">Résultat</th>
                            <th className="text-left p-4 font-semibold text-sabc-gray-900">Message</th>
                            <th className="text-left p-4 font-semibold text-sabc-gray-900">IP</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredLogs.map((log) => (
                            <tr key={log.id} className="border-b border-sabc-gray-100">
                                <td className="p-4 text-sm text-sabc-gray-800">
                                    {new Date(log.created_at).toLocaleString('fr-FR')}
                                </td>
                                <td className="p-4">
                                    <div>
                                        <div className="font-medium text-sabc-gray-900">
                                            {log.utilisateur_nom}
                                        </div>
                                        <div className="text-sm text-sabc-gray-600">
                                            {log.matricule_utilisateur}
                                        </div>
                                    </div>
                                </td>
                                <td className="p-4 text-sm text-sabc-gray-800">
                                    {log.action}
                                </td>
                                <td className="p-4">
                                    {log.resultat === 'erreur' ? (
                                        <Badge variant="danger">
                                            <AlertCircle size={14} className="mr-1" />
                                            Erreur
                                        </Badge>
                                    ) : (
                                        <Badge variant="success">
                                            <CheckCircle size={14} className="mr-1" />
                                            Succès
                                        </Badge>
                                    )}
                                </td>
                                <td className="p-4 text-sm text-sabc-gray-800">
                                    {log.message_erreur || '-'}
                                </td>
                                <td className="p-4 text-sm text-sabc-gray-600">
                                    {log.adresse_ip}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </Card>
        </div>
    );
}
```

### Project Structure Notes

**Fichiers à créer :**
- `database/migrations/xxxx_create_logs_administration_table.php`
- `app/Models/LogAdministration.php`
- `app/Services/EvaluationPermissionValidator.php`
- `app/Services/AdminLogService.php`
- `app/Http/Middleware/ValidateEvaluationPermission.php`
- `app/Exceptions/EvaluationPermissionException.php`
- `app/Exceptions/RegionMismatchException.php`
- `app/Exceptions/AutoEvaluationNotAllowedException.php`
- `app/Exceptions/PeerEvaluationNotAllowedException.php`
- `app/Exceptions/SubordinateEvaluationNotAllowedException.php`
- `tests/Unit/Services/EvaluationPermissionValidatorTest.php`
- `resources/js/Pages/Admin/Logs/Index.tsx`
- `app/Http/Controllers/Admin/LogsController.php`

**Fichiers à modifier :**
- `app/Http/Kernel.php` : Enregistrer middleware ValidateEvaluationPermission
- `routes/web.php` : Ajouter routes logs administration
- `app/Providers/AppServiceProvider.php` : Enregistrer services

**Dépendances Stories Précédentes :**
- Story 2.2 : EligibilityService de base
- Story 2.3 : Exceptions DR/CDTT, méthode isInHierarchy
- Story 1.5 : Table utilisateurs avec manager_matricule

### Règles Métier SABC Critiques

**Ordre de Validation :**
1. Région identique (obligatoire)
2. Type évaluation valide
3. Permissions rôle
4. Contraintes métier (niveau, branche, manager)
5. Exceptions spéciales (DR/CDTT)

**Messages d'Erreur Explicites :**
- Français uniquement
- Détails précis (région, rôle, niveau)
- Suggestions d'action si possible

**Logging Obligatoire :**
- Toutes tentatives bloquées
- Détails complets (évaluateur, évalué, type, raison)
- Adresse IP pour audit
- Timestamp précis

**Performance :**
- Validation synchrone (< 100ms)
- Cache permissions rôle
- Index sur logs_administration

### References

- [Source: epics.md#Epic 2 Story 2.4] - Acceptance criteria complets
- [Source: business-logic-rules.md#Règles d'Évaluation] - Matrice permissions complète
- [Source: business-logic-rules.md#Audit et Suivi] - Logging tentatives
- [Source: architecture.md#Security Governance] - Validation permissions
- [Source: project-context.md#Critical Implementation Rules] - Tests unitaires obligatoires

## Dev Agent Record

### Agent Model Used

_À remplir par le dev agent_

### Debug Log References

_À remplir par le dev agent_

### Completion Notes List

_À remplir par le dev agent_

### File List

_À remplir par le dev agent_
