# Story 1.2: Authentification & Session Utilisateur

Status: ready-for-dev

## Story

En tant qu'utilisateur SABC,
Je veux pouvoir me connecter avec mon matricule et mot de passe,
Afin d'accéder au système de manière sécurisée.

## Acceptance Criteria

**Given** je suis un utilisateur enregistré avec matricule et mot de passe
**When** je saisis mes identifiants corrects sur la page de login
**Then** je suis authentifié et redirigé vers mon dashboard selon mon rôle
**And** une session Laravel est créée avec JWT token (Passport)
**And** le middleware `auth` protège toutes les routes privées
**And** je peux me déconnecter et ma session est détruite
**And** les tentatives de login échouées sont loggées dans `logs_administration`
**And** après 5 tentatives échouées, le compte est temporairement verrouillé (15 minutes)

## Tasks / Subtasks

- [ ] Installation et Configuration Laravel Passport (AC: 2)
  - [ ] Installer `laravel/passport` via composer
  - [ ] Exécuter `php artisan passport:install`
  - [ ] Configurer `config/auth.php` pour utiliser Passport
  - [ ] Ajouter trait `HasApiTokens` au modèle `Utilisateur`

- [ ] Création Page Login Inertia (AC: 1)
  - [ ] Créer `resources/js/Pages/Auth/Login.tsx`
  - [ ] Formulaire avec champs `matricule` et `password`
  - [ ] Validation côté client (champs requis)
  - [ ] Design SABC (couleurs #E53E3E, Poppins/Inter)
  - [ ] Responsive mobile-first (320px-768px)

- [ ] Implémentation AuthController (AC: 1, 2, 3)
  - [ ] Créer `app/Http/Controllers/Auth/AuthController.php`
  - [ ] Méthode `login()` : validation + authentification
  - [ ] Génération JWT token avec Passport
  - [ ] Redirection vers dashboard selon rôle (`/dashboard/{role}`)
  - [ ] Méthode `logout()` : révocation token + destruction session

- [ ] Middleware Auth & Protection Routes (AC: 3)
  - [ ] Configurer middleware `auth:api` pour routes protégées
  - [ ] Appliquer middleware sur toutes les routes `/dashboard/*`
  - [ ] Vérifier JWT token dans les headers
  - [ ] Retourner 401 si non authentifié

- [ ] Logging Tentatives Échouées (AC: 4)
  - [ ] Logger dans `logs_administration` (MySQL)
  - [ ] Enregistrer : matricule, timestamp, adresse IP, résultat
  - [ ] Créer table `logs_administration` si nécessaire

- [ ] Rate Limiting & Verrouillage Compte (AC: 5)
  - [ ] Implémenter compteur tentatives échouées (Redis)
  - [ ] Bloquer après 5 tentatives (TTL 15 minutes)
  - [ ] Message d'erreur explicite "Compte verrouillé temporairement"
  - [ ] Réinitialiser compteur après connexion réussie

- [ ] Tests & Validation
  - [ ] Tester login avec credentials valides
  - [ ] Tester login avec credentials invalides
  - [ ] Tester redirection selon rôle
  - [ ] Tester logout et révocation token
  - [ ] Tester verrouillage après 5 tentatives

## Dev Notes

### Architecture Authentification

**Stack Authentification :**
- **Laravel Passport** : Génération et gestion JWT tokens
- **Session Laravel** : Gestion session web (cookie)
- **Redis** : Rate limiting et cache tentatives échouées
- **MySQL** : Logs administration

**Flow Authentification :**
1. Utilisateur soumet formulaire login (matricule + password)
2. Backend valide credentials via `Utilisateur::where('matricule', $matricule)`
3. Si valide : génération JWT token + création session
4. Redirection vers dashboard selon `role_nom`
5. Si invalide : log tentative + incrément compteur Redis

### Configuration Laravel Passport

**Installation :**
```bash
composer require laravel/passport
php artisan passport:install
```

**Configuration `config/auth.php` :**
```php
'guards' => [
    'web' => [
        'driver' => 'session',
        'provider' => 'users',
    ],
    'api' => [
        'driver' => 'passport',
        'provider' => 'users',
    ],
],

'providers' => [
    'users' => [
        'driver' => 'eloquent',
        'model' => App\Models\Utilisateur::class,
    ],
],
```

**Modèle Utilisateur :**
```php
use Laravel\Passport\HasApiTokens;

class Utilisateur extends Authenticatable
{
    use HasApiTokens, Notifiable;
    
    protected $connection = 'mysql'; // sabc_core
    protected $table = 'utilisateurs';
    protected $primaryKey = 'matricule';
    public $incrementing = false;
    protected $keyType = 'string';
}
```

### AuthController Implémentation

**Route :**
```php
// routes/web.php
Route::post('/login', [AuthController::class, 'login'])->name('login');
Route::post('/logout', [AuthController::class, 'logout'])->middleware('auth:api')->name('logout');
```

**Controller :**
```php
namespace App\Http\Controllers\Auth;

use App\Models\Utilisateur;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Redis;
use Illuminate\Support\Facades\DB;

class AuthController extends Controller
{
    public function login(Request $request)
    {
        $request->validate([
            'matricule' => 'required|string',
            'password' => 'required|string',
        ]);

        // Vérifier verrouillage
        $lockKey = "login_attempts:{$request->matricule}";
        $attempts = Redis::get($lockKey) ?? 0;
        
        if ($attempts >= 5) {
            return back()->withErrors([
                'matricule' => 'Compte temporairement verrouillé (15 minutes)',
            ]);
        }

        // Tentative authentification
        $user = Utilisateur::where('matricule', $request->matricule)->first();
        
        if (!$user || !Hash::check($request->password, $user->password)) {
            // Incrémenter tentatives
            Redis::incr($lockKey);
            Redis::expire($lockKey, 900); // 15 minutes
            
            // Logger tentative échouée
            DB::connection('mysql')->table('logs_administration')->insert([
                'utilisateur_matricule' => $request->matricule,
                'action' => 'login_failed',
                'resultat' => 'erreur',
                'adresse_ip' => $request->ip(),
                'date_action' => now(),
            ]);
            
            return back()->withErrors([
                'matricule' => 'Identifiants incorrects',
            ]);
        }

        // Authentification réussie
        Auth::login($user);
        $token = $user->createToken('auth_token')->accessToken;
        
        // Réinitialiser compteur
        Redis::del($lockKey);
        
        // Logger succès
        DB::connection('mysql')->table('logs_administration')->insert([
            'utilisateur_matricule' => $user->matricule,
            'action' => 'login_success',
            'resultat' => 'succes',
            'adresse_ip' => $request->ip(),
            'date_action' => now(),
        ]);
        
        // Redirection selon rôle
        $dashboardRoute = $this->getDashboardRoute($user->role_nom);
        
        return redirect($dashboardRoute)->with('token', $token);
    }
    
    public function logout(Request $request)
    {
        $request->user()->token()->revoke();
        Auth::logout();
        
        return redirect('/login');
    }
    
    private function getDashboardRoute(string $role): string
    {
        $roleRoutes = [
            'ADMIN' => '/admin/dashboard',
            'DR' => '/dashboard/dr',
            'CDTT' => '/dashboard/cdtt',
            'CSC' => '/dashboard/csc',
            'CDV' => '/dashboard/cdv',
            'CDS' => '/dashboard/cds',
            'RTM' => '/dashboard/rtm',
            'TMO' => '/dashboard/tmo',
            'SRMO' => '/dashboard/srmo',
            'SS' => '/dashboard/ss',
            'AS' => '/dashboard/as',
        ];
        
        return $roleRoutes[$role] ?? '/dashboard';
    }
}
```

### Page Login Inertia

**Fichier : `resources/js/Pages/Auth/Login.tsx`**
```tsx
import { useForm } from '@inertiajs/react';
import { FormEventHandler } from 'react';
import { Button } from '@/Components/UI/Button';
import { Input } from '@/Components/UI/Input';

export default function Login() {
    const { data, setData, post, processing, errors } = useForm({
        matricule: '',
        password: '',
    });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        post('/login');
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-sabc-gray-50">
            <div className="max-w-md w-full bg-white p-8 rounded-lg shadow-lg">
                <h1 className="text-2xl font-bold text-sabc-gray-900 mb-6 font-poppins">
                    Connexion SABC Eval360
                </h1>
                
                <form onSubmit={submit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-sabc-gray-800 mb-2">
                            Matricule
                        </label>
                        <Input
                            type="text"
                            value={data.matricule}
                            onChange={(e) => setData('matricule', e.target.value)}
                            required
                            className="w-full"
                        />
                        {errors.matricule && (
                            <p className="text-sabc-error text-sm mt-1">{errors.matricule}</p>
                        )}
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-sabc-gray-800 mb-2">
                            Mot de passe
                        </label>
                        <Input
                            type="password"
                            value={data.password}
                            onChange={(e) => setData('password', e.target.value)}
                            required
                            className="w-full"
                        />
                        {errors.password && (
                            <p className="text-sabc-error text-sm mt-1">{errors.password}</p>
                        )}
                    </div>

                    <Button
                        type="submit"
                        disabled={processing}
                        className="w-full bg-sabc-red-primary hover:bg-sabc-red-dark"
                    >
                        {processing ? 'Connexion...' : 'Se connecter'}
                    </Button>
                </form>
            </div>
        </div>
    );
}
```

### Table logs_administration

**Migration :**
```php
Schema::connection('mysql')->create('logs_administration', function (Blueprint $table) {
    $table->id();
    $table->string('utilisateur_matricule')->nullable();
    $table->string('action'); // login_success, login_failed, etc.
    $table->enum('resultat', ['succes', 'erreur']);
    $table->ipAddress('adresse_ip');
    $table->text('details')->nullable();
    $table->timestamp('date_action');
    
    $table->index(['utilisateur_matricule', 'date_action']);
    $table->index('action');
});
```

### Rate Limiting avec Redis

**Configuration Redis :**
```env
REDIS_HOST=127.0.0.1
REDIS_PASSWORD=null
REDIS_PORT=6379
REDIS_DB=0
```

**Clé Redis :**
- Format : `login_attempts:{matricule}`
- TTL : 900 secondes (15 minutes)
- Valeur : Nombre de tentatives échouées

### Middleware Auth Protection

**Application sur routes :**
```php
// routes/web.php
Route::middleware(['auth:api'])->group(function () {
    Route::get('/dashboard/{role}', [DashboardController::class, 'index']);
    Route::post('/logout', [AuthController::class, 'logout']);
    // Toutes les autres routes protégées
});
```

### Project Structure Notes

**Fichiers à créer :**
- `app/Http/Controllers/Auth/AuthController.php` : Controller authentification
- `resources/js/Pages/Auth/Login.tsx` : Page login Inertia
- `database/migrations/xxxx_create_logs_administration_table.php` : Table logs
- `routes/web.php` : Routes login/logout

**Fichiers à modifier :**
- `app/Models/Utilisateur.php` : Ajouter trait `HasApiTokens`
- `config/auth.php` : Configurer guard `api` avec Passport
- `.env` : Ajouter variables Redis si nécessaire

**Dépendances Story 1.1 :**
- MySQL (sabc_core) doit être configuré
- Table `utilisateurs` doit exister
- Redis doit être opérationnel

### Règles SABC à Respecter

- **TypeScript strict** : Typer tous les props et retours
- **Inertia pages** : Uniquement dans `resources/js/Pages/`
- **Design system** : Couleurs SABC (#E53E3E, #FF9800), Poppins/Inter
- **API format** : JSON en `snake_case`, UI en `camelCase`
- **Mobile-first** : Responsive 320px-768px priorité
- **pnpm** : Utiliser pnpm (pas npm/yarn)

### References

- [Source: epics.md#Epic 1 Story 1.2] - Acceptance criteria complets
- [Source: architecture.md#Authentication & Security] - Laravel Passport JWT
- [Source: project-context.md#Technology Stack] - Passport cible, Redis 8.4.x
- [Source: project-context.md#Critical Implementation Rules] - TypeScript strict, Inertia pages
- [Source: architecture.md#Security Governance] - Logs admin, rate limiting

## Dev Agent Record

### Agent Model Used

_À remplir par le dev agent_

### Debug Log References

_À remplir par le dev agent_

### Completion Notes List

_À remplir par le dev agent_

### File List

_À remplir par le dev agent_
