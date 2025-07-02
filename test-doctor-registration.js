const axios = require('axios');

async function testDoctorSearch() {
  try {
    console.log('🔍 Testing doctor search endpoint...');
    
    // Test the public doctor search endpoint
    const response = await axios.get('http://localhost:5000/api/doctors/search');
    
    if (response.data.success) {
      const doctors = response.data.data;
      console.log(`✅ Found ${doctors.length} doctors:`);
      
      doctors.forEach((doctor, index) => {
        console.log(`${index + 1}. ${doctor.name}`);
        console.log(`   Specialty: ${doctor.specialty}`);
        console.log(`   Status: ${doctor.availability_status}`);
        console.log(`   Email: ${doctor.email}`);
        console.log(`   Rating: ${doctor.rating}/5 (${doctor.total_reviews} reviews)`);
        console.log('');
      });
    } else {
      console.log('❌ Failed to fetch doctors:', response.data.message);
    }
    
  } catch (error) {
    console.error('❌ Error testing doctor search:', error.message);
  }
}

async function registerTestDoctor() {
  try {
    console.log('👨‍⚕️ Registering a new test doctor...');
    
    const doctorData = {
      name: 'Dr. Test NewDoctor',
      email: `newdoctor${Date.now()}@test.com`,
      password: 'Doctor123!',
      phone: '0771234567',
      role: 'doctor',
      profileData: {
        specialty: 'General Medicine',
        license_number: 'LIC123456',
        experience_years: 8,
        consultation_fee: 150,
        bio: 'Experienced general practitioner'
      }
    };
    
    const response = await axios.post('http://localhost:5000/api/auth/register', doctorData);
    
    if (response.data.success) {
      console.log('✅ Doctor registered successfully!');
      console.log('📝 Doctor details:', response.data.data.name);
      
      // Wait a moment then search for doctors again
      console.log('\n⏳ Waiting 2 seconds then searching for doctors...');
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      await testDoctorSearch();
    } else {
      console.log('❌ Failed to register doctor:', response.data.message);
    }
    
  } catch (error) {
    if (error.response && error.response.data) {
      console.error('❌ Registration failed:', error.response.data.message);
      if (error.response.data.errors) {
        console.log('📋 Validation errors:', error.response.data.errors);
      }
    } else {
      console.error('❌ Error registering doctor:', error.message);
    }
  }
}

async function runTest() {
  console.log('🚀 Starting doctor registration and search test...\n');
  
  // First, search for existing doctors
  await testDoctorSearch();
  
  console.log('\n' + '='.repeat(50) + '\n');
  
  // Then register a new doctor and search again
  await registerTestDoctor();
}

runTest();
