const mysql = require('mysql2/promise');

async function checkDoctorRelationship() {
  let connection;
  try {
    console.log('=== CHECKING DOCTOR-USER RELATIONSHIP ===\n');
    
    connection = await mysql.createConnection({
      host: 'caresyncdb-caresync.e.aivencloud.com',
      port: 16006,
      user: 'avnadmin',
      password: 'AVNS_6xeaVpCVApextDTAKfU',
      database: 'caresync',
      ssl: { rejectUnauthorized: false }
    });
    
    console.log('Database connected successfully!\n');
    
    console.log('1. Doctor users from users table:');
    const [doctorUsers] = await connection.execute(
      'SELECT id, name, email, role FROM users WHERE role = ? ORDER BY created_at DESC',
      ['doctor']
    );
    console.log(doctorUsers);
    
    console.log('\n2. Doctor records from doctors table:');
    const [doctorRecords] = await connection.execute(
      'SELECT id, user_id, doctor_id, specialty FROM doctors ORDER BY created_at DESC'
    );
    console.log(doctorRecords);
    
    console.log('\n3. Join to check relationship:');
    const [joinedData] = await connection.execute(`
      SELECT 
        u.id as user_id, 
        u.name as user_name, 
        u.email,
        d.id as doctor_record_id,
        d.user_id as doctor_user_id,
        d.doctor_id,
        d.specialty,
        CASE 
          WHEN d.user_id IS NULL THEN 'NO_DOCTOR_RECORD'
          WHEN d.user_id = u.id THEN 'MATCHED'
          ELSE 'MISMATCHED'
        END as relationship_status
      FROM users u 
      LEFT JOIN doctors d ON u.id = d.user_id 
      WHERE u.role = 'doctor'
      ORDER BY u.created_at DESC
    `);
    console.log(joinedData);
    
    console.log('\n4. Check if any doctor users are missing doctor records:');
    const [missingRecords] = await connection.execute(`
      SELECT u.id, u.name, u.email 
      FROM users u 
      LEFT JOIN doctors d ON u.id = d.user_id 
      WHERE u.role = 'doctor' AND d.user_id IS NULL
    `);
    console.log('Users with doctor role but no doctor record:', missingRecords);
    
  } catch (error) {
    console.error('Database error:', error.message);
  } finally {
    if (connection) {
      await connection.end();
    }
    process.exit();
  }
}

checkDoctorRelationship();
