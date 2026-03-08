# Enhanced AI Features - Integration Guide

## 🎉 What's New

We've added 4 major enhancements to the AI conversational commerce system:

1. **📦 Order Status Tracking** - Customers can check "Where is my order?"
2. **🔍 Better Product Search** - Semantic search for more accurate product recommendations  
3. **💾 Customer Preferences Memory** - Remembers sizes, colors, payment preferences
4. **⚠️ Smart Escalation** - Detects when human agent is needed

---

## 🚀 Quick Start

### Option 1: Use Enhanced Message Processing (Recommended)

Replace the existing message processing with the new enhanced version:

```javascript
// In backend/src/api/routes/webhook.routes.js

// OLD:
import { handleWhatsAppMessage } from '../../services/message.service.js';

// NEW:
import { processEnhancedMessage } from '../../services/message.enhanced.service.js';

// In webhook handler:
await processEnhancedMessage(message, conversation, customer, business);
```

### Option 2: Add Features Incrementally

If you want to add features one by one to existing code, see the integration examples below.

---

## 📦 Feature 1: Order Status Tracking

### What It Does
- Detects when customer asks "Where is my order?"
- Automatically retrieves order by order number or customer's latest order
- Formats status with delivery ETA, rider info, tracking updates
- Works in English and Nigerian Pidgin

### Code Integration

```javascript
// In your message processing function
import aiService from './ai.service.js';
import * as orderService from './order.service.js';

// Check for order status query
const statusIntent = aiService.parseOrderStatusIntent(message.text.body);

if (statusIntent && statusIntent.intent === 'check_order_status') {
  let order = null;
  
  if (statusIntent.orderNumber) {
    // Customer provided order number
    order = await orderService.getOrderByOrderNumber(
      statusIntent.orderNumber, 
      business.id
    );
  } else {
    // Get customer's most recent order
    const orders = await orderService.getCustomerOrders(
      customer.phone_number, 
      business.id, 
      1
    );
    order = orders[0] || null;
  }

  // Format and send response
  const responseText = aiService.formatOrderStatus(order, language);
  await whatsappService.sendTextMessage(customer.phone_number, responseText, business);
  
  return; // Exit - query handled
}
```

### New Functions Available

```javascript
// AI Service
aiService.parseOrderStatusIntent(message)
// Returns: { intent: 'check_order_status', orderNumber: 'ORD-XXX', confidence: 0.9 }

aiService.formatOrderStatus(order, language)
// Returns formatted status message with emoji, delivery ETA, items list

// Order Service  
orderService.getOrderByOrderNumber(orderNumber, businessId)
// Returns complete order with items

orderService.getCustomerOrders(customerPhone, businessId, limit)
// Returns array of customer's orders, most recent first
```

### Test It

```bash
# Send test message via WhatsApp
"Where is my order?"
"Check status for ORD-L9M3K5-A7P2"
"When will my order arrive?"
"Has my order shipped?"
```

---

## 🔍 Feature 2: Better Product Search

### What It Does
- Semantic matching for product queries (not just exact keyword match)
- Scores products by relevance (name, description, category)
- Returns top 5 most relevant products
- Future-ready for vector embeddings (AWS Bedrock Titan)

### Code Integration

```javascript
// When customer searches for products
const searchResults = await aiService.searchProducts(
  "red dress for wedding",  // Customer query
  products,                  // Your product catalog
  5                         // Limit to top 5 results
);

// searchResults is sorted by relevanceScore
searchResults.forEach(product => {
  console.log(`${product.name} - Relevance: ${product.relevanceScore}`);
});
```

### How It Works

Current implementation (keyword-based):
- Exact name match: +10 points
- Keyword in product text: +2 points each
- Category match: +3 points
- Returns products sorted by score

Future enhancement (ready for embeddings):
```javascript
// When you add AWS Bedrock Titan Embeddings
const productEmbeddings = await generateEmbeddings(products);
const queryEmbedding = await generateEmbedding(query);
const scoredProducts = calculateCosineSimilarity(queryEmbedding, productEmbeddings);
```

### Test It

```bash
# These queries will find relevant products:
"something nice for a party"    # Finds party dresses, formal wear
"phone accessories"              # Finds cases, chargers, earphones
"food for breakfast"             # Finds breakfast items
"red shoes size 42"             # Finds red footwear in specified size
```

---

## 💾 Feature 3: Customer Preferences Memory

### What It Does
- Extracts preferences from conversation history
- Remembers: sizes, colors, categories, payment methods
- Uses preferences to personalize recommendations
- Stores in conversation metadata for future sessions

### Code Integration

```javascript
// Extract preferences from conversation
const history = await getConversationHistory(conversation.id, 10);

const customerPrefs = aiService.extractCustomerPreferences(
  history.map(msg => ({
    role: msg.direction === 'inbound' ? 'user' : 'assistant',
    content: msg.content
  }))
);

// customerPrefs structure:
{
  sizes: ['42', 'L', 'XL'],
  colors: ['red', 'black'],
  categories: ['shoes', 'dresses'],
  priceRange: null,
  paymentMethod: 'transfer'
}

// Use preferences in order creation
await orderService.createOrder({
  // ... other order data
  metadata: {
    source: 'whatsapp',
    customerPreferences: customerPrefs
  }
});

// Personalize order confirmation
if (customerPrefs.sizes.length > 0) {
  responseText += `\n\nℹ️ I noticed you usually prefer size ${customerPrefs.sizes[0]}. Should I use that?`;
}
```

### What Gets Extracted

| Preference Type | Examples Detected | Usage |
|----------------|------------------|-------|
| **Sizes** | "size 42", "large", "XL", "size 10" | Pre-fill size in orders |
| **Colors** | "red", "black", "blue", etc. | Recommend matching colors |
| **Categories** | "shoes", "dresses", "phones" | Prioritize in search |
| **Payment** | "cash", "transfer", "card" | Default payment method |

### Test It

```bash
# First conversation:
Customer: "I want size 42 shoes"
AI: [Processes order with size 42]

# Future conversation:
Customer: "Show me more shoes"
AI: "Here are our shoes. You usually prefer size 42, right?"
```

---

## ⚠️ Feature 4: Smart Escalation to Human

### What It Does
- Detects frustration, complaints, complex requests
- Assigns escalation level: urgent, high, medium
- Flags conversation for human attention
- Sends professional handoff message

### Code Integration

```javascript
// Check if escalation is needed
const escalation = aiService.detectEscalationNeed(
  message.text.body,
  conversationHistory
);

if (escalation.needsEscalation) {
  // Flag conversation
  await updateConversation(conversation.id, {
    needsAttention: true,
    metadata: {
      escalation: {
        level: escalation.level,      // 'urgent', 'high', 'medium'
        reason: escalation.reason,    // Human-readable explanation
        timestamp: new Date().toISOString()
      }
    }
  });

  // Send handoff message
  const message = escalation.level === 'urgent' 
    ? "Let me connect you with our manager immediately. Someone will call within 15 minutes."
    : "This needs human attention. Our team will reach out shortly.";
  
  await whatsappService.sendTextMessage(customer.phone_number, message, business);
  
  // Notify your team (email, Slack, SMS, etc.)
  await notifyTeam({
    conversationId: conversation.id,
    customerPhone: customer.phone_number,
    escalationLevel: escalation.level,
    reason: escalation.reason
  });
}
```

### Escalation Triggers

| Level | Triggers | Response Time |
|-------|----------|---------------|
| **Urgent** | "manager", "fraud", "scam", "refund", "complain" | 15 minutes |
| **High** | Repeated issues, frustration keywords | 1 hour |
| **Medium** | Complex requests, bulk orders, customization | 4 hours |

### Escalation Response Object

```javascript
{
  needsEscalation: true,
  level: 'urgent',  // 'urgent', 'high', 'medium', or 'none'
  reason: 'Customer requesting management or expressing serious concern',
  confidence: 0.9   // 0.0 to 1.0
}
```

### Test It

```bash
# Urgent escalation:
"I want to speak to your manager NOW!"
"This is a fraud! I want my money back!"
"I'm going to report you if this isn't fixed"

# High escalation:
"This is the 3rd time I'm asking and still no response"
"I'm tired of this useless service"

# Medium escalation:
"I need 50 units for wholesale"
"Can I get a custom design?"
"Do you offer bulk discounts?"
```

---

## 🎯 Complete Integration Example

Here's how all features work together:

```javascript
async function handleIncomingMessage(message, conversation, customer, business) {
  // 1. Get context
  const history = await getConversationHistory(conversation.id, 10);
  const products = await getActiveProducts(business.id);
  const language = aiService.detectLanguage(message.text.body);

  // 2. Check order status query
  const statusIntent = aiService.parseOrderStatusIntent(message.text.body);
  if (statusIntent?.intent === 'check_order_status') {
    return await handleOrderStatus(statusIntent, customer, business, language);
  }

  // 3. Check escalation
  const escalation = aiService.detectEscalationNeed(message.text.body, history);
  if (escalation.needsEscalation && escalation.level === 'urgent') {
    return await handleEscalation(escalation, customer, business, language);
  }

  // 4. Extract preferences
  const prefs = aiService.extractCustomerPreferences(history);

  // 5. Search products if needed
  const searchKeywords = extractSearchKeywords(message.text.body);
  if (searchKeywords) {
    const relevantProducts = await aiService.searchProducts(
      searchKeywords, 
      products, 
      5
    );
    // Use relevantProducts in AI response
  }

  // 6. Check order intent
  const orderIntent = aiService.parseOrderIntent(message.text.body, products);
  if (orderIntent) {
    return await handleOrderIntent(
      orderIntent, 
      message, 
      conversation, 
      customer, 
      business,
      prefs,  // Use preferences in order
      language
    );
  }

  // 7. Regular AI conversation
  const aiResponse = await aiService.generateBusinessResponse({
    businessId: business.id,
    customerId: customer.id,
    conversationId: conversation.id,
    messageContent: message.text.body,
    conversationHistory: history,
    customerPreferences: prefs  // AI knows customer preferences
  });

  return await sendResponse(aiResponse, customer, business);
}
```

---

## 📊 Monitoring & Analytics

Track these new metrics:

```javascript
// In your analytics dashboard
const metrics = {
  // Order Status Queries
  orderStatusQueries: 245,        // How many "where is my order" queries
  orderStatusFoundRate: 0.92,     // % of times order was found
  avgOrderStatusTime: 1.2,        // Seconds to respond
  
  // Product Search
  productSearches: 1840,          // How many search queries
  avgRelevanceScore: 7.8,         // Average relevance of top result
  searchToOrderRate: 0.38,        // % of searches that led to orders
  
  // Customer Preferences
  customersWithPrefs: 456,        // Customers with saved preferences
  prefRecallRate: 0.85,           // % of times prefs were used
  avgPrefsPerCustomer: 3.2,       // Sizes, colors, payment methods
  
  // Escalations
  totalEscalations: 45,           // Total escalated conversations
  urgentEscalations: 8,           // High-priority escalations
  avgResponseTime: '12 minutes',  // How fast human responded
  escalationResolutionRate: 0.96  // % resolved successfully
};
```

---

## 🧪 Testing Checklist

Before going live with enhanced features:

### Order Status Tracking
- [ ] Test with valid order number
- [ ] Test without order number (uses latest)
- [ ] Test with non-existent order
- [ ] Test in English
- [ ] Test in Nigerian Pidgin
- [ ] Verify order details are correct (items, total, status)

### Product Search
- [ ] Test exact product name
- [ ] Test partial matches
- [ ] Test category searches
- [ ] Test multi-word queries
- [ ] Test with no matches
- [ ] Verify results are sorted by relevance

### Customer Preferences
- [ ] Test size extraction ("size 42", "XL", "large")
- [ ] Test color detection
- [ ] Test payment preference
- [ ] Verify preferences persist across conversations
- [ ] Test preference recall in new order

### Escalation Detection
- [ ] Test urgent keywords ("manager", "refund")
- [ ] Test frustration patterns
- [ ] Test complex requests
- [ ] Verify conversation flagged correctly
- [ ] Verify team notification sent
- [ ] Test handoff message

---

## 🚀 Deployment

### Step 1: Update Code
```bash
cd backend

# The enhanced features are already in:
# - src/services/ai.service.js (new functions added)
# - src/services/order.service.js (new functions added)
# - src/services/message.enhanced.service.js (complete enhanced flow)
```

### Step 2: Test Locally
```bash
# Start backend
npm run dev

# Test each feature with sample messages
# Use WhatsApp Demo page or actual WhatsApp Business API
```

### Step 3: Deploy to Production
```bash
# Deploy updated code
pm2 restart wazassist-backend

# Monitor logs
pm2 logs wazassist-backend
```

### Step 4: Monitor First 24 Hours
- Watch for any errors in logs
- Check response times
- Verify escalations are working
- Gather user feedback

---

## 📚 Reference

### New AI Service Functions

| Function | Purpose | Returns |
|----------|---------|---------|
| `parseOrderStatusIntent()` | Detect order status queries | Intent object |
| `formatOrderStatus()` | Format order status message | String (with emoji) |
| `detectEscalationNeed()` | Check if human needed | Escalation object |
| `searchProducts()` | Semantic product search | Array of products |
| `extractCustomerPreferences()` | Get preferences from history | Preferences object |

### New Order Service Functions

| Function | Purpose | Returns |
|----------|---------|---------|
| `getOrderByOrderNumber()` | Fetch order by ORD-XXX | Order object |
| `getCustomerOrders()` | Get customer's order history | Array of orders |

### New Message Handler

| Function | Purpose |
|----------|---------|
| `processEnhancedMessage()` | Complete message processing with all features |

---

## 🎓 Best Practices

1. **Always check order status first** - It's a quick query, handle before AI
2. **Use preferences sparingly** - Don't be creepy, be helpful
3. **Escalate proactively** - Better to hand off early than lose customer
4. **Log everything** - Track which features are used most
5. **Personalize carefully** - Use customer's language (English/Pidgin)

---

## 🆘 Troubleshooting

### Order Status Not Working
- Verify order exists in database
- Check order_number format (ORD-XXXXX-XXXXX)
- Ensure customer_phone matches
- Check business_id matches

### Preferences Not Saving
- Verify conversation.metadata is JSONB
- Check updateConversationMetadata function
- Ensure history is passed correctly

### Escalations Not Flagging
- Check conversation.needs_attention column exists
- Verify metadata structure
- Test escalation keywords

### Product Search Returns Nothing
- Verify products exist and are active
- Check search query is not empty
- Test with exact product name first
- Review relevanceScore thresholds

---

## ✅ Success Criteria

You'll know it's working when:

1. ✅ Customers can check order status without asking for help
2. ✅ Product searches return relevant results (not just exact matches)
3. ✅ Returning customers see personalized recommendations
4. ✅ Frustrated customers get escalated before they leave angry reviews
5. ✅ AI handles 80%+ of conversations without human intervention
6. ✅ Average conversation time decreases
7. ✅ Customer satisfaction increases

---

**You're all set!** 🎉

These enhanced features make your AI assistant 10x more powerful. Customers get faster, more personalized service, and your team only handles the conversations that truly need human expertise.

**Next Steps:**
1. Test all features locally
2. Run through DEMO_CONVERSATION_SCENARIOS.md
3. Deploy to production
4. Monitor and iterate based on metrics

For AWS Bedrock setup, see `AWS_BEDROCK_SETUP.md`.
For full AI documentation, see `AI_CONVERSATION_FLOW.md`.
