const { mysqlConnection } = require('./config/mysql');

async function checkAllAppointmentsForDoctor() {
  try {
    const doctorId = '11aedc76-46d6-4907-83ee-152d097196b8';
    
    console.log(`Checking all appointments for doctor: ${doctorId}`);
    
    // Check appointments with appointment_id (the string ID like APT-041)
    const appointmentIdQuery = `
      SELECT appointment_id, id, patient_id, status, appointment_date, created_at
      FROM appointments 
      WHERE doctor_id = ?
      ORDER BY created_at DESC
    `;
    
    const appointments = await mysqlConnection.query(appointmentIdQuery, [doctorId]);
    console.log('\nAll appointments:', appointments);
    
    // Check if there are different doctor_id values in appointments
    const doctorIdsQuery = `
      SELECT DISTINCT doctor_id, COUNT(*) as count
      FROM appointments 
      GROUP BY doctor_id
      LIMIT 10
    `;
    
    const doctorIds = await mysqlConnection.query(doctorIdsQuery);
    console.log('\nAll doctor IDs with appointments:', doctorIds);
    
    // Check patients for this doctor 
    const patientsQuery = `
      SELECT DISTINCT p.id, u.name, COUNT(a.id) as appointment_count
      FROM patients p
      INNER JOIN appointments a ON p.id = a.patient_id
      INNER JOIN users u ON p.user_id = u.id
      WHERE a.doctor_id = ?
      GROUP BY p.id, u.name
    `;
    
    const patients = await mysqlConnection.query(patientsQuery, [doctorId]);
    console.log('\nPatients for this doctor:', patients);
    
  } catch (error) {
    console.error('Error:', error.message);
  }
}

checkAllAppointmentsForDoctor();