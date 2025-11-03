-- =============================================================================
-- Federal PPBE (Planning, Programming, Budgeting, and Execution) Database Schema
-- PostgreSQL Database Schema
-- Version: 1.0.0
-- =============================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Enable timestamp extension for better date handling
CREATE EXTENSION IF NOT EXISTS "btree_gist";

-- =============================================================================
-- ENUM TYPES
-- =============================================================================

-- User roles for role-based access control (RBAC)
CREATE TYPE user_role AS ENUM (
    'super_admin',      -- Full system access
    'admin',            -- Organization-level admin
    'budget_analyst',   -- Budget creation and analysis
    'program_manager',  -- Program management
    'approver',         -- Approval authority
    'auditor',          -- Read-only audit access
    'user'              -- Basic user access
);

-- User status for account management
CREATE TYPE user_status AS ENUM (
    'active',
    'inactive',
    'suspended',
    'pending_activation'
);

-- Budget status for workflow management
CREATE TYPE budget_status AS ENUM (
    'draft',
    'pending_review',
    'under_review',
    'pending_approval',
    'approved',
    'rejected',
    'executed',
    'closed'
);

-- Program status for PPBE phases
CREATE TYPE program_status AS ENUM (
    'planning',
    'programming',
    'budgeting',
    'execution',
    'completed',
    'cancelled'
);

-- Fiscal year status
CREATE TYPE fiscal_year_status AS ENUM (
    'future',
    'current',
    'past',
    'locked'
);

-- Appropriation types (Colors of Money)
CREATE TYPE appropriation_type AS ENUM (
    'RDT&E',            -- Research, Development, Test & Evaluation
    'PROCUREMENT',      -- Procurement
    'OMA',              -- Operation & Maintenance, Army
    'OMN',              -- Operation & Maintenance, Navy
    'OMAF',             -- Operation & Maintenance, Air Force
    'MILPERS',          -- Military Personnel
    'MILCON',           -- Military Construction
    'FAMILY_HOUSING'    -- Family Housing
);

-- Approval action types
CREATE TYPE approval_action AS ENUM (
    'approved',
    'rejected',
    'returned',
    'delegated'
);

-- Transaction types for audit logging
CREATE TYPE transaction_type AS ENUM (
    'create',
    'read',
    'update',
    'delete',
    'approve',
    'reject',
    'export',
    'import'
);

-- =============================================================================
-- CORE TABLES
-- =============================================================================

-- -----------------------------------------------------------------------------
-- ORGANIZATIONS TABLE
-- Hierarchical organization structure for multi-tenant support
-- -----------------------------------------------------------------------------
CREATE TABLE organizations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    parent_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    tenant_id UUID NOT NULL,  -- For multi-tenant data isolation
    code VARCHAR(50) NOT NULL UNIQUE,
    name VARCHAR(255) NOT NULL,
    full_name TEXT,
    organization_type VARCHAR(100),  -- e.g., 'Department', 'Agency', 'Division'
    level INTEGER NOT NULL DEFAULT 0,
    path TEXT,  -- Materialized path for hierarchical queries
    is_active BOOLEAN DEFAULT true,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by UUID,
    updated_by UUID
);

-- Indexes for organizations
CREATE INDEX idx_organizations_parent_id ON organizations(parent_id);
CREATE INDEX idx_organizations_tenant_id ON organizations(tenant_id);
CREATE INDEX idx_organizations_code ON organizations(code);
CREATE INDEX idx_organizations_path ON organizations USING GIST(path gist_trgm_ops);

-- -----------------------------------------------------------------------------
-- USERS TABLE
-- User management with RBAC
-- -----------------------------------------------------------------------------
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL,
    organization_id UUID REFERENCES organizations(id),
    username VARCHAR(100) NOT NULL UNIQUE,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    role user_role DEFAULT 'user',
    status user_status DEFAULT 'pending_activation',
    phone VARCHAR(20),
    title VARCHAR(100),
    department VARCHAR(100),

    -- Security fields
    mfa_enabled BOOLEAN DEFAULT false,
    mfa_secret VARCHAR(255),
    failed_login_attempts INTEGER DEFAULT 0,
    last_failed_login TIMESTAMP WITH TIME ZONE,
    locked_until TIMESTAMP WITH TIME ZONE,
    password_changed_at TIMESTAMP WITH TIME ZONE,
    password_expires_at TIMESTAMP WITH TIME ZONE,

    -- Session management
    last_login_at TIMESTAMP WITH TIME ZONE,
    last_login_ip INET,
    session_token VARCHAR(255),
    refresh_token VARCHAR(255),

    -- Metadata
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP WITH TIME ZONE
);

-- Indexes for users
CREATE INDEX idx_users_tenant_id ON users(tenant_id);
CREATE INDEX idx_users_organization_id ON users(organization_id);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_status ON users(status);

-- -----------------------------------------------------------------------------
-- FISCAL YEARS TABLE
-- Federal fiscal year management (Oct 1 - Sep 30)
-- -----------------------------------------------------------------------------
CREATE TABLE fiscal_years (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL,
    year INTEGER NOT NULL,
    status fiscal_year_status DEFAULT 'future',
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    total_budget NUMERIC(20, 2) DEFAULT 0,
    allocated_budget NUMERIC(20, 2) DEFAULT 0,
    executed_budget NUMERIC(20, 2) DEFAULT 0,
    is_locked BOOLEAN DEFAULT false,
    locked_at TIMESTAMP WITH TIME ZONE,
    locked_by UUID REFERENCES users(id),
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by UUID REFERENCES users(id),
    updated_by UUID REFERENCES users(id),
    UNIQUE(tenant_id, year)
);

-- Indexes for fiscal years
CREATE INDEX idx_fiscal_years_tenant_id ON fiscal_years(tenant_id);
CREATE INDEX idx_fiscal_years_year ON fiscal_years(year);
CREATE INDEX idx_fiscal_years_status ON fiscal_years(status);

-- -----------------------------------------------------------------------------
-- PROGRAMS TABLE
-- Program elements in the PPBE process
-- -----------------------------------------------------------------------------
CREATE TABLE programs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL,
    organization_id UUID NOT NULL REFERENCES organizations(id),
    fiscal_year_id UUID NOT NULL REFERENCES fiscal_years(id),
    program_element_code VARCHAR(50) NOT NULL,  -- PE Code
    name VARCHAR(255) NOT NULL,
    description TEXT,
    status program_status DEFAULT 'planning',

    -- Budget information
    total_budget NUMERIC(20, 2) DEFAULT 0,
    allocated_budget NUMERIC(20, 2) DEFAULT 0,
    obligated_amount NUMERIC(20, 2) DEFAULT 0,
    expended_amount NUMERIC(20, 2) DEFAULT 0,

    -- Program details
    appropriation_type appropriation_type,
    start_date DATE,
    end_date DATE,
    program_manager_id UUID REFERENCES users(id),
    priority_level INTEGER,

    -- Multi-year tracking
    is_multi_year BOOLEAN DEFAULT false,
    years_duration INTEGER,

    -- Metadata
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP WITH TIME ZONE,
    created_by UUID REFERENCES users(id),
    updated_by UUID REFERENCES users(id),

    UNIQUE(tenant_id, program_element_code, fiscal_year_id)
);

-- Indexes for programs
CREATE INDEX idx_programs_tenant_id ON programs(tenant_id);
CREATE INDEX idx_programs_organization_id ON programs(organization_id);
CREATE INDEX idx_programs_fiscal_year_id ON programs(fiscal_year_id);
CREATE INDEX idx_programs_status ON programs(status);
CREATE INDEX idx_programs_pe_code ON programs(program_element_code);
CREATE INDEX idx_programs_manager_id ON programs(program_manager_id);

-- -----------------------------------------------------------------------------
-- BUDGETS TABLE
-- Budget allocation and tracking
-- -----------------------------------------------------------------------------
CREATE TABLE budgets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL,
    organization_id UUID NOT NULL REFERENCES organizations(id),
    fiscal_year_id UUID NOT NULL REFERENCES fiscal_years(id),
    program_id UUID REFERENCES programs(id),

    -- Budget identification
    budget_number VARCHAR(100) UNIQUE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    status budget_status DEFAULT 'draft',

    -- Financial amounts
    requested_amount NUMERIC(20, 2) NOT NULL,
    approved_amount NUMERIC(20, 2),
    allocated_amount NUMERIC(20, 2) DEFAULT 0,
    obligated_amount NUMERIC(20, 2) DEFAULT 0,
    expended_amount NUMERIC(20, 2) DEFAULT 0,

    -- Budget classification
    appropriation_type appropriation_type NOT NULL,
    budget_activity VARCHAR(100),
    line_number VARCHAR(50),

    -- Approval tracking
    submitted_at TIMESTAMP WITH TIME ZONE,
    approved_at TIMESTAMP WITH TIME ZONE,
    approved_by UUID REFERENCES users(id),

    -- Version control
    version INTEGER DEFAULT 1,
    parent_version_id UUID REFERENCES budgets(id),
    is_current_version BOOLEAN DEFAULT true,

    -- Justification
    justification TEXT,
    business_case TEXT,

    -- Metadata
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP WITH TIME ZONE,
    created_by UUID REFERENCES users(id),
    updated_by UUID REFERENCES users(id)
);

-- Indexes for budgets
CREATE INDEX idx_budgets_tenant_id ON budgets(tenant_id);
CREATE INDEX idx_budgets_organization_id ON budgets(organization_id);
CREATE INDEX idx_budgets_fiscal_year_id ON budgets(fiscal_year_id);
CREATE INDEX idx_budgets_program_id ON budgets(program_id);
CREATE INDEX idx_budgets_status ON budgets(status);
CREATE INDEX idx_budgets_number ON budgets(budget_number);
CREATE INDEX idx_budgets_created_by ON budgets(created_by);

-- -----------------------------------------------------------------------------
-- BUDGET LINE ITEMS TABLE
-- Detailed line-level budget tracking
-- -----------------------------------------------------------------------------
CREATE TABLE budget_line_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL,
    budget_id UUID NOT NULL REFERENCES budgets(id) ON DELETE CASCADE,
    parent_line_item_id UUID REFERENCES budget_line_items(id),

    -- Line item details
    line_number VARCHAR(50),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(100),

    -- Financial tracking
    requested_amount NUMERIC(20, 2) NOT NULL,
    approved_amount NUMERIC(20, 2),
    obligated_amount NUMERIC(20, 2) DEFAULT 0,
    expended_amount NUMERIC(20, 2) DEFAULT 0,

    -- Metadata
    sort_order INTEGER,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by UUID REFERENCES users(id),
    updated_by UUID REFERENCES users(id)
);

-- Indexes for budget line items
CREATE INDEX idx_budget_line_items_tenant_id ON budget_line_items(tenant_id);
CREATE INDEX idx_budget_line_items_budget_id ON budget_line_items(budget_id);
CREATE INDEX idx_budget_line_items_parent_id ON budget_line_items(parent_line_item_id);

-- -----------------------------------------------------------------------------
-- APPROVALS TABLE
-- Multi-level approval workflow
-- -----------------------------------------------------------------------------
CREATE TABLE approvals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL,
    budget_id UUID REFERENCES budgets(id) ON DELETE CASCADE,
    program_id UUID REFERENCES programs(id) ON DELETE CASCADE,

    -- Approval details
    approver_id UUID NOT NULL REFERENCES users(id),
    approval_level INTEGER NOT NULL,
    status budget_status DEFAULT 'pending_approval',
    action approval_action,

    -- Timing
    requested_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    acted_at TIMESTAMP WITH TIME ZONE,
    due_date TIMESTAMP WITH TIME ZONE,

    -- Comments and justification
    comments TEXT,
    rejection_reason TEXT,

    -- Delegation
    delegated_to UUID REFERENCES users(id),
    delegated_at TIMESTAMP WITH TIME ZONE,

    -- Metadata
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by UUID REFERENCES users(id)
);

-- Indexes for approvals
CREATE INDEX idx_approvals_tenant_id ON approvals(tenant_id);
CREATE INDEX idx_approvals_budget_id ON approvals(budget_id);
CREATE INDEX idx_approvals_program_id ON approvals(program_id);
CREATE INDEX idx_approvals_approver_id ON approvals(approver_id);
CREATE INDEX idx_approvals_status ON approvals(status);
CREATE INDEX idx_approvals_level ON approvals(approval_level);

-- -----------------------------------------------------------------------------
-- OBLIGATIONS TABLE
-- Financial obligation tracking (Anti-Deficiency Act compliance)
-- -----------------------------------------------------------------------------
CREATE TABLE obligations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL,
    budget_id UUID NOT NULL REFERENCES budgets(id),
    program_id UUID REFERENCES programs(id),
    fiscal_year_id UUID NOT NULL REFERENCES fiscal_years(id),

    -- Obligation details
    obligation_number VARCHAR(100) UNIQUE NOT NULL,
    obligation_date DATE NOT NULL,
    amount NUMERIC(20, 2) NOT NULL,
    description TEXT,
    vendor_name VARCHAR(255),

    -- Commitment tracking
    commitment_number VARCHAR(100),
    commitment_date DATE,

    -- Validation
    is_bona_fide_need BOOLEAN DEFAULT true,
    bona_fide_need_justification TEXT,

    -- Status
    is_active BOOLEAN DEFAULT true,
    cancelled_at TIMESTAMP WITH TIME ZONE,
    cancelled_by UUID REFERENCES users(id),
    cancellation_reason TEXT,

    -- Metadata
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by UUID REFERENCES users(id),
    updated_by UUID REFERENCES users(id)
);

-- Indexes for obligations
CREATE INDEX idx_obligations_tenant_id ON obligations(tenant_id);
CREATE INDEX idx_obligations_budget_id ON obligations(budget_id);
CREATE INDEX idx_obligations_program_id ON obligations(program_id);
CREATE INDEX idx_obligations_fiscal_year_id ON obligations(fiscal_year_id);
CREATE INDEX idx_obligations_number ON obligations(obligation_number);
CREATE INDEX idx_obligations_date ON obligations(obligation_date);

-- -----------------------------------------------------------------------------
-- EXPENDITURES TABLE
-- Actual expenditure tracking
-- -----------------------------------------------------------------------------
CREATE TABLE expenditures (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL,
    obligation_id UUID NOT NULL REFERENCES obligations(id),
    budget_id UUID NOT NULL REFERENCES budgets(id),
    fiscal_year_id UUID NOT NULL REFERENCES fiscal_years(id),

    -- Expenditure details
    expenditure_number VARCHAR(100) UNIQUE NOT NULL,
    expenditure_date DATE NOT NULL,
    amount NUMERIC(20, 2) NOT NULL,
    description TEXT,
    invoice_number VARCHAR(100),

    -- Payment information
    payment_date DATE,
    payment_method VARCHAR(50),

    -- Metadata
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by UUID REFERENCES users(id),
    updated_by UUID REFERENCES users(id)
);

-- Indexes for expenditures
CREATE INDEX idx_expenditures_tenant_id ON expenditures(tenant_id);
CREATE INDEX idx_expenditures_obligation_id ON expenditures(obligation_id);
CREATE INDEX idx_expenditures_budget_id ON expenditures(budget_id);
CREATE INDEX idx_expenditures_fiscal_year_id ON expenditures(fiscal_year_id);
CREATE INDEX idx_expenditures_number ON expenditures(expenditure_number);
CREATE INDEX idx_expenditures_date ON expenditures(expenditure_date);

-- -----------------------------------------------------------------------------
-- AUDIT LOGS TABLE
-- Comprehensive audit trail for compliance
-- -----------------------------------------------------------------------------
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL,

    -- Actor information
    user_id UUID REFERENCES users(id),
    username VARCHAR(100),
    user_role user_role,

    -- Action details
    transaction_type transaction_type NOT NULL,
    entity_type VARCHAR(100) NOT NULL,  -- e.g., 'budget', 'program', 'user'
    entity_id UUID NOT NULL,

    -- Change tracking
    old_values JSONB,
    new_values JSONB,
    changed_fields TEXT[],

    -- Context
    action_description TEXT,
    ip_address INET,
    user_agent TEXT,
    request_id VARCHAR(100),

    -- Timestamp
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

    -- Metadata
    metadata JSONB DEFAULT '{}'
);

-- Indexes for audit logs
CREATE INDEX idx_audit_logs_tenant_id ON audit_logs(tenant_id);
CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_entity_type ON audit_logs(entity_type);
CREATE INDEX idx_audit_logs_entity_id ON audit_logs(entity_id);
CREATE INDEX idx_audit_logs_transaction_type ON audit_logs(transaction_type);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at);

-- -----------------------------------------------------------------------------
-- NOTIFICATIONS TABLE
-- User notification system
-- -----------------------------------------------------------------------------
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

    -- Notification content
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    notification_type VARCHAR(50),  -- e.g., 'approval_required', 'budget_approved'
    priority VARCHAR(20) DEFAULT 'normal',  -- 'low', 'normal', 'high', 'urgent'

    -- Related entities
    related_entity_type VARCHAR(100),
    related_entity_id UUID,

    -- Status
    is_read BOOLEAN DEFAULT false,
    read_at TIMESTAMP WITH TIME ZONE,

    -- Metadata
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP WITH TIME ZONE
);

-- Indexes for notifications
CREATE INDEX idx_notifications_tenant_id ON notifications(tenant_id);
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_is_read ON notifications(is_read);
CREATE INDEX idx_notifications_created_at ON notifications(created_at);

-- -----------------------------------------------------------------------------
-- DOCUMENTS TABLE
-- Document management and attachments
-- -----------------------------------------------------------------------------
CREATE TABLE documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL,

    -- Document details
    filename VARCHAR(255) NOT NULL,
    original_filename VARCHAR(255) NOT NULL,
    file_path TEXT NOT NULL,
    file_size BIGINT NOT NULL,
    mime_type VARCHAR(100) NOT NULL,
    file_hash VARCHAR(64),  -- SHA-256 hash for integrity

    -- Related entity
    entity_type VARCHAR(100),
    entity_id UUID,

    -- Document metadata
    title VARCHAR(255),
    description TEXT,
    document_type VARCHAR(100),
    tags TEXT[],

    -- Version control
    version INTEGER DEFAULT 1,
    parent_document_id UUID REFERENCES documents(id),

    -- Security
    is_encrypted BOOLEAN DEFAULT false,
    access_level VARCHAR(50) DEFAULT 'private',

    -- Metadata
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP WITH TIME ZONE,
    created_by UUID REFERENCES users(id),
    updated_by UUID REFERENCES users(id)
);

-- Indexes for documents
CREATE INDEX idx_documents_tenant_id ON documents(tenant_id);
CREATE INDEX idx_documents_entity_type_id ON documents(entity_type, entity_id);
CREATE INDEX idx_documents_created_by ON documents(created_by);
CREATE INDEX idx_documents_file_hash ON documents(file_hash);

-- -----------------------------------------------------------------------------
-- COMMENTS TABLE
-- Collaboration and discussion threads
-- -----------------------------------------------------------------------------
CREATE TABLE comments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL,

    -- Related entity
    entity_type VARCHAR(100) NOT NULL,
    entity_id UUID NOT NULL,

    -- Comment details
    parent_comment_id UUID REFERENCES comments(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id),
    content TEXT NOT NULL,

    -- Status
    is_edited BOOLEAN DEFAULT false,
    edited_at TIMESTAMP WITH TIME ZONE,
    is_deleted BOOLEAN DEFAULT false,
    deleted_at TIMESTAMP WITH TIME ZONE,

    -- Metadata
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for comments
CREATE INDEX idx_comments_tenant_id ON comments(tenant_id);
CREATE INDEX idx_comments_entity_type_id ON comments(entity_type, entity_id);
CREATE INDEX idx_comments_user_id ON comments(user_id);
CREATE INDEX idx_comments_parent_id ON comments(parent_comment_id);

-- -----------------------------------------------------------------------------
-- REPORTS TABLE
-- Generated report tracking
-- -----------------------------------------------------------------------------
CREATE TABLE reports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL,

    -- Report details
    report_name VARCHAR(255) NOT NULL,
    report_type VARCHAR(100) NOT NULL,
    format VARCHAR(50) NOT NULL,  -- 'pdf', 'excel', 'csv'
    file_path TEXT,
    file_size BIGINT,

    -- Report parameters
    fiscal_year_id UUID REFERENCES fiscal_years(id),
    organization_id UUID REFERENCES organizations(id),
    parameters JSONB DEFAULT '{}',

    -- Generation status
    status VARCHAR(50) DEFAULT 'pending',  -- 'pending', 'generating', 'completed', 'failed'
    error_message TEXT,

    -- Metadata
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP WITH TIME ZONE,
    expires_at TIMESTAMP WITH TIME ZONE,
    created_by UUID REFERENCES users(id)
);

-- Indexes for reports
CREATE INDEX idx_reports_tenant_id ON reports(tenant_id);
CREATE INDEX idx_reports_fiscal_year_id ON reports(fiscal_year_id);
CREATE INDEX idx_reports_organization_id ON reports(organization_id);
CREATE INDEX idx_reports_created_by ON reports(created_by);
CREATE INDEX idx_reports_status ON reports(status);

-- -----------------------------------------------------------------------------
-- BACKGROUND JOBS TABLE
-- Job queue tracking
-- -----------------------------------------------------------------------------
CREATE TABLE background_jobs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID,

    -- Job details
    job_name VARCHAR(255) NOT NULL,
    job_type VARCHAR(100) NOT NULL,
    queue_name VARCHAR(100) DEFAULT 'default',

    -- Job data
    payload JSONB NOT NULL,
    result JSONB,

    -- Status tracking
    status VARCHAR(50) DEFAULT 'pending',  -- 'pending', 'processing', 'completed', 'failed', 'retrying'
    attempts INTEGER DEFAULT 0,
    max_attempts INTEGER DEFAULT 3,
    error_message TEXT,

    -- Timing
    scheduled_at TIMESTAMP WITH TIME ZONE,
    started_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    failed_at TIMESTAMP WITH TIME ZONE,

    -- Metadata
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for background jobs
CREATE INDEX idx_background_jobs_tenant_id ON background_jobs(tenant_id);
CREATE INDEX idx_background_jobs_status ON background_jobs(status);
CREATE INDEX idx_background_jobs_queue_name ON background_jobs(queue_name);
CREATE INDEX idx_background_jobs_scheduled_at ON background_jobs(scheduled_at);

-- =============================================================================
-- VIEWS
-- =============================================================================

-- Budget summary view
CREATE VIEW budget_summary AS
SELECT
    b.id,
    b.tenant_id,
    b.budget_number,
    b.title,
    b.status,
    b.requested_amount,
    b.approved_amount,
    b.obligated_amount,
    b.expended_amount,
    b.approved_amount - b.expended_amount as remaining_amount,
    CASE
        WHEN b.approved_amount > 0 THEN (b.expended_amount / b.approved_amount * 100)
        ELSE 0
    END as execution_percentage,
    o.name as organization_name,
    fy.year as fiscal_year,
    p.name as program_name,
    p.program_element_code
FROM budgets b
LEFT JOIN organizations o ON b.organization_id = o.id
LEFT JOIN fiscal_years fy ON b.fiscal_year_id = fy.id
LEFT JOIN programs p ON b.program_id = p.id
WHERE b.deleted_at IS NULL;

-- Program execution view
CREATE VIEW program_execution AS
SELECT
    p.id,
    p.tenant_id,
    p.program_element_code,
    p.name,
    p.status,
    p.total_budget,
    p.obligated_amount,
    p.expended_amount,
    p.total_budget - p.expended_amount as remaining_budget,
    CASE
        WHEN p.total_budget > 0 THEN (p.expended_amount / p.total_budget * 100)
        ELSE 0
    END as execution_rate,
    fy.year as fiscal_year,
    o.name as organization_name,
    u.username as program_manager
FROM programs p
LEFT JOIN fiscal_years fy ON p.fiscal_year_id = fy.id
LEFT JOIN organizations o ON p.organization_id = o.id
LEFT JOIN users u ON p.program_manager_id = u.id
WHERE p.deleted_at IS NULL;

-- =============================================================================
-- FUNCTIONS
-- =============================================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to validate budget amounts
CREATE OR REPLACE FUNCTION validate_budget_amounts()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.obligated_amount > NEW.approved_amount THEN
        RAISE EXCEPTION 'Obligated amount cannot exceed approved amount';
    END IF;

    IF NEW.expended_amount > NEW.obligated_amount THEN
        RAISE EXCEPTION 'Expended amount cannot exceed obligated amount';
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to auto-generate budget number
CREATE OR REPLACE FUNCTION generate_budget_number()
RETURNS TRIGGER AS $$
DECLARE
    fy_year INTEGER;
    org_code VARCHAR(50);
    seq_num INTEGER;
BEGIN
    IF NEW.budget_number IS NULL THEN
        SELECT year INTO fy_year FROM fiscal_years WHERE id = NEW.fiscal_year_id;
        SELECT code INTO org_code FROM organizations WHERE id = NEW.organization_id;

        SELECT COUNT(*) + 1 INTO seq_num
        FROM budgets
        WHERE fiscal_year_id = NEW.fiscal_year_id
        AND organization_id = NEW.organization_id;

        NEW.budget_number := 'BUD-' || fy_year || '-' || org_code || '-' || LPAD(seq_num::TEXT, 4, '0');
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =============================================================================
-- TRIGGERS
-- =============================================================================

-- Updated_at triggers
CREATE TRIGGER update_organizations_updated_at BEFORE UPDATE ON organizations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_fiscal_years_updated_at BEFORE UPDATE ON fiscal_years
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_programs_updated_at BEFORE UPDATE ON programs
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_budgets_updated_at BEFORE UPDATE ON budgets
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_budget_line_items_updated_at BEFORE UPDATE ON budget_line_items
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_obligations_updated_at BEFORE UPDATE ON obligations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_expenditures_updated_at BEFORE UPDATE ON expenditures
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Budget validation triggers
CREATE TRIGGER validate_budget_amounts_trigger BEFORE INSERT OR UPDATE ON budgets
    FOR EACH ROW EXECUTE FUNCTION validate_budget_amounts();

-- Budget number generation trigger
CREATE TRIGGER generate_budget_number_trigger BEFORE INSERT ON budgets
    FOR EACH ROW EXECUTE FUNCTION generate_budget_number();

-- =============================================================================
-- ROW LEVEL SECURITY (RLS) FOR MULTI-TENANT
-- =============================================================================

-- Enable RLS on all tenant-specific tables
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE fiscal_years ENABLE ROW LEVEL SECURITY;
ALTER TABLE programs ENABLE ROW LEVEL SECURITY;
ALTER TABLE budgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE budget_line_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE approvals ENABLE ROW LEVEL SECURITY;
ALTER TABLE obligations ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenditures ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;

-- Create RLS policies (example for budgets - repeat for other tables)
CREATE POLICY tenant_isolation_policy ON budgets
    USING (tenant_id = current_setting('app.current_tenant')::UUID);

-- =============================================================================
-- INITIAL DATA
-- =============================================================================

-- Note: Initial seed data should be in separate migration files
-- This ensures clean separation of schema and data

-- =============================================================================
-- COMMENTS
-- =============================================================================

COMMENT ON TABLE organizations IS 'Hierarchical organization structure for multi-tenant federal agencies';
COMMENT ON TABLE users IS 'System users with role-based access control';
COMMENT ON TABLE fiscal_years IS 'Federal fiscal years (October 1 - September 30)';
COMMENT ON TABLE programs IS 'Program elements in the PPBE process';
COMMENT ON TABLE budgets IS 'Budget allocations and tracking';
COMMENT ON TABLE budget_line_items IS 'Detailed line-level budget items';
COMMENT ON TABLE approvals IS 'Multi-level approval workflow';
COMMENT ON TABLE obligations IS 'Financial obligations (Anti-Deficiency Act compliance)';
COMMENT ON TABLE expenditures IS 'Actual expenditure tracking';
COMMENT ON TABLE audit_logs IS 'Comprehensive audit trail for compliance';
COMMENT ON TABLE notifications IS 'User notification system';
COMMENT ON TABLE documents IS 'Document management and attachments';
COMMENT ON TABLE comments IS 'Collaboration and discussion threads';
COMMENT ON TABLE reports IS 'Generated report tracking';
COMMENT ON TABLE background_jobs IS 'Background job queue tracking';
