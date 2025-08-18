const { mysqlConnection } = require('./config/mysql');

async function checkDoctorAvailability() {
  try {
    await mysqlConnection.connect();
    const pool = mysqlConnection.getPool();
    const connection = await pool.getConnection();
    
    console.log('=== DOCTOR_AVAILABILITY TABLE STRUCTURE ===');
    const [cols] = await connection.execute('DESCRIBE doctor_availability');
    cols.forEach(col => console.log('  -', col.Field, '(' + col.Type + ')'));
    
    console.log('\n=== CHECKING CURRENT AVAILABILITY RECORDS ===');
    const [availability] = await connection.execute('SELECT COUNT(*) as count FROM doctor_availability');
    console.log('Total availability records:', availability[0].count);
    
    connection.release();
    process.exit(0);
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

checkDoctorAvailability();
