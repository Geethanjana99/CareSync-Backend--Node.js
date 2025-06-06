// filepath: e:\Project 2\backend\scripts\testConnection.js
const { mysqlConnection } = require('../config/mysql');

async function testConnection() {
  try {
    console.log('🔄 Testing MySQL connection...');
    
    await mysqlConnection.connect();
    
    // Test basic query
    const result = await mysqlConnection.query('SELECT COUNT(*) as total_users FROM users');
    console.log('📊 Total users in database:', result[0].total_users);
    
    // Test admin user
    const adminUser = await mysqlConnection.query('SELECT name, email, role, created_at FROM users WHERE role = "admin"');
    console.log('👤 Admin user details:', adminUser[0]);
    
    // Test all tables
    const tables = await mysqlConnection.query('SHOW TABLES');
    console.log('📋 Available tables:', tables.map(row => Object.values(row)[0]));
    
    console.log('✅ Connection test successful!');
    
  } catch (error) {
    console.error('❌ Connection test failed:', error.message);
  }
}

testConnection();