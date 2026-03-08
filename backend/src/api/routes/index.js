import express from 'express';
import webhookRoutes from './webhook.routes.js';
import authRoutes from './auth.routes.js';
import productRoutes from './product.routes.js';
import orderRoutes from './order.routes.js';
import paymentRoutes from './payment.routes.js';
import analyticsRoutes from './analytics.routes.js';
import businessRoutes from './business.routes.js';
import uploadRoutes from './upload.routes.js';
import adminRoutes from './admin.routes.js';
import teamRoutes from './team.routes.js';
import monitoringRoutes from './monitoring.routes.js';

const router = express.Router();

// API info endpoint
router.get('/', (req, res) => {
  res.json({
    message: 'WazAssist AI API',
    version: '1.0.0',
    status: 'operational',
    endpoints: {
      health: '/health',
      api: '/api/v1',
      auth: '/api/v1/auth',
      webhooks: '/api/v1/webhooks',
      businesses: '/api/v1/businesses',
      products: '/api/v1/products',
      orders: '/api/v1/orders',
      payments: '/api/v1/payments',
      analytics: '/api/v1/analytics',
      uploads: '/api/v1/uploads'
    }
  });
});

// Webhook routes (WhatsApp, Paystack, Flutterwave)
router.use('/webhooks', webhookRoutes);

// Authentication routes
router.use('/auth', authRoutes);

// Business management routes
router.use('/businesses', businessRoutes);

// Product management routes
router.use('/products', productRoutes);

// Order management routes
router.use('/orders', orderRoutes);

// Payment routes (Paystack, Flutterwave)
router.use('/payments', paymentRoutes);

// Analytics routes
router.use('/analytics', analyticsRoutes);

// Upload routes (images, files)
router.use('/uploads', uploadRoutes);

// Team management routes
router.use('/team', teamRoutes);

// Monitoring routes (health, metrics, logs)
router.use('/monitoring', monitoringRoutes);

// Admin routes (migrations, database status)
router.use('/admin', adminRoutes);

// All routes registered above

export default router;
