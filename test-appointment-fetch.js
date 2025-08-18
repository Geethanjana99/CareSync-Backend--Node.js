const { mysqlConnection } = require('./config/mysql');

async function testAppointmentFetch() {
  try {
    console.log('Testing appointment fetch with joins...');
    
    const query = `
      SELECT a.*, 
             a.id as appointmentId,
             p.patient_id, pu.name as patientName, pu.email as patientEmail, 
             d.doctor_id, du.name as doctorName, du.email as doctor_email,
             d.specialty as doctorSpecialty, d.consultation_fee as doctor_fee,
             a.appointment_date as appointmentDate,
             a.appointment_time as appointmentTime,
             a.appointment_type as appointmentType,
             a.reason_for_visit as reasonForVisit
      FROM appointments a
      LEFT JOIN patients p ON a.patient_id = p.id
      LEFT JOIN users pu ON p.user_id = pu.id
      LEFT JOIN doctors d ON a.doctor_id = d.id
      LEFT JOIN users du ON d.user_id = du.id
      ORDER BY a.appointment_date DESC
      LIMIT 5
    `;
    
    const appointments = await mysqlConnection.query(query);
    console.log('Fetched appointments:', JSON.stringify(appointments, null, 2));
    
    // Also test if there are any appointments at all
    const count = await mysqlConnection.query('SELECT COUNT(*) as total FROM appointments');
    console.log('Total appointments:', count[0].total);
    
    // Check table structure
    const structure = await mysqlConnection.query('DESCRIBE appointments');
    console.log('Appointments table structure:', structure);
    
    process.exit(0);
  } catch (error) {
    console.error('Error testing appointment fetch:', error);
    process.exit(1);
  }
}

testAppointmentFetch();
