const axios = require('axios');
const jwt = require('jsonwebtoken');
const { mysqlConnection } = require('./config/mysql');

async function testApiEndpoints() {
  try {
    console.log('Testing API endpoints on port 5000...');
    
    // Initialize connection
    await mysqlConnection.connect();
    
    // Get a test doctor user
    const testUser = await mysqlConnection.query('SELECT * FROM users WHERE role = ? LIMIT 1', ['doctor']);
    if (testUser.length === 0) {
      console.log('No doctor users found');
      return;
    }
    
    const doctorUser = testUser[0];
    console.log('Testing with doctor:', doctorUser.name);
    
    // Create a JWT token for authentication
    const token = jwt.sign(
      { 
        id: doctorUser.id, 
        email: doctorUser.email, 
        role: doctorUser.role 
      },
      process.env.JWT_SECRET || 'your_super_secret_jwt_key_here_make_it_very_long_and_secure_development_key_2025',
      { expiresIn: '1h' }
    );
    
    const config = {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    };
    
    const baseUrl = 'http://localhost:5000/api/doctor';
    
    // Test 1: Get availability
    console.log('\n1. Testing GET /api/doctor/availability...');
    try {
      const response = await axios.get(`${baseUrl}/availability`, config);
      console.log('✅ Success:', response.data);
    } catch (error) {
      console.log('❌ Error:', error.response?.data || error.message);
    }
    
    // Test 2: Update working hours
    console.log('\n2. Testing PUT /api/doctor/availability/working-hours...');
    try {
      const workingHours = {
        monday: { start: '09:00', end: '17:00' },
        tuesday: { start: '09:00', end: '17:00' },
        wednesday: { start: '09:00', end: '17:00' }
      };
      
      const response = await axios.put(`${baseUrl}/availability/working-hours`, 
        { working_hours: workingHours }, 
        config
      );
      console.log('✅ Success:', response.data);
    } catch (error) {
      console.log('❌ Error:', error.response?.data || error.message);
    }
    
    // Test 3: Update availability status
    console.log('\n3. Testing PUT /api/doctor/availability/status...');
    try {
      const response = await axios.put(`${baseUrl}/availability/status`, 
        { status: 'available' }, 
        config
      );
      console.log('✅ Success:', response.data);
    } catch (error) {
      console.log('❌ Error:', error.response?.data || error.message);
    }
    
    // Test 4: Get queue status
    console.log('\n4. Testing GET /api/doctor/queue/status...');
    try {
      const response = await axios.get(`${baseUrl}/queue/status`, config);
      console.log('✅ Success:', response.data);
    } catch (error) {
      console.log('❌ Error:', error.response?.data || error.message);
    }
    
    // Test 5: Get today's appointments
    console.log('\n5. Testing GET /api/doctor/appointments/today...');
    try {
      const response = await axios.get(`${baseUrl}/appointments/today`, config);
      console.log('✅ Success: Found', response.data.length, 'appointments');
      if (response.data.length > 0) {
        console.log('First appointment:', response.data[0]);
      }
    } catch (error) {
      console.log('❌ Error:', error.response?.data || error.message);
    }
    
    process.exit(0);
  } catch (error) {
    console.error('Test error:', error);
    process.exit(1);
  }
}

testApiEndpoints();
