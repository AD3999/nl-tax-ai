-- TaxWijs PostgreSQL Indexes
-- Run after schema.sql
-- Version: 2026-01

-- ============================================================
-- Identity & Access
-- ============================================================

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_deleted_at ON users(deleted_at) WHERE deleted_at IS NOT NULL;
CREATE INDEX idx_user_sessions_user_id ON user_sessions(user_id);
CREATE INDEX idx_user_sessions_jti ON user_sessions(jti);
CREATE INDEX idx_user_sessions_expires_at ON user_sessions(expires_at);
CREATE INDEX idx_user_role_assignments_user_id ON user_role_assignments(user_id);
CREATE INDEX idx_user_role_assignments_firm_id ON user_role_assignments(firm_id);
CREATE INDEX idx_invitations_token ON invitations(token);
CREATE INDEX idx_invitations_expires_at ON invitations(expires_at);
CREATE INDEX idx_feature_flags_key ON feature_flags(flag_key);

-- ============================================================
-- Firm & Client Management
-- ============================================================

CREATE INDEX idx_clients_firm_id ON clients(firm_id);
CREATE INDEX idx_clients_user_id ON clients(user_id) WHERE user_id IS NOT NULL;
CREATE INDEX idx_firm_memberships_user_id ON firm_memberships(user_id);
CREATE INDEX idx_firm_memberships_firm_id ON firm_memberships(firm_id);
CREATE INDEX idx_tax_profiles_client_id ON tax_profiles(client_id);

-- ============================================================
-- Engagement Workspace
-- ============================================================

CREATE INDEX idx_engagements_firm_id ON engagements(firm_id);
CREATE INDEX idx_engagements_client_id ON engagements(client_id);
CREATE INDEX idx_engagements_status ON engagements(status);
CREATE INDEX idx_engagements_assigned_to ON engagements(assigned_to) WHERE assigned_to IS NOT NULL;
CREATE INDEX idx_engagements_tax_year ON engagements(tax_year);
CREATE INDEX idx_engagement_status_history_engagement_id ON engagement_status_history(engagement_id);
CREATE INDEX idx_readiness_snapshots_engagement_id ON readiness_snapshots(engagement_id);
CREATE INDEX idx_readiness_snapshots_created_at ON readiness_snapshots(created_at DESC);
CREATE INDEX idx_checklist_items_template_id ON checklist_items(template_id);
CREATE INDEX idx_checklist_item_states_engagement_id ON checklist_item_states(engagement_id);
CREATE INDEX idx_checklist_item_states_stable_key ON checklist_item_states(stable_key);
CREATE INDEX idx_document_requests_engagement_id ON document_requests(engagement_id);
CREATE INDEX idx_document_requests_stable_key ON document_requests(stable_key);
CREATE INDEX idx_tasks_engagement_id ON tasks(engagement_id);
CREATE INDEX idx_tasks_assigned_to ON tasks(assigned_to) WHERE assigned_to IS NOT NULL;
CREATE INDEX idx_tasks_status ON tasks(status);
CREATE INDEX idx_tasks_priority ON tasks(priority);
CREATE INDEX idx_message_threads_engagement_id ON message_threads(engagement_id);
CREATE INDEX idx_messages_thread_id ON messages(thread_id);
CREATE INDEX idx_messages_created_at ON messages(created_at DESC);
CREATE INDEX idx_comments_resource ON comments(resource_type, resource_id);

-- ============================================================
-- Document Processing
-- ============================================================

CREATE INDEX idx_documents_engagement_id ON documents(engagement_id);
CREATE INDEX idx_documents_status ON documents(status);
CREATE INDEX idx_documents_document_type ON documents(document_type);
CREATE INDEX idx_documents_created_at ON documents(created_at DESC);
CREATE INDEX idx_document_classifications_document_id ON document_classifications(document_id);
CREATE INDEX idx_document_classifications_is_primary ON document_classifications(document_id, is_primary) WHERE is_primary = TRUE;
CREATE INDEX idx_document_extractions_document_id ON document_extractions(document_id);
CREATE INDEX idx_extracted_fields_extraction_id ON extracted_fields(extraction_id);
CREATE INDEX idx_extracted_fields_field_key ON extracted_fields(field_key);
CREATE INDEX idx_extracted_fields_review_state ON extracted_fields(review_state);
CREATE INDEX idx_extraction_reviews_document_id ON extraction_reviews(document_id);
CREATE INDEX idx_extraction_reviews_state ON extraction_reviews(state);
CREATE INDEX idx_pipeline_runs_document_id ON pipeline_runs(document_id);
CREATE INDEX idx_pipeline_runs_stage_status ON pipeline_runs(stage, status);
CREATE INDEX idx_pipeline_runs_created_at ON pipeline_runs(created_at DESC);

-- ============================================================
-- AI Rule Engine
-- ============================================================

CREATE INDEX idx_rules_rule_set_id ON rules(rule_set_id);
CREATE INDEX idx_rules_rule_id ON rules(rule_id);
CREATE INDEX idx_rules_verification_status ON rules(verification_status);
CREATE INDEX idx_rules_effective_dates ON rules(effective_from, effective_until);
CREATE INDEX idx_rules_user_types ON rules USING GIN(user_types);
CREATE INDEX idx_rules_tags ON rules USING GIN(tags);
CREATE INDEX idx_rule_versions_rule_id ON rule_versions(rule_id);
CREATE INDEX idx_rule_test_cases_rule_id ON rule_test_cases(rule_id);
CREATE INDEX idx_deduction_opportunities_engagement_id ON deduction_opportunities(engagement_id);
CREATE INDEX idx_deduction_opportunities_status ON deduction_opportunities(status);
CREATE INDEX idx_evidence_requirements_opportunity_id ON evidence_requirements(deduction_opportunity_id);
CREATE INDEX idx_rag_chunks_doc_type ON rag_chunks(doc_type);
CREATE INDEX idx_rag_chunks_source_id ON rag_chunks(source_id);
CREATE INDEX idx_rag_chunks_year ON rag_chunks(year);
CREATE INDEX idx_rag_chunks_verification_status ON rag_chunks(verification_status);
CREATE INDEX idx_rag_chunks_user_types ON rag_chunks USING GIN(user_types);
CREATE INDEX idx_rag_chunks_effective_until ON rag_chunks(effective_until) WHERE effective_until IS NOT NULL;

-- Vector similarity index for RAG embeddings (pgvector)
-- IVFFlat for approximate nearest neighbor; lists = sqrt(chunk_count) ≈ 11 for 113 chunks
CREATE INDEX idx_rag_chunks_embedding ON rag_chunks USING ivfflat (embedding vector_cosine_ops) WITH (lists = 16);

-- ============================================================
-- Billing
-- ============================================================

CREATE INDEX idx_usage_records_firm_id ON usage_records(firm_id);
CREATE INDEX idx_usage_records_metric ON usage_records(metric);
CREATE INDEX idx_usage_records_recorded_at ON usage_records(recorded_at DESC);
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_is_read ON notifications(user_id, is_read) WHERE is_read = FALSE;
CREATE INDEX idx_invoices_firm_id ON invoices(firm_id);
CREATE INDEX idx_invoices_status ON invoices(status);

-- ============================================================
-- Cross-cutting
-- ============================================================

CREATE INDEX idx_audit_log_resource ON audit_log(resource_type, resource_id);
CREATE INDEX idx_audit_log_user_id ON audit_log(user_id);
CREATE INDEX idx_audit_log_firm_id ON audit_log(firm_id);
CREATE INDEX idx_audit_log_created_at ON audit_log(created_at DESC);
CREATE INDEX idx_audit_log_action ON audit_log(action);
CREATE INDEX idx_consent_records_user_id ON consent_records(user_id);
CREATE INDEX idx_data_subject_requests_subject_email ON data_subject_requests(subject_email);
CREATE INDEX idx_data_subject_requests_status ON data_subject_requests(status);
CREATE INDEX idx_incidents_severity ON incidents(severity);
CREATE INDEX idx_incidents_status ON incidents(status);
