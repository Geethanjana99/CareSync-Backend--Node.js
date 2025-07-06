const { mysqlConnection } = require('./config/mysql');

async function testApiEndpoint() {
  try {
    console.log('Testing API endpoint logic...');
    
    // Initialize the connection
    await mysqlConnection.connect();
    console.log('Database connected successfully');
    
    const today = new Date().toISOString().split('T')[0];
    console.log('Today:', today);
    
    // Simulate the API call - get doctor by user_id
    const userId = 'cd65f3be-0af9-412c-af72-c57c92b0a83c'; // This is from the first doctor we saw
    
    // Get doctor's ID from doctors table
    const doctor = await mysqlConnection.query(
      'SELECT id FROM doctors WHERE user_id = ?',
      [userId]
    );
    
    if (doctor.length === 0) {
      console.log('Doctor not found');
      return;
    }
    
    const doctorDbId = doctor[0].id;
    console.log('Doctor DB ID:', doctorDbId);
    
    // Get appointments for today (exact same query as in the API)
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
      WHERE a.doctor_id = ? AND a.queue_date = ?
      ORDER BY a.is_emergency DESC, a.queue_number ASC
    `, [doctorDbId, today]);
    
    console.log('Appointments found for this doctor today:', appointments.length);
    appointments.forEach((apt, index) => {
      console.log(`${index + 1}. ${apt.appointment_id} - ${apt.name} - Queue: ${apt.queue_number} - Status: ${apt.status} - Priority: ${apt.priority} - Emergency: ${apt.is_emergency}`);
    });
    
    // Test the exact response format
    console.log('\nAPI Response format:');
    console.log(JSON.stringify(appointments, null, 2));
    
  } catch (error) {
    console.error('Error testing API endpoint:', error);
  }
  
  process.exit(0);
}

testApiEndpoint();
