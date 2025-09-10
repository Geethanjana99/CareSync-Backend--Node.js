const Doctor = require('./models/Doctor');
const mysql = require('mysql2/promise');
const connectMySQL = require('./config/mysql');
require('dotenv').config();

async function testDoctorModel() {
  try {
    console.log('🔌 Initializing MySQL connection...');
    await connectMySQL();
    
    console.log('🧪 Testing Doctor.findByUserId method...');
    
    // First, let's find a user_id that we know exists
    const connection = await mysql.createConnection({
      host: process.env.MYSQL_HOST,
      port: process.env.MYSQL_PORT,
      user: process.env.MYSQL_USER,
      password: process.env.MYSQL_PASSWORD,
      database: process.env.MYSQL_DATABASE,
      ssl: { rejectUnauthorized: false }
    });
    
    const [users] = await connection.execute(`
      SELECT u.id, u.email, d.id as doctor_id, d.availability_status
      FROM users u 
      JOIN doctors d ON u.id = d.user_id 
      WHERE u.email = 'test.queue.doctor@example.com'
      LIMIT 1
    `);
    
    if (users.length > 0) {
      const user = users[0];
      console.log('Found user:', user);
      
      // Now test the Doctor model
      console.log('\n🔍 Testing Doctor.findByUserId...');
      console.log('Looking for user_id:', user.id);
      
      const doctor = await Doctor.findByUserId(user.id);
      
      if (doctor) {
        console.log('✅ Doctor found via model:');
        console.log('  ID:', doctor.id);
        console.log('  Availability Status:', doctor.availability_status);
        console.log('  User ID:', doctor.user_id);
      } else {
        console.log('❌ Doctor not found via model');
        
        // Let's debug further - check what the raw query returns
        const { mysqlConnection } = require('./config/mysql');
        const query = 'SELECT * FROM doctors WHERE user_id = ?';
        console.log('🔍 Running raw query:', query, 'with user_id:', user.id);
        const result = await mysqlConnection.query(query, [user.id]);
        console.log('Raw query result:', result);
      }
    } else {
      console.log('❌ No test user found');
    }
    
    await connection.end();
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

testDoctorModel();
