const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
require('dotenv').config();

async function createTestDoctor() {
  const connection = await mysql.createConnection({
    host: process.env.MYSQL_HOST,
    port: process.env.MYSQL_PORT,
    user: process.env.MYSQL_USER,
    password: process.env.MYSQL_PASSWORD,
    database: process.env.MYSQL_DATABASE,
    ssl: { rejectUnauthorized: false }
  });
  
  try {
    const email = 'test.queue.doctor@example.com';
    const password = 'test123';
    const name = 'Dr. Queue Test';
    
    console.log('👨‍⚕️ Creating test doctor account...');
    
    // Check if user already exists
    const [existingUsers] = await connection.execute(
      'SELECT id FROM users WHERE email = ?',
      [email]
    );
    
    if (existingUsers.length > 0) {
      console.log('✅ User already exists, using existing account');
      console.log(`Email: ${email}`);
      console.log(`Password: ${password}`);
      return { email, password };
    }
    
    // Hash password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);
    
    // Create user
    const userId = uuidv4();
    await connection.execute(`
      INSERT INTO users (id, name, email, password_hash, role, email_verified, created_at, updated_at)
      VALUES (?, ?, ?, ?, 'doctor', 1, NOW(), NOW())
    `, [userId, name, email, hashedPassword]);
    
    // Create doctor profile
    const doctorId = uuidv4();
    const doctorNumber = `DOC${Date.now().toString().slice(-6)}`;
    
    await connection.execute(`
      INSERT INTO doctors (
        id, user_id, doctor_id, specialty, license_number, years_of_experience,
        consultation_fee, availability_status, status, created_at, updated_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, 'available', 'active', NOW(), NOW())
    `, [
      doctorId, userId, doctorNumber, 'General Medicine', 
      'LIC' + Date.now(), 5, 50.00
    ]);
    
    console.log('✅ Test doctor created successfully!');
    console.log(`Email: ${email}`);
    console.log(`Password: ${password}`);
    console.log(`Doctor ID: ${doctorId}`);
    
    return { email, password };
    
  } finally {
    await connection.end();
  }
}

createTestDoctor().catch(console.error);
