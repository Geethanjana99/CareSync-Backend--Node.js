const mysql = require('mysql2/promise');

async function checkForeignKeys() {
  let connection;
  try {
    connection = await mysql.createConnection({
      host: 'mysql-17b9b4e4-geethanjana-dcb0.l.aivencloud.com',
      port: 20050,
      user: 'avnadmin',
      password: 'AVNS_0OKiVwUtH6Bm0x5LKru',
      database: 'defaultdb',
      ssl: { rejectUnauthorized: false }
    });
    
    console.log('Checking foreign key constraints...');
    
    // Check all foreign key constraints in the database
    const [constraints] = await connection.execute(`
      SELECT 
        TABLE_NAME,
        COLUMN_NAME,
        CONSTRAINT_NAME,
        REFERENCED_TABLE_NAME,
        REFERENCED_COLUMN_NAME
      FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE 
      WHERE REFERENCED_TABLE_SCHEMA = 'defaultdb'
        AND REFERENCED_TABLE_NAME IS NOT NULL
      ORDER BY TABLE_NAME, COLUMN_NAME
    `);
    
    console.log('Foreign key constraints:');
    constraints.forEach(constraint => {
      console.log(`${constraint.TABLE_NAME}.${constraint.COLUMN_NAME} -> ${constraint.REFERENCED_TABLE_NAME}.${constraint.REFERENCED_COLUMN_NAME}`);
    });
    
    console.log('\nChecking specific tables for doctor/user references...');
    
    // Check appointments table structure
    const [appointmentsCols] = await connection.execute('DESCRIBE appointments');
    console.log('\nAppointments table columns:');
    appointmentsCols.forEach(col => {
      if (col.Field.includes('doctor') || col.Field.includes('user')) {
        console.log(`  ${col.Field}: ${col.Type} ${col.Key} ${col.Extra}`);
      }
    });
    
    // Check if there are records in appointments with doctor_id vs user_id issues
    console.log('\nChecking appointments table data integrity...');
    const [appointmentCheck] = await connection.execute(`
      SELECT 
        COUNT(*) as total_appointments,
        COUNT(DISTINCT doctor_id) as unique_doctor_ids,
        MIN(doctor_id) as min_doctor_id,
        MAX(doctor_id) as max_doctor_id
      FROM appointments 
      WHERE doctor_id IS NOT NULL
    `);
    console.log('Appointments data:', appointmentCheck[0]);
    
    // Check doctors table
    const [doctorCheck] = await connection.execute(`
      SELECT 
        COUNT(*) as total_doctors,
        MIN(id) as min_doctor_id,
        MAX(id) as max_doctor_id
      FROM doctors
    `);
    console.log('Doctors data:', doctorCheck[0]);
    
    // Check for potential mismatches
    console.log('\nChecking for appointments with invalid doctor_id references...');
    const [invalidRefs] = await connection.execute(`
      SELECT COUNT(*) as invalid_appointments
      FROM appointments a
      LEFT JOIN doctors d ON a.doctor_id = d.id
      WHERE a.doctor_id IS NOT NULL AND d.id IS NULL
    `);
    console.log('Invalid doctor_id references in appointments:', invalidRefs[0]);
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    if (connection) await connection.end();
    process.exit();
  }
}

checkForeignKeys();
