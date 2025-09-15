<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;

use App\Models\User;
use App\Models\Services_cciaux;
use App\Models\Regions;
use App\Models\UserService;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;
class UserController extends Controller
{
    public function index()
    {
        // Get authenticated user
        $user = Auth::user();

        // Check if user is authenticated
        if (!$user) {
            return redirect()->route('login');
        }
        // return redirect()->intended($this->getUserDashboardRoute($user->type));

        return view('profile.index', [
            'user' => $user,
            'userType' => $user->type,
            'link' => $this->getUserDashboardRoute($user->type),
        ]);
    }

    public function showChangePasswordForm()
    {
        $user = Auth::user();

        if (!$user) {
            return redirect()->route('login');
        }

        return view('profile.password', [
            'user' => $user,
            'userType' => $user->type,
        ]);
    }

    public function changePassword(Request $request)
    {
        $user = Auth::user();

        // Validation rules
        $validator = Validator::make($request->all(), [
            'current_password' => 'required',
            'new_password' => 'required|string|min:8|confirmed|regex:/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]+$/',
        ], [
            'new_password.regex' => 'Le mot de passe doit contenir au moins une majuscule, une minuscule, un chiffre et un caractère spécial.'
        ]);

        // Check current password
        if (!Hash::check($request->current_password, $user->password)) {
            return back()->withErrors(['current_password' => 'Le mot de passe actuel est incorrect']);
        }

        // Update password
        $user->password = Hash::make($request->new_password);
        $user->save();

        return back()->with('success', 'Mot de passe modifié avec succès!');
    }
    
    
    public function defaultPassword(Request $request)
    {
        $user = Auth::user();
        // Update password
        $user->password = Hash::make('password');
        $user->save();

        return back()->with('success', 'Mot de passe modifié avec succès!');
    }

    private function getUserDashboardRoute($userType)
    {
        $routes = [
            'CDS' => 'cds.dashboard',
            'CDV' => 'cdv.dashboard',
            'CSC' => 'csc.dashboard',
            'ADMIN' => 'admin.dashboard',
            'DR' => 'dr.dashboard',
            'CDC TT' => 'cdctt.dashboard',
        ];

        return route($routes[$userType] ?? 'login');
    }
}
