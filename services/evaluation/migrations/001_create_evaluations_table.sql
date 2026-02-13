-- =============================================================================
-- Migration: Create evaluations table for PostgreSQL
-- Service: evaluation-service
-- =============================================================================

-- UP
CREATE TABLE IF NOT EXISTS evaluations (
    id_evaluation UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    evaluateur_matricule VARCHAR(20) NOT NULL,
    evalue_matricule VARCHAR(20) NOT NULL,
    id_periode UUID NOT NULL,
    id_regle UUID NOT NULL,
    date_evaluation TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    date_soumission TIMESTAMP WITH TIME ZONE,
    date_validation TIMESTAMP WITH TIME ZONE,
    statut VARCHAR(20) DEFAULT 'brouillon' CHECK (statut IN ('brouillon', 'soumis', 'valide', 'rejete')),
    notations_json JSONB DEFAULT '{"criteres": []}'::jsonb,
    commentaire_general TEXT,
    commentaire_validation TEXT,
    validateur_matricule VARCHAR(20),
    note_globale DECIMAL(3,2),
    type_evaluation VARCHAR(20) DEFAULT '360' CHECK (type_evaluation IN ('auto', 'descendante', 'pairs', 'ascendante', 'autre', '360')),
    sync_status VARCHAR(20) DEFAULT 'synced',
    sync_date TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_evaluations_evaluateur_date ON evaluations(evaluateur_matricule, date_evaluation DESC);
CREATE INDEX IF NOT EXISTS idx_evaluations_evalue_date ON evaluations(evalue_matricule, date_evaluation DESC);
CREATE INDEX IF NOT EXISTS idx_evaluations_statut_date ON evaluations(statut, date_evaluation DESC);
CREATE INDEX IF NOT EXISTS idx_evaluations_periode ON evaluations(id_periode);
CREATE INDEX IF NOT EXISTS idx_evaluations_sync_status ON evaluations(sync_status) WHERE sync_status != 'synced';

-- GIN index for JSONB search
CREATE INDEX IF NOT EXISTS idx_evaluations_notes_gin ON evaluations USING GIN(notations_json);

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION update_evaluation_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_evaluations_updated_at ON evaluations;
CREATE TRIGGER trigger_evaluations_updated_at
    BEFORE UPDATE ON evaluations
    FOR EACH ROW
    EXECUTE FUNCTION update_evaluation_updated_at();

-- =============================================================================
-- DOWN (Rollback)
-- =============================================================================
-- DROP TRIGGER IF EXISTS trigger_evaluations_updated_at ON evaluations;
-- DROP FUNCTION IF EXISTS update_evaluation_updated_at();
-- DROP TABLE IF EXISTS evaluations;
