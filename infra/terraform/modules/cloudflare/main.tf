variable "zone_id"     { type = string }
variable "backend_url" { type = string }

# Cloudflare Pages for React frontend
# DNS records pointing to Railway backend
# WAF rules: rate limiting (300 req/min auth, 20/min AI), bot protection

resource "cloudflare_pages_project" "frontend" {
  account_id        = var.zone_id
  name              = "taxwijs-frontend"
  production_branch = "master"
}
