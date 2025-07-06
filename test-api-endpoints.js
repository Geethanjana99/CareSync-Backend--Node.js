const axios = require('axios');

const API_BASE_URL = 'http://localhost:3001';
const TEST_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjExYjIxYWQ5LWI4NWItNGQ2YS04OWIwLTdkZjg4MzlkYjczMCIsImlhdCI6MTc1MTc5NDQwMywiZXhwIjoxNzUxNzk4MDAzfQ.fR1riOsYbnHFkXziV-KsotukR2LUkPwW_D-MzGjA0LQ';

async function testApiEndpoints() {
  try {
    console.log('Testing API endpoints...');
    
    const headers = {
      'Authorization': `Bearer ${TEST_TOKEN}`,
      'Content-Type': 'application/json'
    };
    
    // Test get availability
    console.log('\n1. Testing GET /api/doctor/availability...');
    try {
      const response = await axios.get(`${API_BASE_URL}/api/doctor/availability`, { headers });
      console.log('✅ Success:', response.data);
    } catch (error) {
      console.log('❌ Error:', error.response?.data || error.message);
    }
    
    // Test update working hours
    console.log('\n2. Testing PUT /api/doctor/availability/working-hours...');
    try {
      const workingHours = {
        monday: { start: '09:00', end: '17:00' },
        tuesday: { start: '09:00', end: '17:00' },
        wednesday: { start: '09:00', end: '17:00' },
        thursday: { start: '09:00', end: '17:00' },
        friday: { start: '09:00', end: '17:00' }
      };
      
      const response = await axios.put(`${API_BASE_URL}/api/doctor/availability/working-hours`, 
        { working_hours: workingHours }, 
        { headers }
      );
      console.log('✅ Success:', response.data);
    } catch (error) {
      console.log('❌ Error:', error.response?.data || error.message);
    }
    
    // Test update availability status
    console.log('\n3. Testing PUT /api/doctor/availability/status...');
    try {
      const response = await axios.put(`${API_BASE_URL}/api/doctor/availability/status`, 
        { status: 'available' }, 
        { headers }
      );
      console.log('✅ Success:', response.data);
    } catch (error) {
      console.log('❌ Error:', error.response?.data || error.message);
    }
    
    // Test get today's appointments
    console.log('\n4. Testing GET /api/doctor/appointments/today...');
    try {
      const response = await axios.get(`${API_BASE_URL}/api/doctor/appointments/today`, { headers });
      console.log('✅ Success:', response.data);
    } catch (error) {
      console.log('❌ Error:', error.response?.data || error.message);
    }
    
    // Test get queue status
    console.log('\n5. Testing GET /api/doctor/queue/status...');
    try {
      const response = await axios.get(`${API_BASE_URL}/api/doctor/queue/status`, { headers });
      console.log('✅ Success:', response.data);
    } catch (error) {
      console.log('❌ Error:', error.response?.data || error.message);
    }
    
  } catch (error) {
    console.error('Test error:', error);
  }
}

testApiEndpoints();
