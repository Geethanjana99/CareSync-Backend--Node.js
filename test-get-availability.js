const axios = require('axios');

// Test the GET doctor availability endpoint
async function testGetDoctorAvailability() {
  const baseURL = 'http://localhost:5000/api';
  
  try {
    console.log('🔐 Logging in as test doctor...');
    
    const loginResponse = await axios.post(`${baseURL}/auth/login`, {
      email: 'test.queue.doctor@example.com',
      password: 'test123'
    });
    
    const token = loginResponse.data.data.token;
    console.log('✅ Login successful!');
    
    const headers = {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };

    console.log('\n🧪 Testing GET /api/doctor/availability...');
    
    try {
      const response = await axios.get(`${baseURL}/doctor/availability`, { headers });
      console.log('✅ GET availability successful:');
      console.log(JSON.stringify(response.data, null, 2));
    } catch (error) {
      console.log('❌ GET availability failed:');
      console.log('Status:', error.response?.status);
      console.log('Data:', JSON.stringify(error.response?.data, null, 2));
    }
    
  } catch (loginError) {
    console.error('❌ Login failed:', loginError.response?.data || loginError.message);
  }
}

testGetDoctorAvailability();
