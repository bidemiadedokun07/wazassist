import { query } from '../config/database.js';
import { logger } from '../utils/logger.js';

/**
 * Analytics Service
 * Provides business intelligence and reporting metrics
 */

/**
 * Get comprehensive dashboard overview for a business
 */
export async function getDashboardOverview(businessId, startDate = null, endDate = null) {
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

    // Get all metrics in parallel
    const [
      orderMetrics,
      revenueMetrics,
      customerMetrics,
      conversationMetrics,
      productMetrics,
      paymentMetrics
    ] = await Promise.all([
      getOrderMetrics(businessId, dateFilter, params),
      getRevenueMetrics(businessId, dateFilter, params),
      getCustomerMetrics(businessId, dateFilter, params),
      getConversationMetrics(businessId, dateFilter, params),
      getProductMetrics(businessId, dateFilter, params),
      getPaymentMetrics(businessId, dateFilter, params)
    ]);

    return {
      orders: orderMetrics,
      revenue: revenueMetrics,
      customers: customerMetrics,
      conversations: conversationMetrics,
      products: productMetrics,
      payments: paymentMetrics,
      generatedAt: new Date().toISOString()
    };
  } catch (error) {
    logger.error('❌ Error getting dashboard overview', {
      error: error.message,
      businessId
    });
    throw error;
  }
}

/**
 * Get order metrics
 */
async function getOrderMetrics(businessId, dateFilter, params) {
  const result = await query(
    `SELECT
       COUNT(*) as total_orders,
       COUNT(*) FILTER (WHERE status = 'pending') as pending,
       COUNT(*) FILTER (WHERE status = 'confirmed') as confirmed,
       COUNT(*) FILTER (WHERE status = 'processing') as processing,
       COUNT(*) FILTER (WHERE status = 'shipped') as shipped,
       COUNT(*) FILTER (WHERE status = 'delivered') as delivered,
       COUNT(*) FILTER (WHERE status = 'cancelled') as cancelled,
       COALESCE(AVG(total_amount), 0) as average_order_value
     FROM orders
     WHERE business_id = $1 ${dateFilter}`,
    params
  );

  return result.rows[0];
}

/**
 * Get revenue metrics
 */
async function getRevenueMetrics(businessId, dateFilter, params) {
  const result = await query(
    `SELECT
       COALESCE(SUM(total_amount), 0) as total_revenue,
       COALESCE(SUM(total_amount) FILTER (WHERE payment_status = 'paid'), 0) as paid_revenue,
       COALESCE(SUM(total_amount) FILTER (WHERE payment_status = 'pending'), 0) as pending_revenue,
       COALESCE(SUM(subtotal), 0) as total_subtotal,
       COALESCE(SUM(tax_amount), 0) as total_tax
     FROM orders
     WHERE business_id = $1 ${dateFilter}`,
    params
  );

  return result.rows[0];
}

/**
 * Get customer metrics
 */
async function getCustomerMetrics(businessId, dateFilter, params) {
  const totalCustomers = await query(
    `SELECT COUNT(DISTINCT customer_id) as total
     FROM orders
     WHERE business_id = $1 ${dateFilter}`,
    params
  );

  const newCustomers = await query(
    `SELECT COUNT(DISTINCT o.customer_id) as new_customers
     FROM orders o
     WHERE o.business_id = $1 ${dateFilter}
     AND (
       SELECT COUNT(*) FROM orders o2
       WHERE o2.customer_id = o.customer_id
       AND o2.business_id = $1
       AND o2.created_at < o.created_at
     ) = 0`,
    params
  );

  const returningCustomers = await query(
    `SELECT COUNT(DISTINCT customer_id) as returning
     FROM orders o
     WHERE business_id = $1 ${dateFilter}
     AND (
       SELECT COUNT(*) FROM orders o2
       WHERE o2.customer_id = o.customer_id
       AND o2.business_id = $1
     ) > 1`,
    params
  );

  return {
    total_customers: parseInt(totalCustomers.rows[0].total),
    new_customers: parseInt(newCustomers.rows[0].new_customers),
    returning_customers: parseInt(returningCustomers.rows[0].returning)
  };
}

/**
 * Get conversation metrics
 */
async function getConversationMetrics(businessId, dateFilter, params) {
  const result = await query(
    `SELECT
       COUNT(*) as total_conversations,
       COUNT(*) FILTER (WHERE status = 'active') as active,
       COUNT(*) FILTER (WHERE status = 'resolved') as resolved,
       COALESCE(AVG(message_count), 0) as avg_messages_per_conversation
     FROM conversations
     WHERE business_id = $1 ${dateFilter}`,
    params
  );

  const messages = await query(
    `SELECT
       COUNT(*) as total_messages,
       COUNT(*) FILTER (WHERE direction = 'inbound') as inbound,
       COUNT(*) FILTER (WHERE direction = 'outbound') as outbound,
       COUNT(*) FILTER (WHERE processed_by_ai = true) as ai_processed
     FROM messages m
     JOIN conversations c ON m.conversation_id = c.id
     WHERE c.business_id = $1 ${dateFilter.replace(/created_at/g, 'm.created_at')}`,
    params
  );

  return {
    ...result.rows[0],
    ...messages.rows[0]
  };
}

/**
 * Get product metrics
 */
async function getProductMetrics(businessId, dateFilter, params) {
  const products = await query(
    `SELECT
       COUNT(*) as total_products,
       COUNT(*) FILTER (WHERE is_active = true) as active_products,
       COUNT(*) FILTER (WHERE quantity_in_stock <= low_stock_threshold) as low_stock_products,
       COUNT(*) FILTER (WHERE quantity_in_stock = 0) as out_of_stock_products
     FROM products
     WHERE business_id = $1`,
    [businessId]
  );

  const topSelling = await query(
    `SELECT
       p.id,
       p.name,
       p.category,
       SUM(oi.quantity) as total_sold,
       SUM(oi.total) as total_revenue
     FROM products p
     JOIN order_items oi ON p.id = oi.product_id
     JOIN orders o ON oi.order_id = o.id
     WHERE o.business_id = $1 ${dateFilter.replace(/created_at/g, 'o.created_at')}
     GROUP BY p.id, p.name, p.category
     ORDER BY total_sold DESC
     LIMIT 5`,
    params
  );

  return {
    ...products.rows[0],
    top_selling_products: topSelling.rows
  };
}

/**
 * Get payment metrics
 */
async function getPaymentMetrics(businessId, dateFilter, params) {
  const result = await query(
    `SELECT
       provider,
       COUNT(*) as total_transactions,
       COUNT(*) FILTER (WHERE status = 'completed') as successful,
       COUNT(*) FILTER (WHERE status = 'failed') as failed,
       COUNT(*) FILTER (WHERE status = 'pending') as pending,
       COALESCE(SUM(amount) FILTER (WHERE status = 'completed'), 0) as total_processed
     FROM payment_transactions
     WHERE business_id = $1 ${dateFilter}
     GROUP BY provider`,
    params
  );

  return result.rows;
}

/**
 * Get sales trends over time
 */
export async function getSalesTrends(businessId, interval = 'day', limit = 30) {
  try {
    let dateFormat;
    let dateTrunc;

    switch (interval) {
      case 'hour':
        dateFormat = 'YYYY-MM-DD HH24:00';
        dateTrunc = 'hour';
        break;
      case 'day':
        dateFormat = 'YYYY-MM-DD';
        dateTrunc = 'day';
        break;
      case 'week':
        dateFormat = 'IYYY-IW';
        dateTrunc = 'week';
        break;
      case 'month':
        dateFormat = 'YYYY-MM';
        dateTrunc = 'month';
        break;
      default:
        dateFormat = 'YYYY-MM-DD';
        dateTrunc = 'day';
    }

    const result = await query(
      `SELECT
         TO_CHAR(DATE_TRUNC($1, created_at), $2) as period,
         COUNT(*) as order_count,
         COALESCE(SUM(total_amount), 0) as total_revenue,
         COALESCE(AVG(total_amount), 0) as avg_order_value,
         COUNT(DISTINCT customer_id) as unique_customers
       FROM orders
       WHERE business_id = $3
       AND created_at >= NOW() - INTERVAL '${limit} ${interval}s'
       GROUP BY DATE_TRUNC($1, created_at)
       ORDER BY DATE_TRUNC($1, created_at) DESC
       LIMIT $4`,
      [dateTrunc, dateFormat, businessId, limit]
    );

    return result.rows;
  } catch (error) {
    logger.error('❌ Error getting sales trends', {
      error: error.message,
      businessId
    });
    throw error;
  }
}

/**
 * Get customer insights
 */
export async function getCustomerInsights(businessId, limit = 10) {
  try {
    const topCustomers = await query(
      `SELECT
         u.id,
         u.name,
         u.phone_number,
         COUNT(o.id) as order_count,
         COALESCE(SUM(o.total_amount), 0) as total_spent,
         COALESCE(AVG(o.total_amount), 0) as avg_order_value,
         MAX(o.created_at) as last_order_date
       FROM users u
       JOIN orders o ON u.id = o.customer_id
       WHERE o.business_id = $1
       GROUP BY u.id, u.name, u.phone_number
       ORDER BY total_spent DESC
       LIMIT $2`,
      [businessId, limit]
    );

    const customerLifetime = await query(
      `SELECT
         CASE
           WHEN order_count = 1 THEN 'one_time'
           WHEN order_count BETWEEN 2 AND 5 THEN 'occasional'
           WHEN order_count > 5 THEN 'loyal'
         END as customer_type,
         COUNT(*) as count,
         COALESCE(AVG(total_spent), 0) as avg_lifetime_value
       FROM (
         SELECT
           customer_id,
           COUNT(*) as order_count,
           SUM(total_amount) as total_spent
         FROM orders
         WHERE business_id = $1
         GROUP BY customer_id
       ) customer_orders
       GROUP BY customer_type`,
      [businessId]
    );

    return {
      top_customers: topCustomers.rows,
      customer_segments: customerLifetime.rows
    };
  } catch (error) {
    logger.error('❌ Error getting customer insights', {
      error: error.message,
      businessId
    });
    throw error;
  }
}

/**
 * Get product performance
 */
export async function getProductPerformance(businessId, limit = 20) {
  try {
    const result = await query(
      `SELECT
         p.id,
         p.name,
         p.category,
         p.price,
         p.quantity_in_stock,
         COALESCE(SUM(oi.quantity), 0) as total_sold,
         COALESCE(SUM(oi.total), 0) as total_revenue,
         COALESCE(COUNT(DISTINCT o.customer_id), 0) as unique_buyers,
         COALESCE(AVG(oi.quantity), 0) as avg_quantity_per_order
       FROM products p
       LEFT JOIN order_items oi ON p.id = oi.product_id
       LEFT JOIN orders o ON oi.order_id = o.id AND o.business_id = $1
       WHERE p.business_id = $1
       GROUP BY p.id, p.name, p.category, p.price, p.quantity_in_stock
       ORDER BY total_sold DESC
       LIMIT $2`,
      [businessId, limit]
    );

    return result.rows;
  } catch (error) {
    logger.error('❌ Error getting product performance', {
      error: error.message,
      businessId
    });
    throw error;
  }
}

/**
 * Get conversation response times
 */
export async function getConversationResponseTimes(businessId) {
  try {
    const result = await query(
      `WITH response_times AS (
        SELECT
          c.id as conversation_id,
          EXTRACT(EPOCH FROM (m2.created_at - m1.created_at)) / 60 as response_minutes
        FROM conversations c
        JOIN messages m1 ON m1.conversation_id = c.id AND m1.direction = 'inbound'
        JOIN LATERAL (
          SELECT created_at
          FROM messages m
          WHERE m.conversation_id = c.id
          AND m.direction = 'outbound'
          AND m.created_at > m1.created_at
          ORDER BY m.created_at
          LIMIT 1
        ) m2 ON true
        WHERE c.business_id = $1
      )
      SELECT
        COUNT(*) as total_responses,
        COALESCE(AVG(response_minutes), 0) as avg_response_time_minutes,
        COALESCE(PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY response_minutes), 0) as median_response_time_minutes,
        COUNT(*) FILTER (WHERE response_minutes <= 1) as within_1_minute,
        COUNT(*) FILTER (WHERE response_minutes <= 5) as within_5_minutes,
        COUNT(*) FILTER (WHERE response_minutes <= 60) as within_1_hour
      FROM response_times`,
      [businessId]
    );

    return result.rows[0];
  } catch (error) {
    logger.error('❌ Error getting response times', {
      error: error.message,
      businessId
    });
    throw error;
  }
}

/**
 * Get AI usage statistics
 */
export async function getAIUsageStats(businessId, startDate = null, endDate = null) {
  try {
    let dateFilter = '';
    const params = [businessId];
    let paramIndex = 2;

    if (startDate) {
      dateFilter += ` AND m.created_at >= $${paramIndex}`;
      params.push(startDate);
      paramIndex++;
    }

    if (endDate) {
      dateFilter += ` AND m.created_at <= $${paramIndex}`;
      params.push(endDate);
    }

    const result = await query(
      `SELECT
         COUNT(*) FILTER (WHERE m.processed_by_ai = true) as ai_processed_messages,
         COUNT(*) as total_messages,
         COALESCE(SUM(m.ai_tokens_used), 0) as total_tokens_used,
         COALESCE(AVG(m.ai_tokens_used) FILTER (WHERE m.processed_by_ai = true), 0) as avg_tokens_per_message,
         COUNT(DISTINCT m.ai_model_used) as models_used
       FROM messages m
       JOIN conversations c ON m.conversation_id = c.id
       WHERE c.business_id = $1 ${dateFilter}`,
      params
    );

    return result.rows[0];
  } catch (error) {
    logger.error('❌ Error getting AI usage stats', {
      error: error.message,
      businessId
    });
    throw error;
  }
}

/**
 * Get category performance
 */
export async function getCategoryPerformance(businessId) {
  try {
    const result = await query(
      `SELECT
         p.category,
         COUNT(DISTINCT p.id) as product_count,
         COALESCE(SUM(oi.quantity), 0) as total_units_sold,
         COALESCE(SUM(oi.total), 0) as total_revenue,
         COALESCE(AVG(p.price), 0) as avg_price
       FROM products p
       LEFT JOIN order_items oi ON p.id = oi.product_id
       LEFT JOIN orders o ON oi.order_id = o.id AND o.business_id = $1
       WHERE p.business_id = $1
       GROUP BY p.category
       ORDER BY total_revenue DESC`,
      [businessId]
    );

    return result.rows;
  } catch (error) {
    logger.error('❌ Error getting category performance', {
      error: error.message,
      businessId
    });
    throw error;
  }
}

export default {
  getDashboardOverview,
  getSalesTrends,
  getCustomerInsights,
  getProductPerformance,
  getConversationResponseTimes,
  getAIUsageStats,
  getCategoryPerformance
};
