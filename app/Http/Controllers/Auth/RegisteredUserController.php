<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\Utilisateur;
use App\Models\Role;
use App\Providers\RouteServiceProvider;
use Illuminate\Auth\Events\Registered;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rules;
use Inertia\Inertia;
use Inertia\Response;

class RegisteredUserController extends Controller
{
    /**
     * Display the registration view.
     */
    public function create(): Response
    {
        // Récupérer tous les rôles disponibles pour le formulaire d'inscription
        $roles = Role::all(['id', 'nom_role']);
        
        return Inertia::render('Auth/Register', [
            'roles' => $roles
        ]);
    }

    /**
     * Handle an incoming registration request.
     *
     * @throws \Illuminate\Validation\ValidationException
     */
    public function store(Request $request): RedirectResponse
    {
        $request->validate([
            'nom' => 'required|string|max:255',
            'prenom' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:utilisateurs',
            'username' => 'required|string|max:255|unique:utilisateurs',
            'matricule' => 'required|string|max:255|unique:utilisateurs',
            'telephone' => 'nullable|string|max:20',
            'id_role' => 'required|exists:roles,id',
            'password' => ['required', 'confirmed', Rules\Password::defaults()],
        ]);

        $user = Utilisateur::create([
            'nom' => $request->nom,
            'prenom' => $request->prenom,
            'email' => $request->email,
            'username' => $request->username,
            'matricule' => $request->matricule,
            'telephone' => $request->telephone,
            'id_role' => $request->id_role,
            'password' => Hash::make($request->password),
        ]);

        event(new Registered($user));

        Auth::login($user);

        return redirect(RouteServiceProvider::HOME);
    }
}
