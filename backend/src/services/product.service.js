import { query, transaction } from '../config/database.js';
import { logger } from '../utils/logger.js';

/**
 * Product Management Service
 * Handles CRUD operations for products and inventory management
 */

/**
 * Create a new product
 */
export async function createProduct(productData) {
  try {
    const result = await query(
      `INSERT INTO products (
        business_id, name, description, price, currency, sku,
        category, quantity_in_stock, low_stock_threshold, primary_image_url,
        is_active, metadata
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      RETURNING *`,
      [
        productData.businessId,
        productData.name,
        productData.description || null,
        productData.price,
        productData.currency || 'NGN',
        productData.sku || null,
        productData.category || 'general',
        productData.stockQuantity || 0,
        productData.lowStockThreshold || 10,
        productData.imageUrl || null,
        productData.isActive !== false, // Default to true
        JSON.stringify(productData.metadata || {})
      ]
    );

    logger.info('✅ Product created', {
      productId: result.rows[0].id,
      businessId: productData.businessId,
      name: productData.name
    });

    return result.rows[0];
  } catch (error) {
    logger.error('❌ Error creating product', {
      error: error.message,
      businessId: productData.businessId
    });
    throw error;
  }
}

/**
 * Get product by ID
 */
export async function getProductById(productId, businessId) {
  try {
    const result = await query(
      'SELECT * FROM products WHERE id = $1 AND business_id = $2',
      [productId, businessId]
    );

    if (result.rows.length === 0) {
      return null;
    }

    return result.rows[0];
  } catch (error) {
    logger.error('❌ Error getting product', {
      error: error.message,
      productId
    });
    throw error;
  }
}

/**
 * Get all products for a business
 */
export async function getProductsByBusiness(businessId, filters = {}) {
  try {
    let queryText = 'SELECT * FROM products WHERE business_id = $1';
    const queryParams = [businessId];
    let paramIndex = 2;

    // Apply filters
    if (filters.category) {
      queryText += ` AND category = $${paramIndex}`;
      queryParams.push(filters.category);
      paramIndex++;
    }

    if (filters.isActive !== undefined) {
      queryText += ` AND is_active = $${paramIndex}`;
      queryParams.push(filters.isActive);
      paramIndex++;
    }

    if (filters.inStock) {
      queryText += ` AND quantity_in_stock > 0`;
    }

    if (filters.search) {
      queryText += ` AND (name ILIKE $${paramIndex} OR description ILIKE $${paramIndex})`;
      queryParams.push(`%${filters.search}%`);
      paramIndex++;
    }

    // Sorting
    const sortBy = filters.sortBy || 'created_at';
    const sortOrder = filters.sortOrder || 'DESC';
    queryText += ` ORDER BY ${sortBy} ${sortOrder}`;

    // Pagination
    const limit = filters.limit || 50;
    const offset = filters.offset || 0;
    queryText += ` LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    queryParams.push(limit, offset);

    const result = await query(queryText, queryParams);

    logger.debug('Retrieved products', {
      businessId,
      count: result.rows.length,
      filters
    });

    return result.rows;
  } catch (error) {
    logger.error('❌ Error getting products', {
      error: error.message,
      businessId
    });
    throw error;
  }
}

/**
 * Update product
 */
export async function updateProduct(productId, businessId, updates) {
  try {
    const setClauses = [];
    const values = [];
    let paramIndex = 1;

    // Build dynamic UPDATE query
    const allowedFields = [
      'name', 'description', 'price', 'currency', 'sku', 'category',
      'quantity_in_stock', 'low_stock_threshold', 'primary_image_url', 'is_active', 'metadata'
    ];

    Object.keys(updates).forEach(key => {
      const dbKey = key.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
      if (allowedFields.includes(dbKey)) {
        setClauses.push(`${dbKey} = $${paramIndex}`);
        values.push(dbKey === 'metadata' ? JSON.stringify(updates[key]) : updates[key]);
        paramIndex++;
      }
    });

    if (setClauses.length === 0) {
      throw new Error('No valid fields to update');
    }

    setClauses.push(`updated_at = NOW()`);
    values.push(productId, businessId);

    const result = await query(
      `UPDATE products
       SET ${setClauses.join(', ')}
       WHERE id = $${paramIndex} AND business_id = $${paramIndex + 1}
       RETURNING *`,
      values
    );

    if (result.rows.length === 0) {
      throw new Error('Product not found or unauthorized');
    }

    logger.info('✅ Product updated', {
      productId,
      businessId,
      updatedFields: Object.keys(updates)
    });

    return result.rows[0];
  } catch (error) {
    logger.error('❌ Error updating product', {
      error: error.message,
      productId,
      businessId
    });
    throw error;
  }
}

/**
 * Delete product (soft delete by setting is_active to false)
 */
export async function deleteProduct(productId, businessId) {
  try {
    const result = await query(
      'UPDATE products SET is_active = false, updated_at = NOW() WHERE id = $1 AND business_id = $2 RETURNING *',
      [productId, businessId]
    );

    if (result.rows.length === 0) {
      throw new Error('Product not found or unauthorized');
    }

    logger.info('✅ Product deleted (soft)', {
      productId,
      businessId
    });

    return result.rows[0];
  } catch (error) {
    logger.error('❌ Error deleting product', {
      error: error.message,
      productId
    });
    throw error;
  }
}

/**
 * Update product stock
 */
export async function updateStock(productId, businessId, quantity, operation = 'set') {
  try {
    let queryText;

    if (operation === 'set') {
      queryText = `
        UPDATE products
        SET quantity_in_stock = $1, updated_at = NOW()
        WHERE id = $2 AND business_id = $3
        RETURNING *
      `;
    } else if (operation === 'increment') {
      queryText = `
        UPDATE products
        SET quantity_in_stock = quantity_in_stock + $1, updated_at = NOW()
        WHERE id = $2 AND business_id = $3
        RETURNING *
      `;
    } else if (operation === 'decrement') {
      queryText = `
        UPDATE products
        SET quantity_in_stock = GREATEST(quantity_in_stock - $1, 0), updated_at = NOW()
        WHERE id = $2 AND business_id = $3
        RETURNING *
      `;
    } else {
      throw new Error('Invalid operation. Use: set, increment, or decrement');
    }

    const result = await query(queryText, [quantity, productId, businessId]);

    if (result.rows.length === 0) {
      throw new Error('Product not found or unauthorized');
    }

    const product = result.rows[0];

    // Check if stock is low
    if (product.quantity_in_stock <= product.low_stock_threshold) {
      logger.warn('⚠️  Low stock alert', {
        productId,
        productName: product.name,
        stockQuantity: product.quantity_in_stock,
        threshold: product.low_stock_threshold
      });
    }

    logger.info('✅ Stock updated', {
      productId,
      operation,
      quantity,
      newStock: product.quantity_in_stock
    });

    return product;
  } catch (error) {
    logger.error('❌ Error updating stock', {
      error: error.message,
      productId
    });
    throw error;
  }
}

/**
 * Get products by category
 */
export async function getProductsByCategory(businessId, category) {
  try {
    const result = await query(
      'SELECT * FROM products WHERE business_id = $1 AND category = $2 AND is_active = true ORDER BY name ASC',
      [businessId, category]
    );

    return result.rows;
  } catch (error) {
    logger.error('❌ Error getting products by category', {
      error: error.message,
      businessId,
      category
    });
    throw error;
  }
}

/**
 * Search products
 */
export async function searchProducts(businessId, searchTerm) {
  try {
    const result = await query(
      `SELECT * FROM products
       WHERE business_id = $1
       AND is_active = true
       AND (
         name ILIKE $2 OR
         description ILIKE $2 OR
         category ILIKE $2 OR
         sku ILIKE $2
       )
       ORDER BY name ASC
       LIMIT 20`,
      [businessId, `%${searchTerm}%`]
    );

    logger.debug('Product search results', {
      businessId,
      searchTerm,
      resultsCount: result.rows.length
    });

    return result.rows;
  } catch (error) {
    logger.error('❌ Error searching products', {
      error: error.message,
      businessId,
      searchTerm
    });
    throw error;
  }
}

/**
 * Get low stock products
 */
export async function getLowStockProducts(businessId) {
  try {
    const result = await query(
      `SELECT * FROM products
       WHERE business_id = $1
       AND is_active = true
       AND quantity_in_stock <= low_stock_threshold
       ORDER BY quantity_in_stock ASC`,
      [businessId]
    );

    logger.info('Low stock products retrieved', {
      businessId,
      count: result.rows.length
    });

    return result.rows;
  } catch (error) {
    logger.error('❌ Error getting low stock products', {
      error: error.message,
      businessId
    });
    throw error;
  }
}

/**
 * Get product categories for a business
 */
export async function getCategories(businessId) {
  try {
    const result = await query(
      `SELECT DISTINCT category, COUNT(*) as product_count
       FROM products
       WHERE business_id = $1 AND is_active = true
       GROUP BY category
       ORDER BY category ASC`,
      [businessId]
    );

    return result.rows;
  } catch (error) {
    logger.error('❌ Error getting categories', {
      error: error.message,
      businessId
    });
    throw error;
  }
}

/**
 * Bulk create products
 */
export async function bulkCreateProducts(businessId, productsArray) {
  try {
    const createdProducts = await transaction(async (client) => {
      const products = [];

      for (const productData of productsArray) {
        const result = await client.query(
          `INSERT INTO products (
            business_id, name, description, price, currency, sku,
            category, quantity_in_stock, low_stock_threshold, primary_image_url,
            is_active, metadata
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
          RETURNING *`,
          [
            businessId,
            productData.name,
            productData.description || null,
            productData.price,
            productData.currency || 'NGN',
            productData.sku || null,
            productData.category || 'general',
            productData.stockQuantity || 0,
            productData.lowStockThreshold || 10,
            productData.imageUrl || null,
            productData.isActive !== false,
            JSON.stringify(productData.metadata || {})
          ]
        );

        products.push(result.rows[0]);
      }

      return products;
    });

    logger.info('✅ Bulk products created', {
      businessId,
      count: createdProducts.length
    });

    return createdProducts;
  } catch (error) {
    logger.error('❌ Error bulk creating products', {
      error: error.message,
      businessId
    });
    throw error;
  }
}

export default {
  createProduct,
  getProductById,
  getProductsByBusiness,
  updateProduct,
  deleteProduct,
  updateStock,
  getProductsByCategory,
  searchProducts,
  getLowStockProducts,
  getCategories,
  bulkCreateProducts
};
