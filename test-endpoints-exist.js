const axios = require('axios');

// Test the endpoints directly by checking if they exist (should get 401 Unauthorized if endpoints exist)
async function testEndpointsExist() {
  const baseURL = 'http://localhost:5000/api/doctor';
  
  try {
    console.log('🧪 Testing if endpoints exist (should get 401 Unauthorized)...');
    
    // Test 1: Availability status endpoint
    try {
      await axios.put(`${baseURL}/availability/status`, { status: 'available' });
    } catch (error) {
      if (error.response?.status === 401) {
        console.log('✅ /availability/status endpoint exists (401 Unauthorized as expected)');
      } else if (error.response?.status === 404) {
        console.log('❌ /availability/status endpoint NOT FOUND (404)');
      } else {
        console.log(`⚠️ /availability/status unexpected status: ${error.response?.status}`);
      }
    }

    // Test 2: Queue toggle endpoint
    try {
      await axios.put(`${baseURL}/queue/toggle`, {});
    } catch (error) {
      if (error.response?.status === 401) {
        console.log('✅ /queue/toggle endpoint exists (401 Unauthorized as expected)');
      } else if (error.response?.status === 404) {
        console.log('❌ /queue/toggle endpoint NOT FOUND (404)');
      } else {
        console.log(`⚠️ /queue/toggle unexpected status: ${error.response?.status}`);
      }
    }

    console.log('\n📋 Endpoint test complete. Both endpoints should exist and return 401.');
    
  } catch (error) {
    console.error('❌ Unexpected error:', error.message);
  }
}

testEndpointsExist();
