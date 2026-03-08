import { initDatabase } from '../config/database.js';
import { logger } from '../utils/logger.js';

async function markMigration(migrationName) {
  const pool = await initDatabase();

  try {
    // Create migrations table if not exists
    await pool.query(`
      CREATE TABLE IF NOT EXISTS migrations (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL UNIQUE,
        executed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Insert migration
    await pool.query('INSERT INTO migrations (name) VALUES ($1) ON CONFLICT (name) DO NOTHING', [migrationName]);

    logger.info(`Migration ${migrationName} marked as executed`);
    console.log(`✅ Migration ${migrationName} marked as executed`);

  } catch (error) {
    logger.error('Error marking migration', { error: error.message });
    console.error('❌ Error:', error.message);
  } finally {
    await pool.end();
  }
}

// Run
const migrationName = process.argv[2] || '001_initial_schema.sql';
markMigration(migrationName);
