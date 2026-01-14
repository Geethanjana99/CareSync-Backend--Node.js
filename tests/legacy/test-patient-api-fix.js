const axios = require('axios');

const BASE_URL = 'http://localhost:5000/api';

// Test patient health prediction endpoints
async function testPatientEndpoints() {
  console.log('🧪 Testing Patient Health Prediction API Endpoints...\n');

  try {
    // First, let's try to login as a patient to get a token
    console.log('1. Testing patient login...');
    const loginResponse = await axios.post(`${BASE_URL}/auth/login`, {
      email: 'patient@test.com', // Assuming this patient exists
      password: 'password123'
    });
    
    const token = loginResponse.data.token;
    console.log('✅ Patient login successful');

    const headers = {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };

    // Test getting health submissions
    console.log('\n2. Testing GET /api/patient/health-predictions...');
    const healthSubmissionsResponse = await axios.get(`${BASE_URL}/patient/health-predictions`, { headers });
    console.log('✅ Health submissions retrieved successfully');
    console.log(`   Found ${healthSubmissionsResponse.data.data?.length || 0} submissions`);

    // Test health dashboard
    console.log('\n3. Testing GET /api/patient/health-predictions/dashboard...');
    const dashboardResponse = await axios.get(`${BASE_URL}/patient/health-predictions/dashboard`, { headers });
    console.log('✅ Health dashboard retrieved successfully');
    console.log(`   Dashboard stats: ${JSON.stringify(dashboardResponse.data.data.stats, null, 2)}`);

    console.log('\n🎉 All patient API endpoints are working correctly!');
    console.log('✅ The 500 Internal Server Error has been resolved.');

  } catch (error) {
    console.error('\n❌ Test failed:');
    if (error.response) {
      console.error(`   Status: ${error.response.status}`);
      console.error(`   Message: ${error.response.data?.message || error.response.statusText}`);
      if (error.response.data?.error) {
        console.error(`   Error Details: ${error.response.data.error}`);
      }
    } else {
      console.error(`   ${error.message}`);
    }
  }
}

// Run the test
testPatientEndpoints();