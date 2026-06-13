terraform {
  required_version = ">= 1.6"

  required_providers {
    railway = {
      source  = "terraform-community-modules/railway"
      version = "~> 0.3"
    }
    cloudflare = {
      source  = "cloudflare/cloudflare"
      version = "~> 4.0"
    }
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }

  backend "s3" {
    bucket         = "taxwijs-terraform-state-production"
    key            = "production/terraform.tfstate"
    region         = "eu-west-1"
    dynamodb_table = "taxwijs-terraform-locks"
    encrypt        = true
  }
}

# Production variables — values injected via CI/CD secrets, never hardcoded
variable "railway_token"     { type = string; sensitive = true }
variable "openai_api_key"    { type = string; sensitive = true }
variable "anthropic_api_key" { type = string; sensitive = true }
variable "django_secret_key" { type = string; sensitive = true }
variable "supabase_url"      { type = string }
variable "supabase_key"      { type = string; sensitive = true }
variable "cloudflare_zone_id" { type = string }

module "railway" {
  source = "../../modules/railway"

  environment       = "production"
  railway_token     = var.railway_token
  openai_api_key    = var.openai_api_key
  anthropic_api_key = var.anthropic_api_key
  django_secret_key = var.django_secret_key
  supabase_url      = var.supabase_url
  supabase_key      = var.supabase_key
  django_debug      = "False"
  allowed_hosts     = "app.taxwijs.nl"
}

module "cloudflare" {
  source   = "../../modules/cloudflare"
  zone_id  = var.cloudflare_zone_id
  backend_url = module.railway.backend_url
}

module "s3" {
  source      = "../../modules/s3"
  environment = "production"
  region      = "eu-west-1"
}

output "backend_url"  { value = module.railway.backend_url }
output "frontend_url" { value = "https://app.taxwijs.nl" }
