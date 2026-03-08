/**
 * Test Order Management API
 *
 * Usage: node test-orders.js
 */

import axios from 'axios';

const API_URL = 'http://localhost:3000/api/v1';
const BUSINESS_ID = 'c2c75837-2976-4013-a55f-114c0ecbc38e';
const CUSTOMER_ID = '42d7e5a7-c610-4bf4-9bcc-12ef98c34f2b';

let createdOrderId = null;
let productIds = [];

// First, get some products to create orders with
async function getProducts() {
  try {
    const response = await axios.get(`${API_URL}/products/business/${BUSINESS_ID}`);
    productIds = response.data.data.slice(0, 3).map(p => ({
      id: p.id,
      name: p.name,
      price: parseFloat(p.price)
    }));
    console.log(`\n📦 Found ${productIds.length} products to use for orders`);
  } catch (error) {
    console.error('❌ Error getting products:', error.response?.data || error.message);
    process.exit(1);
  }
}

async function testCreateOrder() {
  console.log('\n🛒 Test 1: Creating a new order...');
  try {
    const items = [
      {
        productId: productIds[0].id,
        productName: productIds[0].name,
        quantity: 2,
        unitPrice: productIds[0].price
      },
      {
        productId: productIds[1].id,
        productName: productIds[1].name,
        quantity: 1,
        unitPrice: productIds[1].price
      }
    ];

    const totalAmount = items.reduce((sum, item) => sum + (item.unitPrice * item.quantity), 0);

    const response = await axios.post(`${API_URL}/orders`, {
      businessId: BUSINESS_ID,
      customerId: CUSTOMER_ID,
      customerPhone: '+2348012345678',
      customerName: 'Test Customer',
      deliveryAddress: '123 Test Street, Lagos, Nigeria',
      deliveryPhone: '+2348012345678',
      paymentMethod: 'cash',
      paymentStatus: 'pending',
      items: items,
      notes: 'Please deliver before 5pm'
    });

    createdOrderId = response.data.data.id;
    console.log('✅ Order created successfully!');
    console.log('   Order ID:', createdOrderId);
    console.log('   Order Number:', response.data.data.order_number);
    console.log('   Total Amount: ₦' + totalAmount.toLocaleString());
    console.log('   Items:', items.length);
    console.log('   Status:', response.data.data.status);
  } catch (error) {
    console.error('❌ Error creating order:', error.response?.data || error.message);
  }
}

async function testGetAllOrders() {
  console.log('\n📋 Test 2: Getting all orders for business...');
  try {
    const response = await axios.get(`${API_URL}/orders/business/${BUSINESS_ID}`);

    console.log('✅ Orders retrieved!');
    console.log('   Total count:', response.data.count);
    response.data.data.forEach((order, index) => {
      console.log(`   ${index + 1}. Order #${order.order_number} - ₦${parseFloat(order.total_amount).toLocaleString()} - ${order.status}`);
    });
  } catch (error) {
    console.error('❌ Error getting orders:', error.response?.data || error.message);
  }
}

async function testGetOrderById() {
  if (!createdOrderId) {
    console.log('\n⏭️  Skipping Test 3: No order ID available');
    return;
  }

  console.log('\n🔍 Test 3: Getting order by ID...');
  try {
    const response = await axios.get(`${API_URL}/orders/${createdOrderId}/business/${BUSINESS_ID}`);

    console.log('✅ Order retrieved!');
    const order = response.data.data;
    console.log('   Order Number:', order.order_number);
    console.log('   Customer:', order.customer_phone);
    console.log('   Total: ₦' + parseFloat(order.total_amount).toLocaleString());
    console.log('   Status:', order.status);
    console.log('   Payment:', order.payment_status);
    console.log('   Items:', order.items.length);
    order.items.forEach((item, idx) => {
      console.log(`     ${idx + 1}. ${item.product_name} x${item.quantity} = ₦${parseFloat(item.total).toLocaleString()}`);
    });
  } catch (error) {
    console.error('❌ Error getting order:', error.response?.data || error.message);
  }
}

async function testUpdateOrderStatus() {
  if (!createdOrderId) {
    console.log('\n⏭️  Skipping Test 4: No order ID available');
    return;
  }

  console.log('\n✏️  Test 4: Updating order status to "confirmed"...');
  try {
    const response = await axios.patch(
      `${API_URL}/orders/${createdOrderId}/business/${BUSINESS_ID}/status`,
      {
        status: 'confirmed',
        notes: 'Order confirmed by business'
      }
    );

    console.log('✅ Order status updated!');
    console.log('   New status:', response.data.data.status);
    const metadata = response.data.data.metadata || {};
    console.log('   Confirmed at:', metadata.confirmedAt);
  } catch (error) {
    console.error('❌ Error updating order status:', error.response?.data || error.message);
  }
}

async function testUpdatePaymentStatus() {
  if (!createdOrderId) {
    console.log('\n⏭️  Skipping Test 5: No order ID available');
    return;
  }

  console.log('\n💳 Test 5: Updating payment status to "paid"...');
  try {
    const response = await axios.patch(
      `${API_URL}/orders/${createdOrderId}/business/${BUSINESS_ID}/payment`,
      {
        paymentStatus: 'paid',
        paymentReference: 'PAY-TEST-' + Date.now()
      }
    );

    console.log('✅ Payment status updated!');
    console.log('   Payment status:', response.data.data.payment_status);
    const metadata = response.data.data.metadata || {};
    console.log('   Paid at:', metadata.paidAt);
    console.log('   Reference:', metadata.paymentReference);
  } catch (error) {
    console.error('❌ Error updating payment status:', error.response?.data || error.message);
  }
}

async function testGetCustomerOrders() {
  console.log('\n👤 Test 6: Getting orders for customer...');
  try {
    const response = await axios.get(
      `${API_URL}/orders/customer/${CUSTOMER_ID}/business/${BUSINESS_ID}`
    );

    console.log('✅ Customer orders retrieved!');
    console.log('   Total orders:', response.data.count);
    response.data.data.forEach((order, index) => {
      console.log(`   ${index + 1}. ₦${parseFloat(order.total_amount).toLocaleString()} - ${order.status}`);
    });
  } catch (error) {
    console.error('❌ Error getting customer orders:', error.response?.data || error.message);
  }
}

async function testGetOrderStatistics() {
  console.log('\n📊 Test 7: Getting order statistics...');
  try {
    const response = await axios.get(
      `${API_URL}/orders/business/${BUSINESS_ID}/statistics`
    );

    console.log('✅ Statistics retrieved!');
    const stats = response.data.data;
    console.log('   Total orders:', stats.total_orders);
    console.log('   Pending:', stats.pending_orders);
    console.log('   Confirmed:', stats.confirmed_orders);
    console.log('   Delivered:', stats.delivered_orders);
    console.log('   Cancelled:', stats.cancelled_orders);
    console.log('   Total revenue: ₦' + parseFloat(stats.total_revenue).toLocaleString());
    console.log('   Paid revenue: ₦' + parseFloat(stats.paid_revenue).toLocaleString());
    console.log('   Average order value: ₦' + parseFloat(stats.average_order_value).toLocaleString());
  } catch (error) {
    console.error('❌ Error getting statistics:', error.response?.data || error.message);
  }
}

async function testGetRecentOrders() {
  console.log('\n🕒 Test 8: Getting recent orders...');
  try {
    const response = await axios.get(
      `${API_URL}/orders/business/${BUSINESS_ID}/recent?limit=5`
    );

    console.log('✅ Recent orders retrieved!');
    console.log('   Count:', response.data.count);
    response.data.data.forEach((order, index) => {
      console.log(`   ${index + 1}. #${order.order_number} - ₦${parseFloat(order.total_amount).toLocaleString()} - ${order.status}`);
    });
  } catch (error) {
    console.error('❌ Error getting recent orders:', error.response?.data || error.message);
  }
}

async function testSearchOrders() {
  console.log('\n🔎 Test 9: Searching orders by phone number...');
  try {
    const response = await axios.get(
      `${API_URL}/orders/business/${BUSINESS_ID}/search?q=+2348012345678`
    );

    console.log('✅ Search results:');
    console.log('   Query: "+2348012345678"');
    console.log('   Results found:', response.data.count);
    response.data.data.forEach((order, index) => {
      console.log(`   ${index + 1}. #${order.order_number} - ₦${parseFloat(order.total_amount).toLocaleString()}`);
    });
  } catch (error) {
    console.error('❌ Error searching orders:', error.response?.data || error.message);
  }
}

async function testCreateAnotherOrder() {
  console.log('\n🛒 Test 10: Creating another order (for testing status updates)...');
  try {
    const response = await axios.post(`${API_URL}/orders`, {
      businessId: BUSINESS_ID,
      customerId: CUSTOMER_ID,
      customerPhone: '+2348012345678',
      customerName: 'Test Customer',
      deliveryAddress: '456 Another Street, Lagos',
      paymentMethod: 'transfer',
      items: [
        {
          productId: productIds[2].id,
          productName: productIds[2].name,
          quantity: 1,
          unitPrice: productIds[2].price
        }
      ]
    });

    console.log('✅ Second order created!');
    console.log('   Order Number:', response.data.data.order_number);
    console.log('   Total: ₦' + parseFloat(response.data.data.total_amount).toLocaleString());
  } catch (error) {
    console.error('❌ Error creating second order:', error.response?.data || error.message);
  }
}

async function testFilterOrders() {
  console.log('\n🔍 Test 11: Filtering orders by status...');
  try {
    const response = await axios.get(
      `${API_URL}/orders/business/${BUSINESS_ID}?status=pending`
    );

    console.log('✅ Filtered orders (status=pending):');
    console.log('   Count:', response.data.count);
  } catch (error) {
    console.error('❌ Error filtering orders:', error.response?.data || error.message);
  }
}

// Run all tests
async function runAllTests() {
  console.log('🚀 Starting Order Management API Tests...\n');
  console.log('═══════════════════════════════════════════════════════\n');

  await getProducts();
  await testCreateOrder();
  await testGetAllOrders();
  await testGetOrderById();
  await testUpdateOrderStatus();
  await testUpdatePaymentStatus();
  await testGetCustomerOrders();
  await testGetOrderStatistics();
  await testGetRecentOrders();
  await testSearchOrders();
  await testCreateAnotherOrder();
  await testFilterOrders();

  console.log('\n═══════════════════════════════════════════════════════');
  console.log('✅ All tests completed!\n');
  console.log('💡 To view orders in database, run:');
  console.log(`   docker exec wazassist-db psql -U postgres -d wazassist -c "SELECT order_number, customer_phone, total_amount, status, payment_status FROM orders WHERE business_id = '${BUSINESS_ID}';"`)
  console.log('');
}

runAllTests();
