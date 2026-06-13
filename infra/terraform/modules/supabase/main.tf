variable "environment"       { type = string }
variable "supabase_org_id"  { type = string }
variable "db_password"       { type = string; sensitive = true }
variable "region"            { type = string; default = "eu-west-1" }

# Supabase project for production vector store (pgvector)
# The rag_chunks table with vector(1536) lives here
# Schema applied via schema/postgres/schema.sql in CI/CD

output "supabase_url" {
  value = "https://${var.environment}-taxwijs.supabase.co"
}
