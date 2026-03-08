# AWS CLI Commands for Creating TranscribeProj001 Lambda Functions
# These commands assume you have AWS CLI v2 installed and configured with proper credentials
# Region: us-east-1
# Runtime: python3.11
# Role: arn:aws:iam::877634772291:role/TranscribeProj001-lambda-role-dev

# ============================================================================
# IMPORTANT - FIRST STEP: Set Your Environment Variables
# ============================================================================
# Retrieve your actual values from AWS Parameter Store, Secrets Manager, or environment

export AWS_REGION="us-east-1"
export ROLE_ARN="arn:aws:iam::877634772291:role/TranscribeProj001-lambda-role-dev"
export RUNTIME="python3.11"

# Replace these with your actual AWS values
export S3_BUCKET="customer-care-s3"
export DYNAMODB_TABLE="TranscribeProj001-summaries-dev"
export BEDROCK_MODEL_ID="us.meta.llama3-1-8b-instruct-v1:0"
export MAX_TOKENS="2048"
export CONNECTIONS_TABLE="TranscribeProj001-connections-dev"
export WEBSOCKET_ENDPOINT="https://your-api-id.execute-api.us-east-1.amazonaws.com/dev"
export ENVIRONMENT="dev"

# ============================================================================
# NOTE: You need to provide actual Lambda function code as a ZIP file
# ============================================================================
# For these commands to work, you need:
# - A ZIP file containing the Lambda function code
# - The ZIP file should contain the proper handler functions

# Example: Create a placeholder ZIP file (for testing)
# echo "" > lambda_handler.py
# zip lambda-code.zip lambda_handler.py

# ============================================================================
# LAMBDA FUNCTION CREATION COMMANDS
# ============================================================================

# ============================================================================
# 1. TranscribeProj001-process-transcript-dev
# ============================================================================
# Handler: process_transcript.handler
# Timeout: 300 seconds (5 minutes)
# Memory: 256 MB
# Env Vars: S3_BUCKET, DYNAMODB_TABLE, ENVIRONMENT

aws lambda create-function \
  --function-name TranscribeProj001-process-transcript-dev \
  --runtime $RUNTIME \
  --role $ROLE_ARN \
  --handler process_transcript.handler \
  --timeout 300 \
  --memory-size 256 \
  --environment "Variables={S3_BUCKET=$S3_BUCKET,DYNAMODB_TABLE=$DYNAMODB_TABLE,ENVIRONMENT=$ENVIRONMENT}" \
  --zip-file fileb://lambda-code.zip \
  --region $AWS_REGION

# ============================================================================
# 2. TranscribeProj001-generate-summary-dev
# ============================================================================
# Handler: generate_summary.handler
# Timeout: 600 seconds (10 minutes)
# Memory: 512 MB
# Env Vars: BEDROCK_MODEL_ID, MAX_TOKENS, DYNAMODB_TABLE, ENVIRONMENT

aws lambda create-function \
  --function-name TranscribeProj001-generate-summary-dev \
  --runtime $RUNTIME \
  --role $ROLE_ARN \
  --handler generate_summary.handler \
  --timeout 600 \
  --memory-size 512 \
  --environment "Variables={BEDROCK_MODEL_ID=$BEDROCK_MODEL_ID,MAX_TOKENS=$MAX_TOKENS,DYNAMODB_TABLE=$DYNAMODB_TABLE,ENVIRONMENT=$ENVIRONMENT}" \
  --zip-file fileb://lambda-code.zip \
  --region $AWS_REGION

# ============================================================================
# 3. TranscribeProj001-save-summary-dev
# ============================================================================
# Handler: save_summary.handler
# Timeout: 60 seconds
# Memory: 256 MB
# Env Vars: DYNAMODB_TABLE, ENVIRONMENT

aws lambda create-function \
  --function-name TranscribeProj001-save-summary-dev \
  --runtime $RUNTIME \
  --role $ROLE_ARN \
  --handler save_summary.handler \
  --timeout 60 \
  --memory-size 256 \
  --environment "Variables={DYNAMODB_TABLE=$DYNAMODB_TABLE,ENVIRONMENT=$ENVIRONMENT}" \
  --zip-file fileb://lambda-code.zip \
  --region $AWS_REGION

# ============================================================================
# 4. TranscribeProj001-update-status-dev
# ============================================================================
# Handler: update_status.handler
# Timeout: 60 seconds
# Memory: 128 MB
# Env Vars: DYNAMODB_TABLE, ENVIRONMENT

aws lambda create-function \
  --function-name TranscribeProj001-update-status-dev \
  --runtime $RUNTIME \
  --role $ROLE_ARN \
  --handler update_status.handler \
  --timeout 60 \
  --memory-size 128 \
  --environment "Variables={DYNAMODB_TABLE=$DYNAMODB_TABLE,ENVIRONMENT=$ENVIRONMENT}" \
  --zip-file fileb://lambda-code.zip \
  --region $AWS_REGION

# ============================================================================
# 5. TranscribeProj001-list-summaries-dev
# ============================================================================
# Handler: list_summaries.handler
# Timeout: 30 seconds
# Memory: 256 MB
# Env Vars: DYNAMODB_TABLE, ENVIRONMENT

aws lambda create-function \
  --function-name TranscribeProj001-list-summaries-dev \
  --runtime $RUNTIME \
  --role $ROLE_ARN \
  --handler list_summaries.handler \
  --timeout 30 \
  --memory-size 256 \
  --environment "Variables={DYNAMODB_TABLE=$DYNAMODB_TABLE,ENVIRONMENT=$ENVIRONMENT}" \
  --zip-file fileb://lambda-code.zip \
  --region $AWS_REGION

# ============================================================================
# 6. TranscribeProj001-get-summary-dev
# ============================================================================
# Handler: get_summary.handler
# Timeout: 30 seconds
# Memory: 256 MB
# Env Vars: DYNAMODB_TABLE, S3_BUCKET, ENVIRONMENT

aws lambda create-function \
  --function-name TranscribeProj001-get-summary-dev \
  --runtime $RUNTIME \
  --role $ROLE_ARN \
  --handler get_summary.handler \
  --timeout 30 \
  --memory-size 256 \
  --environment "Variables={DYNAMODB_TABLE=$DYNAMODB_TABLE,S3_BUCKET=$S3_BUCKET,ENVIRONMENT=$ENVIRONMENT}" \
  --zip-file fileb://lambda-code.zip \
  --region $AWS_REGION

# ============================================================================
# 7. TranscribeProj001-ws-connect-dev
# ============================================================================
# Handler: connect.handler
# Timeout: 10 seconds
# Memory: 128 MB
# Env Vars: CONNECTIONS_TABLE, ENVIRONMENT

aws lambda create-function \
  --function-name TranscribeProj001-ws-connect-dev \
  --runtime $RUNTIME \
  --role $ROLE_ARN \
  --handler connect.handler \
  --timeout 10 \
  --memory-size 128 \
  --environment "Variables={CONNECTIONS_TABLE=$CONNECTIONS_TABLE,ENVIRONMENT=$ENVIRONMENT}" \
  --zip-file fileb://lambda-code.zip \
  --region $AWS_REGION

# ============================================================================
# 8. TranscribeProj001-ws-disconnect-dev
# ============================================================================
# Handler: disconnect.handler
# Timeout: 10 seconds
# Memory: 128 MB
# Env Vars: CONNECTIONS_TABLE, ENVIRONMENT

aws lambda create-function \
  --function-name TranscribeProj001-ws-disconnect-dev \
  --runtime $RUNTIME \
  --role $ROLE_ARN \
  --handler disconnect.handler \
  --timeout 10 \
  --memory-size 128 \
  --environment "Variables={CONNECTIONS_TABLE=$CONNECTIONS_TABLE,ENVIRONMENT=$ENVIRONMENT}" \
  --zip-file fileb://lambda-code.zip \
  --region $AWS_REGION

# ============================================================================
# 9. TranscribeProj001-ws-notify-dev
# ============================================================================
# Handler: notify.handler
# Timeout: 10 seconds
# Memory: 128 MB
# Env Vars: CONNECTIONS_TABLE, WEBSOCKET_ENDPOINT, ENVIRONMENT

aws lambda create-function \
  --function-name TranscribeProj001-ws-notify-dev \
  --runtime $RUNTIME \
  --role $ROLE_ARN \
  --handler notify.handler \
  --timeout 10 \
  --memory-size 128 \
  --environment "Variables={CONNECTIONS_TABLE=$CONNECTIONS_TABLE,WEBSOCKET_ENDPOINT=$WEBSOCKET_ENDPOINT,ENVIRONMENT=$ENVIRONMENT}" \
  --zip-file fileb://lambda-code.zip \
  --region $AWS_REGION

# ============================================================================
# ADDITIONAL USEFUL AWS CLI COMMANDS
# ============================================================================

# List all created Lambda functions
aws lambda list-functions --region $AWS_REGION --query 'Functions[?contains(FunctionName, `TranscribeProj001-`) && contains(FunctionName, `-dev`)].{Name:FunctionName,Memory:MemorySize,Timeout:Timeout,Runtime:Runtime}'

# Get details of a specific function
# aws lambda get-function --function-name TranscribeProj001-process-transcript-dev --region $AWS_REGION

# Update environment variables for a function
# aws lambda update-function-configuration \
#   --function-name TranscribeProj001-process-transcript-dev \
#   --environment "Variables={S3_BUCKET=$S3_BUCKET,DYNAMODB_TABLE=$DYNAMODB_TABLE,ENVIRONMENT=$ENVIRONMENT}" \
#   --region $AWS_REGION

# Delete a Lambda function
# aws lambda delete-function --function-name TranscribeProj001-process-transcript-dev --region $AWS_REGION

# Get function logs (requires CloudWatch Logs)
# aws logs tail /aws/lambda/TranscribeProj001-process-transcript-dev --follow --region $AWS_REGION

# ============================================================================
# VERIFICATION COMMANDS
# ============================================================================

# Verify all functions created
echo "Verifying Lambda functions..."
aws lambda list-functions --region $AWS_REGION \
  --query "Functions[?contains(FunctionName, 'TranscribeProj001-') && contains(FunctionName, '-dev')].{Name:FunctionName,Memory:MemorySize,Timeout:Timeout}" \
  --output table
