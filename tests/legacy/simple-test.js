const axios = require('axios');

async function simpleTest() {
  try {
    console.log('Testing health endpoint...');
    const healthResponse = await axios.get('http://localhost:5000/health');
    console.log('Health check:', healthResponse.data);
    
    console.log('\nTesting login...');
    let loginResponse;
    
    // Try the credentials provided by the user
    const credentials = [
      { email: 'doctor@gmail.com', password: 'Doctor@123' },
      { email: 'asanka.bandara@caresync.lk', password: 'Doctor123!' },
      { email: 'doctor@gmail.com', password: 'Doctor123!' }
    ];
    
    for (const cred of credentials) {
      try {
        console.log(`Trying ${cred.email} with password: ${cred.password}`);
        loginResponse = await axios.post('http://localhost:5000/api/auth/login', cred);
        if (loginResponse.data.success) {
          console.log('✅ Login successful!');
          break;
        }
      } catch (err) {
        console.log(`❌ Failed: ${err.response?.data?.message || err.message}`);
      }
    }
    
    if (!loginResponse || !loginResponse.data.success) {
      console.log('❌ All login attempts failed');
      return;
    }
    
    const token = loginResponse.data.data.token;
    console.log('\nTesting patients endpoint...');
    
    const patientsResponse = await axios.get('http://localhost:5000/api/doctors/patients', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    console.log('Patients endpoint response:', {
      success: patientsResponse.data.success,
      debug: patientsResponse.data.data?.debug,
      patientsCount: patientsResponse.data.data?.patients?.length || 0
    });
    
    if (patientsResponse.data.data?.debug?.appointmentDetails) {
      console.log('\nAppointment details:', patientsResponse.data.data.debug.appointmentDetails);
    }
    
    if (patientsResponse.data.data?.patients?.length > 0) {
      console.log('\nSample patient data:');
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
    console.error('Error details:', {
      message: error.message,
      code: error.code,
      status: error.response?.status,
      data: error.response?.data
    });
  }
}

simpleTest();