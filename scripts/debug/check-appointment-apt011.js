const mysql = require('mysql2/promise');

// Database connection
const connection = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: 'password',
  database: 'clinical_appointment_system',
  port: 3306
});

async function checkAppointment() {
  try {
    console.log('Connecting to database...');

    // Check if appointment APT-011 exists
    const [appointments] = await connection.execute(
      'SELECT * FROM appointments WHERE id = ?', 
      ['APT-011']
    );

    console.log('\n=== Appointment APT-011 Results ===');
    if (appointments.length === 0) {
      console.log('❌ Appointment APT-011 NOT FOUND');
      
      // Let's see what appointments exist
      const [allAppointments] = await connection.execute(
        'SELECT id, doctor_id, patient_id, status FROM appointments ORDER BY created_at DESC LIMIT 10'
      );
      
      console.log('\n=== Recent Appointments ===');
      allAppointments.forEach(apt => {
        console.log(`ID: ${apt.id}, Doctor: ${apt.doctor_id}, Patient: ${apt.patient_id}, Status: ${apt.status}`);
      });
    } else {
      console.log('✅ Appointment APT-011 found:');
      console.log(JSON.stringify(appointments[0], null, 2));
    }

    await connection.end();
  } catch (error) {
    console.error('Database error:', error.message);
    process.exit(1);
  }
}

checkAppointment();