#!/bin/bash

# Check and export environment variables from AWS Parameter Store
# Run this first to retrieve your values

echo "=== Retrieving TranscribeProj001 Environment Variables from AWS ==="
echo ""

# Set AWS Region
AWS_REGION="us-east-1"

# Check if AWS CLI is installed
if ! command -v aws &> /dev/null; then
    echo "❌ AWS CLI is not installed. Please install it first."
    exit 1
fi

echo "Checking AWS credentials..."
if ! aws sts get-caller-identity --region $AWS_REGION &>/dev/null; then
    echo "❌ AWS credentials not configured or invalid. Please configure AWS CLI."
    echo "   Run: aws configure"
    exit 1
fi

echo "✓ AWS credentials valid"
echo ""

# Try to get parameters from AWS Systems Manager Parameter Store
echo "Attempting to retrieve parameters from AWS Systems Manager Parameter Store..."
echo ""

# Function to check and retrieve parameter
check_param() {
    local param_name=$1
    local description=$2
    
    echo -n "Looking for $description... "
    if aws ssm get-parameter --name "/transcribe/$param_name" --region "$AWS_REGION" --query 'Parameter.Value' --output text 2>/dev/null; then
        echo "✓ Found"
    else
        echo "✗ Not found (will need to be set manually)"
    fi
}

# Check all parameters
check_param "S3_BUCKET" "S3_BUCKET"
check_param "DYNAMODB_TABLE" "DYNAMODB_TABLE"
check_param "BEDROCK_MODEL_ID" "BEDROCK_MODEL_ID"
check_param "MAX_TOKENS" "MAX_TOKENS"
check_param "CONNECTIONS_TABLE" "CONNECTIONS_TABLE"
check_param "WEBSOCKET_ENDPOINT" "WEBSOCKET_ENDPOINT"

echo ""
echo "=== Alternative: Check Environment/Secrets in Different Locations ==="
echo ""
echo "Checking AWS Secrets Manager..."
aws secretsmanager list-secrets --region $AWS_REGION --filters "Key=name,Values=TranscribeProj001" 2>/dev/null | jq '.SecretList[] | .Name' || echo "No secrets found for TranscribeProj001"

echo ""
echo "Checking CloudFormation Stacks..."
aws cloudformation list-stacks --region $AWS_REGION --stack-status-filter CREATE_COMPLETE UPDATE_COMPLETE 2>/dev/null | grep -i transcribe || echo "No CloudFormation stacks found for TranscribeProj001"

echo ""
echo "=== If parameters not found above, please set them manually ==="
echo ""
echo "To set parameters in Parameter Store, run:"
echo ""
echo "aws ssm put-parameter --name '/transcribe/S3_BUCKET' --value 'your-s3-bucket-name' --type 'String' --region us-east-1"
echo "aws ssm put-parameter --name '/transcribe/DYNAMODB_TABLE' --value 'your-table-name' --type 'String' --region us-east-1"
echo "aws ssm put-parameter --name '/transcribe/BEDROCK_MODEL_ID' --value 'anthropic.claude-3-sonnet-20240229-v1:0' --type 'String' --region us-east-1"
echo "aws ssm put-parameter --name '/transcribe/MAX_TOKENS' --value '1024' --type 'String' --region us-east-1"
echo "aws ssm put-parameter --name '/transcribe/CONNECTIONS_TABLE' --value 'your-connections-table' --type 'String' --region us-east-1"
echo "aws ssm put-parameter --name '/transcribe/WEBSOCKET_ENDPOINT' --value 'your-websocket-endpoint' --type 'String' --region us-east-1"
echo ""
