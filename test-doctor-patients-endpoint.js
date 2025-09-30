const axios = require('axios');

const API_BASE_URL = 'http://localhost:3000';

async function testDoctorPatientsEndpoint() {
  try {
    console.log('🧪 Testing /api/doctors/patients endpoint...\n');

    // First, try to login as a doctor to get a token
    console.log('1. Attempting to login as doctor...');
    
    const loginResponse = await axios.post(`${API_BASE_URL}/api/auth/login`, {
      email: 'doctor@gmail.com',
      password: 'password123'
    });

    if (!loginResponse.data.success) {
      console.log('❌ Doctor login failed, trying another doctor account...');
      
      // Try with another doctor email
      const altLoginResponse = await axios.post(`${API_BASE_URL}/api/auth/login`, {
        email: 'asanka.bandara@caresync.lk',
        password: 'password123'
      });

      if (!altLoginResponse.data.success) {
        console.log('❌ No doctor accounts available for testing');
        console.log('Login response:', altLoginResponse.data);
        return;
      }
      
      console.log('✅ Doctor login successful');
      var token = altLoginResponse.data.data.token;
    } else {
      console.log('✅ Doctor login successful');
      var token = loginResponse.data.data.token;
    }

    // Test the patients endpoint
    console.log('\n2. Testing /api/doctors/patients endpoint...');
    
    const patientsResponse = await axios.get(`${API_BASE_URL}/api/doctors/patients`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    console.log('✅ Endpoint response:', {
      success: patientsResponse.data.success,
      hasData: !!patientsResponse.data.data,
      patientsCount: patientsResponse.data.data?.patients?.length || 0
    });

    if (patientsResponse.data.data?.patients?.length > 0) {
      console.log('\n📊 Sample patient data:');
      const samplePatient = patientsResponse.data.data.patients[0];
      console.log({
        id: samplePatient.id,
        name: samplePatient.name,
        totalAppointments: samplePatient.totalAppointments,
        completedAppointments: samplePatient.completedAppointments,
        status: samplePatient.status,
        lastVisit: samplePatient.lastVisit
      });
    }

  } catch (error) {
    console.error('❌ Error testing endpoint:', {
      message: error.message,
      status: error.response?.status,
      data: error.response?.data
    });
  }
}

testDoctorPatientsEndpoint();