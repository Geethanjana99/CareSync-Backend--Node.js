const { mysqlConnection } = require('./config/mysql');

async function testPatientAppointments() {
  console.log('Testing Patient Appointments API...\n');

  try {
    // Test MySQL connection
    console.log('1. Testing MySQL connection...');
    await mysqlConnection.connect();
    const pool = mysqlConnection.getPool();
    const connection = await pool.getConnection();
    console.log('✅ MySQL connection successful\n');

    // Get a sample patient ID
    console.log('2. Finding sample patient...');
    const [patients] = await connection.execute(`
      SELECT p.id, u.first_name, u.last_name, u.email 
      FROM patients p 
      JOIN users u ON p.user_id = u.id 
      LIMIT 1
    `);
    
    if (patients.length === 0) {
      console.log('❌ No patients found in database');
      console.log('Creating a test patient...');
      
      const [userResult] = await connection.execute(
        'INSERT INTO users (first_name, last_name, email, password_hash, role, is_active) VALUES (?, ?, ?, ?, ?, ?)',
        ['Test', 'Patient', 'test.patient@example.com', 'hashedpassword', 'patient', true]
      );
      
      await connection.execute(
        'INSERT INTO patients (user_id, patient_id, medical_history) VALUES (?, ?, ?)',
        [userResult.insertId, `PAT${userResult.insertId.toString().padStart(6, '0')}`, 'Test patient record']
      );
      
      const [newPatients] = await connection.execute(`
        SELECT p.id, u.first_name, u.last_name, u.email 
        FROM patients p 
        JOIN users u ON p.user_id = u.id 
        WHERE p.user_id = ?
      `, [userResult.insertId]);
      console.log('✅ Test patient created:', newPatients[0]);
    } else {
      console.log('✅ Found patient:', patients[0]);
    }

    const patientId = patients.length > 0 ? patients[0].id : 1;

    // Check for appointments
    console.log('\n3. Checking for appointments...');
    const [appointments] = await connection.execute(`
      SELECT 
        a.id,
        a.appointment_date,
        a.appointment_time,
        a.status,
        a.type as appointment_type,
        a.notes,
        CONCAT(u.first_name, ' ', u.last_name) as doctor_name,
        d.specialization as doctor_specialization,
        u.phone as doctor_phone
      FROM appointments a
      JOIN doctors d ON a.doctor_id = d.id
      JOIN users u ON d.user_id = u.id
      WHERE a.patient_id = ?
      ORDER BY a.appointment_date DESC
    `, [patientId]);

    if (appointments.length === 0) {
      console.log('❌ No appointments found for patient');
      console.log('\n4. Creating test appointments...');
      
      // Get or create a doctor
      let [doctors] = await connection.execute('SELECT id FROM doctors LIMIT 1');
      if (doctors.length === 0) {
        console.log('Creating a test doctor...');
        
        const [doctorUserResult] = await connection.execute(
          'INSERT INTO users (first_name, last_name, email, password_hash, role, is_active) VALUES (?, ?, ?, ?, ?, ?)',
          ['Test', 'Doctor', 'test.doctor@example.com', 'hashedpassword', 'doctor', true]
        );
        
        await connection.execute(
          'INSERT INTO doctors (user_id, doctor_id, license_number, specialization) VALUES (?, ?, ?, ?)',
          [doctorUserResult.insertId, `DOC${doctorUserResult.insertId.toString().padStart(6, '0')}`, `LIC${doctorUserResult.insertId}`, 'General Medicine']
        );
        
        [doctors] = await connection.execute('SELECT id FROM doctors WHERE user_id = ?', [doctorUserResult.insertId]);
        console.log('✅ Test doctor created');
      }

      const doctorId = doctors[0].id;
      
      // Create test appointments
      const testAppointments = [
        {
          date: '2025-06-25',
          time: '10:00:00',
          status: 'confirmed',
          type: 'consultation'
        },
        {
          date: '2025-06-30',
          time: '14:30:00',
          status: 'scheduled',
          type: 'follow-up'
        },
        {
          date: '2025-05-15',
          time: '09:00:00',
          status: 'completed',
          type: 'routine'
        }
      ];

      for (const apt of testAppointments) {
        const appointmentId = `APT${Date.now()}${Math.random().toString(36).substr(2, 5)}`;
        await connection.execute(
          'INSERT INTO appointments (appointment_id, patient_id, doctor_id, appointment_date, appointment_time, status, type, notes, scheduled_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
          [appointmentId, patientId, doctorId, apt.date, apt.time, apt.status, apt.type, `Test appointment - ${apt.type}`, 1]
        );
      }
      
      console.log('✅ Test appointments created');
    } else {
      console.log(`✅ Found ${appointments.length} appointments for patient`);
    }

    // Show sample data
    if (appointments.length > 0) {
      console.log('\nSample appointment data:');
      console.log(JSON.stringify(appointments[0], null, 2));
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
