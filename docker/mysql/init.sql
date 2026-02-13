-- =============================================================================
-- SABC Eval360 - MySQL Initialization Script (CORE Database)
-- =============================================================================

-- Create additional databases if needed
CREATE DATABASE IF NOT EXISTS sabc_core CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Grant privileges
GRANT ALL PRIVILEGES ON sabc_core.* TO 'sabc_user'@'%';
FLUSH PRIVILEGES;

-- Use the database
USE sabc_core;

-- =============================================================================
-- Performance optimizations for evaluation workload
-- =============================================================================

-- These settings can be overridden in my.cnf for persistent configuration

-- =============================================================================
-- Create indexes for common queries (if not created by migrations)
-- =============================================================================

-- Index for user lookups by matricule (most common query)
-- CREATE INDEX IF NOT EXISTS idx_utilisateurs_matricule ON utilisateurs(matricule);

-- Index for active replacements
-- CREATE INDEX IF NOT EXISTS idx_remplacements_actifs ON remplacements_temporaires(est_actif, date_fin);

-- Index for notifications by user
-- CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications_utilisateurs(id_utilisateur, est_lue);

SELECT 'MySQL CORE database initialized successfully' AS status;
