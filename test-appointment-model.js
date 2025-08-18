const { mysqlConnection } = require('./config/mysql');

async function testAppointmentModel() {
  try {
    console.log('Testing Appointment API endpoint...');
    
    // Wait a bit for the server to initialize
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Test the raw query to see what's in the database
    const appointments = await mysqlConnection.query(`
      SELECT a.*, 
             a.id as appointmentId,
             p.patient_id, pu.name as patientName, pu.email as patientEmail,
             d.doctor_id, du.name as doctorName, du.email as doctor_email, d.specialty as doctorSpecialty,
             a.appointment_date as appointmentDate,
             a.queue_number,
             a.appointment_type as appointmentType,
             a.reason_for_visit as reasonForVisit
      FROM appointments a
      LEFT JOIN patients p ON a.patient_id = p.id
      LEFT JOIN users pu ON p.user_id = pu.id
      LEFT JOIN doctors d ON a.doctor_id = d.id
      LEFT JOIN users du ON d.user_id = du.id
      ORDER BY a.appointment_date DESC
      LIMIT 5
    `);
    
    console.log('✅ Appointments found:', appointments.length);
    console.log('📋 Sample appointments:', JSON.stringify(appointments, null, 2));
    
  } catch (error) {
    console.error('❌ Error testing appointment model:', error);
  }
  
  process.exit(0);
}

testAppointmentModel();
