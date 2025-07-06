const axios = require('axios');

// Test frontend-style API call for queue toggle
const testFrontendQueueToggle = async () => {
  const baseURL = 'http://localhost:5000/api';
  
  try {
    console.log('=== TESTING FRONTEND-STYLE QUEUE TOGGLE ===\n');
    
    // Login as doctor first
    console.log('1. Logging in as doctor...');
    const loginResponse = await axios.post(`${baseURL}/auth/login`, {
      email: 'test.doctor@example.com',
      password: 'testpass123'
    });
    
    const token = loginResponse.data.data.token;
    console.log('✅ Doctor logged in successfully\n');
    
    // Test frontend-style API call structure
    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    };
    
    console.log('2. Testing queue toggle with frontend-style request...');
    
    // Try to toggle queue on (frontend style)
    try {
      const toggleResponse = await axios.put(
        `${baseURL}/doctor/queue/toggle`,
        { is_active: true },
        { headers }
      );
      
      console.log('✅ Queue toggle ON successful:', toggleResponse.data);
      
      // Try to toggle queue off
      const toggleOffResponse = await axios.put(
        `${baseURL}/doctor/queue/toggle`,
        { is_active: false },
        { headers }
      );
      
      console.log('✅ Queue toggle OFF successful:', toggleOffResponse.data);
      
    } catch (toggleError) {
      console.error('❌ Queue toggle failed:');
      console.error('Status:', toggleError.response?.status);
      console.error('Data:', toggleError.response?.data);
      console.error('Headers:', toggleError.response?.headers);
    }
    
    // Test get queue status to verify
    console.log('\n3. Checking queue status...');
    const statusResponse = await axios.get(`${baseURL}/doctor/queue/status`, { headers });
    console.log('Queue Status:', statusResponse.data);
    
  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
  }
};

testFrontendQueueToggle();
