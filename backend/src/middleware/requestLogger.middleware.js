import { logger } from '../utils/logger.js';
import crypto from 'crypto';

/**
 * Request Logger Middleware
 * Logs all HTTP requests with timing, status codes, and relevant metadata
 */

export function requestLogger(req, res, next) {
  // Generate request ID for tracking
  req.id = crypto.randomUUID();

  // Record start time
  const startTime = Date.now();

  // Store original end method
  const originalEnd = res.end;

  // Override end method to log after response is sent
  res.end = function (...args) {
    // Calculate request duration
    const duration = Date.now() - startTime;

    // Log request details
    logger.info('HTTP Request', {
      requestId: req.id,
      method: req.method,
      url: req.originalUrl,
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      ip: req.ip || req.connection.remoteAddress,
      userAgent: req.get('user-agent'),
      userId: req.user?.userId,
      // Redact sensitive headers
      headers: {
        ...req.headers,
        authorization: req.headers.authorization ? '[REDACTED]' : undefined,
        cookie: req.headers.cookie ? '[REDACTED]' : undefined,
      },
    });

    // Log slow requests (> 1 second)
    if (duration > 1000) {
      logger.warn('Slow Request Detected', {
        requestId: req.id,
        method: req.method,
        url: req.originalUrl,
        duration: `${duration}ms`,
      });
    }

    // Log errors (4xx, 5xx status codes)
    if (res.statusCode >= 400) {
      logger.error('HTTP Error Response', {
        requestId: req.id,
        method: req.method,
        url: req.originalUrl,
        statusCode: res.statusCode,
        duration: `${duration}ms`,
        userId: req.user?.userId,
      });
    }

    // Call original end method
    return originalEnd.apply(res, args);
  };

  next();
}

/**
 * Performance monitoring middleware
 * Tracks endpoint performance metrics
 */
const performanceMetrics = new Map();

export function performanceMonitor(req, res, next) {
  const endpoint = `${req.method} ${req.route?.path || req.path}`;
  const startTime = Date.now();

  // Store original end method
  const originalEnd = res.end;

  res.end = function (...args) {
    const duration = Date.now() - startTime;

    // Update metrics
    if (!performanceMetrics.has(endpoint)) {
      performanceMetrics.set(endpoint, {
        count: 0,
        totalDuration: 0,
        minDuration: Infinity,
        maxDuration: 0,
        avgDuration: 0,
      });
    }

    const metrics = performanceMetrics.get(endpoint);
    metrics.count++;
    metrics.totalDuration += duration;
    metrics.minDuration = Math.min(metrics.minDuration, duration);
    metrics.maxDuration = Math.max(metrics.maxDuration, duration);
    metrics.avgDuration = metrics.totalDuration / metrics.count;

    return originalEnd.apply(res, args);
  };

  next();
}

/**
 * Get performance metrics
 */
export function getPerformanceMetrics() {
  const metrics = {};
  for (const [endpoint, data] of performanceMetrics.entries()) {
    metrics[endpoint] = {
      ...data,
      avgDuration: Math.round(data.avgDuration),
      minDuration: data.minDuration === Infinity ? 0 : data.minDuration,
    };
  }
  return metrics;
}

/**
 * Reset performance metrics
 */
export function resetPerformanceMetrics() {
  performanceMetrics.clear();
  logger.info('Performance metrics reset');
}

export default {
  requestLogger,
  performanceMonitor,
  getPerformanceMetrics,
  resetPerformanceMetrics,
};
