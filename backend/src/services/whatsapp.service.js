import axios from 'axios';
import { config } from '../config/index.js';
import { logger } from '../utils/logger.js';

/**
 * WhatsApp Service
 * Handles all WhatsApp Business API interactions
 */
class WhatsAppService {
  constructor() {
    this.apiUrl = config.whatsapp.apiUrl;
    this.apiVersion = config.whatsapp.apiVersion;
  }

  /**
   * Get WhatsApp API client for a specific business
   */
  getClient(accessToken, phoneNumberId) {
    return axios.create({
      baseURL: `${this.apiUrl}/${this.apiVersion}/${phoneNumberId}`,
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      }
    });
  }

  /**
   * Send a text message
   */
  async sendTextMessage(to, text, business) {
    try {
      if (config.mockWhatsapp) {
        logger.info('📱 [MOCK] Sending WhatsApp message', { to, text });
        return { success: true, messageId: 'mock_' + Date.now() };
      }

      const client = this.getClient(
        business.whatsapp_access_token,
        business.whatsapp_phone_number_id
      );

      const response = await client.post('/messages', {
        messaging_product: 'whatsapp',
        recipient_type: 'individual',
        to: to,
        type: 'text',
        text: {
          preview_url: false,
          body: text
        }
      });

      logger.info('✅ WhatsApp message sent', {
        to,
        messageId: response.data.messages[0].id
      });

      return {
        success: true,
        messageId: response.data.messages[0].id,
        response: response.data
      };
    } catch (error) {
      logger.error('❌ Failed to send WhatsApp message', {
        error: error.message,
        to,
        response: error.response?.data
      });

      throw new Error(`WhatsApp send failed: ${error.message}`);
    }
  }

  /**
   * Send a template message
   */
  async sendTemplateMessage(to, templateName, languageCode, components, business) {
    try {
      const client = this.getClient(
        business.whatsapp_access_token,
        business.whatsapp_phone_number_id
      );

      const response = await client.post('/messages', {
        messaging_product: 'whatsapp',
        to: to,
        type: 'template',
        template: {
          name: templateName,
          language: {
            code: languageCode
          },
          components: components
        }
      });

      logger.info('✅ WhatsApp template sent', {
        to,
        template: templateName,
        messageId: response.data.messages[0].id
      });

      return {
        success: true,
        messageId: response.data.messages[0].id
      };
    } catch (error) {
      logger.error('❌ Failed to send WhatsApp template', {
        error: error.message,
        to,
        template: templateName
      });

      throw error;
    }
  }

  /**
   * Send an image
   */
  async sendImage(to, imageUrl, caption, business) {
    try {
      const client = this.getClient(
        business.whatsapp_access_token,
        business.whatsapp_phone_number_id
      );

      const response = await client.post('/messages', {
        messaging_product: 'whatsapp',
        to: to,
        type: 'image',
        image: {
          link: imageUrl,
          caption: caption
        }
      });

      logger.info('✅ WhatsApp image sent', {
        to,
        messageId: response.data.messages[0].id
      });

      return {
        success: true,
        messageId: response.data.messages[0].id
      };
    } catch (error) {
      logger.error('❌ Failed to send WhatsApp image', {
        error: error.message,
        to
      });

      throw error;
    }
  }

  /**
   * Mark message as read
   */
  async markAsRead(messageId, business) {
    try {
      const client = this.getClient(
        business.whatsapp_access_token,
        business.whatsapp_phone_number_id
      );

      await client.post('/messages', {
        messaging_product: 'whatsapp',
        status: 'read',
        message_id: messageId
      });

      logger.info('✅ Message marked as read', { messageId });
    } catch (error) {
      logger.error('❌ Failed to mark message as read', {
        error: error.message,
        messageId
      });
    }
  }

  /**
   * React to a message
   */
  async reactToMessage(to, messageId, emoji, business) {
    try {
      const client = this.getClient(
        business.whatsapp_access_token,
        business.whatsapp_phone_number_id
      );

      const response = await client.post('/messages', {
        messaging_product: 'whatsapp',
        to: to,
        type: 'reaction',
        reaction: {
          message_id: messageId,
          emoji: emoji
        }
      });

      logger.info('✅ Reaction sent', { messageId, emoji });

      return {
        success: true,
        messageId: response.data.messages[0].id
      };
    } catch (error) {
      logger.error('❌ Failed to send reaction', {
        error: error.message,
        messageId
      });

      throw error;
    }
  }

  /**
   * Download media from WhatsApp
   */
  async downloadMedia(mediaId, business) {
    try {
      const client = this.getClient(
        business.whatsapp_access_token,
        business.whatsapp_phone_number_id
      );

      // First, get the media URL
      const response = await axios.get(
        `${this.apiUrl}/${this.apiVersion}/${mediaId}`,
        {
          headers: {
            'Authorization': `Bearer ${business.whatsapp_access_token}`
          }
        }
      );

      const mediaUrl = response.data.url;

      // Download the media
      const mediaResponse = await axios.get(mediaUrl, {
        headers: {
          'Authorization': `Bearer ${business.whatsapp_access_token}`
        },
        responseType: 'arraybuffer'
      });

      logger.info('✅ Media downloaded', { mediaId });

      return {
        data: mediaResponse.data,
        mimeType: response.data.mime_type,
        fileSize: response.data.file_size
      };
    } catch (error) {
      logger.error('❌ Failed to download media', {
        error: error.message,
        mediaId
      });

      throw error;
    }
  }
}

export default new WhatsAppService();
