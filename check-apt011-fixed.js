const MySQLConnection = require('./config/mysql');

async function checkAppointment() {
  const db = new MySQLConnection();
  
  try {
    await db.connect();
    console.log('✅ Connected to database');

    // Check if appointment APT-011 exists
    const appointments = await db.query(
      'SELECT * FROM appointments WHERE id = ?', 
      ['APT-011']
    );

    console.log('\n=== Appointment APT-011 Results ===');
    if (appointments.length === 0) {
      console.log('❌ Appointment APT-011 NOT FOUND');
      
      // Let's see what appointments exist
      const allAppointments = await db.query(
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

    await db.close();
  } catch (error) {
    console.error('Database error:', error.message);
    process.exit(1);
  }
}

checkAppointment();