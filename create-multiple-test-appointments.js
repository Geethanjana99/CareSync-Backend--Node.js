const { mysqlConnection } = require('./config/mysql');

async function createMultipleTestAppointments() {
  try {
    console.log('Creating multiple test appointments for today...');
    
    // Initialize the connection
    await mysqlConnection.connect();
    console.log('Database connected successfully');
    
    const today = new Date().toISOString().split('T')[0];
    console.log('Today:', today);
    
    // Get a doctor
    const doctors = await mysqlConnection.query('SELECT * FROM doctors WHERE doctor_id = ? LIMIT 1', ['D011']);
    if (doctors.length === 0) {
      console.log('No doctors found');
      return;
    }
    
    const doctor = doctors[0];
    console.log('Using doctor:', doctor.doctor_id);
    
    // Get patients
    const patients = await mysqlConnection.query('SELECT * FROM patients LIMIT 5');
    if (patients.length === 0) {
      console.log('No patients found');
      return;
    }
    
    // Create 3 more appointments
    for (let i = 2; i <= 4; i++) {
      const patient = patients[i % patients.length];
      const appointmentId = 'APT-' + Date.now() + '-' + i;
      
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
        i,
        'scheduled',
        i === 3 ? 'high' : 'medium',
        i === 4 ? 1 : 0,
        `Test appointment ${i} for today`,
        `Test symptoms ${i}`,
      ]);
      
      console.log(`Created appointment ${i}:`, appointmentId);
    }
    
    console.log('All test appointments created successfully');
    
    // Verify all appointments were created
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
    
    console.log('Total appointments found for today:', appointments.length);
    appointments.forEach((apt, index) => {
      console.log(`${index + 1}. ${apt.appointment_id} - ${apt.name} - Queue: ${apt.queue_number} - Status: ${apt.status} - Priority: ${apt.priority} - Emergency: ${apt.is_emergency}`);
    });
    
  } catch (error) {
    console.error('Error creating test appointments:', error);
  }
  
  process.exit(0);
}

createMultipleTestAppointments();
