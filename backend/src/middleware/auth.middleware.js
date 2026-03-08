import jwt from 'jsonwebtoken';
import { config } from '../config/index.js';
import { logger } from '../utils/logger.js';
import { query } from '../config/database.js';

/**
 * Authentication Middleware
 * Verifies JWT tokens and attaches user data to request
 */

/**
 * Verify JWT token and authenticate user
 */
export const authenticate = async (req, res, next) => {
  try {
    // Get token from Authorization header
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: 'No token provided. Please provide a valid authorization token.'
      });
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    // Verify token
    let decoded;
    try {
      decoded = jwt.verify(token, config.jwt.secret);
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        return res.status(401).json({
          success: false,
          error: 'Token expired. Please login again.'
        });
      }
      if (error.name === 'JsonWebTokenError') {
        return res.status(401).json({
          success: false,
          error: 'Invalid token. Please provide a valid authorization token.'
        });
      }
      throw error;
    }

    // Get user from database
    const result = await query(
      'SELECT id, phone_number, name, email, is_active FROM users WHERE id = $1',
      [decoded.userId]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({
        success: false,
        error: 'User not found. Token may be invalid.'
      });
    }

    const user = result.rows[0];

    // Check if user is active
    if (!user.is_active) {
      return res.status(403).json({
        success: false,
        error: 'Account is deactivated. Please contact support.'
      });
    }

    // Attach user to request
    req.user = user;
    req.userId = user.id;

    logger.info('User authenticated', {
      userId: user.id,
      phone: user.phone_number
    });

    next();
  } catch (error) {
    logger.error('Authentication error', {
      error: error.message,
      stack: error.stack
    });

    res.status(500).json({
      success: false,
      error: 'Authentication failed. Please try again.'
    });
  }
};

/**
 * Optional authentication - attaches user if token is valid, but doesn't require it
 */
export const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      // No token provided, continue without authentication
      return next();
    }

    const token = authHeader.substring(7);

    try {
      const decoded = jwt.verify(token, config.jwt.secret);

      // Get user from database
      const result = await query(
        'SELECT id, phone_number, name, email, is_active FROM users WHERE id = $1',
        [decoded.userId]
      );

      if (result.rows.length > 0 && result.rows[0].is_active) {
        req.user = result.rows[0];
        req.userId = result.rows[0].id;
      }
    } catch (error) {
      // Token invalid or expired, but that's okay for optional auth
      logger.debug('Optional auth token invalid', { error: error.message });
    }

    next();
  } catch (error) {
    logger.error('Optional authentication error', {
      error: error.message
    });
    // Don't fail the request for optional auth errors
    next();
  }
};

/**
 * Require business owner role
 */
export const requireBusinessOwner = async (req, res, next) => {
  try {
    if (!req.userId) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
    }

    // Check if user owns any businesses
    const result = await query(
      'SELECT COUNT(*) FROM businesses WHERE owner_id = $1 AND is_active = true',
      [req.userId]
    );

    const businessCount = parseInt(result.rows[0].count);

    if (businessCount === 0) {
      return res.status(403).json({
        success: false,
        error: 'Business owner access required. You do not own any active businesses.'
      });
    }

    next();
  } catch (error) {
    logger.error('Business owner check error', {
      error: error.message,
      userId: req.userId
    });

    res.status(500).json({
      success: false,
      error: 'Authorization check failed'
    });
  }
};

/**
 * Require ownership of specific business
 */
export const requireBusinessOwnership = async (req, res, next) => {
  try {
    if (!req.userId) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
    }

    // Get business ID from params or body
    const businessId = req.params.businessId || req.params.id || req.body.businessId;

    if (!businessId) {
      return res.status(400).json({
        success: false,
        error: 'Business ID required'
      });
    }

    // Check if user owns this business
    const result = await query(
      'SELECT id FROM businesses WHERE id = $1 AND owner_id = $2 AND is_active = true',
      [businessId, req.userId]
    );

    if (result.rows.length === 0) {
      return res.status(403).json({
        success: false,
        error: 'You do not have permission to access this business'
      });
    }

    req.businessId = businessId;
    next();
  } catch (error) {
    logger.error('Business ownership check error', {
      error: error.message,
      userId: req.userId,
      businessId: req.params.businessId || req.params.id
    });

    res.status(500).json({
      success: false,
      error: 'Authorization check failed'
    });
  }
};

/**
 * Rate limiting per user
 */
export const userRateLimit = (maxRequests = 100, windowMs = 60000) => {
  const userRequests = new Map();

  return (req, res, next) => {
    if (!req.userId) {
      return next(); // Skip rate limiting for unauthenticated requests
    }

    const now = Date.now();
    const userId = req.userId;

    if (!userRequests.has(userId)) {
      userRequests.set(userId, []);
    }

    const requests = userRequests.get(userId);

    // Remove old requests outside the window
    const recentRequests = requests.filter(time => now - time < windowMs);
    userRequests.set(userId, recentRequests);

    if (recentRequests.length >= maxRequests) {
      return res.status(429).json({
        success: false,
        error: 'Too many requests. Please try again later.',
        retryAfter: Math.ceil(windowMs / 1000)
      });
    }

    recentRequests.push(now);
    userRequests.set(userId, recentRequests);

    next();
  };
};

/**
 * Validate API key (for webhook endpoints)
 */
export const validateApiKey = (req, res, next) => {
  try {
    const apiKey = req.headers['x-api-key'];

    if (!apiKey) {
      return res.status(401).json({
        success: false,
        error: 'API key required'
      });
    }

    // In production, validate against stored API keys in database
    // For now, check against environment variable
    if (apiKey !== config.api.key) {
      return res.status(401).json({
        success: false,
        error: 'Invalid API key'
      });
    }

    next();
  } catch (error) {
    logger.error('API key validation error', {
      error: error.message
    });

    res.status(500).json({
      success: false,
      error: 'API key validation failed'
    });
  }
};

export default {
  authenticate,
  optionalAuth,
  requireBusinessOwner,
  requireBusinessOwnership,
  userRateLimit,
  validateApiKey
};
