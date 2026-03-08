import express from 'express';
import { config } from '../../config/index.js';
import { logger } from '../../utils/logger.js';
import { handleWhatsAppMessage } from '../../services/message.service.js';
import paymentService from '../../services/payment.service.js';

const router = express.Router();

/**
 * WhatsApp Webhook Verification
 * Meta will call this to verify your webhook URL
 */
router.get('/whatsapp', (req, res) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  logger.info('WhatsApp webhook verification request', { mode, token });

  // Check if mode and token are correct
  if (mode === 'subscribe' && token === config.whatsapp.verifyToken) {
    logger.info('✅ WhatsApp webhook verified successfully');
    res.status(200).send(challenge);
  } else {
    logger.error('❌ WhatsApp webhook verification failed');
    res.status(403).send('Forbidden');
  }
});

/**
 * WhatsApp Webhook - Receive Messages
 * Meta sends incoming messages here
 */
router.post('/whatsapp', async (req, res) => {
  try {
    const body = req.body;

    logger.info('WhatsApp webhook received', {
      body: JSON.stringify(body).substring(0, 200)
    });

    // Quickly respond to WhatsApp
    res.status(200).send('EVENT_RECEIVED');

    // Process webhook asynchronously
    if (body.object === 'whatsapp_business_account') {
      if (body.entry && body.entry.length > 0) {
        for (const entry of body.entry) {
          if (entry.changes && entry.changes.length > 0) {
            for (const change of entry.changes) {
              if (change.value && change.value.messages) {
                // Process each message
                for (const message of change.value.messages) {
                  await handleWhatsAppMessage(message, change.value);
                }
              }

              // Handle message status updates
              if (change.value && change.value.statuses) {
                for (const status of change.value.statuses) {
                  logger.info('Message status update', { status });
                  // TODO: Update message status in database
                }
              }
            }
          }
        }
      }
    }
  } catch (error) {
    logger.error('Error processing WhatsApp webhook:', error);
    // Still return 200 to avoid WhatsApp retries
    res.status(200).send('ERROR');
  }
});

/**
 * Paystack Webhook
 * Receives payment notifications
 */
router.post('/paystack', async (req, res) => {
  try {
    const hash = req.headers['x-paystack-signature'];

    // Verify webhook signature
    if (!paymentService.verifyPaystackWebhook(req.body, hash)) {
      logger.error('Invalid Paystack webhook signature');
      return res.status(400).send('Invalid signature');
    }

    const event = req.body;

    // Quickly respond to Paystack
    res.status(200).send('OK');

    // Handle payment events asynchronously
    await paymentService.handlePaystackWebhook(event);
  } catch (error) {
    logger.error('Error processing Paystack webhook:', error);
    // Still return 200 to avoid retries
    if (!res.headersSent) {
      res.status(200).send('ERROR');
    }
  }
});

/**
 * Flutterwave Webhook
 * Receives payment notifications
 */
router.post('/flutterwave', async (req, res) => {
  try {
    const signature = req.headers['verif-hash'];

    // Verify webhook signature
    if (!paymentService.verifyFlutterwaveWebhook(signature)) {
      logger.error('Invalid Flutterwave webhook signature');
      return res.status(400).send('Invalid signature');
    }

    const event = req.body;

    // Quickly respond to Flutterwave
    res.status(200).send('OK');

    // Handle payment events asynchronously
    await paymentService.handleFlutterwaveWebhook(event);
  } catch (error) {
    logger.error('Error processing Flutterwave webhook:', error);
    // Still return 200 to avoid retries
    if (!res.headersSent) {
      res.status(200).send('ERROR');
    }
  }
});

export default router;
