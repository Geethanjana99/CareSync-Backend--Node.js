const { mysqlConnection } = require('./config/mysql');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');

async function createTestAdmin() {
  try {
    console.log('🔑 Creating test admin user...');
    
    // Check if admin already exists
    const [existingUsers] = await mysqlConnection.query(
      'SELECT * FROM users WHERE email = ?',
      ['admin@caresync.com']
    );
    
    if (existingUsers.length > 0) {
      console.log('✅ Admin user already exists: admin@caresync.com');
      return;
    }
    
    // Hash password
    const hashedPassword = await bcrypt.hash('admin123', 12);
    
    // Create admin user
    const userId = uuidv4();
    await mysqlConnection.query(
      `INSERT INTO users (id, name, email, password, role, is_verified, is_active, created_at, updated_at) 
       VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
      [userId, 'Admin User', 'admin@caresync.com', hashedPassword, 'admin', true, true]
    );
    
    console.log('✅ Test admin user created successfully!');
    console.log('📧 Email: admin@caresync.com');
    console.log('🔒 Password: admin123');
    
  } catch (error) {
    console.error('❌ Error creating admin user:', error.message);
  } finally {
    process.exit(0);
  }
}

createTestAdmin();
