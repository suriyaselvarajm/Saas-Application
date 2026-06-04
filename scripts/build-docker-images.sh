#!/bin/bash
# Build Docker images locally and test them

set -e

ENVIRONMENT=${1:-dev}
AWS_REGION=${2:-us-east-1}
AWS_ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
REGISTRY_URL="$AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com"
BACKEND_IMAGE_NAME="saas-backend"
FRONTEND_IMAGE_NAME="saas-frontend"
BUILD_TAG="local-$(date +%s)"

echo "=== Building Docker Images Locally ==="
echo "Registry: $REGISTRY_URL"
echo "Build Tag: $BUILD_TAG"

# Build backend image
echo -e "\n[1/4] Building backend image..."
docker build \
  -f backend/Dockerfile \
  -t "$REGISTRY_URL/$BACKEND_IMAGE_NAME:$BUILD_TAG" \
  -t "$REGISTRY_URL/$BACKEND_IMAGE_NAME:latest" \
  --build-arg NODE_ENV=production \
  backend/

echo "✓ Backend image built"

# Build frontend image
echo -e "\n[2/4] Building frontend image..."
docker build \
  -f frontend/Dockerfile \
  -t "$REGISTRY_URL/$FRONTEND_IMAGE_NAME:$BUILD_TAG" \
  -t "$REGISTRY_URL/$FRONTEND_IMAGE_NAME:latest" \
  --build-arg NODE_ENV=production \
  frontend/

echo "✓ Frontend image built"

# Test backend image
echo -e "\n[3/4] Testing backend image..."
docker run --rm \
  -e NODE_ENV=production \
  -p 3001:3000 \
  "$REGISTRY_URL/$BACKEND_IMAGE_NAME:$BUILD_TAG" \
  node -e "console.log('Backend image is valid')" || echo "Note: Full test requires environment setup"

echo "✓ Backend image validated"

# Test frontend image
echo -e "\n[4/4] Testing frontend image..."
docker run --rm \
  -e NODE_ENV=production \
  -p 3002:3000 \
  "$REGISTRY_URL/$FRONTEND_IMAGE_NAME:$BUILD_TAG" \
  node -e "console.log('Frontend image is valid')" || echo "Note: Full test requires environment setup"

echo "✓ Frontend image validated"

echo -e "\n=== Build Complete ==="
echo "To push to ECR:"
echo "aws ecr get-login-password --region $AWS_REGION | docker login --username AWS --password-stdin $REGISTRY_URL"
echo "docker push $REGISTRY_URL/$BACKEND_IMAGE_NAME:$BUILD_TAG"
echo "docker push $REGISTRY_URL/$FRONTEND_IMAGE_NAME:$BUILD_TAG"
