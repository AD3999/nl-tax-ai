# Operational Runbooks — TaxWijs

> Live runbooks for on-call engineers. Each runbook covers one operational scenario: trigger, diagnosis, remediation, and rollback.

---

## Runbook Index

| ID | Scenario | Severity | Typical RTO |
|----|----------|----------|-------------|
| RB-001 | API returns 5xx spike | P1 | <15 min |
| RB-002 | RAG retrieval accuracy degrades | P1 | <30 min |
| RB-003 | Document pipeline stalls | P2 | <30 min |
| RB-004 | Database connection exhaustion | P1 | <10 min |
| RB-005 | Claude API latency spike | P2 | <20 min |
| RB-006 | Failed database migration | P0 | <60 min |
| RB-007 | DSAR workflow breach of SLA | P1 | <2 hr |
| RB-008 | Supabase pgvector index corruption | P2 | <60 min |
| RB-009 | Railway deploy rollback | P1 | <5 min |
| RB-010 | BSN encryption key rotation | P0 | Planned |

---

## RB-001 — API 5xx Spike

**Trigger:** Error rate >1% over 5-minute window, or PagerDuty fires `api_error_rate_high`.

**Diagnosis:**
```bash
# Check Railway logs
railway logs --service backend --tail 200

# Check error distribution
# In Grafana: panel "API Error Rate by endpoint" → last 15 min

# Check if DB is reachable
railway run python manage.py dbshell -- -c "SELECT 1;"
```

**Common causes and fixes:**

| Symptom | Cause | Fix |
|---------|-------|-----|
| `OperationalError: too many connections` | DB pool exhausted | See RB-004 |
| `504 Gateway Timeout` | Gunicorn worker saturation | Scale up Railway service replicas |
| `500 on /api/chat/` | Claude API down | Check `status.anthropic.com`; AI chat degrades gracefully |
| `500 on /api/portal/` | Migration not applied | See RB-006 |

**Rollback:** See RB-009.

---

## RB-002 — RAG Retrieval Accuracy Degrades

**Trigger:** `rag_precision_at_5` drops below 90% in monitoring dashboard, or user reports wrong tax answers.

**Diagnosis:**
```bash
# Run retrieval quality tests
cd nl-tax-ai && python phase2/test_retrieval.py

# Check embedding manifest — confirm provider is openai
cat phase2/embedding_manifest.json

# Check chunk count in Supabase
SELECT COUNT(*) FROM rag_chunks WHERE year = 2026 AND verification_status = 'verified';
```

**Fix — rebuild index with OpenAI:**
```bash
export OPENAI_API_KEY=<key>
python phase2/build_index.py --provider openai --reset
# Confirm: embedding_manifest.json shows provider: openai
python phase2/test_retrieval.py
# All 5 quality gates must pass before deploying
```

**Root cause register:**
- Wrong provider used at build time → always use `--provider openai` in production
- Phase 1 seed data changed without rebuilding index → run `build_index.py` after any seed change
- OpenAI model version changed → update `embed_openai.py` and rebuild

---

## RB-003 — Document Pipeline Stalls

**Trigger:** Documents stuck in `processing` status for >15 minutes.

**Diagnosis:**
```bash
# Check for stuck documents
SELECT id, original_filename, status, created_at
FROM documents
WHERE status = 'processing' AND created_at < NOW() - INTERVAL '15 minutes';

# Check AI worker logs
railway logs --service ai-worker --tail 100

# Check Claude API status
curl https://status.anthropic.com/api/v2/status.json | python -m json.tool
```

**Fix:**
```bash
# Reset stuck documents to allow re-processing
UPDATE documents
SET status = 'uploaded', updated_at = NOW()
WHERE status = 'processing' AND created_at < NOW() - INTERVAL '30 minutes';

# Restart ai-worker
railway service restart ai-worker
```

---

## RB-004 — Database Connection Exhaustion

**Trigger:** `OperationalError: FATAL: remaining connection slots are reserved`, or DB pool metric >90%.

**Diagnosis:**
```sql
-- Active connections
SELECT count(*), state, wait_event_type
FROM pg_stat_activity
GROUP BY state, wait_event_type;

-- Long-running queries
SELECT pid, now() - query_start AS duration, query
FROM pg_stat_activity
WHERE state = 'active' AND now() - query_start > interval '30 seconds'
ORDER BY duration DESC;
```

**Fix:**
```sql
-- Terminate idle connections older than 10 minutes
SELECT pg_terminate_backend(pid)
FROM pg_stat_activity
WHERE state = 'idle' AND now() - state_change > interval '10 minutes';
```

Then in Django settings, verify `CONN_MAX_AGE` and `DATABASE_POOL_SIZE` are reasonable for Railway's plan.

---

## RB-005 — Claude API Latency Spike

**Trigger:** P95 AI response latency >10 seconds; `claude_api_latency_p95` alert fires.

**Diagnosis:**
- Check `status.anthropic.com` for incident
- Check Railway logs for timeout patterns: `anthropic.APITimeoutError`

**Fix:**
- If Anthropic-side: no action, degrade gracefully — AI chat returns "service temporarily slow" message
- If our side: check if prompt token count grew unexpectedly; review recent prompt changes in `prompt_versions`

---

## RB-006 — Failed Database Migration

**Trigger:** Deploy fails at migration step; `django.db.utils.ProgrammingError` in logs.

**Diagnosis:**
```bash
railway run python manage.py showmigrations | grep "\[ \]"
```

**Rollback:**
```bash
# Roll back to previous migration (replace app and migration name)
railway run python manage.py migrate <app_name> <previous_migration_name>

# Then roll back the Railway deploy
# See RB-009
```

**Prevention:** Never run `--fake` in production. Always test migrations on staging with a production-size data clone first.

---

## RB-007 — DSAR Workflow Breach of SLA

**Trigger:** `data_subject_requests` table has a row where `created_at < NOW() - INTERVAL '28 days'` and `status != 'completed'`.

**Immediate action:**
1. Notify DPO within 1 hour
2. Mark request as priority in `data_subject_requests.notes`
3. Manually run export: `python manage.py export_dsar --request-id <uuid>`
4. Send to requestor via secure channel
5. Log in `audit_log` with reason for delay

**SLA:** 30 days per GDPR Art. 12. Breach = potential DPA notification obligation.

---

## RB-008 — Supabase pgvector Index Corruption

**Trigger:** `ivfflat` similarity search returns 0 results or errors with `ERROR: index is not valid`.

**Fix:**
```sql
-- Reindex (can be done online in Postgres 12+)
REINDEX INDEX CONCURRENTLY idx_rag_chunks_embedding;

-- Verify
SELECT COUNT(*) FROM rag_chunks;
SELECT * FROM embeddings_index_metadata ORDER BY created_at DESC LIMIT 1;
```

If full rebuild needed:
```bash
python phase2/build_index.py --provider openai --store supabase --reset
```

---

## RB-009 — Railway Deploy Rollback

**Trigger:** Post-deploy error spike; health check fails; user reports broken feature.

**Rollback (<2 min):**
1. Open Railway dashboard → Project → Service → Deployments
2. Find last green deployment
3. Click "Rollback to this deployment"
4. Verify health: `GET /api/users/health/` returns `{"status": "ok"}`

**If migration must also roll back:**
- Follow RB-006 first, then trigger Railway rollback
- Order matters: roll back migration BEFORE rolling back code

---

## RB-010 — BSN Encryption Key Rotation (Planned)

**Trigger:** Scheduled annually, or when key compromise is suspected.

**Process:**
1. Generate new AES-256-GCM key in secrets manager
2. Run key rotation script (double-encrypt → re-encrypt → verify → drop old key):
   ```bash
   railway run python manage.py rotate_bsn_key --old-key-id <id> --new-key-id <id>
   ```
3. Verify: spot-check 5 random `bsn_enc` values decrypt correctly
4. Update `AUDIT_LOG` with key rotation event
5. Remove old key from secrets manager after 30-day grace period

**Never log decrypted BSN values. Never store BSN in plaintext in any intermediate step.**

---

## On-call contacts

| Role | Responsibility | Contact |
|------|---------------|---------|
| Backend on-call | API, DB, migrations | Pagerduty rotation |
| AI on-call | RAG, Claude, pipeline | Pagerduty rotation |
| DPO | DSAR, GDPR incidents | dpo@taxwijs.nl |
| Tax SME | Rule accuracy issues | tax@taxwijs.nl |
