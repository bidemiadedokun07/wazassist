import pkg from 'pg';
const { Pool } = pkg;
import { config } from './index.js';
import { logger } from '../utils/logger.js';

let pool = null;

export async function initDatabase() {
  if (pool) return pool;

  const poolConfig = {
    host: config.database.host,
    port: config.database.port,
    database: config.database.name,
    user: config.database.user,
    password: config.database.password,
    min: config.database.poolMin,
    max: config.database.poolMax,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 10000,
  };

  if (config.database.ssl) {
    const rejectUnauthorized = process.env.DATABASE_SSL_REJECT_UNAUTHORIZED !== 'false';
    poolConfig.ssl = {
      rejectUnauthorized,
      ca: process.env.RDS_CA_CERT || undefined
    };
  }

  pool = new Pool(poolConfig);

  // Test connection
  try {
    const client = await pool.connect();
    const result = await client.query('SELECT NOW()');
    logger.info('✅ Database connected:', result.rows[0].now);
    client.release();
  } catch (error) {
    logger.error('❌ Database connection failed:', error);
    throw error;
  }

  // Handle pool errors
  pool.on('error', (err) => {
    logger.error('Unexpected database pool error:', err);
  });

  return pool;
}

export async function query(text, params) {
  // Initialize pool if not already done
  if (!pool) {
    await initDatabase();
  }

  const start = Date.now();
  try {
    const result = await pool.query(text, params);
    const duration = Date.now() - start;
    logger.debug('Executed query', { text, duration, rows: result.rowCount });
    return result;
  } catch (error) {
    logger.error('Database query error:', { text, error: error.message });
    throw error;
  }
}

export async function getClient() {
  return await pool.connect();
}

export async function transaction(callback) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

export default { initDatabase, query, getClient, transaction };
