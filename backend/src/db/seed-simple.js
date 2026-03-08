import { query } from '../config/database.js';
import bcrypt from 'bcryptjs';
import { logger } from '../utils/logger.js';

/**
 * Simple Seed Script for WazAssist AI
 * Creates basic test data that works with existing frontend
 */

async function seedDatabase() {
  try {
    logger.info('🌱 Starting simple database seeding...');

    // 1. Create test user
    logger.info('Creating test user...');
    const password = await bcrypt.hash('Test@1234', 10);

    const userResult = await query(
      `INSERT INTO users (name, phone_number, email, password_hash, is_active)
       VALUES ('Demo User', '+2348099999998', 'demo@wazassist.com', $1, true)
       ON CONFLICT (phone_number) DO UPDATE
       SET password_hash = EXCLUDED.password_hash
       RETURNING id, name, phone_number`,
      [password]
    );

    const user = userResult.rows[0];
    logger.info(`✅ Test user: ${user.name} (${user.phone_number})`);

    // 2. Create test business
    logger.info('Creating test business...');
    const businessResult = await query(
      `INSERT INTO businesses (
        owner_id, business_name, description, business_type,
        phone_number, email, address, is_active
      ) VALUES ($1, 'Demo Fashion Store', 'Premium clothing and accessories', 'Fashion',
               '+2348099999990', 'contact@demofashion.com', '123 Demo Street, Lagos', true)
      ON CONFLICT DO NOTHING
      RETURNING id, business_name`,
      [user.id]
    );

    let business;
    if (businessResult.rows.length > 0) {
      business = businessResult.rows[0];
      logger.info(`✅ Created business: ${business.business_name}`);
    } else {
      // Business already exists, fetch it
      const existingResult = await query(
        `SELECT id, business_name FROM businesses WHERE owner_id = $1 LIMIT 1`,
        [user.id]
      );
      business = existingResult.rows[0];
      logger.info(`ℹ️  Using existing business: ${business.business_name}`);
    }

    // 3. Create test products
    logger.info('Creating test products...');
    const products = [
      { name: 'Summer Dress', description: 'Light and breezy summer dress', price: 12500, category: 'Clothing', stock: 20 },
      { name: 'Leather Bag', description: 'Premium leather handbag', price: 18000, category: 'Accessories', stock: 15 },
      { name: 'Sneakers', description: 'Comfortable running sneakers', price: 15000, category: 'Footwear', stock: 25 },
      { name: 'Sunglasses', description: 'UV protection sunglasses', price: 5000, category: 'Accessories', stock: 8 },
      { name: 'Watch', description: 'Elegant wristwatch', price: 25000, category: 'Accessories', stock: 10 },
    ];

    for (const product of products) {
      await query(
        `INSERT INTO products (
          business_id, name, description, price, currency, category,
          quantity_in_stock, low_stock_threshold, is_active
        ) VALUES ($1, $2, $3, $4, 'NGN', $5, $6, 5, true)
        ON CONFLICT DO NOTHING`,
        [business.id, product.name, product.description, product.price, product.category, product.stock]
      );
    }

    logger.info(`✅ Created ${products.length} test products`);

    // 4. Print summary
    logger.info('\n' + '='.repeat(60));
    logger.info('🎉 DATABASE SEEDING COMPLETED!');
    logger.info('='.repeat(60));
    logger.info('\n📧 Test Account:');
    logger.info(`   Phone: ${user.phone_number}`);
    logger.info(`   Password: Test@1234`);
    logger.info(`\n🏢 Business: ${business.business_name}`);
    logger.info(`📦 Products: ${products.length} items added`);
    logger.info('\n🚀 Next Steps:');
    logger.info('   1. Open http://localhost:5174');
    logger.info(`   2. Login with ${user.phone_number}`);
    logger.info('   3. Explore the dashboard!');
    logger.info('='.repeat(60) + '\n');

  } catch (error) {
    logger.error('❌ Error seeding database:', error);
    throw error;
  }
}

// Run if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  seedDatabase()
    .then(() => {
      process.exit(0);
    })
    .catch(error => {
      logger.error('❌ Seeding failed:', error);
      process.exit(1);
    });
}

export { seedDatabase };
