const axios = require('axios');

const BASE_URL = 'http://localhost:5000/api';

// Function to test patient endpoints with better error handling
async function testPatientEndpoints() {
  console.log('🏥 Testing Patient Authentication & API Endpoints...');
  
  try {
    // First, try to create a patient user with better error handling
    console.log('👥 Trying to create test patient user...');
    try {
      const registerResponse = await axios.post(`${BASE_URL}/auth/register`, {
        email: 'test.patient.new@example.com',
        password: 'password123',
        name: 'Test Patient New',
        role: 'patient',
        phone: '1234567890',
        date_of_birth: '1990-01-01'
      });
      console.log('✅ Patient registration successful');
    } catch (regError) {
      console.log('❌ Patient registration failed:', regError.response?.status, regError.response?.data);
      
      // If user exists, that's fine, we can try to log in
      if (regError.response?.data?.message?.includes('already exists')) {
        console.log('ℹ️ Patient user already exists, proceeding with login test...');
      }
    }
    
    // Try different patient credentials that might exist
    const testCredentials = [
      { email: 'test.patient.new@example.com', password: 'password123' },
      { email: 'test.patient@example.com', password: 'password123' },
      { email: 'patient@example.com', password: 'password123' },
      { email: 'patient.test@example.com', password: 'password123' }
    ];
    
    let token = null;
    
    for (const creds of testCredentials) {
      console.log(`🔐 Testing login with ${creds.email}...`);
      try {
        const loginResponse = await axios.post(`${BASE_URL}/auth/login`, creds);
        
        if (loginResponse.status === 200) {
          console.log(`✅ Login successful with ${creds.email}`);
          token = loginResponse.data.token;
          console.log('   User:', loginResponse.data.user.name);
          console.log('   Role:', loginResponse.data.user.role);
          break;
        }
      } catch (loginError) {
        console.log(`❌ Login failed with ${creds.email}:`, loginError.response?.status, loginError.response?.data?.message);
      }
    }
    
    if (!token) {
      console.log('❌ No valid patient credentials found, skipping API tests');
      return;
    }
    
    const headers = { Authorization: `Bearer ${token}` };
    
    // Test profile endpoint
    console.log('👤 Testing profile endpoint...');
    try {
      const profileResponse = await axios.get(`${BASE_URL}/auth/profile`, { headers });
      console.log('✅ Profile endpoint successful');
      console.log('   User:', profileResponse.data.user.name);
      console.log('   Role:', profileResponse.data.user.role);
    } catch (profileError) {
      console.log('❌ Profile endpoint failed:', profileError.response?.status);
      console.log('   Error details:', profileError.response?.data);
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
      console.log('   Error details:', searchError.response?.data);
    }
    
  } catch (error) {
    console.log('❌ Test failed:', error.message);
  }
}

// Run the test
testPatientEndpoints().catch(console.error);
