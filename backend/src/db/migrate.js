import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { initDatabase } from '../config/database.js';
import { logger } from '../utils/logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Database Migration Runner
 * Runs SQL migration files in order
 */

// Create migrations tracking table
async function createMigrationsTable(pool) {
  const query = `
    CREATE TABLE IF NOT EXISTS migrations (
      id SERIAL PRIMARY KEY,
      name VARCHAR(255) NOT NULL UNIQUE,
      executed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );
  `;

  await pool.query(query);
  logger.info('Migrations table ready');
}

// Get list of executed migrations
async function getExecutedMigrations(pool) {
  const result = await pool.query('SELECT name FROM migrations ORDER BY id');
  return result.rows.map(row => row.name);
}

// Get list of migration files
function getMigrationFiles() {
  const migrationsDir = path.join(__dirname, 'migrations');

  if (!fs.existsSync(migrationsDir)) {
    logger.warn('Migrations directory does not exist');
    return [];
  }

  return fs.readdirSync(migrationsDir)
    .filter(file => file.endsWith('.sql'))
    .sort();
}

// Execute a single migration
async function executeMigration(pool, filename) {
  const filePath = path.join(__dirname, 'migrations', filename);
  const sql = fs.readFileSync(filePath, 'utf8');

  logger.info(`Executing migration: ${filename}`);

  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // Execute the migration SQL
    await client.query(sql);

    // Record the migration
    await client.query(
      'INSERT INTO migrations (name) VALUES ($1)',
      [filename]
    );

    await client.query('COMMIT');
    logger.info(`✅ Migration completed: ${filename}`);

  } catch (error) {
    await client.query('ROLLBACK');
    logger.error(`❌ Migration failed: ${filename}`, { error: error.message });
    throw error;
  } finally {
    client.release();
  }
}

// Run all pending migrations
export async function runMigrations() {
  const pool = await initDatabase();

  try {
    logger.info('Starting database migrations...');

    // Create migrations tracking table
    await createMigrationsTable(pool);

    // Get executed migrations
    const executed = await getExecutedMigrations(pool);
    logger.info(`Already executed migrations: ${executed.length}`);

    // Get all migration files
    const files = getMigrationFiles();
    logger.info(`Total migration files: ${files.length}`);

    // Find pending migrations
    const pending = files.filter(file => !executed.includes(file));

    if (pending.length === 0) {
      logger.info('✅ No pending migrations');
      return { success: true, executed: 0 };
    }

    logger.info(`Pending migrations: ${pending.length}`);

    // Execute each pending migration
    for (const file of pending) {
      await executeMigration(pool, file);
    }

    logger.info(`✅ All migrations completed successfully. Executed ${pending.length} migration(s)`);

    return {
      success: true,
      executed: pending.length,
      migrations: pending
    };

  } catch (error) {
    logger.error('Migration process failed', { error: error.message });
    throw error;
  }
}

// Rollback last migration (manual SQL required)
export async function rollbackMigration(migrationName) {
  const pool = await initDatabase();

  try {
    logger.warn(`Rolling back migration: ${migrationName}`);

    // Delete from migrations table
    await pool.query('DELETE FROM migrations WHERE name = $1', [migrationName]);

    logger.info(`⚠️  Migration ${migrationName} marked as not executed. Manual rollback SQL required.`);

    return { success: true };

  } catch (error) {
    logger.error('Rollback failed', { error: error.message });
    throw error;
  }
}

// List all migrations with status
export async function listMigrations() {
  const pool = await initDatabase();

  try {
    await createMigrationsTable(pool);

    const executed = await getExecutedMigrations(pool);
    const files = getMigrationFiles();

    const migrations = files.map(file => ({
      name: file,
      executed: executed.includes(file),
      executedAt: null // Could be fetched from migrations table
    }));

    return migrations;

  } catch (error) {
    logger.error('Failed to list migrations', { error: error.message });
    throw error;
  }
}

// CLI execution
if (import.meta.url === `file://${process.argv[1]}`) {
  const command = process.argv[2] || 'run';

  (async () => {
    let pool;
    try {
      pool = await initDatabase();

      if (command === 'run') {
        const result = await runMigrations();
        console.log('\n✅ Migration completed:', result);
        process.exit(0);

      } else if (command === 'list') {
        const migrations = await listMigrations();
        console.log('\nMigrations:');
        migrations.forEach(m => {
          console.log(`  ${m.executed ? '✅' : '⏳'} ${m.name}`);
        });
        process.exit(0);

      } else if (command === 'rollback') {
        const migrationName = process.argv[3];
        if (!migrationName) {
          console.error('Usage: node migrate.js rollback <migration_name>');
          process.exit(1);
        }
        await rollbackMigration(migrationName);
        process.exit(0);

      } else {
        console.error('Unknown command. Use: run, list, or rollback');
        process.exit(1);
      }

    } catch (error) {
      console.error('Migration error:', error.message);
      process.exit(1);
    } finally {
      if (pool) {
        await pool.end();
      }
    }
  })();
}

export default { runMigrations, rollbackMigration, listMigrations };
