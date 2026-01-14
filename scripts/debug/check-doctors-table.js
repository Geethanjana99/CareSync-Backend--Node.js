// Check the structure of the doctors table
const mysql = require('mysql2/promise');

async function checkDoctorsTableStructure() {
  try {
    console.log('🔍 Checking doctors table structure...');
    
    const connection = await mysql.createConnection({
      host: 'caresyncdb-caresync.e.aivencloud.com',
      port: 16006,
      user: 'avnadmin',
      password: 'AVNS_6xeaVpCVApextDTAKfU',
      database: 'caresync',
      ssl: { rejectUnauthorized: false }
    });
    
    // Check table structure
    const [columns] = await connection.execute("DESCRIBE doctors");
    console.log('Doctors table columns:');
    columns.forEach(col => console.log(`- ${col.Field} (${col.Type})`));
    
    // Also check a sample row
    const [sampleRows] = await connection.execute("SELECT * FROM doctors LIMIT 1");
    if (sampleRows.length > 0) {
      console.log('\nSample doctor data:');
      console.log(Object.keys(sampleRows[0]));
    }
    
    await connection.end();
    
  } catch (error) {
    console.error('❌ Error checking table structure:', error.message);
  }
}

checkDoctorsTableStructure();