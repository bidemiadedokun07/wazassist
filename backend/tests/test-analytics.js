import axios from 'axios';

/**
 * Analytics API Test Script
 * Tests all analytics endpoints
 */

const API_BASE_URL = 'http://localhost:3000/api/v1';

// Test business ID (will be created if doesn't exist)
let testBusinessId = 'c2c75837-2976-4013-a55f-114c0ecbc38e';

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

async function testDashboardOverview() {
  try {
    logSection('Testing Dashboard Overview');

    const response = await axios.get(
      `${API_BASE_URL}/analytics/business/${testBusinessId}/dashboard`
    );

    logSuccess('Dashboard overview retrieved');
    logInfo(`Status: ${response.status}`);

    const data = response.data.data;

    // Display key metrics
    console.log('\n📊 DASHBOARD METRICS:');
    console.log('─'.repeat(60));

    if (data.orders) {
      console.log('\n📦 ORDERS:');
      console.log(`  Total Orders: ${data.orders.total_orders}`);
      console.log(`  Pending: ${data.orders.pending}`);
      console.log(`  Confirmed: ${data.orders.confirmed}`);
      console.log(`  Processing: ${data.orders.processing}`);
      console.log(`  Delivered: ${data.orders.delivered}`);
      console.log(`  Cancelled: ${data.orders.cancelled}`);
      console.log(`  Average Order Value: ₦${parseFloat(data.orders.average_order_value).toLocaleString()}`);
    }

    if (data.revenue) {
      console.log('\n💰 REVENUE:');
      console.log(`  Total Revenue: ₦${parseFloat(data.revenue.total_revenue).toLocaleString()}`);
      console.log(`  Paid Revenue: ₦${parseFloat(data.revenue.paid_revenue).toLocaleString()}`);
      console.log(`  Pending Revenue: ₦${parseFloat(data.revenue.pending_revenue).toLocaleString()}`);
      console.log(`  Total Tax: ₦${parseFloat(data.revenue.total_tax).toLocaleString()}`);
    }

    if (data.customers) {
      console.log('\n👥 CUSTOMERS:');
      console.log(`  Total Customers: ${data.customers.total_customers}`);
      console.log(`  New Customers: ${data.customers.new_customers}`);
      console.log(`  Returning Customers: ${data.customers.returning_customers}`);
    }

    if (data.conversations) {
      console.log('\n💬 CONVERSATIONS:');
      console.log(`  Total Conversations: ${data.conversations.total_conversations}`);
      console.log(`  Active: ${data.conversations.active}`);
      console.log(`  Resolved: ${data.conversations.resolved}`);
      console.log(`  Total Messages: ${data.conversations.total_messages}`);
      console.log(`  AI Processed: ${data.conversations.ai_processed}`);
    }

    if (data.products) {
      console.log('\n📦 PRODUCTS:');
      console.log(`  Total Products: ${data.products.total_products}`);
      console.log(`  Active Products: ${data.products.active_products}`);
      console.log(`  Low Stock: ${data.products.low_stock_products}`);
      console.log(`  Out of Stock: ${data.products.out_of_stock_products}`);
    }

    console.log('\n');
    return true;
  } catch (error) {
    logError(`Failed: ${error.response?.data?.error || error.message}`);
    return false;
  }
}

async function testSalesTrends() {
  try {
    logSection('Testing Sales Trends');

    // Test different intervals
    const intervals = ['day', 'week', 'month'];

    for (const interval of intervals) {
      logInfo(`Testing interval: ${interval}`);

      const response = await axios.get(
        `${API_BASE_URL}/analytics/business/${testBusinessId}/sales-trends`,
        { params: { interval, limit: 10 } }
      );

      logSuccess(`Sales trends retrieved (${interval})`);
      logInfo(`Status: ${response.status}`);
      logInfo(`Data points: ${response.data.count}`);

      if (response.data.data.length > 0) {
        const latest = response.data.data[0];
        console.log(`  Latest ${interval}:`);
        console.log(`    Period: ${latest.period}`);
        console.log(`    Orders: ${latest.order_count}`);
        console.log(`    Revenue: ₦${parseFloat(latest.total_revenue).toLocaleString()}`);
        console.log(`    Avg Order: ₦${parseFloat(latest.avg_order_value).toLocaleString()}`);
        console.log(`    Unique Customers: ${latest.unique_customers}`);
      }
      console.log('');
    }

    return true;
  } catch (error) {
    logError(`Failed: ${error.response?.data?.error || error.message}`);
    return false;
  }
}

async function testCustomerInsights() {
  try {
    logSection('Testing Customer Insights');

    const response = await axios.get(
      `${API_BASE_URL}/analytics/business/${testBusinessId}/customers`,
      { params: { limit: 5 } }
    );

    logSuccess('Customer insights retrieved');
    logInfo(`Status: ${response.status}`);

    const data = response.data.data;

    // Top customers
    if (data.top_customers && data.top_customers.length > 0) {
      console.log('\n🏆 TOP CUSTOMERS:');
      console.log('─'.repeat(60));
      data.top_customers.forEach((customer, index) => {
        console.log(`\n${index + 1}. ${customer.name}`);
        console.log(`   Phone: ${customer.phone_number}`);
        console.log(`   Orders: ${customer.order_count}`);
        console.log(`   Total Spent: ₦${parseFloat(customer.total_spent).toLocaleString()}`);
        console.log(`   Avg Order: ₦${parseFloat(customer.avg_order_value).toLocaleString()}`);
        console.log(`   Last Order: ${new Date(customer.last_order_date).toLocaleDateString()}`);
      });
    }

    // Customer segments
    if (data.customer_segments && data.customer_segments.length > 0) {
      console.log('\n\n📊 CUSTOMER SEGMENTS:');
      console.log('─'.repeat(60));
      data.customer_segments.forEach(segment => {
        console.log(`\n${segment.customer_type.toUpperCase()}:`);
        console.log(`  Count: ${segment.count}`);
        console.log(`  Avg Lifetime Value: ₦${parseFloat(segment.avg_lifetime_value).toLocaleString()}`);
      });
    }

    console.log('\n');
    return true;
  } catch (error) {
    logError(`Failed: ${error.response?.data?.error || error.message}`);
    return false;
  }
}

async function testProductPerformance() {
  try {
    logSection('Testing Product Performance');

    const response = await axios.get(
      `${API_BASE_URL}/analytics/business/${testBusinessId}/products`,
      { params: { limit: 10 } }
    );

    logSuccess('Product performance retrieved');
    logInfo(`Status: ${response.status}`);
    logInfo(`Products: ${response.data.count}`);

    if (response.data.data.length > 0) {
      console.log('\n📦 TOP PRODUCTS:');
      console.log('─'.repeat(60));

      response.data.data.slice(0, 5).forEach((product, index) => {
        console.log(`\n${index + 1}. ${product.name}`);
        console.log(`   Category: ${product.category}`);
        console.log(`   Price: ₦${parseFloat(product.price).toLocaleString()}`);
        console.log(`   Stock: ${product.quantity_in_stock}`);
        console.log(`   Total Sold: ${product.total_sold}`);
        console.log(`   Revenue: ₦${parseFloat(product.total_revenue).toLocaleString()}`);
        console.log(`   Unique Buyers: ${product.unique_buyers}`);
        console.log(`   Avg Qty/Order: ${parseFloat(product.avg_quantity_per_order).toFixed(2)}`);
      });
    }

    console.log('\n');
    return true;
  } catch (error) {
    logError(`Failed: ${error.response?.data?.error || error.message}`);
    return false;
  }
}

async function testResponseTimes() {
  try {
    logSection('Testing Conversation Response Times');

    const response = await axios.get(
      `${API_BASE_URL}/analytics/business/${testBusinessId}/response-times`
    );

    logSuccess('Response times retrieved');
    logInfo(`Status: ${response.status}`);

    const data = response.data.data;

    console.log('\n⏱️  RESPONSE TIME METRICS:');
    console.log('─'.repeat(60));
    console.log(`  Total Responses: ${data.total_responses}`);
    console.log(`  Avg Response Time: ${parseFloat(data.avg_response_time_minutes).toFixed(2)} minutes`);
    console.log(`  Median Response Time: ${parseFloat(data.median_response_time_minutes).toFixed(2)} minutes`);
    console.log(`\n  Response Time Distribution:`);
    console.log(`    Within 1 minute: ${data.within_1_minute} (${((data.within_1_minute / data.total_responses) * 100).toFixed(1)}%)`);
    console.log(`    Within 5 minutes: ${data.within_5_minutes} (${((data.within_5_minutes / data.total_responses) * 100).toFixed(1)}%)`);
    console.log(`    Within 1 hour: ${data.within_1_hour} (${((data.within_1_hour / data.total_responses) * 100).toFixed(1)}%)`);

    console.log('\n');
    return true;
  } catch (error) {
    logError(`Failed: ${error.response?.data?.error || error.message}`);
    return false;
  }
}

async function testAIUsageStats() {
  try {
    logSection('Testing AI Usage Statistics');

    const response = await axios.get(
      `${API_BASE_URL}/analytics/business/${testBusinessId}/ai-usage`
    );

    logSuccess('AI usage stats retrieved');
    logInfo(`Status: ${response.status}`);

    const data = response.data.data;

    console.log('\n🤖 AI USAGE METRICS:');
    console.log('─'.repeat(60));
    console.log(`  Total Messages: ${data.total_messages}`);
    console.log(`  AI Processed: ${data.ai_processed_messages}`);
    console.log(`  Processing Rate: ${((data.ai_processed_messages / data.total_messages) * 100).toFixed(1)}%`);
    console.log(`  Total Tokens Used: ${data.total_tokens_used}`);
    console.log(`  Avg Tokens/Message: ${parseFloat(data.avg_tokens_per_message).toFixed(2)}`);
    console.log(`  Models Used: ${data.models_used}`);

    console.log('\n');
    return true;
  } catch (error) {
    logError(`Failed: ${error.response?.data?.error || error.message}`);
    return false;
  }
}

async function testCategoryPerformance() {
  try {
    logSection('Testing Category Performance');

    const response = await axios.get(
      `${API_BASE_URL}/analytics/business/${testBusinessId}/categories`
    );

    logSuccess('Category performance retrieved');
    logInfo(`Status: ${response.status}`);
    logInfo(`Categories: ${response.data.count}`);

    if (response.data.data.length > 0) {
      console.log('\n📊 CATEGORY PERFORMANCE:');
      console.log('─'.repeat(60));

      response.data.data.forEach((category, index) => {
        console.log(`\n${index + 1}. ${category.category}`);
        console.log(`   Products: ${category.product_count}`);
        console.log(`   Units Sold: ${category.total_units_sold}`);
        console.log(`   Revenue: ₦${parseFloat(category.total_revenue).toLocaleString()}`);
        console.log(`   Avg Price: ₦${parseFloat(category.avg_price).toLocaleString()}`);
      });
    }

    console.log('\n');
    return true;
  } catch (error) {
    logError(`Failed: ${error.response?.data?.error || error.message}`);
    return false;
  }
}

async function testDateFilters() {
  try {
    logSection('Testing Date Range Filters');

    // Test with date range
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 30); // Last 30 days

    logInfo(`Date range: ${startDate.toISOString().split('T')[0]} to ${endDate.toISOString().split('T')[0]}`);

    const response = await axios.get(
      `${API_BASE_URL}/analytics/business/${testBusinessId}/dashboard`,
      {
        params: {
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString()
        }
      }
    );

    logSuccess('Dashboard with date filters retrieved');
    logInfo(`Status: ${response.status}`);

    const data = response.data.data;
    console.log(`  Orders in period: ${data.orders.total_orders}`);
    console.log(`  Revenue in period: ₦${parseFloat(data.revenue.total_revenue).toLocaleString()}`);

    console.log('\n');
    return true;
  } catch (error) {
    logError(`Failed: ${error.response?.data?.error || error.message}`);
    return false;
  }
}

// Main test runner
async function runAllTests() {
  log('\n🚀 Starting Analytics API Tests\n', 'blue');
  log(`Testing against: ${API_BASE_URL}`, 'blue');
  log(`Business ID: ${testBusinessId}\n`, 'blue');

  const tests = [
    { name: 'Dashboard Overview', fn: testDashboardOverview },
    { name: 'Sales Trends', fn: testSalesTrends },
    { name: 'Customer Insights', fn: testCustomerInsights },
    { name: 'Product Performance', fn: testProductPerformance },
    { name: 'Response Times', fn: testResponseTimes },
    { name: 'AI Usage Stats', fn: testAIUsageStats },
    { name: 'Category Performance', fn: testCategoryPerformance },
    { name: 'Date Filters', fn: testDateFilters }
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
