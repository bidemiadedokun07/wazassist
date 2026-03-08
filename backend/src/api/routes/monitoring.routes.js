import express from 'express';
import { getPerformanceMetrics, resetPerformanceMetrics } from '../../middleware/requestLogger.middleware.js';
import { logger } from '../../utils/logger.js';
import { authenticate } from '../../middleware/auth.middleware.js';
import os from 'os';

const router = express.Router();

/**
 * Monitoring & Health Check Routes
 * Base path: /api/v1/monitoring
 */

/**
 * Health check endpoint
 * GET /api/v1/monitoring/health
 */
router.get('/health', (req, res) => {
  const healthCheck = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
    version: '1.0.0',
    memory: {
      used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
      total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
      unit: 'MB',
    },
    cpu: {
      loadAverage: os.loadavg(),
      cpuCount: os.cpus().length,
    },
  };

  res.json(healthCheck);
});

/**
 * Detailed health check
 * GET /api/v1/monitoring/health/detailed
 */
router.get('/health/detailed', authenticate, async (req, res) => {
  try {
    const health = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || 'development',
      system: {
        platform: os.platform(),
        arch: os.arch(),
        hostname: os.hostname(),
        totalMemory: Math.round(os.totalmem() / 1024 / 1024 / 1024) + ' GB',
        freeMemory: Math.round(os.freemem() / 1024 / 1024 / 1024) + ' GB',
        cpus: os.cpus().length,
        loadAverage: os.loadavg(),
      },
      process: {
        pid: process.pid,
        version: process.version,
        memory: {
          rss: Math.round(process.memoryUsage().rss / 1024 / 1024) + ' MB',
          heapTotal: Math.round(process.memoryUsage().heapTotal / 1024 / 1024) + ' MB',
          heapUsed: Math.round(process.memoryUsage().heapUsed / 1024 / 1024) + ' MB',
          external: Math.round(process.memoryUsage().external / 1024 / 1024) + ' MB',
        },
        uptime: process.uptime(),
      },
    };

    // Check database connection (optional - add if needed)
    // const dbHealth = await checkDatabaseConnection();
    // health.database = dbHealth;

    res.json(health);
  } catch (error) {
    logger.error('Health check failed', { error: error.message });
    res.status(500).json({
      status: 'unhealthy',
      error: error.message,
    });
  }
});

/**
 * Get performance metrics
 * GET /api/v1/monitoring/metrics
 */
router.get('/metrics', authenticate, (req, res) => {
  try {
    const metrics = getPerformanceMetrics();

    res.json({
      success: true,
      timestamp: new Date().toISOString(),
      data: metrics,
    });
  } catch (error) {
    logger.error('Failed to get metrics', { error: error.message });
    res.status(500).json({
      error: 'Failed to get metrics',
      message: error.message,
    });
  }
});

/**
 * Reset performance metrics
 * POST /api/v1/monitoring/metrics/reset
 */
router.post('/metrics/reset', authenticate, (req, res) => {
  try {
    if (process.env.NODE_ENV === 'production') {
      return res.status(403).json({
        error: 'Metrics reset is disabled in production',
      });
    }

    resetPerformanceMetrics();

    res.json({
      success: true,
      message: 'Performance metrics reset successfully',
    });
  } catch (error) {
    logger.error('Failed to reset metrics', { error: error.message });
    res.status(500).json({
      error: 'Failed to reset metrics',
      message: error.message,
    });
  }
});

/**
 * Get application logs (last N entries)
 * GET /api/v1/monitoring/logs
 */
router.get('/logs', authenticate, (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 100;
    const level = req.query.level || 'info';

    // In production, you'd read from a log file or external service
    // For now, return a message about log configuration
    res.json({
      success: true,
      message: 'Logs are configured to write to console and files',
      configuration: {
        levels: ['error', 'warn', 'info', 'http', 'verbose', 'debug'],
        currentLevel: level,
        limit: limit,
      },
      note: 'In production, use external logging services like CloudWatch, DataDog, or ELK',
    });
  } catch (error) {
    logger.error('Failed to get logs', { error: error.message });
    res.status(500).json({
      error: 'Failed to get logs',
      message: error.message,
    });
  }
});

/**
 * Get system statistics
 * GET /api/v1/monitoring/stats
 */
router.get('/stats', authenticate, async (req, res) => {
  try {
    // Import here to avoid circular dependencies
    const { query } = await import('../../config/database.js');

    // Get database statistics
    const dbStats = await query(`
      SELECT
        (SELECT COUNT(*) FROM users) as total_users,
        (SELECT COUNT(*) FROM businesses) as total_businesses,
        (SELECT COUNT(*) FROM products) as total_products,
        (SELECT COUNT(*) FROM orders) as total_orders,
        (SELECT COUNT(*) FROM team_members WHERE status = 'active') as active_team_members
    `);

    const stats = {
      success: true,
      timestamp: new Date().toISOString(),
      database: dbStats.rows[0],
      system: {
        uptime: process.uptime(),
        memory: {
          used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
          total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
          unit: 'MB',
        },
        cpu: {
          loadAverage: os.loadavg(),
          cpuCount: os.cpus().length,
        },
      },
    };

    res.json(stats);
  } catch (error) {
    logger.error('Failed to get stats', { error: error.message });
    res.status(500).json({
      error: 'Failed to get stats',
      message: error.message,
    });
  }
});

/**
 * Readiness probe (for Kubernetes/Docker)
 * GET /api/v1/monitoring/ready
 */
router.get('/ready', async (req, res) => {
  try {
    // Check if app is ready to serve traffic
    // Add checks for database, external services, etc.

    const ready = {
      ready: true,
      timestamp: new Date().toISOString(),
    };

    res.json(ready);
  } catch (error) {
    res.status(503).json({
      ready: false,
      error: error.message,
    });
  }
});

/**
 * Liveness probe (for Kubernetes/Docker)
 * GET /api/v1/monitoring/live
 */
router.get('/live', (req, res) => {
  // Simple check that the app is running
  res.json({
    live: true,
    timestamp: new Date().toISOString(),
  });
});

export default router;
