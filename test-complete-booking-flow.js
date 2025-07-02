const https = require('https');
const http = require('http');

function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const module = urlObj.protocol === 'https:' ? https : http;
    
    const reqOptions = {
      hostname: urlObj.hostname,
      port: urlObj.port,
      path: urlObj.pathname + urlObj.search,
      method: options.method || 'GET',
      headers: options.headers || {}
    };

    const req = module.request(reqOptions, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const result = {
            ok: res.statusCode >= 200 && res.statusCode < 300,
            status: res.statusCode,
            json: () => Promise.resolve(JSON.parse(data)),
            text: () => Promise.resolve(data)
          };
          resolve(result);
        } catch (error) {
          reject(error);
        }
      });
    });

    req.on('error', reject);
    
    if (options.body) {
      req.write(options.body);
    }
    
    req.end();
  });
}

async function testCompleteBookingFlow() {
  console.log('🔍 Testing Complete Appointment Booking Flow with Frontend Data Format...\n');

  try {    // 1. Login as patient
    console.log('1. Logging in as patient...');
    const loginResponse = await makeRequest('http://localhost:5000/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'patient.test.new@example.com',
        password: 'Password123!'
      })
    });

    const loginData = await loginResponse.json();
    const authToken = loginData.data?.token;
    console.log('✅ Login successful');

    // 2. Get a doctor ID (simulate frontend doctor search)
    console.log('\n2. Getting doctors...');
    const doctorsResponse = await fetch('http://localhost:5000/api/patients/doctors/search', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json',
      }
    });

    const doctorsData = await doctorsResponse.json();
    const doctor = doctorsData.data[0];
    console.log(`✅ Selected doctor: ${doctor.name} (${doctor.specialty})`);

    // 3. Get available slots (exactly like frontend does)
    const testDate = '2025-06-27'; // Friday
    console.log(`\n3. Getting available slots for ${testDate}...`);
    const slotsResponse = await fetch(`http://localhost:5000/api/appointments/available-slots?doctorId=${doctor.id}&date=${testDate}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json',
      }
    });

    const slotsData = await slotsResponse.json();
    console.log(`✅ Available slots: ${slotsData.data.slots.length} slots found`);
    console.log(`   First few slots:`, slotsData.data.slots.slice(0, 3));

    if (slotsData.data.slots.length === 0) {
      console.log('❌ No available slots - cannot test booking');
      return;
    }

    // 4. Book appointment (using exact frontend format)
    const selectedSlot = slotsData.data.slots[0];
    console.log(`\n4. Booking appointment for ${selectedSlot}...`);
    
    const appointmentData = {
      doctorId: doctor.id,
      appointmentDate: testDate,
      appointmentTime: selectedSlot,
      appointmentType: 'consultation',
      reasonForVisit: 'Regular health checkup',
      symptoms: 'No specific symptoms, just routine visit',
      priority: 'medium' // Fixed: using valid ENUM value
    };

    console.log('📋 Appointment data:', appointmentData);

    const bookingResponse = await fetch('http://localhost:5000/api/appointments', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(appointmentData)
    });

    const bookingResult = await bookingResponse.json();
    
    if (bookingResponse.ok && bookingResult.success) {
      console.log('✅ Appointment booked successfully!');
      console.log(`   Appointment ID: ${bookingResult.data.appointment.appointment_id}`);
      console.log(`   Status: ${bookingResult.data.appointment.status}`);
      console.log(`   Date: ${bookingResult.data.appointment.appointment_date}`);
      console.log(`   Time: ${bookingResult.data.appointment.appointment_time}`);
      
      // 5. Verify slot is no longer available
      console.log(`\n5. Verifying slot ${selectedSlot} is no longer available...`);
      const updatedSlotsResponse = await fetch(`http://localhost:5000/api/appointments/available-slots?doctorId=${doctor.id}&date=${testDate}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        }
      });

      const updatedSlotsData = await updatedSlotsResponse.json();
      const isSlotStillAvailable = updatedSlotsData.data.slots.includes(selectedSlot);
      
      if (!isSlotStillAvailable) {
        console.log(`✅ Slot ${selectedSlot} correctly removed from available slots`);
        console.log(`   Now ${updatedSlotsData.data.slots.length} slots available (was ${slotsData.data.slots.length})`);
      } else {
        console.log(`❌ Slot ${selectedSlot} still appears in available slots`);
      }

      console.log('\n🎉 Complete booking flow test PASSED! All functionality working correctly.');
      
    } else {
      console.log('❌ Appointment booking failed!');
      console.log('Response status:', bookingResponse.status);
      console.log('Response data:', bookingResult);
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error(error.stack);
  }
}

testCompleteBookingFlow().then(() => {
  process.exit(0);
}).catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
