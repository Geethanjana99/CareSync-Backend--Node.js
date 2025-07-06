const axios = require('axios');
const jwt = require('jsonwebtoken');
const { mysqlConnection } = require('./config/mysql');

async function testPatientAuth() {
  try {
    console.log('Testing patient authentication...');
    
    // Initialize connection
    await mysqlConnection.connect();
    
    // Get a test patient user
    const testPatient = await mysqlConnection.query('SELECT * FROM users WHERE role = ? LIMIT 1', ['patient']);
    if (testPatient.length === 0) {
      console.log('No patient users found');
      return;
    }
    
    const patientUser = testPatient[0];
    console.log('Testing with patient:', patientUser.name);
    
    // Create JWT token
    const token = jwt.sign(
      { 
        id: patientUser.id, 
        email: patientUser.email, 
        role: patientUser.role 
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
    
    // Test patient appointments endpoint
    console.log('\n🔍 Testing patient appointments endpoint...');
    try {
      const response = await axios.get('http://localhost:5000/api/patients/appointments?status=scheduled&status=confirmed&limit=5', config);
      console.log('✅ Success:', response.data);
    } catch (error) {
      console.log('❌ Error:', error.response?.data || error.message);
      console.log('Status:', error.response?.status);
    }
    
    // Test if patient record exists
    console.log('\n🔍 Testing patient record...');
    const patientRecord = await mysqlConnection.query('SELECT * FROM patients WHERE user_id = ?', [patientUser.id]);
    console.log('Patient record:', patientRecord);
    
    process.exit(0);
  } catch (error) {
    console.error('Test error:', error);
    process.exit(1);
  }
}

testPatientAuth();
