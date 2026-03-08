/**
 * Test WhatsApp Message - Simulates incoming WhatsApp message
 *
 * Usage: node test-whatsapp-message.js "Your message here"
 */

import axios from 'axios';

const API_URL = 'http://localhost:3000';

// Sample WhatsApp webhook payload
const createWebhookPayload = (message) => ({
  object: 'whatsapp_business_account',
  entry: [{
    id: 'WHATSAPP_BUSINESS_ACCOUNT_ID',
    changes: [{
      value: {
        messaging_product: 'whatsapp',
        metadata: {
          display_phone_number: '15550000000',
          phone_number_id: 'TEST_PHONE_NUMBER_ID'
        },
        contacts: [{
          profile: {
            name: 'Test Customer'
          },
          wa_id: '2348012345678'
        }],
        messages: [{
          from: '+2348012345678',
          id: `wamid.test_${Date.now()}`,
          timestamp: Math.floor(Date.now() / 1000).toString(),
          text: {
            body: message
          },
          type: 'text'
        }]
      },
      field: 'messages'
    }]
  }]
});

async function testMessage(message) {
  try {
    console.log('\n🚀 Sending test message to WhatsApp webhook...');
    console.log(`📱 Message: "${message}"\n`);

    const payload = createWebhookPayload(message);

    const response = await axios.post(
      `${API_URL}/api/v1/webhooks/whatsapp`,
      payload,
      {
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );

    console.log('✅ Webhook response:', response.status, response.data);
    console.log('\n💡 Check your server logs to see the AI response!\n');
    console.log('🔍 Run this to see database messages:');
    console.log('   docker exec wazassist-db psql -U wazassist_admin -d wazassist -c "SELECT * FROM messages ORDER BY created_at DESC LIMIT 5;"\n');

  } catch (error) {
    console.error('❌ Error sending test message:');
    console.error(error.response?.data || error.message);
    process.exit(1);
  }
}

// Get message from command line or use default
const testMessages = [
  "Hello, I want to know about your products",
  "Wetin be the price for your shoes?",
  "I wan buy something",
  "How much na this product?",
  "Good morning, do you have Nike shoes?"
];

const message = process.argv[2] || testMessages[Math.floor(Math.random() * testMessages.length)];

testMessage(message);
