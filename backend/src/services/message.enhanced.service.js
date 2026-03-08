import { query, transaction } from '../config/database.js';
import { logger } from '../utils/logger.js';
import aiService from './ai.service.js';
import whatsappService from './whatsapp.service.js';
import productService from './product.service.js';
import * as orderService from './order.service.js';

/**
 * Enhanced Message Processing with Advanced AI Features
 * Includes: Order status tracking, customer preferences, escalation detection
 */

/**
 * Process incoming WhatsApp message with enhanced AI features
 */
export async function processEnhancedMessage(message, conversation, customer, business) {
  try {
    // Get conversation history
    const history = await getConversationHistory(conversation.id, 10);

    // Get active products
    const products = await productService.getProductsByBusiness(business.id, {
      status: 'active',
      limit: 50
    });

    // Detect language
    const language = aiService.detectLanguage(message.text.body);

    // 1. CHECK FOR ORDER STATUS QUERY
    const statusIntent = aiService.parseOrderStatusIntent(message.text.body);
    if (statusIntent && statusIntent.intent === 'check_order_status') {
      return await handleOrderStatusQuery(
        statusIntent,
        customer,
        business,
        conversation,
        language
      );
    }

    // 2. CHECK FOR ESCALATION NEEDS
    const escalation = aiService.detectEscalationNeed(
      message.text.body,
      history.map(msg => ({
        role: msg.direction === 'inbound' ? 'user' : 'assistant',
        content: msg.content
      }))
    );

    if (escalation.needsEscalation && escalation.level === 'urgent') {
      return await handleEscalation(
        escalation,
        customer,
        business,
        conversation,
        language
      );
    }

    // 3. EXTRACT CUSTOMER PREFERENCES
    const customerPrefs = aiService.extractCustomerPreferences(
      history.map(msg => ({
        role: msg.direction === 'inbound' ? 'user' : 'assistant',
        content: msg.content
      }))
    );

    // 4. CHECK FOR ORDER INTENT
    const orderIntent = aiService.parseOrderIntent(message.text.body, products);
    
    if (orderIntent) {
      return await handleOrderIntent(
        orderIntent,
        message,
        conversation,
        customer,
        business,
        customerPrefs,
        language
      );
    }

    // 5. REGULAR AI CONVERSATION
    return await handleRegularConversation(
      message,
      conversation,
      customer,
      business,
      history,
      customerPrefs,
      language
    );

  } catch (error) {
    logger.error('❌ Enhanced message processing failed', {
      error: error.message,
      messageId: message.id
    });
    throw error;
  }
}

/**
 * Handle order status queries
 */
async function handleOrderStatusQuery(statusIntent, customer, business, conversation, language) {
  let order = null;

  if (statusIntent.orderNumber) {
    // Customer provided specific order number
    order = await orderService.getOrderByOrderNumber(statusIntent.orderNumber, business.id);
  } else {
    // Get customer's most recent order
    const orders = await orderService.getCustomerOrders(customer.phone_number, business.id, 1);
    order = orders[0] || null;
  }

  const responseText = aiService.formatOrderStatus(order, language);

  // Send response
  const sent = await whatsappService.sendTextMessage(
    customer.phone_number,
    responseText,
    business
  );

  // Save messages
  await saveMessage({
    conversationId: conversation.id,
    whatsappMessageId: sent.messageId,
    direction: 'outbound',
    messageType: 'text',
    content: responseText,
    processedByAi: true,
    aiModelUsed: 'order_status_handler',
    aiTokensUsed: 0
  });

  await updateConversation(conversation.id, {
    lastMessageAt: new Date(),
    messageCount: conversation.message_count + 2
  });

  logger.info('📦 Order status query handled', {
    conversationId: conversation.id,
    orderNumber: order?.order_number || 'not_found'
  });

  return { handled: true, type: 'order_status' };
}

/**
 * Handle escalation to human agent
 */
async function handleEscalation(escalation, customer, business, conversation, language) {
  // Flag conversation for human takeover
  await updateConversation(conversation.id, {
    needsAttention: true,
    metadata: {
      ...(conversation.metadata || {}),
      escalation: {
        level: escalation.level,
        reason: escalation.reason,
        timestamp: new Date().toISOString()
      }
    }
  });

  const escalationMessages = {
    en: "I understand this needs immediate attention. Let me connect you with our team. Someone will reach out to you shortly. 🙏",
    pidgin: "I understand say dis matter need urgent attention. Make I connect you with our team. Somebody go contact you soon. 🙏"
  };

  const responseText = escalationMessages[language] || escalationMessages.en;

  const sent = await whatsappService.sendTextMessage(
    customer.phone_number,
    responseText,
    business
  );

  await saveMessage({
    conversationId: conversation.id,
    whatsappMessageId: sent.messageId,
    direction: 'outbound',
    messageType: 'text',
    content: responseText,
    processedByAi: true,
    aiModelUsed: 'escalation_handler',
    aiTokensUsed: 0
  });

  logger.warn('⚠️ Conversation escalated to human', {
    conversationId: conversation.id,
    reason: escalation.reason,
    level: escalation.level
  });

  return { handled: true, type: 'escalation', level: escalation.level };
}

/**
 * Handle order creation intent
 */
async function handleOrderIntent(orderIntent, message, conversation, customer, business, customerPrefs, language) {
  const isConfirming = message.text.body.toLowerCase().match(/\b(yes|confirm|proceed|okay|ok)\b/);
  const hasPendingOrder = conversation.metadata?.pendingOrder;

  let responseText;
  let orderCreated = false;

  if (isConfirming && hasPendingOrder) {
    // CREATE THE ORDER
    const order = await orderService.createOrder({
      businessId: business.id,
      customerId: customer.id,
      conversationId: conversation.id,
      customerPhone: customer.phone_number,
      customerName: customer.name,
      items: hasPendingOrder.items,
      totalAmount: hasPendingOrder.items.reduce((sum, item) =>
        sum + (item.unitPrice * item.quantity), 0
      ),
      paymentMethod: customerPrefs.paymentMethod || 'cash',
      metadata: {
        source: 'whatsapp',
        languagePreference: language,
        customerPreferences: customerPrefs
      }
    });

    responseText = aiService.generateOrderConfirmation(order, language);
    orderCreated = true;

    // Clear pending order
    await updateConversationMetadata(conversation.id, {
      pendingOrder: null,
      lastOrderId: order.id,
      customerPreferences: customerPrefs
    });

    logger.info('✅ Order created', {
      orderId: order.id,
      orderNumber: order.order_number,
      total: order.total_amount
    });
  } else {
    // STORE PENDING ORDER
    await updateConversationMetadata(conversation.id, {
      pendingOrder: {
        items: orderIntent.items,
        createdAt: new Date().toISOString()
      }
    });

    responseText = aiService.generateOrderRequest(orderIntent.items, language);

    // Add personalization if we have preferences
    if (customerPrefs.sizes.length > 0) {
      responseText += `\n\nℹ️ ${language === 'pidgin' ? 'I notice say you dey like' : 'I noticed you usually prefer'} size ${customerPrefs.sizes[0]}. Should I use that?`;
    }
  }

  // Send response
  const sent = await whatsappService.sendTextMessage(
    customer.phone_number,
    responseText,
    business
  );

  await saveMessage({
    conversationId: conversation.id,
    whatsappMessageId: sent.messageId,
    direction: 'outbound',
    messageType: 'text',
    content: responseText,
    processedByAi: true,
    aiModelUsed: orderCreated ? 'order_creator' : 'order_request',
    aiTokensUsed: 0
  });

  await updateConversation(conversation.id, {
    lastMessageAt: new Date(),
    messageCount: conversation.message_count + 2,
    languageDetected: language
  });

  return { handled: true, type: 'order_intent', orderCreated };
}

/**
 * Handle regular AI conversation
 */
async function handleRegularConversation(message, conversation, customer, business, history, customerPrefs, language) {
  const aiResponse = await aiService.generateBusinessResponse({
    businessId: business.id,
    customerId: customer.id,
    conversationId: conversation.id,
    messageContent: message.text.body,
    conversationHistory: history.map(msg => ({
      role: msg.direction === 'inbound' ? 'user' : 'assistant',
      content: msg.content
    })),
    customerPreferences: customerPrefs
  });

  const responseText = aiResponse.response;

  // Save AI message
  await saveMessage({
    conversationId: conversation.id,
    whatsappMessageId: aiResponse.messageId || `ai_${Date.now()}`,
    direction: 'outbound',
    messageType: 'text',
    content: responseText,
    processedByAi: true,
    aiModelUsed: aiResponse.model,
    aiTokensUsed: aiResponse.tokensUsed
  });

  // Send response
  const sent = await whatsappService.sendTextMessage(
    customer.phone_number,
    responseText,
    business
  );

  // Update with WhatsApp message ID
  await query(
    `UPDATE messages
     SET whatsapp_message_id = $1
     WHERE conversation_id = $2
       AND content = $3
       AND direction = 'outbound'
     ORDER BY created_at DESC
     LIMIT 1`,
    [sent.messageId, conversation.id, responseText]
  );

  await updateConversation(conversation.id, {
    lastMessageAt: new Date(),
    messageCount: conversation.message_count + 2,
    languageDetected: language
  });

  logger.info('🤖 AI response sent', {
    conversationId: conversation.id,
    model: aiResponse.model,
    tokensUsed: aiResponse.tokensUsed
  });

  return { handled: true, type: 'ai_conversation' };
}

// Helper functions
async function getConversationHistory(conversationId, limit = 10) {
  const result = await query(
    `SELECT * FROM messages
     WHERE conversation_id = $1
     ORDER BY created_at DESC
     LIMIT $2`,
    [conversationId, limit]
  );
  return result.rows.reverse();
}

async function saveMessage(messageData) {
  await query(
    `INSERT INTO messages (
      conversation_id, whatsapp_message_id, direction, message_type,
      content, processed_by_ai, ai_model_used, ai_tokens_used
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
    [
      messageData.conversationId,
      messageData.whatsappMessageId,
      messageData.direction,
      messageData.messageType,
      messageData.content,
      messageData.processedByAi || false,
      messageData.aiModelUsed || null,
      messageData.aiTokensUsed || 0
    ]
  );
}

async function updateConversation(conversationId, updates) {
  const sets = [];
  const values = [];
  let paramIndex = 1;

  Object.entries(updates).forEach(([key, value]) => {
    if (key === 'metadata') {
      sets.push(`metadata = metadata || $${paramIndex}::jsonb`);
      values.push(JSON.stringify(value));
    } else {
      sets.push(`${key} = $${paramIndex}`);
      values.push(value);
    }
    paramIndex++;
  });

  values.push(conversationId);

  await query(
    `UPDATE conversations
     SET ${sets.join(', ')}, updated_at = NOW()
     WHERE id = $${paramIndex}`,
    values
  );
}

async function updateConversationMetadata(conversationId, metadata) {
  await query(
    `UPDATE conversations
     SET metadata = metadata || $1::jsonb,
         updated_at = NOW()
     WHERE id = $2`,
    [JSON.stringify(metadata), conversationId]
  );
}

export default {
  processEnhancedMessage
};
