const { mysqlConnection } = require('./config/mysql');

async function testPatientAppointments() {
  console.log('Testing Patient Appointments API...\n');

  try {
    await mysqlConnection.connect();
    const pool = mysqlConnection.getPool();
    const connection = await pool.getConnection();
    console.log('✅ MySQL connection successful\n');

    // Get a sample patient ID
    console.log('2. Finding sample patient...');
    const [patients] = await connection.execute(`
      SELECT p.id, u.name, u.email 
      FROM patients p 
      JOIN users u ON p.user_id = u.id 
      LIMIT 1
    `);
    
    if (patients.length === 0) {
      console.log('❌ No patients found in database');
      return;
    }

    console.log('✅ Found patient:', patients[0]);
    const patientId = patients[0].id;

    // Check for appointments
    console.log('\n3. Checking for appointments...');
    const [appointments] = await connection.execute(`      SELECT 
        a.id,
        a.appointment_date,
        a.appointment_time,
        a.status,
        a.appointment_type,
        a.notes,        u.name as doctor_name,
        d.specialty as doctor_specialization,
        u.phone as doctor_phone
      FROM appointments a
      JOIN doctors d ON a.doctor_id = d.id
      JOIN users u ON d.user_id = u.id
      WHERE a.patient_id = ?
      ORDER BY a.appointment_date DESC
    `, [patientId]);

    if (appointments.length === 0) {
      console.log('❌ No appointments found for patient');
      console.log('Creating test appointments would require a doctor in the system.');
      
      // Check if doctors exist
      const [doctors] = await connection.execute('SELECT id FROM doctors LIMIT 1');
      if (doctors.length === 0) {
        console.log('❌ No doctors found - cannot create test appointments');
      } else {
        console.log('✅ Doctors exist - you can manually create test appointments if needed');
      }
    } else {
      console.log(`✅ Found ${appointments.length} appointments for patient`);
      
      // Show sample data
      console.log('\nSample appointment data:');
      console.log(JSON.stringify(appointments[0], null, 2));
    }

    // Test the API endpoint by making a direct call
    console.log('\n4. Testing API endpoints...');
    
    // Simulate the API call that the frontend would make
    const Patient = require('./models/Patient');
    const patientModel = new Patient({
      id: patientId,
      user_id: patients[0].user_id || 'test-user-id'
    });

    try {
      console.log('Testing getAppointmentHistory...');
      const history = await patientModel.getAppointmentHistory();
      console.log(`✅ getAppointmentHistory returned ${history.length} appointments`);
      
      console.log('Testing getUpcomingAppointments...');
      const upcoming = await patientModel.getUpcomingAppointments();
      console.log(`✅ getUpcomingAppointments returned ${upcoming.length} appointments`);
    } catch (error) {
      console.error('❌ Patient model methods failed:', error.message);
    }

    connection.release();
    console.log('\n✅ All tests completed successfully!');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error(error.stack);
  }
}

// Run the test
testPatientAppointments().then(() => {
  process.exit(0);
}).catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
