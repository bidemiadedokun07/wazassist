import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { query } from '../src/config/database.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function runMigration() {
  try {
    console.log('🔄 Running team members migration...');

    // Read migration file
    const migrationPath = join(__dirname, '../src/database/migrations/007_create_team_members.sql');
    const migrationSQL = readFileSync(migrationPath, 'utf8');

    // Execute migration
    await query(migrationSQL);

    console.log('✅ Team members migration completed successfully!');

    // Verify tables were created
    const result = await query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      AND table_name IN ('team_members', 'team_invitations')
      ORDER BY table_name
    `);

    console.log('\n📋 Created tables:');
    result.rows.forEach(row => {
      console.log(`  ✓ ${row.table_name}`);
    });

    // Check if team members were seeded
    const countResult = await query('SELECT COUNT(*) as count FROM team_members');
    console.log(`\n👥 Seeded team members: ${countResult.rows[0].count}`);

    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    if (error.message.includes('already exists')) {
      console.log('ℹ️  Tables already exist, skipping migration');
      process.exit(0);
    } else {
      console.error(error);
      process.exit(1);
    }
  }
}

runMigration();
