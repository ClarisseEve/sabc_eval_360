<?php

namespace App\Services;

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Schema;

class DatabaseSyncService
{
    /**
     * Synchronise les données Core (utilisateurs, régions, branches, rôles) de MySQL vers PostgreSQL
     * 
     * @param int $limit Nombre maximum d'enregistrements à synchroniser
     * @return array Statistiques de synchronisation
     */
    public function syncCoreDataToPostgres($limit = 100)
    {
        $stats = ['processed' => 0, 'synced' => 0, 'errors' => 0];
        
        try {
            // Vérifier si la table utilisateurs_ref existe dans PostgreSQL
            if (!Schema::connection('pgsql')->hasTable('utilisateurs_ref')) {
                // Créer la table si elle n'existe pas
                Schema::connection('pgsql')->create('utilisateurs_ref', function ($table) {
                    $table->string('matricule', 10)->primary();
                    $table->string('nom', 50);
                    $table->string('prenom', 50);
                    $table->string('email', 100)->unique();
                    $table->string('role', 20)->nullable();
                    $table->string('id_region', 10)->nullable();
                    $table->string('id_branche', 10)->nullable();
                    $table->string('region_nom', 50)->nullable();
                    $table->string('type_region', 20)->nullable();
                    $table->boolean('est_actif')->default(true);
                    $table->timestamps();
                });
                Log::info('Table utilisateurs_ref créée dans PostgreSQL');
            }
            
            // Synchroniser les utilisateurs (données de référence pour les évaluations)
            $utilisateurs = DB::connection('mysql')
                ->table('utilisateurs')
                ->limit($limit)
                ->get();
            
            Log::info('Synchronisation MySQL → PostgreSQL: ' . $utilisateurs->count() . ' utilisateurs trouvés');
            
            foreach ($utilisateurs as $utilisateur) {
                $stats['processed']++;
                
                try {
                    // Vérifier les champs disponibles dans l'objet utilisateur
                    $userData = [
                        'nom' => $utilisateur->nom ?? '',
                        'prenom' => $utilisateur->prenom ?? '',
                        'email' => $utilisateur->email ?? '',
                        'updated_at' => now(),
                    ];
                    
                    // Ajouter les champs optionnels s'ils existent
                    if (isset($utilisateur->role)) $userData['role'] = $utilisateur->role;
                    if (isset($utilisateur->id_region)) $userData['id_region'] = $utilisateur->id_region;
                    if (isset($utilisateur->id_branche)) $userData['id_branche'] = $utilisateur->id_branche;
                    if (isset($utilisateur->region_nom)) $userData['region_nom'] = $utilisateur->region_nom;
                    if (isset($utilisateur->type_region)) $userData['type_region'] = $utilisateur->type_region;
                    if (isset($utilisateur->est_actif)) $userData['est_actif'] = $utilisateur->est_actif;
                    
                    // Créer/mettre à jour dans PostgreSQL (table de référence)
                    DB::connection('pgsql')->table('utilisateurs_ref')->updateOrInsert(
                        ['matricule' => $utilisateur->matricule],
                        $userData
                    );
                    
                    $stats['synced']++;
                } catch (\Exception $e) {
                    $stats['errors']++;
                    Log::error("Erreur de synchronisation de l'utilisateur {$utilisateur->matricule}: " . $e->getMessage());
                    Log::error("Détails: " . json_encode($utilisateur));
                }
            }
            
            return $stats;
        } catch (\Exception $e) {
            Log::error("Erreur lors de la synchronisation des données Core: " . $e->getMessage());
            Log::error("Trace: " . $e->getTraceAsString());
            return ['processed' => 0, 'synced' => 0, 'errors' => 1, 'message' => $e->getMessage()];
        }
    }
    
    /**
     * Synchronise les données d'évaluation agrégées vers ClickHouse pour l'analytique
     * 
     * @param string $period Période à synchroniser (jour, semaine, mois)
     * @return array Statistiques de synchronisation
     */
    public function syncAnalyticsToClickHouse($period = 'day')
    {
        $stats = ['processed' => 0, 'synced' => 0, 'errors' => 0];
        
        try {
            // Détermine la date de début en fonction de la période
            $startDate = match($period) {
                'day' => now()->subDay(),
                'week' => now()->subWeek(),
                'month' => now()->subMonth(),
                default => now()->subDay()
            };
            
            Log::info("Synchronisation PostgreSQL → ClickHouse: période {$period}, date début {$startDate}");
            
            // Récupérer les données d'évaluation agrégées depuis PostgreSQL
            $evaluationsData = DB::connection('pgsql')
                ->table('evaluations')
                ->select(
                    'evalue_matricule',
                    'evaluateur_matricule', 
                    'type_evaluation',
                    DB::raw("AVG(note_globale) as note_moyenne"),
                    DB::raw('COUNT(*) as nombre_evaluations'),
                    DB::raw('DATE(date_evaluation) as date_jour')
                )
                ->where('date_evaluation', '>=', $startDate)
                ->whereNotNull('note_globale')
                ->groupBy('evalue_matricule', 'evaluateur_matricule', 'type_evaluation', 'date_jour')
                ->get();
            
            $stats['processed'] = $evaluationsData->count();
            Log::info("Données à synchroniser: {$stats['processed']} enregistrements");
            
            foreach ($evaluationsData as $data) {
                try {
                    // Vérifier les valeurs avant insertion
                    $insertData = [
                        $data->evalue_matricule ?? '',
                        $data->evaluateur_matricule ?? '',
                        $data->type_evaluation ?? '0', // Utiliser type_evaluation comme id_type_evaluation
                        (float)($data->note_moyenne ?? 0),
                        (int)($data->nombre_evaluations ?? 0),
                        $data->date_jour ?? now()->format('Y-m-d'),
                        now()
                    ];
                    
                    Log::debug("Insertion ClickHouse: " . json_encode([
                        'evalue' => $data->evalue_matricule,
                        'evaluateur' => $data->evaluateur_matricule,
                        'type' => $data->type_evaluation,
                        'note' => $data->note_moyenne,
                        'nombre' => $data->nombre_evaluations,
                        'date' => $data->date_jour
                    ]));
                    
                    // Insère dans ClickHouse - ClickHouse n'accepte pas les requêtes paramétrées comme MySQL/PostgreSQL
                    // On doit donc construire la requête SQL complète avec les valeurs
                    // Fonction d'échappement manuelle pour les chaînes
                    $escapeString = function($value) {
                        return str_replace(["'", '\\'], ["\\'", '\\\\'], $value);
                    };
                    
                    $evalue = $escapeString($data->evalue_matricule ?? '');
                    $evaluateur = $escapeString($data->evaluateur_matricule ?? '');
                    $typeEval = $escapeString($data->type_evaluation ?? '0');
                    $note = (float)($data->note_moyenne ?? 0);
                    $nombre = (int)($data->nombre_evaluations ?? 0);
                    $dateJour = $escapeString($data->date_jour ?? now()->format('Y-m-d'));
                    $dateInsertion = $escapeString(now()->format('Y-m-d H:i:s'));
                    
                    $sql = "INSERT INTO evaluations_analytics "
                        . "(evalue_matricule, evaluateur_matricule, id_type_evaluation, note_moyenne, nombre_evaluations, date_jour, date_insertion) "
                        . "VALUES ('$evalue', '$evaluateur', '$typeEval', $note, $nombre, '$dateJour', '$dateInsertion')";
                    
                    DB::connection('clickhouse')->statement($sql);
                    
                    $stats['synced']++;
                } catch (\Exception $e) {
                    $stats['errors']++;
                    Log::error("Erreur de synchronisation des données analytiques: " . $e->getMessage());
                    Log::error("Données: " . json_encode($data));
                }
            }
            
            return $stats;
        } catch (\Exception $e) {
            Log::error("Erreur lors de la synchronisation des données analytiques: " . $e->getMessage());
            Log::error("Trace: " . $e->getTraceAsString());
            return ['processed' => 0, 'synced' => 0, 'errors' => 1, 'message' => $e->getMessage()];
        }
    }
}
