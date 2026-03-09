import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import compression from 'compression';
import morgan from 'morgan';
import { config } from './config/index.js';
import { logger } from './utils/logger.js';
import { errorHandler } from './api/middleware/errorHandler.js';
import { rateLimiter } from './api/middleware/rateLimiter.js';
import { requestLogger, performanceMonitor } from './middleware/requestLogger.middleware.js';
import {
  removeServerHeaders,
  detectSuspiciousActivity,
  preventParameterPollution,
  requestSizeLimiter
} from './middleware/security.middleware.js';
import { initDatabase } from './config/database.js';
import { initRedis } from './config/redis.js';
import routes from './api/routes/index.js';

const app = express();

if (config.env === 'production') {
  app.set('trust proxy', 1);
}

// Security middleware
app.use(helmet());
app.use(removeServerHeaders);
app.use(cors({
  origin: config.frontendUrl,
  credentials: true
}));

// Security hardening
app.use(requestSizeLimiter(10)); // 10MB max
app.use(preventParameterPollution);
app.use(detectSuspiciousActivity);

// Request parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(compression());

// Logging
if (config.env !== 'test') {
  app.use(morgan('combined', {
    stream: { write: (message) => logger.info(message.trim()) }
  }));
}

// Request logging and performance monitoring
app.use(requestLogger);
app.use(performanceMonitor);

// Rate limiting
app.use(rateLimiter);

// Health check (no auth required)
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: config.env,
    version: '1.0.0'
  });
});

app.get('/ready', async (req, res) => {
  try {
    // Check database connectivity
    const dbPool = await initDatabase();
    await dbPool.query('SELECT 1');

    // Check Redis connectivity
    const redis = await initRedis();
    await redis.ping();

    res.json({ status: 'ready' });
  } catch (error) {
    logger.error('Readiness check failed:', error);
    res.status(503).json({ status: 'not ready', error: error.message });
  }
});

// API routes
app.use('/api/v1', routes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: `Route ${req.method} ${req.path} not found`,
    timestamp: new Date().toISOString()
  });
});

// Error handling
app.use(errorHandler);

// Graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('SIGTERM received, shutting down gracefully');
  server.close(async () => {
    logger.info('HTTP server closed');
    // Close database connections
    const db = await initDatabase();
    await db.end();
    // Close Redis connection
    const redis = await initRedis();
    await redis.quit();
    process.exit(0);
  });
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', error);
  process.exit(1);
});

// Start server
const PORT = config.port || 3000;
const server = app.listen(PORT, () => {
  logger.info(`🚀 WazAssist AI Server started on port ${PORT}`);
  logger.info(`📊 Environment: ${config.env}`);
  logger.info(`🌍 Region: ${config.aws.region}`);
  logger.info(`🤖 AI Model: ${config.bedrock.defaultModel}`);
});

export default app;
