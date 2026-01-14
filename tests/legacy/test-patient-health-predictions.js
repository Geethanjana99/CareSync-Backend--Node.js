const axios = require('axios');

// Test configuration
const API_BASE_URL = 'http://localhost:5000/api';
const TEST_USER = {
  email: 'patient@example.com',
  password: 'password123'
};

let authToken = '';

// Test patient health prediction endpoints
async function testPatientHealthPredictions() {
  try {
    console.log('🧪 Testing Patient Health Prediction System...\n');

    // Step 1: Login as patient
    console.log('1. Testing patient login...');
    try {
      const loginResponse = await axios.post(`${API_BASE_URL}/auth/login`, TEST_USER);
      
      if (loginResponse.data.success && loginResponse.data.data.user.role === 'patient') {
        authToken = loginResponse.data.data.token;
        console.log('✅ Patient login successful');
        console.log(`   Patient: ${loginResponse.data.data.user.name}`);
        console.log(`   Role: ${loginResponse.data.data.user.role}`);
      } else {
        console.log('❌ Login failed or user is not a patient');
        return;
      }
    } catch (error) {
      console.log('❌ Login failed:', error.response?.data?.message || error.message);
      return;
    }

    // Set up auth headers
    const authHeaders = {
      'Authorization': `Bearer ${authToken}`,
      'Content-Type': 'application/json'
    };

    // Step 2: Test dashboard endpoint
    console.log('\n2. Testing health dashboard...');
    try {
      const dashboardResponse = await axios.get(
        `${API_BASE_URL}/patient/health-predictions/dashboard`,
        { headers: authHeaders }
      );
      
      if (dashboardResponse.data.success) {
        console.log('✅ Dashboard loaded successfully');
        console.log(`   Total predictions: ${dashboardResponse.data.data.statistics.totalPredictions}`);
        console.log(`   Completed: ${dashboardResponse.data.data.statistics.completedPredictions}`);
      } else {
        console.log('❌ Dashboard failed:', dashboardResponse.data.message);
      }
    } catch (error) {
      console.log('❌ Dashboard failed:', error.response?.data?.message || error.message);
    }

    // Step 3: Test prediction creation
    console.log('\n3. Testing prediction creation...');
    const predictionData = {
      pregnancies: 2,
      glucose: 140,
      bmi: 28.5,
      age: 35,
      insulin: 100,
      notes: 'Test prediction from automated test'
    };

    try {
      const createResponse = await axios.post(
        `${API_BASE_URL}/patient/health-predictions`,
        predictionData,
        { headers: authHeaders }
      );
      
      if (createResponse.data.success) {
        console.log('✅ Prediction created successfully');
        console.log(`   Prediction ID: ${createResponse.data.data.prediction.id}`);
        console.log(`   Status: ${createResponse.data.data.prediction.status}`);
        
        if (createResponse.data.data.summary) {
          console.log(`   Risk Level: ${createResponse.data.data.summary.riskLevel}`);
          console.log(`   Probability: ${createResponse.data.data.summary.probability}`);
        }
      } else {
        console.log('❌ Prediction creation failed:', createResponse.data.message);
      }
    } catch (error) {
      console.log('❌ Prediction creation failed:', error.response?.data?.message || error.message);
      if (error.response?.data?.errors) {
        console.log('   Validation errors:', error.response.data.errors);
      }
    }

    // Step 4: Test prediction list
    console.log('\n4. Testing prediction list...');
    try {
      const listResponse = await axios.get(
        `${API_BASE_URL}/patient/health-predictions?page=1&limit=5`,
        { headers: authHeaders }
      );
      
      if (listResponse.data.success) {
        console.log('✅ Prediction list loaded successfully');
        console.log(`   Found ${listResponse.data.data.predictions.length} predictions`);
        
        if (listResponse.data.data.predictions.length > 0) {
          const latest = listResponse.data.data.predictions[0];
          console.log(`   Latest prediction: ${latest.id} (${latest.status})`);
        }
      } else {
        console.log('❌ Prediction list failed:', listResponse.data.message);
      }
    } catch (error) {
      console.log('❌ Prediction list failed:', error.response?.data?.message || error.message);
    }

    // Step 5: Test unauthorized access (should fail)
    console.log('\n5. Testing unauthorized access...');
    try {
      const unauthorizedResponse = await axios.get(
        `${API_BASE_URL}/patient/health-predictions/dashboard`
        // No auth headers
      );
      console.log('❌ Unauthorized access succeeded (this should not happen!)');
    } catch (error) {
      if (error.response?.status === 401) {
        console.log('✅ Unauthorized access properly blocked');
      } else {
        console.log('❌ Unexpected error:', error.response?.data?.message || error.message);
      }
    }

    console.log('\n🎉 Patient Health Prediction System test completed!');

  } catch (error) {
    console.error('❌ Test failed with error:', error.message);
  }
}

// Run the test
if (require.main === module) {
  testPatientHealthPredictions();
}

module.exports = { testPatientHealthPredictions };
