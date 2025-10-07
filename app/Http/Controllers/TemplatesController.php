<?php

namespace App\Http\Controllers;

use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Http\Request;

class TemplatesController extends Controller
{
    // Liste des templates publiés applicables au rôle de l'utilisateur connecté (évaluateur)
    public function applicables(Request $request)
    {
        $user = Auth::user();
        if (!$user) {
            return response()->json(['error' => 'Unauthenticated'], 401);
        }

        $role = $user->role_nom ?? $user->role ?? null;
        if (!$role) {
            return response()->json([]);
        }

        try {
            // Si les tables n'existent pas encore, retourner une liste vide propre
            $schema = DB::connection('pgsql')->getSchemaBuilder();
            $useNew = $schema->hasTable('templates') && $schema->hasTable('template_evaluator_roles');
            $templatesTable = $useNew ? 'templates' : 'business_templates';
            $rolesTable = $useNew ? 'template_evaluator_roles' : 'business_template_evaluator_roles';
            if (!$schema->hasTable($templatesTable) || !$schema->hasTable($rolesTable)) {
                return response()->json([]);
            }

            $rows = DB::connection('pgsql')
                ->table($templatesTable . ' as t')
                ->join($rolesTable . ' as er', 'er.template_id', '=', 't.id_template')
                ->where('t.statut', 'published')
                ->where('er.role_evaluateur', strtoupper($role))
                ->select('t.id_template as id', 't.nom', 't.description', 't.evaluated_role', 't.version', 't.updated_at')
                ->orderBy('t.updated_at', 'desc')
                ->get();

            return response()->json($rows);
        } catch (\Throwable $e) {
            // Ne pas casser l'UI, renvoyer vide et loguer côté serveur si besoin
            return response()->json([]);
        }
    }
}
