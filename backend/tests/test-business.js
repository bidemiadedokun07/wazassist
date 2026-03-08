import axios from 'axios';

/**
 * Business API Test Script
 * Tests all business management endpoints
 */

const API_BASE_URL = 'http://localhost:3000/api/v1';

// Test owner ID (should exist in users table)
const testOwnerId = '42d7e5a7-c610-4bf4-9bcc-12ef98c34f2b';

// Will store created business ID
let createdBusinessId = null;

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[36m',
  magenta: '\x1b[35m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logSuccess(message) {
  log(`✅ ${message}`, 'green');
}

function logError(message) {
  log(`❌ ${message}`, 'red');
}

function logInfo(message) {
  log(`ℹ️  ${message}`, 'blue');
}

function logSection(message) {
  log(`\n${'='.repeat(60)}`, 'magenta');
  log(message, 'magenta');
  log('='.repeat(60), 'magenta');
}

async function testCreateBusiness() {
  try {
    logSection('Testing Create Business');

    const businessData = {
      ownerId: testOwnerId,
      businessName: 'Test Electronics Store',
      description: 'A test electronics store selling phones, laptops, and accessories',
      businessType: 'Electronics',
      phoneNumber: '+2348012345678',
      email: 'test@electronics.ng',
      whatsappPhoneNumberId: '123456789',
      whatsappAccessToken: 'test_token_123',
      settings: {
        businessHours: '9:00 AM - 6:00 PM',
        currency: 'NGN',
        deliveryAvailable: true
      }
    };

    const response = await axios.post(
      `${API_BASE_URL}/businesses`,
      businessData
    );

    logSuccess('Business created successfully');
    logInfo(`Status: ${response.status}`);

    const business = response.data.data;
    createdBusinessId = business.id;

    console.log('\n📊 CREATED BUSINESS:');
    console.log('─'.repeat(60));
    console.log(`  ID: ${business.id}`);
    console.log(`  Name: ${business.business_name}`);
    console.log(`  Business Type: ${business.business_type}`);
    console.log(`  Phone: ${business.phone_number}`);
    console.log(`  Email: ${business.email}`);
    console.log(`  Active: ${business.is_active}`);
    console.log('');

    return true;
  } catch (error) {
    logError(`Failed: ${error.response?.data?.error || error.message}`);
    return false;
  }
}

async function testGetBusinessById() {
  try {
    logSection('Testing Get Business by ID');

    if (!createdBusinessId) {
      logError('No business ID available. Create a business first.');
      return false;
    }

    const response = await axios.get(
      `${API_BASE_URL}/businesses/${createdBusinessId}`
    );

    logSuccess('Business retrieved successfully');
    logInfo(`Status: ${response.status}`);

    const business = response.data.data;

    console.log('\n📊 BUSINESS DETAILS:');
    console.log('─'.repeat(60));
    console.log(`  ID: ${business.id}`);
    console.log(`  Name: ${business.business_name}`);
    console.log(`  Description: ${business.description}`);
    console.log(`  Business Type: ${business.business_type}`);
    console.log(`  Owner: ${business.owner_name || 'N/A'}`);
    console.log(`  Owner Email: ${business.owner_email || 'N/A'}`);
    console.log(`  Owner Phone: ${business.owner_phone || 'N/A'}`);
    console.log(`  Phone: ${business.phone_number}`);
    console.log(`  Email: ${business.email}`);
    console.log(`  Active: ${business.is_active}`);
    console.log(`  Created: ${new Date(business.created_at).toLocaleDateString()}`);
    console.log('');

    return true;
  } catch (error) {
    logError(`Failed: ${error.response?.data?.error || error.message}`);
    return false;
  }
}

async function testGetBusinessesByOwner() {
  try {
    logSection('Testing Get Businesses by Owner');

    const response = await axios.get(
      `${API_BASE_URL}/businesses/owner/${testOwnerId}`
    );

    logSuccess('Businesses retrieved by owner');
    logInfo(`Status: ${response.status}`);
    logInfo(`Count: ${response.data.count}`);

    if (response.data.data.length > 0) {
      console.log('\n📊 OWNER BUSINESSES:');
      console.log('─'.repeat(60));

      response.data.data.forEach((business, index) => {
        console.log(`\n${index + 1}. ${business.business_name}`);
        console.log(`   Business Type: ${business.business_type}`);
        console.log(`   Phone: ${business.phone_number}`);
        console.log(`   Active: ${business.is_active}`);
        console.log(`   Created: ${new Date(business.created_at).toLocaleDateString()}`);
      });
    }

    console.log('');
    return true;
  } catch (error) {
    logError(`Failed: ${error.response?.data?.error || error.message}`);
    return false;
  }
}

async function testGetAllBusinesses() {
  try {
    logSection('Testing Get All Businesses');

    // Test with pagination
    const response = await axios.get(
      `${API_BASE_URL}/businesses`,
      {
        params: {
          limit: 10,
          offset: 0,
          isActive: true
        }
      }
    );

    logSuccess('All businesses retrieved');
    logInfo(`Status: ${response.status}`);
    logInfo(`Count: ${response.data.count}`);
    logInfo(`Total: ${response.data.total}`);

    if (response.data.data.length > 0) {
      console.log('\n📊 ALL BUSINESSES:');
      console.log('─'.repeat(60));

      response.data.data.slice(0, 5).forEach((business, index) => {
        console.log(`\n${index + 1}. ${business.business_name}`);
        console.log(`   Owner: ${business.owner_name || 'N/A'}`);
        console.log(`   Business Type: ${business.business_type}`);
        console.log(`   Products: ${business.product_count || 0}`);
        console.log(`   Orders: ${business.order_count || 0}`);
        console.log(`   Active: ${business.is_active}`);
      });
    }

    console.log('');
    return true;
  } catch (error) {
    logError(`Failed: ${error.response?.data?.error || error.message}`);
    return false;
  }
}

async function testUpdateBusiness() {
  try {
    logSection('Testing Update Business');

    if (!createdBusinessId) {
      logError('No business ID available. Create a business first.');
      return false;
    }

    const updates = {
      description: 'Updated description: Premium electronics store with nationwide delivery',
      phone_number: '+2348087654321',
      metadata: {
        businessHours: '8:00 AM - 8:00 PM',
        currency: 'NGN',
        deliveryAvailable: true,
        freeDeliveryThreshold: 50000
      }
    };

    const response = await axios.put(
      `${API_BASE_URL}/businesses/${createdBusinessId}`,
      updates
    );

    logSuccess('Business updated successfully');
    logInfo(`Status: ${response.status}`);

    const business = response.data.data;

    console.log('\n📊 UPDATED BUSINESS:');
    console.log('─'.repeat(60));
    console.log(`  Name: ${business.business_name}`);
    console.log(`  Description: ${business.description}`);
    console.log(`  Phone: ${business.phone_number}`);
    console.log(`  Updated: ${new Date(business.updated_at).toLocaleString()}`);
    console.log('');

    return true;
  } catch (error) {
    logError(`Failed: ${error.response?.data?.error || error.message}`);
    return false;
  }
}

async function testGetBusinessStatistics() {
  try {
    logSection('Testing Get Business Statistics');

    if (!createdBusinessId) {
      logError('No business ID available. Create a business first.');
      return false;
    }

    const response = await axios.get(
      `${API_BASE_URL}/businesses/${createdBusinessId}/statistics`
    );

    logSuccess('Business statistics retrieved');
    logInfo(`Status: ${response.status}`);

    const stats = response.data.data;

    console.log('\n📊 BUSINESS STATISTICS:');
    console.log('─'.repeat(60));

    if (stats.products) {
      console.log('\n📦 PRODUCTS:');
      console.log(`  Total: ${stats.products.total_products}`);
      console.log(`  Active: ${stats.products.active_products}`);
      console.log(`  Low Stock: ${stats.products.low_stock_products}`);
      console.log(`  Out of Stock: ${stats.products.out_of_stock_products}`);
    }

    if (stats.orders) {
      console.log('\n📦 ORDERS:');
      console.log(`  Total: ${stats.orders.total_orders}`);
      console.log(`  Delivered: ${stats.orders.delivered_orders}`);
      console.log(`  Cancelled: ${stats.orders.cancelled_orders}`);
      console.log(`  Paid: ${stats.orders.paid_orders}`);
      console.log(`  Total Revenue: ₦${parseFloat(stats.orders.total_revenue).toLocaleString()}`);
      console.log(`  Paid Revenue: ₦${parseFloat(stats.orders.paid_revenue).toLocaleString()}`);
    }

    if (stats.customers) {
      console.log('\n👥 CUSTOMERS:');
      console.log(`  Total: ${stats.customers.total_customers}`);
      console.log(`  Last 30 Days: ${stats.customers.customers_last_30_days}`);
    }

    if (stats.conversations) {
      console.log('\n💬 CONVERSATIONS:');
      console.log(`  Total: ${stats.conversations.total_conversations}`);
      console.log(`  Active: ${stats.conversations.active_conversations}`);
      console.log(`  Avg Messages: ${parseFloat(stats.conversations.avg_messages_per_conversation).toFixed(1)}`);
    }

    console.log('');
    return true;
  } catch (error) {
    logError(`Failed: ${error.response?.data?.error || error.message}`);
    return false;
  }
}

async function testUpdateBusinessSettings() {
  try {
    logSection('Testing Update Business Settings');

    if (!createdBusinessId) {
      logError('No business ID available. Create a business first.');
      return false;
    }

    const newSettings = {
      maxOrdersPerDay: 50,
      autoReplyEnabled: true,
      autoReplyMessage: 'Thank you for contacting us! We will respond shortly.'
    };

    const response = await axios.patch(
      `${API_BASE_URL}/businesses/${createdBusinessId}/settings`,
      newSettings
    );

    logSuccess('Business settings updated');
    logInfo(`Status: ${response.status}`);

    const business = response.data.data;

    console.log('\n📊 UPDATED SETTINGS:');
    console.log('─'.repeat(60));
    console.log(JSON.stringify(business.settings, null, 2));
    console.log('');

    return true;
  } catch (error) {
    logError(`Failed: ${error.response?.data?.error || error.message}`);
    return false;
  }
}

async function testSearchBusinesses() {
  try {
    logSection('Testing Search Businesses');

    const searchTerm = 'electronics';

    const response = await axios.get(
      `${API_BASE_URL}/businesses/search`,
      {
        params: {
          q: searchTerm,
          limit: 5
        }
      }
    );

    logSuccess('Business search completed');
    logInfo(`Status: ${response.status}`);
    logInfo(`Search term: "${searchTerm}"`);
    logInfo(`Results: ${response.data.count}`);

    if (response.data.data.length > 0) {
      console.log('\n🔍 SEARCH RESULTS:');
      console.log('─'.repeat(60));

      response.data.data.forEach((business, index) => {
        console.log(`\n${index + 1}. ${business.business_name}`);
        console.log(`   Owner: ${business.owner_name || 'N/A'}`);
        console.log(`   Business Type: ${business.business_type}`);
        console.log(`   Description: ${business.description?.substring(0, 80)}...`);
      });
    }

    console.log('');
    return true;
  } catch (error) {
    logError(`Failed: ${error.response?.data?.error || error.message}`);
    return false;
  }
}

async function testGetBusinessCategories() {
  try {
    logSection('Testing Get Business Categories');

    const response = await axios.get(
      `${API_BASE_URL}/businesses/categories`
    );

    logSuccess('Business categories retrieved');
    logInfo(`Status: ${response.status}`);
    logInfo(`Categories: ${response.data.count}`);

    if (response.data.data.length > 0) {
      console.log('\n📊 BUSINESS CATEGORIES:');
      console.log('─'.repeat(60));

      response.data.data.forEach((category, index) => {
        console.log(`${index + 1}. ${category.category}: ${category.count} businesses`);
      });
    }

    console.log('');
    return true;
  } catch (error) {
    logError(`Failed: ${error.response?.data?.error || error.message}`);
    return false;
  }
}

async function testDeleteBusiness() {
  try {
    logSection('Testing Delete Business (Soft Delete)');

    if (!createdBusinessId) {
      logError('No business ID available. Create a business first.');
      return false;
    }

    const response = await axios.delete(
      `${API_BASE_URL}/businesses/${createdBusinessId}`
    );

    logSuccess('Business deleted (soft delete)');
    logInfo(`Status: ${response.status}`);

    const business = response.data.data;

    console.log('\n📊 DELETED BUSINESS:');
    console.log('─'.repeat(60));
    console.log(`  ID: ${business.id}`);
    console.log(`  Name: ${business.business_name}`);
    console.log(`  Active: ${business.is_active}`);
    console.log(`  Updated: ${new Date(business.updated_at).toLocaleString()}`);
    console.log('');

    return true;
  } catch (error) {
    logError(`Failed: ${error.response?.data?.error || error.message}`);
    return false;
  }
}

// Main test runner
async function runAllTests() {
  log('\n🚀 Starting Business API Tests\n', 'blue');
  log(`Testing against: ${API_BASE_URL}`, 'blue');
  log(`Test Owner ID: ${testOwnerId}\n`, 'blue');

  const tests = [
    { name: 'Create Business', fn: testCreateBusiness },
    { name: 'Get Business by ID', fn: testGetBusinessById },
    { name: 'Get Businesses by Owner', fn: testGetBusinessesByOwner },
    { name: 'Get All Businesses', fn: testGetAllBusinesses },
    { name: 'Update Business', fn: testUpdateBusiness },
    { name: 'Get Business Statistics', fn: testGetBusinessStatistics },
    { name: 'Update Business Settings', fn: testUpdateBusinessSettings },
    { name: 'Search Businesses', fn: testSearchBusinesses },
    { name: 'Get Business Categories', fn: testGetBusinessCategories },
    { name: 'Delete Business', fn: testDeleteBusiness }
  ];

  let passed = 0;
  let failed = 0;

  for (const test of tests) {
    try {
      const result = await test.fn();
      if (result) {
        passed++;
      } else {
        failed++;
      }
    } catch (error) {
      logError(`${test.name} threw an error: ${error.message}`);
      failed++;
    }

    // Small delay between tests
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  // Summary
  logSection('Test Summary');
  log(`Total Tests: ${tests.length}`, 'blue');
  logSuccess(`Passed: ${passed}`);
  if (failed > 0) {
    logError(`Failed: ${failed}`);
  }
  log(`Success Rate: ${((passed / tests.length) * 100).toFixed(1)}%\n`, 'magenta');

  process.exit(failed > 0 ? 1 : 0);
}

// Run tests
runAllTests().catch(error => {
  logError(`Fatal error: ${error.message}`);
  process.exit(1);
});
