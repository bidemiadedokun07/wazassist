import express from 'express';
import businessService from '../../services/business.service.js';
import { logger } from '../../utils/logger.js';
import { authenticate } from '../../middleware/auth.middleware.js';

const router = express.Router();

/**
 * Transform business data from snake_case to camelCase for frontend
 */
function transformBusiness(business) {
  if (!business) return null;

  return {
    id: business.id,
    name: business.business_name,
    description: business.description,
    category: business.business_type,
    phoneNumber: business.phone_number,
    email: business.email,
    whatsappNumber: business.whatsapp_phone_number_id,
    address: business.address,
    logoUrl: business.logo_url,
    isActive: business.is_active,
    createdAt: business.created_at,
    updatedAt: business.updated_at,
    // Additional fields that frontend might need
    ownerId: business.owner_id,
    subscriptionTier: business.subscription_tier,
    subscriptionStatus: business.subscription_status,
    aiEnabled: business.ai_enabled,
    metadata: business.metadata
  };
}

/**
 * Business Management Routes
 * Handles CRUD operations for businesses
 */

/**
 * @route   GET /api/v1/businesses/search
 * @desc    Search businesses by name, description, or category
 * @access  Public
 * @query   q (search term), limit, offset
 */
router.get('/search', async (req, res) => {
  try {
    const { q: searchTerm, limit, offset } = req.query;

    if (!searchTerm) {
      return res.status(400).json({
        success: false,
        error: 'Search term (q) is required'
      });
    }

    const options = {
      limit: parseInt(limit) || 20,
      offset: parseInt(offset) || 0
    };

    const businesses = await businessService.searchBusinesses(searchTerm, options);

    res.json({
      success: true,
      count: businesses.length,
      searchTerm,
      data: businesses
    });
  } catch (error) {
    logger.error('❌ Error searching businesses', {
      error: error.message,
      searchTerm: req.query.q
    });

    res.status(500).json({
      success: false,
      error: error.message || 'Failed to search businesses'
    });
  }
});

/**
 * @route   GET /api/v1/businesses/categories
 * @desc    Get all business categories
 * @access  Public
 */
router.get('/categories', async (req, res) => {
  try {
    const categories = await businessService.getBusinessCategories();

    res.json({
      success: true,
      count: categories.length,
      data: categories
    });
  } catch (error) {
    logger.error('❌ Error getting business categories', {
      error: error.message
    });

    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get business categories'
    });
  }
});

/**
 * @route   GET /api/v1/businesses/my
 * @desc    Get businesses for authenticated user
 * @access  Private
 */
router.get('/my', authenticate, async (req, res) => {
  try {
    const businesses = await businessService.getBusinessesByOwner(req.user.id);
    const transformedBusinesses = businesses.map(transformBusiness);

    res.json({
      success: true,
      count: transformedBusinesses.length,
      data: transformedBusinesses
    });
  } catch (error) {
    logger.error('❌ Error getting user businesses', {
      error: error.message,
      userId: req.user?.id
    });

    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get businesses'
    });
  }
});

/**
 * @route   GET /api/v1/businesses/owner/:ownerId
 * @desc    Get businesses by owner ID
 * @access  Private
 */
router.get('/owner/:ownerId', async (req, res) => {
  try {
    const businesses = await businessService.getBusinessesByOwner(req.params.ownerId);

    res.json({
      success: true,
      count: businesses.length,
      data: businesses
    });
  } catch (error) {
    logger.error('❌ Error getting businesses by owner', {
      error: error.message,
      ownerId: req.params.ownerId
    });

    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get businesses'
    });
  }
});

/**
 * @route   POST /api/v1/businesses
 * @desc    Create a new business
 * @access  Private (requires authentication - to be added)
 */
router.post('/', async (req, res) => {
  try {
    const business = await businessService.createBusiness(req.body);

    logger.info('✅ Business created via API', {
      businessId: business.id,
      businessName: business.business_name,
      ownerId: business.owner_id
    });

    res.status(201).json({
      success: true,
      message: 'Business created successfully',
      data: business
    });
  } catch (error) {
    logger.error('❌ Error creating business via API', {
      error: error.message,
      body: req.body
    });

    res.status(500).json({
      success: false,
      error: error.message || 'Failed to create business'
    });
  }
});

/**
 * @route   GET /api/v1/businesses/:id
 * @desc    Get business by ID
 * @access  Private
 */
router.get('/:id', async (req, res) => {
  try {
    const business = await businessService.getBusinessById(req.params.id);

    if (!business) {
      return res.status(404).json({
        success: false,
        error: 'Business not found'
      });
    }

    res.json({
      success: true,
      data: business
    });
  } catch (error) {
    logger.error('❌ Error getting business', {
      error: error.message,
      businessId: req.params.id
    });

    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get business'
    });
  }
});

/**
 * @route   GET /api/v1/businesses
 * @desc    Get all businesses with pagination and filters
 * @access  Private
 * @query   limit, offset, isActive, category
 */
router.get('/', async (req, res) => {
  try {
    const options = {
      limit: parseInt(req.query.limit) || 20,
      offset: parseInt(req.query.offset) || 0,
      isActive: req.query.isActive !== undefined ? req.query.isActive === 'true' : undefined,
      category: req.query.category
    };

    const result = await businessService.getAllBusinesses(options);

    res.json({
      success: true,
      count: result.businesses.length,
      total: result.total,
      limit: result.limit,
      offset: result.offset,
      data: result.businesses
    });
  } catch (error) {
    logger.error('❌ Error getting all businesses', {
      error: error.message,
      query: req.query
    });

    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get businesses'
    });
  }
});

/**
 * @route   PUT /api/v1/businesses/:id
 * @desc    Update business
 * @access  Private
 */
router.put('/:id', async (req, res) => {
  try {
    const business = await businessService.updateBusiness(req.params.id, req.body);

    logger.info('✅ Business updated via API', {
      businessId: req.params.id,
      updatedFields: Object.keys(req.body)
    });

    res.json({
      success: true,
      message: 'Business updated successfully',
      data: business
    });
  } catch (error) {
    logger.error('❌ Error updating business', {
      error: error.message,
      businessId: req.params.id
    });

    if (error.message === 'Business not found') {
      return res.status(404).json({
        success: false,
        error: 'Business not found'
      });
    }

    if (error.message === 'No valid fields to update') {
      return res.status(400).json({
        success: false,
        error: 'No valid fields to update'
      });
    }

    res.status(500).json({
      success: false,
      error: error.message || 'Failed to update business'
    });
  }
});

/**
 * @route   DELETE /api/v1/businesses/:id
 * @desc    Delete business (soft delete)
 * @access  Private
 */
router.delete('/:id', async (req, res) => {
  try {
    const business = await businessService.deleteBusiness(req.params.id);

    logger.info('✅ Business deleted via API', {
      businessId: req.params.id
    });

    res.json({
      success: true,
      message: 'Business deleted successfully',
      data: business
    });
  } catch (error) {
    logger.error('❌ Error deleting business', {
      error: error.message,
      businessId: req.params.id
    });

    if (error.message === 'Business not found') {
      return res.status(404).json({
        success: false,
        error: 'Business not found'
      });
    }

    res.status(500).json({
      success: false,
      error: error.message || 'Failed to delete business'
    });
  }
});

/**
 * @route   GET /api/v1/businesses/:id/statistics
 * @desc    Get business statistics
 * @access  Private
 */
router.get('/:id/statistics', async (req, res) => {
  try {
    const statistics = await businessService.getBusinessStatistics(req.params.id);

    res.json({
      success: true,
      data: statistics
    });
  } catch (error) {
    logger.error('❌ Error getting business statistics', {
      error: error.message,
      businessId: req.params.id
    });

    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get business statistics'
    });
  }
});

/**
 * @route   PATCH /api/v1/businesses/:id/settings
 * @desc    Update business settings (merges with existing)
 * @access  Private
 */
router.patch('/:id/settings', async (req, res) => {
  try {
    const business = await businessService.updateBusinessSettings(req.params.id, req.body);

    logger.info('✅ Business settings updated via API', {
      businessId: req.params.id,
      settingsKeys: Object.keys(req.body)
    });

    res.json({
      success: true,
      message: 'Business settings updated successfully',
      data: business
    });
  } catch (error) {
    logger.error('❌ Error updating business settings', {
      error: error.message,
      businessId: req.params.id
    });

    if (error.message === 'Business not found') {
      return res.status(404).json({
        success: false,
        error: 'Business not found'
      });
    }

    res.status(500).json({
      success: false,
      error: error.message || 'Failed to update business settings'
    });
  }
});

export default router;
