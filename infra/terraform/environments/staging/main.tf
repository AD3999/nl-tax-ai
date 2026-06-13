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
    bucket         = "taxwijs-terraform-state-staging"
    key            = "staging/terraform.tfstate"
    region         = "eu-west-1"
    dynamodb_table = "taxwijs-terraform-locks"
    encrypt        = true
  }
}

variable "railway_token" {
  description = "Railway API token"
  type        = string
  sensitive   = true
}

variable "openai_api_key" {
  description = "OpenAI API key for embeddings"
  type        = string
  sensitive   = true
}

variable "anthropic_api_key" {
  description = "Anthropic API key for Claude"
  type        = string
  sensitive   = true
}

variable "django_secret_key" {
  type      = string
  sensitive = true
}

variable "supabase_url" {
  type      = string
  sensitive = false
}

variable "supabase_key" {
  type      = string
  sensitive = true
}

module "railway" {
  source = "../../modules/railway"

  environment       = "staging"
  railway_token     = var.railway_token
  openai_api_key    = var.openai_api_key
  anthropic_api_key = var.anthropic_api_key
  django_secret_key = var.django_secret_key
  supabase_url      = var.supabase_url
  supabase_key      = var.supabase_key
  django_debug      = "False"
  allowed_hosts     = "staging.taxwijs.nl"
}

module "s3" {
  source      = "../../modules/s3"
  environment = "staging"
  region      = "eu-west-1"
}

output "backend_url" {
  value = module.railway.backend_url
}
