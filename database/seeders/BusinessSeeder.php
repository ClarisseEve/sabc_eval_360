<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use App\Models\RegleEvaluation;
use App\Models\PeriodeEvaluation;

class BusinessSeeder extends Seeder
{
    /**
     * Seed PostgreSQL (Business Database) avec la logique métier
     */
    public function run(): void
    {
        $this->command->info('🌱 Seeding PostgreSQL Business Database...');

        // 1. Créer les règles d'évaluation selon la matrice SABC
        $this->seedReglesEvaluation();
        
        // 2. Créer les périodes d'évaluation
        $this->seedPeriodesEvaluation();
        
        // 3. Créer des données de test pour les évaluations (optionnel)
        $this->seedEvaluationsTest();
        
        $this->command->info('✅ PostgreSQL Business Database seeded successfully!');
    }

    /**
     * Seed les règles d'évaluation selon la nouvelle structure PostgreSQL
     */
    private function seedReglesEvaluation()
    {
        $regles = [
            [
                // UUID fixé pour correspondre au mapping contrôleur
                'id_regle' => '09ee8f71-5067-4d4f-995f-817f3eb44f8e',
                'nom_regle' => 'Règle Évaluation DR vers CDTT',
                'description' => 'Règle d\'évaluation descendante du Directeur Régional vers Chef Département Trade',
                'criteres_evaluation_json' => json_encode([
                    [
                        'id_critere' => 'C001',
                        'libelle' => 'Communication',
                        'description' => 'Capacité à communiquer efficacement',
                        'poids' => 25,
                        'echelle' => '1-5'
                    ],
                    [
                        'id_critere' => 'C002',
                        'libelle' => 'Leadership',
                        'description' => 'Capacité à diriger et motiver une équipe',
                        'poids' => 25,
                        'echelle' => '1-5'
                    ],
                    [
                        'id_critere' => 'C003',
                        'libelle' => 'Résultats',
                        'description' => 'Atteinte des objectifs fixés',
                        'poids' => 30,
                        'echelle' => '1-5'
                    ],
                    [
                        'id_critere' => 'C004',
                        'libelle' => 'Innovation',
                        'description' => 'Capacité à innover et proposer des améliorations',
                        'poids' => 20,
                        'echelle' => '1-5'
                    ]
                ]),
                'est_active' => true,
                'date_debut' => now()->startOfYear(),
                'date_fin' => now()->endOfYear(),
                'parametres_json' => json_encode([
                    'role_evaluateur' => 'DR',
                    'role_evalue' => 'CDTT',
                    'type_evaluation' => 'descendante',
                    'meme_region_obligatoire' => true,
                    'meme_branche_obligatoire' => false
                ])
            ],
            [
                // UUID fixé pour correspondre au mapping contrôleur
                'id_regle' => 'c491935b-2368-40b1-80fc-49e7dff4cd09',
                'nom_regle' => 'Règle Évaluation CDTT vers CSC',
                'description' => 'Règle d\'évaluation descendante du Chef Département Trade vers Chef Service Commercial',
                'criteres_evaluation_json' => json_encode([
                    [
                        'id_critere' => 'M001',
                        'libelle' => 'Gestion d\'Équipe',
                        'description' => 'Capacité à gérer et développer son équipe',
                        'poids' => 30,
                        'echelle' => '1-5'
                    ],
                    [
                        'id_critere' => 'M002',
                        'libelle' => 'Vision Stratégique',
                        'description' => 'Capacité à définir et communiquer une vision',
                        'poids' => 25,
                        'echelle' => '1-5'
                    ],
                    [
                        'id_critere' => 'M003',
                        'libelle' => 'Gestion des Conflits',
                        'description' => 'Capacité à résoudre les conflits',
                        'poids' => 25,
                        'echelle' => '1-5'
                    ],
                    [
                        'id_critere' => 'M004',
                        'libelle' => 'Prise de Décision',
                        'description' => 'Qualité et rapidité des décisions prises',
                        'poids' => 20,
                        'echelle' => '1-5'
                    ]
                ]),
                'est_active' => true,
                'date_debut' => now()->startOfYear(),
                'date_fin' => now()->endOfYear(),
                'parametres_json' => json_encode([
                    'role_evaluateur' => 'CDTT',
                    'role_evalue' => 'CSC',
                    'type_evaluation' => 'descendante',
                    'meme_region_obligatoire' => true,
                    'meme_branche_obligatoire' => true
                ])
            ],
            [
                // UUID fixé pour correspondre au mapping contrôleur
                'id_regle' => '93032fd5-56d6-4e04-a10f-ddfa33c1b830',
                'nom_regle' => 'Règle Évaluation CSC par pairs',
                'description' => 'Règle d\'évaluation par les pairs entre Chefs Service Commercial',
                'criteres_evaluation_json' => json_encode([
                    [
                        'id_critere' => 'P001',
                        'libelle' => 'Collaboration',
                        'description' => 'Capacité à travailler en équipe',
                        'poids' => 30,
                        'echelle' => '1-5'
                    ],
                    [
                        'id_critere' => 'P002',
                        'libelle' => 'Partage de Connaissances',
                        'description' => 'Volonté de partager ses connaissances',
                        'poids' => 25,
                        'echelle' => '1-5'
                    ],
                    [
                        'id_critere' => 'P003',
                        'libelle' => 'Professionnalisme',
                        'description' => 'Attitude professionnelle au quotidien',
                        'poids' => 25,
                        'echelle' => '1-5'
                    ],
                    [
                        'id_critere' => 'P004',
                        'libelle' => 'Adaptabilité',
                        'description' => 'Capacité à s\'adapter aux changements',
                        'poids' => 20,
                        'echelle' => '1-5'
                    ]
                ]),
                'est_active' => true,
                'date_debut' => now()->startOfYear(),
                'date_fin' => now()->endOfYear(),
                'parametres_json' => json_encode([
                    'role_evaluateur' => 'CSC',
                    'role_evalue' => 'CSC',
                    'type_evaluation' => 'pairs',
                    'meme_region_obligatoire' => true,
                    'meme_branche_obligatoire' => true
                ])
            ]
        ];

        foreach ($regles as $regleData) {
            DB::connection('pgsql')->table('regles_evaluation')->updateOrInsert(
                ['nom_regle' => $regleData['nom_regle']], 
                $regleData
            );
        }

        $this->command->line('  📋 ' . count($regles) . ' règles d\'évaluation créées');
    }

    /**
     * Seed les périodes d'évaluation selon la nouvelle structure PostgreSQL
     */
    private function seedPeriodesEvaluation()
    {
        $currentYear = now()->year;
        $periodes = [
            [
                'id_periode' => (string) \Illuminate\Support\Str::uuid(),
                'titre' => "Évaluation Semestrielle S1 {$currentYear}",
                'description' => 'Première période d\'évaluation semestrielle pour l\'année en cours. Cette période couvre les performances du premier semestre.',
                'date_debut' => now()->startOfYear(),
                'date_fin' => now()->startOfYear()->addMonths(6)->subDay(),
                // Aligner avec EvaluationService qui vérifie 'active'
                'statut' => 'active',
                'id_regle' => null,
                'parametres_json' => json_encode([
                    'code_periode' => '2025-S1',
                    'type_evaluation' => '360',
                    'duree_evaluation_jours' => 30,
                    'rappels_automatiques' => true
                ])
            ],
            [
                'id_periode' => (string) \Illuminate\Support\Str::uuid(),
                'titre' => "Évaluation Semestrielle S2 {$currentYear}",
                'description' => 'Deuxième période d\'évaluation semestrielle pour l\'année en cours. Cette période couvre les performances du second semestre.',
                'date_debut' => now()->startOfYear()->addMonths(6),
                'date_fin' => now()->endOfYear(),
                'statut' => 'planifiee',
                'id_regle' => null,
                'parametres_json' => json_encode([
                    'code_periode' => '2025-S2',
                    'type_evaluation' => '360',
                    'duree_evaluation_jours' => 30,
                    'rappels_automatiques' => true
                ])
            ]
        ];

        foreach ($periodes as $periodeData) {
            DB::connection('pgsql')->table('periodes_evaluation')->updateOrInsert(
                ['titre' => $periodeData['titre']], 
                $periodeData
            );
        }

        $this->command->line('  📅 ' . count($periodes) . ' périodes d\'évaluation créées');
    }

    /**
     * Seed quelques évaluations de test basées sur les questionnaires réels du dossier sample
     */
    private function seedEvaluationsTest()
    {
        // Évaluations basées sur les compétences réelles des questionnaires CDS et CDV
        $evaluations = [
            // Évaluation CDS (Chef de Secteur) - Compétences commerciales
            [
                'id_evaluation' => 'EV-001',
                'evaluateur_matricule' => 'US-05', // CSC Littoral Commercial évalue CDS
                'evalue_matricule' => 'US-07',      // CDS à évaluer
                'id_regle' => null, // Pas de règle spécifique pour ce test
                'type_evaluation' => 'descendante',
                'date_evaluation' => now()->subDays(5)->format('Y-m-d'),
                'date_soumission' => now()->subDays(4),
                'statut' => 'valide',
                'notations_json' => json_encode([
                    'connaissance_produit' => [
                        'note' => 4, 
                        'commentaire' => 'Possède une connaissance approfondie des produits. Peut expliquer les caractéristiques et avantages de manière détaillée.'
                    ],
                    'techniques_ventes' => [
                        'note' => 4, 
                        'commentaire' => 'Maîtrise une variété de techniques de vente avancées. Anticipe les besoins des clients.'
                    ],
                    'gestion_temps' => [
                        'note' => 3, 
                        'commentaire' => 'Respecte les échéances mais peut améliorer la planification stratégique.'
                    ],
                    'negociation_commerciale' => [
                        'note' => 4, 
                        'commentaire' => 'Utilise efficacement les techniques de négociation et gère bien les objections.'
                    ],
                    'analyse_donnees' => [
                        'note' => 3, 
                        'commentaire' => 'Capable d\'analyser les données mais pourrait approfondir les insights.'
                    ],
                    'reporting' => [
                        'note' => 4, 
                        'commentaire' => 'Produit des rapports clairs et pertinents avec une bonne structure.'
                    ],
                    'outils_analyse' => [
                        'note' => 3, 
                        'commentaire' => 'Maîtrise les outils de base mais pourrait explorer des outils plus avancés.'
                    ],
                    'analyse_marche' => [
                        'note' => 4, 
                        'commentaire' => 'Analyse efficacement le marché et identifie les opportunités.'
                    ]
                ]),
                'note_globale' => 3.63,
                'commentaire_general' => 'Performance solide avec de bonnes compétences commerciales. Axes d\'amélioration sur la gestion du temps et l\'analyse de données.',
            ],
            
            // Évaluation CDV (Chef District Vente) - Compétences management
            [
                'id_evaluation' => 'EV-002',
                'evaluateur_matricule' => 'US-05', // CSC Littoral Commercial évalue CDV
                'evalue_matricule' => 'US-08',      // CDV à évaluer (si existe)
                'id_regle' => null, // Pas de règle spécifique pour ce test
                'type_evaluation' => 'descendante',
                'date_evaluation' => now()->subDays(3)->format('Y-m-d'),
                'date_soumission' => now()->subDays(2),
                'statut' => 'valide',
                'notations_json' => json_encode([
                    'management_equipes' => [
                        'note' => 4, 
                        'commentaire' => 'Communique efficacement les objectifs. Fournit un feedback constructif et encourage la collaboration.'
                    ],
                    'techniques_commercialisation' => [
                        'note' => 4, 
                        'commentaire' => 'Comprend bien les besoins du marché et utilise des stratégies de vente adaptées.'
                    ],
                    'techniques_marketing' => [
                        'note' => 3, 
                        'commentaire' => 'Maîtrise les principes fondamentaux mais pourrait mieux exploiter les outils numériques.'
                    ],
                    'vente_negociation' => [
                        'note' => 5, 
                        'commentaire' => 'Expert en techniques de vente. Utilise des stratégies hautement efficaces et négocie avec succès.'
                    ],
                    'conduite_changement' => [
                        'note' => 3, 
                        'commentaire' => 'Communique les raisons du changement mais pourrait mieux impliquer les parties prenantes.'
                    ],
                    'analyse_marche' => [
                        'note' => 4, 
                        'commentaire' => 'Utilise des méthodes avancées d\'analyse et identifie des opportunités de manière proactive.'
                    ],
                    'techniques_statistiques' => [
                        'note' => 3, 
                        'commentaire' => 'Maîtrise les concepts avancés mais pourrait améliorer l\'interprétation des résultats complexes.'
                    ],
                    'communication' => [
                        'note' => 4, 
                        'commentaire' => 'Communication claire et adaptée au public. Bonne capacité d\'écoute active.'
                    ]
                ]),
                'note_globale' => 3.75,
                'commentaire_general' => 'Excellent dans la vente et négociation. Bon manager avec des axes d\'amélioration sur le marketing digital et la conduite du changement.',
            ],
            
            // Auto-évaluation CSC
            [
                'id_evaluation' => 'EV-003',
                'evaluateur_matricule' => 'US-05', // CSC s'auto-évalue
                'evalue_matricule' => 'US-05',      // Même personne
                'id_regle' => null, // Pas de règle spécifique pour ce test
                'type_evaluation' => 'auto',
                'date_evaluation' => now()->subDays(1)->format('Y-m-d'),
                'date_soumission' => now(),
                'statut' => 'soumis',
                'notations_json' => json_encode([
                    'leadership' => [
                        'note' => 4, 
                        'commentaire' => 'Je pense avoir développé de bonnes compétences de leadership cette année.'
                    ],
                    'gestion_equipe' => [
                        'note' => 3, 
                        'commentaire' => 'J\'ai encore des progrès à faire dans la gestion des conflits au sein de l\'équipe.'
                    ],
                    'vision_strategique' => [
                        'note' => 4, 
                        'commentaire' => 'Je développe une vision claire pour mon service et communique bien les objectifs.'
                    ],
                    'innovation' => [
                        'note' => 3, 
                        'commentaire' => 'Je cherche à innover mais j\'aimerais être plus proactif dans ce domaine.'
                    ],
                    'communication' => [
                        'note' => 4, 
                        'commentaire' => 'Ma communication avec l\'équipe et la hiérarchie s\'est améliorée.'
                    ],
                    'resultats' => [
                        'note' => 4, 
                        'commentaire' => 'Les objectifs de mon service ont été atteints cette période.'
                    ]
                ]),
                'note_globale' => 3.67,
                'commentaire_general' => 'Je suis globalement satisfait de ma performance cette période, avec des axes d\'amélioration identifiés sur la gestion d\'équipe et l\'innovation.',
            ]
        ];

        foreach ($evaluations as $evaluationData) {
            // Générer un UUID pour id_evaluation si ce n'est pas déjà fait
            if (!isset($evaluationData['id_evaluation']) || !preg_match('/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i', $evaluationData['id_evaluation'])) {
                $evaluationData['id_evaluation'] = (string) \Illuminate\Support\Str::uuid();
            }
            
            // Ajouter les métadonnées de synchronisation
            $evaluationData['source_system'] = 'postgres';
            $evaluationData['sync_status'] = 'pending';
            $evaluationData['created_at'] = now();
            $evaluationData['updated_at'] = now();
            
            DB::connection('pgsql')->table('evaluations')->updateOrInsert(
                ['evaluateur_matricule' => $evaluationData['evaluateur_matricule'], 'evalue_matricule' => $evaluationData['evalue_matricule'], 'date_evaluation' => $evaluationData['date_evaluation']], 
                $evaluationData
            );
        }
        
        $this->command->line('  📊 ' . count($evaluations) . ' évaluations réalistes créées basées sur les questionnaires SABC');
    }
}
