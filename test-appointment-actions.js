require('dotenv').config();
const axios = require('axios');

async function testAppointmentActions() {
  try {
    console.log('🧪 Testing Doctor Appointment Action endpoints...\n');

    // 1. Authenticate as doctor
    console.log('1. Authenticating as doctor...');
    const loginResponse = await axios.post('http://localhost:5000/api/auth/login', {
      email: 'test.doctor@clinicalapp.com',
      password: 'testdoctor123'
    });

    if (!loginResponse.data.success) {
      console.log('❌ Authentication failed:', loginResponse.data.message);
      return;
    }

    const token = loginResponse.data.data.token;
    console.log('✅ Doctor authenticated successfully');

    const headers = {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };

    // 2. Get today's appointments to find a scheduled one
    console.log('\n2. Fetching today\'s appointments...');
    const dashboardResponse = await axios.get('http://localhost:5000/api/doctors/dashboard', { headers });
    
    const todayAppointments = dashboardResponse.data.data.todayAppointments.appointments;
    const scheduledAppointment = todayAppointments.find(apt => apt.status === 'scheduled');
    
    if (!scheduledAppointment) {
      console.log('❌ No scheduled appointments found for testing');
      return;
    }

    console.log(`✅ Found scheduled appointment: ${scheduledAppointment.appointmentId} at ${scheduledAppointment.appointmentTime}`);
    const appointmentId = scheduledAppointment.id;

    // 3. Test appointment status updates
    console.log('\n3. Testing appointment status updates...');
    
    // Test updating status to 'in-progress'
    console.log('   a) Starting appointment...');
    try {
      const startResponse = await axios.patch(
        `http://localhost:5000/api/doctors/appointments/${appointmentId}/action`,
        { action: 'start' },
        { headers }
      );
      
      if (startResponse.data.success) {
        console.log('   ✅ Successfully started appointment');
        console.log('   📋 Response:', JSON.stringify(startResponse.data, null, 4));
      } else {
        console.log('   ❌ Failed to start appointment:', startResponse.data.message);
      }
    } catch (error) {
      console.log('   ❌ Error starting appointment:', error.response?.data?.message || error.message);
    }

    // Test updating status to 'completed'
    console.log('   b) Completing appointment...');
    try {
      const completeResponse = await axios.patch(
        `http://localhost:5000/api/doctors/appointments/${appointmentId}/action`,
        { 
          action: 'complete',
          notes: 'Patient examination completed successfully. Vital signs normal.'
        },
        { headers }
      );
      
      if (completeResponse.data.success) {
        console.log('   ✅ Successfully completed appointment');
        console.log('   📋 Response:', JSON.stringify(completeResponse.data, null, 4));
      } else {
        console.log('   ❌ Failed to complete appointment:', completeResponse.data.message);
      }
    } catch (error) {
      console.log('   ❌ Error completing appointment:', error.response?.data?.message || error.message);
    }

    // 4. Test adding medical notes
    console.log('\n4. Testing medical notes endpoint...');
    try {
      const notesResponse = await axios.post(
        `http://localhost:5000/api/doctors/appointments/${appointmentId}/notes`,
        {
          notes: 'Additional notes: Patient responded well to treatment. Follow-up recommended in 2 weeks.',
          diagnosis: 'General health checkup - Normal findings',
          prescription: 'Vitamin D supplement, take once daily'
        },
        { headers }
      );
      
      if (notesResponse.data.success) {
        console.log('✅ Successfully added medical notes');
        console.log('📋 Response:', JSON.stringify(notesResponse.data, null, 4));
      } else {
        console.log('❌ Failed to add medical notes:', notesResponse.data.message);
      }
    } catch (error) {
      console.log('❌ Error adding medical notes:', error.response?.data?.message || error.message);
    }

    // 5. Test updating appointment status directly
    console.log('\n5. Testing direct status update endpoint...');
    try {
      const statusResponse = await axios.patch(
        `http://localhost:5000/api/doctors/appointments/${appointmentId}/status`,
        {
          status: 'completed',
          notes: 'Final status update - appointment concluded'
        },
        { headers }
      );
      
      if (statusResponse.data.success) {
        console.log('✅ Successfully updated appointment status');
        console.log('📋 Response:', JSON.stringify(statusResponse.data, null, 4));
      } else {
        console.log('❌ Failed to update status:', statusResponse.data.message);
      }
    } catch (error) {
      console.log('❌ Error updating status:', error.response?.data?.message || error.message);
    }

    // 6. Verify final state
    console.log('\n6. Verifying final appointment state...');
    const finalDashboard = await axios.get('http://localhost:5000/api/doctors/dashboard', { headers });
    const finalAppointments = finalDashboard.data.data.todayAppointments.appointments;
    const updatedAppointment = finalAppointments.find(apt => apt.id === appointmentId);
    
    if (updatedAppointment) {
      console.log('✅ Final appointment state:');
      console.log(`   Status: ${updatedAppointment.status}`);
      console.log(`   Time: ${updatedAppointment.appointmentTime}`);
      console.log(`   Reason: ${updatedAppointment.reason}`);
    }

    console.log('\n✅ All appointment action tests completed!');

  } catch (error) {
    console.error('❌ Test error:', error.response?.data || error.message);
  }
}

testAppointmentActions();
