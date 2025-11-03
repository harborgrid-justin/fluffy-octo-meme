# DEVOPS-005: Terraform Infrastructure as Code for PPBE System
# Main Terraform configuration for AWS GovCloud

terraform {
  required_version = ">= 1.5.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
    random = {
      source  = "hashicorp/random"
      version = "~> 3.5"
    }
  }

  # Backend configuration for state management
  backend "s3" {
    bucket         = "ppbe-terraform-state"
    key            = "ppbe/terraform.tfstate"
    region         = "us-gov-west-1"
    encrypt        = true
    dynamodb_table = "ppbe-terraform-locks"
    kms_key_id     = "alias/terraform-state"
  }
}

# AWS Provider Configuration for GovCloud
provider "aws" {
  region = var.aws_region

  default_tags {
    tags = {
      Project     = "PPBE-System"
      Environment = var.environment
      ManagedBy   = "Terraform"
      Compliance  = "FedRAMP-Moderate"
      CostCenter  = var.cost_center
      DataClass   = "Confidential"
    }
  }
}

# Local variables
locals {
  name_prefix = "${var.project_name}-${var.environment}"
  common_tags = {
    Project     = var.project_name
    Environment = var.environment
    ManagedBy   = "Terraform"
  }
}

# VPC Module
module "vpc" {
  source = "./modules/vpc"

  name_prefix         = local.name_prefix
  vpc_cidr            = var.vpc_cidr
  availability_zones  = var.availability_zones
  public_subnet_cidrs = var.public_subnet_cidrs
  private_subnet_cidrs = var.private_subnet_cidrs
  enable_nat_gateway  = true
  enable_vpn_gateway  = false
  enable_flow_logs    = true

  tags = local.common_tags
}

# Security Groups Module
module "security" {
  source = "./modules/security"

  name_prefix = local.name_prefix
  vpc_id      = module.vpc.vpc_id

  tags = local.common_tags
}

# Application Load Balancer Module
module "alb" {
  source = "./modules/alb"

  name_prefix       = local.name_prefix
  vpc_id            = module.vpc.vpc_id
  public_subnets    = module.vpc.public_subnet_ids
  security_group_id = module.security.alb_security_group_id
  certificate_arn   = var.ssl_certificate_arn

  tags = local.common_tags
}

# RDS PostgreSQL Module
module "rds" {
  source = "./modules/rds"

  name_prefix           = local.name_prefix
  vpc_id                = module.vpc.vpc_id
  private_subnets       = module.vpc.private_subnet_ids
  security_group_id     = module.security.rds_security_group_id
  database_name         = var.database_name
  master_username       = var.database_username
  master_password       = var.database_password
  instance_class        = var.rds_instance_class
  allocated_storage     = var.rds_allocated_storage
  backup_retention_days = 30
  multi_az              = var.environment == "prod" ? true : false

  tags = local.common_tags
}

# ElastiCache Redis Module
module "elasticache" {
  source = "./modules/elasticache"

  name_prefix       = local.name_prefix
  vpc_id            = module.vpc.vpc_id
  private_subnets   = module.vpc.private_subnet_ids
  security_group_id = module.security.redis_security_group_id
  node_type         = var.redis_node_type
  num_cache_nodes   = var.redis_num_nodes

  tags = local.common_tags
}

# ECS Cluster and Services Module
module "ecs" {
  source = "./modules/ecs"

  name_prefix            = local.name_prefix
  vpc_id                 = module.vpc.vpc_id
  private_subnets        = module.vpc.private_subnet_ids
  alb_target_group_arn   = module.alb.target_group_arn
  security_group_id      = module.security.ecs_security_group_id

  # Backend configuration
  backend_image          = var.backend_image
  backend_cpu            = var.backend_cpu
  backend_memory         = var.backend_memory
  backend_desired_count  = var.backend_desired_count

  # Frontend configuration
  frontend_image         = var.frontend_image
  frontend_cpu           = var.frontend_cpu
  frontend_memory        = var.frontend_memory
  frontend_desired_count = var.frontend_desired_count

  # Database configuration
  database_url           = module.rds.connection_string
  redis_url              = module.elasticache.redis_endpoint
  jwt_secret             = var.jwt_secret

  tags = local.common_tags
}

# CloudWatch Log Groups
resource "aws_cloudwatch_log_group" "application" {
  name              = "/aws/ecs/${local.name_prefix}"
  retention_in_days = var.log_retention_days
  kms_key_id        = aws_kms_key.cloudwatch.arn
}

# KMS Key for encryption
resource "aws_kms_key" "cloudwatch" {
  description             = "KMS key for CloudWatch Logs encryption"
  deletion_window_in_days = 10
  enable_key_rotation     = true

  tags = merge(
    local.common_tags,
    {
      Name = "${local.name_prefix}-cloudwatch-kms"
    }
  )
}

resource "aws_kms_alias" "cloudwatch" {
  name          = "alias/${local.name_prefix}-cloudwatch"
  target_key_id = aws_kms_key.cloudwatch.key_id
}

# S3 Bucket for application assets
resource "aws_s3_bucket" "assets" {
  bucket = "${local.name_prefix}-assets"

  tags = local.common_tags
}

resource "aws_s3_bucket_versioning" "assets" {
  bucket = aws_s3_bucket.assets.id

  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "assets" {
  bucket = aws_s3_bucket.assets.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

resource "aws_s3_bucket_public_access_block" "assets" {
  bucket = aws_s3_bucket.assets.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}
