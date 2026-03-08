#!/bin/bash

# AWS Lambda Function Creation Script
# TranscribeProj001 - Dev Environment

set -e

# Configuration
ROLE_ARN="arn:aws:iam::877634772291:role/TranscribeProj001-lambda-role-dev"
AWS_REGION="us-east-1"
RUNTIME="python3.11"
ENVIRONMENT="dev"

# Color output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}=== TranscribeProj001 Lambda Function Creation ===${NC}"
echo "Region: $AWS_REGION"
echo "Runtime: $RUNTIME"
echo "Role: $ROLE_ARN"
echo ""

# Step 1: Retrieve existing environment variables from AWS (if they exist in a config or parameter store)
echo -e "${YELLOW}Step 1: Looking up environment variables from AWS Parameter Store...${NC}"
echo "Checking for existing parameters..."

# Try to get values from AWS Systems Manager Parameter Store
get_param() {
    local param_name=$1
    local default_value=$2
    
    if aws ssm get-parameter --name "/transcribe/$param_name" --region "$AWS_REGION" &>/dev/null; then
        aws ssm get-parameter --name "/transcribe/$param_name" --region "$AWS_REGION" --query 'Parameter.Value' --output text
    else
        echo "$default_value"
    fi
}

# Attempt to retrieve parameters (or use defaults)
echo "Attempting to retrieve environment variables..."

S3_BUCKET=$(get_param "S3_BUCKET" "customer-care-s3")
DYNAMODB_TABLE=$(get_param "DYNAMODB_TABLE" "TranscribeProj001-summaries-dev")
BEDROCK_MODEL_ID=$(get_param "BEDROCK_MODEL_ID" "us.meta.llama3-1-8b-instruct-v1:0")
MAX_TOKENS=$(get_param "MAX_TOKENS" "2048")
CONNECTIONS_TABLE=$(get_param "CONNECTIONS_TABLE" "TranscribeProj001-connections-dev")
WEBSOCKET_ENDPOINT=$(get_param "WEBSOCKET_ENDPOINT" "https://your-api-id.execute-api.us-east-1.amazonaws.com/dev")

echo -e "${GREEN}Environment Variables:${NC}"
echo "S3_BUCKET: $S3_BUCKET"
echo "DYNAMODB_TABLE: $DYNAMODB_TABLE"
echo "BEDROCK_MODEL_ID: $BEDROCK_MODEL_ID"
echo "MAX_TOKENS: $MAX_TOKENS"
echo "CONNECTIONS_TABLE: $CONNECTIONS_TABLE"
echo "WEBSOCKET_ENDPOINT: $WEBSOCKET_ENDPOINT"
echo ""

# Step 2: Create Lambda functions
echo -e "${YELLOW}Step 2: Creating Lambda functions...${NC}"
echo ""

# Function to create a Lambda function
create_lambda() {
    local function_name=$1
    local handler=$2
    local timeout=$3
    local memory=$4
    shift 4
    local env_vars=("$@")
    
    echo -e "${YELLOW}Creating: $function_name${NC}"
    
    # Build environment variables string
    local env_string="ENVIRONMENT=$ENVIRONMENT"
    for var in "${env_vars[@]}"; do
        case $var in
            "S3_BUCKET")
                env_string="$env_string,S3_BUCKET=$S3_BUCKET"
                ;;
            "DYNAMODB_TABLE")
                env_string="$env_string,DYNAMODB_TABLE=$DYNAMODB_TABLE"
                ;;
            "BEDROCK_MODEL_ID")
                env_string="$env_string,BEDROCK_MODEL_ID=$BEDROCK_MODEL_ID"
                ;;
            "MAX_TOKENS")
                env_string="$env_string,MAX_TOKENS=$MAX_TOKENS"
                ;;
            "CONNECTIONS_TABLE")
                env_string="$env_string,CONNECTIONS_TABLE=$CONNECTIONS_TABLE"
                ;;
            "WEBSOCKET_ENDPOINT")
                env_string="$env_string,WEBSOCKET_ENDPOINT=$WEBSOCKET_ENDPOINT"
                ;;
        esac
    done
    
    # Create placeholder ZIP file (Lambda functions require code)
    # In production, this should be replaced with actual function code
    local zip_file="lambda-placeholder.zip"
    if [ ! -f "$zip_file" ]; then
        echo "" > lambda_placeholder.py
        zip -j "$zip_file" lambda_placeholder.py 2>/dev/null || true
    fi
    
    # Create the Lambda function
    aws lambda create-function \
        --function-name "$function_name" \
        --runtime "$RUNTIME" \
        --role "$ROLE_ARN" \
        --handler "$handler" \
        --timeout "$timeout" \
        --memory-size "$memory" \
        --environment "Variables={$env_string}" \
        --zip-file "fileb://$zip_file" \
        --region "$AWS_REGION" \
        2>&1 | while IFS= read -r line; do
            if [[ $line == *"FunctionArn"* ]]; then
                echo -e "${GREEN}✓ Created: $function_name${NC}"
                echo "  $line"
            elif [[ $line == *"error"* ]] || [[ $line == *"Error"* ]] || [[ $line == *"already exists"* ]]; then
                echo -e "${RED}✗ Error or function already exists for $function_name${NC}"
                echo "  $line"
            fi
        done
    echo ""
}

# Lambda 1: Process Transcript
create_lambda "TranscribeProj001-process-transcript-dev" "process_transcript.handler" 300 256 S3_BUCKET DYNAMODB_TABLE

# Lambda 2: Generate Summary
create_lambda "TranscribeProj001-generate-summary-dev" "generate_summary.handler" 600 512 BEDROCK_MODEL_ID MAX_TOKENS DYNAMODB_TABLE

# Lambda 3: Save Summary
create_lambda "TranscribeProj001-save-summary-dev" "save_summary.handler" 60 256 DYNAMODB_TABLE

# Lambda 4: Update Status
create_lambda "TranscribeProj001-update-status-dev" "update_status.handler" 60 128 DYNAMODB_TABLE

# Lambda 5: List Summaries
create_lambda "TranscribeProj001-list-summaries-dev" "list_summaries.handler" 30 256 DYNAMODB_TABLE

# Lambda 6: Get Summary
create_lambda "TranscribeProj001-get-summary-dev" "get_summary.handler" 30 256 S3_BUCKET DYNAMODB_TABLE

# Lambda 7: WebSocket Connect
create_lambda "TranscribeProj001-ws-connect-dev" "connect.handler" 10 128 CONNECTIONS_TABLE

# Lambda 8: WebSocket Disconnect
create_lambda "TranscribeProj001-ws-disconnect-dev" "disconnect.handler" 10 128 CONNECTIONS_TABLE

# Lambda 9: WebSocket Notify
create_lambda "TranscribeProj001-ws-notify-dev" "notify.handler" 10 128 CONNECTIONS_TABLE WEBSOCKET_ENDPOINT

# Cleanup
rm -f lambda-placeholder.zip lambda_placeholder.py

echo -e "${GREEN}=== Lambda Function Creation Complete ===${NC}"
echo ""
echo -e "${YELLOW}Next Steps:${NC}"
echo "1. Review the created Lambda functions in the AWS Console"
echo "2. Upload the actual function code to each Lambda"
echo "3. Configure Lambda layers if needed"
echo "4. Set up triggers (API Gateway, S3, DynamoDB, etc.)"
echo "5. Run tests to verify functionality"
echo ""
