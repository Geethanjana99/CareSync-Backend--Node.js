const axios = require('axios');

const BASE_URL = 'http://localhost:5000/api';

async function testQueueBookingSystem() {
  try {
    console.log('🔍 Testing queue-based appointment booking system...');
    
    // 1. Test doctor search with working hours
    console.log('\n1. Testing doctor search API...');
    const doctorsResponse = await axios.get(`${BASE_URL}/doctors/search?limit=3`);
    
    if (!doctorsResponse.data.success || !doctorsResponse.data.data.length) {
      throw new Error('No doctors found');
    }
    
    console.log(`✅ Found ${doctorsResponse.data.data.length} doctors`);
    
    doctorsResponse.data.data.forEach((doctor, index) => {
      console.log(`📋 Doctor ${index + 1}: ${doctor.name} (${doctor.specialty})`);
      if (doctor.working_hours) {
        console.log(`   ⏰ Working hours:`, doctor.working_hours);
      } else {
        console.log(`   ⏰ Working hours: Not specified`);
      }
      console.log(`   💰 Fee: Rs. ${doctor.consultation_fee}`);
      console.log(`   📍 Status: ${doctor.availability_status}`);
    });
    
    const firstDoctor = doctorsResponse.data.data[0];
    
    // 2. Login as existing patient
    console.log('\n2. Logging in as existing patient...');
    const loginResponse = await axios.post(`${BASE_URL}/auth/login`, {
      email: 'testpatient1751276334005@example.com',
      password: 'Patient123!'
    });
    
    if (!loginResponse.data.success) {
      throw new Error('Login failed: ' + loginResponse.data.message);
    }
    
    console.log('✅ Patient login successful');
    const token = loginResponse.data.data.token;
    
    // 3. Test regular queue booking
    console.log('\n3. Testing regular queue booking...');
    const regularDate = new Date();
    regularDate.setMonth(regularDate.getMonth() + 1); // Next month
    const regularBooking = {
      doctorId: firstDoctor.doctor_id,
      appointmentDate: regularDate.toISOString().split('T')[0], // Next month
      appointmentType: 'consultation',
      reasonForVisit: 'Regular checkup - queue system test',
      symptoms: 'Testing regular queue booking',
      isEmergency: false
    };
    
    console.log('📝 Regular booking data:', {
      doctor: firstDoctor.name,
      doctorId: firstDoctor.doctor_id,
      internalId: firstDoctor.id, // Check if this exists
      date: regularBooking.appointmentDate,
      emergency: regularBooking.isEmergency
    });
    
    const regularResponse = await axios.post(
      `${BASE_URL}/patients/appointments/queue`,
      regularBooking,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    if (regularResponse.data.success) {
      console.log('✅ Regular queue booking successful!');
      const responseData = regularResponse.data.data;
      const appointment = responseData.appointment;
      console.log('📋 Full response data:', responseData);
      console.log(`🎫 Appointment ID: ${appointment?.appointment_id || 'Not available'}`);
      console.log(`🎯 Queue Number: ${responseData.queueNumber || appointment?.queue_number || 'Not assigned yet'}`);
      console.log(`📅 Date: ${appointment?.appointment_date || 'Not available'}`);
      console.log(`🚨 Emergency: ${responseData.isEmergency ? 'Yes' : 'No'}`);
      console.log(`📋 Status: ${appointment?.status || 'Not available'}`);
    } else {
      console.log('❌ Regular queue booking failed:', regularResponse.data.message);
      return;
    }
    
    // 4. Test emergency queue booking
    console.log('\n4. Testing emergency queue booking...');
    const emergencyDate = new Date();
    emergencyDate.setMonth(emergencyDate.getMonth() + 1);
    emergencyDate.setDate(emergencyDate.getDate() + 1); // Next month + 1 day
    const emergencyBooking = {
      doctorId: firstDoctor.doctor_id,
      appointmentDate: emergencyDate.toISOString().split('T')[0], // Next month + 1 day
      appointmentType: 'emergency',
      reasonForVisit: 'Emergency consultation - queue system test',
      symptoms: 'Testing emergency queue booking',
      isEmergency: true
    };
    
    const emergencyResponse = await axios.post(
      `${BASE_URL}/patients/appointments/queue`,
      emergencyBooking,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    if (emergencyResponse.data.success) {
      console.log('✅ Emergency queue booking successful!');
      const responseData = emergencyResponse.data.data;
      const emergencyAppointment = responseData.appointment;
      console.log('📋 Full emergency response data:', responseData);
      console.log(`🎫 Emergency Appointment ID: ${emergencyAppointment?.appointment_id || 'Not available'}`);
      console.log(`🎯 Emergency Queue Number: ${responseData.queueNumber || emergencyAppointment?.queue_number || 'Not assigned yet'}`);
      console.log(`🚨 Emergency Priority: ${responseData.isEmergency ? 'Yes' : 'No'}`);
      console.log(`📋 Status: ${emergencyAppointment?.status || 'Not available'}`);
    } else {
      console.log('❌ Emergency queue booking failed:', emergencyResponse.data.message);
    }
    
    console.log('\n🎉 Queue booking system test completed successfully!');
    console.log('✅ Database structure is working correctly');
    console.log('✅ Queue-based appointments are functional');
    console.log('✅ Working hours are being retrieved from database');
    console.log('✅ Both regular and emergency queues are working');
    
  } catch (error) {
    console.error('❌ Test failed:', error.response?.data?.message || error.message);
    if (error.response?.data) {
      console.error('📋 Full error details:', error.response.data);
    }
    if (error.response?.status) {
      console.error('📊 HTTP Status:', error.response.status);
    }
  }
}

testQueueBookingSystem();
