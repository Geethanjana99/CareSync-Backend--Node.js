const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

async function testAllDoctorEndpoints() {
  try {
    console.log('Testing all doctor endpoints...');
    
    // First, login with the test doctor
    const loginResponse = await fetch('http://localhost:5000/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'testdoctor@example.com',
        password: 'testpass123'
      })
    });
    
    if (loginResponse.status !== 200) {
      console.log('Login failed');
      return;
    }
    
    const loginData = await loginResponse.json();
    const token = loginData.data.token;
    console.log('✅ Login successful');
    
    const headers = {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    };
    
    // Test 1: Get today's appointments
    console.log('\n1. Testing GET /api/doctor/appointments/today');
    const appointmentsResponse = await fetch('http://localhost:5000/api/doctor/appointments/today', {
      method: 'GET',
      headers
    });
    console.log('Status:', appointmentsResponse.status);
    if (appointmentsResponse.status === 200) {
      const appointments = await appointmentsResponse.json();
      console.log('✅ Appointments:', appointments.length, 'found');
    } else {
      const error = await appointmentsResponse.text();
      console.log('❌ Error:', error);
    }
    
    // Test 2: Get availability
    console.log('\n2. Testing GET /api/doctor/availability');
    const availabilityResponse = await fetch('http://localhost:5000/api/doctor/availability', {
      method: 'GET',
      headers
    });
    console.log('Status:', availabilityResponse.status);
    if (availabilityResponse.status === 200) {
      const availability = await availabilityResponse.json();
      console.log('✅ Availability:', availability);
    } else {
      const error = await availabilityResponse.text();
      console.log('❌ Error:', error);
    }
    
    // Test 3: Update availability status
    console.log('\n3. Testing PUT /api/doctor/availability/status');
    const statusResponse = await fetch('http://localhost:5000/api/doctor/availability/status', {
      method: 'PUT',
      headers,
      body: JSON.stringify({ status: 'available' })
    });
    console.log('Status:', statusResponse.status);
    if (statusResponse.status === 200) {
      const result = await statusResponse.json();
      console.log('✅ Status update:', result.message);
    } else {
      const error = await statusResponse.text();
      console.log('❌ Error:', error);
    }
    
    // Test 4: Update working hours
    console.log('\n4. Testing PUT /api/doctor/availability/working-hours');
    const workingHoursResponse = await fetch('http://localhost:5000/api/doctor/availability/working-hours', {
      method: 'PUT',
      headers,
      body: JSON.stringify({
        working_hours: {
          monday: { start: '09:00', end: '17:00', available: true },
          tuesday: { start: '09:00', end: '17:00', available: true },
          wednesday: { start: '09:00', end: '17:00', available: true },
          thursday: { start: '09:00', end: '17:00', available: true },
          friday: { start: '09:00', end: '17:00', available: true },
          saturday: { start: '09:00', end: '13:00', available: true },
          sunday: { start: '', end: '', available: false }
        }
      })
    });
    console.log('Status:', workingHoursResponse.status);
    if (workingHoursResponse.status === 200) {
      const result = await workingHoursResponse.json();
      console.log('✅ Working hours update:', result.message);
    } else {
      const error = await workingHoursResponse.text();
      console.log('❌ Error:', error);
    }
    
    // Test 5: Get queue status
    console.log('\n5. Testing GET /api/doctor/queue/status');
    const queueStatusResponse = await fetch('http://localhost:5000/api/doctor/queue/status', {
      method: 'GET',
      headers
    });
    console.log('Status:', queueStatusResponse.status);
    if (queueStatusResponse.status === 200) {
      const queueStatus = await queueStatusResponse.json();
      console.log('✅ Queue status:', queueStatus);
    } else {
      const error = await queueStatusResponse.text();
      console.log('❌ Error:', error);
    }
    
    // Test 6: Toggle queue
    console.log('\n6. Testing PUT /api/doctor/queue/toggle');
    const queueToggleResponse = await fetch('http://localhost:5000/api/doctor/queue/toggle', {
      method: 'PUT',
      headers,
      body: JSON.stringify({ is_active: true })
    });
    console.log('Status:', queueToggleResponse.status);
    if (queueToggleResponse.status === 200) {
      const result = await queueToggleResponse.json();
      console.log('✅ Queue toggle:', result.message);
    } else {
      const error = await queueToggleResponse.text();
      console.log('❌ Error:', error);
    }
    
    console.log('\n🎉 All tests completed!');
    
  } catch (error) {
    console.error('Error testing endpoints:', error);
  }
}

testAllDoctorEndpoints();
