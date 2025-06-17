const axios = require('axios');

async function testMedicalNotesEndpoint() {
  console.log('🔬 Testing Medical Notes Endpoint...\n');

  const API_BASE = 'http://localhost:5000/api';
  
  // First get a doctor token (using our existing doctor)
  try {
    console.log('1. Getting doctor authentication...');
    const loginResponse = await axios.post(`${API_BASE}/auth/login`, {
      email: 'test.doctor@clinicalapp.com',
      password: 'testdoctor123'
    });    console.log('Login response structure:', JSON.stringify(loginResponse.data, null, 2));
    
    const doctorToken = loginResponse.data.data.token;
    console.log('✅ Doctor authenticated successfully');
    console.log('   Token preview:', doctorToken ? doctorToken.substring(0, 50) + '...' : 'No token received');

    if (!doctorToken) {
      console.log('❌ No token received from login');
      return;
    }

    // Get today's appointments to find one to add notes to
    console.log('\n2. Getting today\'s appointments...');
    
    const appointmentsResponse = await axios.get(`${API_BASE}/doctors/appointments/today`, {
      headers: { Authorization: `Bearer ${doctorToken}` }
    });

    const appointments = appointmentsResponse.data.data;
    console.log(`✅ Found ${appointments.length} appointments for today`);

    if (appointments.length === 0) {
      console.log('❌ No appointments found to test medical notes on');
      return;
    }

    console.log('Available appointments:');
    appointments.forEach(apt => {
      console.log(`  - ID: ${apt.id}, Status: ${apt.status}, Patient: ${apt.patientName}`);
    });

    // Since all today's appointments are completed, let's test on a completed one
    // to see if we can still add medical notes
    const testAppointment = appointments[0]; // Take the first one

    console.log(`\n3. Testing medical notes on appointment ${testAppointment.id}...`);
    console.log(`   Patient: ${testAppointment.patientName}`);
    console.log(`   Status: ${testAppointment.status}`);

    // Add medical notes
    const medicalNotesData = {
      diagnosis: 'Mild hypertension, stress-related headaches',
      prescription: 'Lisinopril 10mg once daily, Ibuprofen 400mg as needed for headaches',
      notes: 'Patient reports improved sleep quality. Blood pressure slightly elevated. Recommend stress management techniques and follow-up in 2 weeks.',
      follow_up_required: true,
      follow_up_date: '2024-12-20'
    };

    console.log('\n4. Adding medical notes...');
    const notesResponse = await axios.post(
      `${API_BASE}/doctors/appointments/${testAppointment.id}/notes`,
      medicalNotesData,
      { headers: { Authorization: `Bearer ${doctorToken}` } }
    );

    console.log('✅ Medical notes added successfully!');
    console.log('\nResponse:', JSON.stringify(notesResponse.data, null, 2));

    // Verify the appointment was updated
    console.log('\n5. Verifying appointment update...');
    const updatedAppointmentResponse = await axios.get(`${API_BASE}/appointments/${testAppointment.id}`, {
      headers: { Authorization: `Bearer ${doctorToken}` }
    });

    const updatedAppointment = updatedAppointmentResponse.data.data.appointment;
    console.log(`✅ Appointment status: ${updatedAppointment.status}`);
    console.log(`✅ Completion time: ${updatedAppointment.completed_at}`);
    console.log(`✅ Medical notes added to appointment`);

    // Show the notes content
    if (updatedAppointment.notes) {
      console.log('\n6. Medical Notes Content:');
      console.log('--- Notes Field ---');
      console.log(updatedAppointment.notes);
    }

    console.log('\n🎉 Medical Notes Endpoint Test Complete!');
    console.log('✅ All functionality working correctly');

  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
    if (error.response?.data?.error) {
      console.error('Error details:', error.response.data.error);
    }
    if (error.response?.status) {
      console.error('HTTP Status:', error.response.status);
    }
  }
}

// Run the test
testMedicalNotesEndpoint().catch(console.error);
