const { mysqlConnection } = require('./config/mysql');

async function testEndpoints() {
  try {
    console.log('Testing doctor queue endpoints...');
    
    // Initialize connection
    await mysqlConnection.connect();
    
    // Get a test doctor user
    const testUser = await mysqlConnection.query('SELECT * FROM users WHERE role = ? LIMIT 1', ['doctor']);
    if (testUser.length === 0) {
      console.log('No doctor users found');
      return;
    }
    
    const doctorUserId = testUser[0].id;
    console.log('Testing with doctor user ID:', doctorUserId);
    
    // Test get availability
    console.log('\n1. Testing get availability...');
    const availability = await mysqlConnection.query(
      'SELECT working_hours, availability_status FROM doctors WHERE user_id = ?',
      [doctorUserId]
    );
    console.log('Availability result:', availability);
    
    // Test get doctor ID
    console.log('\n2. Testing get doctor ID...');
    const doctor = await mysqlConnection.query(
      'SELECT id FROM doctors WHERE user_id = ?',
      [doctorUserId]
    );
    console.log('Doctor ID result:', doctor);
    
    if (doctor.length === 0) {
      console.log('No doctor record found for user ID:', doctorUserId);
      return;
    }
    
    const doctorDbId = doctor[0].id;
    console.log('Doctor DB ID:', doctorDbId);
    
    // Test get today's appointments
    console.log('\n3. Testing get today appointments...');
    const today = new Date().toISOString().split('T')[0];
    console.log('Today date:', today);
    
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
    
    console.log('Appointments result length:', appointments.length);
    if (appointments.length > 0) {
      console.log('First appointment:', appointments[0]);
    }
    
    // Test update working hours
    console.log('\n4. Testing update working hours...');
    const testWorkingHours = {
      monday: { start: '09:00', end: '17:00' },
      tuesday: { start: '09:00', end: '17:00' }
    };
    
    await mysqlConnection.query(
      'UPDATE doctors SET working_hours = ? WHERE user_id = ?',
      [JSON.stringify(testWorkingHours), doctorUserId]
    );
    console.log('Working hours updated successfully');
    
    // Test update availability status
    console.log('\n5. Testing update availability status...');
    await mysqlConnection.query(
      'UPDATE doctors SET availability_status = ? WHERE user_id = ?',
      ['available', doctorUserId]
    );
    console.log('Availability status updated successfully');
    
    process.exit(0);
  } catch (error) {
    console.error('Test error:', error);
    process.exit(1);
  }
}

testEndpoints();
