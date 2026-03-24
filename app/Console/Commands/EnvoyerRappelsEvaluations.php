<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\PeriodeEvaluation;
use App\Models\Notification;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Carbon\Carbon;

class EnvoyerRappelsEvaluations extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'evaluations:rappels
                            {--dry-run : Simuler l\'exécution sans envoyer de notifications}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Envoyer des rappels pour les évaluations en retard (J-7, J-3, J-1)';

    /**
     * Execute the console command.
     */
    public function handle(): int
    {
        $isDryRun = $this->option('dry-run');
        
        $this->info('🔍 Recherche des périodes actives nécessitant des rappels...');
        
        // Récupérer les périodes actives
        $periodesActives = PeriodeEvaluation::active()
            ->get();
        
        if ($periodesActives->isEmpty()) {
            $this->info('✅ Aucune période active');
            return Command::SUCCESS;
        }
        
        $totalRappels = 0;
        $aujourdhui = now()->format('Y-m-d');
        
        foreach ($periodesActives as $periode) {
            $joursRestants = now()->diffInDays($periode->date_fin, false);
            $datesRappels = $periode->getDatesRappels();
            
            // Vérifier si aujourd'hui correspond à une date de rappel
            $doitEnvoyerRappel = false;
            $typeRappel = '';
            
            if (isset($datesRappels['j_moins_7']) && $datesRappels['j_moins_7'] === $aujourdhui) {
                $doitEnvoyerRappel = true;
                $typeRappel = 'J-7';
            } elseif (isset($datesRappels['j_moins_3']) && $datesRappels['j_moins_3'] === $aujourdhui) {
                $doitEnvoyerRappel = true;
                $typeRappel = 'J-3';
            } elseif (isset($datesRappels['j_moins_1']) && $datesRappels['j_moins_1'] === $aujourdhui) {
                $doitEnvoyerRappel = true;
                $typeRappel = 'J-1';
            }
            
            if (!$doitEnvoyerRappel) {
                continue;
            }
            
            $this->info("📧 Envoi des rappels {$typeRappel} pour : {$periode->nom_periode}");
            
            // Récupérer les évaluations en brouillon pour cette période
            $evaluationsEnRetard = DB::connection('pgsql')
                ->table('evaluations')
                ->where('id_periode', $periode->id_periode)
                ->where('statut', 'brouillon')
                ->get();
            
            $rappelsEnvoyes = 0;
            foreach ($evaluationsEnRetard as $evaluation) {
                try {
                    if ($isDryRun) {
                        $this->line("  [DRY-RUN] Rappel à : {$evaluation->evaluateur_matricule}");
                    } else {
                        Notification::creer(
                            $evaluation->evaluateur_matricule,
                            "Rappel : Évaluation en attente ({$typeRappel})",
                            "Il vous reste {$joursRestants} jour(s) pour compléter vos évaluations de la période {$periode->nom_periode}.",
                            'reminder',
                            [
                                'id_periode' => $periode->id_periode,
                                'id_evaluation' => $evaluation->id_evaluation,
                                'jours_restants' => $joursRestants,
                            ]
                        );
                    }
                    
                    $rappelsEnvoyes++;
                } catch (\Exception $e) {
                    $this->error("  ✗ Erreur notification : {$e->getMessage()}");
                    
                    Log::error('Erreur envoi rappel évaluation', [
                        'id_evaluation' => $evaluation->id_evaluation,
                        'evaluateur' => $evaluation->evaluateur_matricule,
                        'error' => $e->getMessage(),
                    ]);
                }
            }
            
            if ($isDryRun) {
                $this->line("  [DRY-RUN] {$rappelsEnvoyes} rappel(s) auraient été envoyés");
            } else {
                $this->info("  ✓ {$rappelsEnvoyes} rappel(s) envoyé(s)");
                
                Log::info('Rappels évaluations envoyés', [
                    'id_periode' => $periode->id_periode,
                    'nom_periode' => $periode->nom_periode,
                    'type_rappel' => $typeRappel,
                    'nb_rappels' => $rappelsEnvoyes,
                ]);
            }
            
            $totalRappels += $rappelsEnvoyes;
        }
        
        if ($totalRappels === 0) {
            $this->info('✅ Aucun rappel à envoyer aujourd\'hui');
        } else {
            if ($isDryRun) {
                $this->warn("🔍 Mode simulation : {$totalRappels} rappel(s) auraient été envoyés");
            } else {
                $this->info("✅ {$totalRappels} rappel(s) envoyé(s) au total");
            }
        }
        
        return Command::SUCCESS;
    }
}
