// ===================================================================
// API ENDPOINTS TEST WITH AIVEN DATABASE
// ===================================================================
// Test the actual API endpoints to ensure they work with Aiven.io
// ===================================================================

const axios = require('axios');
const { v4: uuidv4 } = require('uuid');

const BASE_URL = 'http://localhost:5000/api';

// Test data
const testDoctor = {
  name: 'Dr. API Test',
  email: `api.test.doctor.${Date.now()}@example.com`,
  password: 'ApiTest123!',
  phone: '0771234567', // Valid Sri Lankan format
  specialty: 'Cardiology',
  licenseNumber: `LIC${Date.now()}`,
  consultationFee: 300,
  experience: 5,
  education: 'MD from Test University',
  bio: 'Test doctor for API verification'
};

async function testAPIEndpoints() {
  console.log('🌐 Testing API Endpoints with Aiven Database...\n');

  try {
    // Test 1: Health Check
    console.log('🔍 Testing health check endpoint...');
    try {
      const healthResponse = await axios.get(`${BASE_URL}/health`, { timeout: 10000 });
      console.log('✅ Health check passed:', healthResponse.data);
    } catch (healthError) {
      console.log('⚠️ Health endpoint not available, continuing with auth tests...');
    }

    // Test 2: Doctor Registration
    console.log('\n👨‍⚕️ Testing doctor registration...');
    const registerResponse = await axios.post(`${BASE_URL}/auth/register`, {
      name: testDoctor.name,
      email: testDoctor.email,
      password: testDoctor.password,
      phone: testDoctor.phone,
      role: 'doctor',
      specialty: testDoctor.specialty,
      licenseNumber: testDoctor.licenseNumber,
      consultationFee: testDoctor.consultationFee,
      experience: testDoctor.experience,
      education: testDoctor.education,
      bio: testDoctor.bio
    }, { timeout: 10000 });

    if (registerResponse.data.success) {
      console.log('✅ Doctor registration successful');
      console.log(`   Doctor ID: ${registerResponse.data.data.doctorId}`);
      console.log(`   User ID: ${registerResponse.data.data.userId}`);
    } else {
      throw new Error(`Registration failed: ${registerResponse.data.message}`);
    }

    // Test 3: Doctor Login
    console.log('\n🔐 Testing doctor login...');
    const loginResponse = await axios.post(`${BASE_URL}/auth/login`, {
      email: testDoctor.email,
      password: testDoctor.password
    }, { timeout: 10000 });

    if (!loginResponse.data.success) {
      throw new Error(`Login failed: ${loginResponse.data.message}`);
    }

    const token = loginResponse.data.data.token;
    const authHeaders = { Authorization: `Bearer ${token}` };
    
    console.log('✅ Doctor login successful');
    console.log(`   Token received: ${token.substring(0, 20)}...`);
    console.log(`   User: ${loginResponse.data.data.user.name}`);
    console.log(`   Role: ${loginResponse.data.data.user.role}`);

    // Test 4: Protected Doctor Dashboard
    console.log('\n📊 Testing doctor dashboard endpoint...');
    const dashboardResponse = await axios.get(`${BASE_URL}/doctors/dashboard`, {
      headers: authHeaders,
      timeout: 10000
    });

    if (dashboardResponse.data.success) {
      console.log('✅ Doctor dashboard access successful');
      const dashboard = dashboardResponse.data.data;
      console.log(`   Doctor: ${dashboard.profile?.doctor_name || 'N/A'}`);
      console.log(`   Specialties: ${dashboard.specialties?.length || 0} available`);
      console.log(`   Today's appointments: ${dashboard.todayAppointments?.length || 0}`);
      console.log(`   Pending appointments: ${dashboard.pendingAppointments?.length || 0}`);
    }

    // Test 5: Doctor Profile Update
    console.log('\n📝 Testing doctor profile update...');
    const updateResponse = await axios.put(`${BASE_URL}/doctors/profile`, {
      bio: 'Updated bio for API test verification',
      consultationFee: 350,
      availability_status: 'available'
    }, {
      headers: authHeaders,
      timeout: 10000
    });

    if (updateResponse.data.success) {
      console.log('✅ Doctor profile update successful');
    }

    // Test 6: Get All Specialties
    console.log('\n🏥 Testing medical specialties endpoint...');
    const specialtiesResponse = await axios.get(`${BASE_URL}/doctors/specialties`, {
      timeout: 10000
    });

    if (specialtiesResponse.data.success) {
      console.log('✅ Medical specialties retrieved successfully');
      console.log(`   Available specialties: ${specialtiesResponse.data.data.length}`);
      specialtiesResponse.data.data.slice(0, 5).forEach(spec => {
        console.log(`   - ${spec.name}`);
      });
    }

    // Test 7: Search Doctors
    console.log('\n🔍 Testing doctor search endpoint...');
    const searchResponse = await axios.get(`${BASE_URL}/doctors/search?specialty=Cardiology&status=active`, {
      timeout: 10000
    });

    if (searchResponse.data.success) {
      console.log('✅ Doctor search successful');
      console.log(`   Found ${searchResponse.data.data.length} cardiologists`);
    }

    // Test 8: User Profile
    console.log('\n👤 Testing user profile endpoint...');
    const profileResponse = await axios.get(`${BASE_URL}/auth/profile`, {
      headers: authHeaders,
      timeout: 10000
    });

    if (profileResponse.data.success) {
      console.log('✅ User profile access successful');
      console.log(`   User: ${profileResponse.data.data.name}`);
      console.log(`   Email: ${profileResponse.data.data.email}`);
      console.log(`   Role: ${profileResponse.data.data.role}`);
    }

    console.log('\n🎉 All API endpoint tests completed successfully!');
    
    console.log('\n📋 API Test Summary:');
    console.log('   ✅ Doctor Registration');
    console.log('   ✅ Doctor Login');
    console.log('   ✅ JWT Authentication');
    console.log('   ✅ Doctor Dashboard');
    console.log('   ✅ Profile Updates');
    console.log('   ✅ Medical Specialties');
    console.log('   ✅ Doctor Search');
    console.log('   ✅ User Profile');

  } catch (error) {
    console.error('❌ API test failed:', error.message);
    
    if (error.response) {
      console.error(`   Status: ${error.response.status}`);
      console.error(`   Response: ${JSON.stringify(error.response.data, null, 2)}`);
    } else if (error.request) {
      console.error('   No response received from server');
      console.error('   Make sure the backend server is running on port 5000');
    } else if (error.code === 'ECONNREFUSED') {
      console.error('   Connection refused - server may not be running');
    }
    
    throw error;
  }
}

// Run the test
console.log('⚠️ Make sure the backend server is running before executing this test!');
console.log('   Run: cd backend && npm start\n');

testAPIEndpoints().catch(error => {
  console.error('💥 API test suite failed');
  process.exit(1);
});
