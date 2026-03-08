/**
 * Test Product Management API
 *
 * Usage: node test-products.js
 */

import axios from 'axios';

const API_URL = 'http://localhost:3000/api/v1';
const BUSINESS_ID = 'c2c75837-2976-4013-a55f-114c0ecbc38e'; // From our test business

let createdProductId = null;

async function testCreateProduct() {
  console.log('\n📦 Test 1: Creating a new product...');
  try {
    const response = await axios.post(`${API_URL}/products`, {
      businessId: BUSINESS_ID,
      name: 'Nike Air Max 270',
      description: 'Classic Nike sneakers with great comfort and style. Perfect for everyday wear.',
      price: 45000,
      currency: 'NGN',
      sku: 'NIKE-AM270-BLK-42',
      category: 'footwear',
      stockQuantity: 25,
      lowStockThreshold: 5,
      imageUrl: 'https://example.com/images/nike-airmax-270.jpg',
      isActive: true,
      metadata: {
        brand: 'Nike',
        size: '42',
        color: 'Black',
        gender: 'Unisex'
      }
    });

    createdProductId = response.data.data.id;
    console.log('✅ Product created successfully!');
    console.log('   Product ID:', createdProductId);
    console.log('   Name:', response.data.data.name);
    console.log('   Price: ₦' + response.data.data.price.toLocaleString());
    console.log('   Stock:', response.data.data.stock_quantity);
  } catch (error) {
    console.error('❌ Error creating product:', error.response?.data || error.message);
  }
}

async function testGetAllProducts() {
  console.log('\n📋 Test 2: Getting all products for business...');
  try {
    const response = await axios.get(`${API_URL}/products/business/${BUSINESS_ID}`);

    console.log('✅ Products retrieved!');
    console.log('   Total count:', response.data.count);
    response.data.data.forEach((product, index) => {
      console.log(`   ${index + 1}. ${product.name} - ₦${product.price.toLocaleString()} (Stock: ${product.stock_quantity})`);
    });
  } catch (error) {
    console.error('❌ Error getting products:', error.response?.data || error.message);
  }
}

async function testGetProductById() {
  if (!createdProductId) {
    console.log('\n⏭️  Skipping Test 3: No product ID available');
    return;
  }

  console.log('\n🔍 Test 3: Getting product by ID...');
  try {
    const response = await axios.get(`${API_URL}/products/${createdProductId}/business/${BUSINESS_ID}`);

    console.log('✅ Product retrieved!');
    console.log('   Name:', response.data.data.name);
    console.log('   Description:', response.data.data.description);
    console.log('   Price: ₦' + response.data.data.price.toLocaleString());
    console.log('   Category:', response.data.data.category);
    console.log('   SKU:', response.data.data.sku);
  } catch (error) {
    console.error('❌ Error getting product:', error.response?.data || error.message);
  }
}

async function testUpdateProduct() {
  if (!createdProductId) {
    console.log('\n⏭️  Skipping Test 4: No product ID available');
    return;
  }

  console.log('\n✏️  Test 4: Updating product...');
  try {
    const response = await axios.put(
      `${API_URL}/products/${createdProductId}/business/${BUSINESS_ID}`,
      {
        price: 42000,
        description: 'Nike Air Max 270 - NOW ON SALE! Classic sneakers with premium comfort.',
        metadata: {
          brand: 'Nike',
          size: '42',
          color: 'Black',
          gender: 'Unisex',
          onSale: true,
          originalPrice: 45000
        }
      }
    );

    console.log('✅ Product updated!');
    console.log('   New price: ₦' + response.data.data.price.toLocaleString());
    console.log('   Updated description:', response.data.data.description.substring(0, 50) + '...');
  } catch (error) {
    console.error('❌ Error updating product:', error.response?.data || error.message);
  }
}

async function testUpdateStock() {
  if (!createdProductId) {
    console.log('\n⏭️  Skipping Test 5: No product ID available');
    return;
  }

  console.log('\n📊 Test 5: Updating product stock...');
  try {
    // Decrement stock by 3 (simulate sales)
    const response = await axios.patch(
      `${API_URL}/products/${createdProductId}/business/${BUSINESS_ID}/stock`,
      {
        quantity: 3,
        operation: 'decrement'
      }
    );

    console.log('✅ Stock updated!');
    console.log('   New stock quantity:', response.data.data.stock_quantity);
    console.log('   Operation: Decremented by 3 (simulating sales)');
  } catch (error) {
    console.error('❌ Error updating stock:', error.response?.data || error.message);
  }
}

async function testSearchProducts() {
  console.log('\n🔎 Test 6: Searching products...');
  try {
    const response = await axios.get(`${API_URL}/products/business/${BUSINESS_ID}/search`, {
      params: { q: 'Nike' }
    });

    console.log('✅ Search results:');
    console.log('   Query: "Nike"');
    console.log('   Results found:', response.data.count);
    response.data.data.forEach((product, index) => {
      console.log(`   ${index + 1}. ${product.name} - ₦${product.price.toLocaleString()}`);
    });
  } catch (error) {
    console.error('❌ Error searching products:', error.response?.data || error.message);
  }
}

async function testGetCategories() {
  console.log('\n📂 Test 7: Getting product categories...');
  try {
    const response = await axios.get(`${API_URL}/products/business/${BUSINESS_ID}/categories`);

    console.log('✅ Categories retrieved!');
    response.data.data.forEach((cat, index) => {
      console.log(`   ${index + 1}. ${cat.category}: ${cat.product_count} product(s)`);
    });
  } catch (error) {
    console.error('❌ Error getting categories:', error.response?.data || error.message);
  }
}

async function testBulkCreateProducts() {
  console.log('\n📦📦📦 Test 8: Bulk creating products...');
  try {
    const products = [
      {
        name: 'Adidas Ultraboost 22',
        description: 'Premium running shoes with boost technology',
        price: 52000,
        category: 'footwear',
        stockQuantity: 15,
        sku: 'ADIDAS-UB22-WHT-42'
      },
      {
        name: 'Puma RS-X',
        description: 'Retro-inspired lifestyle sneakers',
        price: 38000,
        category: 'footwear',
        stockQuantity: 20,
        sku: 'PUMA-RSX-BLK-42'
      },
      {
        name: 'Canvas Backpack',
        description: 'Durable canvas backpack for everyday use',
        price: 12000,
        category: 'accessories',
        stockQuantity: 30,
        sku: 'ACC-BP-CAN-001'
      }
    ];

    const response = await axios.post(
      `${API_URL}/products/business/${BUSINESS_ID}/bulk`,
      { products }
    );

    console.log('✅ Bulk products created!');
    console.log('   Created count:', response.data.count);
    response.data.data.forEach((product, index) => {
      console.log(`   ${index + 1}. ${product.name} - ₦${product.price.toLocaleString()}`);
    });
  } catch (error) {
    console.error('❌ Error bulk creating products:', error.response?.data || error.message);
  }
}

async function testGetProductsByCategory() {
  console.log('\n👟 Test 9: Getting products by category (footwear)...');
  try {
    const response = await axios.get(`${API_URL}/products/business/${BUSINESS_ID}/category/footwear`);

    console.log('✅ Footwear products retrieved!');
    console.log('   Count:', response.data.count);
    response.data.data.forEach((product, index) => {
      console.log(`   ${index + 1}. ${product.name} - ₦${product.price.toLocaleString()}`);
    });
  } catch (error) {
    console.error('❌ Error getting products by category:', error.response?.data || error.message);
  }
}

// Run all tests
async function runAllTests() {
  console.log('🚀 Starting Product Management API Tests...\n');
  console.log('═══════════════════════════════════════════════════════\n');

  await testCreateProduct();
  await testGetAllProducts();
  await testGetProductById();
  await testUpdateProduct();
  await testUpdateStock();
  await testSearchProducts();
  await testGetCategories();
  await testBulkCreateProducts();
  await testGetProductsByCategory();

  console.log('\n═══════════════════════════════════════════════════════');
  console.log('✅ All tests completed!\n');
  console.log('💡 To view products in database, run:');
  console.log(`   docker exec wazassist-db psql -U postgres -d wazassist -c "SELECT name, price, stock_quantity, category FROM products WHERE business_id = '${BUSINESS_ID}';"`)
  console.log('');
}

runAllTests();
