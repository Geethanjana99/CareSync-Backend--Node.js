const mysql = require('mysql2/promise');

async function checkStatusColumn() {
  try {
    console.log('🔍 Checking appointments table status column...');
    
    // Create connection using the same config as the project
    const connection = await mysql.createConnection({
      host: 'caresyncdb-caresync.e.aivencloud.com',
      port: 16006,
      user: 'avnadmin',
      password: 'AVNS_6xeaVpCVApextDTAKfU',
      database: 'caresync',
      ssl: { rejectUnauthorized: false }
    });
    
    // Get table structure
    const describeResult = await connection.execute('DESCRIBE appointments');
    
    console.log('\n📋 Appointments table columns:');
    describeResult[0].forEach(col => {
      if (col.Field === 'status') {
        console.log('✅ Status column found:', col);
      }
    });
    
    // Check possible status values
    console.log('\n🔍 Checking existing status values in appointments table...');
    const statusResult = await connection.execute('SELECT DISTINCT status FROM appointments LIMIT 10');
    
    console.log('📋 Current status values:', statusResult[0].map(row => row.status));
    
    await connection.end();
    console.log('\n✅ Status column check complete');
    
  } catch (error) {
    console.error('❌ Error checking status column:', error.message);
    process.exit(1);
  }
}

checkStatusColumn();
