# SaaS Application - AWS & Azure DevOps Deployment

## 📋 Overview

Complete CI/CD pipeline using **Azure DevOps** to deploy a multi-tenant SaaS application to **AWS**:

- **Frontend**: Next.js (React 19) with Tailwind CSS
- **Backend**: NestJS with PostgreSQL & Prisma ORM
- **Deployment**: Amazon ECS Fargate with Auto-Scaling
- **CI/CD**: Azure DevOps Pipeline
- **Database**: Amazon RDS PostgreSQL
- **Container Registry**: Amazon ECR

---

## 🏗️ Architecture

```
Git Repository (Azure DevOps)
    ↓ Trigger on Push
Azure DevOps Pipeline
    ├─ Build & Test (parallel)
    ├─ Security Audit & SonarQube
    ├─ Build Docker Images
    ├─ Push to Amazon ECR
    └─ Deploy to AWS ECS
```

**AWS Infrastructure**:
- VPC with Public/Private Subnets across 2 AZs
- Application Load Balancer for routing
- ECS Fargate for containerized workloads
- RDS PostgreSQL for data persistence
- CloudWatch for logging and monitoring

---

## 🚀 Quick Start

### Prerequisites
- AWS Account
- Azure DevOps Account
- Docker installed
- AWS CLI configured
- Node.js 20+

### Step 1: Deploy AWS Infrastructure

```bash
# Make scripts executable
chmod +x scripts/*.sh

# Deploy infrastructure (prompts for RDS password)
./scripts/deploy-aws-infrastructure.sh dev us-east-1

# Or for production
./scripts/deploy-aws-infrastructure.sh prod us-east-1
```

This creates:
- VPC with networking
- RDS PostgreSQL database
- ECR repositories
- ECS cluster
- ALB and target groups

### Step 2: Configure Azure DevOps

1. Create new project in [dev.azure.com](https://dev.azure.com)
2. Add service connection to AWS with credentials
3. Create new pipeline from `azure-pipelines.yml`
4. Set pipeline variables:
   ```
   AWS_ACCOUNT_ID: <your-account-id>
   AWS_REGION: us-east-1
   ```

### Step 3: Deploy Application

```bash
# Push code to main or develop branch
git push origin develop

# Azure DevOps pipeline automatically:
# ✓ Checks out code
# ✓ Runs tests
# ✓ Builds Docker images
# ✓ Pushes to ECR
# ✓ Deploys to ECS
```

### Step 4: Monitor Deployment

```bash
# Watch ECS deployment status
./scripts/monitor-ecs-deployment.sh dev us-east-1

# View application logs
aws logs tail /ecs/saas-dev --follow
```

---

## 📁 Project Structure

```
.
├── backend/                          # NestJS application
│   ├── Dockerfile                   # Production image
│   ├── src/
│   │   ├── main.ts
│   │   ├── auth/                    # Authentication
│   │   ├── rbac/                    # Role-based access
│   │   ├── tenant/                  # Multi-tenancy
│   │   └── ...
│   └── package.json
│
├── frontend/                         # Next.js application
│   ├── Dockerfile                   # Production image
│   ├── src/
│   │   ├── app/
│   │   ├── components/
│   │   └── ...
│   └── package.json
│
├── infrastructure/
│   ├── cloudformation-base-stack.yml      # VPC, RDS, ECR, ECS
│   └── cloudformation-services-stack.yml  # ALB, Services
│
├── scripts/
│   ├── deploy-aws-infrastructure.sh       # Setup AWS
│   ├── build-docker-images.sh             # Build locally
│   └── monitor-ecs-deployment.sh          # Monitor deployment
│
├── azure-pipelines.yml                     # CI/CD pipeline
├── DEPLOYMENT_GUIDE.md                    # Detailed guide
└── README.md                              # This file
```

---

## 🔄 Pipeline Stages

### 1️⃣ Checkout & Setup
- Checkout code from Git
- Install Node.js 20
- Display environment info

### 2️⃣ Build & Test (Parallel)
- **Backend**: NestJS tests, linting, coverage
- **Frontend**: Next.js tests, linting, coverage

### 3️⃣ Security & Quality
- NPM audit (backend & frontend)
- SonarQube analysis
- Code quality metrics

### 4️⃣ Build Docker Images
- Backend image (NestJS)
- Frontend image (Next.js)
- Multi-stage builds for optimization

### 5️⃣ Push to ECR (main branch only)
- Authenticate to Amazon ECR
- Push images with version tags
- Organize by environment

### 6️⃣ Deploy to Dev (develop branch)
- Update ECS service
- Force new deployment
- Health checks validation

### 7️⃣ Deploy to Prod (main branch only)
- Update ECS service
- Wait for stabilization
- Run smoke tests
- **Auto-rollback on failure**

---

## 🛠️ Configuration

### Environment Variables

#### Backend (NestJS)
```bash
NODE_ENV=production
DATABASE_URL=postgresql://user:pass@host:5432/saas_dev
JWT_SECRET=your-secret-key
```

#### Frontend (Next.js)
```bash
NODE_ENV=production
NEXT_PUBLIC_API_URL=https://api.yourdomain.com
```

#### AWS
```bash
AWS_REGION=us-east-1
AWS_ACCOUNT_ID=123456789012
```

---

## 📊 Monitoring & Logs

### CloudWatch Logs
```bash
# View all logs
aws logs tail /ecs/saas-dev --follow

# View backend logs only
aws logs tail /ecs/saas-dev --log-stream-names saas-backend-dev

# View frontend logs only
aws logs tail /ecs/saas-dev --log-stream-names saas-frontend-dev
```

### ECS Status
```bash
# Describe services
aws ecs describe-services \
  --cluster saas-cluster-dev \
  --services saas-backend-dev saas-frontend-dev

# List running tasks
aws ecs list-tasks --cluster saas-cluster-dev

# View task details
aws ecs describe-tasks --cluster saas-cluster-dev --tasks <task-arn>
```

### Application Health
```bash
# Get ALB DNS
aws cloudformation describe-stacks \
  --stack-name saas-services-dev \
  --query 'Stacks[0].Outputs[?OutputKey==`LoadBalancerDNS`].OutputValue'

# Check backend health
curl http://<alb-dns>/api/health

# Check frontend
curl http://<alb-dns>/
```

---

## 🔐 Security

### Implemented
✅ Non-root Docker containers  
✅ VPC with private subnets  
✅ Security groups restricting access  
✅ Secrets in AWS Secrets Manager  
✅ Database encryption at rest  
✅ Health checks & auto-recovery  
✅ Blue/Green deployments  
✅ Automatic rollback on failure  

### Recommended
⚠️ Enable AWS WAF on ALB  
⚠️ Use AWS Certificate Manager (HTTPS)  
⚠️ Enable VPC Flow Logs  
⚠️ Enable CloudTrail  
⚠️ Use AWS Systems Manager for secrets rotation  
⚠️ Enable GuardDuty for threat detection  

---

## 💰 Cost Estimation

### Development
- **ECS**: ~$50/month (t3 equivalent)
- **RDS**: ~$25/month (db.t3.micro)
- **ALB**: ~$15/month
- **Total**: ~$100-150/month

### Production
- **ECS**: ~$100/month (t3 medium)
- **RDS**: ~$150/month (db.t3.medium, multi-AZ)
- **ALB**: ~$15/month
- **Total**: ~$200-300/month

---

## 🐛 Troubleshooting

### Deployment Fails

**Check pipeline logs:**
```bash
# In Azure DevOps Pipelines → View logs
```

**Verify ECR images:**
```bash
aws ecr list-images --repository-name saas-backend-dev
```

**Check ECS tasks:**
```bash
aws ecs describe-tasks --cluster saas-cluster-dev --tasks <task-arn>
```

### Tasks Failing Health Check

**View application logs:**
```bash
aws logs tail /ecs/saas-dev --follow
```

**Verify health endpoint:**
```bash
# Backend
curl -v http://<alb-dns>/api/health

# Frontend
curl -v http://<alb-dns>/
```

### Database Connection Issues

**Check RDS security group:**
```bash
aws ec2 describe-security-groups \
  --group-names saas-db-sg-dev
```

**Test database connection:**
```bash
psql -h <db-endpoint> -U postgres -d saas_dev
```

### Image Build Fails

**Local build test:**
```bash
./scripts/build-docker-images.sh dev
```

**Check Docker file syntax:**
```bash
docker build -f backend/Dockerfile --dry-run backend/
```

---

## 🔄 Rollback

### Automatic Rollback
Triggered automatically if:
- Health checks fail
- ECS tasks crash
- Deployment takes too long

### Manual Rollback
```bash
# Get previous task definition
aws ecs describe-services \
  --cluster saas-cluster-dev \
  --services saas-backend-dev

# Rollback to previous revision
aws ecs update-service \
  --cluster saas-cluster-dev \
  --service saas-backend-dev \
  --task-definition saas-backend-dev:PREVIOUS_REVISION
```

---

## 📚 Additional Resources

- [Detailed Deployment Guide](./DEPLOYMENT_GUIDE.md)
- [Azure Pipelines Docs](https://learn.microsoft.com/azure/devops/pipelines/)
- [AWS ECS Documentation](https://docs.aws.amazon.com/ecs/)
- [NestJS Deployment](https://docs.nestjs.com/deployment)
- [Next.js Deployment](https://nextjs.org/docs/deployment)

---

## 📞 Support

For issues or questions:
1. Check [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md) troubleshooting section
2. Review Azure DevOps pipeline logs
3. Check CloudWatch logs
4. Verify AWS CloudFormation stack status

---

## 📝 License

UNLICENSED

---

## ✨ Summary

You now have:

✅ **Dockerfiles** for containerization  
✅ **Azure DevOps Pipeline** for automated CI/CD  
✅ **CloudFormation Templates** for AWS infrastructure  
✅ **Deployment Scripts** for automation  
✅ **Monitoring & Logs** setup  
✅ **Security Best Practices** implemented  
✅ **Auto-Scaling & Rollback** capabilities  

**Next Steps:**
1. Run `./scripts/deploy-aws-infrastructure.sh dev us-east-1`
2. Configure Azure DevOps pipeline with AWS credentials
3. Push code to trigger deployment
4. Monitor via CloudWatch and ECS console
