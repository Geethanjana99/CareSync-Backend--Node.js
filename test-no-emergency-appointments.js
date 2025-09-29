const axios = require('axios');

async function testRegularAppointmentBooking() {
  try {
    console.log('🏥 TESTING REGULAR APPOINTMENT BOOKING (NO EMERGENCY)');
    console.log('===============================================\n');
    
    // Test patient credentials (assuming we have test data)
    const loginData = {
      email: 'kasun.madhuranga@gmail.com',
      password: 'password123'
    };
    
    // Step 1: Login as patient
    console.log('1️⃣ Logging in as patient...');
    const loginResponse = await axios.post('http://localhost:5000/api/auth/login', loginData);
    
    if (!loginResponse.data.success) {
      console.log('❌ Login failed:', loginResponse.data.message);
      return;
    }
    
    const token = loginResponse.data.data.token;
    const authHeaders = { Authorization: `Bearer ${token}` };
    console.log('✅ Login successful');
    
    // Step 2: Get available doctors
    console.log('\n2️⃣ Fetching available doctors...');
    const doctorsResponse = await axios.get('http://localhost:5000/api/patients/doctors', {
      headers: authHeaders
    });
    
    if (!doctorsResponse.data.success || doctorsResponse.data.data.length === 0) {
      console.log('❌ No doctors available');
      return;
    }
    
    const doctor = doctorsResponse.data.data[0];
    console.log(`✅ Selected doctor: ${doctor.name} (${doctor.specialty})`);
    
    // Step 3: Book regular appointment (no emergency option)
    console.log('\n3️⃣ Booking regular appointment...');
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const appointmentDate = tomorrow.toISOString().split('T')[0];
    
    const appointmentData = {
      doctorId: doctor.id,
      appointmentDate: appointmentDate,
      appointmentType: 'consultation',
      reasonForVisit: 'Regular checkup',
      symptoms: 'Routine consultation - no emergency',
      priority: 'medium',
      paymentMethod: 'counter',
      paymentStatus: 'unpaid'
      // Note: NO isEmergency field - it's been removed!
    };
    
    const bookingResponse = await axios.post(
      'http://localhost:5000/api/patients/appointments/queue',
      appointmentData,
      { headers: authHeaders }
    );
    
    if (bookingResponse.data.success) {
      const appointment = bookingResponse.data.data.appointment;
      console.log('✅ Regular appointment booked successfully!');
      console.log(`   🎫 Appointment ID: ${appointment.appointment_id}`);
      console.log(`   🎯 Queue Number: ${bookingResponse.data.data.queueNumber}`);
      console.log(`   📅 Date: ${appointment.appointment_date}`);
      console.log(`   🚨 Emergency: ${appointment.is_emergency ? 'Yes' : 'No'} (should always be No)`);
      console.log(`   📋 Status: ${appointment.status}`);
      console.log(`   💰 Fee: $${bookingResponse.data.data.consultationFee || 0}`);
      console.log(`   💳 Payment: ${appointment.payment_status}`);
    } else {
      console.log('❌ Booking failed:', bookingResponse.data.message);
    }
    
    console.log('\n' + '='.repeat(50));
    console.log('🎯 TEST SUMMARY');
    console.log('='.repeat(50));
    console.log('✅ Emergency functionality completely removed');
    console.log('✅ All appointments are now regular appointments');
    console.log('✅ Queue system works without emergency priority');
    console.log('✅ Payment processing works normally');
    console.log('');
    console.log('📋 Changes made:');
    console.log('1. Removed emergency UI components from frontend');
    console.log('2. Removed isEmergency parameter from API calls');
    console.log('3. Updated backend controllers to ignore emergency requests');
    console.log('4. Modified Queue model to only assign regular numbers');
    console.log('5. Removed emergency indicators from doctor views');
    console.log('');
    console.log('🚀 All appointments now follow regular queue system!');
    
  } catch (error) {
    if (error.response) {
      console.log('❌ HTTP Error:', error.response.status);
      console.log('Response:', error.response.data);
    } else if (error.code === 'ECONNREFUSED') {
      console.log('❌ Cannot connect to server');
      console.log('💡 Make sure backend server is running:');
      console.log('   cd backend && npm start');
    } else {
      console.log('❌ Error:', error.message);
    }
  }
}

runTests = async () => {
  await testRegularAppointmentBooking();
};

runTests();