const axios = require('axios');
const jwt = require('jsonwebtoken');
const mysql = require('mysql2/promise');
const { v4: uuidv4 } = require('uuid');

// Database and JWT configuration
const JWT_SECRET = 'your_super_secret_jwt_key_here_make_it_very_long_and_secure_development_key_2025';
const dbConfig = {
  host: 'caresyncdb-caresync.e.aivencloud.com',
  port: 16006,
  user: 'avnadmin',
  password: 'AVNS_6xeaVpCVApextDTAKfU',
  database: 'caresync',
  ssl: { rejectUnauthorized: false }
};

async function createTestUserAndPatient() {
  const connection = await mysql.createConnection(dbConfig);
  
  const adminId = uuidv4();
  const patientUserId = uuidv4();
  const patientId = uuidv4();
  
  try {
    // Create admin user
    await connection.execute(`
      INSERT INTO users (id, email, password, role, first_name, last_name, is_active, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, NOW())
      ON DUPLICATE KEY UPDATE email = VALUES(email)
    `, [adminId, 'admin.test@caresync.com', '$2b$10$dummyhash', 'admin', 'Test', 'Admin', 1]);
    
    // Create patient user
    await connection.execute(`
      INSERT INTO users (id, email, password, role, first_name, last_name, is_active, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, NOW())
      ON DUPLICATE KEY UPDATE email = VALUES(email)
    `, [patientUserId, 'patient.test@caresync.com', '$2b$10$dummyhash', 'patient', 'Test', 'Patient', 1]);
    
    // Create patient record
    await connection.execute(`
      INSERT INTO patients (id, user_id, patient_id, status, created_at)
      VALUES (?, ?, ?, 'active', NOW())
      ON DUPLICATE KEY UPDATE status = 'active'
    `, [patientId, patientUserId, patientUserId]);
    
    console.log('✅ Created test users and patient');
    return { adminId, patientUserId };
    
  } finally {
    await connection.end();
  }
}

async function testWithValidAuth() {
  try {
    console.log('🔧 Setting up test environment...');
    const { adminId, patientUserId } = await createTestUserAndPatient();
    
    // Generate valid JWT token
    const token = jwt.sign(
      { 
        id: adminId,
        userId: adminId,
        role: 'admin' 
      },
      JWT_SECRET,
      { expiresIn: '1h' }
    );
    
    console.log('🔑 Generated valid admin token');
    console.log('👤 Admin ID:', adminId);
    console.log('🏥 Patient ID:', patientUserId);
    
    // Test the API with valid authentication
    console.log('\n🧪 Testing diabetes prediction API with valid auth...');
    
    const response = await axios.post('http://localhost:5000/api/admin/reports/diabetes-predictions', {
      patientId: patientUserId,
      pregnancies: 2,
      glucose: 140,
      bmi: 28.1,
      age: 35,
      insulin: 150,
      notes: 'Test prediction with valid auth'
    }, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      timeout: 30000
    });
    
    console.log('✅ SUCCESS! API Response:', JSON.stringify(response.data, null, 2));
    
  } catch (error) {
    console.log('❌ Error Details:');
    console.log('Status:', error.response?.status);
    console.log('Status Text:', error.response?.statusText);
    console.log('Data:', JSON.stringify(error.response?.data, null, 2));
    
    if (error.response?.status === 500) {
      console.log('\n🚨 500 INTERNAL SERVER ERROR DETECTED!');
      console.log('This indicates an issue in the server code, not authentication');
    }
  }
}

testWithValidAuth().catch(console.error);
