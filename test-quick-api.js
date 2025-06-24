const axios = require('axios');

(async () => {
  try {
    console.log('🔍 Testing patient appointments API...');
    
    // Login
    const login = await axios.post('http://localhost:5000/api/auth/login', {
      email: 'patient.test.new@example.com',
      password: 'Password123!'
    });
    
    const token = login.data.data.token;
    const headers = { Authorization: `Bearer ${token}` };
    console.log('✅ Login successful');
    
    // Test appointments endpoint
    const response = await axios.get('http://localhost:5000/api/patients/appointments', { 
      headers,
      params: { limit: 5 }
    });
    
    console.log('✅ Appointments API Status:', response.status);
    console.log('📊 Response Data:', JSON.stringify(response.data, null, 2));
    
    if (response.data.success && response.data.data.appointments) {
      console.log(`📅 Found ${response.data.data.appointments.length} appointments`);
    }
    
  } catch (error) {
    console.log('❌ Error:', error.response?.data || error.message);
  }
})();
