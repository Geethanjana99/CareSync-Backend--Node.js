const axios = require('axios');

async function testConsultationComplete() {
  try {
    // Get a valid appointment ID first
    const validAppointmentId = '48c569fd-9192-4735-822d-dc7810b04c27'; // in-progress status
    
    console.log('🧪 Testing consultation completion API...');
    console.log(`📋 Using appointment ID: ${validAppointmentId}`);
    
    // Test the API endpoint with proper authorization
    const response = await axios.post(
      `http://localhost:5000/api/doctors/queue/complete/${validAppointmentId}`,
      {
        notes: 'Test consultation notes',
        prescription: 'Test prescription',
        diagnosis: 'Test diagnosis'
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer test-token' // You might need a real token
        }
      }
    );
    
    console.log('✅ API Response:');
    console.log(JSON.stringify(response.data, null, 2));
    
  } catch (error) {
    console.error('❌ API Error:');
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', JSON.stringify(error.response.data, null, 2));
    } else {
      console.error('Message:', error.message);
    }
  }
}

testConsultationComplete();