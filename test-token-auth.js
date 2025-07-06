const jwt = require('jsonwebtoken');
const { mysqlConnection } = require('./config/mysql');
require('dotenv').config();

async function testTokenAuth() {
  try {
    console.log('Testing token authentication...');
    
    // Initialize the connection
    await mysqlConnection.connect();
    console.log('Database connected successfully');
    
    // Create a test token manually
    const testUserId = '6c38722a-5a4a-11f0-b142-862ccfb035af';
    const testToken = jwt.sign({ userId: testUserId }, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRE || '7d'
    });
    
    console.log('Generated test token:', testToken);
    console.log('Token length:', testToken.length);
    
    // Test decoding
    const decoded = jwt.verify(testToken, process.env.JWT_SECRET);
    console.log('Decoded token:', decoded);
    
    // Test the middleware logic
    const query = `
      SELECT u.*, 
             p.patient_id, p.status as patient_status,
             d.doctor_id, d.specialty, d.status as doctor_status
      FROM users u
      LEFT JOIN patients p ON u.id = p.user_id
      LEFT JOIN doctors d ON u.id = d.user_id
      WHERE u.id = ? AND u.is_active = true
    `;
    
    const users = await mysqlConnection.query(query, [decoded.userId]);
    console.log('Users found:', users.length);
    
    if (users.length > 0) {
      console.log('User found:', users[0].name, users[0].email);
      console.log('User role:', users[0].role);
      console.log('Doctor ID:', users[0].doctor_id);
      console.log('Patient ID:', users[0].patient_id);
    }
    
  } catch (error) {
    console.error('Error testing token auth:', error);
  }
  
  process.exit(0);
}

testTokenAuth();
