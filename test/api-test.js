/**
 * Simple API test script for Textbook Backend
 * Run with: node test/api-test.js
 * 
 * Make sure to:
 * 1. Have the server running (npm run dev)
 * 2. Configure your environment variables
 * 3. Set up the Supabase database with the schema
 */

const https = require('https');
const http = require('http');

// Configuration
const BASE_URL = process.env.TEST_BASE_URL || 'http://localhost:3000';
const TEST_USER = {
  userPhone: '+1234567890',
  userName: 'Test User',
  appointmentType: 'consultation',
  appointmentDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // Tomorrow
};

// Helper function to make HTTP requests
function makeRequest(options, data = null) {
  return new Promise((resolve, reject) => {
    const protocol = options.hostname === 'localhost' ? http : https;
    const req = protocol.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        try {
          const response = {
            statusCode: res.statusCode,
            headers: res.headers,
            body: res.headers['content-type']?.includes('application/json') 
              ? JSON.parse(body) 
              : body
          };
          resolve(response);
        } catch (error) {
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            body: body
          });
        }
      });
    });

    req.on('error', reject);

    if (data) {
      req.write(JSON.stringify(data));
    }

    req.end();
  });
}

// Test functions
async function testHealthCheck() {
  console.log('🔍 Testing health check endpoint...');
  
  const url = new URL('/health', BASE_URL);
  const options = {
    hostname: url.hostname,
    port: url.port,
    path: url.pathname,
    method: 'GET'
  };

  try {
    const response = await makeRequest(options);
    console.log(`✅ Health check: ${response.statusCode}`, response.body);
    return response.statusCode === 200;
  } catch (error) {
    console.error('❌ Health check failed:', error.message);
    return false;
  }
}

async function testCreateBooking() {
  console.log('🔍 Testing booking creation...');
  
  const url = new URL('/api/booking/create', BASE_URL);
  const options = {
    hostname: url.hostname,
    port: url.port,
    path: url.pathname,
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    }
  };

  try {
    const response = await makeRequest(options, TEST_USER);
    console.log(`✅ Create booking: ${response.statusCode}`, response.body);
    
    if (response.statusCode === 201 && response.body.success) {
      return {
        success: true,
        uuid: response.body.data.uuid,
        bookingId: response.body.data.bookingId,
        magicLink: response.body.data.magicLink
      };
    }
    
    return { success: false };
  } catch (error) {
    console.error('❌ Create booking failed:', error.message);
    return { success: false };
  }
}

async function testGetBooking(uuid) {
  console.log('🔍 Testing booking retrieval...');
  
  const url = new URL(`/api/booking/${uuid}`, BASE_URL);
  const options = {
    hostname: url.hostname,
    port: url.port,
    path: url.pathname,
    method: 'GET'
  };

  try {
    const response = await makeRequest(options);
    console.log(`✅ Get booking: ${response.statusCode}`, response.body);
    return response.statusCode === 200 && response.body.success;
  } catch (error) {
    console.error('❌ Get booking failed:', error.message);
    return false;
  }
}

async function testConfirmBooking(uuid) {
  console.log('🔍 Testing booking confirmation...');
  
  const url = new URL(`/api/booking/confirm/${uuid}`, BASE_URL);
  const options = {
    hostname: url.hostname,
    port: url.port,
    path: url.pathname,
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    }
  };

  try {
    const response = await makeRequest(options);
    console.log(`✅ Confirm booking: ${response.statusCode}`, response.body);
    return response.statusCode === 200 && response.body.success;
  } catch (error) {
    console.error('❌ Confirm booking failed:', error.message);
    return false;
  }
}

async function testMagicLinkPreview(uuid) {
  console.log('🔍 Testing magic link preview...');
  
  const url = new URL(`/appt/${uuid}/preview`, BASE_URL);
  const options = {
    hostname: url.hostname,
    port: url.port,
    path: url.pathname,
    method: 'GET'
  };

  try {
    const response = await makeRequest(options);
    console.log(`✅ Magic link preview: ${response.statusCode}`, response.body);
    return response.statusCode === 200 && response.body.success;
  } catch (error) {
    console.error('❌ Magic link preview failed:', error.message);
    return false;
  }
}

async function testPaymentUpdate(uuid) {
  console.log('🔍 Testing payment status update...');
  
  const url = new URL(`/api/booking/payment/${uuid}`, BASE_URL);
  const options = {
    hostname: url.hostname,
    port: url.port,
    path: url.pathname,
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json'
    }
  };

  const paymentData = {
    paymentStatus: 'completed',
    paymentId: 'test_payment_123',
    amount: 99.99,
    currency: 'USD'
  };

  try {
    const response = await makeRequest(options, paymentData);
    console.log(`✅ Update payment: ${response.statusCode}`, response.body);
    return response.statusCode === 200 && response.body.success;
  } catch (error) {
    console.error('❌ Update payment failed:', error.message);
    return false;
  }
}

// Main test runner
async function runTests() {
  console.log('🚀 Starting Textbook Backend API Tests\n');
  console.log(`Testing against: ${BASE_URL}\n`);

  const results = {
    passed: 0,
    failed: 0,
    total: 0
  };

  // Test 1: Health Check
  results.total++;
  if (await testHealthCheck()) {
    results.passed++;
  } else {
    results.failed++;
  }
  console.log('');

  // Test 2: Create Booking
  results.total++;
  const bookingResult = await testCreateBooking();
  if (bookingResult.success) {
    results.passed++;
  } else {
    results.failed++;
    console.log('⚠️  Skipping remaining tests due to booking creation failure\n');
    console.log(`📊 Test Results: ${results.passed}/${results.total} passed\n`);
    return;
  }
  console.log('');

  const { uuid, bookingId } = bookingResult;
  console.log(`📝 Created booking: ${bookingId} (UUID: ${uuid})\n`);

  // Test 3: Get Booking
  results.total++;
  if (await testGetBooking(uuid)) {
    results.passed++;
  } else {
    results.failed++;
  }
  console.log('');

  // Test 4: Confirm Booking
  results.total++;
  if (await testConfirmBooking(uuid)) {
    results.passed++;
  } else {
    results.failed++;
  }
  console.log('');

  // Test 5: Magic Link Preview
  results.total++;
  if (await testMagicLinkPreview(uuid)) {
    results.passed++;
  } else {
    results.failed++;
  }
  console.log('');

  // Test 6: Payment Update
  results.total++;
  if (await testPaymentUpdate(uuid)) {
    results.passed++;
  } else {
    results.failed++;
  }
  console.log('');

  // Results summary
  console.log('📊 Test Results Summary:');
  console.log(`✅ Passed: ${results.passed}`);
  console.log(`❌ Failed: ${results.failed}`);
  console.log(`📝 Total:  ${results.total}`);
  console.log(`📈 Success Rate: ${Math.round((results.passed / results.total) * 100)}%\n`);

  if (results.failed === 0) {
    console.log('🎉 All tests passed! The API is working correctly.');
  } else {
    console.log('⚠️  Some tests failed. Check the error messages above.');
  }

  console.log('\n🔗 Magic Link Test:');
  console.log(`You can manually test the magic link redirect by visiting:`);
  console.log(`${BASE_URL}/appt/${uuid}`);
  console.log(`This should redirect to the frontend with the booking ID.`);
}

// Run the tests
if (require.main === module) {
  runTests().catch(error => {
    console.error('❌ Test runner failed:', error);
    process.exit(1);
  });
}

module.exports = { runTests }; 