-- TaxWijs PostgreSQL Schema
-- 53 tables across 6 bounded contexts
-- Version: 2026-01
-- Run: psql -d taxwijs -f schema.sql

-- Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "vector"; -- pgvector for RAG embeddings

-- ============================================================
-- CONTEXT 1: Identity & Access Management
-- ============================================================

CREATE TABLE users (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email           TEXT NOT NULL UNIQUE,
    email_verified  BOOLEAN NOT NULL DEFAULT FALSE,
    password_hash   TEXT NOT NULL,
    full_name       TEXT NOT NULL,
    preferred_lang  TEXT NOT NULL DEFAULT 'nl' CHECK (preferred_lang IN ('nl','en','fa')),
    mfa_enabled     BOOLEAN NOT NULL DEFAULT FALSE,
    mfa_secret_enc  TEXT,          -- encrypted TOTP secret
    is_active       BOOLEAN NOT NULL DEFAULT TRUE,
    last_login_at   TIMESTAMPTZ,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at      TIMESTAMPTZ    -- soft delete; hard delete after 90 days
);

CREATE TABLE roles (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name        TEXT NOT NULL UNIQUE,  -- admin, firm_manager, accountant, client, tax_sme
    description TEXT,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE permissions (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code        TEXT NOT NULL UNIQUE,  -- e.g. 'engagement:read', 'document:approve'
    description TEXT,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE role_permissions (
    role_id       UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    permission_id UUID NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
    PRIMARY KEY (role_id, permission_id)
);

CREATE TABLE user_role_assignments (
    id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role_id    UUID NOT NULL REFERENCES roles(id),
    firm_id    UUID,              -- NULL = global role (admin/tax_sme); populated = firm-scoped
    granted_by UUID REFERENCES users(id),
    granted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    revoked_at TIMESTAMPTZ,
    UNIQUE (user_id, role_id, firm_id)
);

CREATE TABLE firms (
    id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name             TEXT NOT NULL,
    kvk_number       TEXT,
    btw_number       TEXT,
    plan             TEXT NOT NULL DEFAULT 'starter' CHECK (plan IN ('starter','professional','enterprise')),
    is_active        BOOLEAN NOT NULL DEFAULT TRUE,
    logo_url         TEXT,
    primary_color    TEXT,         -- hex color for white-label UI
    created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- backfill firm_id FK
ALTER TABLE user_role_assignments
    ADD CONSTRAINT fk_ura_firm FOREIGN KEY (firm_id) REFERENCES firms(id) ON DELETE CASCADE;

CREATE TABLE firm_memberships (
    id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    firm_id    UUID NOT NULL REFERENCES firms(id) ON DELETE CASCADE,
    user_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    joined_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    left_at    TIMESTAMPTZ,
    UNIQUE (firm_id, user_id)
);

CREATE TABLE user_sessions (
    id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id       UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    jti           TEXT NOT NULL UNIQUE,  -- JWT ID for revocation
    ip_address    INET,
    user_agent    TEXT,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    expires_at    TIMESTAMPTZ NOT NULL,
    revoked_at    TIMESTAMPTZ
);

CREATE TABLE invitations (
    id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    firm_id       UUID NOT NULL REFERENCES firms(id) ON DELETE CASCADE,
    invited_email TEXT NOT NULL,
    role_id       UUID NOT NULL REFERENCES roles(id),
    invited_by    UUID NOT NULL REFERENCES users(id),
    token         TEXT NOT NULL UNIQUE,
    accepted_at   TIMESTAMPTZ,
    expires_at    TIMESTAMPTZ NOT NULL DEFAULT NOW() + INTERVAL '7 days',
    created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE api_clients (
    id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    firm_id       UUID NOT NULL REFERENCES firms(id) ON DELETE CASCADE,
    name          TEXT NOT NULL,
    client_id     TEXT NOT NULL UNIQUE,
    client_secret_hash TEXT NOT NULL,
    scopes        TEXT[] NOT NULL DEFAULT '{}',
    is_active     BOOLEAN NOT NULL DEFAULT TRUE,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE feature_flags (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    flag_key    TEXT NOT NULL,
    enabled     BOOLEAN NOT NULL DEFAULT FALSE,
    firm_id     UUID REFERENCES firms(id) ON DELETE CASCADE,  -- NULL = global
    user_id     UUID REFERENCES users(id) ON DELETE CASCADE,  -- NULL = firm/global
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (flag_key, firm_id, user_id)
);

-- ============================================================
-- CONTEXT 2: Firm & Client Management
-- ============================================================

CREATE TABLE clients (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    firm_id         UUID NOT NULL REFERENCES firms(id) ON DELETE CASCADE,
    user_id         UUID REFERENCES users(id),   -- linked user account (if they have portal access)
    client_number   TEXT,                         -- firm's internal client reference
    full_name       TEXT NOT NULL,
    email           TEXT,
    phone           TEXT,
    preferred_lang  TEXT NOT NULL DEFAULT 'nl' CHECK (preferred_lang IN ('nl','en','fa')),
    is_active       BOOLEAN NOT NULL DEFAULT TRUE,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE client_profiles (
    id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    client_id        UUID NOT NULL UNIQUE REFERENCES clients(id) ON DELETE CASCADE,
    bsn_enc          TEXT,          -- AES-256-GCM encrypted BSN
    date_of_birth    DATE,
    nationality      TEXT,
    address_street   TEXT,
    address_city     TEXT,
    address_postcode TEXT,
    address_country  TEXT NOT NULL DEFAULT 'NL',
    iban             TEXT,
    kvk_number       TEXT,          -- for ZZP/DGA
    btw_number       TEXT,
    company_name     TEXT,
    updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE tax_profiles (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    client_id       UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    persona         TEXT NOT NULL CHECK (persona IN ('zzp','employee','expat','dga')),
    is_aow_age      BOOLEAN NOT NULL DEFAULT FALSE,
    has_partner     BOOLEAN NOT NULL DEFAULT FALSE,
    has_children    BOOLEAN NOT NULL DEFAULT FALSE,
    owns_property   BOOLEAN NOT NULL DEFAULT FALSE,
    has_mortgage    BOOLEAN NOT NULL DEFAULT FALSE,
    is_30_ruling    BOOLEAN NOT NULL DEFAULT FALSE,
    wet_dba_risk    TEXT CHECK (wet_dba_risk IN ('low','medium','high')),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE tax_years (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    client_id   UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    tax_year    INT NOT NULL CHECK (tax_year BETWEEN 2020 AND 2030),
    is_active   BOOLEAN NOT NULL DEFAULT TRUE,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (client_id, tax_year)
);

-- ============================================================
-- CONTEXT 3: Engagement Workspace
-- ============================================================

CREATE TABLE engagements (
    id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    client_id         UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    firm_id           UUID NOT NULL REFERENCES firms(id),
    tax_year          INT NOT NULL CHECK (tax_year BETWEEN 2020 AND 2030),
    persona           TEXT NOT NULL CHECK (persona IN ('zzp','employee','expat','dga')),
    status            TEXT NOT NULL DEFAULT 'intake'
                          CHECK (status IN ('intake','documents_pending','in_review','ready','filed','archived')),
    assigned_to       UUID REFERENCES users(id),
    readiness_score   NUMERIC(5,2) NOT NULL DEFAULT 0.00,
    created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (client_id, tax_year)
);

CREATE TABLE engagement_status_history (
    id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    engagement_id  UUID NOT NULL REFERENCES engagements(id) ON DELETE CASCADE,
    from_status    TEXT,
    to_status      TEXT NOT NULL,
    changed_by     UUID REFERENCES users(id),
    reason         TEXT,
    created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE readiness_snapshots (
    id                     UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    engagement_id          UUID NOT NULL REFERENCES engagements(id) ON DELETE CASCADE,
    score                  NUMERIC(5,2) NOT NULL,
    doc_score              NUMERIC(5,2) NOT NULL,
    checklist_score        NUMERIC(5,2) NOT NULL,
    verification_score     NUMERIC(5,2) NOT NULL,
    accountant_review_score NUMERIC(5,2) NOT NULL,
    trigger_event          TEXT,
    created_at             TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE checklist_templates (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    persona     TEXT NOT NULL CHECK (persona IN ('zzp','employee','expat','dga')),
    year        INT NOT NULL,
    name        TEXT NOT NULL,
    version     INT NOT NULL DEFAULT 1,
    is_active   BOOLEAN NOT NULL DEFAULT TRUE,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (persona, year, version)
);

CREATE TABLE checklist_items (
    id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    template_id  UUID NOT NULL REFERENCES checklist_templates(id) ON DELETE CASCADE,
    stable_key   TEXT NOT NULL,   -- e.g. 'jaaropgave', 'btw_q1' — never changes
    label_nl     TEXT NOT NULL,
    label_en     TEXT NOT NULL,
    label_fa     TEXT NOT NULL,
    is_required  BOOLEAN NOT NULL DEFAULT TRUE,
    sort_order   INT NOT NULL DEFAULT 0,
    UNIQUE (template_id, stable_key)
);

CREATE TABLE checklist_item_states (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    engagement_id   UUID NOT NULL REFERENCES engagements(id) ON DELETE CASCADE,
    stable_key      TEXT NOT NULL,
    status          TEXT NOT NULL DEFAULT 'todo'
                        CHECK (status IN ('todo','uploaded','accepted','waived','rejected')),
    updated_by      UUID REFERENCES users(id),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    notes           TEXT,
    UNIQUE (engagement_id, stable_key)
);

CREATE TABLE document_requests (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    engagement_id   UUID NOT NULL REFERENCES engagements(id) ON DELETE CASCADE,
    stable_key      TEXT NOT NULL,   -- 'req_{checklist_stable_key}' for auto-created; custom otherwise
    label_nl        TEXT NOT NULL,
    label_en        TEXT NOT NULL,
    label_fa        TEXT NOT NULL,
    status          TEXT NOT NULL DEFAULT 'todo'
                        CHECK (status IN ('todo','uploaded','processing','accepted','waived','rejected')),
    document_id     UUID,            -- filled when client uploads
    due_date        DATE,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (engagement_id, stable_key)
);

CREATE TABLE tasks (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    engagement_id   UUID NOT NULL REFERENCES engagements(id) ON DELETE CASCADE,
    assigned_to     UUID REFERENCES users(id),
    title           TEXT NOT NULL,
    description     TEXT,
    priority        TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low','medium','high','critical')),
    status          TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open','in_progress','done','cancelled')),
    due_date        DATE,
    completed_at    TIMESTAMPTZ,
    completed_by    UUID REFERENCES users(id),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE message_threads (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    engagement_id   UUID NOT NULL REFERENCES engagements(id) ON DELETE CASCADE,
    subject         TEXT,
    thread_type     TEXT NOT NULL DEFAULT 'general' CHECK (thread_type IN ('general','document','ai_chat')),
    created_by      UUID NOT NULL REFERENCES users(id),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE messages (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    thread_id   UUID NOT NULL REFERENCES message_threads(id) ON DELETE CASCADE,
    sender_id   UUID REFERENCES users(id),
    role        TEXT NOT NULL CHECK (role IN ('user','assistant','system')),
    content     TEXT NOT NULL,
    lang        TEXT NOT NULL DEFAULT 'nl' CHECK (lang IN ('nl','en','fa')),
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE comments (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    engagement_id   UUID NOT NULL REFERENCES engagements(id) ON DELETE CASCADE,
    resource_type   TEXT NOT NULL,   -- 'document', 'checklist_item', 'task', etc.
    resource_id     UUID NOT NULL,
    author_id       UUID NOT NULL REFERENCES users(id),
    content         TEXT NOT NULL,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- CONTEXT 4: Document Processing
-- ============================================================

CREATE TABLE documents (
    id                      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    engagement_id           UUID NOT NULL REFERENCES engagements(id) ON DELETE CASCADE,
    document_request_id     UUID REFERENCES document_requests(id),
    document_type           TEXT NOT NULL DEFAULT 'UNKNOWN',
    original_filename       TEXT NOT NULL,
    mime_type               TEXT NOT NULL,
    file_size_bytes         BIGINT NOT NULL,
    s3_key                  TEXT NOT NULL,
    status                  TEXT NOT NULL DEFAULT 'pending'
                                CHECK (status IN ('pending','scanning','scanned','processing','extracted','needs_review','approved','rejected','superseded')),
    uploaded_by             UUID REFERENCES users(id),
    tax_year_detected       INT,
    classification_confidence NUMERIC(4,3),
    created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE document_versions (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    document_id     UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
    version_number  INT NOT NULL,
    s3_key          TEXT NOT NULL,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (document_id, version_number)
);

CREATE TABLE document_classifications (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    document_id         UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
    document_type       TEXT NOT NULL,
    confidence          NUMERIC(4,3) NOT NULL,
    is_primary          BOOLEAN NOT NULL DEFAULT TRUE,
    classifier_version  TEXT NOT NULL,
    reasoning           TEXT,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE document_extractions (
    id                      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    document_id             UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
    document_type           TEXT NOT NULL,
    composite_confidence    NUMERIC(4,3) NOT NULL,
    routing_decision        TEXT NOT NULL CHECK (routing_decision IN ('straight_through','spot_check','human_review','manual_only')),
    ocr_provider            TEXT NOT NULL DEFAULT 'aws_textract',
    ocr_raw_json            JSONB,
    created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE extracted_fields (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    extraction_id       UUID NOT NULL REFERENCES document_extractions(id) ON DELETE CASCADE,
    field_key           TEXT NOT NULL,
    raw_value           TEXT,
    normalized_value    TEXT,
    field_type          TEXT NOT NULL CHECK (field_type IN ('decimal','integer','string','date','boolean')),
    confidence          NUMERIC(4,3) NOT NULL,
    review_state        TEXT NOT NULL DEFAULT 'pending'
                            CHECK (review_state IN ('pending','accepted','corrected','rejected')),
    final_value         TEXT,        -- set after human review
    validation_error    TEXT,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE extraction_reviews (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    document_id     UUID NOT NULL REFERENCES documents(id),
    extraction_id   UUID NOT NULL REFERENCES document_extractions(id),
    reviewer_id     UUID NOT NULL REFERENCES users(id),
    decision        TEXT NOT NULL CHECK (decision IN ('approved','rejected','needs_client_correction')),
    locked_by       UUID REFERENCES users(id),
    lock_expires_at TIMESTAMPTZ,
    review_version  INT NOT NULL DEFAULT 1,
    state           TEXT NOT NULL DEFAULT 'open' CHECK (state IN ('open','locked','complete')),
    notes           TEXT,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    completed_at    TIMESTAMPTZ
);

CREATE TABLE validation_rules (
    id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    document_type TEXT NOT NULL,
    field_key     TEXT NOT NULL,
    rule_type     TEXT NOT NULL CHECK (rule_type IN ('format','range','required','cross_document')),
    rule_params   JSONB NOT NULL DEFAULT '{}',
    error_message TEXT NOT NULL,
    is_active     BOOLEAN NOT NULL DEFAULT TRUE,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE pipeline_runs (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    document_id     UUID NOT NULL REFERENCES documents(id),
    stage           TEXT NOT NULL,   -- 'virus_scan', 'ocr', 'classification', 'extraction', 'validation'
    status          TEXT NOT NULL CHECK (status IN ('queued','running','complete','failed')),
    duration_ms     INT,
    error_message   TEXT,
    metadata        JSONB NOT NULL DEFAULT '{}',
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    completed_at    TIMESTAMPTZ
);

-- ============================================================
-- CONTEXT 5: AI Rule Engine
-- ============================================================

CREATE TABLE rule_sets (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    year        INT NOT NULL UNIQUE,
    description TEXT,
    is_active   BOOLEAN NOT NULL DEFAULT TRUE,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE rules (
    id                    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    rule_set_id           UUID NOT NULL REFERENCES rule_sets(id),
    rule_id               TEXT NOT NULL UNIQUE,  -- e.g. 'ZA-2026-001'
    topic                 TEXT NOT NULL,
    category              TEXT NOT NULL,
    user_types            TEXT[] NOT NULL,
    plain_nl              TEXT NOT NULL,
    plain_en              TEXT NOT NULL,
    plain_fa              TEXT NOT NULL,
    condition_summary     TEXT,
    result_type           TEXT NOT NULL,
    result_value          NUMERIC,
    result_formula        TEXT,
    source_url            TEXT NOT NULL,
    verification_status   TEXT NOT NULL DEFAULT 'draft'
                              CHECK (verification_status IN ('draft','pending_review','verified','superseded','archived')),
    effective_from        DATE NOT NULL,
    effective_until       DATE,
    ai_prompt_hint        TEXT,
    tags                  TEXT[] NOT NULL DEFAULT '{}',
    supersedes            TEXT,      -- rule_id of prior year's rule
    created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE rule_versions (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    rule_id     UUID NOT NULL REFERENCES rules(id),
    version     INT NOT NULL,
    changes     JSONB NOT NULL,
    changed_by  UUID NOT NULL REFERENCES users(id),
    approved_by UUID REFERENCES users(id),
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (rule_id, version)
);

CREATE TABLE rule_test_cases (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    rule_id         UUID NOT NULL REFERENCES rules(id),
    description     TEXT NOT NULL,
    input_params    JSONB NOT NULL,
    expected_output JSONB NOT NULL,
    last_run_at     TIMESTAMPTZ,
    last_run_passed BOOLEAN,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE deduction_opportunities (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    engagement_id       UUID NOT NULL REFERENCES engagements(id) ON DELETE CASCADE,
    rule_id             TEXT NOT NULL,   -- references rules.rule_id
    opportunity_type    TEXT NOT NULL,
    estimated_saving    NUMERIC(10,2),
    confidence          NUMERIC(4,3) NOT NULL,
    status              TEXT NOT NULL DEFAULT 'identified'
                            CHECK (status IN ('identified','presented','accepted','dismissed','expired')),
    accountant_notes    TEXT,
    expires_at          DATE,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE evidence_requirements (
    id                      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    deduction_opportunity_id UUID NOT NULL REFERENCES deduction_opportunities(id) ON DELETE CASCADE,
    evidence_type           TEXT NOT NULL,   -- document type code
    description_nl          TEXT NOT NULL,
    description_en          TEXT NOT NULL,
    description_fa          TEXT NOT NULL,
    is_satisfied            BOOLEAN NOT NULL DEFAULT FALSE,
    document_id             UUID REFERENCES documents(id),
    created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE model_versions (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    model_name      TEXT NOT NULL,
    version         TEXT NOT NULL,
    provider        TEXT NOT NULL,   -- 'openai', 'anthropic', 'sentence-transformers'
    dimensions      INT,             -- for embedding models
    deployed_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deprecated_at   TIMESTAMPTZ,
    UNIQUE (model_name, version)
);

CREATE TABLE prompt_versions (
    id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    prompt_name  TEXT NOT NULL,
    version      INT NOT NULL,
    content      TEXT NOT NULL,
    author_id    UUID NOT NULL REFERENCES users(id),
    deployed_at  TIMESTAMPTZ,
    notes        TEXT,
    created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (prompt_name, version)
);

CREATE TABLE rag_documents (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    doc_type    TEXT NOT NULL CHECK (doc_type IN ('rule','qa','scenario','ib_field','raw')),
    source_id   TEXT NOT NULL,   -- Phase 1 record ID
    year        INT NOT NULL,
    priority    NUMERIC(3,2) NOT NULL DEFAULT 1.00,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (doc_type, source_id, year)
);

CREATE TABLE rag_chunks (
    id                      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    chunk_id                TEXT NOT NULL UNIQUE,
    rag_document_id         UUID NOT NULL REFERENCES rag_documents(id) ON DELETE CASCADE,
    text                    TEXT NOT NULL,
    embedding               vector(768),    -- 768-dim for multilingual-mpnet; 1536 for OpenAI
    doc_type                TEXT NOT NULL,
    source_id               TEXT NOT NULL,
    year                    INT NOT NULL,
    topic                   TEXT,
    user_types              TEXT[] NOT NULL DEFAULT '{}',
    verification_status     TEXT NOT NULL DEFAULT 'verified',
    effective_from          DATE,
    effective_until         DATE,
    source_url              TEXT,
    ai_prompt_hint          TEXT,
    expected_ai_behavior    TEXT,
    language                TEXT NOT NULL DEFAULT 'multilingual',
    qa_id                   TEXT,
    priority                NUMERIC(3,2) NOT NULL DEFAULT 1.00,
    created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE embeddings_index_metadata (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    model_name      TEXT NOT NULL,
    model_version   TEXT NOT NULL,
    dimensions      INT NOT NULL,
    chunk_count     INT NOT NULL,
    built_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    is_current      BOOLEAN NOT NULL DEFAULT TRUE
);

-- ============================================================
-- CONTEXT 6: Billing & Subscription
-- ============================================================

CREATE TABLE subscriptions (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    firm_id         UUID NOT NULL UNIQUE REFERENCES firms(id) ON DELETE CASCADE,
    plan            TEXT NOT NULL DEFAULT 'starter' CHECK (plan IN ('starter','professional','enterprise')),
    billing_cycle   TEXT NOT NULL DEFAULT 'monthly' CHECK (billing_cycle IN ('monthly','annual')),
    status          TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','past_due','cancelled','trialing')),
    starts_at       DATE NOT NULL,
    current_period_ends_at DATE,
    max_engagements INT NOT NULL DEFAULT 10,
    max_ai_calls    INT NOT NULL DEFAULT 100,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE invoices (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    firm_id         UUID NOT NULL REFERENCES firms(id),
    amount_cents    INT NOT NULL,
    currency        TEXT NOT NULL DEFAULT 'EUR',
    status          TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','open','paid','void','uncollectible')),
    period_start    DATE NOT NULL,
    period_end      DATE NOT NULL,
    due_date        DATE,
    paid_at         TIMESTAMPTZ,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE usage_records (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    firm_id         UUID NOT NULL REFERENCES firms(id) ON DELETE CASCADE,
    metric          TEXT NOT NULL,   -- 'engagements', 'ai_calls', 'documents', 'storage_mb'
    quantity        NUMERIC NOT NULL,
    recorded_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE webhooks (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    firm_id         UUID NOT NULL REFERENCES firms(id) ON DELETE CASCADE,
    url             TEXT NOT NULL,
    secret          TEXT NOT NULL,   -- HMAC-SHA256 signing secret (stored hashed)
    events          TEXT[] NOT NULL DEFAULT '{}',
    is_active       BOOLEAN NOT NULL DEFAULT TRUE,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE notifications (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type            TEXT NOT NULL,
    title           TEXT NOT NULL,
    body            TEXT,
    link            TEXT,
    is_read         BOOLEAN NOT NULL DEFAULT FALSE,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- CROSS-CUTTING CONCERNS
-- ============================================================

CREATE TABLE audit_log (
    id              BIGSERIAL PRIMARY KEY,   -- BIGSERIAL for high volume; immutable
    action          TEXT NOT NULL,
    resource_type   TEXT NOT NULL,
    resource_id     UUID,
    user_id         UUID REFERENCES users(id),
    firm_id         UUID REFERENCES firms(id),
    old_value       JSONB,
    new_value       JSONB,
    ip_address      INET,
    request_id      TEXT,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
    -- NO update or delete trigger on this table — immutable by design
);

CREATE TABLE consent_records (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    consent_type    TEXT NOT NULL,   -- 'terms_of_service', 'privacy_policy', 'marketing'
    version         TEXT NOT NULL,
    consented       BOOLEAN NOT NULL,
    ip_address      INET,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE retention_policies (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    resource_type       TEXT NOT NULL UNIQUE,
    retention_days      INT NOT NULL,
    deletion_method     TEXT NOT NULL CHECK (deletion_method IN ('hard_delete','soft_delete','anonymize','archive')),
    legal_basis         TEXT,
    last_run_at         TIMESTAMPTZ,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE data_subject_requests (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    request_type        TEXT NOT NULL CHECK (request_type IN ('access','erasure','portability','rectification')),
    subject_email       TEXT NOT NULL,
    requested_by        UUID REFERENCES users(id),
    status              TEXT NOT NULL DEFAULT 'pending'
                            CHECK (status IN ('pending','in_progress','fulfilled','rejected')),
    deadline            DATE NOT NULL,
    fulfilled_at        TIMESTAMPTZ,
    fulfilled_by        UUID REFERENCES users(id),
    download_url        TEXT,
    download_expires_at TIMESTAMPTZ,
    notes               TEXT,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE incidents (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title           TEXT NOT NULL,
    severity        TEXT NOT NULL CHECK (severity IN ('P0','P1','P2','P3')),
    status          TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open','investigating','resolved','closed')),
    description     TEXT,
    affected_system TEXT,
    detected_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    resolved_at     TIMESTAMPTZ,
    postmortem_url  TEXT,
    created_by      UUID REFERENCES users(id)
);
