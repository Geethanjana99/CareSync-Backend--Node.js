const axios = require('axios');

const BASE_URL = 'http://localhost:5000/api';

// Function to test patient endpoints
async function testPatientEndpoints() {
  console.log('🏥 Testing Patient Endpoints...');
  
  try {
    // Try to login with the created patient
    console.log('🔐 Testing login with patient.test.new@example.com...');
    const loginResponse = await axios.post(`${BASE_URL}/auth/login`, {
      email: 'patient.test.new@example.com',
      password: 'Password123!'
    });
      console.log('✅ Login successful');
    console.log('   Response status:', loginResponse.status);
    console.log('   Success:', loginResponse.data.success);
    console.log('   Token received:', loginResponse.data.data?.token ? 'Yes' : 'No');
    console.log('   User:', loginResponse.data.data?.user?.name);
    console.log('   Role:', loginResponse.data.data?.user?.role);
    
    const token = loginResponse.data.data?.token;
    const headers = { Authorization: `Bearer ${token}` };
      // Test profile endpoint
    console.log('👤 Testing profile endpoint...');
    try {
      const profileResponse = await axios.get(`${BASE_URL}/auth/profile`, { headers });
      console.log('✅ Profile endpoint successful');
      console.log('   Full response:', JSON.stringify(profileResponse.data, null, 2));
    } catch (profileError) {
      console.log('❌ Profile endpoint failed:', profileError.response?.status);
      console.log('   Error message:', profileError.response?.data?.message || profileError.message);
      if (profileError.response?.status >= 400) {
        console.log('   Full response:', JSON.stringify(profileError.response.data, null, 2));
      }
    }
    
    // Test doctor search endpoint
    console.log('🔍 Testing doctor search endpoint...');
    try {
      const searchResponse = await axios.get(`${BASE_URL}/patients/doctors/search`, { headers });
      console.log('✅ Doctor search successful');
      console.log('   Found', searchResponse.data.doctors?.length || 0, 'doctors');
      if (searchResponse.data.doctors?.length > 0) {
        console.log('   Sample doctor:', searchResponse.data.doctors[0].name, '-', searchResponse.data.doctors[0].specialty);
      }
    } catch (searchError) {
      console.log('❌ Doctor search failed:', searchError.response?.status);
      console.log('   Error message:', searchError.response?.data?.message || searchError.message);
      if (searchError.response?.status >= 400) {
        console.log('   Full response:', JSON.stringify(searchError.response.data, null, 2));
      }
    }
    
  } catch (loginError) {
    console.log('❌ Login failed:', loginError.response?.status);
    console.log('   Error message:', loginError.response?.data?.message || loginError.message);
  }
}

// Run the test
testPatientEndpoints()
  .then(() => console.log('🎉 Test completed'))
  .catch(error => console.error('❌ Test failed:', error.message));
