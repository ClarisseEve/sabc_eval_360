<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\{User, Notes, Regions};

class AdminController extends Controller
{
    public function index()
    {
        $users = User::get();
        return view('admin.index',compact('users'));
    }
}
