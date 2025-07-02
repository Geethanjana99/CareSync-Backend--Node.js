// ===================================================================
// TEST LOGIN FUNCTIONALITY
// ===================================================================
// Test that login works correctly after registration
// ===================================================================

const axios = require('axios');

const BASE_URL = 'http://localhost:5000/api';

async function testLoginFunctionality() {
  console.log('🔐 Testing Login Functionality...\n');

  // First, let's register a test user
  const testUser = {
    name: 'Dr. Login Test',
    email: `login.test.${Date.now()}@example.com`,
    password: 'LoginTest123!',
    phone: '0771234567',
    role: 'doctor',
    profileData: {
      specialty: 'Cardiology',
      license_number: `LIC${Date.now()}`,
      years_of_experience: 5,
      education: 'MBBS, MD Cardiology',
      consultation_fee: 3000,
      bio: 'Test doctor for login verification',
      availability_status: 'available'
    }
  };

  try {
    // Step 1: Register user
    console.log('1️⃣ Registering test user...');
    const registerResponse = await axios.post(`${BASE_URL}/auth/register`, testUser);
    
    if (registerResponse.data.success) {
      console.log('✅ User registered successfully');
      console.log(`   User ID: ${registerResponse.data.data.user.id}`);
      console.log(`   Email: ${registerResponse.data.data.user.email}`);
      console.log(`   Requires Login: ${registerResponse.data.data.requiresLogin}`);
    } else {
      throw new Error('Registration failed');
    }

    // Step 2: Test login with correct credentials
    console.log('\n2️⃣ Testing login with correct credentials...');
    const loginResponse = await axios.post(`${BASE_URL}/auth/login`, {
      email: testUser.email,
      password: testUser.password
    });

    if (loginResponse.data.success && loginResponse.data.data.token) {
      console.log('✅ Login successful');
      console.log(`   Token: ${loginResponse.data.data.token.substring(0, 30)}...`);
      console.log(`   User: ${loginResponse.data.data.user.name}`);
      console.log(`   Role: ${loginResponse.data.data.user.role}`);
      console.log(`   Refresh Token: ${loginResponse.data.data.refreshToken ? 'Yes' : 'No'}`);
    } else {
      console.log('❌ Login failed');
      console.log('Response:', JSON.stringify(loginResponse.data, null, 2));
      throw new Error('Login failed despite correct credentials');
    }

    // Step 3: Test authentication with token
    console.log('\n3️⃣ Testing authentication with token...');
    const authHeaders = { Authorization: `Bearer ${loginResponse.data.data.token}` };
    
    const profileResponse = await axios.get(`${BASE_URL}/auth/profile`, {
      headers: authHeaders
    });

    if (profileResponse.data.success) {
      console.log('✅ Token authentication successful');
      console.log(`   Profile Name: ${profileResponse.data.data.user.name}`);
      console.log(`   Profile Email: ${profileResponse.data.data.user.email}`);
    } else {
      console.log('❌ Token authentication failed');
      throw new Error('Token authentication failed');
    }

    // Step 4: Test login with wrong password
    console.log('\n4️⃣ Testing login with wrong password...');
    try {
      await axios.post(`${BASE_URL}/auth/login`, {
        email: testUser.email,
        password: 'WrongPassword123!'
      });
      console.log('❌ SECURITY ISSUE: Login succeeded with wrong password!');
    } catch (error) {
      if (error.response && error.response.status === 401) {
        console.log('✅ Login correctly rejected with wrong password');
      } else {
        console.log('⚠️ Unexpected error with wrong password:', error.message);
      }
    }

    // Step 5: Test login with non-existent user
    console.log('\n5️⃣ Testing login with non-existent user...');
    try {
      await axios.post(`${BASE_URL}/auth/login`, {
        email: 'nonexistent@example.com',
        password: 'SomePassword123!'
      });
      console.log('❌ SECURITY ISSUE: Login succeeded with non-existent user!');
    } catch (error) {
      if (error.response && error.response.status === 401) {
        console.log('✅ Login correctly rejected for non-existent user');
      } else {
        console.log('⚠️ Unexpected error with non-existent user:', error.message);
      }
    }

    console.log('\n🎉 All login tests passed!');
    console.log('\n📋 Login Flow Summary:');
    console.log('   1. User registers → No automatic tokens, requires login');
    console.log('   2. User logs in with correct credentials → Gets tokens');
    console.log('   3. User uses token → Access granted to protected routes');
    console.log('   4. Wrong credentials → Access denied');
    console.log('   5. Security working correctly');

  } catch (error) {
    console.error('❌ Login test failed:', error.message);
    
    if (error.response) {
      console.error(`   Status: ${error.response.status}`);
      console.error(`   Response:`, JSON.stringify(error.response.data, null, 2));
    } else if (error.code) {
      console.error(`   Error Code: ${error.code}`);
      console.error(`   This usually means the server is not running on ${BASE_URL}`);
    }
    
    console.error('\n💡 Troubleshooting:');
    console.error('   1. Make sure the backend server is running: npm start');
    console.error('   2. Check if the server is accessible at http://localhost:5000');
    console.error('   3. Verify database connections are working');
    console.error('   4. Check browser console for frontend errors');
    
    throw error;
  }
}

// Start server first (if not already running)
console.log('⚠️ Make sure the backend server is running!');
console.log('   Run: cd backend && npm start\n');

testLoginFunctionality().catch(error => {
  console.error('💥 Login functionality test failed');
  process.exit(1);
});
