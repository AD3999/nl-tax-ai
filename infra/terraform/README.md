# TaxWijs — Terraform Infrastructure

> Manages cloud infrastructure for TaxWijs via Terraform.
> Environments: staging, production.

## Structure

```
infra/terraform/
├── README.md          ← this file
├── environments/
│   ├── staging/       ← staging workspace
│   │   └── main.tf
│   └── production/    ← production workspace
│       └── main.tf
└── modules/
    ├── railway/       ← Railway project + services
    ├── supabase/      ← Supabase project + pgvector
    ├── cloudflare/    ← Pages + DNS + WAF rules
    └── s3/            ← Document storage bucket + IAM
```

## Prerequisites

- Terraform >= 1.6
- Railway API token in `RAILWAY_TOKEN`
- Supabase access token in `SUPABASE_ACCESS_TOKEN`
- Cloudflare API token in `CLOUDFLARE_API_TOKEN`
- AWS credentials for S3

## Quick start

```bash
cd infra/terraform/environments/staging
terraform init
terraform plan -out=staging.plan
terraform apply staging.plan
```

## State backend

Remote state is stored in an S3 bucket with DynamoDB locking.
State bucket: `taxwijs-terraform-state-<env>`
Lock table: `taxwijs-terraform-locks`

## Secrets

Never commit secrets to this directory. All sensitive values are injected via environment variables or a secrets manager (Railway Secrets / AWS Secrets Manager).

## Modules

### railway/
Creates and configures the Railway project, backend service (Gunicorn/Django), and AI worker service. Sets environment variables from Terraform variables.

### supabase/
Provisions the Supabase project and applies the pgvector extension. The `rag_chunks` table with `vector(1536)` column is managed here.

### cloudflare/
Manages the Cloudflare Pages project for the React frontend, DNS records, and WAF rules (rate limiting, bot protection).

### s3/
Creates the document storage S3 bucket with server-side encryption (AES-256), versioning enabled, and lifecycle rules for GDPR retention compliance.
