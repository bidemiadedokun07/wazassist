# AWS Lambda Function Creation Guide
## TranscribeProj001 Development Environment

This guide contains everything needed to create 9 AWS Lambda functions for TranscribeProj001 using AWS CLI.

---

## 📋 Overview

**9 Lambda Functions to Create:**
1. `TranscribeProj001-process-transcript-dev` - Process transcripts from S3
2. `TranscribeProj001-generate-summary-dev` - Generate summaries using Bedrock
3. `TranscribeProj001-save-summary-dev` - Save summaries to DynamoDB
4. `TranscribeProj001-update-status-dev` - Update processing status
5. `TranscribeProj001-list-summaries-dev` - List available summaries
6. `TranscribeProj001-get-summary-dev` - Retrieve specific summary
7. `TranscribeProj001-ws-connect-dev` - WebSocket connection handler
8. `TranscribeProj001-ws-disconnect-dev` - WebSocket disconnection handler
9. `TranscribeProj001-ws-notify-dev` - WebSocket notification sender

**Common Configuration:**
- **Role ARN:** `arn:aws:iam::877634772291:role/TranscribeProj001-lambda-role-dev`
- **Region:** `us-east-1`
- **Runtime:** `python3.11`

---

## 🔧 Prerequisites

1. **AWS CLI v2** installed and configured
   ```bash
   aws --version
   aws configure
   ```

2. **AWS Credentials** with permissions to:
   - Create Lambda functions
   - Read/write IAM roles
   - Access Systems Manager Parameter Store (optional)

3. **Python 3.9+** (for Python script option)
   ```bash
   python3 --version
   ```

4. **Verify AWS Access**
   ```bash
   aws sts get-caller-identity
   aws iam get-role --role-name TranscribeProj001-lambda-role-dev
   ```

---

## 📝 Environment Variables

The Lambda functions require these environment variables:

| Variable | Required By | Description | Example |
|----------|------------|-------------|---------|
| `S3_BUCKET` | process-transcript, get-summary | S3 bucket for transcripts | `transcribe-proj001-dev` |
| `DYNAMODB_TABLE` | Most functions | DynamoDB table name | `TranscribeProj001-dev` |
| `BEDROCK_MODEL_ID` | generate-summary | Bedrock model identifier | `anthropic.claude-3-sonnet-20240229-v1:0` |
| `MAX_TOKENS` | generate-summary | Maximum tokens for summaries | `1024` |
| `CONNECTIONS_TABLE` | WebSocket functions | Table for active connections | `WebSocketConnections-dev` |
| `WEBSOCKET_ENDPOINT` | ws-notify | WebSocket API endpoint | `https://xxx.execute-api.us-east-1.amazonaws.com/dev` |
| `ENVIRONMENT` | All functions | Environment name | `dev` |

---

## 🚀 Methods to Create Lambda Functions

### Method 1: Python Script (Recommended)

**Easiest and most automated approach:**

```bash
# Make script executable
chmod +x create_lambda_functions.py

# Run with default settings
python3 create_lambda_functions.py

# Or with custom options
python3 create_lambda_functions.py \
    --region us-east-1 \
    --zip-path ./lambda-code.zip \
    --no-create-zip
```

**What it does:**
- ✓ Verifies AWS credentials
- ✓ Retrieves environment variables from Parameter Store
- ✓ Creates placeholder ZIP file
- ✓ Creates all 9 Lambda functions
- ✓ Verifies creation
- ✓ Displays results and next steps

### Method 2: Bash Script

**If you prefer shell scripting:**

```bash
# Make script executable
chmod +x create-lambda-functions.sh

# Run the script
./create-lambda-functions.sh
```

**Before running:**
- Edit the script to set your actual environment variable values
- Ensure AWS CLI is configured
- Have Lambda code available as ZIP file

### Method 3: Manual AWS CLI Commands

**For fine-grained control:**

```bash
# 1. First, check and retrieve your environment variables
chmod +x check-env-vars.sh
./check-env-vars.sh

# 2. Review the CLI commands
cat aws-lambda-cli-commands.sh

# 3. Set your environment variables
export S3_BUCKET="your-bucket"
export DYNAMODB_TABLE="your-table"
# ... (set all required variables)

# 4. Run individual commands or source the script
source aws-lambda-cli-commands.sh
```

---

## 📚 Retrieving Environment Variables from AWS

### Option A: Using AWS Parameter Store

```bash
# Check if parameters exist
aws ssm get-parameter --name "/transcribe/S3_BUCKET" --region us-east-1

# If they exist, retrieve them
aws ssm get-parameter --name "/transcribe/S3_BUCKET" --region us-east-1 --query 'Parameter.Value'

# If they don't exist, create them
aws ssm put-parameter \
    --name "/transcribe/S3_BUCKET" \
    --value "your-bucket-name" \
    --type "String" \
    --region us-east-1
```

### Option B: Using CloudFormation Stack Outputs

```bash
aws cloudformation describe-stacks \
    --stack-name TranscribeProj001-dev \
    --region us-east-1 \
    --query 'Stacks[0].Outputs'
```

### Option C: Manual lookup in AWS Console

1. Navigate to Systems Manager > Parameter Store
2. Look for parameters starting with `/transcribe/`
3. Or check CloudFormation > Stacks > Outputs
4. Or check Secrets Manager > Secrets

### Option D: Environment variables from .env file

```bash
# Create or update .env file
cat > .env << 'EOF'
S3_BUCKET=your-bucket
DYNAMODB_TABLE=your-table
BEDROCK_MODEL_ID=anthropic.claude-3-sonnet-20240229-v1:0
MAX_TOKENS=1024
CONNECTIONS_TABLE=your-connections-table
WEBSOCKET_ENDPOINT=https://xxx.execute-api.us-east-1.amazonaws.com/dev
ENVIRONMENT=dev
EOF

# Source it before running
source .env
```

---

## 🔍 Verification

### Check if functions were created

```bash
# List all TranscribeProj001-dev functions
aws lambda list-functions \
    --region us-east-1 \
    --query 'Functions[?contains(FunctionName, `TranscribeProj001-`) && contains(FunctionName, `-dev`)].{Name:FunctionName,Memory:MemorySize,Timeout:Timeout,Runtime:Runtime}' \
    --output table

# Get details of a specific function
aws lambda get-function \
    --function-name TranscribeProj001-process-transcript-dev \
    --region us-east-1
```

### Check environment variables

```bash
# Get environment variables for a function
aws lambda get-function-configuration \
    --function-name TranscribeProj001-process-transcript-dev \
    --region us-east-1 \
    --query 'Environment.Variables'
```

### Test a function

```bash
# Invoke a test
aws lambda invoke \
    --function-name TranscribeProj001-process-transcript-dev \
    --region us-east-1 \
    --payload '{"test": true}' \
    response.json

# View response
cat response.json
```

---

## 🔄 Updating Functions

### Update Lambda Code

```bash
aws lambda update-function-code \
    --function-name TranscribeProj001-process-transcript-dev \
    --zip-file fileb://path/to/new-code.zip \
    --region us-east-1
```

### Update Environment Variables

```bash
aws lambda update-function-configuration \
    --function-name TranscribeProj001-process-transcript-dev \
    --environment "Variables={S3_BUCKET=new-bucket,DYNAMODB_TABLE=new-table,ENVIRONMENT=dev}" \
    --region us-east-1
```

### Update Timeout/Memory

```bash
aws lambda update-function-configuration \
    --function-name TranscribeProj001-process-transcript-dev \
    --timeout 600 \
    --memory-size 512 \
    --region us-east-1
```

---

## 🗑️ Cleanup

### Delete a function

```bash
aws lambda delete-function \
    --function-name TranscribeProj001-process-transcript-dev \
    --region us-east-1
```

### Delete all TranscribeProj001-dev functions

```bash
# Get list and delete
aws lambda list-functions \
    --region us-east-1 \
    --query "Functions[?contains(FunctionName, 'TranscribeProj001-') && contains(FunctionName, '-dev')].FunctionName" \
    --output text | while read func; do
        aws lambda delete-function --function-name "$func" --region us-east-1
        echo "Deleted: $func"
    done
```

---

## 📊 Lambda Function Specifications

### 1. Process Transcript
```
Name: TranscribeProj001-process-transcript-dev
Handler: process_transcript.handler
Timeout: 300s (5 min)
Memory: 256MB
Env: S3_BUCKET, DYNAMODB_TABLE, ENVIRONMENT
Purpose: Process transcripts from S3 and extract text
```

### 2. Generate Summary
```
Name: TranscribeProj001-generate-summary-dev
Handler: generate_summary.handler
Timeout: 600s (10 min)
Memory: 512MB
Env: BEDROCK_MODEL_ID, MAX_TOKENS, DYNAMODB_TABLE, ENVIRONMENT
Purpose: Use Bedrock to generate summaries from transcripts
```

### 3. Save Summary
```
Name: TranscribeProj001-save-summary-dev
Handler: save_summary.handler
Timeout: 60s
Memory: 256MB
Env: DYNAMODB_TABLE, ENVIRONMENT
Purpose: Save generated summaries to DynamoDB
```

### 4. Update Status
```
Name: TranscribeProj001-update-status-dev
Handler: update_status.handler
Timeout: 60s
Memory: 128MB
Env: DYNAMODB_TABLE, ENVIRONMENT
Purpose: Update processing status in DynamoDB
```

### 5. List Summaries
```
Name: TranscribeProj001-list-summaries-dev
Handler: list_summaries.handler
Timeout: 30s
Memory: 256MB
Env: DYNAMODB_TABLE, ENVIRONMENT
Purpose: Query and list available summaries
```

### 6. Get Summary
```
Name: TranscribeProj001-get-summary-dev
Handler: get_summary.handler
Timeout: 30s
Memory: 256MB
Env: DYNAMODB_TABLE, S3_BUCKET, ENVIRONMENT
Purpose: Retrieve specific summary from DynamoDB/S3
```

### 7. WebSocket Connect
```
Name: TranscribeProj001-ws-connect-dev
Handler: connect.handler
Timeout: 10s
Memory: 128MB
Env: CONNECTIONS_TABLE, ENVIRONMENT
Purpose: Handle WebSocket connection events
```

### 8. WebSocket Disconnect
```
Name: TranscribeProj001-ws-disconnect-dev
Handler: disconnect.handler
Timeout: 10s
Memory: 128MB
Env: CONNECTIONS_TABLE, ENVIRONMENT
Purpose: Handle WebSocket disconnection events
```

### 9. WebSocket Notify
```
Name: TranscribeProj001-ws-notify-dev
Handler: notify.handler
Timeout: 10s
Memory: 128MB
Env: CONNECTIONS_TABLE, WEBSOCKET_ENDPOINT, ENVIRONMENT
Purpose: Send notifications via WebSocket
```

---

## 🐛 Troubleshooting

### "User is not authorized" error
- Verify IAM permissions
- Check AWS credentials: `aws sts get-caller-identity`
- Ensure role exists: `aws iam get-role --role-name TranscribeProj001-lambda-role-dev`

### "InvalidParameterValueException" for ZIP file
- Ensure ZIP file exists and has lambda function code
- ZIP must not be empty
- Check file path is correct

### Functions created but code doesn't work
- Update function code: `aws lambda update-function-code`
- Check CloudWatch logs: `aws logs tail /aws/lambda/function-name --follow`
- Test with simple payload first

### Environment variables not being read
- Verify they were set: `aws lambda get-function-configuration --function-name name`
- Ensure Lambda execution role has permissions
- Check variable names match exactly (case-sensitive)

---

## 📞 Quick Reference Commands

```bash
# Create all functions (Python)
python3 create_lambda_functions.py

# List created functions
aws lambda list-functions --region us-east-1 --query 'Functions[?contains(FunctionName, `TranscribeProj001-`)].FunctionName'

# Update a function's code
aws lambda update-function-code --function-name NAME --zip-file fileb://code.zip --region us-east-1

# View function details
aws lambda get-function-configuration --function-name NAME --region us-east-1

# Test a function
aws lambda invoke --function-name NAME --payload '{}' output.json --region us-east-1

# View logs
aws logs tail /aws/lambda/NAME --follow --region us-east-1

# Delete a function
aws lambda delete-function --function-name NAME --region us-east-1
```

---

## 📖 Additional Resources

- [AWS Lambda Documentation](https://docs.aws.amazon.com/lambda/)
- [AWS CLI Lambda Reference](https://docs.aws.amazon.com/cli/latest/reference/lambda/)
- [Lambda Python Runtime](https://docs.aws.amazon.com/lambda/latest/dg/lambda-python.html)
- [AWS IAM Roles for Lambda](https://docs.aws.amazon.com/lambda/latest/dg/lambda-intro-execution-role.html)

---

## ✅ Next Steps

1. ✓ Verify AWS credentials are configured
2. ✓ Look up environment variables from AWS
3. ✓ Choose creation method (Python script recommended)
4. ✓ Run the creation script/commands
5. ✓ Verify Lambda functions were created
6. ✓ Update Lambda code (replace placeholder ZIP)
7. ✓ Configure triggers (API Gateway, S3, etc.)
8. ✓ Test functions
9. ✓ Monitor with CloudWatch logs

---

**Created:** 2026-02-16  
**Project:** TranscribeProj001  
**Environment:** dev  
**Region:** us-east-1
