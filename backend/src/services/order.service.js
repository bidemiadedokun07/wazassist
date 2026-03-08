import { query, transaction } from '../config/database.js';
import { logger } from '../utils/logger.js';
import productService from './product.service.js';

/**
 * Order Processing Service
 * Handles order creation, management, and fulfillment
 */

/**
 * Generate unique order number
 */
function generateOrderNumber() {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `ORD-${timestamp}-${random}`;
}

/**
 * Create a new order
 */
export async function createOrder(orderData) {
  try {
    return await transaction(async (client) => {
      // Calculate subtotal
      const subtotal = orderData.items.reduce((sum, item) => {
        return sum + (item.unitPrice * item.quantity);
      }, 0);

      // Build metadata object for additional fields
      const metadata = {
        deliveryAddress: orderData.deliveryAddress,
        deliveryPhone: orderData.deliveryPhone || orderData.customerPhone,
        paymentMethod: orderData.paymentMethod || 'cash',
        notes: orderData.notes,
        ...orderData.metadata
      };

      // Create the order
      const orderResult = await client.query(
        `INSERT INTO orders (
          business_id, customer_id, conversation_id, order_number,
          customer_phone, customer_name, subtotal, tax_amount,
          total_amount, currency, status, payment_status, metadata
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
        RETURNING *`,
        [
          orderData.businessId,
          orderData.customerId,
          orderData.conversationId || null,
          generateOrderNumber(),
          orderData.customerPhone,
          orderData.customerName || null,
          subtotal,
          orderData.taxAmount || 0,
          orderData.totalAmount || subtotal,
          orderData.currency || 'NGN',
          orderData.status || 'pending',
          orderData.paymentStatus || 'pending',
          JSON.stringify(metadata)
        ]
      );

      const order = orderResult.rows[0];

      // Add order items
      if (orderData.items && orderData.items.length > 0) {
        for (const item of orderData.items) {
          await client.query(
            `INSERT INTO order_items (
              order_id, product_id, product_name, quantity,
              unit_price, total
            ) VALUES ($1, $2, $3, $4, $5, $6)`,
            [
              order.id,
              item.productId,
              item.productName,
              item.quantity,
              item.unitPrice,
              item.quantity * item.unitPrice
            ]
          );

          // Decrement product stock
          await client.query(
            `UPDATE products
             SET quantity_in_stock = GREATEST(quantity_in_stock - $1, 0)
             WHERE id = $2`,
            [item.quantity, item.productId]
          );
        }
      }

      // Get complete order with items
      const completeOrder = await getOrderById(order.id, orderData.businessId, client);

      logger.info('✅ Order created', {
        orderId: order.id,
        businessId: orderData.businessId,
        customerId: orderData.customerId,
        totalAmount: orderData.totalAmount,
        itemsCount: orderData.items?.length || 0
      });

      return completeOrder;
    });
  } catch (error) {
    logger.error('❌ Error creating order', {
      error: error.message,
      businessId: orderData.businessId
    });
    throw error;
  }
}

/**
 * Get order by order number
 */
export async function getOrderByOrderNumber(orderNumber, businessId) {
  try {
    // Get order details
    const orderResult = await query(
      'SELECT * FROM orders WHERE order_number = $1 AND business_id = $2',
      [orderNumber, businessId]
    );

    if (orderResult.rows.length === 0) {
      return null;
    }

    const order = orderResult.rows[0];

    // Get order items
    const itemsResult = await query(
      'SELECT * FROM order_items WHERE order_id = $1 ORDER BY created_at',
      [order.id]
    );

    order.items = itemsResult.rows;

    return order;
  } catch (error) {
    logger.error('❌ Error getting order by number', {
      error: error.message,
      orderNumber
    });
    throw error;
  }
}

/**
 * Get customer's recent orders
 */
export async function getCustomerOrders(customerPhone, businessId, limit = 5) {
  try {
    const result = await query(
      `SELECT o.*, 
              array_agg(json_build_object(
                'product_name', oi.product_name,
                'quantity', oi.quantity,
                'unit_price', oi.unit_price
              )) as items
       FROM orders o
       LEFT JOIN order_items oi ON o.id = oi.order_id
       WHERE o.customer_phone = $1 AND o.business_id = $2
       GROUP BY o.id
       ORDER BY o.created_at DESC
       LIMIT $3`,
      [customerPhone, businessId, limit]
    );

    return result.rows;
  } catch (error) {
    logger.error('❌ Error getting customer orders', {
      error: error.message,
      customerPhone
    });
    throw error;
  }
}

/**
 * Get order by ID
 */
export async function getOrderById(orderId, businessId, client = null) {
  try {
    const executor = client || { query };

    // Get order details
    const orderResult = await executor.query(
      'SELECT * FROM orders WHERE id = $1 AND business_id = $2',
      [orderId, businessId]
    );

    if (orderResult.rows.length === 0) {
      return null;
    }

    const order = orderResult.rows[0];

    // Get order items
    const itemsResult = await executor.query(
      'SELECT * FROM order_items WHERE order_id = $1 ORDER BY created_at',
      [orderId]
    );

    order.items = itemsResult.rows;

    return order;
  } catch (error) {
    logger.error('❌ Error getting order', {
      error: error.message,
      orderId
    });
    throw error;
  }
}

/**
 * Get orders for a business
 */
export async function getOrdersByBusiness(businessId, filters = {}) {
  try {
    let queryText = `
      SELECT o.*,
             COUNT(oi.id) as items_count,
             u.name as customer_name,
             u.phone_number as customer_phone
      FROM orders o
      LEFT JOIN order_items oi ON o.id = oi.order_id
      LEFT JOIN users u ON o.customer_id = u.id
      WHERE o.business_id = $1
    `;
    const queryParams = [businessId];
    let paramIndex = 2;

    // Apply filters
    if (filters.status) {
      queryText += ` AND o.status = $${paramIndex}`;
      queryParams.push(filters.status);
      paramIndex++;
    }

    if (filters.paymentStatus) {
      queryText += ` AND o.payment_status = $${paramIndex}`;
      queryParams.push(filters.paymentStatus);
      paramIndex++;
    }

    if (filters.customerId) {
      queryText += ` AND o.customer_id = $${paramIndex}`;
      queryParams.push(filters.customerId);
      paramIndex++;
    }

    if (filters.startDate) {
      queryText += ` AND o.created_at >= $${paramIndex}`;
      queryParams.push(filters.startDate);
      paramIndex++;
    }

    if (filters.endDate) {
      queryText += ` AND o.created_at <= $${paramIndex}`;
      queryParams.push(filters.endDate);
      paramIndex++;
    }

    queryText += ` GROUP BY o.id, u.name, u.phone_number`;

    // Sorting
    const sortBy = filters.sortBy || 'created_at';
    const sortOrder = filters.sortOrder || 'DESC';
    queryText += ` ORDER BY o.${sortBy} ${sortOrder}`;

    // Pagination
    const limit = filters.limit || 50;
    const offset = filters.offset || 0;
    queryText += ` LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    queryParams.push(limit, offset);

    const result = await query(queryText, queryParams);

    logger.debug('Retrieved orders', {
      businessId,
      count: result.rows.length,
      filters
    });

    return result.rows;
  } catch (error) {
    logger.error('❌ Error getting orders', {
      error: error.message,
      businessId
    });
    throw error;
  }
}

/**
 * Get orders for a customer
 */
export async function getOrdersByCustomer(customerId, businessId, filters = {}) {
  try {
    return await getOrdersByBusiness(businessId, {
      ...filters,
      customerId
    });
  } catch (error) {
    logger.error('❌ Error getting customer orders', {
      error: error.message,
      customerId
    });
    throw error;
  }
}

/**
 * Update order status
 */
export async function updateOrderStatus(orderId, businessId, status, notes = null) {
  try {
    const validStatuses = ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'];

    if (!validStatuses.includes(status)) {
      throw new Error(`Invalid status. Must be one of: ${validStatuses.join(', ')}`);
    }

    // Get current metadata
    const currentOrder = await query(
      'SELECT metadata FROM orders WHERE id = $1 AND business_id = $2',
      [orderId, businessId]
    );

    if (currentOrder.rows.length === 0) {
      throw new Error('Order not found or unauthorized');
    }

    const metadata = currentOrder.rows[0].metadata || {};

    // Add status timestamp to metadata
    if (status === 'confirmed') {
      metadata.confirmedAt = new Date().toISOString();
    } else if (status === 'shipped') {
      metadata.shippedAt = new Date().toISOString();
    } else if (status === 'delivered') {
      metadata.deliveredAt = new Date().toISOString();
    } else if (status === 'cancelled') {
      metadata.cancelledAt = new Date().toISOString();
    }

    if (notes) {
      metadata.statusNotes = metadata.statusNotes || [];
      metadata.statusNotes.push({
        timestamp: new Date().toISOString(),
        note: notes
      });
    }

    const result = await query(
      `UPDATE orders
       SET status = $1, metadata = $2, updated_at = NOW()
       WHERE id = $3 AND business_id = $4
       RETURNING *`,
      [status, JSON.stringify(metadata), orderId, businessId]
    );

    logger.info('✅ Order status updated', {
      orderId,
      businessId,
      newStatus: status
    });

    return result.rows[0];
  } catch (error) {
    logger.error('❌ Error updating order status', {
      error: error.message,
      orderId
    });
    throw error;
  }
}

/**
 * Update payment status
 */
export async function updatePaymentStatus(orderId, businessId, paymentStatus, paymentDetails = {}) {
  try {
    const validStatuses = ['pending', 'paid', 'failed', 'refunded'];

    if (!validStatuses.includes(paymentStatus)) {
      throw new Error(`Invalid payment status. Must be one of: ${validStatuses.join(', ')}`);
    }

    // Get current metadata
    const currentOrder = await query(
      'SELECT metadata FROM orders WHERE id = $1 AND business_id = $2',
      [orderId, businessId]
    );

    if (currentOrder.rows.length === 0) {
      throw new Error('Order not found or unauthorized');
    }

    const metadata = currentOrder.rows[0].metadata || {};

    // Add payment timestamp to metadata
    if (paymentStatus === 'paid') {
      metadata.paidAt = new Date().toISOString();
    }

    // Store payment details
    if (paymentDetails.paymentReference) {
      metadata.paymentReference = paymentDetails.paymentReference;
    }

    if (paymentDetails.paymentGateway) {
      metadata.paymentGateway = paymentDetails.paymentGateway;
    }

    const result = await query(
      `UPDATE orders
       SET payment_status = $1, metadata = $2, updated_at = NOW()
       WHERE id = $3 AND business_id = $4
       RETURNING *`,
      [paymentStatus, JSON.stringify(metadata), orderId, businessId]
    );

    logger.info('✅ Payment status updated', {
      orderId,
      businessId,
      paymentStatus
    });

    return result.rows[0];
  } catch (error) {
    logger.error('❌ Error updating payment status', {
      error: error.message,
      orderId
    });
    throw error;
  }
}

/**
 * Cancel order and restore stock
 */
export async function cancelOrder(orderId, businessId, reason = null) {
  try {
    return await transaction(async (client) => {
      // Get order and its metadata
      const orderResult = await client.query(
        'SELECT * FROM orders WHERE id = $1 AND business_id = $2',
        [orderId, businessId]
      );

      if (orderResult.rows.length === 0) {
        throw new Error('Order not found or unauthorized');
      }

      const metadata = orderResult.rows[0].metadata || {};

      // Get order items to restore stock
      const itemsResult = await client.query(
        'SELECT * FROM order_items WHERE order_id = $1',
        [orderId]
      );

      // Restore stock for each item
      for (const item of itemsResult.rows) {
        await client.query(
          `UPDATE products
           SET quantity_in_stock = quantity_in_stock + $1
           WHERE id = $2`,
          [item.quantity, item.product_id]
        );
      }

      // Update metadata with cancellation info
      metadata.cancelledAt = new Date().toISOString();
      metadata.cancellationReason = reason || 'Order cancelled';

      // Update order status
      const result = await client.query(
        `UPDATE orders
         SET status = 'cancelled',
             metadata = $1,
             updated_at = NOW()
         WHERE id = $2 AND business_id = $3
         RETURNING *`,
        [JSON.stringify(metadata), orderId, businessId]
      );

      logger.info('✅ Order cancelled and stock restored', {
        orderId,
        businessId,
        itemsRestored: itemsResult.rows.length
      });

      return result.rows[0];
    });
  } catch (error) {
    logger.error('❌ Error cancelling order', {
      error: error.message,
      orderId
    });
    throw error;
  }
}

/**
 * Calculate order statistics for a business
 */
export async function getOrderStatistics(businessId, startDate = null, endDate = null) {
  try {
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
         COUNT(*) as total_orders,
         COUNT(*) FILTER (WHERE status = 'pending') as pending_orders,
         COUNT(*) FILTER (WHERE status = 'confirmed') as confirmed_orders,
         COUNT(*) FILTER (WHERE status = 'delivered') as delivered_orders,
         COUNT(*) FILTER (WHERE status = 'cancelled') as cancelled_orders,
         COUNT(*) FILTER (WHERE payment_status = 'paid') as paid_orders,
         COALESCE(SUM(total_amount), 0) as total_revenue,
         COALESCE(SUM(total_amount) FILTER (WHERE payment_status = 'paid'), 0) as paid_revenue,
         COALESCE(AVG(total_amount), 0) as average_order_value
       FROM orders
       WHERE business_id = $1 ${dateFilter}`,
      params
    );

    return result.rows[0];
  } catch (error) {
    logger.error('❌ Error getting order statistics', {
      error: error.message,
      businessId
    });
    throw error;
  }
}

/**
 * Get recent orders
 */
export async function getRecentOrders(businessId, limit = 10) {
  try {
    const result = await query(
      `SELECT o.*, u.name as customer_name, u.phone_number as customer_phone
       FROM orders o
       LEFT JOIN users u ON o.customer_id = u.id
       WHERE o.business_id = $1
       ORDER BY o.created_at DESC
       LIMIT $2`,
      [businessId, limit]
    );

    return result.rows;
  } catch (error) {
    logger.error('❌ Error getting recent orders', {
      error: error.message,
      businessId
    });
    throw error;
  }
}

/**
 * Search orders
 */
export async function searchOrders(businessId, searchTerm) {
  try {
    const result = await query(
      `SELECT o.*, u.name as customer_name, u.phone_number as customer_phone
       FROM orders o
       LEFT JOIN users u ON o.customer_id = u.id
       WHERE o.business_id = $1
       AND (
         o.customer_phone ILIKE $2 OR
         o.customer_name ILIKE $2 OR
         u.name ILIKE $2 OR
         u.phone_number ILIKE $2 OR
         o.id::text ILIKE $2
       )
       ORDER BY o.created_at DESC
       LIMIT 20`,
      [businessId, `%${searchTerm}%`]
    );

    return result.rows;
  } catch (error) {
    logger.error('❌ Error searching orders', {
      error: error.message,
      businessId,
      searchTerm
    });
    throw error;
  }
}

export default {
  createOrder,
  getOrderById,
  getOrdersByBusiness,
  getOrdersByCustomer,
  updateOrderStatus,
  updatePaymentStatus,
  cancelOrder,
  getOrderStatistics,
  getRecentOrders,
  searchOrders
};
