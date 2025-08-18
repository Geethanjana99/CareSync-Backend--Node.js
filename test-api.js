// Test appointment creation with proper data
const fetch = require('node-fetch');

const API_BASE_URL = 'http://localhost:5000/api';

async function testAppointmentAPI() {
  try {
    console.log('Testing appointment API...');
    
    // First, let's try to get appointments without auth to see the structure
    const response = await fetch(`${API_BASE_URL}/appointments`, {
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    const result = await response.json();
    console.log('Appointment API response:', result);
    
  } catch (error) {
    console.error('Error testing appointment API:', error.message);
  }
}

// Wait a bit for server to start, then test
setTimeout(testAppointmentAPI, 5000);
