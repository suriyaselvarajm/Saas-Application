#!/bin/bash
# SaaS Application - AWS Deployment Setup Script
# This script automates the initial AWS infrastructure setup

set -e

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
ENVIRONMENT=${1:-dev}
AWS_REGION=${2:-us-east-1}
AWS_ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
STACK_PREFIX="saas"
DB_USERNAME="postgres"

echo -e "${GREEN}=== SaaS Application AWS Deployment Setup ===${NC}"
echo "Environment: $ENVIRONMENT"
echo "Region: $AWS_REGION"
echo "AWS Account: $AWS_ACCOUNT_ID"

# Function to prompt user
prompt_password() {
  local prompt="$1"
  local password
  read -s -p "$prompt" password
  echo "$password"
}

# Step 1: Validate AWS credentials
echo -e "\n${YELLOW}[1/7] Validating AWS credentials...${NC}"
if ! aws sts get-caller-identity > /dev/null; then
  echo -e "${RED}Error: AWS credentials not configured properly${NC}"
  exit 1
fi
echo -e "${GREEN}✓ AWS credentials valid${NC}"

# Step 2: Create database password
echo -e "\n${YELLOW}[2/7] Creating database password...${NC}"
DB_PASSWORD=$(prompt_password "Enter RDS password (min 8 chars): ")
if [ ${#DB_PASSWORD} -lt 8 ]; then
  echo -e "${RED}Error: Password must be at least 8 characters${NC}"
  exit 1
fi
echo -e "${GREEN}✓ Password set${NC}"

# Step 3: Create S3 bucket for CloudFormation artifacts
echo -e "\n${YELLOW}[3/7] Creating S3 bucket for artifacts...${NC}"
ARTIFACTS_BUCKET="${STACK_PREFIX}-cf-artifacts-${ENVIRONMENT}-${AWS_ACCOUNT_ID}"
if aws s3 ls "s3://$ARTIFACTS_BUCKET" 2>/dev/null; then
  echo "Bucket already exists"
else
  aws s3api create-bucket \
    --bucket "$ARTIFACTS_BUCKET" \
    --region "$AWS_REGION" \
    $(if [ "$AWS_REGION" != "us-east-1" ]; then echo "--create-bucket-configuration LocationConstraint=$AWS_REGION"; fi)
  
  # Enable versioning
  aws s3api put-bucket-versioning \
    --bucket "$ARTIFACTS_BUCKET" \
    --versioning-configuration Status=Enabled
fi
echo -e "${GREEN}✓ S3 bucket ready: $ARTIFACTS_BUCKET${NC}"

# Step 4: Create database secret in AWS Secrets Manager
echo -e "\n${YELLOW}[4/7] Creating database secret in Secrets Manager...${NC}"
SECRET_NAME="${STACK_PREFIX}-db-${ENVIRONMENT}"
SECRET_VALUE="{\"username\":\"${DB_USERNAME}\",\"password\":\"${DB_PASSWORD}\"}"

if aws secretsmanager get-secret-value --secret-id "$SECRET_NAME" --region "$AWS_REGION" 2>/dev/null; then
  echo "Secret already exists, skipping..."
else
  aws secretsmanager create-secret \
    --name "$SECRET_NAME" \
    --secret-string "$SECRET_VALUE" \
    --region "$AWS_REGION" \
    --description "RDS database credentials for SaaS $ENVIRONMENT"
  echo -e "${GREEN}✓ Secret created: $SECRET_NAME${NC}"
fi

# Step 5: Deploy base infrastructure stack
echo -e "\n${YELLOW}[5/7] Deploying base infrastructure stack...${NC}"
BASE_STACK_NAME="${STACK_PREFIX}-base-${ENVIRONMENT}"
BASE_TEMPLATE="infrastructure/cloudformation-base-stack.yml"

if [ ! -f "$BASE_TEMPLATE" ]; then
  echo -e "${RED}Error: $BASE_TEMPLATE not found${NC}"
  exit 1
fi

# Check if stack exists
if aws cloudformation describe-stacks --stack-name "$BASE_STACK_NAME" --region "$AWS_REGION" 2>/dev/null; then
  echo "Stack exists, updating..."
  aws cloudformation update-stack \
    --stack-name "$BASE_STACK_NAME" \
    --template-body "file://$BASE_TEMPLATE" \
    --parameters \
      ParameterKey=Environment,ParameterValue="$ENVIRONMENT" \
      ParameterKey=DBMasterUsername,ParameterValue="$DB_USERNAME" \
      ParameterKey=DBMasterPassword,ParameterValue="$DB_PASSWORD" \
    --region "$AWS_REGION" \
    --capabilities CAPABILITY_NAMED_IAM 2>/dev/null || echo "No changes needed"
else
  echo "Creating new stack..."
  aws cloudformation create-stack \
    --stack-name "$BASE_STACK_NAME" \
    --template-body "file://$BASE_TEMPLATE" \
    --parameters \
      ParameterKey=Environment,ParameterValue="$ENVIRONMENT" \
      ParameterKey=DBMasterUsername,ParameterValue="$DB_USERNAME" \
      ParameterKey=DBMasterPassword,ParameterValue="$DB_PASSWORD" \
    --region "$AWS_REGION" \
    --capabilities CAPABILITY_NAMED_IAM
fi

echo "Waiting for stack to complete (this may take 10-15 minutes)..."
aws cloudformation wait stack-create-complete \
  --stack-name "$BASE_STACK_NAME" \
  --region "$AWS_REGION" || aws cloudformation wait stack-update-complete \
  --stack-name "$BASE_STACK_NAME" \
  --region "$AWS_REGION"

echo -e "${GREEN}✓ Base infrastructure deployed${NC}"

# Step 6: Deploy services stack
echo -e "\n${YELLOW}[6/7] Deploying services stack...${NC}"
SERVICES_STACK_NAME="${STACK_PREFIX}-services-${ENVIRONMENT}"
SERVICES_TEMPLATE="infrastructure/cloudformation-services-stack.yml"

if [ ! -f "$SERVICES_TEMPLATE" ]; then
  echo -e "${RED}Error: $SERVICES_TEMPLATE not found${NC}"
  exit 1
fi

# Determine desired count based on environment
DESIRED_COUNT=1
if [ "$ENVIRONMENT" = "prod" ]; then
  DESIRED_COUNT=2
fi

if aws cloudformation describe-stacks --stack-name "$SERVICES_STACK_NAME" --region "$AWS_REGION" 2>/dev/null; then
  echo "Stack exists, updating..."
  aws cloudformation update-stack \
    --stack-name "$SERVICES_STACK_NAME" \
    --template-body "file://$SERVICES_TEMPLATE" \
    --parameters \
      ParameterKey=BaseStackName,ParameterValue="$BASE_STACK_NAME" \
      ParameterKey=Environment,ParameterValue="$ENVIRONMENT" \
      ParameterKey=DesiredCount,ParameterValue="$DESIRED_COUNT" \
    --region "$AWS_REGION" 2>/dev/null || echo "No changes needed"
else
  echo "Creating new stack..."
  aws cloudformation create-stack \
    --stack-name "$SERVICES_STACK_NAME" \
    --template-body "file://$SERVICES_TEMPLATE" \
    --parameters \
      ParameterKey=BaseStackName,ParameterValue="$BASE_STACK_NAME" \
      ParameterKey=Environment,ParameterValue="$ENVIRONMENT" \
      ParameterKey=DesiredCount,ParameterValue="$DESIRED_COUNT" \
    --region "$AWS_REGION"
fi

echo "Waiting for services stack to complete..."
aws cloudformation wait stack-create-complete \
  --stack-name "$SERVICES_STACK_NAME" \
  --region "$AWS_REGION" || aws cloudformation wait stack-update-complete \
  --stack-name "$SERVICES_STACK_NAME" \
  --region "$AWS_REGION"

echo -e "${GREEN}✓ Services stack deployed${NC}"

# Step 7: Get outputs
echo -e "\n${YELLOW}[7/7] Getting stack outputs...${NC}"

echo -e "\n${GREEN}=== Deployment Summary ===${NC}"
echo "Environment: $ENVIRONMENT"
echo "Base Stack: $BASE_STACK_NAME"
echo "Services Stack: $SERVICES_STACK_NAME"

# Get ALB DNS
ALB_DNS=$(aws cloudformation describe-stacks \
  --stack-name "$SERVICES_STACK_NAME" \
  --query 'Stacks[0].Outputs[?OutputKey==`LoadBalancerDNS`].OutputValue' \
  --output text \
  --region "$AWS_REGION")

echo "Load Balancer DNS: $ALB_DNS"
echo "Backend URL: http://$ALB_DNS/api"
echo "Frontend URL: http://$ALB_DNS"

# Get database endpoint
DB_ENDPOINT=$(aws cloudformation describe-stacks \
  --stack-name "$BASE_STACK_NAME" \
  --query 'Stacks[0].Outputs[?OutputKey==`DatabaseEndpoint`].OutputValue' \
  --output text \
  --region "$AWS_REGION")

echo "Database Endpoint: $DB_ENDPOINT"
echo "Database Username: $DB_USERNAME"

# Get ECR repositories
BACKEND_ECR=$(aws cloudformation describe-stacks \
  --stack-name "$BASE_STACK_NAME" \
  --query 'Stacks[0].Outputs[?OutputKey==`BackendRepositoryUri`].OutputValue' \
  --output text \
  --region "$AWS_REGION")

FRONTEND_ECR=$(aws cloudformation describe-stacks \
  --stack-name "$BASE_STACK_NAME" \
  --query 'Stacks[0].Outputs[?OutputKey==`FrontendRepositoryUri`].OutputValue' \
  --output text \
  --region "$AWS_REGION")

echo "Backend ECR: $BACKEND_ECR"
echo "Frontend ECR: $FRONTEND_ECR"

echo -e "\n${GREEN}=== Next Steps ===${NC}"
echo "1. Configure Azure DevOps pipeline with AWS credentials"
echo "2. Push code to your repository to trigger the pipeline"
echo "3. Monitor deployment in Azure DevOps"
echo "4. Access the application at http://$ALB_DNS"

echo -e "\n${GREEN}✓ Setup complete!${NC}"
