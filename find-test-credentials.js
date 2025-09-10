const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
require('dotenv').config();

async function createTestAndLogin() {
  const connection = await mysql.createConnection({
    host: process.env.MYSQL_HOST,
    port: process.env.MYSQL_PORT,
    user: process.env.MYSQL_USER,
    password: process.env.MYSQL_PASSWORD,
    database: process.env.MYSQL_DATABASE,
    ssl: { rejectUnauthorized: false }
  });
  
  try {
    console.log('🔑 Checking for existing doctor with known password...');
    
    // Look for a test doctor
    const [users] = await connection.execute(`
      SELECT u.id, u.email, u.password_hash, d.id as doctor_id
      FROM users u 
      JOIN doctors d ON u.id = d.user_id 
      WHERE u.email LIKE '%test%' OR u.email LIKE '%example%'
      LIMIT 1
    `);
    
    if (users.length > 0) {
      const user = users[0];
      console.log(`Found test user: ${user.email}`);
      
      // Try common passwords
      const testPasswords = ['password123', 'test123', 'admin123', '123456'];
      let validPassword = null;
      
      for (const pwd of testPasswords) {
        const isValid = await bcrypt.compare(pwd, user.password_hash);
        if (isValid) {
          validPassword = pwd;
          break;
        }
      }
      
      if (validPassword) {
        console.log(`✅ Found valid password: ${validPassword}`);
        console.log(`Email: ${user.email}`);
        console.log(`Doctor ID: ${user.doctor_id}`);
        return { email: user.email, password: validPassword };
      } else {
        console.log('❌ No matching password found for test accounts');
      }
    } else {
      console.log('❌ No test accounts found');
    }
    
    return null;
    
  } finally {
    await connection.end();
  }
}

createTestAndLogin().then(credentials => {
  if (credentials) {
    console.log('\n📋 Use these credentials to test:');
    console.log(`Email: ${credentials.email}`);
    console.log(`Password: ${credentials.password}`);
  } else {
    console.log('\n📋 Need to create a test doctor account first');
  }
}).catch(console.error);
