import express from 'express';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { query } from '../../config/database.js';
import { logger } from '../../utils/logger.js';
import { authenticate } from '../../middleware/auth.middleware.js';

const router = express.Router();
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * Admin Routes
 * Base path: /api/v1/admin
 */

/**
 * Run database migration
 * POST /api/v1/admin/migrate/:migrationName
 */
router.post('/migrate/:migrationName', authenticate, async (req, res) => {
  try {
    const { migrationName } = req.params;

    // Only allow admin users (you can add proper role checking here)
    // For now, any authenticated user can run migrations in development
    if (process.env.NODE_ENV === 'production') {
      return res.status(403).json({
        error: 'Migration endpoints are disabled in production'
      });
    }

    logger.info(`Running migration: ${migrationName}`);

    // Read migration file
    const migrationPath = join(__dirname, `../../database/migrations/${migrationName}.sql`);
    const migrationSQL = readFileSync(migrationPath, 'utf8');

    // Execute migration
    await query(migrationSQL);

    logger.info(`✅ Migration ${migrationName} completed successfully`);

    // Verify what was created based on migration name
    let verificationQuery = '';
    let tablesToCheck = [];

    if (migrationName.includes('team_members')) {
      tablesToCheck = ['team_members', 'team_invitations'];
    }

    if (tablesToCheck.length > 0) {
      const result = await query(`
        SELECT table_name
        FROM information_schema.tables
        WHERE table_schema = 'public'
        AND table_name = ANY($1)
        ORDER BY table_name
      `, [tablesToCheck]);

      res.json({
        success: true,
        message: `Migration ${migrationName} completed successfully`,
        tables: result.rows.map(r => r.table_name)
      });
    } else {
      res.json({
        success: true,
        message: `Migration ${migrationName} completed successfully`
      });
    }
  } catch (error) {
    logger.error('Migration failed', { error: error.message });

    if (error.message.includes('already exists')) {
      return res.status(200).json({
        success: true,
        message: 'Migration already applied',
        warning: 'Tables already exist'
      });
    }

    res.status(500).json({
      error: 'Migration failed',
      message: error.message
    });
  }
});

/**
 * Get database status
 * GET /api/v1/admin/db/status
 */
router.get('/db/status', authenticate, async (req, res) => {
  try {
    // Get all tables
    const tablesResult = await query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      ORDER BY table_name
    `);

    // Get row counts for main tables
    const counts = {};
    const mainTables = ['users', 'businesses', 'products', 'orders', 'team_members', 'team_invitations'];

    for (const table of mainTables) {
      try {
        const result = await query(`SELECT COUNT(*) as count FROM ${table}`);
        counts[table] = parseInt(result.rows[0].count);
      } catch (error) {
        counts[table] = 'N/A';
      }
    }

    res.json({
      success: true,
      data: {
        tables: tablesResult.rows.map(r => r.table_name),
        counts
      }
    });
  } catch (error) {
    logger.error('Failed to get database status', { error: error.message });
    res.status(500).json({
      error: 'Failed to get database status',
      message: error.message
    });
  }
});

export default router;
