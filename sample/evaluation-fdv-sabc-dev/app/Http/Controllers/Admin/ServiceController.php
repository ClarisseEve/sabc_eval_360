<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\{User, UserService, Regions,Services_cciaux};


class ServiceController extends Controller
{
    public function index()
    {
        $regions = Regions::all();
        return view('admin.services.create', compact('regions'));
    }
    public function create()
    {
        $regions = Regions::all();
        return view('admin.services.create', compact('regions'));
    }

    public function store(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:50',
            'region_id' => 'required|exists:regions,id',
        ]);

        Services_cciaux::create([
            'sce_ccial' => $request->name,
            'taniere' => $request->is_taniere,
            'region' => $request->region_id,
        ]);

        return redirect()->route('admin.services.create')
            ->with('success', 'Service created successfully');
    }
}
