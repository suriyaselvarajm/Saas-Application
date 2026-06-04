#!/bin/bash
# Monitor ECS deployment status and logs

ENVIRONMENT=${1:-dev}
AWS_REGION=${2:-us-east-1}
CLUSTER_NAME="saas-cluster-$ENVIRONMENT"
BACKEND_SERVICE="saas-backend-$ENVIRONMENT"
FRONTEND_SERVICE="saas-frontend-$ENVIRONMENT"

echo "=== Monitoring ECS Deployment ==="
echo "Cluster: $CLUSTER_NAME"
echo "Region: $AWS_REGION"

# Function to display service status
show_service_status() {
  local service_name=$1
  
  echo -e "\n=== $service_name Status ==="
  
  aws ecs describe-services \
    --cluster "$CLUSTER_NAME" \
    --services "$service_name" \
    --region "$AWS_REGION" \
    --query 'services[0].[serviceName,status,desiredCount,runningCount]' \
    --output table
  
  # Show task status
  echo -e "\n--- Task Details ---"
  aws ecs list-tasks \
    --cluster "$CLUSTER_NAME" \
    --service-name "$service_name" \
    --region "$AWS_REGION" \
    --query 'taskArns' \
    --output text | while read -r task_arn; do
    if [ -n "$task_arn" ]; then
      aws ecs describe-tasks \
        --cluster "$CLUSTER_NAME" \
        --tasks "$task_arn" \
        --region "$AWS_REGION" \
        --query 'tasks[0].[taskArn,lastStatus,desiredStatus]' \
        --output table
    fi
  done
}

# Show backend status
show_service_status "$BACKEND_SERVICE"

# Show frontend status
show_service_status "$FRONTEND_SERVICE"

# Show recent logs
echo -e "\n=== Recent Logs (last 50 lines) ==="
aws logs tail "/ecs/saas-${ENVIRONMENT}" \
  --max-items 50 \
  --region "$AWS_REGION"
