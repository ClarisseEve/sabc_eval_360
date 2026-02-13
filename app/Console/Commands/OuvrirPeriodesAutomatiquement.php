<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\PeriodeEvaluation;
use App\Services\PeriodeEvaluationService;
use Illuminate\Support\Facades\Log;

class OuvrirPeriodesAutomatiquement extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'periodes:ouvrir
                            {--dry-run : Simuler l\'exécution sans modifier les données}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Ouvrir automatiquement les périodes d\'évaluation dont la date de début est atteinte';

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
        
        $this->info('🔍 Recherche des périodes à ouvrir...');
        
        // Récupérer les périodes planifiées dont la date de début est atteinte ou passée
        $periodesAOuvrir = PeriodeEvaluation::where('statut', 'planifiee')
            ->where('est_ouverte', false)
            ->where('est_cloturee', false)
            ->where('date_debut', '<=', now())
            ->get();
        
        if ($periodesAOuvrir->isEmpty()) {
            $this->info('✅ Aucune période à ouvrir');
            return Command::SUCCESS;
        }
        
        $this->info("📋 {$periodesAOuvrir->count()} période(s) à ouvrir");
        
        $compteur = 0;
        foreach ($periodesAOuvrir as $periode) {
            try {
                if ($isDryRun) {
                    $this->line("  [DRY-RUN] Ouverture de : {$periode->nom_periode} (ID: {$periode->id_periode})");
                } else {
                    $this->periodeService->ouvrirPeriode($periode);
                    $this->info("  ✓ Ouvert : {$periode->nom_periode} (ID: {$periode->id_periode})");
                    
                    Log::info('Période ouverte automatiquement', [
                        'id_periode' => $periode->id_periode,
                        'nom_periode' => $periode->nom_periode,
                        'date_debut' => $periode->date_debut->format('Y-m-d'),
                    ]);
                }
                
                $compteur++;
            } catch (\Exception $e) {
                $this->error("  ✗ Erreur pour {$periode->nom_periode} : {$e->getMessage()}");
                
                Log::error('Erreur ouverture automatique période', [
                    'id_periode' => $periode->id_periode,
                    'nom_periode' => $periode->nom_periode,
                    'error' => $e->getMessage(),
                ]);
            }
        }
        
        if ($isDryRun) {
            $this->warn("🔍 Mode simulation : {$compteur} période(s) auraient été ouvertes");
        } else {
            $this->info("✅ {$compteur} période(s) ouverte(s) avec succès");
        }
        
        return Command::SUCCESS;
    }
}
