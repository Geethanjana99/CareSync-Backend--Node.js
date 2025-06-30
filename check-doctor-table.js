const mysql = require('mysql2/promise');

async function checkDoctorTable() {
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
    
    // Check doctor table structure
    const [columns] = await connection.execute('DESCRIBE doctors');
    console.log('\n📋 Doctor table columns:');
    columns.forEach(col => console.log(`  - ${col.Field} (${col.Type})`));
    
    // Check users table structure
    const [userColumns] = await connection.execute('DESCRIBE users');
    console.log('\n📋 Users table columns:');
    userColumns.forEach(col => console.log(`  - ${col.Field} (${col.Type})`));
    
    // Check sample data
    const [doctors] = await connection.execute(`
      SELECT d.doctor_id, d.specialty, d.working_hours, d.consultation_fee
      FROM doctors d 
      WHERE d.status = 'active' 
      LIMIT 3
    `);
    console.log('\n📝 Sample doctor data:');
    doctors.forEach(doc => {
      console.log({
        doctor_id: doc.doctor_id,
        specialty: doc.specialty,
        working_hours: doc.working_hours,
        consultation_fee: doc.consultation_fee
      });
    });
    
    await connection.end();
    console.log('\n🔌 Database connection closed');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

checkDoctorTable();
