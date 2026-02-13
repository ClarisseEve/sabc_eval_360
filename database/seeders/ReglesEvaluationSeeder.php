<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\RegleEvaluation;
use Illuminate\Support\Facades\DB;

class ReglesEvaluationSeeder extends Seeder
{
    public function run()
    {
        // Vérifier la connexion PostgreSQL
        try {
            DB::connection('pgsql')->getPdo();
            $this->command->info('✅ Connexion PostgreSQL établie');
        } catch (\Exception $e) {
            $this->command->error('❌ Impossible de se connecter à PostgreSQL');
            $this->command->error('Erreur: ' . $e->getMessage());
            $this->command->warn('💡 Assurez-vous que Docker est démarré: docker-compose up -d postgres');
            return;
        }
        
        // Vérifier et nettoyer la table avec PDO direct
        try {
            $this->command->info('🔍 Vérification de la table regles_evaluation...');
            $pdo = DB::connection('pgsql')->getPdo();
            $pdo->setAttribute(\PDO::ATTR_TIMEOUT, 5);
            
            $stmt = $pdo->query("SELECT COUNT(*) as count FROM regles_evaluation");
            $result = $stmt->fetch(\PDO::FETCH_ASSOC);
            $count = $result['count'] ?? 0;
            $this->command->info("✅ Table trouvée ({$count} règles existantes)");
            
            if ($count > 0) {
                $this->command->info('🔄 Suppression des règles existantes...');
                $pdo->exec("DELETE FROM regles_evaluation");
                $this->command->info('✅ Règles existantes supprimées');
            }
        } catch (\Exception $e) {
            $this->command->error('❌ Erreur lors de la vérification de la table');
            $this->command->error('Erreur: ' . $e->getMessage());
            return;
        }
        
        $regles = [
            [
                'nom_regle' => 'Auto-évaluation Standard SABC',
                'description' => 'Règle d\'auto-évaluation standard pour tous les collaborateurs',
                'role_evaluateur' => 'CDS',
                'role_evalue' => 'CDS',
                'type_evaluation' => 'auto',
                'criteres' => [
                    [
                        'id' => 'crit-1',
                        'nom' => 'Compétences techniques',
                        'description' => 'Maîtrise des outils et techniques métier',
                        'ponderation' => 25,
                        'echelle' => ['min' => 1, 'max' => 5],
                        'categorie' => 'Compétences techniques',
                    ],
                    [
                        'id' => 'crit-2',
                        'nom' => 'Communication',
                        'description' => 'Capacité à communiquer efficacement',
                        'ponderation' => 20,
                        'echelle' => ['min' => 1, 'max' => 5],
                        'categorie' => 'Soft skills',
                    ],
                    [
                        'id' => 'crit-3',
                        'nom' => 'Travail d\'équipe',
                        'description' => 'Collaboration et esprit d\'équipe',
                        'ponderation' => 20,
                        'echelle' => ['min' => 1, 'max' => 5],
                        'categorie' => 'Soft skills',
                    ],
                    [
                        'id' => 'crit-4',
                        'nom' => 'Atteinte des objectifs',
                        'description' => 'Réalisation des objectifs fixés',
                        'ponderation' => 20,
                        'echelle' => ['min' => 1, 'max' => 5],
                        'categorie' => 'Performance',
                    ],
                    [
                        'id' => 'crit-5',
                        'nom' => 'Autonomie',
                        'description' => 'Capacité à travailler de manière autonome',
                        'ponderation' => 15,
                        'echelle' => ['min' => 1, 'max' => 5],
                        'categorie' => 'Autonomie',
                    ],
                ],
                'categories' => ['Compétences techniques', 'Soft skills', 'Performance', 'Autonomie'],
                'meme_region_obligatoire' => true,
                'meme_branche_obligatoire' => true,
            ],
            [
                'nom_regle' => 'Évaluation Pairs CSC',
                'description' => 'Règle d\'évaluation par les pairs pour les Chefs de Service Commercial',
                'role_evaluateur' => 'CSC',
                'role_evalue' => 'CSC',
                'type_evaluation' => 'pairs',
                'criteres' => [
                    [
                        'id' => 'crit-1',
                        'nom' => 'Collaboration inter-services',
                        'description' => 'Capacité à collaborer avec les autres services',
                        'ponderation' => 25,
                        'echelle' => ['min' => 1, 'max' => 5],
                        'categorie' => 'Travail d\'équipe',
                    ],
                    [
                        'id' => 'crit-2',
                        'nom' => 'Partage de connaissances',
                        'description' => 'Partage d\'expertise et bonnes pratiques',
                        'ponderation' => 20,
                        'echelle' => ['min' => 1, 'max' => 5],
                        'categorie' => 'Soft skills',
                    ],
                    [
                        'id' => 'crit-3',
                        'nom' => 'Communication professionnelle',
                        'description' => 'Qualité de la communication avec les pairs',
                        'ponderation' => 20,
                        'echelle' => ['min' => 1, 'max' => 5],
                        'categorie' => 'Soft skills',
                    ],
                    [
                        'id' => 'crit-4',
                        'nom' => 'Résolution de problèmes',
                        'description' => 'Capacité à résoudre des problèmes complexes',
                        'ponderation' => 20,
                        'echelle' => ['min' => 1, 'max' => 5],
                        'categorie' => 'Résolution de problèmes',
                    ],
                    [
                        'id' => 'crit-5',
                        'nom' => 'Innovation',
                        'description' => 'Proposition de solutions innovantes',
                        'ponderation' => 15,
                        'echelle' => ['min' => 1, 'max' => 5],
                        'categorie' => 'Innovation',
                    ],
                ],
                'categories' => ['Travail d\'équipe', 'Soft skills', 'Résolution de problèmes', 'Innovation'],
                'meme_region_obligatoire' => true,
                'meme_branche_obligatoire' => true,
            ],
            [
                'nom_regle' => 'Évaluation Descendante CDV → CDS',
                'description' => 'Règle d\'évaluation des Chefs de Secteur par leur Chef de District',
                'role_evaluateur' => 'CDV',
                'role_evalue' => 'CDS',
                'type_evaluation' => 'descendante',
                'criteres' => [
                    [
                        'id' => 'crit-1',
                        'nom' => 'Performance commerciale',
                        'description' => 'Atteinte des objectifs de vente',
                        'ponderation' => 30,
                        'echelle' => ['min' => 1, 'max' => 5],
                        'categorie' => 'Performance',
                    ],
                    [
                        'id' => 'crit-2',
                        'nom' => 'Gestion de l\'équipe',
                        'description' => 'Management et développement de l\'équipe',
                        'ponderation' => 25,
                        'echelle' => ['min' => 1, 'max' => 5],
                        'categorie' => 'Leadership',
                    ],
                    [
                        'id' => 'crit-3',
                        'nom' => 'Respect des procédures',
                        'description' => 'Application des procédures SABC',
                        'ponderation' => 15,
                        'echelle' => ['min' => 1, 'max' => 5],
                        'categorie' => 'Compétences techniques',
                    ],
                    [
                        'id' => 'crit-4',
                        'nom' => 'Communication avec la hiérarchie',
                        'description' => 'Qualité des remontées d\'information',
                        'ponderation' => 15,
                        'echelle' => ['min' => 1, 'max' => 5],
                        'categorie' => 'Soft skills',
                    ],
                    [
                        'id' => 'crit-5',
                        'nom' => 'Développement du secteur',
                        'description' => 'Initiatives pour développer le secteur',
                        'ponderation' => 15,
                        'echelle' => ['min' => 1, 'max' => 5],
                        'categorie' => 'Innovation',
                    ],
                ],
                'categories' => ['Performance', 'Leadership', 'Compétences techniques', 'Soft skills', 'Innovation'],
                'meme_region_obligatoire' => true,
                'meme_branche_obligatoire' => true,
            ],
        ];
        
        $created = 0;
        $pdo = DB::connection('pgsql')->getPdo();
        
        foreach ($regles as $index => $regleData) {
            try {
                $this->command->info("🔄 Création règle " . ($index + 1) . ": {$regleData['nom_regle']}");
                
                // Préparer le JSON des critères
                $criteresJson = json_encode([
                    'criteres' => $regleData['criteres'],
                    'categories' => $regleData['categories'],
                ]);
                
                // Insertion avec PDO direct
                $stmt = $pdo->prepare("
                    INSERT INTO regles_evaluation (
                        nom_regle, description, role_evaluateur, role_evalue, 
                        type_evaluation, criteres_evaluation_json, est_active,
                        meme_region_obligatoire, meme_branche_obligatoire,
                        created_at, updated_at
                    ) VALUES (?, ?, ?, ?, ?, ?::jsonb, ?, ?, ?, NOW(), NOW())
                    RETURNING id_regle
                ");
                
                $stmt->execute([
                    $regleData['nom_regle'],
                    $regleData['description'],
                    $regleData['role_evaluateur'],
                    $regleData['role_evalue'],
                    $regleData['type_evaluation'],
                    $criteresJson,
                    true,
                    $regleData['meme_region_obligatoire'],
                    $regleData['meme_branche_obligatoire'],
                ]);
                
                $result = $stmt->fetch(\PDO::FETCH_ASSOC);
                $idRegle = $result['id_regle'] ?? 'unknown';
                
                $this->command->info("✅ Règle créée avec ID: {$idRegle}");
                $created++;
            } catch (\Exception $e) {
                $this->command->error("❌ Erreur lors de la création de la règle " . ($index + 1) . ": " . $e->getMessage());
            }
        }
        
        $this->command->info("✅ {$created}/3 règles d'évaluation créées avec succès");
    }
}
