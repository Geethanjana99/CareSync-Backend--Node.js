const axios = require('axios');

const BASE_URL = 'http://localhost:5000/api';

async function testTodayAppointments() {
  try {
    console.log('🧪 Testing Today\'s Appointments endpoint...');

    // 1. Login as doctor
    console.log('1. Authenticating as doctor...');    const loginResponse = await axios.post(`${BASE_URL}/auth/login`, {
      email: 'test.doctor@clinicalapp.com',
      password: 'testdoctor123',
      role: 'doctor'
    });

    if (!loginResponse.data.success) {
      throw new Error('Login failed: ' + loginResponse.data.message);
    }

    const doctorToken = loginResponse.data.data.token;
    console.log('✅ Doctor authenticated successfully');

    // 2. Test today's appointments endpoint
    console.log('2. Testing today\'s appointments endpoint...');
    const todayResponse = await axios.get(`${BASE_URL}/doctors/appointments/today`, {
      headers: {
        'Authorization': `Bearer ${doctorToken}`
      }
    });

    console.log('✅ Today\'s appointments endpoint working!');
    console.log('📊 Today\'s appointments data:');
    console.log(JSON.stringify(todayResponse.data, null, 2));

    if (todayResponse.data.data && todayResponse.data.data.length > 0) {
      console.log(`\n📋 Found ${todayResponse.data.data.length} appointments for today`);
      todayResponse.data.data.forEach((apt, index) => {
        console.log(`   ${index + 1}. ${apt.patient_name} at ${apt.appointment_time} (${apt.status})`);
      });
    } else {
      console.log('\n📋 No appointments found for today');
    }

  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
    if (error.response?.status) {
      console.error('Status:', error.response.status);
    }
  }
}

testTodayAppointments();
