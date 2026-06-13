variable "environment" { type = string }
variable "region"      { type = string; default = "eu-west-1" }

resource "aws_s3_bucket" "documents" {
  bucket = "taxwijs-documents-${var.environment}"
}

resource "aws_s3_bucket_server_side_encryption_configuration" "documents" {
  bucket = aws_s3_bucket.documents.id
  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

resource "aws_s3_bucket_versioning" "documents" {
  bucket = aws_s3_bucket.documents.id
  versioning_configuration { status = "Enabled" }
}

# Lifecycle rule: delete objects marked for deletion after retention period
resource "aws_s3_bucket_lifecycle_configuration" "documents" {
  bucket = aws_s3_bucket.documents.id
  rule {
    id     = "gdpr-retention"
    status = "Enabled"
    expiration { days = 2557 } # 7 years per Dutch tax law
    noncurrent_version_expiration { noncurrent_days = 90 }
  }
}

resource "aws_s3_bucket_public_access_block" "documents" {
  bucket                  = aws_s3_bucket.documents.id
  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

output "bucket_name" { value = aws_s3_bucket.documents.bucket }
output "bucket_arn"  { value = aws_s3_bucket.documents.arn }
