const { mysqlConnection } = require('./config/mysql');
const { v4: uuidv4 } = require('uuid');

async function createTestAppointments() {
  console.log('Creating test appointments...\n');

  try {
    await mysqlConnection.connect();
    const pool = mysqlConnection.getPool();
    const connection = await pool.getConnection();

    // Get patient and doctor IDs
    const [patients] = await connection.execute('SELECT id FROM patients LIMIT 1');
    const [doctors] = await connection.execute('SELECT id FROM doctors LIMIT 1');

    if (patients.length === 0 || doctors.length === 0) {
      console.log('❌ Need at least one patient and one doctor');
      return;
    }

    const patientId = patients[0].id;
    const doctorId = doctors[0].id;

    // Get a user to be the scheduler (admin or patient)
    const [users] = await connection.execute('SELECT id FROM users LIMIT 1');
    const scheduledBy = users[0].id;

    console.log('Patient ID:', patientId);
    console.log('Doctor ID:', doctorId);
    console.log('Scheduled by:', scheduledBy);

    // Create test appointments
    const testAppointments = [
      {
        appointment_id: 'APT001',
        appointment_date: '2025-06-25',
        appointment_time: '10:00:00',
        status: 'confirmed',
        appointment_type: 'consultation',
        reason_for_visit: 'General check-up',
        notes: 'Patient is feeling well, routine check-up'
      },
      {
        appointment_id: 'APT002',
        appointment_date: '2025-06-30',
        appointment_time: '14:30:00',
        status: 'scheduled',
        appointment_type: 'follow-up',
        reason_for_visit: 'Follow-up visit',
        notes: 'Follow-up after previous consultation'
      },
      {
        appointment_id: 'APT003',
        appointment_date: '2025-05-15',
        appointment_time: '09:00:00',
        status: 'completed',
        appointment_type: 'consultation',
        reason_for_visit: 'Health screening',
        notes: 'Complete health screening - all results normal'
      },
      {
        appointment_id: 'APT004',
        appointment_date: '2025-07-05',
        appointment_time: '11:15:00',
        status: 'scheduled',
        appointment_type: 'consultation',
        reason_for_visit: 'Regular check-up',
        notes: 'Upcoming consultation for health monitoring'
      }
    ];

    for (const apt of testAppointments) {
      const appointmentId = uuidv4();
      
      await connection.execute(`
        INSERT INTO appointments (
          id, appointment_id, patient_id, doctor_id, 
          appointment_date, appointment_time, status, appointment_type,
          reason_for_visit, notes, scheduled_by
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        appointmentId,
        apt.appointment_id,
        patientId,
        doctorId,
        apt.appointment_date,
        apt.appointment_time,
        apt.status,
        apt.appointment_type,
        apt.reason_for_visit,
        apt.notes,
        scheduledBy
      ]);

      console.log(`✅ Created appointment: ${apt.appointment_id} - ${apt.appointment_date} ${apt.appointment_time}`);
    }

    // Verify appointments were created
    const [newAppointments] = await connection.execute(`
      SELECT 
        a.appointment_id,
        a.appointment_date,
        a.appointment_time,
        a.status,
        a.appointment_type,
        u.name as doctor_name,
        d.specialty
      FROM appointments a
      JOIN doctors d ON a.doctor_id = d.id
      JOIN users u ON d.user_id = u.id
      WHERE a.patient_id = ?
      ORDER BY a.appointment_date ASC
    `, [patientId]);

    console.log(`\n✅ Successfully created ${newAppointments.length} appointments:`);
    newAppointments.forEach(apt => {
      console.log(`  - ${apt.appointment_id}: ${apt.appointment_date} ${apt.appointment_time} (${apt.status}) with Dr. ${apt.doctor_name}`);
    });

    connection.release();

  } catch (error) {
    console.error('❌ Error creating appointments:', error.message);
    console.error(error.stack);
  }
}

createTestAppointments().then(() => {
  process.exit(0);
}).catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
