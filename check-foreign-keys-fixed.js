const connectMySQL = require('./config/mysql');
const { mysqlConnection } = require('./config/mysql');

async function checkForeignKeys() {
  try {
    // Initialize database connection
    await connectMySQL();
    
    console.log('Checking foreign key constraints...');
    
    // Check all foreign key constraints in the database
    const constraints = await mysqlConnection.query(`
      SELECT 
        TABLE_NAME,
        COLUMN_NAME,
        CONSTRAINT_NAME,
        REFERENCED_TABLE_NAME,
        REFERENCED_COLUMN_NAME
      FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE 
      WHERE REFERENCED_TABLE_SCHEMA = DATABASE()
        AND REFERENCED_TABLE_NAME IS NOT NULL
      ORDER BY TABLE_NAME, COLUMN_NAME
    `);
    
    console.log('Foreign key constraints:');
    if (constraints && constraints.length > 0) {
      constraints.forEach(constraint => {
        console.log(`${constraint.TABLE_NAME}.${constraint.COLUMN_NAME} -> ${constraint.REFERENCED_TABLE_NAME}.${constraint.REFERENCED_COLUMN_NAME}`);
      });
    } else {
      console.log('No foreign key constraints found or result is empty');
    }
    
    console.log('\nChecking specific tables for doctor/user references...');
    
    // Check appointments table structure
    const appointmentsCols = await mysqlConnection.query('DESCRIBE appointments');
    console.log('\nAppointments table columns:');
    if (appointmentsCols && appointmentsCols.length > 0) {
      appointmentsCols.forEach(col => {
        if (col.Field.includes('doctor') || col.Field.includes('user')) {
          console.log(`  ${col.Field}: ${col.Type} ${col.Key} ${col.Extra}`);
        }
      });
    }
    
    // Check if there are records in appointments with doctor_id vs user_id issues
    console.log('\nChecking appointments table data integrity...');
    const appointmentCheck = await mysqlConnection.query(`
      SELECT 
        COUNT(*) as total_appointments,
        COUNT(DISTINCT doctor_id) as unique_doctor_ids,
        MIN(doctor_id) as min_doctor_id,
        MAX(doctor_id) as max_doctor_id
      FROM appointments 
      WHERE doctor_id IS NOT NULL
    `);
    console.log('Appointments data:', appointmentCheck[0] || appointmentCheck);
    
    // Check doctors table
    const doctorCheck = await mysqlConnection.query(`
      SELECT 
        COUNT(*) as total_doctors,
        MIN(id) as min_doctor_id,
        MAX(id) as max_doctor_id,
        MIN(user_id) as min_user_id,
        MAX(user_id) as max_user_id
      FROM doctors
    `);
    console.log('Doctors data:', doctorCheck[0] || doctorCheck);
    
    // Check for potential mismatches - appointments referencing doctor IDs that don't exist
    console.log('\nChecking for appointments with invalid doctor_id references...');
    const invalidRefs = await mysqlConnection.query(`
      SELECT COUNT(*) as invalid_appointments
      FROM appointments a
      LEFT JOIN doctors d ON a.doctor_id = d.id
      WHERE a.doctor_id IS NOT NULL AND d.id IS NULL
    `);
    console.log('Invalid doctor_id references in appointments:', invalidRefs[0] || invalidRefs);
    
    // Check if appointments are using user_id instead of doctor_id
    console.log('\nChecking if appointments might be using user_id values in doctor_id field...');
    const userIdCheck = await mysqlConnection.query(`
      SELECT 
        a.doctor_id,
        u.id as user_id,
        u.full_name,
        u.role
      FROM appointments a
      JOIN users u ON a.doctor_id = u.id
      WHERE u.role = 'doctor'
      LIMIT 5
    `);
    console.log('Appointments using user_id in doctor_id field:', userIdCheck);
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    process.exit();
  }
}

checkForeignKeys();
