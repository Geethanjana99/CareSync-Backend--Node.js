const { mysqlConnection } = require('./config/mysql');
const { v4: uuidv4 } = require('uuid');

async function createFreshTestAppointments() {
  try {
    console.log('🏥 Creating fresh test appointments for workflow testing...');

    await mysqlConnection.connect();    // Get test doctor and patient IDs (same as the working script)
    const doctorRows = await mysqlConnection.query(
      'SELECT id, doctor_id FROM doctors WHERE user_id = ?',
      ['ee7393d1-8be2-4573-b9fb-58066f6dbd0c']
    );

    const patientRows = await mysqlConnection.query(
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
    const patientId = patientRows[0].id;

    console.log('✅ Found test doctor:', doctorRows[0].doctor_id);
    console.log('✅ Found test patient:', patientRows[0].patient_id);

    // Create 2 new appointments in scheduled status for today
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format

    const appointments = [
      {
        id: uuidv4(),
        appointment_id: `TEST-${Date.now()}-001`,
        patient_id: patientId,
        doctor_id: doctorId,        appointment_date: today,
        appointment_time: '16:00:00',
        status: 'scheduled',
        reason_for_visit: 'New patient consultation'
      },
      {
        id: uuidv4(),
        appointment_id: `TEST-${Date.now()}-002`,
        patient_id: patientId,
        doctor_id: doctorId,
        appointment_date: today,
        appointment_time: '17:00:00',
        status: 'scheduled',
        reason_for_visit: 'Follow-up consultation'
      }
    ];

    for (const appointment of appointments) {      const query = `
        INSERT INTO appointments (
          id, appointment_id, patient_id, doctor_id, appointment_date, appointment_time,
          status, reason, notes, scheduled_by, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
      `;

      const params = [
        appointment.id, appointment.appointment_id, appointment.patient_id, 
        appointment.doctor_id, appointment.appointment_date, appointment.appointment_time,
        appointment.status, appointment.reason_for_visit, 
        `Test appointment created for workflow testing`, 
        'ee7393d1-8be2-4573-b9fb-58066f6dbd0c' // Doctor's user ID
      ];

      await mysqlConnection.query(query, params);
      console.log(`✅ Created appointment: ${appointment.appointment_id} at ${appointment.appointment_time}`);
    }

    console.log(`\n🎉 Successfully created ${appointments.length} test appointments for ${today}`);
    console.log('📋 These appointments are in "scheduled" status and ready for testing the workflow');

  } catch (error) {
    console.error('❌ Error creating test appointments:', error);
  } finally {
    process.exit(0);
  }
}

createFreshTestAppointments();
