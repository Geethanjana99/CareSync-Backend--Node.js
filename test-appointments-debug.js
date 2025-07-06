const { mysqlConnection } = require('./config/mysql');

async function testAppointmentsQuery() {
  try {
    console.log('Testing appointments query...');
    
    // Initialize the connection
    await mysqlConnection.connect();
    console.log('Database connected successfully');
    
    // First, let's check if we have any doctors
    const doctors = await mysqlConnection.query('SELECT * FROM doctors LIMIT 5');
    console.log('Doctors found:', doctors.length);
    
    if (doctors.length > 0) {
      console.log('First doctor:', doctors[0]);
      
      // Check if this doctor has any appointments
      const appointments = await mysqlConnection.query(`
        SELECT 
          a.id,
          a.appointment_id,
          a.patient_id,
          a.queue_number,
          a.status,
          a.priority,
          a.is_emergency,
          a.reason_for_visit,
          a.symptoms,
          u.name,
          u.email,
          u.phone
        FROM appointments a
        JOIN patients p ON a.patient_id = p.id
        JOIN users u ON p.user_id = u.id
        WHERE a.doctor_id = ?
        LIMIT 5
      `, [doctors[0].id]);
      
      console.log('Appointments found:', appointments.length);
      if (appointments.length > 0) {
        console.log('First appointment:', appointments[0]);
      }
    }
    
    // Test the specific query that's failing
    const today = new Date().toISOString().split('T')[0];
    console.log('Today:', today);
    
    // Get a sample doctor's user_id
    const doctorWithUser = await mysqlConnection.query(`
      SELECT d.id, d.user_id, u.name as doctor_name
      FROM doctors d
      JOIN users u ON d.user_id = u.id
      LIMIT 1
    `);
    
    if (doctorWithUser.length > 0) {
      console.log('Doctor with user:', doctorWithUser[0]);
      
      // Test the actual failing query
      const todayAppointments = await mysqlConnection.query(`
        SELECT 
          a.id,
          a.appointment_id,
          a.patient_id,
          a.queue_number,
          a.status,
          a.priority,
          a.is_emergency,
          a.reason_for_visit,
          a.symptoms,
          u.name,
          u.email,
          u.phone
        FROM appointments a
        JOIN patients p ON a.patient_id = p.id
        JOIN users u ON p.user_id = u.id
        WHERE a.doctor_id = ? AND a.queue_date = ?
        ORDER BY a.is_emergency DESC, a.queue_number ASC
      `, [doctorWithUser[0].id, today]);
      
      console.log('Today appointments found:', todayAppointments.length);
      if (todayAppointments.length > 0) {
        console.log('First today appointment:', todayAppointments[0]);
      }
    }
    
  } catch (error) {
    console.error('Error in test:', error);
  }
  
  process.exit(0);
}

testAppointmentsQuery();
