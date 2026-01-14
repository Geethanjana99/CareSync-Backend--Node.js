const mysql = require('mysql2/promise');
require('dotenv').config();

async function createRegistrationTestSuite() {
  console.log('🧪 REGISTRATION TEST SUITE');
  console.log('==========================\n');
  
  // Test data for different user types
  const testUsers = [
    {
      type: 'patient',
      userData: {
        name: 'Test Patient User',
        email: `testpatient${Date.now()}@test.com`,
        password: 'TestPass123!',
        role: 'patient',
        phone: '0771234567',
        profileData: {
          gender: 'male',
          date_of_birth: '1990-01-01',
          address: '123 Test Street, Colombo',
          emergency_contact_name: 'Test Contact',
          emergency_contact_phone: '0779876543'
        }
      }
    },
    {
      type: 'doctor',
      userData: {
        name: 'Test Doctor User',
        email: `testdoctor${Date.now()}@test.com`,
        password: 'TestPass123!',
        role: 'doctor',
        phone: '0771234568',
        profileData: {
          specialty: 'Cardiology', // This is crucial!
          license_number: 'LIC123456789',
          experience_years: 10,
          consultation_fee: 200,
          bio: 'Experienced cardiologist with 10+ years',
          education: 'MBBS, MD Cardiology',
          languages_spoken: 'English, Sinhala'
        }
      }
    }
  ];
  
  console.log('📋 Test cases prepared:');
  testUsers.forEach((test, index) => {
    console.log(`${index + 1}. ${test.type.toUpperCase()} registration test`);
    console.log(`   Email: ${test.userData.email}`);
    console.log(`   Has profileData: ${test.userData.profileData ? 'Yes' : 'No'}`);
    if (test.userData.profileData) {
      const keys = Object.keys(test.userData.profileData);
      console.log(`   ProfileData fields: ${keys.join(', ')}`);
    }
    console.log('');
  });
  
  console.log('🔧 To run these tests:');
  console.log('1. Start your backend server: npm start');
  console.log('2. Use these test data in your frontend or Postman');
  console.log('3. Make POST requests to: http://localhost:5000/api/auth/register');
  console.log('');
  
  // Generate curl commands for testing
  console.log('📡 CURL Commands for Testing:');
  console.log('============================');
  
  testUsers.forEach((test, index) => {
    console.log(`${index + 1}. ${test.type.toUpperCase()} Registration:`);
    console.log('curl -X POST http://localhost:5000/api/auth/register \\');
    console.log('  -H "Content-Type: application/json" \\');
    console.log(`  -d '${JSON.stringify(test.userData, null, 2).replace(/\n/g, '\\n  ')}'`);
    console.log('');
  });
  
  console.log('✅ Expected Results:');
  console.log('- User created in users table');
  console.log('- Corresponding profile created in patients/doctors table');
  console.log('- No orphaned users');
  console.log('- Proper role-based access working');
  
  return testUsers;
}

// Export the test data for use in other scripts
module.exports = { createRegistrationTestSuite };

// Run if called directly
if (require.main === module) {
  createRegistrationTestSuite();
}