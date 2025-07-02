const axios = require('axios');

async function testAppointmentAPI() {
  const BASE_URL = 'http://localhost:5000/api';
  
  try {
    console.log('🔍 Testing appointment API endpoints...');
    
    // First, let's login as a patient
    console.log('\n1. Logging in as test patient...');
    const loginResponse = await axios.post(`${BASE_URL}/auth/login`, {
      email: 'patient.test.new@example.com',
      password: 'Password123!'
    });
    
    if (!loginResponse.data.success) {
      throw new Error(`Login failed: ${loginResponse.data.message}`);
    }
    
    const token = loginResponse.data.data.token;
    const authHeaders = { 
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };
    
    console.log('✅ Login successful');
    console.log(`   Patient: ${loginResponse.data.data.user.name}`);
    console.log(`   User ID: ${loginResponse.data.data.user.id}`);
    
    // Test appointment history endpoint
    console.log('\n2. Testing appointment history endpoint...');
    try {
      const historyResponse = await axios.get(`${BASE_URL}/patients/appointments`, {
        headers: authHeaders,
        timeout: 10000
      });
      
      console.log(`✅ Appointment history API response:`, {
        success: historyResponse.data.success,
        appointmentsCount: historyResponse.data.data?.appointments?.length || 0,
        hasData: !!historyResponse.data.data
      });
      
      if (historyResponse.data.data?.appointments?.length > 0) {
        console.log('📋 Sample appointment:', historyResponse.data.data.appointments[0]);
      }
    } catch (apiError) {
      console.log(`❌ Appointment history API failed:`, {
        status: apiError.response?.status,
        message: apiError.response?.data?.message || apiError.message,
        data: apiError.response?.data
      });
    }
    
    // Test upcoming appointments endpoint
    console.log('\n3. Testing upcoming appointments endpoint...');
    try {
      const upcomingResponse = await axios.get(`${BASE_URL}/patients/appointments/upcoming`, {
        headers: authHeaders,
        timeout: 10000
      });
      
      console.log(`✅ Upcoming appointments API response:`, {
        success: upcomingResponse.data.success,
        appointmentsCount: upcomingResponse.data.data?.appointments?.length || 0,
        hasData: !!upcomingResponse.data.data
      });
      
      if (upcomingResponse.data.data?.appointments?.length > 0) {
        console.log('📋 Sample upcoming appointment:', upcomingResponse.data.data.appointments[0]);
      }
    } catch (apiError) {
      console.log(`❌ Upcoming appointments API failed:`, {
        status: apiError.response?.status,
        message: apiError.response?.data?.message || apiError.message,
        data: apiError.response?.data
      });
    }
    
    console.log('\n✅ API testing complete');
    
  } catch (error) {
    console.error('❌ API test failed:', error.message);
    if (error.response) {
      console.error('Response data:', error.response.data);
      console.error('Response status:', error.response.status);
    }
    process.exit(1);
  }
}

testAppointmentAPI();
