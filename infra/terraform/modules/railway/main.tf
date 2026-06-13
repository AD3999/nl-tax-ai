variable "environment"       { type = string }
variable "railway_token"     { type = string; sensitive = true }
variable "openai_api_key"    { type = string; sensitive = true }
variable "anthropic_api_key" { type = string; sensitive = true }
variable "django_secret_key" { type = string; sensitive = true }
variable "supabase_url"      { type = string }
variable "supabase_key"      { type = string; sensitive = true }
variable "django_debug"      { type = string; default = "False" }
variable "allowed_hosts"     { type = string }

# NOTE: Railway Terraform provider is community-maintained.
# Replace resource types with current provider schema if provider version changes.

resource "railway_project" "taxwijs" {
  name = "taxwijs-${var.environment}"
}

resource "railway_service" "backend" {
  project_id = railway_project.taxwijs.id
  name       = "backend"

  # Environment variables — all sensitive values via Terraform variables
  # Never hardcode API keys in this file
}

output "backend_url" {
  value = "https://backend.${var.environment}.railway.app"
}
