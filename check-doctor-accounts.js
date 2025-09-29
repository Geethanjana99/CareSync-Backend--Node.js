const mysql = require('mysql2/promise');

async function checkTestAccounts() {
  let connection;
  
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
    console.log('✅ Connected to database');

    // Check for doctors with their user accounts
    const [doctors] = await connection.execute(`
      SELECT d.id as doctor_id, d.user_id, u.name, u.email, d.specialty
      FROM doctors d
      JOIN users u ON d.user_id = u.id
      LIMIT 5
    `);

    console.log('\n=== Available Doctor Accounts ===');
    doctors.forEach(doctor => {
      console.log(`Doctor: ${doctor.name} (${doctor.specialty})`);
      console.log(`Email: ${doctor.email}`);
      console.log(`Doctor ID: ${doctor.doctor_id}`);
      console.log(`User ID: ${doctor.user_id}`);
      console.log('---');
    });

    // Check if there are any appointments for doctor 11aedc76-46d6-4907-83ee-152d097196b8
    const [appointments] = await connection.execute(`
      SELECT appointment_id, status, patient_id 
      FROM appointments 
      WHERE doctor_id = ? 
      ORDER BY created_at DESC LIMIT 3
    `, ['11aedc76-46d6-4907-83ee-152d097196b8']);

    console.log('\n=== Appointments for Doctor 11aedc76-46d6-4907-83ee-152d097196b8 ===');
    appointments.forEach(apt => {
      console.log(`Appointment ID: ${apt.appointment_id}, Status: ${apt.status}`);
    });

    await connection.end();
  } catch (error) {
    console.error('Database error:', error.message);
  }
}

checkTestAccounts();