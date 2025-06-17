// ===================================================================
// SIMPLE API TEST - AUTHENTICATION VERIFICATION
// ===================================================================
// Basic test to verify authentication is working with Aiven database
// ===================================================================

const axios = require('axios');

const BASE_URL = 'http://localhost:5000/api';

async function testBasicAuth() {
  console.log('🔐 Testing Basic Authentication with Aiven Database...\n');

  const testUser = {
    name: 'Dr. Basic Test',
    email: `basic.test.${Date.now()}@example.com`,
    password: 'BasicTest123!',
    phone: '0771234567',
    role: 'doctor'
  };

  try {
    // Test 1: Doctor Registration
    console.log('1️⃣ Testing doctor registration...');
    const registerResponse = await axios.post(`${BASE_URL}/auth/register`, testUser);
    
    console.log('✅ Registration Response:');
    console.log(JSON.stringify(registerResponse.data, null, 2));

    // Test 2: Doctor Login
    console.log('\n2️⃣ Testing doctor login...');
    const loginResponse = await axios.post(`${BASE_URL}/auth/login`, {
      email: testUser.email,
      password: testUser.password
    });
    
    console.log('✅ Login Response:');
    console.log(JSON.stringify(loginResponse.data, null, 2));

    if (loginResponse.data.success && loginResponse.data.data.token) {
      const token = loginResponse.data.data.token;
      const authHeaders = { Authorization: `Bearer ${token}` };
      
      // Test 3: Get User Profile
      console.log('\n3️⃣ Testing authenticated user profile...');
      const profileResponse = await axios.get(`${BASE_URL}/auth/profile`, {
        headers: authHeaders
      });
      
      console.log('✅ Profile Response:');
      console.log(JSON.stringify(profileResponse.data, null, 2));

      console.log('\n🎉 Basic authentication tests completed successfully!');
      console.log('\n📋 Summary:');
      console.log('   ✅ User Registration');
      console.log('   ✅ User Login');
      console.log('   ✅ JWT Authentication');
      console.log('   ✅ Protected Route Access');
      console.log('   ✅ Database Integration');
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    
    if (error.response) {
      console.error(`   Status: ${error.response.status}`);
      console.error(`   Response:`, JSON.stringify(error.response.data, null, 2));
    }
    
    throw error;
  }
}

testBasicAuth().catch(error => {
  console.error('💥 Basic auth test failed');
  process.exit(1);
});
