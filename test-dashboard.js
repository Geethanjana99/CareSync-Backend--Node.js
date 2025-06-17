const axios = require('axios');
const jwt = require('jsonwebtoken');

const BASE_URL = 'http://localhost:5000/api';

// Test data - using the doctor created by comprehensiveSystemTest.js
const TEST_DOCTOR_EMAIL = 'test.doctor@clinicalapp.com';
const TEST_DOCTOR_PASSWORD = 'testdoctor123';

async function testDoctorDashboard() {
  try {
    console.log('🧪 Testing Doctor Dashboard API endpoints...\n');

    // Step 1: Login as doctor to get authentication token
    console.log('1. Authenticating as doctor...');
    const loginResponse = await axios.post(`${BASE_URL}/auth/login`, {
      email: TEST_DOCTOR_EMAIL,
      password: TEST_DOCTOR_PASSWORD
    });

    if (!loginResponse.data.success) {
      console.error('❌ Login failed:', loginResponse.data.message);
      return;
    }    const token = loginResponse.data.data.token;
    console.log('✅ Doctor authenticated successfully');
    
    // Decode the JWT token to see what's stored
    console.log('\n🔍 Decoding JWT token to check user data...');
    const decoded = jwt.decode(token);
    console.log('Token payload:', JSON.stringify(decoded, null, 2));

    // Set up headers for authenticated requests
    const authHeaders = {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };

    // Step 2: Test doctor dashboard endpoint
    console.log('\n2. Testing doctor dashboard endpoint...');
    try {
      const dashboardResponse = await axios.get(`${BASE_URL}/doctors/dashboard`, {
        headers: authHeaders
      });

      if (dashboardResponse.data.success) {
        console.log('✅ Doctor dashboard API working!');
        console.log('📊 Dashboard data structure:');
        console.log(JSON.stringify(dashboardResponse.data.data, null, 2));
      } else {
        console.error('❌ Dashboard API returned error:', dashboardResponse.data.message);
      }
    } catch (error) {
      console.error('❌ Dashboard API request failed:', error.response?.data || error.message);
    }

    // Step 3: Test appointment action endpoint (if we have appointments)
    console.log('\n3. Testing appointment action endpoint...');
    try {
      // First get appointments to find a test appointment ID
      const appointmentsResponse = await axios.get(`${BASE_URL}/appointments`, {
        headers: authHeaders
      });

      if (appointmentsResponse.data.success && appointmentsResponse.data.appointments?.length > 0) {
        const testAppointmentId = appointmentsResponse.data.appointments[0].id;
        console.log(`Testing with appointment ID: ${testAppointmentId}`);

        // Test start appointment action
        const actionResponse = await axios.patch(`${BASE_URL}/doctors/appointments/${testAppointmentId}/action`, {
          action: 'start'
        }, {
          headers: authHeaders
        });

        if (actionResponse.data.success) {
          console.log('✅ Appointment action API working!');
          console.log('📝 Action response:', actionResponse.data.message);
        } else {
          console.error('❌ Appointment action failed:', actionResponse.data.message);
        }
      } else {
        console.log('ℹ️ No appointments found to test action endpoint');
      }
    } catch (error) {
      console.error('❌ Appointment action API request failed:', error.response?.data || error.message);
    }

  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
  }
}

// Run the test
testDoctorDashboard();
