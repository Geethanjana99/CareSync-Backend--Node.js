// ===================================================================
// TEST REGISTRATION REDIRECT FIX
// ===================================================================
// Test that registration no longer provides tokens and requires login
// ===================================================================

const axios = require('axios');

const BASE_URL = 'http://localhost:5000/api';

async function testRegistrationRedirectFix() {
  console.log('🔧 Testing Registration Redirect Fix...\n');

  const testUser = {
    name: 'Dr. Redirect Test',
    email: `redirect.test.${Date.now()}@example.com`,
    password: 'RedirectTest123!',
    phone: '0771234567',
    role: 'doctor',
    profileData: {
      specialty: 'Cardiology',
      license_number: `LIC${Date.now()}`,
      years_of_experience: 5,
      education: 'MBBS, MD Cardiology',
      consultation_fee: 3000,
      bio: 'Test doctor for redirect verification',
      availability_status: 'available'
    }
  };

  try {    // Test 1: Registration should NOT provide tokens
    console.log('1️⃣ Testing registration response (should not include tokens)...');
    const registerResponse = await axios.post(`${BASE_URL}/auth/register`, testUser);
    
    if (!registerResponse.data || !registerResponse.data.success) {
      throw new Error('Registration request failed or returned invalid response');
    }
    
    console.log('Registration Response:');
    console.log(JSON.stringify(registerResponse.data, null, 2));
    
    // Check that tokens are NOT included
    const hasToken = registerResponse.data.data && registerResponse.data.data.token;
    const hasRefreshToken = registerResponse.data.data && registerResponse.data.data.refreshToken;
    const requiresLogin = registerResponse.data.data && registerResponse.data.data.requiresLogin;
    
    if (!hasToken && !hasRefreshToken && requiresLogin) {
      console.log('✅ SUCCESS: Registration no longer provides tokens');
      console.log('✅ SUCCESS: User must login explicitly');
      console.log('✅ SUCCESS: requiresLogin flag is set');
    } else {
      console.log('❌ ISSUE: Registration still provides tokens or missing requiresLogin flag');
      console.log(`   Token present: ${!!hasToken}`);
      console.log(`   Refresh token present: ${!!hasRefreshToken}`);
      console.log(`   Requires login flag: ${requiresLogin}`);
      throw new Error('Registration behavior does not match expected redirect fix');
    }

    // Test 2: User should be able to login after registration
    console.log('\n2️⃣ Testing login after registration...');
    const loginResponse = await axios.post(`${BASE_URL}/auth/login`, {
      email: testUser.email,
      password: testUser.password
    });    if (loginResponse.data.success && loginResponse.data.data.token) {
      console.log('✅ SUCCESS: User can login after registration');
      console.log(`✅ Token provided on login: ${loginResponse.data.data.token.substring(0, 20)}...`);
      console.log(`✅ User role: ${loginResponse.data.data.user.role}`);
      
      // Test 3: Verify dashboard access works with login token
      console.log('\n3️⃣ Testing dashboard access with login token...');
      const authHeaders = { Authorization: `Bearer ${loginResponse.data.data.token}` };
      
      const dashboardResponse = await axios.get(`${BASE_URL}/doctors/dashboard`, {
        headers: authHeaders
      });
      
      if (dashboardResponse.data.success) {
        console.log('✅ SUCCESS: Dashboard accessible after proper login');
      } else {
        console.log('❌ ISSUE: Dashboard access failed despite valid token');
        console.log(`   Dashboard response:`, JSON.stringify(dashboardResponse.data, null, 2));
      }
    } else {
      console.log('❌ ISSUE: Login failed after registration');
      console.log(`   Login response:`, JSON.stringify(loginResponse.data, null, 2));
      throw new Error('Login failed after successful registration');
    }    console.log('\n🎉 Registration redirect fix working correctly!');
    console.log('\n📋 Fixed Behavior:');
    console.log('   1. User registers → NO automatic tokens');
    console.log('   2. User redirected to login page');
    console.log('   3. User logs in → receives tokens');
    console.log('   4. User redirected to dashboard');
    
    // Cleanup test data
    await cleanup(registerResponse.data.data.user.id, loginResponse.data.data.token);
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    
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
    
    throw error;
  }
}

async function cleanup(userId, authToken) {
  try {
    console.log('\n🧹 Cleaning up test data...');
    // Note: This would require an admin endpoint to delete users
    // For now, we'll just log that cleanup should be done
    console.log(`   Test user ID: ${userId}`);
    console.log('   (Manual cleanup may be required from database)');
  } catch (error) {
    console.warn('⚠️ Cleanup failed:', error.message);
  }
}

// Start server first (if not already running)
console.log('⚠️ Make sure the backend server is running!');
console.log('   Run: cd backend && npm start\n');

testRegistrationRedirectFix().catch(error => {
  console.error('💥 Registration redirect test failed');
  process.exit(1);
});
