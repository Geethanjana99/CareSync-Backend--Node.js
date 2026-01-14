const mysql = require('mysql2/promise');

async function checkAppointmentById() {
  let connection;
  
  try {
    // Connect to Aiven cloud database
    connection = await mysql.createConnection({
      host: 'caresyncdb-caresync.e.aivencloud.com',
      port: 16006,
      user: 'avnadmin',
      password: 'AVNS_6xeaVpCVApextDTAKfU',
      database: 'caresync',
      ssl: {
        rejectUnauthorized: false
      }
    });
    console.log('✅ Connected to database');

    // Check if appointment with appointment_id APT-011 exists
    const [appointments] = await connection.execute(
      'SELECT id, appointment_id, doctor_id, patient_id, status FROM appointments WHERE appointment_id = ?', 
      ['APT-011']
    );

    console.log('\n=== Appointment with appointment_id APT-011 ===');
    if (appointments.length === 0) {
      console.log('❌ No appointment found with appointment_id APT-011');
      
      // Let's see what appointment_ids exist
      const [allAppointmentIds] = await connection.execute(
        'SELECT appointment_id, status FROM appointments WHERE appointment_id IS NOT NULL ORDER BY created_at DESC LIMIT 10'
      );
      
      console.log('\n=== Recent appointment_ids ===');
      allAppointmentIds.forEach(apt => {
        console.log(`Appointment ID: ${apt.appointment_id}, Status: ${apt.status}`);
      });
    } else {
      console.log('✅ Found appointment with appointment_id APT-011:');
      appointments.forEach(apt => {
        console.log(`Primary ID: ${apt.id}`);
        console.log(`Appointment ID: ${apt.appointment_id}`);
        console.log(`Doctor ID: ${apt.doctor_id}`);
        console.log(`Patient ID: ${apt.patient_id}`);
        console.log(`Status: ${apt.status}`);
      });
    }

    await connection.end();
  } catch (error) {
    console.error('Database error:', error.message);
    process.exit(1);
  }
}

checkAppointmentById();