<?php

use App\Models\Utilisateur;

test('guests are redirected to the login page', function () {
    $this->get('/dashboard')->assertRedirect('/login');
});

test('authenticated users can visit the dashboard', function () {
    $user = new Utilisateur([
        'matricule' => 'US-01',
        'nom' => 'Test',
        'prenom' => 'User',
        'email' => 'test@sabc.cm',
        'role' => 'ADMIN',
        'role_nom' => 'ADMIN',
    ]);

    $this->actingAs($user);

    $this->get('/dashboard')->assertRedirect('/admin/dashboard');
});
