const { mysqlConnection } = require('./config/mysql');
const Appointment = require('./models/Appointment');

async function testBookingFlow() {
  console.log('Testing complete appointment booking flow...\n');

  try {
    await mysqlConnection.connect();

    // Get a doctor and patient for testing
    const doctors = await mysqlConnection.query('SELECT id, doctor_id FROM doctors LIMIT 1');
    const patients = await mysqlConnection.query('SELECT id, patient_id FROM patients LIMIT 1');

    if (doctors.length === 0 || patients.length === 0) {
      console.log('❌ Need at least one doctor and one patient');
      return;
    }

    const doctorId = doctors[0].id;
    const patientId = patients[0].id;
    const testDate = '2025-06-26'; // Thursday
    
    console.log(`Testing with Doctor ID: ${doctorId} (${doctors[0].doctor_id})`);
    console.log(`Testing with Patient ID: ${patientId} (${patients[0].patient_id})`);
    console.log(`Test Date: ${testDate}\n`);

    // Step 1: Get available slots
    console.log('1. Getting available slots...');
    const availableSlots = await Appointment.getAvailableSlots(doctorId, testDate);
    console.log(`✅ Found ${availableSlots.length} available slots:`, availableSlots.slice(0, 5), '...');

    if (availableSlots.length === 0) {
      console.log('❌ No available slots found. Make sure doctor availability is set up.');
      return;
    }

    // Step 2: Book an appointment in the first available slot
    const selectedSlot = availableSlots[0];
    console.log(`\n2. Booking appointment for ${selectedSlot}...`);
    
    const appointmentData = {
      patient_id: patientId,
      doctor_id: doctorId,
      appointment_date: testDate,
      appointment_time: selectedSlot,
      appointment_type: 'consultation',
      reason_for_visit: 'Regular checkup',
      symptoms: 'Feeling well, routine visit'
    };

    const appointment = new Appointment(appointmentData);
    await appointment.save();
    console.log(`✅ Appointment booked successfully: ${appointment.appointment_id}`);

    // Step 3: Check available slots again - the booked slot should be removed
    console.log(`\n3. Checking available slots after booking...`);
    const updatedSlots = await Appointment.getAvailableSlots(doctorId, testDate);
    console.log(`✅ Now ${updatedSlots.length} available slots (should be ${availableSlots.length - 1})`);
    
    const slotStillAvailable = updatedSlots.includes(selectedSlot);
    if (!slotStillAvailable) {
      console.log(`✅ Booked slot ${selectedSlot} is no longer available - correct!`);
    } else {
      console.log(`❌ Booked slot ${selectedSlot} is still available - this is wrong!`);
    }

    // Step 4: Try to book the same slot again - should fail
    console.log(`\n4. Trying to book the same slot again...`);
    const isSlotAvailable = await Appointment.isSlotAvailable(doctorId, testDate, selectedSlot);
    if (!isSlotAvailable) {
      console.log(`✅ Slot ${selectedSlot} is correctly marked as unavailable`);
    } else {
      console.log(`❌ Slot ${selectedSlot} is still marked as available - this is wrong!`);
    }

    // Step 5: Book another appointment in a different slot
    if (updatedSlots.length > 0) {
      const secondSlot = updatedSlots[0];
      console.log(`\n5. Booking second appointment for ${secondSlot}...`);
      
      const secondAppointmentData = {
        patient_id: patientId,
        doctor_id: doctorId,
        appointment_date: testDate,
        appointment_time: secondSlot,
        appointment_type: 'follow-up',
        reason_for_visit: 'Follow up visit'
      };

      const secondAppointment = new Appointment(secondAppointmentData);
      await secondAppointment.save();
      console.log(`✅ Second appointment booked: ${secondAppointment.appointment_id}`);

      // Final check
      const finalSlots = await Appointment.getAvailableSlots(doctorId, testDate);
      console.log(`\n6. Final check: ${finalSlots.length} slots remaining (should be ${availableSlots.length - 2})`);
    }

    console.log('\n✅ All tests passed! Booking flow works correctly.');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error(error.stack);
  }
}

testBookingFlow().then(() => {
  process.exit(0);
}).catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
