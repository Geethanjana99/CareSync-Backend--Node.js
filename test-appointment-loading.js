const { connectToMysql } = require('./config/mysql');
const mysql = require('mysql2/promise');

async function testAppointmentLoading() {
  try {
    console.log('🔍 Testing appointment loading functionality...');
    
    // Create connection using the same config as the project
    const connection = await mysql.createConnection({
      host: 'caresyncdb-caresync.e.aivencloud.com',
      port: 16006,
      user: 'avnadmin',
      password: 'AVNS_6xeaVpCVApextDTAKfU',
      database: 'caresync',
      ssl: { rejectUnauthorized: false }
    });
    
    // 1. Check if we have any appointments at all
    console.log('\n1. Checking total appointments in database...');
    const [allAppointments] = await connection.execute('SELECT COUNT(*) as total FROM appointments');
    console.log(`📊 Total appointments in database: ${allAppointments[0].total}`);
    
    // 2. Check recent appointments with patient info
    console.log('\n2. Checking recent appointments with patient details...');
    const [recentAppointments] = await connection.execute(`
      SELECT 
        a.id,
        a.appointment_id,
        a.patient_id,
        a.doctor_id,
        a.appointment_date,
        a.status,
        a.queue_number,
        a.is_emergency,
        a.created_at
      FROM appointments a
      ORDER BY a.created_at DESC 
      LIMIT 5
    `);
    
    console.log(`📋 Recent appointments (${recentAppointments.length}):`);
    recentAppointments.forEach((apt, index) => {
      console.log(`   ${index + 1}. ${apt.appointment_id} - Patient: ${apt.patient_id} - Status: ${apt.status} - Date: ${apt.appointment_date}`);
    });
    
    // 3. Check if we have patients table
    console.log('\n3. Checking patients table...');
    const [patients] = await connection.execute('SELECT COUNT(*) as total FROM patients');
    console.log(`👥 Total patients: ${patients[0].total}`);
    
    // 4. Test the appointment query used by the API
    console.log('\n4. Testing appointment query with JOIN...');
    const [appointmentsWithDetails] = await connection.execute(`
      SELECT a.*, 
             d.doctor_id, d.specialty, d.consultation_fee as doctor_fee,
             u.name as doctor_name, u.phone as doctor_phone
      FROM appointments a
      JOIN doctors d ON a.doctor_id = d.id
      JOIN users u ON d.user_id = u.id
      WHERE a.patient_id = ?
      ORDER BY a.appointment_date DESC
      LIMIT 3
    `, [recentAppointments[0]?.patient_id]);
    
    if (appointmentsWithDetails.length > 0) {
      console.log(`✅ Query with JOIN successful - ${appointmentsWithDetails.length} appointments found`);
      console.log('Sample appointment with details:', {
        id: appointmentsWithDetails[0].appointment_id,
        doctor: appointmentsWithDetails[0].doctor_name,
        specialty: appointmentsWithDetails[0].specialty,
        date: appointmentsWithDetails[0].appointment_date,
        status: appointmentsWithDetails[0].status
      });
    } else {
      console.log('❌ No appointments found with JOIN query');
    }
    
    // 5. Check if appointment_time column still exists (might cause issues)
    console.log('\n5. Checking appointments table structure...');
    const [columns] = await connection.execute(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = 'caresync' 
      AND TABLE_NAME = 'appointments'
      ORDER BY ORDINAL_POSITION
    `);
    
    console.log('📋 Appointments table columns:');
    columns.forEach(col => {
      console.log(`   - ${col.COLUMN_NAME}`);
    });
    
    await connection.end();
    console.log('\n✅ Appointment loading test complete');
    
  } catch (error) {
    console.error('❌ Error testing appointment loading:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

testAppointmentLoading();
