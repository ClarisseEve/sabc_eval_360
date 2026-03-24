<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\PeriodeEvaluation;
use App\Services\PeriodeEvaluationService;
use Illuminate\Support\Facades\Log;

class FermerPeriodesAutomatiquement extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'periodes:fermer
                            {--dry-run : Simuler l\'exécution sans modifier les données}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Fermer automatiquement les périodes d\'évaluation dont la date de fin est dépassée';

    protected PeriodeEvaluationService $periodeService;

    /**
     * Create a new command instance.
     */
    public function __construct(PeriodeEvaluationService $periodeService)
    {
        parent::__construct();
        $this->periodeService = $periodeService;
    }

    /**
     * Execute the console command.
     */
    public function handle(): int
    {
        $isDryRun = $this->option('dry-run');
        
        $this->info('🔍 Recherche des périodes à fermer...');
        
        // Récupérer les périodes ouvertes dont la date de fin est dépassée
        $periodesAFermer = PeriodeEvaluation::ouverte()
            ->where('date_fin', '<', now())
            ->get();
        
        if ($periodesAFermer->isEmpty()) {
            $this->info('✅ Aucune période à fermer');
            return Command::SUCCESS;
        }
        
        $this->info("📋 {$periodesAFermer->count()} période(s) à fermer");
        
        $compteur = 0;
        foreach ($periodesAFermer as $periode) {
            try {
                if ($isDryRun) {
                    $this->line("  [DRY-RUN] Fermeture de : {$periode->nom_periode} (ID: {$periode->id_periode})");
                } else {
                    // fermerPeriode calcule déjà les statistiques finales
                    $this->periodeService->fermerPeriode($periode);
                    $periode->refresh();
                    $this->info("  ✓ Fermé : {$periode->nom_periode} (ID: {$periode->id_periode})");
                    $this->line(
                        "    Stats : {$periode->nb_evaluations_completees}/{$periode->nb_evaluations_attendues} évaluations ({$periode->taux_completion}%)"
                    );
                    
                    Log::info('Période fermée automatiquement', [
                        'id_periode' => $periode->id_periode,
                        'nom_periode' => $periode->nom_periode,
                        'date_fin' => $periode->date_fin->format('Y-m-d'),
                        'statistiques' => [
                            'nb_evaluations_attendues' => $periode->nb_evaluations_attendues,
                            'nb_evaluations_completees' => $periode->nb_evaluations_completees,
                            'taux_completion' => $periode->taux_completion,
                        ],
                    ]);
                }
                
                $compteur++;
            } catch (\Exception $e) {
                $this->error("  ✗ Erreur pour {$periode->nom_periode} : {$e->getMessage()}");
                
                Log::error('Erreur fermeture automatique période', [
                    'id_periode' => $periode->id_periode,
                    'nom_periode' => $periode->nom_periode,
                    'error' => $e->getMessage(),
                ]);
            }
        }
        
        if ($isDryRun) {
            $this->warn("🔍 Mode simulation : {$compteur} période(s) auraient été fermées");
        } else {
            $this->info("✅ {$compteur} période(s) fermée(s) avec succès");
        }
        
        return Command::SUCCESS;
    }
}
