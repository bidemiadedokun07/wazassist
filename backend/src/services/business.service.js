import { query } from '../config/database.js';
import { logger } from '../utils/logger.js';

/**
 * Business Service
 * Handles business profile management
 */

/**
 * Create a new business
 */
export async function createBusiness(businessData) {
  try {
    const {
      ownerId,
      businessName,
      description,
      businessType,
      phoneNumber,
      email,
      whatsappPhoneNumberId,
      whatsappAccessToken,
      settings = {}
    } = businessData;

    const result = await query(
      `INSERT INTO businesses (
        owner_id, business_name, description, business_type, phone_number,
        email, whatsapp_phone_number_id,
        whatsapp_access_token, metadata, is_active
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, true)
      RETURNING *`,
      [
        ownerId,
        businessName,
        description,
        businessType,
        phoneNumber,
        email,
        whatsappPhoneNumberId,
        whatsappAccessToken,
        JSON.stringify(settings)
      ]
    );

    logger.info('✅ Business created', {
      businessId: result.rows[0].id,
      businessName,
      ownerId
    });

    return result.rows[0];
  } catch (error) {
    logger.error('❌ Error creating business', {
      error: error.message,
      businessName: businessData.businessName
    });
    throw error;
  }
}

/**
 * Get business by ID
 */
export async function getBusinessById(businessId) {
  try {
    const result = await query(
      `SELECT
        b.*,
        u.name as owner_name,
        u.email as owner_email,
        u.phone_number as owner_phone
      FROM businesses b
      LEFT JOIN users u ON b.owner_id = u.id
      WHERE b.id = $1`,
      [businessId]
    );

    if (result.rows.length === 0) {
      throw new Error('Business not found');
    }

    return result.rows[0];
  } catch (error) {
    logger.error('❌ Error getting business', {
      error: error.message,
      businessId
    });
    throw error;
  }
}

/**
 * Get businesses by owner ID
 */
export async function getBusinessesByOwner(ownerId) {
  try {
    const result = await query(
      `SELECT * FROM businesses
       WHERE owner_id = $1
       ORDER BY created_at DESC`,
      [ownerId]
    );

    return result.rows;
  } catch (error) {
    logger.error('❌ Error getting businesses by owner', {
      error: error.message,
      ownerId
    });
    throw error;
  }
}

/**
 * Get all businesses (with pagination)
 */
export async function getAllBusinesses(options = {}) {
  try {
    const {
      limit = 20,
      offset = 0,
      isActive,
      businessType
    } = options;

    let whereClause = '';
    const params = [];
    let paramIndex = 1;

    const conditions = [];

    if (isActive !== undefined) {
      conditions.push(`b.is_active = $${paramIndex++}`);
      params.push(isActive);
    }

    if (businessType) {
      conditions.push(`b.business_type = $${paramIndex++}`);
      params.push(businessType);
    }

    if (conditions.length > 0) {
      whereClause = 'WHERE ' + conditions.join(' AND ');
    }

    params.push(limit, offset);

    const result = await query(
      `SELECT
        b.*,
        u.name as owner_name,
        (SELECT COUNT(*) FROM products WHERE business_id = b.id AND is_active = true) as product_count,
        (SELECT COUNT(*) FROM orders WHERE business_id = b.id) as order_count
      FROM businesses b
      LEFT JOIN users u ON b.owner_id = u.id
      ${whereClause}
      ORDER BY b.created_at DESC
      LIMIT $${paramIndex++} OFFSET $${paramIndex}`,
      params
    );

    // Get total count
    const countResult = await query(
      `SELECT COUNT(*) FROM businesses b ${whereClause}`,
      params.slice(0, -2)
    );

    return {
      businesses: result.rows,
      total: parseInt(countResult.rows[0].count),
      limit,
      offset
    };
  } catch (error) {
    logger.error('❌ Error getting all businesses', {
      error: error.message
    });
    throw error;
  }
}

/**
 * Update business
 */
export async function updateBusiness(businessId, updates) {
  try {
    const setClauses = [];
    const values = [];
    let paramIndex = 1;

    // Map camelCase to snake_case for database fields
    const fieldMapping = {
      name: 'business_name',
      businessName: 'business_name',
      category: 'business_type',
      businessType: 'business_type',
      phoneNumber: 'phone_number',
      whatsappNumber: 'whatsapp_phone_number_id',
      whatsappPhoneNumberId: 'whatsapp_phone_number_id',
      whatsappAccessToken: 'whatsapp_access_token',
      logoUrl: 'logo_url',
      isActive: 'is_active',
      aiEnabled: 'ai_enabled',
      // Direct mappings (snake_case)
      business_name: 'business_name',
      description: 'description',
      business_type: 'business_type',
      phone_number: 'phone_number',
      email: 'email',
      address: 'address',
      logo_url: 'logo_url',
      whatsapp_phone_number_id: 'whatsapp_phone_number_id',
      whatsapp_access_token: 'whatsapp_access_token',
      metadata: 'metadata',
      is_active: 'is_active',
      ai_enabled: 'ai_enabled'
    };

    for (const [key, value] of Object.entries(updates)) {
      const dbField = fieldMapping[key];

      if (dbField && value !== undefined) {
        setClauses.push(`${dbField} = $${paramIndex++}`);

        // Handle special cases
        if (dbField === 'metadata' && typeof value === 'object') {
          values.push(JSON.stringify(value));
        } else {
          values.push(value);
        }
      }
    }

    if (setClauses.length === 0) {
      throw new Error('No valid fields to update');
    }

    // Add updated_at
    setClauses.push(`updated_at = CURRENT_TIMESTAMP`);

    values.push(businessId);

    const result = await query(
      `UPDATE businesses
       SET ${setClauses.join(', ')}
       WHERE id = $${paramIndex}
       RETURNING *`,
      values
    );

    if (result.rows.length === 0) {
      throw new Error('Business not found');
    }

    logger.info('✅ Business updated', {
      businessId,
      updatedFields: Object.keys(updates)
    });

    return result.rows[0];
  } catch (error) {
    logger.error('❌ Error updating business', {
      error: error.message,
      businessId
    });
    throw error;
  }
}

/**
 * Delete business (soft delete)
 */
export async function deleteBusiness(businessId) {
  try {
    const result = await query(
      `UPDATE businesses
       SET is_active = false, updated_at = CURRENT_TIMESTAMP
       WHERE id = $1
       RETURNING *`,
      [businessId]
    );

    if (result.rows.length === 0) {
      throw new Error('Business not found');
    }

    logger.info('✅ Business deleted (soft)', {
      businessId
    });

    return result.rows[0];
  } catch (error) {
    logger.error('❌ Error deleting business', {
      error: error.message,
      businessId
    });
    throw error;
  }
}

/**
 * Get business statistics
 */
export async function getBusinessStatistics(businessId) {
  try {
    // Get product stats
    const productStats = await query(
      `SELECT
        COUNT(*) as total_products,
        COUNT(*) FILTER (WHERE is_active = true) as active_products,
        COUNT(*) FILTER (WHERE quantity_in_stock <= low_stock_threshold) as low_stock_products,
        COUNT(*) FILTER (WHERE quantity_in_stock = 0) as out_of_stock_products
      FROM products
      WHERE business_id = $1`,
      [businessId]
    );

    // Get order stats
    const orderStats = await query(
      `SELECT
        COUNT(*) as total_orders,
        COUNT(*) FILTER (WHERE status = 'delivered') as delivered_orders,
        COUNT(*) FILTER (WHERE status = 'cancelled') as cancelled_orders,
        COUNT(*) FILTER (WHERE payment_status = 'paid') as paid_orders,
        COALESCE(SUM(total_amount), 0) as total_revenue,
        COALESCE(SUM(total_amount) FILTER (WHERE payment_status = 'paid'), 0) as paid_revenue
      FROM orders
      WHERE business_id = $1`,
      [businessId]
    );

    // Get customer stats
    const customerStats = await query(
      `SELECT
        COUNT(DISTINCT customer_id) as total_customers,
        COUNT(DISTINCT customer_id) FILTER (WHERE created_at >= NOW() - INTERVAL '30 days') as customers_last_30_days
      FROM orders
      WHERE business_id = $1`,
      [businessId]
    );

    // Get conversation stats
    const conversationStats = await query(
      `SELECT
        COUNT(*) as total_conversations,
        COUNT(*) FILTER (WHERE status = 'active') as active_conversations,
        COALESCE(AVG(message_count), 0) as avg_messages_per_conversation
      FROM conversations
      WHERE business_id = $1`,
      [businessId]
    );

    return {
      products: productStats.rows[0],
      orders: orderStats.rows[0],
      customers: customerStats.rows[0],
      conversations: conversationStats.rows[0]
    };
  } catch (error) {
    logger.error('❌ Error getting business statistics', {
      error: error.message,
      businessId
    });
    throw error;
  }
}

/**
 * Update business settings
 */
export async function updateBusinessSettings(businessId, settings) {
  try {
    // Get existing settings
    const existing = await query(
      'SELECT metadata FROM businesses WHERE id = $1',
      [businessId]
    );

    if (existing.rows.length === 0) {
      throw new Error('Business not found');
    }

    // Merge with existing settings
    const currentSettings = existing.rows[0].metadata || {};
    const updatedSettings = { ...currentSettings, ...settings };

    const result = await query(
      `UPDATE businesses
       SET metadata = $1, updated_at = CURRENT_TIMESTAMP
       WHERE id = $2
       RETURNING *`,
      [JSON.stringify(updatedSettings), businessId]
    );

    logger.info('✅ Business settings updated', {
      businessId,
      settingsKeys: Object.keys(settings)
    });

    return result.rows[0];
  } catch (error) {
    logger.error('❌ Error updating business settings', {
      error: error.message,
      businessId
    });
    throw error;
  }
}

/**
 * Search businesses
 */
export async function searchBusinesses(searchTerm, options = {}) {
  try {
    const { limit = 20, offset = 0 } = options;

    const result = await query(
      `SELECT
        b.*,
        u.name as owner_name
      FROM businesses b
      LEFT JOIN users u ON b.owner_id = u.id
      WHERE (
        b.business_name ILIKE $1
        OR b.description ILIKE $1
        OR b.business_type ILIKE $1
      )
      AND b.is_active = true
      ORDER BY b.business_name
      LIMIT $2 OFFSET $3`,
      [`%${searchTerm}%`, limit, offset]
    );

    return result.rows;
  } catch (error) {
    logger.error('❌ Error searching businesses', {
      error: error.message,
      searchTerm
    });
    throw error;
  }
}

/**
 * Get business types/categories
 */
export async function getBusinessCategories() {
  try {
    const result = await query(
      `SELECT DISTINCT business_type as category, COUNT(*) as count
       FROM businesses
       WHERE business_type IS NOT NULL AND is_active = true
       GROUP BY business_type
       ORDER BY count DESC, business_type`
    );

    return result.rows;
  } catch (error) {
    logger.error('❌ Error getting business categories', {
      error: error.message
    });
    throw error;
  }
}

export default {
  createBusiness,
  getBusinessById,
  getBusinessesByOwner,
  getAllBusinesses,
  updateBusiness,
  deleteBusiness,
  getBusinessStatistics,
  updateBusinessSettings,
  searchBusinesses,
  getBusinessCategories
};
