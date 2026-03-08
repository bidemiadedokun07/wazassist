import { query } from '../src/config/database.js';

async function checkBusinessesSchema() {
  try {
    const result = await query(`
      SELECT column_name, data_type
      FROM information_schema.columns
      WHERE table_name = 'businesses'
      ORDER BY ordinal_position
    `);

    console.log('\n📊 Businesses Table Schema:');
    console.log('─'.repeat(60));
    result.rows.forEach(col => {
      console.log(`${col.column_name}: ${col.data_type}`);
    });
    console.log('');

    process.exit(0);
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

checkBusinessesSchema();
