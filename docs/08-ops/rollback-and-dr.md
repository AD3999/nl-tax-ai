# Rollback and Disaster Recovery — TaxWijs

> How to roll back a bad deployment, restore from database backup, and recover from major incidents.

---

## 1. Rollback Triggers

Roll back immediately if any of these occur within 30 minutes of a deployment:
- Sentry error rate > 5× baseline
- P0 incident declared (calculator wrong, data loss, authentication broken)
- Health check endpoint returning non-200
- Any user-visible data corruption

---

## 2. Application Rollback (Railway)

Railway keeps the last 10 deployments. Rollback:

```bash
# Option 1: Railway CLI
railway deployments list
railway rollback {deployment-id}

# Option 2: Railway Dashboard
# Deployments → select previous → Rollback
```

Rollback completes in < 2 minutes. Zero downtime rolling restart.

**After rollback:**
1. Verify health check: `curl https://api.taxwijs.nl/api/health/`
2. Check Sentry — error rate should return to baseline
3. Create incident record
4. Root cause the bad deployment before re-deploying

---

## 3. Database Migration Rollback

Every migration must have a `reverse_sql` (Django: `operations=[RunSQL(..., reverse_sql=...)]`). Before deploying a migration:

1. Test the rollback: `python manage.py migrate {app} {prev_migration}`
2. Verify data integrity after rollback

**Emergency rollback of a migration:**
```bash
python manage.py migrate portal 0023_previous  # roll back to prior migration
```

**If migration is irreversible** (column drop, table drop):
- Restore from backup (see Section 5)
- Never drop a column in the same migration that removes code references to it — always do it in two deployments

---

## 4. Frontend Rollback (Cloudflare Pages)

Cloudflare Pages keeps deployment history:
```
Cloudflare Dashboard → Pages → taxwijs → Deployments → previous build → Rollback
```

Rollback is instant (CDN redirect change only).

---

## 5. Database Backup and Restore

### 5.1 Backup Schedule (Supabase)

| Backup Type | Frequency | Retention |
|-------------|-----------|-----------|
| Continuous WAL | Real-time | 7 days (Supabase Pro) |
| Daily snapshot | Daily at 02:00 CET | 30 days |
| Weekly snapshot | Every Sunday | 12 weeks |
| Monthly snapshot | 1st of month | 12 months |

### 5.2 Restore Procedure

```bash
# 1. Create restore target DB
supabase db restore --backup-id {backup-id} --to-project {project-ref}

# 2. Verify restore
psql $DATABASE_URL -c "SELECT count(*) FROM engagements;"
psql $DATABASE_URL -c "SELECT count(*) FROM documents;"

# 3. Swap DATABASE_URL in Railway
railway variables set DATABASE_URL=postgresql://...new...

# 4. Restart Django
railway redeploy
```

Estimated RTO (recovery time objective): < 2 hours
Estimated RPO (recovery point objective): < 1 hour (continuous WAL)

---

## 6. RAG Index Recovery

If ChromaDB index is corrupted or missing:
```bash
python phase2/build_index.py  # rebuilds from phase1/ data, ~2 minutes
```

The source data is in Git (`phase1/data/seed/`) — the index is always rebuildable.

---

## 7. Secret Exposure — Emergency Procedure

See `secrets-and-config.md` Section 5. Summary:
1. Revoke immediately at provider
2. Generate new secret
3. Deploy to all environments
4. Check audit logs for unauthorized use

---

## 8. Disaster Scenarios and Responses

| Scenario | Detection | Response | RTO |
|----------|-----------|----------|-----|
| Bad deployment → errors spike | Sentry alert | Rollback via Railway | 5 min |
| Database corruption | Health check fail | Restore from Supabase backup | 2 hours |
| ANTHROPIC_API_KEY exposed | Security audit | Revoke + rotate (mock mode auto-activates) | 15 min |
| Incorrect tax rate deployed | Tax SME report | Rollback + hotfix + re-deploy | 1 hour |
| S3 bucket deleted | 500 errors on document endpoints | Restore from AWS backup | 4 hours |
| Redis failure | Celery queue stops | Tasks queue locally; Celery reconnects when Redis restores | Auto |
| Full platform outage | On-call alert | Identify root cause, escalate to Railway/Supabase support if infra | 4 hours |

---

## 9. Communication During Incidents

| Severity | Communication | Channel |
|----------|--------------|---------|
| P0 | Notify all firm managers immediately | Email + status page |
| P1 | Notify affected firms | Email |
| P2 | Update status page | Status page only |
| P3 | Track internally | Incident log |

Status page: `status.taxwijs.nl` (Statuspage.io or Cloudflare)
