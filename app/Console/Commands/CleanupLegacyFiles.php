<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\File;

class CleanupLegacyFiles extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'cleanup:legacy 
                            {--dry-run : Afficher les fichiers qui seraient supprimés sans les supprimer}
                            {--force : Forcer la suppression sans confirmation}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Nettoie les fichiers obsolètes basés sur l\'ancienne logique single-database';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $dryRun = $this->option('dry-run');
        $force = $this->option('force');

        $this->info('🔍 Recherche des fichiers obsolètes...');
        $this->newLine();

        // Fichiers potentiellement obsolètes à vérifier
        $potentialObsoleteFiles = [
            // Anciens modèles qui pourraient dupliquer la logique
            'app/Models/User.php', // Si existe en plus de Utilisateur.php
            'app/Models/OldEvaluation.php',
            'app/Models/OldUser.php',
            
            // Anciens contrôleurs single-database
            'app/Http/Controllers/OldEvaluationController.php',
            'app/Http/Controllers/SingleDbController.php',
            
            // Anciens services
            'app/Services/OldEvaluationService.php',
            'app/Services/SingleDatabaseService.php',
            
            // Migrations obsolètes (à vérifier manuellement)
            // 'database/migrations/old_*',
            
            // Fichiers de configuration obsolètes
            'config/old_database.php',
            'config/single_db.php',
        ];

        // Dossiers potentiellement obsolètes
        $potentialObsoleteDirs = [
            'app/Models/Old',
            'app/Models/Legacy',
            'app/Services/Old',
            'app/Http/Controllers/Old',
        ];

        $filesToCleanup = [];
        $dirsToCleanup = [];

        // Vérifier les fichiers
        foreach ($potentialObsoleteFiles as $file) {
            $fullPath = base_path($file);
            if (File::exists($fullPath)) {
                $filesToCleanup[] = $file;
            }
        }

        // Vérifier les dossiers
        foreach ($potentialObsoleteDirs as $dir) {
            $fullPath = base_path($dir);
            if (File::isDirectory($fullPath)) {
                $dirsToCleanup[] = $dir;
            }
        }

        // Rechercher les fichiers avec des patterns suspects
        $suspiciousPatterns = [
            'app/Models/*Old*.php',
            'app/Models/*Legacy*.php',
            'app/Services/*Old*.php',
            'app/Services/*Legacy*.php',
            'app/Http/Controllers/*Old*.php',
            'app/Http/Controllers/*Legacy*.php',
        ];

        foreach ($suspiciousPatterns as $pattern) {
            $files = glob(base_path($pattern));
            foreach ($files as $file) {
                $relativePath = str_replace(base_path() . '/', '', $file);
                if (!in_array($relativePath, $filesToCleanup)) {
                    $filesToCleanup[] = $relativePath;
                }
            }
        }

        // Afficher les résultats
        if (empty($filesToCleanup) && empty($dirsToCleanup)) {
            $this->info('✅ Aucun fichier obsolète détecté.');
            return Command::SUCCESS;
        }

        $this->warn('📁 Fichiers potentiellement obsolètes détectés :');
        $this->newLine();

        if (!empty($filesToCleanup)) {
            $this->line('📄 Fichiers :');
            foreach ($filesToCleanup as $file) {
                $this->line("  - {$file}");
            }
            $this->newLine();
        }

        if (!empty($dirsToCleanup)) {
            $this->line('📁 Dossiers :');
            foreach ($dirsToCleanup as $dir) {
                $this->line("  - {$dir}");
            }
            $this->newLine();
        }

        if ($dryRun) {
            $this->info('🔍 Mode dry-run : Aucun fichier n\'a été supprimé.');
            return Command::SUCCESS;
        }

        // Demander confirmation
        if (!$force) {
            if (!$this->confirm('Voulez-vous supprimer ces fichiers/dossiers ?')) {
                $this->info('❌ Suppression annulée.');
                return Command::SUCCESS;
            }
        }

        // Supprimer les fichiers et dossiers
        $deletedCount = 0;

        foreach ($filesToCleanup as $file) {
            $fullPath = base_path($file);
            if (File::delete($fullPath)) {
                $this->line("✅ Supprimé : {$file}");
                $deletedCount++;
            } else {
                $this->error("❌ Échec suppression : {$file}");
            }
        }

        foreach ($dirsToCleanup as $dir) {
            $fullPath = base_path($dir);
            if (File::deleteDirectory($fullPath)) {
                $this->line("✅ Dossier supprimé : {$dir}");
                $deletedCount++;
            } else {
                $this->error("❌ Échec suppression dossier : {$dir}");
            }
        }

        $this->newLine();
        $this->info("🎉 Nettoyage terminé. {$deletedCount} éléments supprimés.");

        return Command::SUCCESS;
    }
}
