const connectMySQL = require('./config/mysql');
const { mysqlConnection } = require('./config/mysql');

async function verifyData() {
  try {
    await connectMySQL();
    
    console.log('Checking users table structure...');
    const usersCols = await mysqlConnection.query('DESCRIBE users');
    console.log('Users columns:', usersCols.map(col => col.Field));
    
    console.log('\nChecking sample appointments with doctor info...');
    const appointments = await mysqlConnection.query(`
      SELECT 
        a.id,
        a.doctor_id,
        d.id as doctor_record_id,
        d.user_id as doctor_user_id,
        u.name,
        u.role
      FROM appointments a
      LEFT JOIN doctors d ON a.doctor_id = d.id
      LEFT JOIN users u ON d.user_id = u.id
      LIMIT 5
    `);
    console.log('Appointment-Doctor relationships:', appointments);
    
    console.log('\nChecking for appointments with missing doctor records...');
    const missingDoctors = await mysqlConnection.query(`
      SELECT 
        COUNT(*) as appointments_missing_doctors,
        GROUP_CONCAT(DISTINCT a.doctor_id) as missing_doctor_ids
      FROM appointments a
      LEFT JOIN doctors d ON a.doctor_id = d.id
      WHERE d.id IS NULL
    `);
    console.log('Missing doctor records:', missingDoctors[0] || missingDoctors);
    
    console.log('\nChecking doctor users without doctor records...');
    const doctorUsersWithoutRecords = await mysqlConnection.query(`
      SELECT 
        u.id,
        u.name,
        u.role,
        d.id as doctor_record_id
      FROM users u
      LEFT JOIN doctors d ON u.id = d.user_id
      WHERE u.role = 'doctor' AND d.id IS NULL
    `);
    console.log('Doctor users without doctor records:', doctorUsersWithoutRecords);
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    process.exit();
  }
}

verifyData();
