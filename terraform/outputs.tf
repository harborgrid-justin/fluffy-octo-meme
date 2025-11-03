# DEVOPS-005: Terraform Outputs
output "vpc_id" {
  description = "VPC ID"
  value       = module.vpc.vpc_id
}

output "vpc_cidr" {
  description = "VPC CIDR block"
  value       = module.vpc.vpc_cidr
}

output "public_subnet_ids" {
  description = "Public subnet IDs"
  value       = module.vpc.public_subnet_ids
}

output "private_subnet_ids" {
  description = "Private subnet IDs"
  value       = module.vpc.private_subnet_ids
}

output "alb_dns_name" {
  description = "Application Load Balancer DNS name"
  value       = module.alb.alb_dns_name
}

output "alb_zone_id" {
  description = "Application Load Balancer zone ID"
  value       = module.alb.alb_zone_id
}

output "rds_endpoint" {
  description = "RDS endpoint"
  value       = module.rds.endpoint
  sensitive   = true
}

output "rds_connection_string" {
  description = "RDS connection string"
  value       = module.rds.connection_string
  sensitive   = true
}

output "redis_endpoint" {
  description = "Redis endpoint"
  value       = module.elasticache.redis_endpoint
  sensitive   = true
}

output "ecs_cluster_name" {
  description = "ECS cluster name"
  value       = module.ecs.cluster_name
}

output "ecs_cluster_arn" {
  description = "ECS cluster ARN"
  value       = module.ecs.cluster_arn
}

output "backend_service_name" {
  description = "Backend ECS service name"
  value       = module.ecs.backend_service_name
}

output "frontend_service_name" {
  description = "Frontend ECS service name"
  value       = module.ecs.frontend_service_name
}

output "cloudwatch_log_group" {
  description = "CloudWatch log group name"
  value       = aws_cloudwatch_log_group.application.name
}

output "s3_assets_bucket" {
  description = "S3 assets bucket name"
  value       = aws_s3_bucket.assets.id
}

output "kms_key_id" {
  description = "KMS key ID for CloudWatch"
  value       = aws_kms_key.cloudwatch.id
}
