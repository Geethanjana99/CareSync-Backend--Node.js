const { mysqlConnection } = require('./config/mysql');
const Appointment = require('./models/Appointment');

async function testAppointmentCreation() {
  console.log('Testing appointment creation...\n');

  try {
    await mysqlConnection.connect();
    const pool = mysqlConnection.getPool();
    const connection = await pool.getConnection();

    // Get patient and doctor IDs
    const [patients] = await connection.execute('SELECT id FROM patients LIMIT 1');
    const [doctors] = await connection.execute('SELECT id FROM doctors LIMIT 1');

    if (patients.length === 0 || doctors.length === 0) {
      console.log('❌ Need patients and doctors');
      return;
    }

    const patientId = patients[0].id;
    const doctorId = doctors[0].id;
    const testDate = '2025-06-27';
    const testTime = '10:30:00';

    console.log(`Testing appointment creation:`);
    console.log(`Patient: ${patientId}`);
    console.log(`Doctor: ${doctorId}`);
    console.log(`Date: ${testDate}`);
    console.log(`Time: ${testTime}\n`);

    // Test slot availability first
    console.log('1. Checking slot availability...');
    const isAvailable = await Appointment.isSlotAvailable(doctorId, testDate, testTime);
    console.log(`✅ Slot is available: ${isAvailable}`);

    if (isAvailable) {
      console.log('\n2. Creating test appointment...');
      
      const appointmentData = {
        patient_id: patientId,
        doctor_id: doctorId,
        appointment_date: testDate,
        appointment_time: testTime,
        appointment_type: 'consultation',
        reason_for_visit: 'Test appointment',
        priority: 'medium'
      };

      const appointment = new Appointment(appointmentData);
      await appointment.save();

      console.log(`✅ Appointment created successfully!`);
      console.log(`   Appointment ID: ${appointment.appointment_id}`);

      // Verify the slot is no longer available
      console.log('\n3. Verifying slot is no longer available...');
      const stillAvailable = await Appointment.isSlotAvailable(doctorId, testDate, testTime);
      console.log(`   Slot still available: ${stillAvailable} (should be false)`);

    } else {
      console.log('❌ Slot is not available, cannot test creation');
    }

    connection.release();

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error(error.stack);
  }
}

testAppointmentCreation().then(() => {
  process.exit(0);
}).catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
