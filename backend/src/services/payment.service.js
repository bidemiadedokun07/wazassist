import axios from 'axios';
import crypto from 'crypto';
import { query } from '../config/database.js';
import { config } from '../config/index.js';
import { logger } from '../utils/logger.js';
import orderService from './order.service.js';

/**
 * Payment Service
 * Integrates with Paystack and Flutterwave for Nigerian payment processing
 */

const PAYSTACK_BASE_URL = 'https://api.paystack.co';
const FLUTTERWAVE_BASE_URL = 'https://api.flutterwave.com/v3';

/**
 * Initialize payment with Paystack
 */
export async function initializePaystackPayment(orderData) {
  try {
    const { orderId, businessId, email, amount, currency = 'NGN' } = orderData;

    // Get order details
    const order = await orderService.getOrderById(orderId, businessId);
    if (!order) {
      throw new Error('Order not found');
    }

    // Paystack expects amount in kobo (smallest currency unit)
    const amountInKobo = Math.round(amount * 100);

    const response = await axios.post(
      `${PAYSTACK_BASE_URL}/transaction/initialize`,
      {
        email,
        amount: amountInKobo,
        currency,
        reference: `PS-${orderId}-${Date.now()}`,
        callback_url: `${config.app.baseUrl}/api/v1/payments/paystack/callback`,
        metadata: {
          order_id: orderId,
          business_id: businessId,
          order_number: order.order_number,
          custom_fields: [
            {
              display_name: 'Order Number',
              variable_name: 'order_number',
              value: order.order_number
            }
          ]
        }
      },
      {
        headers: {
          Authorization: `Bearer ${config.paystack.secretKey}`,
          'Content-Type': 'application/json'
        }
      }
    );

    // Save payment transaction
    await savePaymentTransaction({
      orderId,
      businessId,
      provider: 'paystack',
      reference: response.data.data.reference,
      amount,
      currency,
      status: 'pending',
      metadata: {
        access_code: response.data.data.access_code,
        authorization_url: response.data.data.authorization_url
      }
    });

    logger.info('✅ Paystack payment initialized', {
      orderId,
      reference: response.data.data.reference,
      amount
    });

    return {
      provider: 'paystack',
      reference: response.data.data.reference,
      authorizationUrl: response.data.data.authorization_url,
      accessCode: response.data.data.access_code
    };
  } catch (error) {
    logger.error('❌ Paystack initialization failed', {
      error: error.message,
      response: error.response?.data
    });
    throw new Error(`Paystack initialization failed: ${error.message}`);
  }
}

/**
 * Initialize payment with Flutterwave
 */
export async function initializeFlutterwavePayment(orderData) {
  try {
    const { orderId, businessId, email, phoneNumber, name, amount, currency = 'NGN' } = orderData;

    // Get order details
    const order = await orderService.getOrderById(orderId, businessId);
    if (!order) {
      throw new Error('Order not found');
    }

    const txRef = `FW-${orderId}-${Date.now()}`;

    const response = await axios.post(
      `${FLUTTERWAVE_BASE_URL}/payments`,
      {
        tx_ref: txRef,
        amount,
        currency,
        redirect_url: `${config.app.baseUrl}/api/v1/payments/flutterwave/callback`,
        payment_options: 'card,banktransfer,ussd',
        customer: {
          email,
          phone_number: phoneNumber,
          name
        },
        customizations: {
          title: 'WazAssist Order Payment',
          description: `Payment for order ${order.order_number}`,
          logo: config.app.logoUrl || ''
        },
        meta: {
          order_id: orderId,
          business_id: businessId,
          order_number: order.order_number
        }
      },
      {
        headers: {
          Authorization: `Bearer ${config.flutterwave.secretKey}`,
          'Content-Type': 'application/json'
        }
      }
    );

    // Save payment transaction
    await savePaymentTransaction({
      orderId,
      businessId,
      provider: 'flutterwave',
      reference: txRef,
      amount,
      currency,
      status: 'pending',
      metadata: {
        payment_link: response.data.data.link
      }
    });

    logger.info('✅ Flutterwave payment initialized', {
      orderId,
      reference: txRef,
      amount
    });

    return {
      provider: 'flutterwave',
      reference: txRef,
      paymentLink: response.data.data.link
    };
  } catch (error) {
    logger.error('❌ Flutterwave initialization failed', {
      error: error.message,
      response: error.response?.data
    });
    throw new Error(`Flutterwave initialization failed: ${error.message}`);
  }
}

/**
 * Verify Paystack payment
 */
export async function verifyPaystackPayment(reference) {
  try {
    const response = await axios.get(
      `${PAYSTACK_BASE_URL}/transaction/verify/${reference}`,
      {
        headers: {
          Authorization: `Bearer ${config.paystack.secretKey}`
        }
      }
    );

    const data = response.data.data;

    // Update payment transaction
    await updatePaymentTransaction(reference, {
      status: data.status === 'success' ? 'completed' : 'failed',
      verifiedAt: new Date(),
      metadata: {
        gateway_response: data.gateway_response,
        channel: data.channel,
        ip_address: data.ip_address
      }
    });

    if (data.status === 'success') {
      // Update order payment status
      const payment = await getPaymentByReference(reference);
      if (payment) {
        await orderService.updatePaymentStatus(
          payment.order_id,
          payment.business_id,
          'paid',
          {
            paymentReference: reference,
            paymentGateway: 'paystack',
            paymentChannel: data.channel
          }
        );
      }

      logger.info('✅ Paystack payment verified', {
        reference,
        amount: data.amount / 100,
        orderId: payment?.order_id
      });
    }

    return {
      success: data.status === 'success',
      amount: data.amount / 100,
      currency: data.currency,
      paidAt: data.paid_at,
      channel: data.channel
    };
  } catch (error) {
    logger.error('❌ Paystack verification failed', {
      error: error.message,
      reference
    });
    throw new Error(`Paystack verification failed: ${error.message}`);
  }
}

/**
 * Verify Flutterwave payment
 */
export async function verifyFlutterwavePayment(transactionId) {
  try {
    const response = await axios.get(
      `${FLUTTERWAVE_BASE_URL}/transactions/${transactionId}/verify`,
      {
        headers: {
          Authorization: `Bearer ${config.flutterwave.secretKey}`
        }
      }
    );

    const data = response.data.data;

    // Update payment transaction
    await updatePaymentTransaction(data.tx_ref, {
      status: data.status === 'successful' ? 'completed' : 'failed',
      verifiedAt: new Date(),
      metadata: {
        flw_ref: data.flw_ref,
        transaction_id: data.id,
        processor_response: data.processor_response
      }
    });

    if (data.status === 'successful') {
      // Update order payment status
      const payment = await getPaymentByReference(data.tx_ref);
      if (payment) {
        await orderService.updatePaymentStatus(
          payment.order_id,
          payment.business_id,
          'paid',
          {
            paymentReference: data.tx_ref,
            paymentGateway: 'flutterwave',
            flutterwaveRef: data.flw_ref
          }
        );
      }

      logger.info('✅ Flutterwave payment verified', {
        reference: data.tx_ref,
        amount: data.amount,
        orderId: payment?.order_id
      });
    }

    return {
      success: data.status === 'successful',
      amount: data.amount,
      currency: data.currency,
      paidAt: data.created_at,
      processor: data.processor_response
    };
  } catch (error) {
    logger.error('❌ Flutterwave verification failed', {
      error: error.message,
      transactionId
    });
    throw new Error(`Flutterwave verification failed: ${error.message}`);
  }
}

/**
 * Verify webhook signature from Paystack
 */
export function verifyPaystackWebhook(payload, signature) {
  const hash = crypto
    .createHmac('sha512', config.paystack.secretKey)
    .update(JSON.stringify(payload))
    .digest('hex');
  return hash === signature;
}

/**
 * Verify webhook signature from Flutterwave
 */
export function verifyFlutterwaveWebhook(signature) {
  return signature === config.flutterwave.secretHash;
}

/**
 * Handle Paystack webhook event
 */
export async function handlePaystackWebhook(event) {
  try {
    const { event: eventType, data } = event;

    logger.info('📥 Paystack webhook received', {
      event: eventType,
      reference: data.reference
    });

    switch (eventType) {
      case 'charge.success':
        await verifyPaystackPayment(data.reference);
        break;

      case 'charge.failed':
        await updatePaymentTransaction(data.reference, {
          status: 'failed',
          metadata: { gateway_response: data.gateway_response }
        });
        break;

      default:
        logger.debug('Unhandled Paystack event', { event: eventType });
    }

    return { processed: true };
  } catch (error) {
    logger.error('❌ Paystack webhook processing failed', {
      error: error.message,
      event
    });
    throw error;
  }
}

/**
 * Handle Flutterwave webhook event
 */
export async function handleFlutterwaveWebhook(event) {
  try {
    const { event: eventType, data } = event;

    logger.info('📥 Flutterwave webhook received', {
      event: eventType,
      reference: data.tx_ref
    });

    switch (eventType) {
      case 'charge.completed':
        if (data.status === 'successful') {
          await verifyFlutterwavePayment(data.id);
        }
        break;

      default:
        logger.debug('Unhandled Flutterwave event', { event: eventType });
    }

    return { processed: true };
  } catch (error) {
    logger.error('❌ Flutterwave webhook processing failed', {
      error: error.message,
      event
    });
    throw error;
  }
}

/**
 * Save payment transaction to database
 */
async function savePaymentTransaction(paymentData) {
  const result = await query(
    `INSERT INTO payment_transactions (
      order_id, business_id, provider, reference, amount, currency,
      status, metadata
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
    RETURNING *`,
    [
      paymentData.orderId,
      paymentData.businessId,
      paymentData.provider,
      paymentData.reference,
      paymentData.amount,
      paymentData.currency,
      paymentData.status,
      JSON.stringify(paymentData.metadata || {})
    ]
  );

  return result.rows[0];
}

/**
 * Update payment transaction
 */
async function updatePaymentTransaction(reference, updates) {
  const setClauses = [];
  const values = [reference];
  let paramIndex = 2;

  if (updates.status) {
    setClauses.push(`status = $${paramIndex++}`);
    values.push(updates.status);
  }

  if (updates.verifiedAt) {
    setClauses.push(`verified_at = $${paramIndex++}`);
    values.push(updates.verifiedAt);
  }

  if (updates.metadata) {
    // Merge with existing metadata
    setClauses.push(`metadata = metadata || $${paramIndex++}::jsonb`);
    values.push(JSON.stringify(updates.metadata));
  }

  setClauses.push(`updated_at = NOW()`);

  await query(
    `UPDATE payment_transactions
     SET ${setClauses.join(', ')}
     WHERE reference = $1`,
    values
  );
}

/**
 * Get payment by reference
 */
async function getPaymentByReference(reference) {
  const result = await query(
    'SELECT * FROM payment_transactions WHERE reference = $1',
    [reference]
  );
  return result.rows[0];
}

/**
 * Get payments for an order
 */
export async function getOrderPayments(orderId, businessId) {
  const result = await query(
    `SELECT * FROM payment_transactions
     WHERE order_id = $1 AND business_id = $2
     ORDER BY created_at DESC`,
    [orderId, businessId]
  );
  return result.rows;
}

/**
 * Get payment statistics for a business
 */
export async function getPaymentStatistics(businessId, startDate = null, endDate = null) {
  let dateFilter = '';
  const params = [businessId];
  let paramIndex = 2;

  if (startDate) {
    dateFilter += ` AND created_at >= $${paramIndex}`;
    params.push(startDate);
    paramIndex++;
  }

  if (endDate) {
    dateFilter += ` AND created_at <= $${paramIndex}`;
    params.push(endDate);
  }

  const result = await query(
    `SELECT
       provider,
       COUNT(*) as total_transactions,
       COUNT(*) FILTER (WHERE status = 'completed') as successful_transactions,
       COUNT(*) FILTER (WHERE status = 'failed') as failed_transactions,
       COUNT(*) FILTER (WHERE status = 'pending') as pending_transactions,
       COALESCE(SUM(amount) FILTER (WHERE status = 'completed'), 0) as total_amount,
       COALESCE(AVG(amount) FILTER (WHERE status = 'completed'), 0) as average_amount
     FROM payment_transactions
     WHERE business_id = $1 ${dateFilter}
     GROUP BY provider`,
    params
  );

  return result.rows;
}

export default {
  initializePaystackPayment,
  initializeFlutterwavePayment,
  verifyPaystackPayment,
  verifyFlutterwavePayment,
  verifyPaystackWebhook,
  verifyFlutterwaveWebhook,
  handlePaystackWebhook,
  handleFlutterwaveWebhook,
  getOrderPayments,
  getPaymentStatistics
};
