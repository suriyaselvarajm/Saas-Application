# 🚀 SaaS Deployment - Quick Reference Card

## Phase 1: Local Test (5 minutes)
```bash
docker-compose up -d
curl http://localhost  # Frontend
curl http://localhost/api/health  # Backend
docker-compose down
```

## Phase 2: Deploy AWS (10-15 minutes)
```bash
chmod +x scripts/*.sh
./scripts/deploy-aws-infrastructure.sh dev us-east-1
# 📝 Note: ALB DNS, ECR URLs, DB endpoint from output
```

## Phase 3: Configure Azure DevOps (10 minutes)
1. Create project at dev.azure.com
2. Add AWS service connection
3. New pipeline from `azure-pipelines.yml`
4. Set variables:
   - `AWS_ACCOUNT_ID`: Your account ID
   - `AWS_REGION`: us-east-1

## Phase 4: Deploy (Push Code)
```bash
git push origin develop  # Deploy to dev
git push origin main     # Deploy to production
```

---

## 📊 Key Commands

### Check Deployment Status
```bash
./scripts/monitor-ecs-deployment.sh dev
aws ecs describe-services --cluster saas-cluster-dev --services saas-backend-dev
```

### View Logs
```bash
aws logs tail /ecs/saas-dev --follow
```

### Check Infrastructure
```bash
aws cloudformation list-stacks
aws rds describe-db-instances
aws ecr describe-repositories
```

### Rollback Deployment
```bash
aws ecs update-service --cluster saas-cluster-dev \
  --service saas-backend-dev --task-definition saas-backend-dev:PREVIOUS
```

---

## 🔗 Architecture Map

```
Git Push (develop)
    ↓
Azure DevOps Pipeline
    ├─ Test (npm test)
    ├─ Build Docker Images
    └─ Push to ECR
        ↓
ECS Service Updates
    ├─ Backend container restart
    └─ Frontend container restart
        ↓
ALB Routes Traffic
    ├─ /api/* → Backend
    └─ /* → Frontend
        ↓
CloudWatch Logs
Database (RDS)
```

---

## 📋 Files Reference

| File | Purpose |
|------|---------|
| `azure-pipelines.yml` | CI/CD pipeline |
| `backend/Dockerfile` | Backend image |
| `frontend/Dockerfile` | Frontend image |
| `cloudformation-*.yml` | AWS infrastructure |
| `docker-compose.yml` | Local dev environment |
| `scripts/*.sh` | Automation scripts |

---

## ✅ Success Checklist

- [ ] Local test passes
- [ ] AWS infrastructure deployed
- [ ] Azure DevOps pipeline configured
- [ ] Code pushed and deployment triggered
- [ ] Application accessible at ALB DNS
- [ ] Health checks passing
- [ ] Auto-scaling working

---

## 🚨 Common Issues

| Issue | Solution |
|-------|----------|
| Pipeline fails | Check Azure DevOps logs |
| ECS task crashes | `aws logs tail /ecs/saas-dev` |
| Database won't connect | Check security group rules |
| Health check fails | Verify endpoint returns 200 |
| Can't push to ECR | Run `aws ecr get-login-password...` |

---

## 📞 Quick Links

- **AWS Account**: https://console.aws.amazon.com
- **Azure DevOps**: https://dev.azure.com
- **ECS Console**: https://console.aws.amazon.com/ecs
- **CloudWatch Logs**: https://console.aws.amazon.com/cloudwatch/logs
- **RDS Console**: https://console.aws.amazon.com/rds

---

## 💡 Environment Variables

### Pipeline
```
AWS_ACCOUNT_ID = <your-id>
AWS_REGION = us-east-1
DOCKER_BUILDKIT = 1
```

### Backend (ECS Task)
```
NODE_ENV = production
DATABASE_URL = postgresql://...
```

### Frontend (ECS Task)
```
NODE_ENV = production
NEXT_PUBLIC_API_URL = http://alb-dns/api
```

---

## 🎯 Development Workflow

```
1. Create feature branch
2. Make changes & test locally: docker-compose up
3. Commit & push to develop
4. Pipeline auto-deploys to dev ECS
5. Test on dev: http://<alb-dns>
6. Create PR to main
7. Merge to main
8. Pipeline auto-deploys to prod ECS
```

---

## ⏱️ Estimated Timelines

| Task | Time |
|------|------|
| Local setup | 5 min |
| AWS deployment | 15 min |
| Azure DevOps config | 10 min |
| First deployment | 5 min |
| **Total** | **~35 min** |

---

## 💰 Cost Estimate

**Development**: $100-150/month  
**Production**: $200-300/month  

(Use Reserved Instances to save 30-40%)

---

## 📚 Full Documentation

- [AWS_DEPLOYMENT_README.md](./AWS_DEPLOYMENT_README.md) - Start here
- [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md) - Detailed guide
- [DEPLOYMENT_CHECKLIST.md](./DEPLOYMENT_CHECKLIST.md) - Step-by-step
- [DEPLOYMENT_FILES_SUMMARY.md](./DEPLOYMENT_FILES_SUMMARY.md) - File details

---

**Print this card and keep it handy!** 📌

Version: 1.0 | Date: June 2026
