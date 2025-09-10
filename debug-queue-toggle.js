const axios = require('axios');

// Test only the queue toggle to debug the issue
async function debugQueueToggle() {
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

    console.log('\n🧪 Testing queue toggle with detailed error handling...');
    
    try {
      const response = await axios.put(`${baseURL}/doctor/queue/toggle`, {}, { 
        headers,
        timeout: 10000
      });
      console.log('✅ Queue toggle successful:', response.data);
    } catch (error) {
      console.log('❌ Queue toggle failed:');
      console.log('Status:', error.response?.status);
      console.log('Data:', JSON.stringify(error.response?.data, null, 2));
      
      if (error.response?.data?.stack) {
        console.log('\nStack trace:', error.response.data.stack);
      }
    }
    
  } catch (loginError) {
    console.error('❌ Login failed:', loginError.response?.data || loginError.message);
  }
}

debugQueueToggle();
