import express from 'express';
import analyticsService from '../../services/analytics.service.js';
import { logger } from '../../utils/logger.js';

const router = express.Router();

/**
 * Analytics Routes
 * Base path: /api/v1/analytics
 *
 * TODO: Add authentication middleware
 * TODO: Add rate limiting for heavy queries
 */

/**
 * Get dashboard overview
 * GET /api/v1/analytics/business/:businessId/dashboard
 */
router.get('/business/:businessId/dashboard', async (req, res) => {
  try {
    const { businessId } = req.params;
    const { startDate, endDate } = req.query;

    const overview = await analyticsService.getDashboardOverview(
      businessId,
      startDate,
      endDate
    );

    res.json({
      success: true,
      data: overview
    });
  } catch (error) {
    logger.error('Error getting dashboard overview', { error: error.message });
    res.status(500).json({
      error: 'Failed to get dashboard overview',
      message: error.message
    });
  }
});

/**
 * Get sales trends
 * GET /api/v1/analytics/business/:businessId/sales-trends
 */
router.get('/business/:businessId/sales-trends', async (req, res) => {
  try {
    const { businessId } = req.params;
    const { interval = 'day', limit = 30 } = req.query;

    const trends = await analyticsService.getSalesTrends(
      businessId,
      interval,
      parseInt(limit)
    );

    res.json({
      success: true,
      data: trends,
      interval,
      count: trends.length
    });
  } catch (error) {
    logger.error('Error getting sales trends', { error: error.message });
    res.status(500).json({
      error: 'Failed to get sales trends',
      message: error.message
    });
  }
});

/**
 * Get customer insights
 * GET /api/v1/analytics/business/:businessId/customers
 */
router.get('/business/:businessId/customers', async (req, res) => {
  try {
    const { businessId } = req.params;
    const { limit = 10 } = req.query;

    const insights = await analyticsService.getCustomerInsights(
      businessId,
      parseInt(limit)
    );

    res.json({
      success: true,
      data: insights
    });
  } catch (error) {
    logger.error('Error getting customer insights', { error: error.message });
    res.status(500).json({
      error: 'Failed to get customer insights',
      message: error.message
    });
  }
});

/**
 * Get product performance
 * GET /api/v1/analytics/business/:businessId/products
 */
router.get('/business/:businessId/products', async (req, res) => {
  try {
    const { businessId } = req.params;
    const { limit = 20 } = req.query;

    const performance = await analyticsService.getProductPerformance(
      businessId,
      parseInt(limit)
    );

    res.json({
      success: true,
      data: performance,
      count: performance.length
    });
  } catch (error) {
    logger.error('Error getting product performance', { error: error.message });
    res.status(500).json({
      error: 'Failed to get product performance',
      message: error.message
    });
  }
});

/**
 * Get conversation response times
 * GET /api/v1/analytics/business/:businessId/response-times
 */
router.get('/business/:businessId/response-times', async (req, res) => {
  try {
    const { businessId } = req.params;

    const responseTimes = await analyticsService.getConversationResponseTimes(businessId);

    res.json({
      success: true,
      data: responseTimes
    });
  } catch (error) {
    logger.error('Error getting response times', { error: error.message });
    res.status(500).json({
      error: 'Failed to get response times',
      message: error.message
    });
  }
});

/**
 * Get AI usage statistics
 * GET /api/v1/analytics/business/:businessId/ai-usage
 */
router.get('/business/:businessId/ai-usage', async (req, res) => {
  try {
    const { businessId } = req.params;
    const { startDate, endDate } = req.query;

    const aiStats = await analyticsService.getAIUsageStats(
      businessId,
      startDate,
      endDate
    );

    res.json({
      success: true,
      data: aiStats
    });
  } catch (error) {
    logger.error('Error getting AI usage stats', { error: error.message });
    res.status(500).json({
      error: 'Failed to get AI usage statistics',
      message: error.message
    });
  }
});

/**
 * Get category performance
 * GET /api/v1/analytics/business/:businessId/categories
 */
router.get('/business/:businessId/categories', async (req, res) => {
  try {
    const { businessId } = req.params;

    const categories = await analyticsService.getCategoryPerformance(businessId);

    res.json({
      success: true,
      data: categories,
      count: categories.length
    });
  } catch (error) {
    logger.error('Error getting category performance', { error: error.message });
    res.status(500).json({
      error: 'Failed to get category performance',
      message: error.message
    });
  }
});

export default router;
