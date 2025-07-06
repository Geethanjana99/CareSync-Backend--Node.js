const { mysqlConnection } = require('./config/mysql');

async function createTestAppointments() {
  try {
    await mysqlConnection.connect();
    console.log('Creating test appointments...');
    
    const today = new Date().toISOString().split('T')[0];
    const doctorId = 'test-doctor-db-id-123';
    const patientId = 'test-patient-db-id-123';
    
    // Create test appointments
    const appointments = [
      {
        id: 'test-appointment-1',
        appointment_id: 'APT-TEST-001',
        doctor_id: doctorId,
        patient_id: patientId,
        appointment_date: today,
        queue_date: today,
        queue_number: 1,
        status: 'scheduled',
        priority: 'medium',
        is_emergency: false,
        reason_for_visit: 'General checkup',
        symptoms: 'Regular checkup'
      },
      {
        id: 'test-appointment-2',
        appointment_id: 'APT-TEST-002',
        doctor_id: doctorId,
        patient_id: patientId,
        appointment_date: today,
        queue_date: today,
        queue_number: 2,
        status: 'scheduled',
        priority: 'medium',
        is_emergency: false,
        reason_for_visit: 'Follow-up',
        symptoms: 'Follow-up visit'
      },
      {
        id: 'test-appointment-3',
        appointment_id: 'APT-TEST-003',
        doctor_id: doctorId,
        patient_id: patientId,
        appointment_date: today,
        queue_date: today,
        queue_number: 1,
        status: 'scheduled',
        priority: 'urgent',
        is_emergency: true,
        reason_for_visit: 'Emergency',
        symptoms: 'Urgent medical condition'
      }
    ];
    
    // Delete existing test appointments
    await mysqlConnection.query('DELETE FROM appointments WHERE appointment_id LIKE ?', ['APT-TEST-%']);
    
    // Insert test appointments
    for (const appointment of appointments) {
      await mysqlConnection.query(
        'INSERT INTO appointments (id, appointment_id, doctor_id, patient_id, appointment_date, queue_date, queue_number, status, priority, is_emergency, reason_for_visit, symptoms) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [
          appointment.id,
          appointment.appointment_id,
          appointment.doctor_id,
          appointment.patient_id,
          appointment.appointment_date,
          appointment.queue_date,
          appointment.queue_number,
          appointment.status,
          appointment.priority,
          appointment.is_emergency,
          appointment.reason_for_visit,
          appointment.symptoms
        ]
      );
    }
    
    console.log('✅ Test appointments created successfully');
    console.log('- Regular appointment #1: APT-TEST-001');
    console.log('- Regular appointment #2: APT-TEST-002');
    console.log('- Emergency appointment #1: APT-TEST-003');
    
    process.exit(0);
  } catch (error) {
    console.error('Error creating test appointments:', error);
    process.exit(1);
  }
}

createTestAppointments();
