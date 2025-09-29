const { mysqlConnection } = require('./config/mysql');

async function checkDoctorAccounts() {
  try {
    await mysqlConnection.connect();
    
    const query = `
      SELECT u.name, u.email, u.role, d.id as doctor_id
      FROM users u 
      JOIN doctors d ON u.id = d.user_id
      WHERE u.role = 'doctor'
      ORDER BY u.name
    `;
    
    const users = await mysqlConnection.query(query);
    console.log('Doctor accounts:');
    users.forEach(user => {
      console.log(`- ${user.name} (${user.email}) - Doctor ID: ${user.doctor_id}`);
    });
    
    // Check which doctor has appointments today
    const today = new Date().toISOString().split('T')[0];
    const appointmentQuery = `
      SELECT d.id, u.name, u.email, COUNT(a.id) as appointment_count
      FROM doctors d
      JOIN users u ON d.user_id = u.id
      JOIN appointments a ON d.id = a.doctor_id
      WHERE a.queue_date = ?
      GROUP BY d.id, u.name, u.email
    `;
    
    const doctorsWithAppts = await mysqlConnection.query(appointmentQuery, [today]);
    console.log('\nDoctors with appointments today:');
    doctorsWithAppts.forEach(doc => {
      console.log(`- ${doc.name} (${doc.email}) - ${doc.appointment_count} appointments`);
    });
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    process.exit();
  }
}

checkDoctorAccounts();