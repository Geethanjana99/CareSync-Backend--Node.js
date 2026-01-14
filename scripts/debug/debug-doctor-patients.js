const { mysqlConnection } = require('./config/mysql');

async function debugDoctorPatients() {
  try {
    console.log('Checking doctor@gmail.com data...\n');
    
    // First, get the user and doctor info
    const userQuery = `
      SELECT u.id as user_id, u.name, u.email, d.id as doctor_id 
      FROM users u 
      LEFT JOIN doctors d ON u.id = d.user_id 
      WHERE u.email = 'doctor@gmail.com'
    `;
    
    const userData = await mysqlConnection.query(userQuery);
    console.log('User/Doctor data:', userData);
    
    if (userData && userData.length > 0 && userData[0].doctor_id) {
      const doctorId = userData[0].doctor_id;
      console.log(`\nDoctor ID: ${doctorId}`);
      
      // Check appointments for this doctor
      const appointmentsQuery = `
        SELECT COUNT(*) as appointment_count
        FROM appointments a
        WHERE a.doctor_id = ?
      `;
      
      const appointmentCount = await mysqlConnection.query(appointmentsQuery, [doctorId]);
      console.log('Appointment count:', appointmentCount);
      
      // Run the exact same query as our endpoint
      const patientsQuery = `
        SELECT DISTINCT
          p.id,
          u.name,
          u.email,
          u.phone,
          p.date_of_birth as dateOfBirth,
          p.gender,
          p.blood_type as bloodType,
          p.allergies,
          p.medical_history as medicalHistory,
          p.current_medications as currentMedications,
          COUNT(a.id) as totalAppointments,
          SUM(CASE WHEN a.status = 'completed' THEN 1 ELSE 0 END) as completedAppointments,
          SUM(CASE WHEN a.status = 'cancelled' THEN 1 ELSE 0 END) as cancelledAppointments,
          MAX(a.appointment_date) as lastVisit,
          MAX(CASE WHEN a.status = 'completed' THEN a.appointment_date END) as lastCompletedVisit,
          CASE 
            WHEN MAX(a.appointment_date) >= DATE_SUB(NOW(), INTERVAL 6 MONTH) THEN 'active'
            ELSE 'inactive'
          END as status
        FROM patients p
        INNER JOIN appointments a ON p.id = a.patient_id
        INNER JOIN users u ON p.user_id = u.id
        WHERE a.doctor_id = ?
        GROUP BY p.id, u.name, u.email, u.phone, p.date_of_birth, p.gender, p.blood_type, p.allergies, p.medical_history, p.current_medications
        ORDER BY lastVisit DESC
      `;
      
      const patients = await mysqlConnection.query(patientsQuery, [doctorId]);
      console.log('\nPatients query result:', patients);
      
      // Let's also check what doctor IDs exist in appointments
      const doctorIdsQuery = `
        SELECT DISTINCT doctor_id, COUNT(*) as appointment_count
        FROM appointments 
        GROUP BY doctor_id
        LIMIT 5
      `;
      
      const doctorIds = await mysqlConnection.query(doctorIdsQuery);
      console.log('\nDoctor IDs with appointments:', doctorIds);
    }
    
  } catch (error) {
    console.error('Debug error:', error);
  }
}

debugDoctorPatients();