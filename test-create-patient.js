const axios = require('axios');

const BASE_URL = 'http://localhost:5000/api';

// Function to create a valid patient and test endpoints
async function createPatientAndTest() {
  console.log('🏥 Creating Valid Patient and Testing Endpoints...');
  
  try {
    // Create a patient user with valid credentials
    console.log('👥 Creating test patient user with valid data...');
    const patientData = {
      email: 'patient.test.new@example.com',
      password: 'Password123!',  // Valid password with uppercase, lowercase, number, special char
      name: 'Test Patient',
      role: 'patient',
      phone: '0701234567',       // Valid Sri Lankan phone number
      date_of_birth: '1990-01-01'
    };
    
    try {
      const registerResponse = await axios.post(`${BASE_URL}/auth/register`, patientData);
      console.log('✅ Patient registration successful');
      console.log('   User ID:', registerResponse.data.user?.id);
      console.log('   Email:', registerResponse.data.user?.email);
    } catch (regError) {
      console.log('❌ Patient registration failed:', regError.response?.status);
      console.log('   Error details:', regError.response?.data);
      
      // If user exists, that's fine, we can try to log in
      if (regError.response?.data?.message?.includes('already exists')) {
        console.log('ℹ️ Patient user already exists, proceeding with login test...');
      } else {
        return;
      }
    }
    
    // Try to login with the created credentials
    console.log('🔐 Testing login with created patient...');
    try {
      const loginResponse = await axios.post(`${BASE_URL}/auth/login`, {
        email: patientData.email,
        password: patientData.password
      });
      
      if (loginResponse.status === 200) {
        console.log('✅ Login successful');
        const token = loginResponse.data.token;
        console.log('   User:', loginResponse.data.user.name);
        console.log('   Role:', loginResponse.data.user.role);
        
        const headers = { Authorization: `Bearer ${token}` };
        
        // Test profile endpoint
        console.log('👤 Testing profile endpoint...');
        try {
          const profileResponse = await axios.get(`${BASE_URL}/auth/profile`, { headers });
          console.log('✅ Profile endpoint successful');
          console.log('   User:', profileResponse.data.user.name);
          console.log('   Role:', profileResponse.data.user.role);
          console.log('   Patient ID:', profileResponse.data.user.patient_id);
        } catch (profileError) {
          console.log('❌ Profile endpoint failed:', profileError.response?.status);
          console.log('   Error details:', profileError.response?.data);
          console.log('   Full error:', profileError.message);
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
          console.log('   Full error:', searchError.message);
        }
        
      }
    } catch (loginError) {
      console.log('❌ Login failed:', loginError.response?.status, loginError.response?.data?.message);
    }
    
  } catch (error) {
    console.log('❌ Test failed:', error.message);
  }
}

// Run the test
createPatientAndTest().catch(console.error);
