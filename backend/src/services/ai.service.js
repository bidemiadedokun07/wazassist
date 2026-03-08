import { BedrockRuntimeClient, InvokeModelCommand } from '@aws-sdk/client-bedrock-runtime';
import OpenAI from 'openai';
import { config } from '../config/index.js';
import { logger } from '../utils/logger.js';
import { query } from '../config/database.js';

/**
 * AI Service using Amazon Bedrock and OpenAI
 * Handles all LLM interactions with LLaMA 3.1 or GPT-4
 */
class AIService {
  constructor() {
    // Initialize OpenAI if API key is available
    if (config.openai && config.openai.apiKey) {
      this.openai = new OpenAI({
        apiKey: config.openai.apiKey
      });
      this.useOpenAI = true;
      logger.info('✅ OpenAI initialized');
    }

    // Initialize Bedrock when not in mock mode.
    // If static keys are not provided, SDK default credential provider chain is used
    // (EC2 instance profile / IAM role / environment / shared config).
    if (!config.mockAi) {
      const clientConfig = { region: config.aws.region };

      if (config.aws.accessKeyId && config.aws.secretAccessKey) {
        clientConfig.credentials = {
          accessKeyId: config.aws.accessKeyId,
          secretAccessKey: config.aws.secretAccessKey
        };
      }

      this.client = new BedrockRuntimeClient(clientConfig);
      logger.info('✅ AWS Bedrock initialized');
    }

    this.model8b = config.bedrock?.model8b;
    this.model70b = config.bedrock?.model70b;
  }

  /**
   * Generate AI response
   */
  async generateResponse(prompt, options = {}) {
    const startTime = Date.now();

    try {
      // Use OpenAI if available (priority)
      if (this.useOpenAI && this.openai) {
        return await this.generateOpenAIResponse(prompt, options, startTime);
      }

      // Mock mode for development without AWS/OpenAI
      if (config.mockAi || (!this.client && !this.openai)) {
        logger.info('🤖 [MOCK] Generating AI response');
        await new Promise(resolve => setTimeout(resolve, 500)); // Simulate delay

        return {
          response: this.getMockResponse(prompt, options),
          model: 'mock-llama3-1-8b',
          tokensUsed: 150,
          processingTime: 500
        };
      }

      // Choose model based on complexity
      const modelId = options.useAdvanced ? this.model70b : this.model8b;

      // Prepare the prompt for LLaMA 3.1
      const formattedPrompt = this.formatPrompt(prompt, options);

      // Invoke Bedrock
      const command = new InvokeModelCommand({
        modelId: modelId,
        contentType: 'application/json',
        accept: 'application/json',
        body: JSON.stringify({
          prompt: formattedPrompt,
          max_gen_len: options.maxTokens || config.bedrock?.maxTokens || 1000,
          temperature: options.temperature || config.bedrock?.temperature || 0.7,
          top_p: 0.9
        })
      });

      const response = await this.client.send(command);
      const responseBody = JSON.parse(new TextDecoder().decode(response.body));

      const processingTime = Date.now() - startTime;

      logger.info('✅ AI response generated', {
        model: modelId,
        tokensUsed: responseBody.prompt_token_count + responseBody.generation_token_count,
        processingTime
      });

      return {
        response: responseBody.generation.trim(),
        model: modelId,
        tokensUsed: responseBody.prompt_token_count + responseBody.generation_token_count,
        processingTime
      };
    } catch (error) {
      logger.error('❌ AI generation failed', {
        error: error.message,
        processingTime: Date.now() - startTime
      });

      // Return fallback response
      if (config.ai?.fallbackEnabled) {
        return {
          response: config.ai.fallbackMessage,
          model: 'fallback',
          tokensUsed: 0,
          processingTime: Date.now() - startTime,
          error: true
        };
      }

      throw error;
    }
  }

  /**
   * Generate response using OpenAI
   */
  async generateOpenAIResponse(prompt, options = {}, startTime) {
    try {
      const messages = this.formatOpenAIMessages(prompt, options);

      const completion = await this.openai.chat.completions.create({
        model: config.openai.model || 'gpt-4',
        messages,
        max_tokens: options.maxTokens || config.openai.maxTokens || 1000,
        temperature: options.temperature || 0.7,
        presence_penalty: 0.6,
        frequency_penalty: 0.3
      });

      const response = completion.choices[0].message.content;
      const tokensUsed = completion.usage.total_tokens;
      const processingTime = Date.now() - startTime;

      logger.info('✅ OpenAI response generated', {
        model: config.openai.model,
        tokensUsed,
        processingTime
      });

      return {
        response,
        model: config.openai.model || 'gpt-4',
        tokensUsed,
        processingTime
      };
    } catch (error) {
      logger.error('❌ OpenAI generation failed', {
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Format messages for OpenAI chat API
   */
  formatOpenAIMessages(userMessage, options = {}) {
    const systemPrompt = options.systemPrompt || this.getSystemPrompt(options.language);
    const conversationHistory = options.conversationHistory || [];

    const messages = [
      { role: 'system', content: systemPrompt }
    ];

    // Add conversation history
    if (conversationHistory.length > 0) {
      conversationHistory.forEach(msg => {
        messages.push({
          role: msg.role === 'user' ? 'user' : 'assistant',
          content: msg.content
        });
      });
    }

    // Add current message
    messages.push({ role: 'user', content: userMessage });

    return messages;
  }

  /**
   * Format prompt for LLaMA 3.1
   */
  formatPrompt(userMessage, options = {}) {
    const systemPrompt = options.systemPrompt || this.getSystemPrompt(options.language);
    const conversationHistory = options.conversationHistory || [];

    // Build conversation context
    let prompt = `${systemPrompt}\n\n`;

    // Add conversation history
    if (conversationHistory.length > 0) {
      prompt += 'Previous conversation:\n';
      conversationHistory.forEach(msg => {
        prompt += `${msg.role === 'user' ? 'Customer' : 'Assistant'}: ${msg.content}\n`;
      });
      prompt += '\n';
    }

    // Add current message
    prompt += `Customer: ${userMessage}\nAssistant:`;

    return prompt;
  }

  /**
   * Get system prompt based on language
   */
  getSystemPrompt(language = 'en') {
    const prompts = {
      en: `You are a helpful WhatsApp Business Assistant for a Nigerian SME. You help customers:
- Ask about products and prices
- Place orders
- Track deliveries
- Answer questions

Be friendly, professional, and concise. Use simple language. Always be helpful.`,

      pidgin: `You be helpful WhatsApp Business Assistant for Nigerian business. You dey help customers:
- Ask about products and how much e cost
- Order things
- Check where their package dey
- Answer questions

Be friendly, professional, and no dey talk too long. Use simple words wey everybody go understand.`,

      yoruba: `O jẹ́ olùrànlọ́wọ́ WhatsApp Business fún ilé-iṣẹ́ kan ní Nàìjíríà. O ń ran àwọn oníbàárà lọ́wọ́:
- Béèrè nípa àwọn ọjà àti iye owó wọn
- Ṣe àtúnṣe
- Wo ìgbéjáde
- Dahùn àwọn ìbéèrè

Jẹ́ ọ̀rẹ́, jẹ́ alábòójútó, kí o sì ṣe díẹ̀díẹ̀. Lo èdè tó rọrùn.`,

      igbo: `Ị bụ onye inyeaka WhatsApp Business maka azụmaahịa Naịjirịa. Ị na-enyere ndị ahịa aka:
- Jụọ maka ngwaahịa na ọnụ ahịa ha
- Tinye iwu
- Lelee nnyefe
- Zaghachi ajụjụ

Bụrụ enyi, bụrụ ọkachamara, ma bụrụ nkenke. Jiri okwu dị mfe.`,

      hausa: `Kai mai taimako ne na WhatsApp Business don kasuwancin Najeriya. Kana taimakawa abokan ciniki:
- Tambaya game da kayayyaki da farashinsu
- Sanya oda
- Bincika isar da kayayyaki
- Amsa tambayoyi

Ka kasance aboki, ƙwararru, kuma taƙaice. Yi amfani da sauƙaƙan kalmomi.`
    };

    return prompts[language] || prompts.en;
  }

  /**
   * Mock response for development (enhanced with product awareness)
   */
  getMockResponse(prompt, options = {}) {
    const lowerPrompt = prompt.toLowerCase();
    const products = options.products || [];

    // Product queries with product context
    if (lowerPrompt.includes('price') || lowerPrompt.includes('cost') || lowerPrompt.includes('how much')) {
      if (products.length > 0) {
        const productList = products.slice(0, 3).map(p =>
          `- ${p.name}: ₦${p.price.toLocaleString()}`
        ).join('\n');
        return `Here are some of our available products:\n\n${productList}\n\nWhich one interests you?`;
      }
      return "I can help you with pricing! We have various products available. Could you tell me which specific product you're interested in?";
    }

    // Specific product search (Nike, Adidas, etc.)
    if (lowerPrompt.includes('nike') || lowerPrompt.includes('adidas') || lowerPrompt.includes('shoe') || lowerPrompt.includes('sneaker')) {
      if (products.length > 0) {
        const footwear = products.filter(p => p.category === 'footwear' || lowerPrompt.includes(p.name.toLowerCase()));
        if (footwear.length > 0) {
          const productList = footwear.slice(0, 3).map(p =>
            `- ${p.name}: ₦${p.price.toLocaleString()} (${p.quantity_in_stock} in stock)`
          ).join('\n');
          return `Yes, we have these shoes available:\n\n${productList}\n\nWould you like to place an order?`;
        }
      }
      return "Let me check our shoe collection for you. We have Nike, Adidas, and Puma sneakers available. Which brand do you prefer?";
    }

    // Order queries
    if (lowerPrompt.includes('order') || lowerPrompt.includes('buy')) {
      return "Great! I can help you place an order. What would you like to order today?";
    }

    // Delivery queries
    if (lowerPrompt.includes('deliver') || lowerPrompt.includes('shipping') || lowerPrompt.includes('track')) {
      return "I can help you track your order. Please provide your order number and I'll check the status for you.";
    }

    // Greeting
    if (lowerPrompt.includes('hello') || lowerPrompt.includes('hi') || lowerPrompt.includes('hey')) {
      return "Hello! Welcome to our store. How can I help you today?";
    }

    // Pidgin responses
    if (lowerPrompt.includes('wetin') || lowerPrompt.includes('how far')) {
      return "Hello! I dey here to help you. Wetin you wan buy today?";
    }

    // Pidgin product query
    if (lowerPrompt.includes('wan buy') || lowerPrompt.includes('i want')) {
      if (products.length > 0) {
        return `I fit help you! We get these products:\n\n${products.slice(0, 3).map(p =>
          `- ${p.name}: ₦${p.price.toLocaleString()}`
        ).join('\n')}\n\nWhich one you wan?`;
      }
    }

    // Default response
    return "Thank you for your message! I'm here to help you with product information, orders, and delivery tracking. What can I assist you with?";
  }

  /**
   * Detect language from message
   */
  detectLanguage(message) {
    const lowerMessage = message.toLowerCase();

    // Pidgin indicators
    if (lowerMessage.match(/\b(wetin|dey|na|abeg|oya|shey)\b/)) {
      return 'pidgin';
    }

    // Yoruba indicators
    if (lowerMessage.match(/\b(ẹ|ọ|bawo|dẹkun|jọwọ)\b/)) {
      return 'yoruba';
    }

    // Igbo indicators
    if (lowerMessage.match(/\b(kedu|biko|ndewo|nnọọ)\b/)) {
      return 'igbo';
    }

    // Hausa indicators
    if (lowerMessage.match(/\b(yaya|sanu|don|allah)\b/)) {
      return 'hausa';
    }

    // Default to English
    return 'en';
  }

  /**
   * Extract intent from message
   */
  extractIntent(message) {
    const lowerMessage = message.toLowerCase();

    if (lowerMessage.match(/\b(price|cost|how much|wetin be)\b/)) {
      return 'product_inquiry';
    }

    if (lowerMessage.match(/\b(order|buy|wan buy|purchase)\b/)) {
      return 'place_order';
    }

    if (lowerMessage.match(/\b(track|deliver|shipping|where|dey)\b/)) {
      return 'track_order';
    }

    if (lowerMessage.match(/\b(hello|hi|hey|good morning|good afternoon)\b/)) {
      return 'greeting';
    }

    return 'general_inquiry';
  }

  /**
   * Parse order intent from message
   * Returns structured order data if order intent is detected
   */
  parseOrderIntent(message, products = []) {
    const lowerMessage = message.toLowerCase();

    // Check if message contains order intent
    const hasOrderIntent = lowerMessage.match(/\b(order|buy|wan buy|purchase|get|take)\b/);
    if (!hasOrderIntent) {
      return null;
    }

    // Try to extract product names and quantities
    const orderItems = [];

    // Match patterns like "2 Nike shoes", "1 Adidas", "3x Puma"
    const quantityPatterns = [
      /(\d+)\s*x?\s*([a-zA-Z\s]+)/gi,  // "2 Nike", "2x Nike"
      /([a-zA-Z\s]+)\s*x\s*(\d+)/gi     // "Nike x 2"
    ];

    for (const pattern of quantityPatterns) {
      let match;
      while ((match = pattern.exec(message)) !== null) {
        const quantity = parseInt(match[1]);
        const productName = match[2].trim();

        // Try to find matching product
        const matchedProduct = products.find(p =>
          p.name.toLowerCase().includes(productName.toLowerCase()) ||
          productName.toLowerCase().includes(p.name.toLowerCase())
        );

        if (matchedProduct && !orderItems.find(item => item.productId === matchedProduct.id)) {
          orderItems.push({
            productId: matchedProduct.id,
            productName: matchedProduct.name,
            quantity: quantity || 1,
            unitPrice: parseFloat(matchedProduct.price)
          });
        }
      }
    }

    // If no explicit quantities, look for product names mentioned
    if (orderItems.length === 0) {
      for (const product of products) {
        if (lowerMessage.includes(product.name.toLowerCase())) {
          orderItems.push({
            productId: product.id,
            productName: product.name,
            quantity: 1,
            unitPrice: parseFloat(product.price)
          });
          break; // Only add first match
        }
      }
    }

    // Return parsed order if items found
    if (orderItems.length > 0) {
      return {
        intent: 'place_order',
        items: orderItems,
        confidence: orderItems.length > 0 ? 0.8 : 0.5
      };
    }

    return null;
  }

  /**
   * Parse order status query intent
   * Detects when customer wants to check their order status
   */
  parseOrderStatusIntent(message) {
    const lowerMessage = message.toLowerCase();

    // Status check keywords
    const statusKeywords = [
      'where', 'my order', 'order status', 'track', 'delivery',
      'when', 'arrive', 'reach', 'location', 'eta', 'don reach',
      'wetin dey happen', 'order number', 'tracking'
    ];

    const hasStatusIntent = statusKeywords.some(keyword => 
      lowerMessage.includes(keyword)
    );

    if (!hasStatusIntent) {
      return null;
    }

    // Try to extract order number (ORD-XXXXX-XXXX format)
    const orderNumberMatch = message.match(/ORD-[A-Z0-9]+-[A-Z0-9]+/i);
    
    return {
      intent: 'check_order_status',
      orderNumber: orderNumberMatch ? orderNumberMatch[0].toUpperCase() : null,
      confidence: orderNumberMatch ? 0.9 : 0.6
    };
  }

  /**
   * Detect when human escalation is needed
   * Returns escalation level and reason
   */
  detectEscalationNeed(message, conversationHistory = []) {
    const lowerMessage = message.toLowerCase();

    // Escalation triggers
    const urgentKeywords = ['manager', 'boss', 'complain', 'fraud', 'scam', 'angry', 'refund', 'cancel'];
    const frustrationKeywords = ['still', 'again', 'tired', 'fed up', 'useless', 'stupid', 'waste'];
    const complexKeywords = ['custom', 'special', 'bulk', 'wholesale', 'negotiate', 'discount'];

    // Check for urgent escalation
    if (urgentKeywords.some(kw => lowerMessage.includes(kw))) {
      return {
        needsEscalation: true,
        level: 'urgent',
        reason: 'Customer requesting management or expressing serious concern',
        confidence: 0.9
      };
    }

    // Check for frustration (repeated issues)
    if (frustrationKeywords.some(kw => lowerMessage.includes(kw))) {
      const repeatCount = conversationHistory.filter(msg => 
        msg.role === 'user' && msg.content.toLowerCase().includes('problem')
      ).length;

      if (repeatCount >= 2) {
        return {
          needsEscalation: true,
          level: 'high',
          reason: 'Customer showing frustration with repeated issues',
          confidence: 0.8
        };
      }
    }

    // Check for complex requests
    if (complexKeywords.some(kw => lowerMessage.includes(kw))) {
      return {
        needsEscalation: true,
        level: 'medium',
        reason: 'Customer has complex request needing human judgment',
        confidence: 0.7
      };
    }

    return {
      needsEscalation: false,
      level: 'none',
      reason: null,
      confidence: 1.0
    };
  }

  /**
   * Search products semantically
   * Uses embedding similarity for better matching
   */
  async searchProducts(query, products, limit = 5) {
    // Simple keyword-based search for now
    // TODO: Implement vector embeddings with AWS Bedrock or OpenAI
    const lowerQuery = query.toLowerCase();
    const keywords = lowerQuery.split(' ').filter(w => w.length > 2);

    const scoredProducts = products.map(product => {
      let score = 0;
      const productText = `${product.name} ${product.description || ''} ${product.category || ''}`.toLowerCase();

      // Exact name match
      if (productText.includes(lowerQuery)) {
        score += 10;
      }

      // Keyword matches
      keywords.forEach(keyword => {
        if (productText.includes(keyword)) {
          score += 2;
        }
      });

      // Category match
      if (product.category && lowerQuery.includes(product.category.toLowerCase())) {
        score += 3;
      }

      return { ...product, relevanceScore: score };
    });

    // Return top matches
    return scoredProducts
      .filter(p => p.relevanceScore > 0)
      .sort((a, b) => b.relevanceScore - a.relevanceScore)
      .slice(0, limit);
  }

  /**
   * Generate order confirmation message
   */
  generateOrderConfirmation(order, language = 'en') {
    const total = parseFloat(order.total_amount);
    const itemsList = order.items.map(item =>
      `- ${item.product_name} x${item.quantity} = ₦${parseFloat(item.total).toLocaleString()}`
    ).join('\n');

    const messages = {
      en: `✅ Order confirmed! Here's your order summary:

Order Number: ${order.order_number}
${itemsList}

Total: ₦${total.toLocaleString()}

We'll process your order and contact you shortly for delivery details. Thank you for your order!`,

      pidgin: `✅ Your order don confirm! See your order summary:

Order Number: ${order.order_number}
${itemsList}

Total: ₦${total.toLocaleString()}

We go process your order and contact you soon for delivery details. Thank you!`
    };

    return messages[language] || messages.en;
  }

  /**
   * Generate order request message (asking for confirmation)
   */
  generateOrderRequest(items, language = 'en') {
    const total = items.reduce((sum, item) => sum + (item.unitPrice * item.quantity), 0);
    const itemsList = items.map(item =>
      `- ${item.productName} x${item.quantity} = ₦${(item.unitPrice * item.quantity).toLocaleString()}`
    ).join('\n');

    const messages = {
      en: `I'd like to confirm your order:

${itemsList}

Total: ₦${total.toLocaleString()}

Please reply with:
- Your delivery address
- Preferred payment method (cash/transfer)

Or reply "confirm" if you've ordered with us before and want to use your saved details.`,

      pidgin: `Make I confirm your order:

${itemsList}

Total: ₦${total.toLocaleString()}

Please send:
- Where we go deliver am
- How you wan pay (cash/transfer)

Or just talk "confirm" if you don order from us before and you wan use your saved details.`
    };

    return messages[language] || messages.en;
  }

  /**
   * Generate response with business context (for WhatsApp conversations)
   */
  async generateBusinessResponse(messageData) {
    try {
      const {
        businessId,
        customerId,
        conversationId,
        messageContent,
        conversationHistory = []
      } = messageData;

      // Get business context
      const businessContext = await this.getBusinessContext(businessId);

      // Build enhanced system prompt with business info
      const systemPrompt = this.buildBusinessSystemPrompt(businessContext);

      // Generate response with context
      const result = await this.generateResponse(messageContent, {
        systemPrompt,
        conversationHistory,
        products: businessContext.products,
        language: this.detectLanguage(messageContent)
      });

      // Save AI usage metrics
      await this.saveAIUsageMetrics({
        conversationId,
        messageContent,
        aiResponse: result.response,
        model: result.model,
        tokensUsed: result.tokensUsed,
        businessId
      });

      return result;
    } catch (error) {
      logger.error('❌ Error generating business response', {
        error: error.message,
        businessId: messageData.businessId
      });
      throw error;
    }
  }

  /**
   * Get business context for AI
   */
  async getBusinessContext(businessId) {
    try {
      // Get business info
      const businessResult = await query(
        `SELECT
          business_name,
          description,
          category,
          phone_number,
          email,
          address,
          settings
        FROM businesses
        WHERE id = $1 AND is_active = true`,
        [businessId]
      );

      if (businessResult.rows.length === 0) {
        throw new Error('Business not found');
      }

      const business = businessResult.rows[0];

      // Get active products
      const productsResult = await query(
        `SELECT
          id,
          name,
          description,
          price,
          category,
          quantity_in_stock
        FROM products
        WHERE business_id = $1 AND is_active = true
        ORDER BY name
        LIMIT 50`,
        [businessId]
      );

      const products = productsResult.rows;

      // Get business statistics
      const statsResult = await query(
        `SELECT
          COUNT(DISTINCT o.id) as total_orders,
          COUNT(DISTINCT o.customer_id) as total_customers,
          COALESCE(AVG(o.total_amount), 0) as avg_order_value
        FROM orders o
        WHERE o.business_id = $1
          AND o.created_at >= NOW() - INTERVAL '30 days'`,
        [businessId]
      );

      const stats = statsResult.rows[0];

      return {
        business,
        products,
        stats
      };
    } catch (error) {
      logger.error('❌ Error getting business context', {
        error: error.message,
        businessId
      });
      throw error;
    }
  }

  /**
   * Build system prompt with business context
   */
  buildBusinessSystemPrompt(context) {
    const { business, products, stats } = context;
    const settings = business.settings || {};

    let prompt = `You are an intelligent AI assistant for ${business.business_name}, `;

    if (business.description) {
      prompt += `a business that ${business.description}. `;
    }

    prompt += `\n\nYour role is to help customers by:
1. Answering questions about products and services
2. Helping customers find and select products
3. Assisting with order placement and tracking
4. Providing business information (contact, location, hours)
5. Handling customer inquiries professionally and warmly

BUSINESS INFORMATION:
- Business Name: ${business.business_name}
- Category: ${business.category || 'General'}
- Phone: ${business.phone_number}`;

    if (business.email) {
      prompt += `\n- Email: ${business.email}`;
    }

    if (business.address) {
      prompt += `\n- Address: ${business.address}`;
    }

    // Add business hours if available
    if (settings.business_hours) {
      prompt += `\n- Business Hours: `;
      const hours = settings.business_hours;
      const today = new Date().toLocaleDateString('en-US', { weekday: 'lowercase' });
      if (hours[today]) {
        prompt += `Today (${today}): ${hours[today].open} - ${hours[today].close}`;
      }
    }

    // Add product catalog
    if (products && products.length > 0) {
      prompt += `\n\nAVAILABLE PRODUCTS (${products.length} items):`;
      products.slice(0, 20).forEach((product, index) => {
        prompt += `\n${index + 1}. ${product.name} - ₦${parseFloat(product.price).toLocaleString()}`;
        if (product.category) {
          prompt += ` (${product.category})`;
        }
        if (product.description) {
          prompt += ` - ${product.description.substring(0, 100)}`;
        }
        prompt += ` [Stock: ${product.quantity_in_stock}]`;
      });

      if (products.length > 20) {
        prompt += `\n... and ${products.length - 20} more products`;
      }
    }

    // Add statistics
    if (stats) {
      prompt += `\n\nBUSINESS STATS (Last 30 days):`;
      prompt += `\n- Total Orders: ${stats.total_orders}`;
      prompt += `\n- Total Customers: ${stats.total_customers}`;
      prompt += `\n- Average Order Value: ₦${parseFloat(stats.avg_order_value).toLocaleString()}`;
    }

    prompt += `\n\nCONVERSATION GUIDELINES:
- Be friendly, professional, and helpful
- Use Nigerian English naturally (can mix with Pidgin when appropriate)
- Always confirm order details before processing
- Provide accurate product information
- If you don't know something, admit it and offer to connect with a human
- Keep responses concise but informative
- Use emojis sparingly for a friendly tone
- For order status queries, provide clear tracking information
- If customer seems frustrated, escalate to human agent
- Remember customer preferences from conversation history`;

    return prompt;
  }

  /**
   * Format order status for customer
   */
  formatOrderStatus(order, language = 'en') {
    if (!order) {
      return language === 'pidgin' 
        ? "Sorry, I no fit find dat order. Make you check the order number and try again."
        : "Sorry, I couldn't find that order. Please check the order number and try again.";
    }

    const statusEmojis = {
      pending: '⏳',
      confirmed: '✅',
      processing: '📦',
      ready: '🎉',
      out_for_delivery: '🚚',
      delivered: '✅',
      cancelled: '❌'
    };

    const emoji = statusEmojis[order.status] || '📋';
    const total = parseFloat(order.total_amount).toLocaleString();
    const orderDate = new Date(order.created_at).toLocaleDateString('en-GB');

    // Build items list
    const itemsList = order.items?.map(item => 
      `  • ${item.product_name} x${item.quantity}`
    ).join('\n') || '';

    const messages = {
      en: `${emoji} Order Status: ${order.order_number}

Status: ${order.status.toUpperCase()}
Order Date: ${orderDate}
Total: ₦${total}

Items:
${itemsList}

${order.status === 'delivered' ? '✅ Your order has been delivered! Thank you!' :
  order.status === 'out_for_delivery' ? '🚚 Your order is on the way! Expected delivery today.' :
  order.status === 'ready' ? '🎉 Your order is ready for pickup/delivery!' :
  order.status === 'processing' ? '📦 We are preparing your order.' :
  '⏳ Your order has been received and will be processed soon.'}`,

      pidgin: `${emoji} Order Status: ${order.order_number}

Status: ${order.status.toUpperCase()}
Order Date: ${orderDate}
Total: ₦${total}

Wetin you order:
${itemsList}

${order.status === 'delivered' ? '✅ Your order don reach! Thank you!' :
  order.status === 'out_for_delivery' ? '🚚 Your order dey come! E go reach today.' :
  order.status === 'ready' ? '🎉 Your order don ready for pickup!' :
  order.status === 'processing' ? '📦 We dey package your order.' :
  '⏳ We don receive your order, we go process am soon.'}`,
    };

    return messages[language] || messages.en;
  }

  /**
   * Get customer preferences from conversation history
   */
  extractCustomerPreferences(conversationHistory = []) {
    const preferences = {
      sizes: [],
      colors: [],
      categories: [],
      priceRange: null,
      paymentMethod: null
    };

    // Analyze conversation history for patterns
    conversationHistory.forEach(msg => {
      if (msg.role !== 'user') return;
      
      const content = msg.content.toLowerCase();

      // Extract size preferences (e.g., "size 42", "large", "XL")
      const sizeMatch = content.match(/\b(size|sz)?\s*(xs|s|m|l|xl|xxl|\d{1,2})\b/i);
      if (sizeMatch && !preferences.sizes.includes(sizeMatch[2])) {
        preferences.sizes.push(sizeMatch[2]);
      }

      // Extract color preferences
      const colors = ['red', 'blue', 'green', 'black', 'white', 'yellow', 'pink', 'purple', 'brown', 'grey'];
      colors.forEach(color => {
        if (content.includes(color) && !preferences.colors.includes(color)) {
          preferences.colors.push(color);
        }
      });

      // Extract payment method
      if (content.includes('cash') || content.includes('pay on delivery')) {
        preferences.paymentMethod = 'cash';
      } else if (content.includes('transfer') || content.includes('bank')) {
        preferences.paymentMethod = 'transfer';
      } else if (content.includes('card')) {
        preferences.paymentMethod = 'card';
      }
    });

    return preferences;
  }

  /**
   * Build system prompt with business context
   */
  buildBusinessSystemPrompt(context) {
    const { business, products, stats } = context;
    const settings = business.settings || {};

    let prompt = `You are an intelligent AI assistant for ${business.business_name}, `;

    if (business.description) {
      prompt += `a business that ${business.description}. `;
    }

    prompt += `\n\nYour role is to help customers by:
1. Answering questions about products and services
2. Helping customers find and select products
3. Assisting with order placement and tracking
4. Providing business information (contact, location, hours)
5. Handling customer inquiries professionally and warmly

BUSINESS INFORMATION:
- Business Name: ${business.business_name}
- Category: ${business.category || 'General'}
- Phone: ${business.phone_number}`;

    if (business.email) {
      prompt += `\n- Email: ${business.email}`;
    }

    if (business.address) {
      prompt += `\n- Address: ${business.address}`;
    }

    // Add business hours if available
    if (settings.business_hours) {
      prompt += `\n- Business Hours: `;
      const hours = settings.business_hours;
      const today = new Date().toLocaleDateString('en-US', { weekday: 'lowercase' });
      if (hours[today]) {
        prompt += `Today (${today}): ${hours[today].open} - ${hours[today].close}`;
      }
    }

    // Add product catalog
    if (products && products.length > 0) {
      prompt += `\n\nAVAILABLE PRODUCTS (${products.length} items):`;
      products.slice(0, 20).forEach((product, index) => {
        prompt += `\n${index + 1}. ${product.name} - ₦${parseFloat(product.price).toLocaleString()}`;
        if (product.category) {
          prompt += ` (${product.category})`;
        }
        if (product.description) {
          prompt += ` - ${product.description.substring(0, 100)}`;
        }
        prompt += ` [Stock: ${product.quantity_in_stock}]`;
      });

      if (products.length > 20) {
        prompt += `\n... and ${products.length - 20} more products`;
      }
    }

    // Add statistics
    if (stats) {
      prompt += `\n\nBUSINESS STATS (Last 30 days):`;
      prompt += `\n- Total Orders: ${stats.total_orders}`;
      prompt += `\n- Total Customers: ${stats.total_customers}`;
      prompt += `\n- Average Order Value: ₦${parseFloat(stats.avg_order_value).toLocaleString()}`;
    }

    prompt += `\n\nCONVERSATION GUIDELINES:
- Be friendly, professional, and helpful
- Use Nigerian English naturally (can mix with Pidgin when appropriate)
- Always confirm order details before processing
- Provide accurate product information
- If you don't know something, admit it and offer to connect with a human
- Keep responses concise but informative
- Use emojis sparingly for a friendly tone
- For order status queries, provide clear tracking information
- If customer seems frustrated, escalate to human agent
- Remember customer preferences from conversation history`;

    return prompt;
  }

  /**
   * Save AI usage metrics for analytics
   */
  async saveAIUsageMetrics(data) {
    try {
      const {
        conversationId,
        messageContent,
        aiResponse,
        model,
        tokensUsed,
        businessId
      } = data;

      // Update the message with AI metrics
      await query(
        `UPDATE messages
         SET ai_model_used = $1,
             ai_tokens_used = $2,
             processed_by_ai = true
         WHERE conversation_id = $3
           AND content = $4
           AND direction = 'inbound'
         ORDER BY created_at DESC
         LIMIT 1`,
        [model, tokensUsed, conversationId, messageContent]
      );

      logger.debug('✅ AI usage metrics saved', {
        conversationId,
        model,
        tokensUsed
      });
    } catch (error) {
      logger.error('❌ Error saving AI usage metrics', {
        error: error.message
      });
      // Don't throw - this is non-critical
    }
  }

  /**
   * Generate product recommendations
   */
  async generateProductRecommendations(customerId, businessId, limit = 5) {
    try {
      // Get customer's order history
      const orderHistory = await query(
        `SELECT
          p.category,
          p.name,
          p.price,
          oi.quantity
        FROM order_items oi
        JOIN orders o ON oi.order_id = o.id
        JOIN products p ON oi.product_id = p.id
        WHERE o.customer_id = $1
          AND o.business_id = $2
        ORDER BY o.created_at DESC
        LIMIT 10`,
        [customerId, businessId]
      );

      // Get all available products
      const availableProducts = await query(
        `SELECT id, name, category, price, description
         FROM products
         WHERE business_id = $1 AND is_active = true
         LIMIT 50`,
        [businessId]
      );

      if (orderHistory.rows.length === 0) {
        // New customer - return popular products
        return availableProducts.rows.slice(0, limit);
      }

      // For now, return top products
      // TODO: Implement ML-based recommendations
      return availableProducts.rows.slice(0, limit);
    } catch (error) {
      logger.error('❌ Error generating recommendations', {
        error: error.message,
        customerId,
        businessId
      });
      return [];
    }
  }
}

export default new AIService();
