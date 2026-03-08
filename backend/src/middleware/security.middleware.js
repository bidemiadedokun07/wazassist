import { logger } from '../utils/logger.js';

/**
 * Security Middleware Collection
 * Additional security hardening beyond helmet
 */

/**
 * Content Security Policy headers
 */
export function contentSecurityPolicy(req, res, next) {
  res.setHeader(
    'Content-Security-Policy',
    "default-src 'self'; " +
    "script-src 'self' 'unsafe-inline' 'unsafe-eval'; " +
    "style-src 'self' 'unsafe-inline'; " +
    "img-src 'self' data: https:; " +
    "font-src 'self' data:; " +
    "connect-src 'self' https://api.whatsapp.com https://graph.facebook.com"
  );
  next();
}

/**
 * Prevent clickjacking attacks
 */
export function antiClickjacking(req, res, next) {
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  next();
}

/**
 * Remove sensitive headers that expose server info
 */
export function removeServerHeaders(req, res, next) {
  res.removeHeader('X-Powered-By');
  res.removeHeader('Server');
  next();
}

/**
 * Sanitize user input to prevent injection attacks
 */
export function sanitizeInput(req, res, next) {
  // Recursively sanitize all string inputs
  const sanitize = (obj) => {
    if (typeof obj === 'string') {
      // Remove potential SQL injection patterns
      return obj
        .replace(/['";\\]/g, '')
        .trim();
    }
    if (Array.isArray(obj)) {
      return obj.map(sanitize);
    }
    if (obj && typeof obj === 'object') {
      const sanitized = {};
      for (const [key, value] of Object.entries(obj)) {
        sanitized[key] = sanitize(value);
      }
      return sanitized;
    }
    return obj;
  };

  // Only sanitize in production to avoid breaking development
  if (process.env.NODE_ENV === 'production') {
    if (req.body) {
      req.body = sanitize(req.body);
    }
    if (req.query) {
      req.query = sanitize(req.query);
    }
  }

  next();
}

/**
 * Detect and log suspicious activity
 */
const suspiciousPatterns = [
  /(\bunion\b.*\bselect\b)/i,
  /(\bselect\b.*\bfrom\b)/i,
  /(\bdrop\b.*\btable\b)/i,
  /(\binsert\b.*\binto\b)/i,
  /(\bdelete\b.*\bfrom\b)/i,
  /<script[^>]*>.*?<\/script>/gi,
  /javascript:/gi,
  /on\w+\s*=/gi,
];

export function detectSuspiciousActivity(req, res, next) {
  const checkForPatterns = (str) => {
    if (typeof str !== 'string') return false;
    return suspiciousPatterns.some(pattern => pattern.test(str));
  };

  const checkObject = (obj) => {
    if (typeof obj === 'string') {
      return checkForPatterns(obj);
    }
    if (Array.isArray(obj)) {
      return obj.some(checkObject);
    }
    if (obj && typeof obj === 'object') {
      return Object.values(obj).some(checkObject);
    }
    return false;
  };

  // Check request for suspicious patterns
  const isSuspicious =
    checkObject(req.body) ||
    checkObject(req.query) ||
    checkObject(req.params) ||
    checkForPatterns(req.url);

  if (isSuspicious) {
    logger.warn('Suspicious activity detected', {
      requestId: req.id,
      method: req.method,
      url: req.url,
      ip: req.ip,
      userAgent: req.get('user-agent'),
      body: req.body,
      query: req.query,
    });

    // In production, you might want to block the request
    if (process.env.NODE_ENV === 'production' && process.env.BLOCK_SUSPICIOUS_REQUESTS === 'true') {
      return res.status(400).json({
        error: 'Invalid request',
        message: 'The request contains potentially harmful content'
      });
    }
  }

  next();
}

/**
 * Enforce HTTPS in production
 */
export function enforceHTTPS(req, res, next) {
  if (process.env.NODE_ENV === 'production') {
    if (req.headers['x-forwarded-proto'] !== 'https') {
      return res.redirect(301, `https://${req.hostname}${req.url}`);
    }
  }
  next();
}

/**
 * API key validation for webhook endpoints
 */
export function validateWebhookSignature(secretHeaderName = 'x-webhook-signature') {
  return (req, res, next) => {
    const signature = req.get(secretHeaderName);

    if (!signature) {
      logger.warn('Webhook request without signature', {
        url: req.url,
        ip: req.ip,
      });

      return res.status(401).json({
        error: 'Missing webhook signature'
      });
    }

    // Implement signature validation logic here
    // This is a placeholder - implement based on your webhook provider
    next();
  };
}

/**
 * Request size limiter (prevent DOS attacks)
 */
export function requestSizeLimiter(maxSizeInMB = 10) {
  return (req, res, next) => {
    const contentLength = req.get('content-length');

    if (contentLength) {
      const sizeInMB = parseInt(contentLength) / (1024 * 1024);

      if (sizeInMB > maxSizeInMB) {
        logger.warn('Request too large', {
          requestId: req.id,
          size: `${sizeInMB.toFixed(2)}MB`,
          maxSize: `${maxSizeInMB}MB`,
          ip: req.ip,
        });

        return res.status(413).json({
          error: 'Request too large',
          message: `Maximum request size is ${maxSizeInMB}MB`
        });
      }
    }

    next();
  };
}

/**
 * Prevent parameter pollution
 */
export function preventParameterPollution(req, res, next) {
  // Check for duplicate parameters
  const checkDuplicates = (obj) => {
    if (!obj || typeof obj !== 'object') return false;

    const keys = Object.keys(obj);
    for (const key of keys) {
      if (Array.isArray(obj[key]) && obj[key].length > 10) {
        return true; // Suspicious array size
      }
    }
    return false;
  };

  if (checkDuplicates(req.query) || checkDuplicates(req.body)) {
    logger.warn('Parameter pollution detected', {
      requestId: req.id,
      url: req.url,
      ip: req.ip,
    });

    if (process.env.NODE_ENV === 'production') {
      return res.status(400).json({
        error: 'Invalid request parameters'
      });
    }
  }

  next();
}

/**
 * IP whitelist/blacklist (for sensitive endpoints)
 */
export function ipFilter(whitelist = [], blacklist = []) {
  return (req, res, next) => {
    const clientIp = req.ip || req.connection.remoteAddress;

    // Check blacklist first
    if (blacklist.length > 0 && blacklist.includes(clientIp)) {
      logger.warn('Blocked IP attempted access', {
        ip: clientIp,
        url: req.url,
      });

      return res.status(403).json({
        error: 'Access denied'
      });
    }

    // Check whitelist
    if (whitelist.length > 0 && !whitelist.includes(clientIp)) {
      logger.warn('Non-whitelisted IP attempted access', {
        ip: clientIp,
        url: req.url,
      });

      return res.status(403).json({
        error: 'Access denied'
      });
    }

    next();
  };
}

export default {
  contentSecurityPolicy,
  antiClickjacking,
  removeServerHeaders,
  sanitizeInput,
  detectSuspiciousActivity,
  enforceHTTPS,
  validateWebhookSignature,
  requestSizeLimiter,
  preventParameterPollution,
  ipFilter,
};
