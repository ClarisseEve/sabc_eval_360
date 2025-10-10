<?php

namespace App\Http\Middleware;

use Illuminate\Foundation\Inspiring;
use Illuminate\Http\Request;
use Illuminate\Support\Arr;
use Inertia\Middleware;
use Tighten\Ziggy\Ziggy;

class HandleInertiaRequests extends Middleware
{
    /**
     * The root template that's loaded on the first page visit.
     *
     * @see https://inertiajs.com/server-side-setup#root-template
     *
     * @var string
     */
    protected $rootView = 'app';

    /**
     * Determines the current asset version.
     *
     * @see https://inertiajs.com/asset-versioning
     */
    public function version(Request $request): ?string
    {
        return parent::version($request);
    }

    /**
     * Define the props that are shared by default.
     *
     * @see https://inertiajs.com/shared-data
     *
     * @return array<string, mixed>
     */
    public function share(Request $request): array
    {
        [$message, $author] = str(Inspiring::quotes()->random())->explode('-');
        
        // Récupérer l'utilisateur authentifié
        $user = $request->user();
        
        // Si l'utilisateur n'est pas trouvé via $request->user() mais que la session contient un ID utilisateur,
        // essayer de récupérer l'utilisateur directement depuis la base de données
        if (!$user && session()->has('auth.user_id')) {
            $userId = session('auth.user_id');
            $user = \App\Models\Utilisateur::find($userId);
            
            // Si l'utilisateur est trouvé, le reconnecter manuellement
            if ($user) {
                \Illuminate\Support\Facades\Auth::login($user);
                \Illuminate\Support\Facades\Log::info('HandleInertiaRequests: Utilisateur reconnecté depuis la session', [
                    'user_id' => $userId,
                    'session_id' => session()->getId()
                ]);
            }
        }
        
        // Vérifier également la clé de session standard de Laravel
        if (!$user && session()->has('login_web_59ba36addc2b2f9401580f014c7f58ea4e30989d')) {
            $userId = session('login_web_59ba36addc2b2f9401580f014c7f58ea4e30989d');
            $user = \App\Models\Utilisateur::find($userId);
            
            if ($user) {
                \Illuminate\Support\Facades\Auth::login($user);
                \Illuminate\Support\Facades\Log::info('HandleInertiaRequests: Utilisateur reconnecté depuis la clé de session standard', [
                    'user_id' => $userId,
                    'session_id' => session()->getId()
                ]);
            }
        }

        // Ajouter des informations de débogage pour diagnostiquer les problèmes d'authentification
        $authDebug = [];
        $includeDebug = app()->environment('local') && config('frontend.expose_auth_debug');
        if ($includeDebug) {
            $authDebug = [
                'is_authenticated' => \Illuminate\Support\Facades\Auth::check(),
                'session_active' => session()->has('auth.user_id'),
                'session_cookie_present' => $request->cookies->has(config('session.cookie')),
                'remember_cookie_present' => $request->cookies->has(\Illuminate\Support\Facades\Auth::guard()->getRecallerName()),
                'timestamp' => now()->toIso8601String()
            ];
        }

        $sharedUser = $user ? $this->transformAuthenticatedUser($user) : null;

        return [
            ...parent::share($request),
            'name' => config('app.name'),
            'quote' => ['message' => trim($message), 'author' => trim($author)],
            'auth' => [
                'user' => $sharedUser,
                'debug' => $includeDebug ? $authDebug : null,
            ],
            'ziggy' => fn (): array => [
                ...(new Ziggy)->toArray(),
                'location' => $request->url(),
            ],
            'sidebarOpen' => ! $request->hasCookie('sidebar_state') || $request->cookie('sidebar_state') === 'true',
            // Partager le token CSRF avec toutes les pages Inertia
            'csrf_token' => csrf_token(),
            // Ajouter un timestamp pour éviter les problèmes de cache
            'timestamp' => now()->timestamp,
        ];
    }

    /**
     * Limite les informations utilisateur partagées avec le frontend Inertia.
     */
    protected function transformAuthenticatedUser($user): array
    {
        $displayName = trim(($user->prenom ?? '') . ' ' . ($user->nom ?? ''));
        $initials = strtoupper(substr($user->prenom ?? '', 0, 1) . substr($user->nom ?? '', 0, 1));

        if (strlen($initials) === 0) {
            $initials = strtoupper(substr($user->matricule ?? 'U', 0, 2));
        }

        return [
            'matricule' => $user->matricule,
            'name' => $displayName !== '' ? $displayName : $user->matricule,
            'initials' => $initials,
            'role' => $user->role_nom,
            'role_display' => $this->formatRoleDisplay($user->role_nom),
            'is_admin' => (bool) $user->est_admin,
            'avatar' => $user->photo_url ?? null,
        ];
    }

    private function formatRoleDisplay(?string $roleNom): string
    {
        if (!$roleNom) {
            return '';
        }

        return [
            'ADMIN' => 'Administrateur',
            'DR' => 'Directeur Régional',
            'CDTT' => 'Chef Département Trade',
            'CSC' => 'Chef Service Commercial',
            'RTM' => 'Regional Trade Marketing',
            'CDV' => 'Chef District Vente',
            'TMO' => 'Trade Marketing Operator',
            'CDS' => 'Chef de Secteur',
            'SRMO' => 'Superviseur Régional Marketing Opérationnel',
            'SS' => 'Superviseur Sponsoring',
            'AS' => 'Assistant Superviseur Sponsoring',
        ][$roleNom] ?? $roleNom;
    }
}
