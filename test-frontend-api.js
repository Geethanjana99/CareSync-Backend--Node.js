// Test the frontend API call to see what it receives
const axios = require('axios');

async function testFrontendAPI() {
  try {
    console.log('🧪 Testing Frontend-Backend Connection...\n');
    
    // 1. Login as the doctor
    console.log('1️⃣ Logging in as doctor@gmail.com...');
    const loginResponse = await axios.post('http://localhost:5000/api/auth/login', {
      email: 'doctor@gmail.com',
      password: 'Doctor@123'
    });
    
    if (!loginResponse.data.success) {
      console.log('❌ Login failed:', loginResponse.data.message);
      return;
    }
    
    const token = loginResponse.data.token;
    const user = loginResponse.data.user;
    console.log('✅ Login successful');
    console.log(`   - User: ${user.name} (${user.email})`);
    console.log(`   - Role: ${user.role}`);
    console.log(`   - Token: ${token.substring(0, 20)}...`);
    
    // 2. Test the exact API call that the frontend makes
    console.log('\n2️⃣ Testing getDoctorDashboard API (frontend call)...');
    const dashboardResponse = await axios.get('http://localhost:5000/api/doctors/dashboard', {
      headers: { 
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('API Response Status:', dashboardResponse.status);
    console.log('API Response Success:', dashboardResponse.data.success);
    
    if (dashboardResponse.data.success) {
      const data = dashboardResponse.data.data;
      
      console.log('\n📊 FRONTEND WILL RECEIVE THIS DATA:');
      console.log('==================================');
      
      console.log('Doctor Info:');
      console.log(`  - doctor.id: "${data.doctor.id}"`);
      console.log(`  - doctor.name: "${data.doctor.name}"`);
      console.log(`  - doctor.specialty: "${data.doctor.specialty}"`);
      
      console.log('\nToday Appointments Object:');
      console.log(`  - todayAppointments.total: ${data.todayAppointments.total}`);
      console.log(`  - todayAppointments.completed: ${data.todayAppointments.completed}`);
      console.log(`  - todayAppointments.pending: ${data.todayAppointments.pending}`);
      console.log(`  - todayAppointments.inProgress: ${data.todayAppointments.inProgress}`);
      console.log(`  - todayAppointments.appointments: Array(${data.todayAppointments.appointments.length})`);
      
      console.log('\n📋 APPOINTMENTS ARRAY DETAILS:');
      console.log('===============================');
      if (data.todayAppointments.appointments.length > 0) {
        data.todayAppointments.appointments.forEach((apt, i) => {
          console.log(`\nAppointment ${i + 1}:`);
          console.log(`  - id: "${apt.id}"`);
          console.log(`  - appointmentId: "${apt.appointmentId}"`);
          console.log(`  - patientName: "${apt.patientName}"`);
          console.log(`  - status: "${apt.status}"`);
          console.log(`  - queueNumber: "${apt.queueNumber}"`);
          console.log(`  - reason: "${apt.reason}"`);
          console.log(`  - type: "${apt.type}"`);
        });
      } else {
        console.log('❌ APPOINTMENTS ARRAY IS EMPTY!');
      }
      
      console.log('\n🔍 FRONTEND CHECK LOGIC:');
      console.log('========================');
      console.log(`dashboardData.todayAppointments?.total: ${data.todayAppointments?.total || 'undefined'}`);
      console.log(`dashboardData.todayAppointments?.appointments?.length: ${data.todayAppointments?.appointments?.length || 'undefined'}`);
      console.log(`dashboardData.todayAppointments?.appointments?.length > 0: ${(data.todayAppointments?.appointments?.length || 0) > 0}`);
      
      // Show what the frontend condition will evaluate to
      const willShowAppointments = data.todayAppointments?.appointments?.length > 0;
      console.log(`\n🎯 FRONTEND WILL ${willShowAppointments ? 'SHOW' : 'HIDE'} APPOINTMENTS`);
      
      if (!willShowAppointments) {
        console.log('\n🚨 PROBLEM FOUND: Frontend will hide appointments because:');
        if (!data.todayAppointments) {
          console.log('   - todayAppointments object is missing');
        } else if (!data.todayAppointments.appointments) {
          console.log('   - appointments array is missing');
        } else if (data.todayAppointments.appointments.length === 0) {
          console.log('   - appointments array is empty');
        }
      }
      
    } else {
      console.log('❌ Dashboard API failed:', dashboardResponse.data.message);
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', JSON.stringify(error.response.data, null, 2));
    }
  }
}

testFrontendAPI();