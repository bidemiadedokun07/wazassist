# 🚀 WazAssist WhatsApp Setup - Business Guide

## System Overview

WazAssist is a **multi-tenant SaaS platform** where:
- ✅ Multiple businesses register on your web app
- ✅ Each business connects their WhatsApp Business number
- ✅ Customers contact businesses via WhatsApp
- ✅ Your AI handles all conversations automatically
- ✅ Orders, products, customers tracked per business

**Current Status**: Backend running ✅, Database ready ✅, AWS Bedrock live ✅

---

## Quick Start (5 Minutes)

### Step 1: Get Your First Business WhatsApp Credentials

Go to **Meta Developer Console**: https://developers.facebook.com/apps

1. **Create/Select App** → Click "Create App" or use existing
2. **Add WhatsApp Product** → Click "+ Add Product" → Select "WhatsApp"
3. **Get Credentials** (in WhatsApp > Getting Started):

```bash
Phone Number ID: 123456789012345
WhatsApp Business Account ID: 987654321098765  
Access Token: EAAxxxxxxxxxxxxxxxxxxxx
```

4. **Get App Secret** (Settings > Basic):
```bash
App Secret: abc123def456...
```

### Step 2: Setup Webhook (Required for Messages)

**Option A: Use ngrok (Recommended for Testing)**
```bash
# Terminal 1
ngrok http 3000

# Copy URL: https://abc123.ngrok.io
```

**In Meta Developer Console**:
- WhatsApp > Configuration > Webhook
- Callback URL: `https://abc123.ngrok.io/api/v1/webhooks/whatsapp`
- Verify Token: `WazAssist2024_Secure_Token` (from .env)
- Subscribe to: ✅ messages

**Click "Verify and Save"**

### Step 3: Register Your Business in WazAssist

**Option A: Via API (Quick Test)**
```bash
curl -X POST http://localhost:3000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "business@example.com",
    "password": "SecurePass123!",
    "full_name": "Business Owner"
  }'
```

Save the `token` from response.

**Then create business**:
```bash
curl -X POST http://localhost:3000/api/v1/businesses \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "businessName": "Fashion Store",
    "description": "Premium fashion boutique",
    "businessType": "fashion",
    "phoneNumber": "+2348012345678",
    "email": "store@fashion.com",
    "whatsappPhoneNumberId": "YOUR_PHONE_NUMBER_ID",
    "whatsappAccessToken": "YOUR_ACCESS_TOKEN"
  }'
```

**Option B: Via Frontend Dashboard** (Recommended)
1. Open http://localhost:5174
2. Click "Register" → Fill details
3. Go to "Settings" → "Business Profile"
4. Enter WhatsApp credentials
5. Click "Save & Verify"

### Step 4: Test with Real WhatsApp

Send message from any phone to your WhatsApp Business number:

```
You: Hi
AI: Hello! 👋 Welcome to Fashion Store...
```

**🎉 DONE! Your AI is live!**

---

## Complete Flow Explanation

### How It Works

```
Customer's Phone
    ↓
WhatsApp Business API (Meta)
    ↓
Webhook → http://your-server/api/v1/webhooks/whatsapp
    ↓
WazAssist Backend
    ↓
1. Identifies business (via phone_number_id)
2. Gets/creates customer record
3. Loads conversation history
4. Calls AWS Bedrock LLaMA 3.1
5. Sends AI response back
    ↓
WhatsApp → Customer receives reply
```

### Key Database Tables

1. **businesses** - Store WhatsApp credentials per business
   - `whatsapp_phone_number_id` - Unique identifier
   - `whatsapp_access_token` - API access token
   
2. **customers** - One customer can talk to many businesses
   - `phone_number` - Customer's WhatsApp number
   
3. **conversations** - One per customer-business pair
   - Links customer to business
   - Tracks message history
   
4. **messages** - All messages (inbound/outbound)
   - Linked to conversation
   - Processed by AI

---

## Setting Up Multiple Businesses

### Business 1: Fashion Store
```bash
# Register business owner
POST /api/v1/auth/register
{
  "email": "fashion@example.com",
  "password": "Pass123!",
  "full_name": "Fashion Owner"
}

# Create business
POST /api/v1/businesses
{
  "businessName": "Fashion Boutique",
  "businessType": "fashion",
  "whatsappPhoneNumberId": "PHONE_ID_1",
  "whatsappAccessToken": "TOKEN_1"
}
```

### Business 2: Electronics Store
```bash
# Register different owner
POST /api/v1/auth/register
{
  "email": "electronics@example.com",
  "password": "Pass123!",
  "full_name": "Electronics Owner"
}

# Create business
POST /api/v1/businesses
{
  "businessName": "Tech Hub",
  "businessType": "electronics",
  "whatsappPhoneNumberId": "PHONE_ID_2",
  "whatsappAccessToken": "TOKEN_2"
}
```

**Both businesses now have separate:**
- ✅ WhatsApp numbers
- ✅ Product catalogs
- ✅ Customer conversations
- ✅ Order management
- ✅ Analytics

---

## .env Configuration

Your `.env` already has most settings. Just update:

```bash
# WhatsApp Global Settings
WHATSAPP_API_VERSION=v18.0
WHATSAPP_API_URL=https://graph.facebook.com
WHATSAPP_VERIFY_TOKEN=WazAssist2024_Secure_Token
WHATSAPP_APP_SECRET=your_app_secret_from_meta

# For testing/development
MOCK_WHATSAPP=false  # Set false for real WhatsApp
DEBUG=false          # Set false for production

# Webhook URL (used in frontend)
WEBHOOK_BASE_URL=https://abc123.ngrok.io/webhooks  # Your ngrok URL
```

**Note**: Each business has their own credentials stored in database, not .env!

---

##Production Deployment (After Testing)

### Option 1: AWS (Recommended)
```bash
# Deploy to EC2/ECS with public IP
WEBHOOK_BASE_URL=https://api.yourdomain.com/webhooks
```

### Option 2: Heroku
```bash
# Auto-generates public URL
WEBHOOK_BASE_URL=https://yourapp.herokuapp.com/webhooks
```

### Option 3: Vercel/Railway
```bash
# Use their provided domains
WEBHOOK_BASE_URL=https://your-project.vercel.app/webhooks
```

**Update Meta webhook URL** to match production URL.

---

## Testing Checklist

### ✅ Pre-Flight Checks
```bash
# 1. Database running
docker ps | grep postgres  # Should show running

# 2. Backend running
curl http://localhost:3000/health  # Should return healthy

# 3. Ngrok running (for testing)
curl https://YOUR-NGROK-URL.ngrok.io/health  # Should return healthy

# 4. WhatsApp webhook verified
# Check Meta Developer Console → WhatsApp → Configuration
# Should show ✅ verified
```

### ✅ Send Test Message

**From your phone**:
```
Hi
```

**Expected AI Response**:
```
Hello! 👋 Welcome to [Business Name]. 
How can I help you today?
```

**Check backend logs**:
```bash
# Should see:
✅ Message processed successfully
🤖 AI response sent
```

### ✅ Test Full Flow
```
1. Customer: "What products do you have?"
   AI: Lists products

2. Customer: "I want the blue shirt size L"
   AI: Confirms preference, offers to create order

3. Customer: "Where is my order?"
   AI: Checks order status, provides updates

4. Customer: "I NEED MANAGER NOW!"
   AI: Detects urgency, escalates to human
```

---

## Troubleshooting

### ❌ "Webhook verification failed"
- Check WHATSAPP_VERIFY_TOKEN in .env matches Meta Console
- Ensure ngrok URL is accessible: `curl https://YOUR-URL.ngrok.io/health`

### ❌ "Business not found"
- Check `whatsapp_phone_number_id` in database matches Meta Console
- Query: `SELECT * FROM businesses WHERE whatsapp_phone_number_id = 'YOUR_ID';`

### ❌ "No AI response"
- Check MOCK_AI=false in .env
- Check AWS credentials: `aws sts get-caller-identity`
- Check logs: Backend should show "🤖 AI response sent"

### ❌ "Message not reaching customer"
- Check `whatsapp_access_token` is valid (not expired)
- Check WhatsApp Business Account status in Meta Console
- Verify phone number is registered in Meta Console

---

## API Endpoints Reference

### Business Management
```bash
POST   /api/v1/businesses              # Create business
GET    /api/v1/businesses/my           # Get my businesses
GET    /api/v1/businesses/:id          # Get business details
PUT    /api/v1/businesses/:id          # Update business
PUT    /api/v1/businesses/:id/whatsapp # Update WhatsApp credentials
```

### Webhooks
```bash
GET    /api/v1/webhooks/whatsapp      # Verify webhook (Meta calls this)
POST   /api/v1/webhooks/whatsapp      # Receive messages (Meta calls this)
```

### Conversations & Messages
```bash
GET    /api/v1/businesses/:id/conversations  # List conversations
GET    /api/v1/conversations/:id             # Get conversation
GET    /api/v1/conversations/:id/messages    # Get messages
```

---

## Security Best Practices

### 1. Access Tokens
- ✅ Store in database (encrypted)
- ✅ Use permanent tokens (not temporary 24h tokens)
- ✅ Rotate regularly
- ❌ Never commit to git

### 2. Webhook Security
```javascript
// Already implemented in webhook.routes.js
- Verify token on GET requests
- Validate signature on POST requests
- Quick 200 response, async processing
```

### 3. Rate Limiting
```bash
# Already configured in .env
RATE_LIMIT_WHATSAPP_MAX=1000  # Per minute per business
```

---

## Cost Management

### WhatsApp Cloud API Pricing
- First 1,000 conversations/month: **FREE**
- Business-initiated: $0.005-0.09 per conversation
- User-initiated: $0.0025-0.045 per conversation

### AWS Bedrock LLaMA 3.1 8B
- Input: $0.0003 per 1K tokens
- Output: $0.0006 per 1K tokens
- Average: **~$0.001 per conversation**

### Total: **~$30-50/month for 1000 conversations**

---

## Next Steps

1. **Test with your WhatsApp number** ✅
2. **Add products** (via dashboard or API)
3. **Invite team members** (Settings → Team)
4. **Setup analytics** (auto-enabled)
5. **Go live!** 🚀

---

## Support During Investor Demo

**Quick Demo Script**:

1. **Show Dashboard**: http://localhost:5174
   - Live conversations
   - Real-time analytics
   - Product catalog

2. **Live WhatsApp Test**:
   - Send message from investor's phone
   - Show AI response (real AWS Bedrock)
   - Place order via chat
   - Show order in dashboard

3. **Show Technical Proof**:
   - Backend logs (AWS Bedrock calls)
   - Database (conversations, messages, orders)
   - Cost monitoring (AWS console)

**Key Talking Points**:
- ✅ Multi-tenant: One platform, many businesses
- ✅ Real AI: AWS Bedrock LLaMA 3.1 (not hardcoded)
- ✅ Full lifecycle: Chat → Order → Payment → Fulfillment
- ✅ Smart features: Preferences, search, escalation
- ✅ Cost-effective: ~$0.001 per conversation
- ✅ Scalable: Handles 1000s of businesses

---

## Files You Need to Know

1. **backend/src/api/routes/webhook.routes.js** - Webhook handler
2. **backend/src/services/message.service.js** - Message processing
3. **backend/src/services/whatsapp.service.js** - WhatsApp API
4. **backend/src/services/ai.service.js** - AI processing
5. **backend/src/services/business.service.js** - Business management

---

## Ready to Test?

Run these commands:

```bash
# Terminal 1: Backend (already running)
cd backend && npm run dev

# Terminal 2: Frontend (already running)  
cd frontend && npm run dev

# Terminal 3: Ngrok
ngrok http 3000

# Then:
# 1. Update Meta webhook with ngrok URL
# 2. Send WhatsApp message
# 3. Watch the magic! ✨
```

**Your system is production-ready!** 🎉
