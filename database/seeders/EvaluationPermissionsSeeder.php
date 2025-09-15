<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\EvaluationPermission;
use Illuminate\Support\Str;

class EvaluationPermissionsSeeder extends Seeder
{
    /**
     * Run the database seeds.
     * Peuple les permissions d'évaluation selon les règles métier SABC
     */
    public function run(): void
    {
        $permissions = [
            // ADMIN - Peut tout évaluer sauf auto-évaluation et pairs
            ['role_evaluateur' => 'ADMIN', 'role_evalue' => 'DR', 'type_evaluation' => 'descendante', 'est_autorise' => true],
            ['role_evaluateur' => 'ADMIN', 'role_evalue' => 'CDTT', 'type_evaluation' => 'descendante', 'est_autorise' => true],
            ['role_evaluateur' => 'ADMIN', 'role_evalue' => 'CSC', 'type_evaluation' => 'descendante', 'est_autorise' => true],
            ['role_evaluateur' => 'ADMIN', 'role_evalue' => 'RTM', 'type_evaluation' => 'descendante', 'est_autorise' => true],
            ['role_evaluateur' => 'ADMIN', 'role_evalue' => 'SRMO', 'type_evaluation' => 'descendante', 'est_autorise' => true],
            
            // DR - Pas d'auto-évaluation, pas de pairs, peut évaluer subordonnés
            ['role_evaluateur' => 'DR', 'role_evalue' => 'DR', 'type_evaluation' => 'auto', 'est_autorise' => false],
            ['role_evaluateur' => 'DR', 'role_evalue' => 'DR', 'type_evaluation' => 'pairs', 'est_autorise' => false],
            ['role_evaluateur' => 'DR', 'role_evalue' => 'CDTT', 'type_evaluation' => 'descendante', 'est_autorise' => true],
            ['role_evaluateur' => 'DR', 'role_evalue' => 'CSC', 'type_evaluation' => 'descendante', 'est_autorise' => true],
            
            // CDTT - Pas d'auto-évaluation, pas de pairs, peut évaluer subordonnés
            ['role_evaluateur' => 'CDTT', 'role_evalue' => 'CDTT', 'type_evaluation' => 'auto', 'est_autorise' => false],
            ['role_evaluateur' => 'CDTT', 'role_evalue' => 'CDTT', 'type_evaluation' => 'pairs', 'est_autorise' => false],
            ['role_evaluateur' => 'CDTT', 'role_evalue' => 'CSC', 'type_evaluation' => 'descendante', 'est_autorise' => true],
            ['role_evaluateur' => 'CDTT', 'role_evalue' => 'RTM', 'type_evaluation' => 'descendante', 'est_autorise' => true],
            
            // CSC - Auto-évaluation et pairs autorisés, peut évaluer subordonnés
            ['role_evaluateur' => 'CSC', 'role_evalue' => 'CSC', 'type_evaluation' => 'auto', 'est_autorise' => true],
            ['role_evaluateur' => 'CSC', 'role_evalue' => 'CSC', 'type_evaluation' => 'pairs', 'est_autorise' => true],
            ['role_evaluateur' => 'CSC', 'role_evalue' => 'CDV', 'type_evaluation' => 'descendante', 'est_autorise' => true],
            
            // RTM - Auto-évaluation autorisée, pas de pairs (unique), peut évaluer subordonnés
            ['role_evaluateur' => 'RTM', 'role_evalue' => 'RTM', 'type_evaluation' => 'auto', 'est_autorise' => true],
            ['role_evaluateur' => 'RTM', 'role_evalue' => 'RTM', 'type_evaluation' => 'pairs', 'est_autorise' => false],
            ['role_evaluateur' => 'RTM', 'role_evalue' => 'TMO', 'type_evaluation' => 'descendante', 'est_autorise' => true],
            ['role_evaluateur' => 'RTM', 'role_evalue' => 'SS', 'type_evaluation' => 'descendante', 'est_autorise' => true],
            
            // SRMO - Auto-évaluation autorisée, pas de pairs (unique), peut évaluer subordonnés
            ['role_evaluateur' => 'SRMO', 'role_evalue' => 'SRMO', 'type_evaluation' => 'auto', 'est_autorise' => true],
            ['role_evaluateur' => 'SRMO', 'role_evalue' => 'SRMO', 'type_evaluation' => 'pairs', 'est_autorise' => false],
            ['role_evaluateur' => 'SRMO', 'role_evalue' => 'TMO', 'type_evaluation' => 'descendante', 'est_autorise' => true],
            
            // CDV - Auto-évaluation et pairs autorisés, peut évaluer subordonnés
            ['role_evaluateur' => 'CDV', 'role_evalue' => 'CDV', 'type_evaluation' => 'auto', 'est_autorise' => true],
            ['role_evaluateur' => 'CDV', 'role_evalue' => 'CDV', 'type_evaluation' => 'pairs', 'est_autorise' => true],
            ['role_evaluateur' => 'CDV', 'role_evalue' => 'CDS', 'type_evaluation' => 'descendante', 'est_autorise' => true],
            
            // TMO - Auto-évaluation et pairs autorisés
            ['role_evaluateur' => 'TMO', 'role_evalue' => 'TMO', 'type_evaluation' => 'auto', 'est_autorise' => true],
            ['role_evaluateur' => 'TMO', 'role_evalue' => 'TMO', 'type_evaluation' => 'pairs', 'est_autorise' => true],
            
            // CDS - Auto-évaluation et pairs autorisés (pas de subordonnés)
            ['role_evaluateur' => 'CDS', 'role_evalue' => 'CDS', 'type_evaluation' => 'auto', 'est_autorise' => true],
            ['role_evaluateur' => 'CDS', 'role_evalue' => 'CDS', 'type_evaluation' => 'pairs', 'est_autorise' => true],
        ];
        
        foreach ($permissions as $permission) {
            EvaluationPermission::create([
                'id_permission' => Str::uuid()->toString(),
                'role_evaluateur' => $permission['role_evaluateur'],
                'role_evalue' => $permission['role_evalue'],
                'type_evaluation' => $permission['type_evaluation'],
                'est_autorise' => $permission['est_autorise'],
                'description' => "Permission {$permission['type_evaluation']} pour {$permission['role_evaluateur']} vers {$permission['role_evalue']}",
                'est_active' => true,
            ]);
        }
        
        $this->command->info('Permissions d\'évaluation créées selon les règles SABC.');
    }
}
