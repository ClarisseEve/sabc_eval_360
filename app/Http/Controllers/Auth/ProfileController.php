<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\Utilisateur;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;
use Inertia\Inertia;

class ProfileController extends Controller
{
    /**
     * Afficher le formulaire d'édition du profil utilisateur
     */
    public function edit()
    {
        return Inertia::render('Profile/Edit', [
            'user' => Auth::user(),
        ]);
    }

    /**
     * Mettre à jour les informations du profil utilisateur
     */
    public function update(Request $request)
    {
        $user = Auth::user();

        $validated = $request->validate([
            'nom' => ['required', 'string', 'max:255'],
            'prenom' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', 'max:255', Rule::unique('utilisateurs')->ignore($user->id)],
            'username' => ['required', 'string', 'max:255', Rule::unique('utilisateurs')->ignore($user->id)],
            'telephone' => ['nullable', 'string', 'max:20'],
        ]);

        $user->update($validated);

        return redirect()->back()->with('success', 'Profil mis à jour avec succès');
    }

    /**
     * Mettre à jour le mot de passe de l'utilisateur
     */
    public function updatePassword(Request $request)
    {
        $validated = $request->validate([
            'current_password' => ['required', 'current_password'],
            'password' => ['required', 'confirmed', 'min:8'],
        ]);

        Auth::user()->update([
            'password' => Hash::make($validated['password']),
        ]);

        return redirect()->back()->with('success', 'Mot de passe mis à jour avec succès');
    }
}
