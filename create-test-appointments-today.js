const { mysqlConnection } = require('./config/mysql');

async function createTestAppointments() {
  try {
    console.log('Creating test appointments for today...');
    
    // Initialize connection
    await mysqlConnection.connect();
    
    // Get test doctor
    const testDoctor = await mysqlConnection.query(
      'SELECT id FROM doctors WHERE user_id = ?',
      ['11b21ad9-b85b-4d6a-89b0-7df8839db730']
    );
    
    if (testDoctor.length === 0) {
      console.log('No test doctor found');
      return;
    }
    
    const doctorId = testDoctor[0].id;
    console.log('Doctor ID:', doctorId);
    
    // Get test patients
    const testPatients = await mysqlConnection.query(
      'SELECT id FROM patients LIMIT 3'
    );
    
    if (testPatients.length === 0) {
      console.log('No test patients found');
      return;
    }
    
    const today = new Date().toISOString().split('T')[0];
    
    // Create test appointments
    for (let i = 0; i < testPatients.length; i++) {
      const patientId = testPatients[i].id;
      const queueNumber = i + 1;
      
      const appointmentData = {
        appointment_id: `APT-${Date.now()}-${i}`,
        patient_id: patientId,
        doctor_id: doctorId,
        appointment_date: today,
        queue_date: today,
        queue_number: queueNumber,
        status: 'scheduled',
        priority: 'medium',
        is_emergency: false,
        reason_for_visit: `Test appointment ${i + 1}`,
        symptoms: `Test symptoms ${i + 1}`,
        notes: `Test notes ${i + 1}`,
        created_at: new Date()
      };
      
      await mysqlConnection.query(
        `INSERT INTO appointments (appointment_id, patient_id, doctor_id, appointment_date, queue_date, queue_number, status, priority, is_emergency, reason_for_visit, symptoms, notes, created_at) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          appointmentData.appointment_id,
          appointmentData.patient_id,
          appointmentData.doctor_id,
          appointmentData.appointment_date,
          appointmentData.queue_date,
          appointmentData.queue_number,
          appointmentData.status,
          appointmentData.priority,
          appointmentData.is_emergency,
          appointmentData.reason_for_visit,
          appointmentData.symptoms,
          appointmentData.notes,
          appointmentData.created_at
        ]
      );
      
      console.log(`Created appointment ${i + 1} for patient ${patientId}`);
    }
    
    console.log('Test appointments created successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error creating test appointments:', error);
    process.exit(1);
  }
}

createTestAppointments();
