require('dotenv').config();
const mysql = require('mysql2/promise');

async function createTestAppointments() {
  let connection;
  
  try {
    console.log('🧪 Creating test appointments for doctor dashboard testing...\n');

    // Create MySQL connection
    connection = await mysql.createConnection({
      host: process.env.MYSQL_HOST || 'localhost',
      user: process.env.MYSQL_USER || 'root',
      password: process.env.MYSQL_PASSWORD || '',
      database: process.env.MYSQL_DATABASE || 'clinical_appointment_system',
      timezone: 'Z'
    });

    console.log('✅ Connected to MySQL database');

    // Get test doctor and patient IDs
    const [doctorRows] = await connection.query(
      'SELECT id, doctor_id FROM doctors WHERE user_id = ?',
      ['ee7393d1-8be2-4573-b9fb-58066f6dbd0c']
    );

    const [patientRows] = await connection.query(
      'SELECT id, patient_id FROM patients LIMIT 1'
    );

    if (doctorRows.length === 0) {
      console.log('❌ No test doctor found');
      return;
    }

    if (patientRows.length === 0) {
      console.log('❌ No test patient found');
      return;
    }

    const doctorId = doctorRows[0].id;
    const doctorCode = doctorRows[0].doctor_id;
    const patientId = patientRows[0].id;
    const patientCode = patientRows[0].patient_id;

    console.log('✅ Found test doctor:', doctorCode);
    console.log('✅ Found test patient:', patientCode);

    // Clean up existing test appointments for this doctor
    console.log('🧹 Cleaning up existing appointments...');
    await connection.query('DELETE FROM appointments WHERE doctor_id = ?', [doctorId]);

    // Create test appointments for today and upcoming
    const appointments = [
      {
        appointment_date: new Date().toISOString().split('T')[0], // Today
        appointment_time: '10:00:00',
        status: 'scheduled',
        reason: 'Regular checkup',
        notes: 'Routine examination'
      },
      {
        appointment_date: new Date().toISOString().split('T')[0], // Today
        appointment_time: '14:00:00',
        status: 'completed',
        reason: 'Follow-up visit',
        notes: 'Follow-up after treatment'
      },
      {
        appointment_date: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0], // Tomorrow
        appointment_time: '09:00:00',
        status: 'scheduled',
        reason: 'Consultation',
        notes: 'New patient consultation'
      },
      {
        appointment_date: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString().split('T')[0], // Day after tomorrow
        appointment_time: '11:00:00',
        status: 'scheduled',
        reason: 'Treatment review',
        notes: 'Review treatment progress'
      }
    ];

    for (let i = 0; i < appointments.length; i++) {
      const appointment = appointments[i];
      
      // Generate a unique appointment ID
      const appointmentId = `A${Date.now().toString().slice(-6)}${i.toString().padStart(3, '0')}`;
      
      const [result] = await connection.query(`
        INSERT INTO appointments (
          appointment_id, patient_id, doctor_id, appointment_date, appointment_time, 
          status, reason, notes, scheduled_by, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
      `, [
        appointmentId,
        patientId, 
        doctorId, 
        appointment.appointment_date,
        appointment.appointment_time,
        appointment.status,
        appointment.reason,
        appointment.notes,
        'ee7393d1-8be2-4573-b9fb-58066f6dbd0c' // Use the doctor's user ID as scheduled_by
      ]);

      console.log(`✅ Created appointment ${i + 1}: ${appointmentId} - ${appointment.appointment_date} ${appointment.appointment_time} (${appointment.status})`);
    }

    console.log('\n✅ Test appointments created successfully!');
    
    // Display summary
    const [todayCount] = await connection.query(`
      SELECT COUNT(*) as count FROM appointments 
      WHERE doctor_id = ? AND DATE(appointment_date) = CURDATE()
    `, [doctorId]);

    const [upcomingCount] = await connection.query(`
      SELECT COUNT(*) as count FROM appointments 
      WHERE doctor_id = ? AND appointment_date > CURDATE()
    `, [doctorId]);

    console.log('\n📊 Summary:');
    console.log(`Today's appointments: ${todayCount[0].count}`);
    console.log(`Upcoming appointments: ${upcomingCount[0].count}`);

  } catch (error) {
    console.error('❌ Error creating test appointments:', error);
  } finally {
    if (connection) {
      await connection.end();
    }
    process.exit(0);
  }
}

createTestAppointments();
