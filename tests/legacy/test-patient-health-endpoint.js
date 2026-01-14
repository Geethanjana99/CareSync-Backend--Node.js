const axios = require('axios');

const API_BASE = 'http://localhost:5000/api';

// Test data
const testHealthData = {
  pregnancies: 2,
  glucose: 120,
  bmi: 25.5,
  age: 30,
  insulin: 85,
  notes: 'Test submission from patient'
};

async function testPatientHealthEndpoint() {
  try {
    console.log('🧪 Testing Patient Health Data Submission Endpoint...\n');
    
    // First, let's test without authentication (should fail)
    console.log('1. Testing without authentication...');
    try {
      await axios.get(`${API_BASE}/patient/health-predictions`);
      console.log('❌ Should have failed without auth');
    } catch (error) {
      if (error.response?.status === 401) {
        console.log('✅ Correctly rejected request without authentication');
      } else {
        console.log('❌ Unexpected error:', error.response?.data || error.message);
      }
    }

    // Test with a sample patient token (you'll need to get a real token)
    console.log('\n2. To test with authentication, you need a valid patient JWT token.');
    console.log('Log in as a patient in the frontend first, then get the token from localStorage.');
    
    // Test the dashboard endpoint structure
    console.log('\n3. Testing dashboard endpoint structure (without auth)...');
    try {
      await axios.get(`${API_BASE}/patient/health-predictions/dashboard`);
    } catch (error) {
      if (error.response?.status === 401) {
        console.log('✅ Dashboard endpoint correctly requires authentication');
      } else {
        console.log('❌ Unexpected error:', error.response?.data || error.message);
      }
    }

    console.log('\n✅ Basic endpoint structure tests completed!');
    console.log('\n📝 Next steps:');
    console.log('1. Log in as a patient in the frontend (http://localhost:5173)');
    console.log('2. Navigate to Health Predictions page');
    console.log('3. Try submitting health data');
    console.log('4. Check if the data appears in the database');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Run the test
testPatientHealthEndpoint();
