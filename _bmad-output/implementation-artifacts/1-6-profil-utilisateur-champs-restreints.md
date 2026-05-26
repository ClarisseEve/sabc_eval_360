# Story 1.6: Profil Utilisateur (Champs Restreints)

Status: ready-for-dev

## Story

En tant qu'utilisateur SABC,
Je veux consulter et modifier mon profil personnel,
Afin de maintenir mes informations à jour.

## Acceptance Criteria

**Given** je suis connecté avec mon compte utilisateur
**When** j'accède à la page "Mon Profil"
**Then** je peux consulter toutes mes informations (matricule, nom, prénom, email, région, branche, rôle, manager)
**And** je peux modifier uniquement : nom, prénom, mot de passe, date de naissance, préférences (langue, notifications)
**And** les champs matricule, région, branche, manager, rôle sont en lecture seule
**And** la modification du mot de passe requiert l'ancien mot de passe pour validation
**And** les préférences sont sauvegardées dans un champ JSON `preferences_json`
**And** un message indique "Pour modifier votre région, branche ou rôle, contactez l'administrateur"
**And** les modifications sont sauvegardées dans MySQL `utilisateurs`

## Tasks / Subtasks

- [ ] Ajout Colonnes Profil à Table `utilisateurs` (AC: 2, 5)
  - [ ] Migration ajout `date_naissance` (nullable)
  - [ ] Migration ajout `preferences_json` (JSON, nullable)
  - [ ] Valeurs par défaut preferences : `{"langue": "fr", "notifications_email": true, "notifications_app": true}`

- [ ] Mise à Jour Modèle `Utilisateur` (AC: 2, 5)
  - [ ] Ajouter `date_naissance` et `preferences_json` dans `$fillable`
  - [ ] Cast `preferences_json` en array
  - [ ] Accessor `getPreferencesAttribute()` pour valeurs par défaut
  - [ ] Mutator `setPreferencesAttribute()` pour validation JSON

- [ ] ProfilController (AC: 1, 2, 3, 4, 6, 7)
  - [ ] Créer `app/Http/Controllers/ProfilController.php`
  - [ ] Méthode `show()` : Afficher profil utilisateur authentifié
  - [ ] Méthode `update()` : Mise à jour champs autorisés uniquement
  - [ ] Méthode `updatePassword()` : Changement mot de passe avec validation ancien
  - [ ] Middleware `auth:api` (pas de restriction rôle)
  - [ ] Validation : champs modifiables vs lecture seule

- [ ] Page Profil Inertia (AC: 1, 2, 3, 6)
  - [ ] Créer `resources/js/Pages/Profil/Index.tsx`
  - [ ] Section informations lecture seule (matricule, région, branche, rôle, manager)
  - [ ] Section informations modifiables (nom, prénom, email, date naissance)
  - [ ] Section préférences (langue, notifications)
  - [ ] Message info : "Pour modifier région/branche/rôle, contactez admin"
  - [ ] Design SABC responsive

- [ ] Formulaire Changement Mot de Passe (AC: 4)
  - [ ] Composant `resources/js/Components/Profil/ChangePasswordForm.tsx`
  - [ ] Champs : ancien mot de passe, nouveau mot de passe, confirmation
  - [ ] Validation côté client : min 8 caractères, confirmation match
  - [ ] Validation côté serveur : ancien mot de passe correct
  - [ ] Messages d'erreur explicites

- [ ] Tests & Validation
  - [ ] Tester affichage profil complet
  - [ ] Tester modification champs autorisés
  - [ ] Tester blocage modification champs lecture seule
  - [ ] Tester changement mot de passe avec validation ancien
  - [ ] Tester sauvegarde préférences JSON
  - [ ] Tester message info admin

## Dev Notes

### Architecture Profil Utilisateur

**Champs Modifiables par Utilisateur :**
- `nom` : Nom de famille
- `prenom` : Prénom
- `email` : Adresse email (avec validation unique)
- `date_naissance` : Date de naissance (optionnel)
- `password` : Mot de passe (avec validation ancien)
- `preferences_json` : Préférences utilisateur (langue, notifications)

**Champs Lecture Seule (Admin Seul) :**
- `matricule` : Identifiant unique
- `id_region` : Région d'affectation
- `id_branche` : Branche métier
- `id_role` : Rôle hiérarchique
- `manager_matricule` : Manager direct
- `id_service`, `id_district`, `id_secteur` : Affectation géographique

### Migration Ajout Colonnes

```php
Schema::connection('mysql')->table('utilisateurs', function (Blueprint $table) {
    $table->date('date_naissance')->nullable()->after('email');
    $table->json('preferences_json')->nullable()->after('date_naissance');
});
```

### Modèle Utilisateur - Ajouts

```php
// Dans app/Models/Utilisateur.php

protected $fillable = [
    // ... colonnes existantes
    'date_naissance',
    'preferences_json',
];

protected $casts = [
    'actif' => 'boolean',
    'date_naissance' => 'date',
    'preferences_json' => 'array',
];

// Accessor pour préférences avec valeurs par défaut
public function getPreferencesAttribute($value): array
{
    $defaults = [
        'langue' => 'fr',
        'notifications_email' => true,
        'notifications_app' => true,
        'theme' => 'light',
    ];
    
    if (empty($value)) {
        return $defaults;
    }
    
    $preferences = json_decode($value, true);
    return array_merge($defaults, $preferences ?? []);
}

// Mutator pour validation préférences
public function setPreferencesAttribute($value): void
{
    if (is_array($value)) {
        $this->attributes['preferences_json'] = json_encode($value);
    } else {
        $this->attributes['preferences_json'] = $value;
    }
}
```

### ProfilController

```php
namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;

class ProfilController extends Controller
{
    public function __construct()
    {
        $this->middleware('auth:api');
    }
    
    public function show(Request $request)
    {
        $user = $request->user()->load(['role', 'region', 'branche', 'manager', 'service', 'district', 'secteur']);
        
        return Inertia::render('Profil/Index', [
            'user' => [
                // Informations lecture seule
                'matricule' => $user->matricule,
                'role' => $user->role->nom_complet,
                'region' => $user->region->nom_region,
                'branche' => $user->branche->nom_branche,
                'manager' => $user->manager ? $user->manager->nom_complet : null,
                'service' => $user->service?->nom_service,
                'district' => $user->district?->nom_district,
                'secteur' => $user->secteur?->nom_secteur,
                
                // Informations modifiables
                'nom' => $user->nom,
                'prenom' => $user->prenom,
                'email' => $user->email,
                'date_naissance' => $user->date_naissance?->format('Y-m-d'),
                'preferences' => $user->preferences,
            ],
        ]);
    }
    
    public function update(Request $request)
    {
        $user = $request->user();
        
        $validated = $request->validate([
            'nom' => 'required|string|max:100',
            'prenom' => 'required|string|max:100',
            'email' => 'required|email|max:150|unique:utilisateurs,email,' . $user->matricule . ',matricule',
            'date_naissance' => 'nullable|date|before:today',
            'preferences' => 'nullable|array',
            'preferences.langue' => 'nullable|in:fr,en',
            'preferences.notifications_email' => 'nullable|boolean',
            'preferences.notifications_app' => 'nullable|boolean',
            'preferences.theme' => 'nullable|in:light,dark',
        ]);
        
        // Mise à jour uniquement des champs autorisés
        $user->update([
            'nom' => $validated['nom'],
            'prenom' => $validated['prenom'],
            'email' => $validated['email'],
            'date_naissance' => $validated['date_naissance'] ?? null,
            'preferences_json' => $validated['preferences'] ?? $user->preferences,
        ]);
        
        return back()->with('success', 'Profil mis à jour avec succès');
    }
    
    public function updatePassword(Request $request)
    {
        $user = $request->user();
        
        $validated = $request->validate([
            'current_password' => 'required|string',
            'password' => 'required|string|min:8|confirmed',
        ]);
        
        // Vérifier ancien mot de passe
        if (!Hash::check($validated['current_password'], $user->password)) {
            throw ValidationException::withMessages([
                'current_password' => ['Le mot de passe actuel est incorrect'],
            ]);
        }
        
        // Mettre à jour mot de passe
        $user->update([
            'password' => Hash::make($validated['password']),
        ]);
        
        return back()->with('success', 'Mot de passe modifié avec succès');
    }
}
```

### Routes

```php
// routes/web.php
Route::middleware(['auth:api'])->group(function () {
    Route::get('/profil', [ProfilController::class, 'show'])->name('profil.show');
    Route::put('/profil', [ProfilController::class, 'update'])->name('profil.update');
    Route::put('/profil/password', [ProfilController::class, 'updatePassword'])->name('profil.password');
});
```

### Page Profil Inertia

```tsx
// resources/js/Pages/Profil/Index.tsx
import { useForm } from '@inertiajs/react';
import { FormEventHandler } from 'react';
import { Button } from '@/Components/UI/Button';
import { Input } from '@/Components/UI/Input';
import { Card } from '@/Components/UI/Card';
import { Badge } from '@/Components/UI/Badge';
import ChangePasswordForm from '@/Components/Profil/ChangePasswordForm';

interface User {
    // Lecture seule
    matricule: string;
    role: string;
    region: string;
    branche: string;
    manager: string | null;
    service: string | null;
    district: string | null;
    secteur: string | null;
    
    // Modifiable
    nom: string;
    prenom: string;
    email: string;
    date_naissance: string | null;
    preferences: {
        langue: string;
        notifications_email: boolean;
        notifications_app: boolean;
        theme: string;
    };
}

interface Props {
    user: User;
}

export default function ProfilIndex({ user }: Props) {
    const { data, setData, put, processing, errors } = useForm({
        nom: user.nom,
        prenom: user.prenom,
        email: user.email,
        date_naissance: user.date_naissance || '',
        preferences: user.preferences,
    });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        put('/profil');
    };

    return (
        <div className="p-6 max-w-4xl mx-auto">
            <h1 className="text-2xl font-bold text-sabc-gray-900 mb-6 font-poppins">
                Mon Profil
            </h1>

            {/* Informations Lecture Seule */}
            <Card className="mb-6">
                <div className="p-6">
                    <h2 className="text-xl font-semibold text-sabc-gray-900 mb-4 font-poppins">
                        Informations Organisationnelles
                    </h2>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-sabc-gray-600 mb-1">
                                Matricule
                            </label>
                            <Badge variant="secondary" className="text-base">
                                {user.matricule}
                            </Badge>
                        </div>
                        
                        <div>
                            <label className="block text-sm font-medium text-sabc-gray-600 mb-1">
                                Rôle
                            </label>
                            <Badge className="text-base">{user.role}</Badge>
                        </div>
                        
                        <div>
                            <label className="block text-sm font-medium text-sabc-gray-600 mb-1">
                                Région
                            </label>
                            <p className="text-sabc-gray-900">{user.region}</p>
                        </div>
                        
                        <div>
                            <label className="block text-sm font-medium text-sabc-gray-600 mb-1">
                                Branche
                            </label>
                            <p className="text-sabc-gray-900">{user.branche}</p>
                        </div>
                        
                        {user.manager && (
                            <div>
                                <label className="block text-sm font-medium text-sabc-gray-600 mb-1">
                                    Manager
                                </label>
                                <p className="text-sabc-gray-900">{user.manager}</p>
                            </div>
                        )}
                        
                        {user.service && (
                            <div>
                                <label className="block text-sm font-medium text-sabc-gray-600 mb-1">
                                    Service
                                </label>
                                <p className="text-sabc-gray-900">{user.service}</p>
                            </div>
                        )}
                    </div>
                    
                    <div className="mt-4 p-3 bg-sabc-gray-50 rounded-lg">
                        <p className="text-sm text-sabc-gray-600">
                            ℹ️ Pour modifier votre région, branche ou rôle, contactez l'administrateur
                        </p>
                    </div>
                </div>
            </Card>

            {/* Informations Modifiables */}
            <Card className="mb-6">
                <form onSubmit={submit} className="p-6">
                    <h2 className="text-xl font-semibold text-sabc-gray-900 mb-4 font-poppins">
                        Informations Personnelles
                    </h2>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-sabc-gray-800 mb-2">
                                Nom
                            </label>
                            <Input
                                type="text"
                                value={data.nom}
                                onChange={(e) => setData('nom', e.target.value)}
                                required
                            />
                            {errors.nom && (
                                <p className="text-sabc-error text-sm mt-1">{errors.nom}</p>
                            )}
                        </div>
                        
                        <div>
                            <label className="block text-sm font-medium text-sabc-gray-800 mb-2">
                                Prénom
                            </label>
                            <Input
                                type="text"
                                value={data.prenom}
                                onChange={(e) => setData('prenom', e.target.value)}
                                required
                            />
                            {errors.prenom && (
                                <p className="text-sabc-error text-sm mt-1">{errors.prenom}</p>
                            )}
                        </div>
                        
                        <div>
                            <label className="block text-sm font-medium text-sabc-gray-800 mb-2">
                                Email
                            </label>
                            <Input
                                type="email"
                                value={data.email}
                                onChange={(e) => setData('email', e.target.value)}
                                required
                            />
                            {errors.email && (
                                <p className="text-sabc-error text-sm mt-1">{errors.email}</p>
                            )}
                        </div>
                        
                        <div>
                            <label className="block text-sm font-medium text-sabc-gray-800 mb-2">
                                Date de Naissance
                            </label>
                            <Input
                                type="date"
                                value={data.date_naissance}
                                onChange={(e) => setData('date_naissance', e.target.value)}
                            />
                            {errors.date_naissance && (
                                <p className="text-sabc-error text-sm mt-1">{errors.date_naissance}</p>
                            )}
                        </div>
                    </div>
                    
                    <h3 className="text-lg font-semibold text-sabc-gray-900 mt-6 mb-4">
                        Préférences
                    </h3>
                    
                    <div className="space-y-3">
                        <div className="flex items-center">
                            <input
                                type="checkbox"
                                checked={data.preferences.notifications_email}
                                onChange={(e) => setData('preferences', {
                                    ...data.preferences,
                                    notifications_email: e.target.checked
                                })}
                                className="mr-3"
                            />
                            <label className="text-sm text-sabc-gray-800">
                                Recevoir les notifications par email
                            </label>
                        </div>
                        
                        <div className="flex items-center">
                            <input
                                type="checkbox"
                                checked={data.preferences.notifications_app}
                                onChange={(e) => setData('preferences', {
                                    ...data.preferences,
                                    notifications_app: e.target.checked
                                })}
                                className="mr-3"
                            />
                            <label className="text-sm text-sabc-gray-800">
                                Recevoir les notifications dans l'application
                            </label>
                        </div>
                    </div>
                    
                    <div className="mt-6">
                        <Button
                            type="submit"
                            disabled={processing}
                            className="bg-sabc-red-primary hover:bg-sabc-red-dark"
                        >
                            {processing ? 'Enregistrement...' : 'Enregistrer les modifications'}
                        </Button>
                    </div>
                </form>
            </Card>

            {/* Changement Mot de Passe */}
            <ChangePasswordForm />
        </div>
    );
}
```

### Composant ChangePasswordForm

```tsx
// resources/js/Components/Profil/ChangePasswordForm.tsx
import { useForm } from '@inertiajs/react';
import { FormEventHandler } from 'react';
import { Button } from '@/Components/UI/Button';
import { Input } from '@/Components/UI/Input';
import { Card } from '@/Components/UI/Card';

export default function ChangePasswordForm() {
    const { data, setData, put, processing, errors, reset } = useForm({
        current_password: '',
        password: '',
        password_confirmation: '',
    });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        put('/profil/password', {
            onSuccess: () => reset(),
        });
    };

    return (
        <Card>
            <form onSubmit={submit} className="p-6">
                <h2 className="text-xl font-semibold text-sabc-gray-900 mb-4 font-poppins">
                    Changer le Mot de Passe
                </h2>
                
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-sabc-gray-800 mb-2">
                            Mot de passe actuel
                        </label>
                        <Input
                            type="password"
                            value={data.current_password}
                            onChange={(e) => setData('current_password', e.target.value)}
                            required
                        />
                        {errors.current_password && (
                            <p className="text-sabc-error text-sm mt-1">{errors.current_password}</p>
                        )}
                    </div>
                    
                    <div>
                        <label className="block text-sm font-medium text-sabc-gray-800 mb-2">
                            Nouveau mot de passe
                        </label>
                        <Input
                            type="password"
                            value={data.password}
                            onChange={(e) => setData('password', e.target.value)}
                            required
                            minLength={8}
                        />
                        {errors.password && (
                            <p className="text-sabc-error text-sm mt-1">{errors.password}</p>
                        )}
                        <p className="text-xs text-sabc-gray-400 mt-1">
                            Minimum 8 caractères
                        </p>
                    </div>
                    
                    <div>
                        <label className="block text-sm font-medium text-sabc-gray-800 mb-2">
                            Confirmer le nouveau mot de passe
                        </label>
                        <Input
                            type="password"
                            value={data.password_confirmation}
                            onChange={(e) => setData('password_confirmation', e.target.value)}
                            required
                        />
                    </div>
                </div>
                
                <div className="mt-6">
                    <Button
                        type="submit"
                        disabled={processing}
                        className="bg-sabc-red-primary hover:bg-sabc-red-dark"
                    >
                        {processing ? 'Modification...' : 'Changer le mot de passe'}
                    </Button>
                </div>
            </form>
        </Card>
    );
}
```

### Project Structure Notes

**Fichiers à créer :**
- `database/migrations/xxxx_add_profil_columns_to_utilisateurs.php`
- `app/Http/Controllers/ProfilController.php`
- `resources/js/Pages/Profil/Index.tsx`
- `resources/js/Components/Profil/ChangePasswordForm.tsx`

**Fichiers à modifier :**
- `app/Models/Utilisateur.php` : Ajouter colonnes dans $fillable, casts, accessors
- `routes/web.php` : Ajouter routes profil
- `resources/js/types/index.ts` : Ajouter interface Preferences

**Dépendances Stories Précédentes :**
- Story 1.1 : MySQL (sabc_core) configuré
- Story 1.2 : Authentification Laravel Passport, middleware auth:api
- Story 1.5 : Table `utilisateurs` créée avec tous les attributs

### Règles Métier SABC Critiques

**Champs Modifiables vs Lecture Seule :**
- **Modifiables** : nom, prenom, email, date_naissance, password, preferences
- **Lecture seule** : matricule, id_region, id_branche, id_role, manager_matricule, affectations géographiques

**Validation Mot de Passe :**
- Ancien mot de passe requis pour changement
- Nouveau mot de passe : min 8 caractères
- Confirmation obligatoire

**Préférences JSON :**
- Structure : `{"langue": "fr", "notifications_email": true, "notifications_app": true, "theme": "light"}`
- Valeurs par défaut si null
- Validation types lors de la mise à jour

### References

- [Source: epics.md#Epic 1 Story 1.6] - Acceptance criteria complets
- [Source: business-logic-rules.md#Règles de Liens Hiérarchiques] - Restrictions modifications
- [Source: architecture.md#Security Governance] - Validation mot de passe
- [Source: project-context.md#Critical Implementation Rules] - TypeScript strict, Inertia pages

## Dev Agent Record

### Agent Model Used

_À remplir par le dev agent_

### Debug Log References

_À remplir par le dev agent_

### Completion Notes List

_À remplir par le dev agent_

### File List

_À remplir par le dev agent_
