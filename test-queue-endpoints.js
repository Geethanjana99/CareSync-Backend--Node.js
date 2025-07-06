const axios = require('axios');

// Test the queue and availability endpoints
const testEndpoints = async () => {
  const baseURL = 'http://localhost:5000';
  
  // Test doctor login first
  try {
    console.log('1. Testing doctor login...');
    const loginResponse = await axios.post(`${baseURL}/api/auth/login`, {
      email: 'test.doctor@example.com',
      password: 'testpass123'
    });
    
    const loginData = loginResponse.data;
    console.log('Login response:', loginData);
    
    const token = loginData.data.token;
    console.log('Token:', token);
    
    // Test getting availability
    console.log('\n2. Testing get availability...');
    const availabilityResponse = await axios.get(`${baseURL}/api/doctor/availability`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    const availabilityData = availabilityResponse.data;
    console.log('Availability response:', availabilityData);
    
    // Test getting queue status
    console.log('\n3. Testing get queue status...');
    const queueStatusResponse = await axios.get(`${baseURL}/api/doctor/queue/status`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    const queueStatusData = queueStatusResponse.data;
    console.log('Queue status response:', queueStatusData);
    
    // Test getting today's appointments
    console.log('\n4. Testing get today\'s appointments...');
    const appointmentsResponse = await axios.get(`${baseURL}/api/doctor/appointments/today`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    const appointmentsData = appointmentsResponse.data;
    console.log('Appointments response:', appointmentsData);
    
    // Test patient login
    console.log('\n5. Testing patient login...');
    const patientLoginResponse = await axios.post(`${baseURL}/api/auth/login`, {
      email: 'test.patient@example.com',
      password: 'testpass123'
    });
    
    const patientLoginData = patientLoginResponse.data;
    console.log('Patient login response:', patientLoginData);
    
    const patientToken = patientLoginData.data.token;
    
    // Test patient queue position
    console.log('\n6. Testing patient queue position...');
    const patientQueueResponse = await axios.get(`${baseURL}/api/patient/queue/position`, {
      headers: {
        'Authorization': `Bearer ${patientToken}`,
        'Content-Type': 'application/json'
      }
    });
    
    const patientQueueData = patientQueueResponse.data;
    console.log('Patient queue response:', patientQueueData);
    
  } catch (error) {
    console.error('Error testing endpoints:', error);
  }
};

testEndpoints();
