const axios = require('axios');

const BASE_URL = 'http://localhost:5000/api';

async function verifyMedicalNotes() {
  try {
    console.log('🔍 Verifying Medical Notes were saved...');

    // 1. Login as doctor
    const loginResponse = await axios.post(`${BASE_URL}/auth/login`, {
      email: 'test.doctor@clinicalapp.com',
      password: 'testdoctor123'
    });

    const doctorToken = loginResponse.data.data.token;
    console.log('✅ Doctor authenticated');

    // 2. Get today's appointments to see the updated notes
    const todayResponse = await axios.get(`${BASE_URL}/doctors/appointments/today`, {
      headers: {
        'Authorization': `Bearer ${doctorToken}`
      }
    });

    console.log('✅ Retrieved today\'s appointments');
    console.log(`📋 Found ${todayResponse.data.data.length} appointments`);

    // 3. Check the appointment that we added notes to
    const appointmentWithNotes = todayResponse.data.data.find(apt => 
      apt.id === '88843ab5-4501-11f0-b3cf-7c5079e930f8'
    );

    if (appointmentWithNotes) {
      console.log('\n📝 Appointment with medical notes:');
      console.log(`   ID: ${appointmentWithNotes.id}`);
      console.log(`   Status: ${appointmentWithNotes.status}`);
      console.log(`   Completed: ${appointmentWithNotes.completed_at}`);
      console.log(`   Notes:\n${appointmentWithNotes.notes}`);
      
      if (appointmentWithNotes.notes && appointmentWithNotes.notes.includes('MEDICAL NOTES')) {
        console.log('\n✅ Medical notes successfully saved to appointment!');
      } else {
        console.log('\n⚠️ Medical notes not found in appointment');
      }
    } else {
      console.log('\n❌ Appointment not found');
    }

  } catch (error) {
    console.error('❌ Verification failed:', error.response?.data || error.message);
  }
}

verifyMedicalNotes();
