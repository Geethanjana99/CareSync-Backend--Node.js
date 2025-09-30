const { mysqlConnection } = require('./config/mysql');

async function checkDoctorData() {
  try {
    // First, let's see what doctor this email corresponds to
    const userQuery = `
      SELECT u.id as user_id, u.name, u.email, d.id as doctor_id, d.doctor_id as doctor_code
      FROM users u
      LEFT JOIN doctors d ON u.id = d.user_id
      WHERE u.email = 'doctor@gmail.com'
    `;
    
    const [userData] = await mysqlConnection.query(userQuery);
    console.log('Doctor account info:');
    console.log(userData);
    
    if (userData.length > 0) {
      const doctorId = userData[0].doctor_id;
      
      // Now check appointments for this doctor
      const appointmentsQuery = `
        SELECT a.*, p.id as patient_id, u.name as patient_name
        FROM appointments a
        INNER JOIN patients p ON a.patient_id = p.id
        INNER JOIN users u ON p.user_id = u.id
        WHERE a.doctor_id = ?
        LIMIT 10
      `;
      
      const [appointments] = await mysqlConnection.query(appointmentsQuery, [doctorId]);
      console.log('\nAppointments for this doctor:');
      console.log(appointments);
      
      // Let's also check all appointments to see what doctor IDs exist
      const allDoctorsQuery = `
        SELECT DISTINCT a.doctor_id, d.doctor_id as doctor_code, u.name as doctor_name, u.email
        FROM appointments a
        LEFT JOIN doctors d ON a.doctor_id = d.id
        LEFT JOIN users u ON d.user_id = u.id
        LIMIT 10
      `;
      
      const [allDoctors] = await mysqlConnection.query(allDoctorsQuery);
      console.log('\nAll doctors with appointments:');
      console.log(allDoctors);
    }
    
  } catch (error) {
    console.error('Error:', error.message);
  }
}

checkDoctorData();