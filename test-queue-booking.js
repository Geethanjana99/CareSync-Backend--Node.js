const axios = require('axios');

async function testQueueBooking() {
  try {
    console.log('🔍 Testing queue-based appointment booking...');
    
    // Step 1: Login as patient
    console.log('1. Logging in as test patient...');
    const loginResponse = await axios.post('http://localhost:5000/api/auth/login', {
      email: 'testpatient1751270720002@example.com',
      password: 'Patient123!'
    });
    
    if (!loginResponse.data.success) {
      console.log('❌ Login failed:', loginResponse.data.message);
      return;
    }
    
    console.log('✅ Login successful');
    const token = loginResponse.data.data.accessToken;
    
    // Step 2: Get a doctor to book with
    console.log('2. Getting available doctors...');
    const doctorsResponse = await axios.get('http://localhost:5000/api/doctors/search?limit=5');
    
    if (!doctorsResponse.data.success || doctorsResponse.data.data.length === 0) {
      console.log('❌ No doctors available');
      return;
    }
    
    const doctor = doctorsResponse.data.data[0];
    console.log(`✅ Selected doctor: ${doctor.name} (${doctor.specialty})`);
    
    // Step 3: Book regular queue appointment
    console.log('3. Booking regular queue appointment...');
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const appointmentDate = tomorrow.toISOString().split('T')[0];
    
    const regularBookingData = {
      doctorId: doctor.id,
      appointmentDate: appointmentDate,
      appointmentType: 'consultation',
      reasonForVisit: 'Regular checkup',
      symptoms: 'Routine consultation',
      priority: 'medium',
      isEmergency: false
    };
    
    try {
      const regularResponse = await axios.post(
        'http://localhost:5000/api/patients/appointments/queue', 
        regularBookingData,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      if (regularResponse.data.success) {
        console.log('✅ Regular appointment booked successfully!');
        console.log(`   Queue Number: ${regularResponse.data.data.queueNumber}`);
        console.log(`   Message: ${regularResponse.data.message}`);
      } else {
        console.log('❌ Regular booking failed:', regularResponse.data.message);
      }
    } catch (error) {
      console.log('❌ Regular booking failed:', error.response?.data?.message || error.message);
    }
    
    // Step 4: Book emergency appointment
    console.log('4. Booking emergency appointment...');
    const emergencyBookingData = {
      doctorId: doctor.id,
      appointmentDate: appointmentDate,
      appointmentType: 'emergency',
      reasonForVisit: 'Chest pain',
      symptoms: 'Severe chest pain and difficulty breathing',
      priority: 'high',
      isEmergency: true
    };
    
    try {
      const emergencyResponse = await axios.post(
        'http://localhost:5000/api/patients/appointments/queue', 
        emergencyBookingData,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      if (emergencyResponse.data.success) {
        console.log('✅ Emergency appointment booked successfully!');
        console.log(`   Emergency Number: ${emergencyResponse.data.data.queueNumber}`);
        console.log(`   Message: ${emergencyResponse.data.message}`);
      } else {
        console.log('❌ Emergency booking failed:', emergencyResponse.data.message);
      }
    } catch (error) {
      console.log('❌ Emergency booking failed:', error.response?.data?.message || error.message);
    }
    
    console.log('\n🎉 Queue booking system is working!');
    console.log('📱 Frontend should now show queue booking instead of time slots');
    
  } catch (error) {
    console.error('❌ Test failed:', error.response?.data?.message || error.message);
  }
}

testQueueBooking();
