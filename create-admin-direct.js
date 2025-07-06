const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');

async function createTestAdmin() {
  let connection;
  
  try {
    console.log('🔧 Creating test admin user...');
    
    // Create direct MySQL connection
    connection = await mysql.createConnection({
      host: process.env.MYSQL_HOST || 'caresyncdb-caresync.e.aivencloud.com',
      port: process.env.MYSQL_PORT || 16006,
      user: process.env.MYSQL_USER || 'avnadmin',
      password: process.env.MYSQL_PASSWORD || 'AVNS_6xeaVpCVApextDTAKfU',
      database: process.env.MYSQL_DATABASE || 'caresync',
      ssl: {
        rejectUnauthorized: false
      }
    });
    
    console.log('✅ Connected to MySQL');
    
    // Check if admin already exists
    const checkQuery = 'SELECT * FROM users WHERE email = ?';
    const [existingUsers] = await connection.execute(checkQuery, ['admin@caresync.com']);
    
    if (existingUsers.length > 0) {
      console.log('✅ Admin user already exists: admin@caresync.com');
      console.log('📧 Email: admin@caresync.com');
      console.log('🔑 Password: admin123');
      return;
    }
    
    // Hash password
    const hashedPassword = await bcrypt.hash('admin123', 10);
    
    // Create admin user
    const userId = uuidv4();
    const insertQuery = `
      INSERT INTO users (id, name, email, password, role, is_verified, is_active, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
    `;
    
    await connection.execute(insertQuery, [
      userId,
      'Admin User',
      'admin@caresync.com',
      hashedPassword,
      'admin',
      true,
      true
    ]);
    
    console.log('✅ Test admin user created successfully!');
    console.log('📧 Email: admin@caresync.com');
    console.log('🔑 Password: admin123');
    console.log('👤 Role: admin');
    
  } catch (error) {
    console.error('❌ Error creating admin user:', error.message);
    console.error('Full error:', error);
  } finally {
    if (connection) {
      await connection.end();
    }
    process.exit(0);
  }
}

createTestAdmin();
