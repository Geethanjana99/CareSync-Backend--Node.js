const axios = require('axios');

async function testBookingPageDoctorLoad() {
  try {
    console.log('🔍 Testing appointment booking page doctor loading...');
    
    // Step 1: Login as patient
    console.log('1. Logging in as test patient...');
    const loginResponse = await axios.post('http://localhost:5000/api/auth/login', {
      email: 'testpatient1751270720002@example.com',
      password: 'Patient123!'
    });
    
    if (!loginResponse.data.success) {
      console.log('❌ Login failed:', loginResponse.data.message);
      return;
    }
    
    console.log('✅ Login successful');
    const token = loginResponse.data.data.accessToken;
    
    // Step 2: Test the public doctor search endpoint (used by frontend)
    console.log('2. Testing public doctor search endpoint...');
    const publicSearchResponse = await axios.get('http://localhost:5000/api/doctors/search?limit=50');
    
    if (publicSearchResponse.data.success) {
      const doctors = publicSearchResponse.data.data;
      console.log(`✅ Public search found ${doctors.length} doctors`);
      
      // Show first few doctors
      doctors.slice(0, 3).forEach((doctor, index) => {
        console.log(`   ${index + 1}. ${doctor.name} (${doctor.specialty}) - ${doctor.availability_status}`);
      });
    } else {
      console.log('❌ Public search failed:', publicSearchResponse.data.message);
    }
    
    // Step 3: Test the authenticated doctor search (original endpoint)
    console.log('3. Testing authenticated doctor search...');
    try {
      const authSearchResponse = await axios.get('http://localhost:5000/api/patients/doctors/search', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (authSearchResponse.data.success) {
        console.log(`✅ Authenticated search found ${authSearchResponse.data.data.length} doctors`);
      } else {
        console.log('❌ Authenticated search failed:', authSearchResponse.data.message);
      }
    } catch (error) {
      console.log('❌ Authenticated search failed:', error.response?.data?.message || error.message);
    }
    
    console.log('\n🎉 Frontend should now be able to load doctors in the booking page!');
    console.log('📝 Test patient credentials:');
    console.log('   Email: testpatient1751270720002@example.com');
    console.log('   Password: Patient123!');
    console.log('🔗 Navigate to: http://localhost:5173/patient/book-appointment');
    
  } catch (error) {
    console.error('❌ Test failed:', error.response?.data?.message || error.message);
  }
}

testBookingPageDoctorLoad();
