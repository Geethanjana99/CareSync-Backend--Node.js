const mysql = require('mysql2/promise');

async function checkUsers() {
  try {
    console.log('🔗 Connecting to database...');
    const connection = await mysql.createConnection({
      host: 'caresyncdb-caresync.e.aivencloud.com',
      port: 16006,
      user: 'avnadmin',
      password: 'AVNS_6xeaVpCVApextDTAKfU',
      database: 'caresync',
      ssl: {
        rejectUnauthorized: false
      }
    });
    
    console.log('✅ Connected to database');
    
    // Check users
    const [users] = await connection.execute('SELECT id, name, email, role FROM users LIMIT 10');
    console.log('\n📋 Sample users:');
    users.forEach(user => {
      console.log(`  - ${user.name} (${user.email}) - Role: ${user.role} - ID: ${user.id}`);
    });
    
    // Check appointments table structure
    const [columns] = await connection.execute('DESCRIBE appointments');
    console.log('\n📋 Appointments table columns:');
    columns.forEach(col => console.log(`  - ${col.Field} (${col.Type})`));
    
    await connection.end();
    console.log('\n🔌 Database connection closed');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

checkUsers();
