const mysql = require('mysql2/promise');

async function checkAppointment() {
  let connection;
  
  try {
    // Try Aiven cloud database first (production)
    try {
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
      console.log('✅ Connected to Aiven cloud database');
    } catch (cloudError) {
      // Fallback to local database
      connection = await mysql.createConnection({
        host: 'localhost',
        user: 'root',
        password: '',
        database: 'caresync'
      });
      console.log('✅ Connected to local database');
    }

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
      
      console.log('\n=== Recent Appointments (Last 10) ===');
      if (allAppointments.length === 0) {
        console.log('No appointments found in database');
      } else {
        allAppointments.forEach(apt => {
          console.log(`ID: ${apt.id}, Doctor: ${apt.doctor_id}, Patient: ${apt.patient_id}, Status: ${apt.status}`);
        });
      }
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