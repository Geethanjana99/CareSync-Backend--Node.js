const { mysqlConnection } = require('./config/mysql');

async function createTestAppointmentForToday() {
  try {
    console.log('Creating test appointment for today...');
    
    // Initialize the connection
    await mysqlConnection.connect();
    console.log('Database connected successfully');
    
    const today = new Date().toISOString().split('T')[0];
    console.log('Today:', today);
    
    // Get a doctor
    const doctors = await mysqlConnection.query('SELECT * FROM doctors LIMIT 1');
    if (doctors.length === 0) {
      console.log('No doctors found');
      return;
    }
    
    const doctor = doctors[0];
    console.log('Using doctor:', doctor.doctor_id);
    
    // Get a patient
    const patients = await mysqlConnection.query('SELECT * FROM patients LIMIT 1');
    if (patients.length === 0) {
      console.log('No patients found');
      return;
    }
    
    const patient = patients[0];
    console.log('Using patient:', patient.patient_id);
    
    // Create appointment ID
    const appointmentId = 'APT-' + Date.now();
    
    // Insert appointment
    await mysqlConnection.query(`
      INSERT INTO appointments (
        appointment_id, doctor_id, patient_id, appointment_date,
        queue_date, queue_number, status, priority, is_emergency, reason_for_visit,
        symptoms
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      appointmentId,
      doctor.id,
      patient.id,
      today,
      today,
      1,
      'scheduled',
      'medium',
      0,
      'Test appointment for today',
      'General checkup',
    ]);
    
    console.log('Test appointment created successfully:', appointmentId);
    
    // Verify the appointment was created
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
    `, [doctor.id, today]);
    
    console.log('Appointments found for today:', appointments.length);
    if (appointments.length > 0) {
      console.log('First appointment:', appointments[0]);
    }
    
  } catch (error) {
    console.error('Error creating test appointment:', error);
  }
  
  process.exit(0);
}

createTestAppointmentForToday();
