import express from 'express';
import paymentService from '../../services/payment.service.js';
import { logger } from '../../utils/logger.js';

const router = express.Router();

/**
 * Payment Routes
 * Base path: /api/v1/payments
 *
 * Handles Paystack and Flutterwave payment integration
 */

/**
 * Initialize Paystack payment
 * POST /api/v1/payments/paystack/initialize
 */
router.post('/paystack/initialize', async (req, res) => {
  try {
    const { orderId, businessId, email, amount, currency } = req.body;

    // Validation
    if (!orderId || !businessId || !email || !amount) {
      return res.status(400).json({
        error: 'Missing required fields: orderId, businessId, email, amount'
      });
    }

    const payment = await paymentService.initializePaystackPayment({
      orderId,
      businessId,
      email,
      amount,
      currency
    });

    res.status(200).json({
      success: true,
      data: payment,
      message: 'Payment initialized successfully'
    });
  } catch (error) {
    logger.error('Error initializing Paystack payment', { error: error.message });
    res.status(500).json({
      error: 'Failed to initialize payment',
      message: error.message
    });
  }
});

/**
 * Initialize Flutterwave payment
 * POST /api/v1/payments/flutterwave/initialize
 */
router.post('/flutterwave/initialize', async (req, res) => {
  try {
    const { orderId, businessId, email, phoneNumber, name, amount, currency } = req.body;

    // Validation
    if (!orderId || !businessId || !email || !phoneNumber || !name || !amount) {
      return res.status(400).json({
        error: 'Missing required fields: orderId, businessId, email, phoneNumber, name, amount'
      });
    }

    const payment = await paymentService.initializeFlutterwavePayment({
      orderId,
      businessId,
      email,
      phoneNumber,
      name,
      amount,
      currency
    });

    res.status(200).json({
      success: true,
      data: payment,
      message: 'Payment initialized successfully'
    });
  } catch (error) {
    logger.error('Error initializing Flutterwave payment', { error: error.message });
    res.status(500).json({
      error: 'Failed to initialize payment',
      message: error.message
    });
  }
});

/**
 * Verify Paystack payment
 * GET /api/v1/payments/paystack/verify/:reference
 */
router.get('/paystack/verify/:reference', async (req, res) => {
  try {
    const { reference } = req.params;

    const verification = await paymentService.verifyPaystackPayment(reference);

    res.status(200).json({
      success: true,
      data: verification
    });
  } catch (error) {
    logger.error('Error verifying Paystack payment', { error: error.message });
    res.status(500).json({
      error: 'Failed to verify payment',
      message: error.message
    });
  }
});

/**
 * Verify Flutterwave payment
 * GET /api/v1/payments/flutterwave/verify/:transactionId
 */
router.get('/flutterwave/verify/:transactionId', async (req, res) => {
  try {
    const { transactionId } = req.params;

    const verification = await paymentService.verifyFlutterwavePayment(transactionId);

    res.status(200).json({
      success: true,
      data: verification
    });
  } catch (error) {
    logger.error('Error verifying Flutterwave payment', { error: error.message });
    res.status(500).json({
      error: 'Failed to verify payment',
      message: error.message
    });
  }
});

/**
 * Paystack webhook
 * POST /api/v1/payments/paystack/webhook
 */
router.post('/paystack/webhook', async (req, res) => {
  try {
    const signature = req.headers['x-paystack-signature'];

    // Verify webhook signature
    if (!paymentService.verifyPaystackWebhook(req.body, signature)) {
      logger.warn('Invalid Paystack webhook signature');
      return res.status(401).json({ error: 'Invalid signature' });
    }

    // Process webhook
    await paymentService.handlePaystackWebhook(req.body);

    res.status(200).json({ received: true });
  } catch (error) {
    logger.error('Error processing Paystack webhook', { error: error.message });
    res.status(500).json({
      error: 'Failed to process webhook',
      message: error.message
    });
  }
});

/**
 * Flutterwave webhook
 * POST /api/v1/payments/flutterwave/webhook
 */
router.post('/flutterwave/webhook', async (req, res) => {
  try {
    const signature = req.headers['verif-hash'];

    // Verify webhook signature
    if (!paymentService.verifyFlutterwaveWebhook(signature)) {
      logger.warn('Invalid Flutterwave webhook signature');
      return res.status(401).json({ error: 'Invalid signature' });
    }

    // Process webhook
    await paymentService.handleFlutterwaveWebhook(req.body);

    res.status(200).json({ received: true });
  } catch (error) {
    logger.error('Error processing Flutterwave webhook', { error: error.message });
    res.status(500).json({
      error: 'Failed to process webhook',
      message: error.message
    });
  }
});

/**
 * Paystack callback (redirect after payment)
 * GET /api/v1/payments/paystack/callback
 */
router.get('/paystack/callback', async (req, res) => {
  try {
    const { reference, trxref } = req.query;
    const ref = reference || trxref;

    if (!ref) {
      return res.status(400).send('Missing payment reference');
    }

    // Verify payment
    const verification = await paymentService.verifyPaystackPayment(ref);

    if (verification.success) {
      // Redirect to success page
      res.redirect(`${process.env.FRONTEND_URL}/payment/success?reference=${ref}`);
    } else {
      // Redirect to failure page
      res.redirect(`${process.env.FRONTEND_URL}/payment/failed?reference=${ref}`);
    }
  } catch (error) {
    logger.error('Error in Paystack callback', { error: error.message });
    res.redirect(`${process.env.FRONTEND_URL}/payment/error`);
  }
});

/**
 * Flutterwave callback (redirect after payment)
 * GET /api/v1/payments/flutterwave/callback
 */
router.get('/flutterwave/callback', async (req, res) => {
  try {
    const { transaction_id, tx_ref, status } = req.query;

    if (!transaction_id) {
      return res.status(400).send('Missing transaction ID');
    }

    // Verify payment
    const verification = await paymentService.verifyFlutterwavePayment(transaction_id);

    if (verification.success) {
      // Redirect to success page
      res.redirect(`${process.env.FRONTEND_URL}/payment/success?reference=${tx_ref}`);
    } else {
      // Redirect to failure page
      res.redirect(`${process.env.FRONTEND_URL}/payment/failed?reference=${tx_ref}`);
    }
  } catch (error) {
    logger.error('Error in Flutterwave callback', { error: error.message });
    res.redirect(`${process.env.FRONTEND_URL}/payment/error`);
  }
});

/**
 * Get payments for an order
 * GET /api/v1/payments/order/:orderId/business/:businessId
 */
router.get('/order/:orderId/business/:businessId', async (req, res) => {
  try {
    const { orderId, businessId } = req.params;

    const payments = await paymentService.getOrderPayments(orderId, businessId);

    res.status(200).json({
      success: true,
      data: payments,
      count: payments.length
    });
  } catch (error) {
    logger.error('Error getting order payments', { error: error.message });
    res.status(500).json({
      error: 'Failed to get payments',
      message: error.message
    });
  }
});

/**
 * Get payment statistics
 * GET /api/v1/payments/business/:businessId/statistics
 */
router.get('/business/:businessId/statistics', async (req, res) => {
  try {
    const { businessId } = req.params;
    const { startDate, endDate } = req.query;

    const statistics = await paymentService.getPaymentStatistics(
      businessId,
      startDate,
      endDate
    );

    res.status(200).json({
      success: true,
      data: statistics
    });
  } catch (error) {
    logger.error('Error getting payment statistics', { error: error.message });
    res.status(500).json({
      error: 'Failed to get statistics',
      message: error.message
    });
  }
});

export default router;
