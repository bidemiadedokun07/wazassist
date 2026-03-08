# AWS Bedrock Setup Guide

## Overview
This guide explains how to configure AWS Bedrock for production use of the AI conversational commerce features in WazAssist.

## Prerequisites
- AWS Account with billing enabled
- Access to AWS Bedrock service (request access if needed)
- AWS CLI installed (optional but recommended)

## Step 1: Request AWS Bedrock Model Access

1. Log in to your AWS Console
2. Navigate to **AWS Bedrock** service
3. Go to **Model Access** in the left sidebar
4. Request access to the following models:
   - **Meta Llama 3.1 8B Instruct** (fast responses, lower cost)
   - **Meta Llama 3.1 70B Instruct** (complex reasoning, higher accuracy)
   - **Amazon Titan Embeddings** (for product search - optional)

5. Access is usually granted within minutes to a few hours

## Step 2: Create IAM User for WazAssist

### Create IAM Policy

Create a custom policy named `WazAssistBedrockPolicy`:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "BedrockInvokeModel",
      "Effect": "Allow",
      "Action": [
        "bedrock:InvokeModel",
        "bedrock:InvokeModelWithResponseStream"
      ],
      "Resource": [
        "arn:aws:bedrock:us-east-1::foundation-model/meta.llama3-1-8b-instruct-v1:0",
        "arn:aws:bedrock:us-east-1::foundation-model/meta.llama3-1-70b-instruct-v1:0",
        "arn:aws:bedrock:us-east-1::foundation-model/amazon.titan-embed-text-v1"
      ]
    },
    {
      "Sid": "BedrockListModels",
      "Effect": "Allow",
      "Action": [
        "bedrock:ListFoundationModels",
        "bedrock:GetFoundationModel"
      ],
      "Resource": "*"
    }
  ]
}
```

### Create IAM User

1. Go to **IAM** → **Users** → **Create User**
2. User name: `wazassist-bedrock-user`
3. Attach policy: `WazAssistBedrockPolicy`
4. Create access key:
   - Use case: **Application running outside AWS**
   - Download credentials (you'll need these for .env)

## Step 3: Configure Environment Variables

Add these to your `.env` file:

```bash
# AWS Bedrock Configuration
AWS_ACCESS_KEY_ID=your_access_key_here
AWS_SECRET_ACCESS_KEY=your_secret_key_here
AWS_REGION=us-east-1

# AI Model Selection
AI_MODEL_8B=meta.llama3-1-8b-instruct-v1:0
AI_MODEL_70B=meta.llama3-1-70b-instruct-v1:0

# AI Configuration
MOCK_AI=false                    # Set to false for production
USE_OPENAI_FALLBACK=false        # Set to true if you want OpenAI as fallback
OPENAI_API_KEY=your_openai_key   # Optional: OpenAI fallback

# Model Selection Strategy
# Options: 'bedrock', 'openai', 'auto'
AI_PROVIDER=bedrock
```

## Step 4: Test AWS Bedrock Connection

Run the test script to verify your configuration:

```bash
cd backend
node test-bedrock-connection.js
```

Expected output:
```
✅ AWS Bedrock connection successful!
✅ Model: meta.llama3-1-8b-instruct-v1:0
✅ Response: Hello! I'm an AI assistant for your business...
✅ Tokens used: ~150
✅ Processing time: ~2-3 seconds
```

## Step 5: Cost Optimization

### LLaMA 3.1 Pricing (us-east-1)
- **8B Model**: $0.0003 per 1K input tokens, $0.0006 per 1K output tokens
- **70B Model**: $0.00265 per 1K input tokens, $0.0035 per 1K output tokens

### Cost Example (1000 Conversations/Day)
Assuming average conversation:
- Input: 500 tokens (business context + history + message)
- Output: 200 tokens (AI response)

**8B Model (recommended for most conversations):**
- Input: 1000 × 0.5 × $0.0003 = $0.15/day
- Output: 1000 × 0.2 × $0.0006 = $0.12/day
- **Total: $0.27/day = $8.10/month**

**70B Model (complex queries):**
- Input: 100 × 0.5 × $0.00265 = $0.13/day
- Output: 100 × 0.2 × $0.0035 = $0.07/day
- **Total: $0.20/day = $6.00/month**

**Combined Strategy: $14/month for 1000 conversations/day**

### Optimization Tips
1. Use 8B model for 90% of conversations
2. Route complex queries to 70B model
3. Cache business context to reduce input tokens
4. Set max_tokens limit (e.g., 500 tokens) to control costs
5. Monitor usage with AWS Cost Explorer

## Step 6: Production Best Practices

### 1. Enable CloudWatch Logging
```javascript
// In ai.service.js
import { CloudWatchLogsClient, PutLogEventsCommand } from "@aws-sdk/client-cloudwatch-logs";

// Log all AI requests for monitoring
```

### 2. Implement Rate Limiting
```javascript
// Prevent abuse
const RATE_LIMIT = {
  maxRequestsPerMinute: 60,
  maxRequestsPerHour: 1000
};
```

### 3. Add Retry Logic
```javascript
// In ai.service.js - already implemented
const maxRetries = 3;
const retryDelay = 1000; // 1 second
```

### 4. Set Up Alerts
Create CloudWatch alarms for:
- High token usage (>100K tokens/hour)
- Error rate >5%
- Latency >5 seconds
- Cost >$50/day

### 5. Rotate Credentials
- Rotate AWS access keys every 90 days
- Use AWS Secrets Manager for production
- Never commit credentials to git

## Step 7: Monitoring & Analytics

### Track These Metrics
```javascript
// Already implemented in ai.service.js
{
  model: 'meta.llama3-1-8b-instruct-v1:0',
  tokensUsed: 350,
  processingTime: 2.4,
  conversationId: 'uuid',
  businessId: 'uuid',
  language: 'en',
  intentDetected: 'order_placement'
}
```

### Set Up Dashboard
Monitor in your analytics:
- Total conversations/day
- AI vs Human-handled conversations
- Average tokens per conversation
- Conversion rate (conversation → order)
- Cost per conversation
- Popular intents (order, status, questions)

## Troubleshooting

### Error: "Access Denied"
- Verify AWS credentials in .env
- Check IAM policy has `bedrock:InvokeModel` permission
- Ensure model access is granted in Bedrock console

### Error: "Model not found"
- Verify model ID matches exactly
- Check AWS region (us-east-1 recommended)
- Confirm model access was granted

### Error: "Throttling"
- Implement exponential backoff (already in code)
- Consider requesting quota increase
- Use caching to reduce requests

### High Latency (>5 seconds)
- Check AWS region (use closest to your server)
- Reduce max_tokens in requests
- Use 8B model instead of 70B
- Check conversation history length

### High Costs
- Review token usage per conversation
- Implement conversation caching
- Set stricter max_tokens limits
- Use 8B model more aggressively

## Migration from Mock Mode

### Testing Checklist
Before switching from MOCK_AI=true to MOCK_AI=false:

- [ ] AWS credentials configured
- [ ] Bedrock model access granted
- [ ] Test script passes
- [ ] Backend server restarts successfully
- [ ] Send test WhatsApp message
- [ ] Verify AI response quality
- [ ] Check CloudWatch logs
- [ ] Monitor costs for first day
- [ ] Compare AI quality vs Mock responses

### Gradual Rollout
```javascript
// Enable for 10% of conversations
const useRealAI = Math.random() < 0.10;

if (useRealAI && !config.mockAi) {
  // Use AWS Bedrock
} else {
  // Use Mock AI
}
```

## Security Checklist

- [ ] AWS credentials stored in .env (not in code)
- [ ] .env file in .gitignore
- [ ] IAM user has minimal required permissions
- [ ] MFA enabled on AWS account
- [ ] CloudTrail logging enabled
- [ ] Cost alerts configured
- [ ] Credentials rotation schedule set
- [ ] Production .env file secured on server

## Next Steps

After AWS Bedrock is configured:

1. **Test Thoroughly**: Send 100+ test messages before going live
2. **Monitor Closely**: Watch costs and quality for first week
3. **Optimize Prompts**: Refine system prompts based on responses
4. **Train Team**: Show team how to monitor and handle escalations
5. **Gather Feedback**: Ask customers about AI experience
6. **Iterate**: Continuously improve based on metrics

## Support

- **AWS Bedrock Docs**: https://docs.aws.amazon.com/bedrock/
- **LLaMA 3.1 Guide**: https://aws.amazon.com/bedrock/llama/
- **WazAssist AI Flow**: See `AI_CONVERSATION_FLOW.md`

---

**Ready for Production!** 🚀

Once AWS Bedrock is configured, WazAssist will handle:
- ✅ Product discovery conversations
- ✅ Order intent detection
- ✅ Order status tracking
- ✅ Multi-language support (English, Pidgin, Yoruba, Igbo, Hausa)
- ✅ Customer preferences memory
- ✅ Escalation to human when needed
