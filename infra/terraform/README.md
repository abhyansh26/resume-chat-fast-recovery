# Terraform Skeleton

This folder will contain Terraform for:
- VPC + subnets
- ECS Fargate + ALB or API Gateway (REST + WebSocket)
- DynamoDB, ElastiCache (Redis), S3 (snapshots + static site)
- CloudFront (frontend), Cognito (auth), IAM (least privilege)

Getting started:
```bash
cd infra/terraform
# create files: providers.tf, main.tf, variables.tf, outputs.tf
terraform init
terraform plan
```
