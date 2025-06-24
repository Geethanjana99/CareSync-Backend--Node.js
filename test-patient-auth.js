const axios = require('axios');

const BASE_URL = 'http://localhost:5000/api';

// Function to test patient login and API endpoints
async function testPatientEndpoints() {
  console.log('🏥 Testing Patient Authentication & API Endpoints...');
  
  try {
    // Test patient login
    console.log('🔐 Testing patient login...');
    const loginResponse = await axios.post(`${BASE_URL}/auth/login`, {
      email: 'test.patient@example.com',
      password: 'password123'
    });
    
    if (loginResponse.status === 200) {
      console.log('✅ Patient login successful');
      const token = loginResponse.data.token;
      const headers = { Authorization: `Bearer ${token}` };
      
      // Test profile endpoint
      console.log('👤 Testing profile endpoint...');
      try {
        const profileResponse = await axios.get(`${BASE_URL}/auth/profile`, { headers });
        console.log('✅ Profile endpoint successful');
        console.log('   User:', profileResponse.data.user.name);
        console.log('   Role:', profileResponse.data.user.role);
      } catch (profileError) {
        console.log('❌ Profile endpoint failed:', profileError.response?.status, profileError.response?.data?.message || profileError.message);
      }
      
      // Test doctor search endpoint
      console.log('🔍 Testing doctor search endpoint...');
      try {
        const searchResponse = await axios.get(`${BASE_URL}/patients/doctors/search`, { headers });
        console.log('✅ Doctor search successful');
        console.log('   Found', searchResponse.data.doctors?.length || 0, 'doctors');
      } catch (searchError) {
        console.log('❌ Doctor search failed:', searchError.response?.status, searchError.response?.data?.message || searchError.message);
      }
      
    } else {
      console.log('❌ Patient login failed');
    }
    
  } catch (error) {
    console.log('❌ Login attempt failed:', error.response?.status, error.response?.data?.message || error.message);
    
    // Let's try to create a patient user for testing
    console.log('👥 Creating test patient user...');
    try {
      const registerResponse = await axios.post(`${BASE_URL}/auth/register`, {
        email: 'test.patient@example.com',
        password: 'password123',
        name: 'Test Patient',
        role: 'patient'
      });
      
      if (registerResponse.status === 201) {
        console.log('✅ Patient registration successful');
        
        // Try login again
        console.log('🔐 Retrying patient login...');
        const retryLoginResponse = await axios.post(`${BASE_URL}/auth/login`, {
          email: 'test.patient@example.com',
          password: 'password123'
        });
        
        if (retryLoginResponse.status === 200) {
          console.log('✅ Patient login successful after registration');
          const token = retryLoginResponse.data.token;
          const headers = { Authorization: `Bearer ${token}` };
          
          // Test profile endpoint
          console.log('👤 Testing profile endpoint...');
          try {
            const profileResponse = await axios.get(`${BASE_URL}/auth/profile`, { headers });
            console.log('✅ Profile endpoint successful');
            console.log('   User:', profileResponse.data.user.name);
            console.log('   Role:', profileResponse.data.user.role);
          } catch (profileError) {
            console.log('❌ Profile endpoint failed:', profileError.response?.status, profileError.response?.data?.message || profileError.message);
          }
          
          // Test doctor search endpoint
          console.log('🔍 Testing doctor search endpoint...');
          try {
            const searchResponse = await axios.get(`${BASE_URL}/patients/doctors/search`, { headers });
            console.log('✅ Doctor search successful');
            console.log('   Found', searchResponse.data.doctors?.length || 0, 'doctors');
          } catch (searchError) {
            console.log('❌ Doctor search failed:', searchError.response?.status, searchError.response?.data?.message || searchError.message);
          }
        }
      }
      
    } catch (regError) {
      console.log('❌ Patient registration failed:', regError.response?.status, regError.response?.data?.message || regError.message);
    }
  }
}

// Run the test
testPatientEndpoints().catch(console.error);
