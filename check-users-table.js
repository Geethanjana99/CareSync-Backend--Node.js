const mysql = require('mysql2/promise');

async function checkUsersTable() {
  let connection;
  
  try {
    console.log('🔍 Checking users table structure...');
    
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
    
    // Check table structure
    const [columns] = await connection.execute('DESCRIBE users');
    console.log('\n📋 Users table structure:');
    columns.forEach(col => {
      console.log(`  ${col.Field} - ${col.Type} (${col.Null === 'YES' ? 'NULL' : 'NOT NULL'})`);
    });
    
    // Show admin users
    const [adminRows] = await connection.execute('SELECT * FROM users WHERE role = ?', ['admin']);
    console.log('\n� Admin users:');
    if (adminRows.length === 0) {
      console.log('  No admin users found');
    } else {
      adminRows.forEach(row => {
        console.log(`  ID: ${row.id}`);
        console.log(`  Name: ${row.name}`);
        console.log(`  Email: ${row.email}`);
        console.log(`  Active: ${row.is_active}`);
        console.log(`  Created: ${row.created_at}`);
        console.log('  ---');
      });
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    if (connection) await connection.end();
  }
}

checkUsersTable();
