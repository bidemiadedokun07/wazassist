import express from 'express';
import productService from '../../services/product.service.js';
import { logger } from '../../utils/logger.js';
import { authenticate } from '../../middleware/auth.middleware.js';

const router = express.Router();

/**
 * Product Management Routes
 * Base path: /api/v1/products
 */

/**
 * Transform product data from snake_case to camelCase for frontend
 */
function transformProduct(product) {
  if (!product) return null;

  return {
    id: product.id,
    businessId: product.business_id,
    name: product.name,
    description: product.description,
    price: parseFloat(product.price),
    currency: product.currency || 'NGN',
    sku: product.sku,
    category: product.category,
    stock: product.quantity_in_stock,
    lowStockThreshold: product.low_stock_threshold,
    imageUrl: product.primary_image_url,
    images: product.images || [],
    isActive: product.is_active,
    createdAt: product.created_at,
    updatedAt: product.updated_at,
    metadata: product.metadata
  };
}

/**
 * Create a new product
 * POST /api/v1/products
 */
router.post('/', authenticate, async (req, res) => {
  try {
    const {
      businessId,
      name,
      description,
      price,
      currency,
      sku,
      category,
      stock,
      stockQuantity, // Also accept this for compatibility
      lowStockThreshold,
      imageUrl,
      isActive,
      metadata
    } = req.body;

    // Validation
    if (!businessId || !name || !price) {
      return res.status(400).json({
        error: 'Missing required fields: businessId, name, price'
      });
    }

    if (price < 0) {
      return res.status(400).json({
        error: 'Price must be a positive number'
      });
    }

    const product = await productService.createProduct({
      businessId,
      name,
      description,
      price,
      currency,
      sku,
      category,
      stockQuantity: stock || stockQuantity || 0,
      lowStockThreshold: lowStockThreshold || 5,
      imageUrl,
      isActive: isActive !== false,
      metadata
    });

    res.status(201).json({
      success: true,
      data: transformProduct(product),
      message: 'Product created successfully'
    });
  } catch (error) {
    logger.error('Error creating product', { error: error.message });
    res.status(500).json({
      error: 'Failed to create product',
      message: error.message
    });
  }
});

/**
 * Get all products for a business
 * GET /api/v1/products/business/:businessId
 */
router.get('/business/:businessId', authenticate, async (req, res) => {
  try {
    const { businessId } = req.params;
    const filters = {
      category: req.query.category,
      isActive: req.query.isActive === 'true' ? true : req.query.isActive === 'false' ? false : undefined,
      inStock: req.query.inStock === 'true',
      search: req.query.search,
      sortBy: req.query.sortBy,
      sortOrder: req.query.sortOrder,
      limit: parseInt(req.query.limit) || 50,
      offset: parseInt(req.query.offset) || 0
    };

    const products = await productService.getProductsByBusiness(businessId, filters);
    const transformedProducts = products.map(transformProduct);

    res.json({
      success: true,
      data: transformedProducts,
      count: transformedProducts.length,
      filters
    });
  } catch (error) {
    logger.error('Error getting products', { error: error.message });
    res.status(500).json({
      error: 'Failed to get products',
      message: error.message
    });
  }
});

/**
 * Get a single product by ID
 * GET /api/v1/products/:productId/business/:businessId
 */
router.get('/:productId/business/:businessId', authenticate, async (req, res) => {
  try {
    const { productId, businessId } = req.params;

    const product = await productService.getProductById(productId, businessId);

    if (!product) {
      return res.status(404).json({
        error: 'Product not found'
      });
    }

    res.json({
      success: true,
      data: transformProduct(product)
    });
  } catch (error) {
    logger.error('Error getting product', { error: error.message });
    res.status(500).json({
      error: 'Failed to get product',
      message: error.message
    });
  }
});

/**
 * Update a product
 * PUT /api/v1/products/:productId/business/:businessId
 */
router.put('/:productId/business/:businessId', authenticate, async (req, res) => {
  try {
    const { productId, businessId } = req.params;
    const updates = req.body;

    // Remove fields that shouldn't be updated directly
    delete updates.id;
    delete updates.businessId;
    delete updates.createdAt;

    // Map camelCase to snake_case if needed
    if (updates.stock !== undefined) {
      updates.stockQuantity = updates.stock;
      delete updates.stock;
    }

    const product = await productService.updateProduct(productId, businessId, updates);

    res.json({
      success: true,
      data: transformProduct(product),
      message: 'Product updated successfully'
    });
  } catch (error) {
    logger.error('Error updating product', { error: error.message });
    res.status(500).json({
      error: 'Failed to update product',
      message: error.message
    });
  }
});

/**
 * Delete a product (soft delete)
 * DELETE /api/v1/products/:productId/business/:businessId
 */
router.delete('/:productId/business/:businessId', authenticate, async (req, res) => {
  try {
    const { productId, businessId } = req.params;

    const product = await productService.deleteProduct(productId, businessId);

    res.json({
      success: true,
      data: transformProduct(product),
      message: 'Product deleted successfully'
    });
  } catch (error) {
    logger.error('Error deleting product', { error: error.message });
    res.status(500).json({
      error: 'Failed to delete product',
      message: error.message
    });
  }
});

/**
 * Update product stock
 * PATCH /api/v1/products/:productId/business/:businessId/stock
 */
router.patch('/:productId/business/:businessId/stock', authenticate, async (req, res) => {
  try {
    const { productId, businessId } = req.params;
    const { quantity, operation } = req.body;

    if (quantity === undefined || quantity < 0) {
      return res.status(400).json({
        error: 'Quantity must be a non-negative number'
      });
    }

    if (operation && !['set', 'increment', 'decrement'].includes(operation)) {
      return res.status(400).json({
        error: 'Operation must be one of: set, increment, decrement'
      });
    }

    const product = await productService.updateStock(
      productId,
      businessId,
      quantity,
      operation || 'set'
    );

    res.json({
      success: true,
      data: product,
      message: 'Stock updated successfully'
    });
  } catch (error) {
    logger.error('Error updating stock', { error: error.message });
    res.status(500).json({
      error: 'Failed to update stock',
      message: error.message
    });
  }
});

/**
 * Search products
 * GET /api/v1/products/business/:businessId/search
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

    const products = await productService.searchProducts(businessId, q);

    res.json({
      success: true,
      data: products,
      count: products.length,
      query: q
    });
  } catch (error) {
    logger.error('Error searching products', { error: error.message });
    res.status(500).json({
      error: 'Failed to search products',
      message: error.message
    });
  }
});

/**
 * Get products by category
 * GET /api/v1/products/business/:businessId/category/:category
 */
router.get('/business/:businessId/category/:category', async (req, res) => {
  try {
    const { businessId, category } = req.params;

    const products = await productService.getProductsByCategory(businessId, category);

    res.json({
      success: true,
      data: products,
      count: products.length,
      category
    });
  } catch (error) {
    logger.error('Error getting products by category', { error: error.message });
    res.status(500).json({
      error: 'Failed to get products by category',
      message: error.message
    });
  }
});

/**
 * Get low stock products
 * GET /api/v1/products/business/:businessId/low-stock
 */
router.get('/business/:businessId/low-stock', async (req, res) => {
  try {
    const { businessId } = req.params;

    const products = await productService.getLowStockProducts(businessId);

    res.json({
      success: true,
      data: products,
      count: products.length
    });
  } catch (error) {
    logger.error('Error getting low stock products', { error: error.message });
    res.status(500).json({
      error: 'Failed to get low stock products',
      message: error.message
    });
  }
});

/**
 * Get product categories
 * GET /api/v1/products/business/:businessId/categories
 */
router.get('/business/:businessId/categories', async (req, res) => {
  try {
    const { businessId } = req.params;

    const categories = await productService.getCategories(businessId);

    res.json({
      success: true,
      data: categories,
      count: categories.length
    });
  } catch (error) {
    logger.error('Error getting categories', { error: error.message });
    res.status(500).json({
      error: 'Failed to get categories',
      message: error.message
    });
  }
});

/**
 * Bulk create products
 * POST /api/v1/products/business/:businessId/bulk
 */
router.post('/business/:businessId/bulk', async (req, res) => {
  try {
    const { businessId } = req.params;
    const { products } = req.body;

    if (!Array.isArray(products) || products.length === 0) {
      return res.status(400).json({
        error: 'Products array is required and must not be empty'
      });
    }

    // Validate each product
    for (const product of products) {
      if (!product.name || product.price === undefined) {
        return res.status(400).json({
          error: 'Each product must have name and price'
        });
      }
    }

    const createdProducts = await productService.bulkCreateProducts(businessId, products);

    res.status(201).json({
      success: true,
      data: createdProducts,
      count: createdProducts.length,
      message: `${createdProducts.length} products created successfully`
    });
  } catch (error) {
    logger.error('Error bulk creating products', { error: error.message });
    res.status(500).json({
      error: 'Failed to bulk create products',
      message: error.message
    });
  }
});

export default router;
