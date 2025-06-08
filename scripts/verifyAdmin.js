const bcrypt = require('bcryptjs');
const { mysqlConnection } = require('../config/mysql');

async function verifyAdmin() {
  try {
    console.log('🔄 Connecting to database...');
    await mysqlConnection.connect();
    
    // Get admin user
    const [adminUser] = await mysqlConnection.query('SELECT * FROM users WHERE email = ?', ['admin@clinicalapp.com']);
    
    if (!adminUser) {
      console.log('❌ Admin user not found');
      return;
    }
    
    console.log('👤 Admin user found:', {
      id: adminUser.id,
      name: adminUser.name,
      email: adminUser.email,
      role: adminUser.role,
      is_active: adminUser.is_active,
      email_verified: adminUser.email_verified
    });
    
    // Test password
    const testPassword = 'admin123';
    const isValid = await bcrypt.compare(testPassword, adminUser.password_hash);
    console.log('🔑 Password test result:', isValid);
    
    if (!isValid) {
      console.log('🔄 Creating new password hash...');
      const newHash = await bcrypt.hash(testPassword, 12);
      console.log('🔑 New hash:', newHash);
      
      // Update password
      await mysqlConnection.query('UPDATE users SET password_hash = ? WHERE email = ?', [newHash, 'admin@clinicalapp.com']);
      console.log('✅ Password updated successfully');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

verifyAdmin();
