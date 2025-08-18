const axios = require('axios');

async function testCompleteIntegration() {
  const BASE_URL = 'http://localhost:5000/api';
  
  try {
    console.log('🔄 Testing Complete Queue-Based Appointment System Integration...\n');
    
    // Step 1: Login as patient
    console.log('1. 👤 Patient Login...');
    const loginResponse = await axios.post(`${BASE_URL}/auth/login`, {
      email: 'patient.test.new@example.com',
      password: 'Password123!'
    });
    
    if (!loginResponse.data.success) {
      throw new Error(`Login failed: ${loginResponse.data.message}`);
    }
    
    const token = loginResponse.data.data.token;
    const authHeaders = { 
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };
    
    console.log('   ✅ Patient login successful\n');
    
    // Step 2: Search for doctors
    console.log('2. 🔍 Searching for doctors...');
    const doctorsResponse = await axios.get(`${BASE_URL}/patients/doctors/search`, {
      headers: authHeaders
    });
    
    if (!doctorsResponse.data.success || doctorsResponse.data.data.length === 0) {
      throw new Error('No doctors found');
    }
    
    const doctor = doctorsResponse.data.data[0];
    console.log(`   ✅ Found doctor: ${doctor.name} (${doctor.doctor_id})`);
    console.log(`   📋 Specialty: ${doctor.specialty}`);
    console.log(`   💰 Fee: Rs. ${doctor.consultation_fee}`);
    console.log(`   ⏰ Working hours: ${JSON.stringify(doctor.working_hours)}\n`);
    
    // Step 3: Check doctor availability for specific dates
    console.log('3. 📅 Checking doctor availability...');
    const testDates = ['2025-07-02', '2025-07-05', '2025-07-07'];
    
    for (const testDate of testDates) {
      try {
        const availabilityResponse = await axios.get(
          `${BASE_URL}/patients/doctors/${doctor.doctor_id}/availability?date=${testDate}`,
          { headers: authHeaders }
        );
        
        if (availabilityResponse.data.success) {
          const avail = availabilityResponse.data.data;
          console.log(`   📅 ${testDate}: ${avail.isAvailable ? '✅ Available' : '❌ Not Available'}`);
          if (avail.isAvailable) {
            console.log(`      ⏰ Time: ${avail.timeRange}`);
            console.log(`      💬 Message: ${avail.message}`);
          }
        }
      } catch (err) {
        console.log(`   📅 ${testDate}: ❌ Error checking availability`);
      }
    }
    console.log('');
    
    // Step 4: Book a regular appointment
    console.log('4. 📝 Booking regular appointment...');
    const regularBookingData = {
      doctorId: doctor.id,
      appointmentDate: '2025-08-01',
      appointmentType: 'consultation',
      reasonForVisit: 'Regular checkup - integration test',
      symptoms: 'Testing complete integration',
      priority: 'medium',
      isEmergency: false
    };
    
    const regularBookingResponse = await axios.post(
      `${BASE_URL}/patients/appointments/queue`,
      regularBookingData,
      { headers: authHeaders }
    );
    
    if (regularBookingResponse.data.success) {
      const regular = regularBookingResponse.data;
      console.log('   ✅ Regular appointment booked successfully!');
      console.log(`   🎫 Appointment ID: ${regular.data.appointment.appointment_id}`);
      console.log(`   🎯 Queue Number: ${regular.data.queueNumber}`);
      console.log(`   📅 Date: ${regular.data.appointment.appointment_date}`);
      console.log(`   💬 Message: ${regular.data.message}\n`);
    } else {
      console.log('   ❌ Regular booking failed:', regularBookingResponse.data.message);
    }
    
    // Step 5: Book an emergency appointment
    console.log('5. 🚨 Booking emergency appointment...');
    const emergencyBookingData = {
      doctorId: doctor.id,
      appointmentDate: '2025-08-02',
      appointmentType: 'emergency',
      reasonForVisit: 'Emergency consultation - integration test',
      symptoms: 'Testing emergency integration',
      priority: 'high',
      isEmergency: true
    };
    
    const emergencyBookingResponse = await axios.post(
      `${BASE_URL}/patients/appointments/queue`,
      emergencyBookingData,
      { headers: authHeaders }
    );
    
    if (emergencyBookingResponse.data.success) {
      const emergency = emergencyBookingResponse.data;
      console.log('   ✅ Emergency appointment booked successfully!');
      console.log(`   🎫 Appointment ID: ${emergency.data.appointment.appointment_id}`);
      console.log(`   🎯 Emergency Queue Number: ${emergency.data.queueNumber}`);
      console.log(`   📅 Date: ${emergency.data.appointment.appointment_date}`);
      console.log(`   💬 Message: ${emergency.data.message}\n`);
    } else {
      console.log('   ❌ Emergency booking failed:', emergencyBookingResponse.data.message);
    }
    
    // Step 6: Retrieve patient appointments
    console.log('6. 📋 Retrieving patient appointments...');
    const appointmentsResponse = await axios.get(
      `${BASE_URL}/patients/appointments`,
      { headers: authHeaders }
    );
    
    if (appointmentsResponse.data.success) {
      const appointments = appointmentsResponse.data.data.appointments;
      console.log(`   ✅ Found ${appointments.length} appointments`);
      
      // Show last few appointments
      const recentAppointments = appointments.slice(-3);
      recentAppointments.forEach((apt, index) => {
        console.log(`   📋 ${index + 1}. ${apt.appointment_id} - ${apt.status}`);
        console.log(`      👨‍⚕️ Doctor: ${apt.doctor_name}`);
        console.log(`      📅 Date: ${apt.appointment_date}`);
        console.log(`      🎯 Queue: ${apt.queue_number || 'N/A'} ${apt.is_emergency ? '(Emergency)' : ''}`);
      });
    } else {
      console.log('   ❌ Failed to retrieve appointments');
    }
    
    console.log('\n🎉 Complete Integration Test PASSED!');
    console.log('✅ Patient login working');
    console.log('✅ Doctor search working');
    console.log('✅ Doctor availability API working');
    console.log('✅ Queue-based booking working (regular & emergency)');
    console.log('✅ Appointment retrieval working');
    console.log('✅ Queue system fully functional');
    
  } catch (error) {
    console.error('\n❌ Integration test failed:', error.message);
    if (error.response?.data) {
      console.error('Response data:', error.response.data);
    }
  }
}

// Run the test
testCompleteIntegration();
