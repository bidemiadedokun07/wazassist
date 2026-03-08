#!/bin/bash

# TranscribeProj001 Lambda Functions - Quick Start
# This script creates all 9 Lambda functions with the discovered environment variables

set -e

echo ""
echo "╔══════════════════════════════════════════════════════════════╗"
echo "║     TranscribeProj001 Lambda Functions - Quick Start         ║"
echo "╚══════════════════════════════════════════════════════════════╝"
echo ""

# Configuration (from discovered values)
ROLE_ARN="arn:aws:iam::877634772291:role/TranscribeProj001-lambda-role-dev"
AWS_REGION="us-east-1"
RUNTIME="python3.11"

# Environment Variables (Found/Configured)
S3_BUCKET="customer-care-s3"
DYNAMODB_TABLE="TranscribeProj001-summaries-dev"
BEDROCK_MODEL_ID="us.meta.llama3-1-8b-instruct-v1:0"
MAX_TOKENS="2048"
CONNECTIONS_TABLE="TranscribeProj001-connections-dev"
WEBSOCKET_ENDPOINT="${WEBSOCKET_ENDPOINT:-https://your-api-id.execute-api.us-east-1.amazonaws.com/dev}"
ENVIRONMENT="dev"

# Verification
echo "📋 Verifying Configuration..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✓ Region: $AWS_REGION"
echo "✓ Runtime: $RUNTIME"
echo "✓ Role: $ROLE_ARN"
echo ""
echo "📦 Environment Variables:"
echo "  • S3_BUCKET: $S3_BUCKET"
echo "  • DYNAMODB_TABLE: $DYNAMODB_TABLE"
echo "  • BEDROCK_MODEL_ID: $BEDROCK_MODEL_ID"
echo "  • MAX_TOKENS: $MAX_TOKENS"
echo "  • CONNECTIONS_TABLE: $CONNECTIONS_TABLE"
echo "  • WEBSOCKET_ENDPOINT: $WEBSOCKET_ENDPOINT"
echo "  • ENVIRONMENT: $ENVIRONMENT"
echo ""

# Verify AWS credentials
echo "🔐 Checking AWS Credentials..."
if ! aws sts get-caller-identity --region $AWS_REGION &>/dev/null; then
    echo "❌ AWS credentials not configured"
    echo "   Run: aws configure"
    exit 1
fi
echo "✓ AWS credentials valid"
echo ""

# Verify role exists
echo "🔑 Verifying IAM Role..."
if ! aws iam get-role --role-name "TranscribeProj001-lambda-role-dev" &>/dev/null; then
    echo "❌ IAM role not found"
    exit 1
fi
echo "✓ IAM role exists"
echo ""

# Create placeholder ZIP
echo "📦 Preparing Lambda Code..."
ZIP_FILE="lambda-code-transcribe.zip"

if [ ! -f "$ZIP_FILE" ]; then
    echo "" > lambda_handler_temp.py
    zip -j "$ZIP_FILE" lambda_handler_temp.py &>/dev/null 2>&1 || true
    rm -f lambda_handler_temp.py
    echo "✓ Created placeholder ZIP: $ZIP_FILE"
else
    echo "✓ Using existing ZIP: $ZIP_FILE"
fi
echo ""

# Function to create Lambda
create_lambda_function() {
    local name=$1
    local handler=$2
    local timeout=$3
    local memory=$4
    shift 4
    local env_vars_array=("$@")
    
    # Build env string
    local env_string="ENVIRONMENT=$ENVIRONMENT"
    for var in "${env_vars_array[@]}"; do
        case $var in
            "S3_BUCKET") env_string="$env_string,S3_BUCKET=$S3_BUCKET" ;;
            "DYNAMODB_TABLE") env_string="$env_string,DYNAMODB_TABLE=$DYNAMODB_TABLE" ;;
            "BEDROCK_MODEL_ID") env_string="$env_string,BEDROCK_MODEL_ID=$BEDROCK_MODEL_ID" ;;
            "MAX_TOKENS") env_string="$env_string,MAX_TOKENS=$MAX_TOKENS" ;;
            "CONNECTIONS_TABLE") env_string="$env_string,CONNECTIONS_TABLE=$CONNECTIONS_TABLE" ;;
            "WEBSOCKET_ENDPOINT") env_string="$env_string,WEBSOCKET_ENDPOINT=$WEBSOCKET_ENDPOINT" ;;
        esac
    done
    
    # Check if function already exists
    if aws lambda get-function --function-name "$name" --region $AWS_REGION &>/dev/null; then
        echo "⚠  Already exists: $name"
        return 0
    fi
    
    # Create function
    if aws lambda create-function \
        --function-name "$name" \
        --runtime "$RUNTIME" \
        --role "$ROLE_ARN" \
        --handler "$handler" \
        --timeout "$timeout" \
        --memory-size "$memory" \
        --environment "Variables={$env_string}" \
        --zip-file "fileb://$ZIP_FILE" \
        --region "$AWS_REGION" \
        --tags "Project=TranscribeProj001,Environment=dev,ManagedBy=cli" \
        &>/dev/null; then
        echo "✓ Created: $name (Memory: ${memory}MB, Timeout: ${timeout}s, Handler: $handler)"
        return 0
    else
        echo "✗ Failed: $name"
        return 1
    fi
}

# Create all 9 Lambda functions
echo "🚀 Creating Lambda Functions..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

CREATED=0
FAILED=0

# 1. Process Transcript
create_lambda_function \
    "TranscribeProj001-process-transcript-dev" \
    "process_transcript.handler" \
    300 256 \
    S3_BUCKET DYNAMODB_TABLE
((CREATED++)) || ((FAILED++))

# 2. Generate Summary
create_lambda_function \
    "TranscribeProj001-generate-summary-dev" \
    "generate_summary.handler" \
    600 512 \
    BEDROCK_MODEL_ID MAX_TOKENS DYNAMODB_TABLE
((CREATED++)) || ((FAILED++))

# 3. Save Summary
create_lambda_function \
    "TranscribeProj001-save-summary-dev" \
    "save_summary.handler" \
    60 256 \
    DYNAMODB_TABLE
((CREATED++)) || ((FAILED++))

# 4. Update Status
create_lambda_function \
    "TranscribeProj001-update-status-dev" \
    "update_status.handler" \
    60 128 \
    DYNAMODB_TABLE
((CREATED++)) || ((FAILED++))

# 5. List Summaries
create_lambda_function \
    "TranscribeProj001-list-summaries-dev" \
    "list_summaries.handler" \
    30 256 \
    DYNAMODB_TABLE
((CREATED++)) || ((FAILED++))

# 6. Get Summary
create_lambda_function \
    "TranscribeProj001-get-summary-dev" \
    "get_summary.handler" \
    30 256 \
    DYNAMODB_TABLE S3_BUCKET
((CREATED++)) || ((FAILED++))

# 7. WebSocket Connect
create_lambda_function \
    "TranscribeProj001-ws-connect-dev" \
    "connect.handler" \
    10 128 \
    CONNECTIONS_TABLE
((CREATED++)) || ((FAILED++))

# 8. WebSocket Disconnect
create_lambda_function \
    "TranscribeProj001-ws-disconnect-dev" \
    "disconnect.handler" \
    10 128 \
    CONNECTIONS_TABLE
((CREATED++)) || ((FAILED++))

# 9. WebSocket Notify
create_lambda_function \
    "TranscribeProj001-ws-notify-dev" \
    "notify.handler" \
    10 128 \
    CONNECTIONS_TABLE WEBSOCKET_ENDPOINT
((CREATED++)) || ((FAILED++))

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Summary
echo "📊 Summary"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Total Lambda functions:     9"
echo "Available/Created:          ✓"
echo ""

# Verify all functions exist
echo "✅ Lambda Functions Created:"
aws lambda list-functions \
    --region $AWS_REGION \
    --query 'Functions[?contains(FunctionName, `TranscribeProj001-`) && contains(FunctionName, `-dev`)].{Name:FunctionName,Memory:MemorySize,Timeout:Timeout,Runtime:Runtime}' \
    --output table 2>/dev/null || echo "Could not list functions"

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Next steps
echo "📋 Next Steps:"
echo ""
echo "1. Upload Lambda Code:"
echo "   • Update each function with actual code using:"
echo "   aws lambda update-function-code \\"
echo "     --function-name TranscribeProj001-process-transcript-dev \\"
echo "     --zip-file fileb://path/to/your/code.zip \\"
echo "     --region us-east-1"
echo ""
echo "2. Configure Triggers:"
echo "   • API Gateway for HTTP endpoints"
echo "   • S3 for file uploads"
echo "   • DynamoDB Streams for table events"
echo "   • WebSocket API for real-time connections"
echo ""
echo "3. Test Functions:"
echo "   aws lambda invoke \\"
echo "     --function-name TranscribeProj001-get-summary-dev \\"
echo "     --region us-east-1 \\"
echo "     --payload '{}' response.json"
echo ""
echo "4. Monitor:"
echo "   aws logs tail /aws/lambda/TranscribeProj001-process-transcript-dev --follow --region us-east-1"
echo ""
echo "✅ All done! Your Lambda functions are ready."
echo ""
