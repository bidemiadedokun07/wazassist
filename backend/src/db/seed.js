import { query } from '../config/database.js';
import bcrypt from 'bcryptjs';
import { logger } from '../utils/logger.js';

/**
 * Seed Script for WazAssist AI
 * Creates sample data for testing the complete application
 */

async function seedDatabase() {
  try {
    logger.info('🌱 Starting database seeding...');

    // 1. Create test users
    logger.info('Creating test users...');
    const password = await bcrypt.hash('Test@1234', 10);

    const userResult = await query(
      `INSERT INTO users (name, phone_number, email, password_hash, is_active)
       VALUES
         ('John Doe', '+2348012345601', 'john@example.com', $1, true),
         ('Jane Smith', '+2348012345602', 'jane@example.com', $1, true),
         ('Mike Johnson', '+2348012345603', 'mike@example.com', $1, true)
       ON CONFLICT (phone_number) DO UPDATE
       SET name = EXCLUDED.name
       RETURNING id, name, phone_number`,
      [password]
    );

    logger.info(`✅ Created ${userResult.rows.length} test users`);
    const users = userResult.rows;

    // 2. Create test businesses
    logger.info('Creating test businesses...');
    const businessResult = await query(
      `INSERT INTO businesses (
        owner_id, business_name, description, business_type,
        phone_number, email, address, logo_url, is_active
      ) VALUES
        ($1, 'Fashion Paradise', 'Premium clothing and accessories store', 'Fashion',
         '+2348012345611', 'contact@fashionparadise.com', '123 Lagos Street, VI, Lagos',
         'https://via.placeholder.com/150', true),
        ($2, 'Tech Hub Electronics', 'Latest gadgets and electronics', 'Electronics',
         '+2348012345612', 'info@techhub.com', '456 Abuja Road, Wuse, Abuja',
         'https://via.placeholder.com/150', true),
        ($3, 'Delicious Bites', 'Fresh food delivery service', 'Food',
         '+2348012345613', 'orders@deliciousbites.com', '789 PH Avenue, GRA, Port Harcourt',
         'https://via.placeholder.com/150', true)
      ON CONFLICT DO NOTHING
      RETURNING id, business_name, owner_id`,
      [users[0].id, users[1].id, users[2].id]
    );

    logger.info(`✅ Created ${businessResult.rows.length} test businesses`);
    const businesses = businessResult.rows;

    if (businesses.length === 0) {
      logger.info('ℹ️  Businesses already exist, fetching existing data...');
      const existingBusinesses = await query(
        `SELECT id, business_name, owner_id FROM businesses
         WHERE owner_id = ANY($1::uuid[])
         LIMIT 3`,
        [[users[0].id, users[1].id, users[2].id]]
      );
      businesses.push(...existingBusinesses.rows);
    }

    // 3. Create test products
    logger.info('Creating test products...');
    const products = [
      // Fashion Paradise products
      { businessId: businesses[0].id, name: 'Designer Dress', description: 'Elegant evening dress', price: 25000, currency: 'NGN', category: 'Clothing', stock: 15, lowStockThreshold: 5, imageUrl: 'https://via.placeholder.com/200' },
      { businessId: businesses[0].id, name: 'Leather Handbag', description: 'Genuine leather handbag', price: 18000, currency: 'NGN', category: 'Accessories', stock: 20, lowStockThreshold: 5, imageUrl: 'https://via.placeholder.com/200' },
      { businessId: businesses[0].id, name: 'Sneakers', description: 'Comfortable sports sneakers', price: 15000, currency: 'NGN', category: 'Footwear', stock: 30, lowStockThreshold: 10, imageUrl: 'https://via.placeholder.com/200' },
      { businessId: businesses[0].id, name: 'Sunglasses', description: 'UV protection sunglasses', price: 8000, currency: 'NGN', category: 'Accessories', stock: 3, lowStockThreshold: 5, imageUrl: 'https://via.placeholder.com/200' },
      { businessId: businesses[0].id, name: 'Watch', description: 'Stylish wristwatch', price: 35000, currency: 'NGN', category: 'Accessories', stock: 12, lowStockThreshold: 5, imageUrl: 'https://via.placeholder.com/200' },

      // Tech Hub products
      { businessId: businesses[1].id, name: 'Smartphone', description: 'Latest Android smartphone', price: 250000, currency: 'NGN', category: 'Mobile', stock: 25, lowStockThreshold: 10, imageUrl: 'https://via.placeholder.com/200' },
      { businessId: businesses[1].id, name: 'Laptop', description: 'High-performance laptop', price: 450000, currency: 'NGN', category: 'Computers', stock: 10, lowStockThreshold: 5, imageUrl: 'https://via.placeholder.com/200' },
      { businessId: businesses[1].id, name: 'Wireless Earbuds', description: 'Bluetooth earbuds with case', price: 25000, currency: 'NGN', category: 'Audio', stock: 50, lowStockThreshold: 15, imageUrl: 'https://via.placeholder.com/200' },
      { businessId: businesses[1].id, name: 'Power Bank', description: '20000mAh portable charger', price: 12000, currency: 'NGN', category: 'Accessories', stock: 4, lowStockThreshold: 10, imageUrl: 'https://via.placeholder.com/200' },
      { businessId: businesses[1].id, name: 'Smart Watch', description: 'Fitness tracking smartwatch', price: 45000, currency: 'NGN', category: 'Wearables', stock: 18, lowStockThreshold: 8, imageUrl: 'https://via.placeholder.com/200' },

      // Delicious Bites products
      { businessId: businesses[2].id, name: 'Jollof Rice Combo', description: 'Jollof rice with chicken and plantain', price: 3500, currency: 'NGN', category: 'Meals', stock: 50, lowStockThreshold: 20, imageUrl: 'https://via.placeholder.com/200' },
      { businessId: businesses[2].id, name: 'Pepper Soup', description: 'Spicy goat meat pepper soup', price: 2500, currency: 'NGN', category: 'Soups', stock: 30, lowStockThreshold: 15, imageUrl: 'https://via.placeholder.com/200' },
      { businessId: businesses[2].id, name: 'Suya Platter', description: 'Grilled beef suya with sides', price: 4000, currency: 'NGN', category: 'Grills', stock: 25, lowStockThreshold: 10, imageUrl: 'https://via.placeholder.com/200' },
      { businessId: businesses[2].id, name: 'Pounded Yam & Egusi', description: 'Traditional Nigerian meal', price: 3000, currency: 'NGN', category: 'Meals', stock: 40, lowStockThreshold: 20, imageUrl: 'https://via.placeholder.com/200' },
      { businessId: businesses[2].id, name: 'Chapman Drink', description: 'Refreshing fruit cocktail', price: 1500, currency: 'NGN', category: 'Drinks', stock: 60, lowStockThreshold: 25, imageUrl: 'https://via.placeholder.com/200' },
    ];

    for (const product of products) {
      await query(
        `INSERT INTO products (
          business_id, name, description, price, currency, category,
          quantity_in_stock, low_stock_threshold, primary_image_url, is_active
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, true)
        ON CONFLICT DO NOTHING`,
        [
          product.businessId, product.name, product.description, product.price,
          product.currency, product.category, product.stock, product.lowStockThreshold,
          product.imageUrl
        ]
      );
    }

    logger.info(`✅ Created ${products.length} test products`);

    // 4. Define test customers (for orders - no customers table)
    logger.info('Defining test customers for orders...');
    const customers = [
      { id: users[0].id, name: 'Ada Obi', phone_number: '+2348023456701', email: 'ada@customer.com', address: 'Lekki, Lagos' },
      { id: users[1].id, name: 'Chinedu Eze', phone_number: '+2348023456702', email: 'chinedu@customer.com', address: 'Ikeja, Lagos' },
      { id: users[2].id, name: 'Fatima Bello', phone_number: '+2348023456703', email: 'fatima@customer.com', address: 'Garki, Abuja' },
      { id: users[0].id, name: 'Emeka Nwosu', phone_number: '+2348023456704', email: 'emeka@customer.com', address: 'GRA, Port Harcourt' },
      { id: users[1].id, name: 'Blessing Adeyemi', phone_number: '+2348023456705', email: 'blessing@customer.com', address: 'Bodija, Ibadan' }
    ];

    logger.info(`✅ Defined ${customers.length} test customers`);

    // 5. Get product IDs for creating orders
    const productIds = await query(
      `SELECT id, business_id, name, price FROM products
       WHERE business_id = ANY($1::uuid[])
       ORDER BY business_id, created_at`,
      [[businesses[0].id, businesses[1].id, businesses[2].id]]
    );

    // 6. Create test orders with different statuses
    logger.info('Creating test orders...');
    const orderStatuses = ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'];
    const paymentStatuses = ['pending', 'paid', 'paid', 'paid', 'paid', 'failed'];

    let orderCount = 0;
    for (let i = 0; i < businesses.length; i++) {
      const business = businesses[i];
      const businessProducts = productIds.rows.filter(p => p.business_id === business.id);

      // Create 3-5 orders per business
      for (let j = 0; j < 4; j++) {
        const customer = customers[j % customers.length];
        const status = orderStatuses[j % orderStatuses.length];
        const paymentStatus = paymentStatuses[j % paymentStatuses.length];

        // Select 1-3 random products
        const numItems = Math.floor(Math.random() * 3) + 1;
        const selectedProducts = businessProducts.slice(0, numItems);

        let totalAmount = 0;
        const orderItems = selectedProducts.map(product => {
          const quantity = Math.floor(Math.random() * 3) + 1;
          const subtotal = product.price * quantity;
          totalAmount += subtotal;
          return { product, quantity, subtotal };
        });

        // Create order
        const orderResult = await query(
          `INSERT INTO orders (
            business_id, customer_id, status, total_amount, subtotal,
            currency, payment_status, customer_name, customer_phone, order_number, metadata
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
          RETURNING id`,
          [
            business.id,
            customer.id,
            status,
            totalAmount,
            totalAmount,
            'NGN',
            paymentStatus,
            customer.name,
            customer.phone_number,
            `ORD-${Date.now().toString(36).toUpperCase()}-${j}`,
            JSON.stringify({
              notes: `Test order ${j + 1}`,
              shipping_address: customer.address,
              payment_method: 'card'
            })
          ]
        );

        const orderId = orderResult.rows[0].id;

        // Create order items
        for (const item of orderItems) {
          await query(
            `INSERT INTO order_items (
              order_id, product_id, product_name, quantity, unit_price, total
            ) VALUES ($1, $2, $3, $4, $5, $6)`,
            [orderId, item.product.id, item.product.name, item.quantity, item.product.price, item.subtotal]
          );
        }

        orderCount++;
      }
    }

    logger.info(`✅ Created ${orderCount} test orders with items`);

    // 7. Create test conversations
    logger.info('Creating test conversations...');
    for (let i = 0; i < businesses.length; i++) {
      const business = businesses[i];

      for (let j = 0; j < 3; j++) {
        const customer = customers[j];
        const isActive = j < 2; // First 2 conversations are active

        await query(
          `INSERT INTO conversations (
            business_id, customer_id, status, whatsapp_conversation_id, metadata
          ) VALUES ($1, $2, $3, $4, $5)
          ON CONFLICT DO NOTHING`,
          [
            business.id,
            customer.id,
            isActive ? 'active' : 'resolved',
            `wa_${Date.now()}_${j}`,
            JSON.stringify({
              last_message: `Test message from ${customer.name}`,
              customer_name: customer.name
            })
          ]
        );
      }
    }

    logger.info('✅ Created test conversations');

    // 8. Print summary
    logger.info('\n' + '='.repeat(60));
    logger.info('🎉 DATABASE SEEDING COMPLETED SUCCESSFULLY!');
    logger.info('='.repeat(60));
    logger.info('\nTest Accounts Created:');
    logger.info('\n👤 Users:');
    users.forEach(user => {
      logger.info(`   - ${user.name} (${user.phone_number})`);
    });
    logger.info('\n   📧 Password for all users: Test@1234');

    logger.info('\n🏢 Businesses:');
    businesses.forEach(business => {
      logger.info(`   - ${business.business_name}`);
    });

    logger.info(`\n📦 Products: ${products.length} products across all businesses`);
    logger.info(`🛒 Orders: ${orderCount} orders with various statuses`);
    logger.info(`👥 Customers: ${customers.length} test customers`);
    logger.info(`💬 Conversations: ${businesses.length * 3} test conversations`);

    logger.info('\n' + '='.repeat(60));
    logger.info('🚀 You can now test the complete application!');
    logger.info('🔗 Frontend: http://localhost:5174');
    logger.info('🔗 Backend: http://localhost:3000');
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
      logger.info('✅ Seeding completed');
      process.exit(0);
    })
    .catch(error => {
      logger.error('❌ Seeding failed:', error);
      process.exit(1);
    });
}

export { seedDatabase };
