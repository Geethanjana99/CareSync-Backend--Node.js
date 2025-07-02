const axios = require('axios');

const BASE_URL = 'http://localhost:5000/api';

// Function to test specific auth and endpoint flow
async function debugAuthFlow() {
  console.log('🔍 Debugging Authentication Flow...');
  
  try {
    // Login first
    console.log('🔐 Logging in...');
    const loginResponse = await axios.post(`${BASE_URL}/auth/login`, {
      email: 'patient.test.new@example.com',
      password: 'Password123!'
    });
    
    console.log('✅ Login successful');
    const token = loginResponse.data.data?.token;
    console.log('   Token length:', token?.length);
    console.log('   Token starts with:', token?.substring(0, 20) + '...');
    
    const headers = { Authorization: `Bearer ${token}` };
    
    // Test auth/profile endpoint (this works)
    console.log('\n👤 Testing /auth/profile (should work)...');
    try {
      const profileResponse = await axios.get(`${BASE_URL}/auth/profile`, { headers });
      console.log('✅ Profile successful - User role:', profileResponse.data.data.user.role);
    } catch (error) {
      console.log('❌ Profile failed:', error.response?.status, error.response?.data?.message);
    }
    
    // Test patients/doctors/search endpoint (this fails with 403)
    console.log('\n🔍 Testing /patients/doctors/search (currently fails)...');
    try {
      const searchResponse = await axios.get(`${BASE_URL}/patients/doctors/search`, { headers });
      console.log('✅ Doctor search successful');
    } catch (error) {
      console.log('❌ Doctor search failed:', error.response?.status, error.response?.data?.message);
    }
    
    // Test a simpler patients endpoint
    console.log('\n📋 Testing /patients/profile (should work with same auth)...');
    try {
      const patientProfileResponse = await axios.get(`${BASE_URL}/patients/profile`, { headers });
      console.log('✅ Patient profile successful');
    } catch (error) {
      console.log('❌ Patient profile failed:', error.response?.status, error.response?.data?.message);
    }
    
  } catch (error) {
    console.log('❌ Login or test failed:', error.message);
  }
}

// Run the debug
debugAuthFlow()
  .then(() => console.log('\n🎉 Debug completed'))
  .catch(error => console.error('\n❌ Debug failed:', error.message));
