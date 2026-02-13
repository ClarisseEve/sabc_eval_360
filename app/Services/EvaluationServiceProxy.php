<?php

declare(strict_types=1);

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Cache;
use Illuminate\Http\Client\Response;
use Illuminate\Http\Client\RequestException;
use OpenTracing\Formats;
use OpenTracing\GlobalTracer;

/**
 * Strangler Pattern Proxy for Evaluation Microservice
 *
 * This proxy intercepts evaluation requests and routes them to either:
 * - The new Go microservice (for implemented features)
 * - The legacy Laravel implementation (for non-migrated features)
 *
 * Feature flags control which service handles each operation.
 */
class EvaluationServiceProxy
{
    private string $serviceUrl;
    private string $serviceKey;
    private bool $microserviceEnabled;

    // Feature flags for gradual migration
    private array $migratedFeatures = [
        'create_evaluation' => true,
        'get_evaluation' => true,
        'update_notes' => true,
        'submit_evaluation' => true,
        'validate_evaluation' => true,
        'list_evaluations' => true,
        'get_pending' => true,
        'get_to_validate' => true,
        'get_active_periodes' => true,
        'get_user_score' => true,
    ];

    public function __construct()
    {
        $this->serviceUrl = config('services.evaluation.url', env('EVALUATION_SERVICE_URL', 'http://evaluation-service:8080'));
        $this->serviceKey = config('services.evaluation.key', env('EVALUATION_SERVICE_KEY', 'internal-service-key'));
        $this->microserviceEnabled = config('services.evaluation.enabled', env('EVALUATION_MICROSERVICE_ENABLED', false));
    }

    /**
     * Check if microservice should handle a specific feature
     */
    public function shouldUseMicroservice(string $feature): bool
    {
        if (!$this->microserviceEnabled) {
            return false;
        }

        return $this->migratedFeatures[$feature] ?? false;
    }

    /**
     * Create a new evaluation
     */
    public function createEvaluation(array $data): array
    {
        if (!$this->shouldUseMicroservice('create_evaluation')) {
            return $this->fallbackToLegacy('create', $data);
        }

        try {
            $response = $this->post('/api/v2/evaluations', $data);
            return $this->handleResponse($response);
        } catch (RequestException $e) {
            Log::warning('Evaluation microservice failed, falling back to legacy', [
                'error' => $e->getMessage(),
                'operation' => 'createEvaluation',
            ]);
            return $this->fallbackToLegacy('create', $data);
        }
    }

    /**
     * Get evaluation by ID
     */
    public function getEvaluation(string $id): ?array
    {
        if (!$this->shouldUseMicroservice('get_evaluation')) {
            return $this->fallbackToLegacy('get', ['id' => $id]);
        }

        try {
            $response = $this->get("/api/v2/evaluations/{$id}");
            $result = $this->handleResponse($response);
            return $result['data'] ?? null;
        } catch (RequestException $e) {
            Log::warning('Evaluation microservice failed, falling back to legacy', [
                'error' => $e->getMessage(),
                'operation' => 'getEvaluation',
                'id' => $id,
            ]);
            return $this->fallbackToLegacy('get', ['id' => $id]);
        }
    }

    /**
     * Update evaluation notes
     */
    public function updateNotes(string $id, array $notes, string $commentaire = ''): array
    {
        if (!$this->shouldUseMicroservice('update_notes')) {
            return $this->fallbackToLegacy('updateNotes', [
                'id' => $id,
                'notes' => $notes,
                'commentaire' => $commentaire,
            ]);
        }

        try {
            $response = $this->put("/api/v2/evaluations/{$id}", [
                'notes' => $notes,
                'commentaire_general' => $commentaire,
            ]);
            return $this->handleResponse($response);
        } catch (RequestException $e) {
            Log::warning('Evaluation microservice failed, falling back to legacy', [
                'error' => $e->getMessage(),
                'operation' => 'updateNotes',
                'id' => $id,
            ]);
            return $this->fallbackToLegacy('updateNotes', [
                'id' => $id,
                'notes' => $notes,
                'commentaire' => $commentaire,
            ]);
        }
    }

    /**
     * Submit evaluation for validation
     */
    public function submitEvaluation(string $id): array
    {
        if (!$this->shouldUseMicroservice('submit_evaluation')) {
            return $this->fallbackToLegacy('submit', ['id' => $id]);
        }

        try {
            $response = $this->post("/api/v2/evaluations/{$id}/submit", []);
            return $this->handleResponse($response);
        } catch (RequestException $e) {
            Log::warning('Evaluation microservice failed, falling back to legacy', [
                'error' => $e->getMessage(),
                'operation' => 'submitEvaluation',
                'id' => $id,
            ]);
            return $this->fallbackToLegacy('submit', ['id' => $id]);
        }
    }

    /**
     * Validate or reject evaluation
     */
    public function validateEvaluation(string $id, bool $approved, string $commentaire = ''): array
    {
        if (!$this->shouldUseMicroservice('validate_evaluation')) {
            return $this->fallbackToLegacy('validate', [
                'id' => $id,
                'approved' => $approved,
                'commentaire' => $commentaire,
            ]);
        }

        try {
            $response = $this->post("/api/v2/evaluations/{$id}/validate", [
                'est_valide' => $approved,
                'commentaire' => $commentaire,
            ]);
            return $this->handleResponse($response);
        } catch (RequestException $e) {
            Log::warning('Evaluation microservice failed, falling back to legacy', [
                'error' => $e->getMessage(),
                'operation' => 'validateEvaluation',
                'id' => $id,
            ]);
            return $this->fallbackToLegacy('validate', [
                'id' => $id,
                'approved' => $approved,
                'commentaire' => $commentaire,
            ]);
        }
    }

    /**
     * List evaluations with filters
     */
    public function listEvaluations(array $filters = []): array
    {
        if (!$this->shouldUseMicroservice('list_evaluations')) {
            return $this->fallbackToLegacy('list', $filters);
        }

        try {
            $response = $this->get('/api/v2/evaluations', $filters);
            return $this->handleResponse($response);
        } catch (RequestException $e) {
            Log::warning('Evaluation microservice failed, falling back to legacy', [
                'error' => $e->getMessage(),
                'operation' => 'listEvaluations',
            ]);
            return $this->fallbackToLegacy('list', $filters);
        }
    }

    /**
     * Get pending evaluations to complete
     */
    public function getPendingEvaluations(): array
    {
        if (!$this->shouldUseMicroservice('get_pending')) {
            return $this->fallbackToLegacy('pending', []);
        }

        try {
            $response = $this->get('/api/v2/evaluations/pending');
            return $this->handleResponse($response);
        } catch (RequestException $e) {
            Log::warning('Evaluation microservice failed, falling back to legacy', [
                'error' => $e->getMessage(),
                'operation' => 'getPendingEvaluations',
            ]);
            return $this->fallbackToLegacy('pending', []);
        }
    }

    /**
     * Get evaluations awaiting validation
     */
    public function getEvaluationsToValidate(): array
    {
        if (!$this->shouldUseMicroservice('get_to_validate')) {
            return $this->fallbackToLegacy('toValidate', []);
        }

        try {
            $response = $this->get('/api/v2/evaluations/to-validate');
            return $this->handleResponse($response);
        } catch (RequestException $e) {
            Log::warning('Evaluation microservice failed, falling back to legacy', [
                'error' => $e->getMessage(),
                'operation' => 'getEvaluationsToValidate',
            ]);
            return $this->fallbackToLegacy('toValidate', []);
        }
    }

    /**
     * Get active evaluation periods
     */
    public function getActivePeriodes(): array
    {
        if (!$this->shouldUseMicroservice('get_active_periodes')) {
            return $this->fallbackToLegacy('activePeriodes', []);
        }

        // Cache active periods for 5 minutes
        return Cache::remember('evaluation_active_periodes', 300, function () {
            try {
                $response = $this->get('/api/v2/periodes', ['active_only' => true]);
                $result = $this->handleResponse($response);
                return $result['data'] ?? [];
            } catch (RequestException $e) {
                Log::warning('Evaluation microservice failed, falling back to legacy', [
                    'error' => $e->getMessage(),
                    'operation' => 'getActivePeriodes',
                ]);
                return $this->fallbackToLegacy('activePeriodes', []);
            }
        });
    }

    /**
     * Get user score for a period
     */
    public function getUserScore(string $matricule, string $periodeId): ?array
    {
        if (!$this->shouldUseMicroservice('get_user_score')) {
            return $this->fallbackToLegacy('userScore', [
                'matricule' => $matricule,
                'periode_id' => $periodeId,
            ]);
        }

        try {
            $response = $this->get("/api/v2/scores/{$matricule}", [
                'id_periode' => $periodeId,
            ]);
            $result = $this->handleResponse($response);
            return $result['data'] ?? null;
        } catch (RequestException $e) {
            Log::warning('Evaluation microservice failed, falling back to legacy', [
                'error' => $e->getMessage(),
                'operation' => 'getUserScore',
                'matricule' => $matricule,
            ]);
            return $this->fallbackToLegacy('userScore', [
                'matricule' => $matricule,
                'periode_id' => $periodeId,
            ]);
        }
    }

    /**
     * Check service health
     */
    public function healthCheck(): bool
    {
        try {
            $response = Http::timeout(5)
                ->get("{$this->serviceUrl}/health");

            return $response->successful() &&
                   ($response->json('status') === 'healthy');
        } catch (\Exception $e) {
            Log::error('Evaluation service health check failed', [
                'error' => $e->getMessage(),
            ]);
            return false;
        }
    }

    // ==========================================================================
    // HTTP Client Methods
    // ==========================================================================

    private function get(string $endpoint, array $query = []): Response
    {
        return Http::timeout(30)
            ->withHeaders($this->getHeaders())
            ->get("{$this->serviceUrl}{$endpoint}", $query)
            ->throw();
    }

    private function post(string $endpoint, array $data): Response
    {
        return Http::timeout(30)
            ->withHeaders($this->getHeaders())
            ->post("{$this->serviceUrl}{$endpoint}", $data)
            ->throw();
    }

    private function put(string $endpoint, array $data): Response
    {
        return Http::timeout(30)
            ->withHeaders($this->getHeaders())
            ->put("{$this->serviceUrl}{$endpoint}", $data)
            ->throw();
    }

    private function getHeaders(): array
    {
        $headers = [
            'Accept' => 'application/json',
            'Content-Type' => 'application/json',
            'X-Service-Key' => $this->serviceKey,
        ];

        if (app()->bound('tracing.span')) {
            $span = app('tracing.span');
            $carrier = [];
            GlobalTracer::get()->inject($span->getContext(), Formats::HTTP_HEADERS, $carrier);
            $headers = array_merge($headers, $carrier);
        }

        // Forward user authentication if available
        if (auth()->check()) {
            $user = auth()->user();
            $headers['X-User-Matricule'] = $user->matricule ?? '';
            $headers['X-User-Role'] = $user->role ?? '';
            $headers['X-User-ID'] = (string) ($user->id ?? '');
        }

        return $headers;
    }

    private function handleResponse(Response $response): array
    {
        $data = $response->json();

        if (!($data['success'] ?? false)) {
            throw new \RuntimeException(
                $data['error']['message'] ?? 'Unknown error from evaluation service'
            );
        }

        return $data;
    }

    // ==========================================================================
    // Legacy Fallback
    // ==========================================================================

    /**
     * Fallback to legacy Laravel implementation
     * This allows gradual migration without breaking existing functionality
     */
    private function fallbackToLegacy(string $operation, array $data): array
    {
        Log::info('Using legacy evaluation service', [
            'operation' => $operation,
        ]);

        // Call the original EvaluationService
        $legacyService = app(EvaluationService::class);

        switch ($operation) {
            case 'create':
                $evaluation = $legacyService->creerEvaluation(
                    $data['evaluateur_matricule'] ?? auth()->user()->matricule,
                    $data['evalue_matricule'],
                    $data['id_periode'],
                    $data['id_regle']
                );
                return ['success' => true, 'data' => $evaluation];

            case 'get':
                $evaluation = \App\Models\Evaluation::find($data['id']);
                return $evaluation ? $evaluation->toArray() : null;

            case 'updateNotes':
                $legacyService->mettreAJourNotes(
                    $data['id'],
                    $data['notes'],
                    $data['commentaire']
                );
                return ['success' => true];

            case 'submit':
                $legacyService->soumettrePourValidation($data['id']);
                return ['success' => true];

            case 'validate':
                $legacyService->validerEvaluation(
                    $data['id'],
                    auth()->user()->matricule,
                    $data['approved'],
                    $data['commentaire']
                );
                return ['success' => true];

            case 'list':
                $evaluations = $legacyService->getEvaluationsEnAttente(
                    auth()->user()->matricule
                );
                return ['success' => true, 'data' => $evaluations];

            case 'pending':
                $evaluations = $legacyService->getEvaluationsEnAttente(
                    auth()->user()->matricule
                );
                return ['success' => true, 'data' => $evaluations];

            case 'toValidate':
                $evaluations = $legacyService->getEvaluationsAValider(
                    auth()->user()->matricule
                );
                return ['success' => true, 'data' => $evaluations];

            case 'activePeriodes':
                $periodes = \App\Models\PeriodeEvaluation::where('statut', 'ouverte')
                    ->where('est_ouverte', true)
                    ->where('est_cloturee', false)
                    ->get();
                return $periodes->toArray();

            case 'userScore':
                $score = \App\Models\ScoreUtilisateur::where('matricule', $data['matricule'])
                    ->where('id_periode', $data['periode_id'])
                    ->first();
                return $score ? $score->toArray() : null;

            default:
                throw new \InvalidArgumentException("Unknown legacy operation: {$operation}");
        }
    }
}
