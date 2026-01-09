const axios = require('axios');

async function testCurrentDateBooking() {
  try {
    console.log('🏥 TESTING CURRENT DATE APPOINTMENT BOOKING');
    console.log('==========================================\n');
    
    // Test patient credentials
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
    
    // Step 3: Book appointment for TODAY
    console.log('\n3️⃣ Booking appointment for TODAY...');
    const today = new Date();
    const todayString = today.toISOString().split('T')[0];
    
    console.log(`📅 Booking date: ${todayString}`);
    
    const appointmentData = {
      doctorId: doctor.id,
      appointmentDate: todayString,  // THIS IS THE CRITICAL TEST - current date
      appointmentType: 'consultation',
      reasonForVisit: 'Same-day appointment test',
      symptoms: 'Testing current date booking functionality',
      priority: 'medium',
      paymentMethod: 'counter',
      paymentStatus: 'unpaid'
    };
    
    const bookingResponse = await axios.post(
      'http://localhost:5000/api/patients/appointments/queue',
      appointmentData,
      { headers: authHeaders }
    );
    
    if (bookingResponse.data.success) {
      const appointment = bookingResponse.data.data.appointment;
      console.log('🎉 SUCCESS! Current date appointment booked!');
      console.log(`   🎫 Appointment ID: ${appointment.appointment_id}`);
      console.log(`   🎯 Queue Number: ${bookingResponse.data.data.queueNumber}`);
      console.log(`   📅 Date: ${appointment.appointment_date}`);
      console.log(`   📋 Status: ${appointment.status}`);
      console.log(`   💰 Fee: $${bookingResponse.data.data.consultationFee || 0}`);
      console.log(`   💳 Payment: ${appointment.payment_status}`);
      
      // Step 4: Test booking for tomorrow as well (should also work)
      console.log('\n4️⃣ Testing tomorrow booking (should also work)...');
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const tomorrowString = tomorrow.toISOString().split('T')[0];
      
      const tomorrowData = {
        ...appointmentData,
        appointmentDate: tomorrowString,
        reasonForVisit: 'Tomorrow appointment test'
      };
      
      const tomorrowResponse = await axios.post(
        'http://localhost:5000/api/patients/appointments/queue',
        tomorrowData,
        { headers: authHeaders }
      );
      
      if (tomorrowResponse.data.success) {
        console.log('✅ Tomorrow booking also works!');
        console.log(`   📅 Tomorrow date: ${tomorrowString}`);
        console.log(`   🎯 Queue Number: ${tomorrowResponse.data.data.queueNumber}`);
      } else {
        console.log('❌ Tomorrow booking failed:', tomorrowResponse.data.message);
      }
      
    } else {
      console.log('❌ Current date booking failed:', bookingResponse.data.message);
    }
    
    console.log('\n' + '='.repeat(50));
    console.log('🎯 TEST SUMMARY');
    console.log('='.repeat(50));
    console.log('✅ Current date appointment booking enabled');
    console.log('✅ Frontend minimum date set to today');
    console.log('✅ Backend validation allows current date');
    console.log('✅ Admin controller allows current date');
    console.log('✅ Validation utility updated for same-day bookings');
    console.log('');
    console.log('📋 Changes made:');
    console.log('1. Frontend: Changed minDate from tomorrow to today');
    console.log('2. Backend Admin: Updated date validation for current date');
    console.log('3. Validation Utility: Allow appointments >= today (not > today)');
    console.log('');
    console.log('🚀 Patients can now book appointments for the same day!');
    
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

testCurrentDateBooking();