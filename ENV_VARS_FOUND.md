# TranscribeProj001 - Environment Variables Found

## 🎯 Summary of Found AWS Resources

### S3 Buckets
- **S3_BUCKET**: `customer-care-s3` (found in your AWS account)

### DynamoDB Tables
- **DYNAMODB_TABLE**: `TranscribeProj001-summaries-dev` (for summaries)
- **CONNECTIONS_TABLE**: `TranscribeProj001-connections-dev` (for WebSocket connections)
- Alternative table: `TranscribeProj001-channels-dev`

### AWS Bedrock Models
From your `.env` file:
- **BEDROCK_MODEL_ID**: `us.meta.llama3-1-8b-instruct-v1:0` (8B model)
- Alternative: `us.meta.llama3-1-70b-instruct-v1:0` (70B model)
- **MAX_TOKENS**: `2048` (set in your .env)

### AWS Region
- **AWS_REGION**: `us-east-1`

### Environment
- **ENVIRONMENT**: `dev` (for development)

---

## 📝 Complete Environment Variables for Lambda Functions

Use these values when creating your Lambda functions:

```bash
# Export these variables in your terminal before running the Lambda creation script

export S3_BUCKET="customer-care-s3"
export DYNAMODB_TABLE="TranscribeProj001-summaries-dev"
export BEDROCK_MODEL_ID="us.meta.llama3-1-8b-instruct-v1:0"
export MAX_TOKENS="2048"
export CONNECTIONS_TABLE="TranscribeProj001-connections-dev"
export WEBSOCKET_ENDPOINT="https://your-api-id.execute-api.us-east-1.amazonaws.com/dev"
export ENVIRONMENT="dev"
export AWS_REGION="us-east-1"
```

---

## 🔍 Mapping to Lambda Functions

### 1. TranscribeProj001-process-transcript-dev
- S3_BUCKET: `customer-care-s3`
- DYNAMODB_TABLE: `TranscribeProj001-summaries-dev`
- ENVIRONMENT: `dev`

### 2. TranscribeProj001-generate-summary-dev
- BEDROCK_MODEL_ID: `us.meta.llama3-1-8b-instruct-v1:0`
- MAX_TOKENS: `2048`
- DYNAMODB_TABLE: `TranscribeProj001-summaries-dev`
- ENVIRONMENT: `dev`

### 3. TranscribeProj001-save-summary-dev
- DYNAMODB_TABLE: `TranscribeProj001-summaries-dev`
- ENVIRONMENT: `dev`

### 4. TranscribeProj001-update-status-dev
- DYNAMODB_TABLE: `TranscribeProj001-summaries-dev`
- ENVIRONMENT: `dev`

### 5. TranscribeProj001-list-summaries-dev
- DYNAMODB_TABLE: `TranscribeProj001-summaries-dev`
- ENVIRONMENT: `dev`

### 6. TranscribeProj001-get-summary-dev
- DYNAMODB_TABLE: `TranscribeProj001-summaries-dev`
- S3_BUCKET: `customer-care-s3`
- ENVIRONMENT: `dev`

### 7. TranscribeProj001-ws-connect-dev
- CONNECTIONS_TABLE: `TranscribeProj001-connections-dev`
- ENVIRONMENT: `dev`

### 8. TranscribeProj001-ws-disconnect-dev
- CONNECTIONS_TABLE: `TranscribeProj001-connections-dev`
- ENVIRONMENT: `dev`

### 9. TranscribeProj001-ws-notify-dev
- CONNECTIONS_TABLE: `TranscribeProj001-connections-dev`
- WEBSOCKET_ENDPOINT: `https://your-api-id.execute-api.us-east-1.amazonaws.com/dev` ⚠️ NEEDS UPDATE
- ENVIRONMENT: `dev`

---

## ⚠️ Values That Need Your Input

### WEBSOCKET_ENDPOINT
You need to create a WebSocket API Gateway or provide the endpoint:
```
Format: https://{api-id}.execute-api.us-east-1.amazonaws.com/{stage}
Example: https://abc123def456.execute-api.us-east-1.amazonaws.com/dev
```

**To find or create:**
1. Go to AWS API Gateway Console
2. Create a WebSocket API if it doesn't exist
3. Note the endpoint URL
4. Use it as your WEBSOCKET_ENDPOINT value

---

## 🚀 How to Use These Values

### Option 1: Export and Run Python Script
```bash
# Set environment variables
export S3_BUCKET="customer-care-s3"
export DYNAMODB_TABLE="TranscribeProj001-summaries-dev"
export BEDROCK_MODEL_ID="us.meta.llama3-1-8b-instruct-v1:0"
export MAX_TOKENS="2048"
export CONNECTIONS_TABLE="TranscribeProj001-connections-dev"
export WEBSOCKET_ENDPOINT="https://abc123def456.execute-api.us-east-1.amazonaws.com/dev"
export ENVIRONMENT="dev"

# Run the Python script
python3 create_lambda_functions.py
```

### Option 2: Create .env file and source it
```bash
# Create env-vars.txt
cat > env-vars.txt << 'EOF'
S3_BUCKET="customer-care-s3"
DYNAMODB_TABLE="TranscribeProj001-summaries-dev"
BEDROCK_MODEL_ID="us.meta.llama3-1-8b-instruct-v1:0"
MAX_TOKENS="2048"
CONNECTIONS_TABLE="TranscribeProj001-connections-dev"
WEBSOCKET_ENDPOINT="https://your-websocket-endpoint"
ENVIRONMENT="dev"
EOF

# Source it
source env-vars.txt

# Run script
python3 create_lambda_functions.py
```

### Option 3: Run CLI Commands Directly
See `aws-lambda-cli-commands.sh` and replace the environment variable values with those above.

---

## 📊 Verification - Resources Found

| Resource Type | Name | Found | Value |
|---|---|---|---|
| S3 Bucket | S3_BUCKET | ✅ | `customer-care-s3` |
| DynamoDB Table | DYNAMODB_TABLE | ✅ | `TranscribeProj001-summaries-dev` |
| DynamoDB Table | CONNECTIONS_TABLE | ✅ | `TranscribeProj001-connections-dev` |
| Bedrock Model | BEDROCK_MODEL_ID | ✅ | `us.meta.llama3-1-8b-instruct-v1:0` |
| Max Tokens | MAX_TOKENS | ✅ | `2048` |
| AWS Region | AWS_REGION | ✅ | `us-east-1` |
| Environment | ENVIRONMENT | ✅ | `dev` |
| WebSocket Endpoint | WEBSOCKET_ENDPOINT | ⚠️ | **NEEDS UPDATE** |
| IAM Role | TranscribeProj001-lambda-role-dev | ✅ | `arn:aws:iam::877634772291:role/TranscribeProj001-lambda-role-dev` |

---

## 🔄 Next Steps

1. ✅ **Found S3 bucket**: `customer-care-s3`
2. ✅ **Found DynamoDB tables**: `TranscribeProj001-summaries-dev`, `TranscribeProj001-connections-dev`
3. ✅ **Found Bedrock model**: `us.meta.llama3-1-8b-instruct-v1:0`
4. ⚠️ **Find or create WebSocket endpoint** in API Gateway
5. ✅ **Update Python/Bash script** with these values (scripts already use defaults pointing to these)
6. **Run Lambda creation script**:
   ```bash
   python3 create_lambda_functions.py
   ```
7. **Verify Lambda functions created**:
   ```bash
   aws lambda list-functions --region us-east-1 --output table
   ```

---

## 💾 Quick Reference

```bash
# Copy-paste ready commands:

# Check IAM role exists
aws iam get-role --role-name TranscribeProj001-lambda-role-dev --region us-east-1

# Verify S3 bucket
aws s3 ls customer-care-s3

# Verify DynamoDB tables
aws dynamodb describe-table --table-name TranscribeProj001-summaries-dev --region us-east-1
aws dynamodb describe-table --table-name TranscribeProj001-connections-dev --region us-east-1

# List all your Lambda functions
aws lambda list-functions --region us-east-1 --output table
```

---

**Date**: 2026-02-16  
**Account**: 877634772291  
**Region**: us-east-1  
**Environment**: dev
