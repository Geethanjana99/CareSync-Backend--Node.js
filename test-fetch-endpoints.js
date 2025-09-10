const axios = require('axios');

// Test both availability and queue status endpoints
async function testBothEndpoints() {
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
      const availResponse = await axios.get(`${baseURL}/doctor/availability`, { headers });
      console.log('✅ GET availability successful');
      console.log('   Doctor ID:', availResponse.data.data.doctor_id);
      console.log('   Availability Status:', availResponse.data.data.availability_status);
      console.log('   Queue Active:', availResponse.data.data.queue.is_active);
    } catch (error) {
      console.log('❌ GET availability failed:', error.response?.data || error.message);
    }

    console.log('\n🧪 Testing GET /api/doctor/queue/status...');
    try {
      const queueResponse = await axios.get(`${baseURL}/doctor/queue/status`, { headers });
      console.log('✅ GET queue status successful');
      console.log('   Doctor ID:', queueResponse.data.data.doctor_id);
      console.log('   Queue Active:', queueResponse.data.data.is_active);
      console.log('   Current Number:', queueResponse.data.data.current_number);
    } catch (error) {
      console.log('❌ GET queue status failed:', error.response?.data || error.message);
    }

    console.log('\n🎉 All fetch endpoints tested!');
    
  } catch (loginError) {
    console.error('❌ Login failed:', loginError.response?.data || loginError.message);
  }
}

testBothEndpoints();
