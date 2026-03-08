import express from 'express';
import orderService from '../../services/order.service.js';
import { logger } from '../../utils/logger.js';
import { authenticate } from '../../middleware/auth.middleware.js';

const router = express.Router();

/**
 * Order Management Routes
 * Base path: /api/v1/orders
 */

/**
 * Transform order data from snake_case to camelCase for frontend
 */
function transformOrder(order) {
  if (!order) return null;

  return {
    id: order.id,
    businessId: order.business_id,
    customerId: order.customer_id,
    customerName: order.customer_name,
    customerPhone: order.customer_phone,
    status: order.status,
    totalAmount: parseFloat(order.total_amount),
    currency: order.currency || 'NGN',
    paymentMethod: order.payment_method,
    paymentStatus: order.payment_status,
    shippingAddress: order.shipping_address,
    deliveryAddress: order.delivery_address,
    deliveryPhone: order.delivery_phone,
    notes: order.notes,
    createdAt: order.created_at,
    updatedAt: order.updated_at,
    items: order.items || []
  };
}

/**
 * Create a new order
 * POST /api/v1/orders
 */
router.post('/', authenticate, async (req, res) => {
  try {
    const {
      businessId,
      customerId,
      customerPhone,
      customerName,
      deliveryAddress,
      deliveryPhone,
      paymentMethod,
      paymentStatus,
      items,
      notes
    } = req.body;

    // Validation
    if (!businessId || !customerId || !customerPhone) {
      return res.status(400).json({
        error: 'Missing required fields: businessId, customerId, customerPhone'
      });
    }

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        error: 'Order must have at least one item'
      });
    }

    // Calculate total amount
    const totalAmount = items.reduce((sum, item) => {
      return sum + (item.unitPrice * item.quantity);
    }, 0);

    const order = await orderService.createOrder({
      businessId,
      customerId,
      customerPhone,
      customerName,
      deliveryAddress,
      deliveryPhone,
      paymentMethod,
      paymentStatus,
      totalAmount,
      items,
      notes
    });

    res.status(201).json({
      success: true,
      data: order,
      message: 'Order created successfully'
    });
  } catch (error) {
    logger.error('Error creating order', { error: error.message });
    res.status(500).json({
      error: 'Failed to create order',
      message: error.message
    });
  }
});

/**
 * Get all orders for a business
 * GET /api/v1/orders/business/:businessId
 */
router.get('/business/:businessId', authenticate, async (req, res) => {
  try {
    const { businessId } = req.params;
    const filters = {
      status: req.query.status,
      paymentStatus: req.query.paymentStatus,
      customerId: req.query.customerId,
      startDate: req.query.startDate,
      endDate: req.query.endDate,
      sortBy: req.query.sortBy,
      sortOrder: req.query.sortOrder,
      limit: parseInt(req.query.limit) || 50,
      offset: parseInt(req.query.offset) || 0
    };

    const orders = await orderService.getOrdersByBusiness(businessId, filters);

    res.json({
      success: true,
      data: orders.map(transformOrder),
      count: orders.length,
      filters
    });
  } catch (error) {
    logger.error('Error getting orders', { error: error.message });
    res.status(500).json({
      error: 'Failed to get orders',
      message: error.message
    });
  }
});

/**
 * Get a single order by ID
 * GET /api/v1/orders/:orderId/business/:businessId
 */
router.get('/:orderId/business/:businessId', authenticate, async (req, res) => {
  try {
    const { orderId, businessId } = req.params;

    const order = await orderService.getOrderById(orderId, businessId);

    if (!order) {
      return res.status(404).json({
        error: 'Order not found'
      });
    }

    res.json({
      success: true,
      data: transformOrder(order)
    });
  } catch (error) {
    logger.error('Error getting order', { error: error.message });
    res.status(500).json({
      error: 'Failed to get order',
      message: error.message
    });
  }
});

/**
 * Get orders for a customer
 * GET /api/v1/orders/customer/:customerId/business/:businessId
 */
router.get('/customer/:customerId/business/:businessId', authenticate, async (req, res) => {
  try {
    const { customerId, businessId } = req.params;
    const filters = {
      status: req.query.status,
      paymentStatus: req.query.paymentStatus,
      limit: parseInt(req.query.limit) || 50,
      offset: parseInt(req.query.offset) || 0
    };

    const orders = await orderService.getOrdersByCustomer(customerId, businessId, filters);

    res.json({
      success: true,
      data: orders.map(transformOrder),
      count: orders.length
    });
  } catch (error) {
    logger.error('Error getting customer orders', { error: error.message });
    res.status(500).json({
      error: 'Failed to get customer orders',
      message: error.message
    });
  }
});

/**
 * Update order status
 * PATCH /api/v1/orders/:orderId/business/:businessId/status
 */
router.patch('/:orderId/business/:businessId/status', authenticate, async (req, res) => {
  try {
    const { orderId, businessId } = req.params;
    const { status, notes } = req.body;

    if (!status) {
      return res.status(400).json({
        error: 'Status is required'
      });
    }

    const order = await orderService.updateOrderStatus(orderId, businessId, status, notes);

    res.json({
      success: true,
      data: order,
      message: 'Order status updated successfully'
    });
  } catch (error) {
    logger.error('Error updating order status', { error: error.message });
    res.status(500).json({
      error: 'Failed to update order status',
      message: error.message
    });
  }
});

/**
 * Update payment status
 * PATCH /api/v1/orders/:orderId/business/:businessId/payment
 */
router.patch('/:orderId/business/:businessId/payment', authenticate, async (req, res) => {
  try {
    const { orderId, businessId } = req.params;
    const { paymentStatus, paymentReference } = req.body;

    if (!paymentStatus) {
      return res.status(400).json({
        error: 'Payment status is required'
      });
    }

    const order = await orderService.updatePaymentStatus(orderId, businessId, paymentStatus, {
      paymentReference
    });

    res.json({
      success: true,
      data: order,
      message: 'Payment status updated successfully'
    });
  } catch (error) {
    logger.error('Error updating payment status', { error: error.message });
    res.status(500).json({
      error: 'Failed to update payment status',
      message: error.message
    });
  }
});

/**
 * Cancel an order
 * POST /api/v1/orders/:orderId/business/:businessId/cancel
 */
router.post('/:orderId/business/:businessId/cancel', authenticate, async (req, res) => {
  try {
    const { orderId, businessId } = req.params;
    const { reason } = req.body;

    const order = await orderService.cancelOrder(orderId, businessId, reason);

    res.json({
      success: true,
      data: order,
      message: 'Order cancelled successfully'
    });
  } catch (error) {
    logger.error('Error cancelling order', { error: error.message });
    res.status(500).json({
      error: 'Failed to cancel order',
      message: error.message
    });
  }
});

/**
 * Get order statistics
 * GET /api/v1/orders/business/:businessId/statistics
 */
router.get('/business/:businessId/statistics', async (req, res) => {
  try {
    const { businessId } = req.params;
    const { startDate, endDate } = req.query;

    const statistics = await orderService.getOrderStatistics(businessId, startDate, endDate);

    res.json({
      success: true,
      data: statistics
    });
  } catch (error) {
    logger.error('Error getting order statistics', { error: error.message });
    res.status(500).json({
      error: 'Failed to get order statistics',
      message: error.message
    });
  }
});

/**
 * Get recent orders
 * GET /api/v1/orders/business/:businessId/recent
 */
router.get('/business/:businessId/recent', async (req, res) => {
  try {
    const { businessId } = req.params;
    const limit = parseInt(req.query.limit) || 10;

    const orders = await orderService.getRecentOrders(businessId, limit);

    res.json({
      success: true,
      data: orders.map(transformOrder),
      count: orders.length
    });
  } catch (error) {
    logger.error('Error getting recent orders', { error: error.message });
    res.status(500).json({
      error: 'Failed to get recent orders',
      message: error.message
    });
  }
});

/**
 * Search orders
 * GET /api/v1/orders/business/:businessId/search
 */
router.get('/business/:businessId/search', async (req, res) => {
  try {
    const { businessId } = req.params;
    const { q } = req.query;

    if (!q) {
      return res.status(400).json({
        error: 'Search query parameter "q" is required'
      });
    }

    const orders = await orderService.searchOrders(businessId, q);

    res.json({
      success: true,
      data: orders.map(transformOrder),
      count: orders.length,
      query: q
    });
  } catch (error) {
    logger.error('Error searching orders', { error: error.message });
    res.status(500).json({
      error: 'Failed to search orders',
      message: error.message
    });
  }
});

export default router;
