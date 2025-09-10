const mysql = require('mysql2/promise');

async function checkDatabase() {
  let connection;
  try {
    console.log('=== CONNECTING TO DATABASE ===\n');
    
    connection = await mysql.createConnection({
      host: 'caresyncdb-caresync.e.aivencloud.com',
      port: 16006,
      user: 'avnadmin',
      password: 'AVNS_6xeaVpCVApextDTAKfU',
      database: 'caresync',
      ssl: { rejectUnauthorized: false }
    });
    
    console.log('Database connected successfully!\n');
    
    console.log('1. Checking users with doctor role:');
    const [users] = await connection.execute(
      'SELECT id, username, email, role FROM users WHERE role = ? LIMIT 5',
      ['doctor']
    );
    console.log(users);
    
    console.log('\n2. Checking doctors table:');
    const [doctors] = await connection.execute(
      'SELECT id, user_id, specialization, license_number FROM doctors LIMIT 5'
    );
    console.log(doctors);
    
    console.log('\n3. Checking doctor-user relationship:');
    const [relationship] = await connection.execute(`
      SELECT 
        u.id as user_id, 
        u.username, 
        u.role,
        d.id as doctor_id,
        d.user_id as doctor_user_id,
        d.specialization
      FROM users u 
      LEFT JOIN doctors d ON u.id = d.user_id 
      WHERE u.role = 'doctor'
      LIMIT 5
    `);
    console.log(relationship);
    
    console.log('\n4. Checking for orphaned doctor records:');
    const [orphaned] = await connection.execute(`
      SELECT d.id, d.user_id, d.specialization
      FROM doctors d 
      LEFT JOIN users u ON d.user_id = u.id 
      WHERE u.id IS NULL
      LIMIT 5
    `);
    console.log('Orphaned doctor records:', orphaned);
    
    console.log('\n5. Checking foreign key constraints:');
    const [constraints] = await connection.execute(`
      SELECT 
        TABLE_NAME,
        COLUMN_NAME,
        CONSTRAINT_NAME,
        REFERENCED_TABLE_NAME,
        REFERENCED_COLUMN_NAME
      FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE 
      WHERE TABLE_SCHEMA = DATABASE() 
        AND TABLE_NAME IN ('doctors', 'users')
        AND REFERENCED_TABLE_NAME IS NOT NULL
    `);
    console.log(constraints);
    
  } catch (error) {
    console.error('Database error:', error.message);
  } finally {
    if (connection) {
      await connection.end();
    }
    process.exit();
  }
}

checkDatabase();
