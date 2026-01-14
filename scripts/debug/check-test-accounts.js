const { mysqlConnection } = require('./config/mysql');

async function checkUsers() {
  try {
    const users = await mysqlConnection.query(`
      SELECT u.id, u.email, u.name, u.role 
      FROM users u 
      WHERE u.role IN ('doctor', 'patient') 
      ORDER BY u.role, u.id 
      LIMIT 10
    `);
    
    console.log('Available test accounts:');
    console.log('========================');
    
    users.forEach(user => {
      console.log(`${user.role.toUpperCase()}: ${user.email} - ${user.name} (ID: ${user.id})`);
    });
    
    // Check for appointments today
    const today = new Date().toISOString().split('T')[0];
    const appointments = await mysqlConnection.query(`
      SELECT 
        a.id,
        a.queue_number,
        a.payment_status,
        a.status,
        a.is_emergency,
        pu.name as patient_name,
        pu.email as patient_email,
        du.name as doctor_name,
        du.email as doctor_email
      FROM appointments a
      JOIN patients p ON a.patient_id = p.id
      JOIN users pu ON p.user_id = pu.id
      JOIN doctors d ON a.doctor_id = d.id
      JOIN users du ON d.user_id = du.id
      WHERE a.queue_date = ?
      ORDER BY a.is_emergency DESC, a.queue_number ASC
    `, [today]);
    
    console.log(`\nAppointments for today (${today}):`);
    console.log('==================================');
    
    if (appointments.length > 0) {
      appointments.forEach((apt, i) => {
        console.log(`${i+1}. Queue #${apt.queue_number} - ${apt.patient_name} (${apt.patient_email})`);
        console.log(`   Doctor: ${apt.doctor_name} (${apt.doctor_email})`);
        console.log(`   Payment: ${apt.payment_status} | Status: ${apt.status} | Emergency: ${apt.is_emergency}`);
        console.log('');
      });
    } else {
      console.log('No appointments found for today');
    }
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

checkUsers();