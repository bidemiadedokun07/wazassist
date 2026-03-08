#!/bin/bash
# Quick WhatsApp Setup Verification

echo "🔍 WazAssist WhatsApp Setup Checker"
echo "==================================="
echo ""

GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Check 1: Backend running
echo -n "1. Backend server... "
if curl -s http://localhost:3000/health > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Running${NC}"
else
    echo -e "${RED}❌ Not running${NC}"
    echo "   Run: cd backend && npm run dev"
    exit 1
fi

# Check 2: Database
echo -n "2. PostgreSQL database... "
if docker ps | grep -q wazassist-postgres; then
    echo -e "${GREEN}✅ Running${NC}"
else
    echo -e "${RED}❌ Not running${NC}"
    echo "   Run: docker start wazassist-postgres-dev"
    exit 1
fi

# Check 3: AWS Bedrock
echo -n "3. AWS Bedrock config... "
if grep -q "MOCK_AI=false" .env && grep -q "us-east-1" .env; then
    echo -e "${GREEN}✅ Configured${NC}"
else
    echo -e "${YELLOW}⚠️  Check .env${NC}"
fi

# Check 4: Business in database
echo -n "4. Business registered... "
BUSINESS_COUNT=$(docker exec wazassist-postgres-dev psql -U postgres -d wazassist -t -c "SELECT COUNT(*) FROM businesses;" 2>/dev/null | tr -d ' ')
if [ "$BUSINESS_COUNT" -gt 0 ]; then
    echo -e "${GREEN}✅ $BUSINESS_COUNT business(es)${NC}"
else
    echo -e "${YELLOW}⚠️  No businesses yet${NC}"
    echo "   Register via: http://localhost:5174"
fi

echo ""
echo "==================================="
echo "📋 Next Steps:"
echo ""

# Check if ngrok is running
if lsof -i:4040 > /dev/null 2>&1; then
    NGROK_URL=$(curl -s http://localhost:4040/api/tunnels | grep -o 'https://[a-z0-9]*\.ngrok\.io' | head -1)
    echo -e "${GREEN}✅ Ngrok running${NC}"
    echo "   URL: $NGROK_URL"
    echo ""
    echo "📱 Update Meta Webhook:"
    echo "   1. Go to: https://developers.facebook.com/apps"
    echo "   2. WhatsApp → Configuration → Webhook"
    echo "   3. Callback URL: ${NGROK_URL}/api/v1/webhooks/whatsapp"
    echo "   4. Verify Token: WazAssist2024_Secure_Token"
else
    echo -e "${YELLOW}⚠️  Ngrok not running${NC}"
    echo ""
    echo "🚀 Start ngrok:"
    echo "   ngrok http 3000"
    echo ""
    echo "📱 Then update Meta Webhook:"
    echo "   1. Go to: https://developers.facebook.com/apps"
    echo "   2. WhatsApp → Configuration → Webhook"
    echo "   3. Callback URL: https://YOUR-NGROK-URL.ngrok.io/api/v1/webhooks/whatsapp"
    echo "   4. Verify Token: WazAssist2024_Secure_Token"
fi

echo ""
echo "🎯 To register your business:"
echo "   1. Open: http://localhost:5174"
echo "   2. Click 'Register' (if new user)"
echo "   3. Go to 'Settings' → 'Business Profile'"
echo "   4. Enter WhatsApp credentials from Meta Console"
echo "   5. Click 'Save & Verify'"
echo ""
echo "📱 Then test from any phone:"
echo "   Send WhatsApp message to your business number"
echo "   AI will respond automatically!"
echo ""
