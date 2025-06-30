const axios = require('axios');

const BASE_URL = 'http://localhost:5000/api';

async function testQueueBooking() {
  try {
    console.log('🔍 Testing queue-based appointment booking...');
    
    // 1. First, search for doctors to see if the API is working
    console.log('1. Testing doctor search...');
    const doctorsResponse = await axios.get(`${BASE_URL}/doctors/search?limit=5`);
    
    if (!doctorsResponse.data.success || !doctorsResponse.data.data.length) {
      throw new Error('No doctors found');
    }
    
    console.log(`✅ Found ${doctorsResponse.data.data.length} doctors`);
    const firstDoctor = doctorsResponse.data.data[0];
    console.log(`📋 First doctor: ${firstDoctor.name} (${firstDoctor.specialty})`);
    
    // Show working hours if available
    if (firstDoctor.working_hours) {
      console.log(`⏰ Working hours:`, firstDoctor.working_hours);
    }
    
    // 2. Try to create a test patient first
    console.log('\n2. Creating test patient...');
    try {
      const newPatient = await axios.post(`${BASE_URL}/auth/register`, {
        name: 'Test Queue Patient',
        email: 'testqueue@example.com',
        password: 'testpass123',
        role: 'patient'
      });
      console.log('✅ Test patient created');
    } catch (error) {
      if (error.response?.status === 400 && error.response?.data?.message?.includes('already exists')) {
        console.log('ℹ️  Test patient already exists');
      } else {
        console.log('⚠️  Failed to create test patient:', error.response?.data?.message || error.message);
      }
    }
    
    // 3. Login as test patient
    console.log('\n3. Logging in as test patient...');
    const loginResponse = await axios.post(`${BASE_URL}/auth/login`, {
      email: 'test@test.com',
      password: 'testtest'
    });
    
    if (!loginResponse.data.success) {
      throw new Error('Login failed');
    }
    
    console.log('✅ Login successful');
    const token = loginResponse.data.data.token;
    
    // 4. Test queue booking
    console.log('\n4. Testing queue booking...');
    const bookingData = {
      doctorId: firstDoctor.doctor_id,
      appointmentDate: new Date().toISOString().split('T')[0], // Today
      appointmentType: 'consultation',
      reasonForVisit: 'Test queue booking',
      symptoms: 'Testing the queue system',
      isEmergency: false
    };
    
    console.log('📝 Booking data:', bookingData);
    
    const bookingResponse = await axios.post(
      `${BASE_URL}/patients/appointments/queue`,
      bookingData,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    if (bookingResponse.data.success) {
      console.log('✅ Queue booking successful!');
      console.log('🎫 Appointment details:', bookingResponse.data.data);
    } else {
      console.log('❌ Queue booking failed:', bookingResponse.data.message);
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.response?.data?.message || error.message);
    if (error.response?.data) {
      console.error('📋 Error details:', error.response.data);
    }
  }
}

testQueueBooking();
