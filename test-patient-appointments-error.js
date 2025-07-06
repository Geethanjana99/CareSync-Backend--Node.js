const axios = require('axios');

async function testPatientAppointmentsDirectly() {
  try {
    console.log('Testing patient appointments endpoint directly...');
    
    // Test without token first
    console.log('\n1. Testing without token...');
    try {
      const response = await axios.get('http://localhost:5000/api/patients/appointments?status=scheduled&status=confirmed&limit=5');
      console.log('✅ Success:', response.data);
    } catch (error) {
      console.log('❌ Error:', error.response?.data || error.message);
    }
    
    // Test with invalid token
    console.log('\n2. Testing with invalid token...');
    try {
      const response = await axios.get('http://localhost:5000/api/patients/appointments?status=scheduled&status=confirmed&limit=5', {
        headers: { 'Authorization': 'Bearer invalid-token' }
      });
      console.log('✅ Success:', response.data);
    } catch (error) {
      console.log('❌ Error:', error.response?.data || error.message);
    }
    
    // Test with malformed token
    console.log('\n3. Testing with malformed token...');
    try {
      const response = await axios.get('http://localhost:5000/api/patients/appointments?status=scheduled&status=confirmed&limit=5', {
        headers: { 'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.invalid.signature' }
      });
      console.log('✅ Success:', response.data);
    } catch (error) {
      console.log('❌ Error:', error.response?.data || error.message);
    }
    
    process.exit(0);
  } catch (error) {
    console.error('Test error:', error);
    process.exit(1);
  }
}

testPatientAppointmentsDirectly();
