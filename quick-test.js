const axios = require('axios');

async function quickTest() {
  try {
    console.log('🧪 Quick diabetes prediction test...');
    
    const response = await axios.post('http://localhost:5000/api/admin/reports/diabetes-predictions', {
      patientId: '12345678-1234-1234-1234-123456789012',
      pregnancies: 2,
      glucose: 140,
      bmi: 28.1,
      age: 35,
      insulin: 150,
      notes: 'Quick test'
    }, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer fake-token'
      },
      timeout: 10000
    });
    
    console.log('✅ Response:', response.status, response.data);
    
  } catch (error) {
    console.log('📋 Response status:', error.response?.status);
    console.log('📋 Response data:', JSON.stringify(error.response?.data, null, 2));
    console.log('📋 Error message:', error.message);
  }
}

quickTest();
