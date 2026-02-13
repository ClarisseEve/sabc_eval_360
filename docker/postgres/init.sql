-- =============================================================================
-- SABC Eval360 - PostgreSQL Initialization Script (BUSINESS Database)
-- =============================================================================

-- Create extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- =============================================================================
-- Schema for evaluation business data
-- =============================================================================

-- Evaluations table (if not created by migrations)
-- CREATE TABLE IF NOT EXISTS evaluations (
--     id_evaluation UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
--     evaluateur_matricule VARCHAR(20) NOT NULL,
--     evalue_matricule VARCHAR(20) NOT NULL,
--     id_periode INTEGER,
--     id_regle INTEGER,
--     notes_json JSONB,
--     commentaire_general TEXT,
--     statut VARCHAR(20) DEFAULT 'brouillon',
--     date_evaluation TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
--     date_soumission TIMESTAMP,
--     date_validation TIMESTAMP,
--     created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
--     updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
-- );

-- =============================================================================
-- Performance indexes
-- =============================================================================

-- Index for evaluation lookups by evaluator
-- CREATE INDEX IF NOT EXISTS idx_evaluations_evaluateur ON evaluations(evaluateur_matricule);

-- Index for evaluation lookups by evaluated user
-- CREATE INDEX IF NOT EXISTS idx_evaluations_evalue ON evaluations(evalue_matricule);

-- Index for period-based queries
-- CREATE INDEX IF NOT EXISTS idx_evaluations_periode ON evaluations(id_periode);

-- GIN index for JSONB notes search
-- CREATE INDEX IF NOT EXISTS idx_evaluations_notes ON evaluations USING GIN(notes_json);

-- =============================================================================
-- Functions for evaluation business logic
-- =============================================================================

-- Function to update timestamp on modification
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply trigger to evaluations table (when it exists)
-- CREATE TRIGGER update_evaluations_updated_at
--     BEFORE UPDATE ON evaluations
--     FOR EACH ROW
--     EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- Materialized views for reporting (optional optimization)
-- =============================================================================

-- Materialized view for evaluation statistics by period
-- CREATE MATERIALIZED VIEW IF NOT EXISTS mv_evaluation_stats AS
-- SELECT
--     id_periode,
--     COUNT(*) as total_evaluations,
--     COUNT(CASE WHEN statut = 'valide' THEN 1 END) as validated,
--     COUNT(CASE WHEN statut = 'brouillon' THEN 1 END) as drafts,
--     COUNT(CASE WHEN statut = 'soumis' THEN 1 END) as submitted
-- FROM evaluations
-- GROUP BY id_periode;

-- Refresh function
-- CREATE OR REPLACE FUNCTION refresh_evaluation_stats()
-- RETURNS void AS $$
-- BEGIN
--     REFRESH MATERIALIZED VIEW CONCURRENTLY mv_evaluation_stats;
-- END;
-- $$ LANGUAGE plpgsql;

SELECT 'PostgreSQL BUSINESS database initialized successfully' AS status;
