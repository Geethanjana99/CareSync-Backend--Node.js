const axios = require('axios');

async function testDoctorAvailabilityAPI() {
  const BASE_URL = 'http://localhost:5000/api';
  
  try {
    console.log('🔍 Testing doctor availability API...');
    
    // First, login as a patient
    console.log('\n1. Logging in as test patient...');
    const loginResponse = await axios.post(`${BASE_URL}/auth/login`, {
      email: 'patient.test.new@example.com',
      password: 'Password123!'
    });
    
    if (!loginResponse.data.success) {
      throw new Error(`Login failed: ${loginResponse.data.message}`);
    }
    
    const token = loginResponse.data.data.token;
    const authHeaders = { 
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };
    
    console.log('✅ Login successful');
    
    // Get doctors list first
    console.log('\n2. Getting doctors list...');
    const doctorsResponse = await axios.get(`${BASE_URL}/patients/doctors/search`, {
      headers: authHeaders
    });
    
    if (doctorsResponse.data.success && doctorsResponse.data.data.length > 0) {
      const firstDoctor = doctorsResponse.data.data[0];
      console.log(`   Found doctor: ${firstDoctor.name} (${firstDoctor.doctor_id})`);
      
      // Test availability for different dates
      const testDates = [
        '2025-07-02', // Wednesday
        '2025-07-05', // Saturday
        '2025-07-07'  // Monday
      ];
      
      for (const testDate of testDates) {
        console.log(`\n3. Testing availability for ${firstDoctor.name} on ${testDate}...`);
        
        try {
          const availabilityResponse = await axios.get(
            `${BASE_URL}/patients/doctors/${firstDoctor.doctor_id}/availability?date=${testDate}`,
            { headers: authHeaders }
          );
          
          if (availabilityResponse.data.success) {
            const availability = availabilityResponse.data.data;
            console.log(`   ✅ ${availability.isAvailable ? 'Available' : 'Not Available'}`);
            console.log(`   📅 Date: ${availability.date}`);
            console.log(`   ⏰ Time Range: ${availability.timeRange || 'N/A'}`);
            console.log(`   💬 Message: ${availability.message}`);
            
            if (availability.detailedSlots) {
              console.log(`   📋 Detailed slots: ${availability.detailedSlots.length} slots`);
            }
          } else {
            console.log(`   ❌ API Error: ${availabilityResponse.data.message}`);
          }
        } catch (availError) {
          console.log(`   ❌ Request failed: ${availError.response?.data?.message || availError.message}`);
        }
      }
    } else {
      console.log('❌ No doctors found');
    }
    
    console.log('\n✅ Doctor availability API test complete');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    if (error.response) {
      console.error('Response data:', error.response.data);
    }
    process.exit(1);
  }
}

testDoctorAvailabilityAPI();
