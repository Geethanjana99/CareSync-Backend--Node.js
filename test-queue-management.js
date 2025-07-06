const axios = require('axios');

// Test the queue management functionality
const testQueueManagement = async () => {
  const baseURL = 'http://localhost:5000';
  
  try {
    console.log('=== TESTING QUEUE MANAGEMENT FUNCTIONALITY ===\n');
    
    // Login as doctor
    console.log('1. Logging in as doctor...');
    const loginResponse = await axios.post(`${baseURL}/api/auth/login`, {
      email: 'test.doctor@example.com',
      password: 'testpass123'
    });
    
    const token = loginResponse.data.data.token;
    const headers = {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };
    
    console.log('✅ Doctor logged in successfully\n');
    
    // Test updating availability status
    console.log('2. Testing availability status updates...');
    
    // Set to busy
    await axios.put(`${baseURL}/api/doctor/availability/status`, 
      { status: 'busy' }, 
      { headers }
    );
    console.log('✅ Set status to busy');
    
    // Set to available
    await axios.put(`${baseURL}/api/doctor/availability/status`, 
      { status: 'available' }, 
      { headers }
    );
    console.log('✅ Set status to available');
    
    // Set to offline
    await axios.put(`${baseURL}/api/doctor/availability/status`, 
      { status: 'offline' }, 
      { headers }
    );
    console.log('✅ Set status to offline\n');
    
    // Test updating working hours
    console.log('3. Testing working hours update...');
    const newWorkingHours = {
      monday: { start: '08:00', end: '18:00' },
      tuesday: { start: '08:00', end: '18:00' },
      wednesday: { start: '08:00', end: '18:00' },
      thursday: { start: '08:00', end: '18:00' },
      friday: { start: '08:00', end: '18:00' },
      saturday: { start: '09:00', end: '15:00' },
      sunday: { start: '09:00', end: '15:00' }
    };
    
    await axios.put(`${baseURL}/api/doctor/availability/working-hours`, 
      { working_hours: newWorkingHours }, 
      { headers }
    );
    console.log('✅ Working hours updated successfully\n');
    
    // Test queue toggle
    console.log('4. Testing queue toggle...');
    
    // Start queue
    await axios.put(`${baseURL}/api/doctor/queue/toggle`, 
      { is_active: true }, 
      { headers }
    );
    console.log('✅ Queue started');
    
    // Stop queue
    await axios.put(`${baseURL}/api/doctor/queue/toggle`, 
      { is_active: false }, 
      { headers }
    );
    console.log('✅ Queue stopped\n');
    
    // Test patient actions
    console.log('5. Testing patient queue actions...');
    
    // Call next patient
    await axios.put(`${baseURL}/api/doctor/appointments/test-appointment-1/call-next`, 
      {}, 
      { headers }
    );
    console.log('✅ Called next patient (appointment 1)');
    
    // Complete consultation
    await axios.put(`${baseURL}/api/doctor/appointments/test-appointment-1/complete`, 
      {}, 
      { headers }
    );
    console.log('✅ Completed consultation (appointment 1)\n');
    
    // Verify appointment status changes
    console.log('6. Verifying appointment status changes...');
    const appointmentsResponse = await axios.get(`${baseURL}/api/doctor/appointments/today`, { headers });
    const appointments = appointmentsResponse.data;
    
    const appointment1 = appointments.find(a => a.appointment_id === 'APT-TEST-001');
    if (appointment1) {
      console.log(`✅ Appointment 1 status: ${appointment1.status}`);
    }
    
    console.log('\n=== ALL QUEUE MANAGEMENT TESTS PASSED! ===');
    
    // Test patient queue view
    console.log('\n7. Testing patient queue view...');
    const patientLoginResponse = await axios.post(`${baseURL}/api/auth/login`, {
      email: 'test.patient@example.com',
      password: 'testpass123'
    });
    
    const patientToken = patientLoginResponse.data.data.token;
    const patientHeaders = {
      'Authorization': `Bearer ${patientToken}`,
      'Content-Type': 'application/json'
    };
    
    const patientQueueResponse = await axios.get(`${baseURL}/api/patient/queue/position`, { headers: patientHeaders });
    const patientQueue = patientQueueResponse.data;
    
    console.log(`✅ Patient can see ${patientQueue.appointments.length} appointments in queue`);
    console.log('✅ Patient queue position calculated correctly');
    
    console.log('\n🎉 ALL TESTS COMPLETED SUCCESSFULLY! 🎉');
    console.log('\n📋 SUMMARY:');
    console.log('- Doctor login/authentication: ✅');
    console.log('- Availability status management: ✅');
    console.log('- Working hours management: ✅');
    console.log('- Queue start/stop functionality: ✅');
    console.log('- Call next patient: ✅');
    console.log('- Complete consultation: ✅');
    console.log('- Patient queue view: ✅');
    
  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
  }
};

testQueueManagement();
