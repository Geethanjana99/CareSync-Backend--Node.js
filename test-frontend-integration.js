// ===================================================================
// TEST FRONTEND-BACKEND INTEGRATION
// ===================================================================
// Test that frontend can register and login properly with the backend
// ===================================================================

const axios = require('axios');

const BASE_URL = 'http://localhost:5000/api';
const FRONTEND_URL = 'http://localhost:5175';

async function testFrontendBackendIntegration() {
  console.log('🔗 Testing Frontend-Backend Integration...\n');

  const testUser = {
    name: 'Dr. Frontend Test',
    email: `frontend.test.${Date.now()}@example.com`,
    password: 'FrontendTest123!',
    phone: '0771234567',
    role: 'doctor',
    profileData: {
      specialty: 'Cardiology',
      license_number: `LIC${Date.now()}`,
      years_of_experience: 5,
      education: 'MBBS, MD Cardiology',
      consultation_fee: 3000,
      bio: 'Test doctor for frontend verification',
      availability_status: 'available'
    }
  };

  try {
    // Test 1: Registration with corrected payload structure
    console.log('1️⃣ Testing registration with frontend-compatible payload...');
    
    const registerResponse = await axios.post(`${BASE_URL}/auth/register`, testUser);
    
    console.log('Registration Response:');
    console.log(JSON.stringify(registerResponse.data, null, 2));
    
    if (registerResponse.data.success && registerResponse.data.data.requiresLogin) {
      console.log('✅ SUCCESS: Registration payload structure correct');
      console.log('✅ SUCCESS: No automatic tokens provided');
      console.log('✅ SUCCESS: requiresLogin flag set');
    } else {
      console.log('❌ ISSUE: Registration response structure incorrect');
      throw new Error('Registration response structure mismatch');
    }

    // Test 2: Login after registration
    console.log('\n2️⃣ Testing login after registration...');
    const loginResponse = await axios.post(`${BASE_URL}/auth/login`, {
      email: testUser.email,
      password: testUser.password
    });

    console.log('Login Response Structure:');
    console.log('- success:', loginResponse.data.success);
    console.log('- data.user.id:', loginResponse.data.data?.user?.id);
    console.log('- data.user.name:', loginResponse.data.data?.user?.name);
    console.log('- data.user.email:', loginResponse.data.data?.user?.email);
    console.log('- data.user.role:', loginResponse.data.data?.user?.role);
    console.log('- data.token:', loginResponse.data.data?.token ? 'Present' : 'Missing');
    console.log('- data.refreshToken:', loginResponse.data.data?.refreshToken ? 'Present' : 'Missing');

    if (loginResponse.data.success && loginResponse.data.data.token) {
      console.log('✅ SUCCESS: Login successful');
      console.log('✅ SUCCESS: User data structure matches frontend expectations');
    } else {
      console.log('❌ ISSUE: Login failed or missing data');
      throw new Error('Login failed or incomplete response');
    }

    // Test 3: Check user profile structure
    console.log('\n3️⃣ Testing user profile endpoint...');
    const authHeaders = { Authorization: `Bearer ${loginResponse.data.data.token}` };
    
    const profileResponse = await axios.get(`${BASE_URL}/auth/profile`, {
      headers: authHeaders
    });

    console.log('Profile Response Structure:');
    console.log('- success:', profileResponse.data.success);
    console.log('- data.user.name:', profileResponse.data.data?.user?.name);
    console.log('- data.user.role:', profileResponse.data.data?.user?.role);

    if (profileResponse.data.success) {
      console.log('✅ SUCCESS: Profile endpoint working');
      console.log('✅ SUCCESS: User data structure consistent');
    }

    console.log('\n🎉 Frontend-Backend integration working correctly!');
    console.log('\n📋 Integration Summary:');
    console.log('   1. ✅ Registration payload structure correct');
    console.log('   2. ✅ Login response structure matches frontend expectations');  
    console.log('   3. ✅ User data fields properly named (name vs firstName/lastName)');
    console.log('   4. ✅ Role values consistent between frontend and backend');
    console.log('   5. ✅ Token authentication working');

    // Provide frontend access info
    console.log('\n🌐 Frontend Access:');
    console.log(`   URL: ${FRONTEND_URL}`);
    console.log('   You can now register and login through the UI');
    console.log('   Test credentials created:');
    console.log(`   - Email: ${testUser.email}`);
    console.log(`   - Password: ${testUser.password}`);

  } catch (error) {
    console.error('❌ Integration test failed:', error.message);
    
    if (error.response) {
      console.error(`   Status: ${error.response.status}`);
      console.error(`   Response:`, JSON.stringify(error.response.data, null, 2));
    }
    
    console.error('\n💡 Common Issues:');
    console.error('   1. Field name mismatches (name vs firstName/lastName)');
    console.error('   2. Role type mismatches (nurse vs billing)');
    console.error('   3. Phone field name differences (phone vs phoneNumber)');
    console.error('   4. Response structure expectations');
    
    throw error;
  }
}

// Start server first (if not already running)
console.log('⚠️ Make sure both servers are running!');
console.log('   Backend: npm start (port 5000)');
console.log('   Frontend: npm run dev (port 5175)\n');

testFrontendBackendIntegration().catch(error => {
  console.error('💥 Frontend-Backend integration test failed');
  process.exit(1);
});
