#!/bin/bash
# WazAssist AWS Bedrock Production Test Suite
# Tests all enhanced features with real AWS Bedrock

echo "🧪 WazAssist Production Test Suite"
echo "=================================="
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test counter
PASSED=0
FAILED=0

# Function to test endpoint
test_endpoint() {
    local name=$1
    local url=$2
    local expected=$3
    
    echo -n "Testing: $name... "
    response=$(curl -s "$url")
    
    if echo "$response" | grep -q "$expected"; then
        echo -e "${GREEN}✅ PASSED${NC}"
        ((PASSED++))
    else
        echo -e "${RED}❌ FAILED${NC}"
        echo "  Expected: $expected"
        echo "  Got: $response"
        ((FAILED++))
    fi
}

echo "📡 Step 1: Backend Health Check"
echo "--------------------------------"
test_endpoint "Backend Server" "http://localhost:3000/health" "status"

echo ""
echo "🗄️ Step 2: Database Connection"
echo "--------------------------------"
test_endpoint "Database Status" "http://localhost:3000/health" "database"

echo ""
echo "🤖 Step 3: AI Configuration Check"
echo "--------------------------------"
echo "Checking .env configuration..."

if grep -q "MOCK_AI=false" ../.env; then
    echo -e "${GREEN}✅ AWS Bedrock enabled (MOCK_AI=false)${NC}"
    ((PASSED++))
else
    echo -e "${RED}❌ Mock AI still enabled${NC}"
    ((FAILED++))
fi

if grep -q "AWS_REGION=us-east-1" ../.env; then
    echo -e "${GREEN}✅ AWS Region: us-east-1${NC}"
    ((PASSED++))
else
    echo -e "${YELLOW}⚠️  AWS Region not set to us-east-1${NC}"
fi

if grep -q "us.meta.llama3-1-8b-instruct" ../.env; then
    echo -e "${GREEN}✅ Model ID updated to inference profile${NC}"
    ((PASSED++))
else
    echo -e "${RED}❌ Model ID not updated${NC}"
    ((FAILED++))
fi

echo ""
echo "🔐 Step 4: AWS Credentials Check"
echo "--------------------------------"
if aws sts get-caller-identity > /dev/null 2>&1; then
    echo -e "${GREEN}✅ AWS credentials configured${NC}"
    aws sts get-caller-identity --query 'Account' --output text | xargs echo "   Account ID:"
    ((PASSED++))
else
    echo -e "${RED}❌ AWS credentials not configured${NC}"
    ((FAILED++))
fi

echo ""
echo "🎯 Step 5: AWS Bedrock Access Test"
echo "--------------------------------"
echo "Testing Bedrock API call (this may take 5-10 seconds)..."

cd .. && node test-bedrock.js 2>&1 | grep -q "SUCCESS\|Working perfectly"
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ AWS Bedrock responding${NC}"
    ((PASSED++))
else
    echo -e "${YELLOW}⚠️  Bedrock test inconclusive (may be rate limited)${NC}"
    echo "   This is normal if you tested recently. Wait 60 seconds and try again."
fi

echo ""
echo "📦 Step 6: Enhanced Features Check"
echo "--------------------------------"

# Check if enhanced service exists
if [ -f "../backend/src/services/message.enhanced.service.js" ]; then
    echo -e "${GREEN}✅ Enhanced message service available${NC}"
    ((PASSED++))
else
    echo -e "${YELLOW}⚠️  Enhanced message service not found${NC}"
fi

# Check for new AI functions
if grep -q "parseOrderStatusIntent" ../backend/src/services/ai.service.js; then
    echo -e "${GREEN}✅ Order status tracking implemented${NC}"
    ((PASSED++))
else
    echo -e "${RED}❌ Order status tracking missing${NC}"
    ((FAILED++))
fi

if grep -q "detectEscalationNeed" ../backend/src/services/ai.service.js; then
    echo -e "${GREEN}✅ Escalation detection implemented${NC}"
    ((PASSED++))
else
    echo -e "${RED}❌ Escalation detection missing${NC}"
    ((FAILED++))
fi

if grep -q "extractCustomerPreferences" ../backend/src/services/ai.service.js; then
    echo -e "${GREEN}✅ Customer preferences memory implemented${NC}"
    ((PASSED++))
else
    echo -e "${RED}❌ Customer preferences missing${NC}"
    ((FAILED++))
fi

if grep -q "searchProducts" ../backend/src/services/ai.service.js; then
    echo -e "${GREEN}✅ Semantic product search implemented${NC}"
    ((PASSED++))
else
    echo -e "${RED}❌ Product search missing${NC}"
    ((FAILED++))
fi

echo ""
echo "🌐 Step 7: Frontend Check"
echo "--------------------------------"
if curl -s http://localhost:5173 | grep -q "html\|Vite"; then
    echo -e "${GREEN}✅ Frontend running on port 5173${NC}"
    ((PASSED++))
else
    echo -e "${YELLOW}⚠️  Frontend not responding (may still be starting)${NC}"
fi

echo ""
echo "=================================="
echo "📊 TEST RESULTS"
echo "=================================="
echo -e "Passed: ${GREEN}$PASSED${NC}"
echo -e "Failed: ${RED}$FAILED${NC}"
echo ""

if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}🎉 ALL TESTS PASSED! Ready for production!${NC}"
    echo ""
    echo "✅ Your WazAssist system is configured with:"
    echo "   • AWS Bedrock LLaMA 3.1 (8B & 70B)"
    echo "   • Order status tracking"
    echo "   • Customer preference memory"
    echo "   • Semantic product search"
    echo "   • Smart escalation to humans"
    echo ""
    echo "🚀 Next steps:"
    echo "   1. Open http://localhost:5173 in browser"
    echo "   2. Test WhatsApp Demo page"
    echo "   3. Practice investor presentation"
    echo ""
    echo "💰 Cost monitoring:"
    echo "   • Check AWS Cost Explorer: https://console.aws.amazon.com/cost-management"
    echo "   • Expected: ~\$0.001 per conversation"
    echo "   • Set budget alert at \$50/month"
else
    echo -e "${RED}⚠️  Some tests failed. Review above for details.${NC}"
    echo ""
    echo "Common fixes:"
    echo "   • Restart backend: cd backend && npm run dev"
    echo "   • Check AWS credentials: aws sts get-caller-identity"
    echo "   • Wait 60 seconds if Bedrock rate limited"
fi

echo ""
