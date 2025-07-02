const mysql = require('mysql2/promise');

async function checkRecentAppointments() {
  try {
    console.log('🔍 Checking recent appointments...');
    
    const connection = await mysql.createConnection({
      host: 'caresyncdb-caresync.e.aivencloud.com',
      port: 16006,
      user: 'avnadmin',
      password: 'AVNS_6xeaVpCVApextDTAKfU',
      database: 'caresync',
      ssl: { rejectUnauthorized: false }
    });
    
    // Get recent appointments
    const appointmentsResult = await connection.execute(`
      SELECT 
        appointment_id,
        patient_id,
        doctor_id,
        appointment_date,
        status,
        queue_number,
        is_emergency,
        queue_date,
        consultation_fee,
        created_at
      FROM appointments 
      ORDER BY created_at DESC 
      LIMIT 5
    `);
    
    console.log('\n📋 Recent appointments:');
    appointmentsResult[0].forEach((appointment, index) => {
      console.log(`\n${index + 1}. Appointment:`, {
        id: appointment.appointment_id,
        patient_id: appointment.patient_id,
        doctor_id: appointment.doctor_id,
        date: appointment.appointment_date,
        status: appointment.status,
        queue_number: appointment.queue_number,
        is_emergency: appointment.is_emergency,
        fee: appointment.consultation_fee,
        created: appointment.created_at
      });
    });
    
    // Check queue status
    console.log('\n🔍 Checking queue status...');
    const queueResult = await connection.execute(`
      SELECT * FROM queue_status 
      ORDER BY updated_at DESC 
      LIMIT 5
    `);
    
    console.log('\n📋 Queue status:');
    queueResult[0].forEach((queue, index) => {
      console.log(`${index + 1}.`, queue);
    });
    
    await connection.end();
    console.log('\n✅ Database check complete');
    
  } catch (error) {
    console.error('❌ Error checking appointments:', error.message);
    process.exit(1);
  }
}

checkRecentAppointments();
