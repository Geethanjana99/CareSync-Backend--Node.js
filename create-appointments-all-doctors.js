const { mysqlConnection } = require('./config/mysql');

async function createAppointmentsForAllDoctors() {
  try {
    console.log('Creating appointments for all doctors for today...');
    
    // Initialize the connection
    await mysqlConnection.connect();
    console.log('Database connected successfully');
    
    const today = new Date().toISOString().split('T')[0];
    console.log('Today:', today);
    
    // Get all doctors
    const doctors = await mysqlConnection.query(`
      SELECT d.id, d.doctor_id, d.user_id, u.name, u.email
      FROM doctors d
      JOIN users u ON d.user_id = u.id
      WHERE u.role = 'doctor'
      LIMIT 10
    `);
    
    console.log('Found doctors:', doctors.length);
    
    // Get some patients
    const patients = await mysqlConnection.query('SELECT * FROM patients LIMIT 5');
    console.log('Found patients:', patients.length);
    
    if (patients.length === 0) {
      console.log('No patients found, cannot create appointments');
      return;
    }
    
    // For each doctor, create 2-3 appointments for today
    for (let i = 0; i < doctors.length; i++) {
      const doctor = doctors[i];
      console.log(`\nCreating appointments for doctor: ${doctor.name} (${doctor.doctor_id})`);
      
      // Check if doctor already has appointments for today
      const existingAppointments = await mysqlConnection.query(
        'SELECT COUNT(*) as count FROM appointments WHERE doctor_id = ? AND queue_date = ?',
        [doctor.id, today]
      );
      
      if (existingAppointments[0].count > 0) {
        console.log(`Doctor ${doctor.doctor_id} already has ${existingAppointments[0].count} appointments for today`);
        continue;
      }
      
      // Create 2-3 appointments for this doctor
      for (let j = 1; j <= 3; j++) {
        const patient = patients[j % patients.length];
        const appointmentId = `APT-${doctor.doctor_id}-${j}${Date.now().toString().slice(-6)}`;
        
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
          j,
          'scheduled',
          j === 2 ? 'high' : 'medium',
          j === 3 ? 1 : 0,
          `Test appointment ${j}`,
          `Test symptoms ${j}`,
        ]);
        
        console.log(`  Created appointment ${j}: ${appointmentId}`);
      }
    }
    
    console.log('\nTest appointments created for all doctors');
    
    // Show summary
    for (const doctor of doctors) {
      const appointments = await mysqlConnection.query(`
        SELECT 
          a.appointment_id,
          a.queue_number,
          a.status,
          a.priority,
          a.is_emergency,
          u.name as patient_name
        FROM appointments a
        JOIN patients p ON a.patient_id = p.id
        JOIN users u ON p.user_id = u.id
        WHERE a.doctor_id = ? AND a.queue_date = ?
        ORDER BY a.is_emergency DESC, a.queue_number ASC
      `, [doctor.id, today]);
      
      console.log(`\nDoctor ${doctor.name} (${doctor.doctor_id}) - ${appointments.length} appointments:`);
      appointments.forEach((apt, index) => {
        console.log(`  ${index + 1}. ${apt.appointment_id} - ${apt.patient_name} - Queue: ${apt.queue_number} - Emergency: ${apt.is_emergency}`);
      });
    }
    
  } catch (error) {
    console.error('Error creating appointments:', error);
  }
  
  process.exit(0);
}

createAppointmentsForAllDoctors();
