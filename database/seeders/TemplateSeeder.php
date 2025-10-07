<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\DB;

class TemplateSeeder extends Seeder
{
    public function run(): void
    {
        // Simple competencies
        $competencies = [
            ['libelle' => 'Planification', 'description' => 'Capacité à planifier et organiser', 'categorie' => 'Manageriale'],
            ['libelle' => 'Négociation', 'description' => 'Conduire des négociations efficaces', 'categorie' => 'Commerciale'],
            ['libelle' => 'Suivi du portefeuille', 'description' => 'Gestion et suivi des clients', 'categorie' => 'Commerciale'],
        ];

        $compIds = [];
        foreach ($competencies as $c) {
            $id = (string) Str::uuid();
            DB::connection('pgsql')->table('competencies')->updateOrInsert(
                ['libelle' => $c['libelle']],
                array_merge($c, ['id' => $id, 'actif' => true, 'updated_at' => now(), 'created_at' => now()])
            );
            $row = DB::connection('pgsql')->table('competencies')->where('libelle', $c['libelle'])->first();
            $compIds[$c['libelle']] = $row ? $row->id : $id;
        }

        // Créer par défaut un template pour chaque rôle évalué (selon EvaluationPermission),
        // en excluant les rôles jamais évalués (ex: ADMIN n'est pas une cible évaluée ici).
        $evaluatedRoles = collect(\DB::connection('pgsql')->table('evaluation_permissions')
            ->where('est_autorise', true)
            ->pluck('role_evalue'))
            ->unique()
            ->values();

        foreach ($evaluatedRoles as $roleEvalue) {
            // Créer le template si manquant (idempotent via nom+evaluated_role)
            $existing = DB::connection('pgsql')->table('templates')
                ->where('evaluated_role', $roleEvalue)
                ->first();

            $templateId = $existing?->id_template ?? (string) Str::uuid();
            DB::connection('pgsql')->table('templates')->updateOrInsert(
                ['id_template' => $templateId],
                [
                    'nom' => 'Fiche ' . $roleEvalue . ' 2025',
                    'description' => 'Évaluation des compétences ' . $roleEvalue,
                    'statut' => 'published',
                    'version' => 1,
                    'evaluated_role' => $roleEvalue,
                    'meta_json' => json_encode(['source' => 'seed']),
                    'created_at' => now(),
                    'updated_at' => now(),
                ]
            );

            // Rôles évaluateurs autorisés pour ce rôle (tous types confondus)
            $evaluatorRoles = collect(\DB::connection('pgsql')->table('evaluation_permissions')
                ->where('est_autorise', true)
                ->where('role_evalue', $roleEvalue)
                ->pluck('role_evaluateur'))
                ->unique()
                ->values();

            foreach ($evaluatorRoles as $roleEval) {
                DB::connection('pgsql')->table('template_evaluator_roles')->updateOrInsert(
                    ['template_id' => $templateId, 'role_evaluateur' => $roleEval],
                    ['id' => (string) Str::uuid(), 'created_at' => now(), 'updated_at' => now()]
                );
            }

            // Items par défaut (utilisent les 2-3 compétences de base seedées plus haut)
            $defaults = [
                ['competence' => 'Planification', 'section' => 'Management', 'section_order' => 1, 'ordre' => 1],
                ['competence' => 'Négociation', 'section' => 'Commercial', 'section_order' => 2, 'ordre' => 1],
                ['competence' => 'Suivi du portefeuille', 'section' => 'Commercial', 'section_order' => 2, 'ordre' => 2],
            ];
            foreach ($defaults as $it) {
                $compId = $compIds[$it['competence']] ?? null;
                if (!$compId) continue;
                DB::connection('pgsql')->table('template_items')->updateOrInsert(
                    ['template_id' => $templateId, 'competence_id' => $compId],
                    [
                        'id' => (string) Str::uuid(),
                        'ordre' => $it['ordre'],
                        'poids_critere' => null,
                        'require_comment_if_below' => 3,
                        'scale_min' => 1,
                        'scale_max' => 5,
                        'section_label' => $it['section'],
                        'section_order' => $it['section_order'],
                        'created_at' => now(),
                        'updated_at' => now(),
                    ]
                );
            }

            // Snapshot en regles_evaluation pour aligner avec evaluation_permissions
            $items = DB::connection('pgsql')->table('template_items as ti')
                ->leftJoin('competencies as c', 'c.id', '=', 'ti.competence_id')
                ->where('ti.template_id', $templateId)
                ->orderBy('ti.section_order')
                ->orderBy('ti.ordre')
                ->get();

            $criteres = [];
            foreach ($items as $it) {
                $criteres[] = [
                    'id' => (string) $it->id,
                    'libelle' => $it->libelle ?? 'Critère',
                    'description' => $it->description ?? null,
                    'poids' => $it->poids_critere,
                    'echelle' => ($it->scale_min ?? 1) . '-' . ($it->scale_max ?? 5),
                    'section_label' => $it->section_label,
                    'section_order' => $it->section_order,
                ];
            }

            $nomRegle = 'Règle ' . $roleEvalue . ' ' . now()->year;
            // Upsert par nom_regle pour ce rôle (1 par rôle pour ce seed)
            $existingRule = DB::connection('pgsql')->table('regles_evaluation')->where('nom_regle', $nomRegle)->first();
            $ruleId = $existingRule->id_regle ?? (string) Str::uuid();

            DB::connection('pgsql')->table('regles_evaluation')->updateOrInsert(
                ['id_regle' => $ruleId],
                [
                    'nom_regle' => $nomRegle,
                    'description' => 'Snapshot du template ' . ($existing->nom ?? 'N/A'),
                    'criteres_evaluation_json' => json_encode($criteres),
                    'est_active' => true,
                    'date_debut' => now()->toDateString(),
                    'date_fin' => null,
                    'parametres_json' => json_encode([
                        'template_id' => $templateId,
                        'evaluated_role' => $roleEvalue,
                        'evaluator_roles' => $evaluatorRoles,
                    ]),
                    'created_at' => $existingRule?->created_at ?? now(),
                    'updated_at' => now(),
                ]
            );
        }
    }
}
