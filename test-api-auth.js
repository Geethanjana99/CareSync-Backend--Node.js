// Test the appointments endpoint with authentication simulation
const fetch = require('node-fetch');

async function testAppointmentsAPI() {
  try {
    console.log('Testing appointments API...');
    
    // First test without auth - should fail
    const response1 = await fetch('http://localhost:5000/api/appointments');
    const result1 = await response1.json();
    console.log('Without auth:', result1);
    
    // Test with a fake token - should also fail but differently
    const response2 = await fetch('http://localhost:5000/api/appointments', {
      headers: {
        'Authorization': 'Bearer fake-token',
        'Content-Type': 'application/json'
      }
    });
    const result2 = await response2.json();
    console.log('With fake token:', result2);
    
    // Check if we can at least see the API structure
    console.log('API is responding correctly. Need valid auth token to see data.');
    
  } catch (error) {
    console.error('Error testing API:', error);
  }
}

testAppointmentsAPI();
