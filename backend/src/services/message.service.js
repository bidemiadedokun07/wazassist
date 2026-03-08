import { query, transaction } from '../config/database.js';
import { config } from '../config/index.js';
import { logger } from '../utils/logger.js';
import whatsappService from './whatsapp.service.js';
import aiService from './ai.service.js';
import productService from './product.service.js';
import orderService from './order.service.js';

/**
 * Message Processing Service
 * Orchestrates message flow: receive → process → respond
 */

/**
 * Handle incoming WhatsApp message
 */
export async function handleWhatsAppMessage(message, metadata) {
  try {
    logger.info('📨 Processing incoming message', {
      from: message.from,
      type: message.type,
      messageId: message.id
    });

    // Get or create customer
    const customer = await getOrCreateCustomer(message.from, metadata);

    // Get business for this phone number
    const business = await getBusinessByPhoneNumberId(metadata.metadata?.phone_number_id);

    if (!business) {
      logger.error('❌ Business not found for phone number', {
        phoneNumberId: metadata.metadata?.phone_number_id
      });
      return;
    }

    // Check message limit
    if (business.monthly_message_count >= business.monthly_message_limit) {
      logger.warn('⚠️  Message limit exceeded', {
        businessId: business.id,
        count: business.monthly_message_count,
        limit: business.monthly_message_limit
      });

      await whatsappService.sendTextMessage(
        message.from,
        "We've reached our message limit for this month. Please contact us directly.",
        business
      );
      return;
    }

    // Get or create conversation
    const conversation = await getOrCreateConversation(customer.id, business.id);

    // Extract message content based on type
    let messageContent = '';
    let mediaUrl = null;

    switch (message.type) {
      case 'text':
        messageContent = message.text.body;
        break;
      case 'image':
        messageContent = message.image.caption || '[Image]';
        mediaUrl = message.image.id;
        break;
      case 'audio':
        messageContent = '[Audio message]';
        mediaUrl = message.audio.id;
        break;
      case 'video':
        messageContent = message.video.caption || '[Video]';
        mediaUrl = message.video.id;
        break;
      case 'document':
        messageContent = message.document.filename || '[Document]';
        mediaUrl = message.document.id;
        break;
      default:
        messageContent = `[${message.type}]`;
    }

    // Save incoming message
    const savedMessage = await saveMessage({
      conversationId: conversation.id,
      whatsappMessageId: message.id,
      direction: 'inbound',
      senderId: customer.id,
      senderPhone: message.from,
      messageType: message.type,
      content: messageContent,
      mediaUrl: mediaUrl
    });

    // Mark as read
    if (!config.mockWhatsapp) {
      await whatsappService.markAsRead(message.id, business);
    }

    // Process with AI if enabled
    if (business.ai_enabled && message.type === 'text') {
      await processWithAI(message, conversation, customer, business);
    }

    // Update business message count
    await incrementMessageCount(business.id);

    logger.info('✅ Message processed successfully', {
      messageId: message.id,
      conversationId: conversation.id
    });

  } catch (error) {
    logger.error('❌ Error handling WhatsApp message', {
      error: error.message,
      stack: error.stack,
      messageId: message.id
    });
  }
}

/**
 * Process message with AI
 */
async function processWithAI(message, conversation, customer, business) {
  try {
    // Detect language
    const language = aiService.detectLanguage(message.text.body);

    // Get conversation history (last 5 messages)
    const history = await getConversationHistory(conversation.id, 5);

    // Get active products for the business (to provide context to AI)
    let products = [];
    try {
      products = await productService.getProductsByBusiness(business.id, {
        isActive: true,
        inStock: true,
        limit: 10
      });
    } catch (productError) {
      logger.warn('Failed to fetch products for AI context', {
        error: productError.message,
        businessId: business.id
      });
    }

    // Check for order intent
    const orderIntent = aiService.parseOrderIntent(message.text.body, products);

    let responseText;
    let orderCreated = null;

    if (orderIntent && orderIntent.items.length > 0) {
      // Customer wants to place an order
      logger.info('📦 Order intent detected', {
        conversationId: conversation.id,
        items: orderIntent.items.length,
        confidence: orderIntent.confidence
      });

      // Check conversation metadata for pending order
      const conversationMeta = await getConversationMetadata(conversation.id);

      // If customer says "confirm" and has pending order, create it
      if (message.text.body.toLowerCase().includes('confirm') && conversationMeta.pendingOrder) {
        try {
          // Create the order
          const order = await orderService.createOrder({
            businessId: business.id,
            customerId: customer.id,
            conversationId: conversation.id,
            customerPhone: customer.phone_number,
            customerName: customer.name,
            deliveryAddress: conversationMeta.pendingOrder.deliveryAddress || 'To be confirmed',
            paymentMethod: conversationMeta.pendingOrder.paymentMethod || 'cash',
            items: conversationMeta.pendingOrder.items
          });

          orderCreated = order;
          responseText = aiService.generateOrderConfirmation(order, language);

          // Clear pending order from conversation metadata
          await updateConversationMetadata(conversation.id, { pendingOrder: null });

          logger.info('✅ Order created from conversation', {
            orderId: order.id,
            orderNumber: order.order_number,
            customerId: customer.id
          });
        } catch (orderError) {
          logger.error('❌ Failed to create order', {
            error: orderError.message,
            conversationId: conversation.id
          });
          responseText = "Sorry, I couldn't process your order. Please try again or contact our support team.";
        }
      } else {
        // Store pending order and ask for delivery details
        await updateConversationMetadata(conversation.id, {
          pendingOrder: {
            items: orderIntent.items,
            createdAt: new Date().toISOString()
          }
        });

        responseText = aiService.generateOrderRequest(orderIntent.items, language);
      }
    } else {
      // Regular AI response with full business context
      const aiResponse = await aiService.generateBusinessResponse({
        businessId: business.id,
        customerId: customer.id,
        conversationId: conversation.id,
        messageContent: message.text.body,
        conversationHistory: history.map(msg => ({
          role: msg.direction === 'inbound' ? 'user' : 'assistant',
          content: msg.content
        }))
      });

      responseText = aiResponse.response;

      // Save AI model and tokens used
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

      // Update the message with WhatsApp message ID
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

      // Update conversation
      await updateConversation(conversation.id, {
        lastMessageAt: new Date(),
        messageCount: conversation.message_count + 2, // inbound + outbound
        languageDetected: language
      });

      logger.info('🤖 AI response sent', {
        conversationId: conversation.id,
        model: aiResponse.model,
        tokensUsed: aiResponse.tokensUsed
      });

      return; // Exit early since we've handled everything
    }

    // Send response
    const sent = await whatsappService.sendTextMessage(
      customer.phone_number,
      responseText,
      business
    );

    // Save outgoing message
    await saveMessage({
      conversationId: conversation.id,
      whatsappMessageId: sent.messageId,
      direction: 'outbound',
      messageType: 'text',
      content: responseText,
      processedByAi: true,
      aiModelUsed: orderCreated ? 'order_handler' : 'mock-llama3-1-8b',
      aiTokensUsed: 0
    });

    // Update conversation
    await updateConversation(conversation.id, {
      lastMessageAt: new Date(),
      messageCount: conversation.message_count + 2, // inbound + outbound
      languageDetected: language
    });

    logger.info('🤖 AI response sent', {
      conversationId: conversation.id,
      orderCreated: !!orderCreated
    });

  } catch (error) {
    logger.error('❌ Error processing with AI', {
      error: error.message,
      conversationId: conversation.id
    });

    // Send fallback message
    try {
      await whatsappService.sendTextMessage(
        customer.phone_number,
        "Thank you for your message! A team member will respond shortly.",
        business
      );
    } catch (fallbackError) {
      logger.error('❌ Failed to send fallback message', {
        error: fallbackError.message
      });
    }
  }
}

/**
 * Get or create customer
 */
async function getOrCreateCustomer(phoneNumber, metadata) {
  // Check if customer exists
  let result = await query(
    'SELECT * FROM users WHERE phone_number = $1',
    [phoneNumber]
  );

  if (result.rows.length > 0) {
    return result.rows[0];
  }

  // Create new customer
  const name = metadata.contacts?.[0]?.profile?.name || phoneNumber;

  result = await query(
    `INSERT INTO users (phone_number, whatsapp_id, name, is_active)
     VALUES ($1, $2, $3, true)
     RETURNING *`,
    [phoneNumber, metadata.contacts?.[0]?.wa_id, name]
  );

  logger.info('👤 New customer created', {
    customerId: result.rows[0].id,
    phoneNumber
  });

  return result.rows[0];
}

/**
 * Get business by WhatsApp phone number ID
 */
async function getBusinessByPhoneNumberId(phoneNumberId) {
  if (!phoneNumberId) {
    // For development/testing, return first active business
    const result = await query(
      'SELECT * FROM businesses WHERE is_active = true LIMIT 1'
    );
    return result.rows[0];
  }

  const result = await query(
    'SELECT * FROM businesses WHERE whatsapp_phone_number_id = $1 AND is_active = true',
    [phoneNumberId]
  );

  return result.rows[0];
}

/**
 * Get or create conversation
 */
async function getOrCreateConversation(customerId, businessId) {
  // Check for active conversation
  let result = await query(
    `SELECT * FROM conversations
     WHERE customer_id = $1 AND business_id = $2 AND status = 'active'
     ORDER BY created_at DESC LIMIT 1`,
    [customerId, businessId]
  );

  if (result.rows.length > 0) {
    return result.rows[0];
  }

  // Create new conversation
  result = await query(
    `INSERT INTO conversations (business_id, customer_id, status)
     VALUES ($1, $2, 'active')
     RETURNING *`,
    [businessId, customerId]
  );

  logger.info('💬 New conversation created', {
    conversationId: result.rows[0].id,
    customerId,
    businessId
  });

  return result.rows[0];
}

/**
 * Save message to database
 */
async function saveMessage(messageData) {
  const result = await query(
    `INSERT INTO messages (
      conversation_id, whatsapp_message_id, direction, sender_id, sender_phone,
      message_type, content, media_url, processed_by_ai, ai_model_used, ai_tokens_used, status
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, 'sent')
    RETURNING *`,
    [
      messageData.conversationId,
      messageData.whatsappMessageId,
      messageData.direction,
      messageData.senderId || null,
      messageData.senderPhone || null,
      messageData.messageType,
      messageData.content,
      messageData.mediaUrl || null,
      messageData.processedByAi || false,
      messageData.aiModelUsed || null,
      messageData.aiTokensUsed || null
    ]
  );

  return result.rows[0];
}

/**
 * Get conversation history
 */
async function getConversationHistory(conversationId, limit = 5) {
  const result = await query(
    `SELECT * FROM messages
     WHERE conversation_id = $1
     ORDER BY created_at DESC
     LIMIT $2`,
    [conversationId, limit]
  );

  return result.rows.reverse(); // Return in chronological order
}

/**
 * Update conversation
 */
async function updateConversation(conversationId, updates) {
  const setClauses = [];
  const values = [];
  let paramIndex = 1;

  if (updates.lastMessageAt) {
    setClauses.push(`last_message_at = $${paramIndex++}`);
    values.push(updates.lastMessageAt);
  }

  if (updates.messageCount !== undefined) {
    setClauses.push(`message_count = $${paramIndex++}`);
    values.push(updates.messageCount);
  }

  if (updates.languageDetected) {
    setClauses.push(`language_detected = $${paramIndex++}`);
    values.push(updates.languageDetected);
  }

  if (setClauses.length === 0) return;

  values.push(conversationId);

  await query(
    `UPDATE conversations SET ${setClauses.join(', ')} WHERE id = $${paramIndex}`,
    values
  );
}

/**
 * Increment business message count
 */
async function incrementMessageCount(businessId) {
  await query(
    'UPDATE businesses SET monthly_message_count = monthly_message_count + 1 WHERE id = $1',
    [businessId]
  );
}

/**
 * Get conversation metadata
 */
async function getConversationMetadata(conversationId) {
  const result = await query(
    'SELECT metadata FROM conversations WHERE id = $1',
    [conversationId]
  );

  if (result.rows.length === 0) {
    return {};
  }

  return result.rows[0].metadata || {};
}

/**
 * Update conversation metadata
 */
async function updateConversationMetadata(conversationId, metadata) {
  // Get existing metadata
  const existing = await getConversationMetadata(conversationId);

  // Merge with new metadata
  const updated = { ...existing, ...metadata };

  await query(
    'UPDATE conversations SET metadata = $1 WHERE id = $2',
    [JSON.stringify(updated), conversationId]
  );
}

export default {
  handleWhatsAppMessage,
  processWithAI
};
