-- TaxWijs Seed Reference Data
-- Inserts roles, permissions, checklist templates, retention policies, and rule set stubs
-- Run after schema.sql and indexes.sql
-- Version: 2026-01

-- ============================================================
-- Roles
-- ============================================================

INSERT INTO roles (id, name, description) VALUES
    ('11111111-0000-0000-0000-000000000001', 'admin',        'System administrator — full access'),
    ('11111111-0000-0000-0000-000000000002', 'tax_sme',      'Tax subject matter expert — rule management, no client data'),
    ('11111111-0000-0000-0000-000000000003', 'firm_manager', 'Firm manager — all clients in their firm'),
    ('11111111-0000-0000-0000-000000000004', 'accountant',   'Accountant — assigned engagements'),
    ('11111111-0000-0000-0000-000000000005', 'client',       'End client — own engagements only');

-- ============================================================
-- Permissions
-- ============================================================

INSERT INTO permissions (code, description) VALUES
-- Engagement
    ('engagement:create',        'Create new engagements'),
    ('engagement:read',          'View engagement details'),
    ('engagement:update',        'Edit engagement data'),
    ('engagement:delete',        'Archive engagements'),
    ('engagement:submit',        'Submit engagement for review'),
    ('engagement:approve',       'Approve / mark as filed'),
-- Document
    ('document:upload',          'Upload documents'),
    ('document:read',            'View documents'),
    ('document:approve',         'Approve extracted fields'),
    ('document:delete',          'Delete / supersede documents'),
-- Checklist
    ('checklist:read',           'View checklist items'),
    ('checklist:update',         'Update checklist item status'),
    ('checklist:waive',          'Mark items as waived'),
-- AI
    ('ai:chat',                  'Use AI chat assistant'),
    ('ai:rules:read',            'View tax rules'),
    ('ai:rules:write',           'Edit tax rules'),
    ('ai:rules:publish',         'Publish / approve tax rules'),
-- Admin
    ('firm:manage',              'Manage firm settings'),
    ('users:invite',             'Invite new users'),
    ('users:manage',             'Manage all users in firm'),
    ('billing:read',             'View billing information'),
    ('billing:manage',           'Manage subscription and billing'),
    ('admin:all',                'Unrestricted system access');

-- ============================================================
-- Role → Permission assignments
-- ============================================================

-- admin gets everything
INSERT INTO role_permissions (role_id, permission_id)
SELECT '11111111-0000-0000-0000-000000000001', id FROM permissions;

-- tax_sme: rules + AI + read-only engagement
INSERT INTO role_permissions (role_id, permission_id)
SELECT '11111111-0000-0000-0000-000000000002', id FROM permissions
WHERE code IN ('engagement:read','ai:chat','ai:rules:read','ai:rules:write','ai:rules:publish');

-- firm_manager: everything except admin
INSERT INTO role_permissions (role_id, permission_id)
SELECT '11111111-0000-0000-0000-000000000003', id FROM permissions
WHERE code NOT IN ('admin:all','ai:rules:write','ai:rules:publish','billing:manage');

-- accountant: engagement + document + checklist + AI chat
INSERT INTO role_permissions (role_id, permission_id)
SELECT '11111111-0000-0000-0000-000000000004', id FROM permissions
WHERE code IN (
    'engagement:read','engagement:update','engagement:submit',
    'document:upload','document:read','document:approve',
    'checklist:read','checklist:update','checklist:waive',
    'ai:chat','ai:rules:read'
);

-- client: limited to own data
INSERT INTO role_permissions (role_id, permission_id)
SELECT '11111111-0000-0000-0000-000000000005', id FROM permissions
WHERE code IN (
    'engagement:read','engagement:submit',
    'document:upload','document:read',
    'checklist:read',
    'ai:chat'
);

-- ============================================================
-- Rule Set (2026)
-- ============================================================

INSERT INTO rule_sets (id, year, description, is_active) VALUES
    ('22222222-0000-0000-0000-000000000001', 2026, 'Dutch tax rules 2026 — source: Belastingdienst + Prinsjesdag 2025', TRUE);

-- ============================================================
-- Checklist Templates
-- ============================================================

-- ZZP template 2026
INSERT INTO checklist_templates (id, persona, year, name, version) VALUES
    ('33333333-0000-0000-0000-000000000001', 'zzp',      2026, 'ZZP Checklist 2026',      1),
    ('33333333-0000-0000-0000-000000000002', 'employee',  2026, 'Employee Checklist 2026', 1),
    ('33333333-0000-0000-0000-000000000003', 'expat',     2026, 'Expat Checklist 2026',    1),
    ('33333333-0000-0000-0000-000000000004', 'dga',       2026, 'DGA Checklist 2026',      1);

-- ZZP checklist items
INSERT INTO checklist_items (template_id, stable_key, label_nl, label_en, label_fa, is_required, sort_order) VALUES
    ('33333333-0000-0000-0000-000000000001', 'bankafschrift',      'Bankafschrift heel jaar', 'Full-year bank statement', 'صورت‌حساب بانکی کل سال', TRUE, 10),
    ('33333333-0000-0000-0000-000000000001', 'facturen_uitgaand',  'Verkoopfacturen',         'Sales invoices',           'فاکتورهای فروش', TRUE, 20),
    ('33333333-0000-0000-0000-000000000001', 'facturen_inkomend',  'Inkoopfacturen',          'Purchase invoices',        'فاکتورهای خرید', TRUE, 30),
    ('33333333-0000-0000-0000-000000000001', 'btw_aangiftes',      'BTW-aangiftes Q1-Q4',     'VAT returns Q1-Q4',        'اظهارنامه‌های مالیات بر ارزش‌افزوده', TRUE, 40),
    ('33333333-0000-0000-0000-000000000001', 'urenstaat',          'Urenstaat (1.225 uur)',   'Hours log (1,225 hrs)',     'ثبت ساعات کار', TRUE, 50),
    ('33333333-0000-0000-0000-000000000001', 'kvk_uittreksel',     'KVK-uittreksel',          'Chamber of Commerce extract', 'عصاره اتاق بازرگانی', FALSE, 60);

-- Employee checklist items
INSERT INTO checklist_items (template_id, stable_key, label_nl, label_en, label_fa, is_required, sort_order) VALUES
    ('33333333-0000-0000-0000-000000000002', 'jaaropgave',         'Jaaropgave werkgever',    'Employer annual statement', 'گواهی سالانه کارفرما', TRUE, 10),
    ('33333333-0000-0000-0000-000000000002', 'bankafschrift',      'Bankafschrift',            'Bank statement',            'صورت‌حساب بانکی', FALSE, 20),
    ('33333333-0000-0000-0000-000000000002', 'hypotheekjaaropgave','Hypotheekjaaropgave',     'Mortgage statement',        'گواهی سالانه وام مسکن', FALSE, 30);

-- Expat checklist items
INSERT INTO checklist_items (template_id, stable_key, label_nl, label_en, label_fa, is_required, sort_order) VALUES
    ('33333333-0000-0000-0000-000000000003', 'jaaropgave',         'Jaaropgave',              'Annual income statement',   'گواهی سالانه درآمد', TRUE, 10),
    ('33333333-0000-0000-0000-000000000003', '30_ruling_brief',    '30%-ruling beschikking',  '30% ruling letter',         'حکم قانون سی درصد', TRUE, 20),
    ('33333333-0000-0000-0000-000000000003', 'bankafschrift',      'Bankafschrift',            'Bank statement',            'صورت‌حساب بانکی', FALSE, 30);

-- DGA checklist items
INSERT INTO checklist_items (template_id, stable_key, label_nl, label_en, label_fa, is_required, sort_order) VALUES
    ('33333333-0000-0000-0000-000000000004', 'jaaropgave_dga',     'Jaaropgave DGA-loon',     'DGA salary statement',      'گواهی حقوق مدیرعامل', TRUE, 10),
    ('33333333-0000-0000-0000-000000000004', 'dividendbewijs',     'Dividendbewijs',           'Dividend certificate',      'گواهی سود سهام', TRUE, 20),
    ('33333333-0000-0000-0000-000000000004', 'bankafschrift',      'Bankafschrift BV',         'BV bank statement',         'صورت‌حساب بانکی شرکت', TRUE, 30),
    ('33333333-0000-0000-0000-000000000004', 'jaarstukken',        'Jaarstukken BV',           'Annual accounts BV',        'صورت‌های مالی شرکت', TRUE, 40);

-- ============================================================
-- Data Retention Policies
-- ============================================================

INSERT INTO retention_policies (resource_type, retention_days, deletion_method, legal_basis) VALUES
    ('documents',             2557,  'soft_delete',  'Dutch accounting law (Belastingdienst) — 7 year retention'),
    ('extracted_fields',      2557,  'soft_delete',  'Dutch accounting law — 7 year retention'),
    ('audit_log',             1826,  'archive',      'Internal compliance — 5 year retention'),
    ('messages',              730,   'hard_delete',  'Privacy policy — 2 year AI chat retention'),
    ('user_sessions',         30,    'hard_delete',  'Security hygiene'),
    ('invitations',           7,     'hard_delete',  'Hygiene — unused invitations expire in 7 days'),
    ('usage_records',         1095,  'anonymize',    'Billing disputes — 3 year retention'),
    ('users',                 90,    'hard_delete',  'GDPR Art. 17 — soft delete 90 days then hard delete');

-- ============================================================
-- Embedding Index Metadata (initial state)
-- ============================================================

INSERT INTO embeddings_index_metadata (model_name, model_version, dimensions, chunk_count, is_current) VALUES
    ('paraphrase-multilingual-mpnet-base-v2', '2.2.2', 768, 0, TRUE);
