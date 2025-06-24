// ===================================================================
// TEST APPOINTMENT BOOKING FUNCTIONALITY
// ===================================================================
// This script tests the doctor search and appointment booking
// ===================================================================

const axios = require('axios');

const BASE_URL = 'http://localhost:5000/api';

const testPatient = {
  email: 'patient.test@example.com',
  password: 'Patient123!'
};

async function testAppointmentBooking() {
  console.log('🔍 Testing Appointment Booking Functionality...\n');
  
  try {
    // Step 1: Login as patient
    console.log('🔐 Logging in as patient...');
    const loginResponse = await axios.post(`${BASE_URL}/auth/login`, testPatient, { 
      timeout: 10000 
    });
    
    if (!loginResponse.data.success) {
      throw new Error(`Login failed: ${loginResponse.data.message}`);
    }
    
    const token = loginResponse.data.data.token;
    const authHeaders = { Authorization: `Bearer ${token}` };
      console.log('✅ Patient login successful');
    console.log(`   User: ${loginResponse.data.data.user.name}`);
    console.log(`   Role: ${loginResponse.data.data.user.role}`);
    console.log(`   User ID: ${loginResponse.data.data.user.id}`);
    
    // Step 2: Search for doctors
    console.log('\n🔍 Searching for available doctors...');
    const searchResponse = await axios.get(`${BASE_URL}/patients/doctors/search`, { 
      headers: authHeaders,
      timeout: 10000 
    });
    
    if (!searchResponse.data.success) {
      throw new Error(`Doctor search failed: ${searchResponse.data.message}`);
    }
    
    const doctors = searchResponse.data.data;
    console.log(`✅ Found ${doctors.length} doctors`);
    
    if (doctors.length > 0) {
      console.log('\n📋 Available Doctors:');
      doctors.forEach((doctor, index) => {
        console.log(`   ${index + 1}. ${doctor.name} - ${doctor.specialty} (Rs. ${doctor.consultation_fee})`);
      });
      
      // Step 3: Try to book an appointment with the first doctor
      const selectedDoctor = doctors[0];
      console.log(`\n📅 Attempting to book appointment with ${selectedDoctor.name}...`);
        const appointmentData = {
        doctorId: selectedDoctor.id,
        appointmentDate: '2025-06-25', // Tomorrow
        appointmentTime: '10:00',
        appointmentType: 'consultation',
        reasonForVisit: 'routine-checkup',
        symptoms: 'General health checkup',
        priority: 'medium'
      };
      
      const bookingResponse = await axios.post(`${BASE_URL}/appointments`, appointmentData, { 
        headers: authHeaders,
        timeout: 10000 
      });
      
      if (bookingResponse.data.success) {
        console.log('✅ Appointment booked successfully!');
        console.log(`   Appointment ID: ${bookingResponse.data.data.id}`);
        console.log(`   Date: ${appointmentData.appointmentDate}`);
        console.log(`   Time: ${appointmentData.appointmentTime}`);
        console.log(`   Doctor: ${selectedDoctor.name}`);
      } else {
        console.log(`❌ Appointment booking failed: ${bookingResponse.data.message}`);
      }
      
    } else {
      console.log('⚠️ No doctors found in the system');
    }
    
    console.log('\n🎉 Appointment booking test completed!');
    
  } catch (error) {
    if (error.response && error.response.data) {
      console.error('❌ Test failed:', error.response.data.message || error.response.data);
    } else {
      console.error('❌ Test failed:', error.message);
    }
  }
}

// Run the test
testAppointmentBooking();
