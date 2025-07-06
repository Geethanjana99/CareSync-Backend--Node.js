const axios = require('axios');

async function testLogin() {
  try {
    console.log('🔐 Testing login directly...');
    
    const response = await axios.post('http://localhost:5000/api/auth/login', {
      email: 'testpatient1751276334005@example.com',
      password: 'Patient123!'
    }, {
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    console.log('✅ Login successful!');
    console.log('Response:', response.data);
    
  } catch (error) {
    console.error('❌ Login failed:');
    console.error('Status:', error.response?.status);
    console.error('Status Text:', error.response?.statusText);
    console.error('Data:', error.response?.data);
    console.error('Headers:', error.response?.headers);
  }
}

testLogin();
