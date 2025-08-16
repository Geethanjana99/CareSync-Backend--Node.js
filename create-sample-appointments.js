const { mysqlConnection } = require('./config/mysql');
const { v4: uuidv4 } = require('uuid');

async function createSampleData() {
  try {
    console.log('Creating sample appointment data...');
    
    // Wait for database connection
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // First, let's check what data we already have
    const appointments = await mysqlConnection.query('SELECT COUNT(*) as count FROM appointments');
    console.log('Current appointments count:', appointments[0].count);
    
    if (appointments[0].count > 0) {
      console.log('Appointments already exist. Let\'s check the structure:');
      const sampleAppointments = await mysqlConnection.query(`
        SELECT a.*, 
               p.patient_id, pu.name as patient_name, pu.email as patient_email,
               d.doctor_id, du.name as doctor_name, du.email as doctor_email, d.specialty
        FROM appointments a
        LEFT JOIN patients p ON a.patient_id = p.id
        LEFT JOIN users pu ON p.user_id = pu.id
        LEFT JOIN doctors d ON a.doctor_id = d.id
        LEFT JOIN users du ON d.user_id = du.id
        LIMIT 3
      `);
      console.log('Sample appointments with joins:', JSON.stringify(sampleAppointments, null, 2));
      return;
    }
    
    // Get sample patient and doctor
    const patients = await mysqlConnection.query('SELECT * FROM patients LIMIT 1');
    const doctors = await mysqlConnection.query('SELECT * FROM doctors LIMIT 1');
    
    if (patients.length === 0 || doctors.length === 0) {
      console.log('No patients or doctors found. Cannot create sample appointments.');
      return;
    }
    
    const patient = patients[0];
    const doctor = doctors[0];
    
    console.log('Found patient:', patient.id, 'and doctor:', doctor.id);
    
    // Create sample appointment
    const appointmentData = {
      id: uuidv4(),
      appointment_id: 'APT-001',
      patient_id: patient.id,
      doctor_id: doctor.id,
      appointment_date: '2025-08-17',
      appointment_time: '10:00:00',
      appointment_type: 'consultation',
      status: 'scheduled',
      reason_for_visit: 'Regular checkup',
      symptoms: 'General wellness check',
      priority: 'medium',
      consultation_fee: 100
    };
    
    const insertQuery = `
      INSERT INTO appointments (
        id, appointment_id, patient_id, doctor_id, appointment_date, appointment_time,
        appointment_type, status, reason_for_visit, symptoms, priority, consultation_fee
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    
    await mysqlConnection.query(insertQuery, [
      appointmentData.id,
      appointmentData.appointment_id,
      appointmentData.patient_id,
      appointmentData.doctor_id,
      appointmentData.appointment_date,
      appointmentData.appointment_time,
      appointmentData.appointment_type,
      appointmentData.status,
      appointmentData.reason_for_visit,
      appointmentData.symptoms,
      appointmentData.priority,
      appointmentData.consultation_fee
    ]);
    
    console.log('✅ Sample appointment created successfully!');
    
    // Test the fetch with joins
    const testAppointment = await mysqlConnection.query(`
      SELECT a.*, 
             a.id as appointmentId,
             p.patient_id, pu.name as patientName, pu.email as patientEmail,
             d.doctor_id, du.name as doctorName, du.email as doctor_email, d.specialty as doctorSpecialty,
             a.appointment_date as appointmentDate,
             a.appointment_time as appointmentTime,
             a.appointment_type as appointmentType,
             a.reason_for_visit as reasonForVisit
      FROM appointments a
      LEFT JOIN patients p ON a.patient_id = p.id
      LEFT JOIN users pu ON p.user_id = pu.id
      LEFT JOIN doctors d ON a.doctor_id = d.id
      LEFT JOIN users du ON d.user_id = du.id
      WHERE a.id = ?
    `, [appointmentData.id]);
    
    console.log('✅ Test fetch result:', JSON.stringify(testAppointment, null, 2));
    
  } catch (error) {
    console.error('❌ Error creating sample data:', error);
  }
  
  process.exit(0);
}

// Wait for server to start, then create sample data
setTimeout(createSampleData, 3000);
