# SaaS Application - Azure DevOps to AWS Deployment Guide

## Overview

This guide explains the complete pipeline architecture for deploying your NestJS + Next.js SaaS application to AWS using Azure DevOps CI/CD.

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                      Git Repository                              │
│                  (main / develop branches)                        │
└─────────────────────┬───────────────────────────────────────────┘
                      │ Trigger
                      ▼
┌─────────────────────────────────────────────────────────────────┐
│              Azure DevOps Pipeline (CI/CD)                        │
│                                                                   │
│  ┌──────────────┐   ┌──────────────┐   ┌──────────────┐         │
│  │ Checkout     │──▶│ Build & Test │──▶│   Security   │         │
│  └──────────────┘   └──────────────┘   └──────────────┘         │
│                                              │                   │
│  ┌──────────────┐   ┌──────────────┐   ┌──────────────┐         │
│  │   Docker     │◀──│  SonarQube   │   │  Build Apps  │         │
│  │   Images    │   └──────────────┘   └──────────────┘         │
│  └──────────────┘                                                │
│        │                                                          │
└────────┼──────────────────────────────────────────────────────────┘
         │ Push to Registry
         ▼
┌─────────────────────────────────────────────────────────────────┐
│                   AWS Account (us-east-1)                        │
│                                                                   │
│  ┌────────────────────────────────────────────────────────┐    │
│  │              Amazon ECR (Container Registry)            │    │
│  │   ┌─────────────────┐      ┌─────────────────┐        │    │
│  │   │ Backend Image   │      │ Frontend Image  │        │    │
│  │   │  (NestJS)       │      │ (Next.js)       │        │    │
│  │   └─────────────────┘      └─────────────────┘        │    │
│  └────────┬───────────────────────────────────┬──────────┘    │
│           │                                   │                 │
│    ┌──────▼─────────────────────────────────▼────┐            │
│    │    AWS CloudFormation (Infrastructure)       │            │
│    │                                              │            │
│    │   ┌─────────────────────────────────────┐   │            │
│    │   │    VPC with Public/Private Subnets   │   │            │
│    │   └─────────────────────────────────────┘   │            │
│    │            │                                 │            │
│    │   ┌────────┴────────┐                       │            │
│    │   ▼                 ▼                       │            │
│    │ ┌────────────┐  ┌────────────┐             │            │
│    │ │ Amazon ALB │  │  RDS-PG    │             │            │
│    │ │(Routing)   │  │(Database)  │             │            │
│    │ └─────┬──────┘  └────────────┘             │            │
│    │       │                                     │            │
│    │   ┌───▼──────────────────┐                 │            │
│    │   │  Amazon ECS Fargate  │                 │            │
│    │   │                      │                 │            │
│    │   │ ┌────────┐ ┌────────┐│                 │            │
│    │   │ │Backend │ │Frontend││                 │            │
│    │   │ │Tasks   │ │Tasks   ││                 │            │
│    │   │ └────────┘ └────────┘│                 │            │
│    │   └──────────────────────┘                 │            │
│    │                                              │            │
│    │   ┌─────────────────────────────────────┐   │            │
│    │   │   CloudWatch (Logs & Monitoring)    │   │            │
│    │   └─────────────────────────────────────┘   │            │
│    └──────────────────────────────────────────────┘            │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
```

---

## Pipeline Stages Explained

### 1. **Checkout & Setup Stage**
- Checks out code from Git repository
- Installs Node.js 20.x
- Installs Docker
- Displays environment versions

### 2. **Build & Test Stage** (Parallel Jobs)
- **Backend Tests**: NestJS application
  - Installs dependencies
  - Runs ESLint
  - Runs Jest tests with coverage
  - Publishes coverage reports
  
- **Frontend Tests**: Next.js application
  - Installs dependencies
  - Runs ESLint
  - Runs Vitest tests with coverage
  - Publishes coverage reports

### 3. **Security & Code Quality Stage**
- **Security Audit**: NPM audit on both apps
- **SonarQube Analysis**: 
  - Analyzes code quality
  - Reports security vulnerabilities
  - Tracks code metrics (coverage, duplications, etc.)

### 4. **Build Docker Images Stage**
- **Backend Image**: 
  - Multi-stage build for optimization
  - Node 20 Alpine as base
  - Build NestJS application
  - Creates production-ready image
  
- **Frontend Image**:
  - Multi-stage build for optimization
  - Node 20 Alpine as base
  - Builds Next.js application
  - Creates production-ready image

### 5. **Push to Amazon ECR Stage**
- Authenticates to AWS ECR
- Pushes backend image with tags: `build-id` and `latest`
- Pushes frontend image with tags: `build-id` and `latest`
- **Only runs on main branch**

### 6. **Deploy to Dev Environment**
- **Trigger**: When develop branch is updated
- **Action**: Forces new ECS task deployment
- **Validation**: Waits for services to stabilize

### 7. **Deploy to Production**
- **Trigger**: When main branch is updated
- **Prerequisites**: All tests pass, security checks pass
- **Actions**:
  - Forces new ECS task deployment for both services
  - Waits for deployment to stabilize
  - Runs smoke tests against health endpoint
  - **Automatic rollback** if deployment fails

### 8. **Rollback Stage** (If needed)
- Triggered if deployment fails
- Can rollback to previous ECS task definition

---

## AWS Infrastructure Components

### VPC & Networking
- **VPC**: Custom VPC with 10.0.0.0/16 CIDR
- **Public Subnets**: 2 AZs for ALB (10.0.10.0/24, 10.0.11.0/24)
- **Private Subnets**: 2 AZs for ECS & RDS (10.0.1.0/24, 10.0.2.0/24)
- **NAT Gateways**: For outbound traffic from private subnets
- **Internet Gateway**: For public subnet traffic

### Container Registry
- **Amazon ECR**: 
  - Separate repositories for backend and frontend
  - Image scanning enabled
  - Lifecycle policies (keeps last 10 images)
  - Immutable tags for production safety

### Container Orchestration
- **Amazon ECS (Fargate)**:
  - Serverless container orchestration
  - No need to manage EC2 instances
  - Auto-scaling based on CPU
  - Dev: 256 CPU / 512 MB memory per task
  - Prod: 512 CPU / 1024 MB memory per task

### Database
- **Amazon RDS (PostgreSQL 15.3)**:
  - Multi-AZ deployment in production
  - Automated backups (7 days dev, 30 days prod)
  - Encryption at rest
  - IAM database authentication
  - CloudWatch Logs export

### Load Balancing
- **Application Load Balancer (ALB)**:
  - Routes traffic based on path patterns
  - `/api/*` → Backend service
  - `/*` → Frontend service
  - Health checks every 30 seconds
  - Connection draining (30 seconds)

### Monitoring & Logging
- **CloudWatch Logs**:
  - Centralized logging for all containers
  - Log retention: 7 days (dev), 30 days (prod)
  - Integration with CloudWatch dashboards

---

## Deployment Flow

### Development Deployment (develop branch)
```
1. Code push to develop branch
2. Azure DevOps triggers pipeline
3. Code checkout and setup
4. Run tests (backend & frontend)
5. Security audit & SonarQube
6. Build Docker images
7. Push to ECR
8. Update ECS service (force new deployment)
9. Tasks restart with new images
10. Health checks validate deployment
```

### Production Deployment (main branch)
```
1. Code push to main branch (typically via PR)
2. Azure DevOps triggers pipeline
3. All dev steps + additional checks
4. Push to ECR with version tags
5. Update backend ECS service
6. Update frontend ECS service
7. Wait for services to stabilize
8. Run smoke tests against ALB endpoint
9. If tests fail → Automatic rollback
10. If successful → Deployment complete
```

---

## Setup Instructions

### Prerequisites
- Azure DevOps account
- AWS account with proper permissions
- Docker installed locally
- GitHub repository with your code

### Step 1: Create Azure DevOps Project
1. Go to [Azure DevOps](https://dev.azure.com)
2. Create new project
3. Create service connection to AWS with credentials
4. Create service connection to SonarQube (if using)

### Step 2: Set Up AWS Infrastructure
```bash
# Create base infrastructure stack
aws cloudformation create-stack \
  --stack-name saas-base-dev \
  --template-body file://infrastructure/cloudformation-base-stack.yml \
  --parameters \
    ParameterKey=Environment,ParameterValue=dev \
    ParameterKey=DBMasterUsername,ParameterValue=postgres \
    ParameterKey=DBMasterPassword,ParameterValue='YourSecurePassword123!' \
  --region us-east-1 \
  --capabilities CAPABILITY_NAMED_IAM

# Wait for stack to complete
aws cloudformation wait stack-create-complete \
  --stack-name saas-base-dev \
  --region us-east-1

# Create services stack
aws cloudformation create-stack \
  --stack-name saas-services-dev \
  --template-body file://infrastructure/cloudformation-services-stack.yml \
  --parameters \
    ParameterKey=BaseStackName,ParameterValue=saas-base-dev \
    ParameterKey=Environment,ParameterValue=dev \
    ParameterKey=DesiredCount,ParameterValue=2 \
  --region us-east-1
```

### Step 3: Configure Azure DevOps Pipeline
1. Go to Pipelines → New Pipeline
2. Select GitHub as repository source
3. Select this repository
4. Choose "Existing Azure Pipelines YAML file"
5. Select `azure-pipelines.yml`
6. Set pipeline variables:
   - `AWS_ACCOUNT_ID`: Your AWS Account ID
   - `AWS_REGION`: us-east-1 (or your region)

### Step 4: Add Environment Secrets
In AWS Secrets Manager:
```bash
aws secretsmanager create-secret \
  --name saas-db-dev \
  --secret-string '{"username":"postgres","password":"YourSecurePassword123!"}' \
  --region us-east-1
```

### Step 5: Configure Health Check Endpoints
**Backend** (`backend/src/app.controller.ts`):
```typescript
@Get('health')
health() {
  return { status: 'ok' };
}
```

**Frontend** (`frontend/src/app/health/route.ts`):
```typescript
export async function GET() {
  return Response.json({ status: 'ok' });
}
```

---

## Monitoring & Troubleshooting

### View Pipeline Logs
1. Azure DevOps → Pipelines → Select pipeline run
2. Click on stage/job to see logs
3. Look for build errors or test failures

### Check ECS Deployment Status
```bash
aws ecs describe-services \
  --cluster saas-cluster-dev \
  --services saas-backend-dev saas-frontend-dev \
  --region us-east-1
```

### View Application Logs
```bash
aws logs tail /ecs/saas-dev --follow
```

### Monitor Database
```bash
aws rds describe-db-instances \
  --db-instance-identifier saas-postgres-dev \
  --region us-east-1
```

### Rollback to Previous Deployment
```bash
aws ecs update-service \
  --cluster saas-cluster-dev \
  --service saas-backend-dev \
  --task-definition saas-backend-dev:PREVIOUS_REVISION \
  --region us-east-1
```

---

## Cost Optimization

### Development Environment
- **ECS**: t3 equivalent (256 CPU, 512 MB) ≈ $0.05/hour
- **RDS**: db.t3.micro ≈ $0.017/hour
- **ALB**: ≈ $0.0225/hour + data processing
- **Total**: ~$100-150/month

### Production Environment
- **ECS**: t3 medium (512 CPU, 1024 MB) ≈ $0.08/hour
- **RDS**: db.t3.medium multi-AZ ≈ $0.10/hour
- **ALB**: ≈ $0.0225/hour + data processing
- **Total**: ~$200-300/month

### Cost Savings Tips
- Use Reserved Instances for production
- Enable Auto Scaling to handle traffic spikes
- Use CloudFront for static assets
- Clean up old ECR images automatically (lifecycle policies)
- Use S3 storage for long-term artifact retention

---

## Security Best Practices

✅ **Implemented**
- Non-root user in Docker containers
- Security group restrictions
- Secrets managed in AWS Secrets Manager
- Database encryption at rest
- Health checks and auto-recovery
- Blue/Green deployments with rollback
- Network isolation (private subnets for workloads)

⚠️ **Recommended Additional Steps**
- Enable AWS WAF on ALB
- Use AWS Certificate Manager for HTTPS/TLS
- Enable VPC Flow Logs for network monitoring
- Implement CloudTrail for API auditing
- Use AWS Systems Manager for secrets rotation
- Set up AWS Config for compliance monitoring
- Enable GuardDuty for threat detection

---

## Troubleshooting

### Deployment Fails: Image Not Found
```bash
# Check ECR repositories
aws ecr describe-repositories --region us-east-1

# Check pushed images
aws ecr list-images --repository-name saas-backend-dev --region us-east-1
```

### Tasks Failing Health Checks
```bash
# Check task logs
aws logs tail /ecs/saas-dev --follow --log-stream-names saas-backend-dev

# Verify health endpoint is working
curl http://ALB-DNS/health
```

### Database Connection Issues
```bash
# Verify security group allows connection
aws ec2 describe-security-groups --group-names saas-db-sg-dev

# Check RDS connectivity
aws rds describe-db-instances --db-instance-identifier saas-postgres-dev
```

### Pipeline Timeout
- Increase timeout in azure-pipelines.yml
- Check for resource bottlenecks in Azure DevOps
- Consider parallel jobs for faster execution

---

## Next Steps

1. ✅ Create AWS infrastructure
2. ✅ Configure Azure DevOps pipeline
3. ✅ Deploy to dev environment
4. ✅ Run smoke tests
5. ✅ Deploy to production
6. ⚠️ Monitor performance and costs
7. ⚠️ Set up alerts and dashboards
8. ⚠️ Plan for scaling and disaster recovery

---

## Support & Resources

- [Azure Pipelines Documentation](https://learn.microsoft.com/en-us/azure/devops/pipelines/)
- [AWS ECS Documentation](https://docs.aws.amazon.com/ecs/)
- [AWS CloudFormation Documentation](https://docs.aws.amazon.com/cloudformation/)
- [Docker Best Practices](https://docs.docker.com/develop/dev-best-practices/)
- [NestJS Deployment Guide](https://docs.nestjs.com/deployment)
- [Next.js Deployment Guide](https://nextjs.org/docs/deployment)
