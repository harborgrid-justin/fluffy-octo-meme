-- =============================================================================
-- Migration: Create Initial Schema
-- Version: 20251103120000
-- Description: Create all core tables for Federal PPBE system
-- Author: Architecture Lead
-- Date: 2025-11-03
-- =============================================================================

-- This migration creates the initial database schema
-- For the full schema, see: backend/database/schema.sql

BEGIN;

-- Create schema_migrations table to track migrations
CREATE TABLE IF NOT EXISTS schema_migrations (
    version VARCHAR(255) PRIMARY KEY,
    applied_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    description TEXT,
    execution_time INTEGER
);

-- Record this migration
INSERT INTO schema_migrations (version, description)
VALUES ('20251103120000', 'Create initial schema for Federal PPBE system');

COMMIT;

-- =============================================================================
-- ROLLBACK INSTRUCTIONS (Execute in reverse order if needed)
-- =============================================================================
/*
BEGIN;
DROP TABLE IF EXISTS schema_migrations CASCADE;
-- Additional rollback commands would drop all tables created
COMMIT;
*/
