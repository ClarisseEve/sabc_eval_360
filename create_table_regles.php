<?php

require __DIR__.'/vendor/autoload.php';

$app = require_once __DIR__.'/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

use Illuminate\Support\Facades\DB;

echo "🔄 Création de la table regles_evaluation...\n";

try {
    DB::connection('pgsql')->statement("
        CREATE TABLE IF NOT EXISTS regles_evaluation (
            id_regle BIGSERIAL PRIMARY KEY,
            nom_regle VARCHAR(200) UNIQUE NOT NULL,
            description TEXT,
            role_evaluateur VARCHAR(50),
            role_evalue VARCHAR(50),
            type_evaluation VARCHAR(20) CHECK (type_evaluation IN ('auto', 'pairs', 'descendante')),
            criteres_evaluation_json JSONB NOT NULL,
            est_active BOOLEAN DEFAULT true,
            meme_region_obligatoire BOOLEAN DEFAULT true,
            meme_branche_obligatoire BOOLEAN DEFAULT true,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
    ");
    
    echo "✅ Table regles_evaluation créée\n";
    
    // Créer les index
    DB::connection('pgsql')->statement("CREATE INDEX IF NOT EXISTS idx_regles_nom ON regles_evaluation(nom_regle);");
    DB::connection('pgsql')->statement("CREATE INDEX IF NOT EXISTS idx_regles_active ON regles_evaluation(est_active);");
    DB::connection('pgsql')->statement("CREATE INDEX IF NOT EXISTS idx_regles_type ON regles_evaluation(type_evaluation);");
    
    echo "✅ Index créés\n";
    
    // Créer trigger updated_at
    DB::connection('pgsql')->statement("
        CREATE OR REPLACE FUNCTION update_updated_at_column()
        RETURNS TRIGGER AS \$\$
        BEGIN
            NEW.updated_at = CURRENT_TIMESTAMP;
            RETURN NEW;
        END;
        \$\$ language 'plpgsql';
    ");
    
    DB::connection('pgsql')->statement("
        DROP TRIGGER IF EXISTS update_regles_evaluation_updated_at ON regles_evaluation;
        CREATE TRIGGER update_regles_evaluation_updated_at 
            BEFORE UPDATE ON regles_evaluation 
            FOR EACH ROW 
            EXECUTE FUNCTION update_updated_at_column();
    ");
    
    echo "✅ Trigger updated_at créé\n";
    
    // Vérifier la structure
    $columns = DB::connection('pgsql')->select("
        SELECT column_name, data_type, is_nullable
        FROM information_schema.columns 
        WHERE table_name = 'regles_evaluation'
        ORDER BY ordinal_position
    ");
    
    echo "\n📋 Structure de la table:\n";
    foreach ($columns as $col) {
        echo "  - {$col->column_name} ({$col->data_type}) " . ($col->is_nullable === 'YES' ? 'NULL' : 'NOT NULL') . "\n";
    }
    
    echo "\n🎉 Table regles_evaluation prête à l'emploi!\n";
    echo "👉 Exécutez maintenant: php artisan db:seed --class=ReglesEvaluationSeeder\n";
    
} catch (\Exception $e) {
    echo "❌ Erreur: " . $e->getMessage() . "\n";
    exit(1);
}
