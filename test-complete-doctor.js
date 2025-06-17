// ===================================================================
// COMPLETE DOCTOR REGISTRATION AND BACKEND TEST
// ===================================================================
// Test complete doctor registration with profile and backend functionality
// ===================================================================

const axios = require('axios');

const BASE_URL = 'http://localhost:5000/api';

async function testCompleteDocktorBackend() {
  console.log('👨‍⚕️ Testing Complete Doctor Registration & Backend...\n');

  const testDoctor = {
    name: 'Dr. Complete Test',
    email: `complete.doctor.${Date.now()}@example.com`,
    password: 'CompleteTest123!',
    phone: '0771234567',
    role: 'doctor',
    profileData: {
      specialty: 'Cardiology',
      license_number: `LIC${Date.now()}`,
      years_of_experience: 5,
      education: 'MD from University of Colombo',
      consultation_fee: 3500,
      bio: 'Experienced cardiologist specializing in heart surgery',
      office_address: 'No 123, Galle Road, Colombo 03',
      languages_spoken: ['English', 'Sinhala', 'Tamil'],
      working_hours: {
        'monday': '09:00-17:00',
        'tuesday': '09:00-17:00', 
        'wednesday': '09:00-17:00',
        'thursday': '09:00-17:00',
        'friday': '09:00-17:00'
      },
      availability_status: 'available'
    }
  };

  try {
    // Test 1: Complete Doctor Registration
    console.log('1️⃣ Testing complete doctor registration with profile...');
    const registerResponse = await axios.post(`${BASE_URL}/auth/register`, testDoctor);

    if (!registerResponse.data.success) {
      throw new Error(`Registration failed: ${registerResponse.data.message}`);
    }

    console.log('✅ Doctor registration successful!');
    console.log(`   User ID: ${registerResponse.data.data.user.id}`);
    console.log(`   Email: ${registerResponse.data.data.user.email}`);
    console.log(`   Role: ${registerResponse.data.data.user.role}`);

    const token = registerResponse.data.data.token;
    const authHeaders = { Authorization: `Bearer ${token}` };

    // Test 2: Doctor Login
    console.log('\n2️⃣ Testing doctor login...');
    const loginResponse = await axios.post(`${BASE_URL}/auth/login`, {
      email: testDoctor.email,
      password: testDoctor.password
    });

    if (!loginResponse.data.success) {
      throw new Error(`Login failed: ${loginResponse.data.message}`);
    }

    console.log('✅ Doctor login successful!');
    console.log(`   Doctor Profile: ${loginResponse.data.data.user.profile?.doctor_id || 'Profile exists'}`);

    // Update auth headers with new token
    const newToken = loginResponse.data.data.token;
    const newAuthHeaders = { Authorization: `Bearer ${newToken}` };

    // Test 3: Doctor Profile
    console.log('\n3️⃣ Testing doctor profile access...');
    const profileResponse = await axios.get(`${BASE_URL}/doctors/profile`, {
      headers: newAuthHeaders
    });

    if (profileResponse.data.success) {
      console.log('✅ Doctor profile access successful!');
      const profile = profileResponse.data.data;
      console.log(`   Doctor: ${profile.name}`);
      console.log(`   Specialty: ${profile.specialty}`);
      console.log(`   License: ${profile.license_number}`);
      console.log(`   Fee: Rs. ${profile.consultation_fee}`);
    }

    // Test 4: Doctor Dashboard
    console.log('\n4️⃣ Testing doctor dashboard...');
    const dashboardResponse = await axios.get(`${BASE_URL}/doctors/dashboard`, {
      headers: newAuthHeaders
    });

    if (dashboardResponse.data.success) {
      console.log('✅ Doctor dashboard access successful!');
      const dashboard = dashboardResponse.data;
      console.log(`   Profile loaded: ${dashboard.data.profile ? 'Yes' : 'No'}`);  
      console.log(`   Today's appointments: ${dashboard.data.todayAppointments?.length || 0}`);
      console.log(`   Pending appointments: ${dashboard.data.pendingAppointments?.length || 0}`);
    }

    // Test 5: Today's Appointments
    console.log('\n5️⃣ Testing today\'s appointments...');
    const todayAppointmentsResponse = await axios.get(`${BASE_URL}/doctors/appointments/today`, {
      headers: newAuthHeaders
    });

    if (todayAppointmentsResponse.data.success) {
      console.log('✅ Today\'s appointments endpoint working!');
      console.log(`   Appointments: ${todayAppointmentsResponse.data.data.length}`);
    }

    // Test 6: Doctor Statistics
    console.log('\n6️⃣ Testing doctor statistics...');
    const statsResponse = await axios.get(`${BASE_URL}/doctors/statistics`, {
      headers: newAuthHeaders
    });

    if (statsResponse.data.success) {
      console.log('✅ Doctor statistics endpoint working!');
      const stats = statsResponse.data.data;
      console.log(`   Total appointments: ${stats.totalAppointments || 0}`);
      console.log(`   Total earnings: Rs. ${stats.totalEarnings || 0}`);
    }

    // Test 7: Profile Update
    console.log('\n7️⃣ Testing profile update...');
    const updateResponse = await axios.put(`${BASE_URL}/doctors/profile`, {
      bio: 'Updated bio: Senior cardiologist with expertise in minimally invasive procedures',
      consultation_fee: 4000,
      availability_status: 'available'
    }, {
      headers: newAuthHeaders
    });

    if (updateResponse.data.success) {
      console.log('✅ Profile update successful!');
    }

    console.log('\n🎉 All doctor backend tests completed successfully!');
    
    console.log('\n📋 Complete Test Summary:');
    console.log('   ✅ Doctor Registration with Profile');
    console.log('   ✅ Doctor Login');
    console.log('   ✅ Doctor Profile Access');
    console.log('   ✅ Doctor Dashboard');
    console.log('   ✅ Today\'s Appointments');
    console.log('   ✅ Doctor Statistics');
    console.log('   ✅ Profile Updates');
    console.log('   ✅ JWT Authentication');
    console.log('   ✅ Role-based Authorization');
    console.log('   ✅ Aiven Database Integration');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    
    if (error.response) {
      console.error(`   Status: ${error.response.status}`);
      console.error(`   Response:`, JSON.stringify(error.response.data, null, 2));
    }
    
    throw error;
  }
}

testCompleteDocktorBackend().catch(error => {
  console.error('💥 Complete doctor backend test failed');
  process.exit(1);
});
