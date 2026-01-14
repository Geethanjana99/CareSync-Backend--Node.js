const axios = require('axios');

async function testBillingPatientsEndpoint() {
  try {
    console.log('🏥 TESTING BILLING PATIENTS ENDPOINT');
    console.log('===================================\n');
    
    // Test the billing patients endpoint
    console.log('1️⃣ Testing /api/billing/patient-names endpoint...');
    
    const response = await axios.get('http://localhost:5000/api/billing/patient-names');
    
    if (response.data.success) {
      console.log(`✅ Success! Found ${response.data.data.length} patients`);
      console.log(`📊 Response format:`);
      console.log(JSON.stringify({
        success: response.data.success,
        message: response.data.message,
        dataCount: response.data.data.length,
        sampleData: response.data.data.slice(0, 3)
      }, null, 2));
      
      console.log('\n👥 All patients:');
      response.data.data.forEach((patient, index) => {
        console.log(`  ${index + 1}. ${patient.name} (${patient.email})`);
        if (patient.patientCode) {
          console.log(`      Patient Code: ${patient.patientCode}`);
        }
      });
      
    } else {
      console.log('❌ Failed:', response.data.message);
    }
    
  } catch (error) {
    if (error.response) {
      console.log('❌ HTTP Error:', error.response.status);
      console.log('Response:', error.response.data);
    } else if (error.code === 'ECONNREFUSED') {
      console.log('❌ Cannot connect to server');
      console.log('💡 Make sure backend server is running:');
      console.log('   cd backend && npm start');
    } else {
      console.log('❌ Error:', error.message);
    }
  }
}

// Also test admin endpoint
async function testAdminPatientsEndpoint() {
  try {
    console.log('\n2️⃣ Testing /api/admin/patient-names endpoint...');
    
    const response = await axios.get('http://localhost:5000/api/admin/patient-names');
    
    if (response.data.success) {
      console.log(`✅ Admin endpoint success! Found ${response.data.data.length} patients`);
    } else {
      console.log('❌ Admin endpoint failed:', response.data.message);
    }
    
  } catch (error) {
    if (error.response) {
      console.log('❌ Admin HTTP Error:', error.response.status);
    } else {
      console.log('❌ Admin Error:', error.message);
    }
  }
}

async function runTests() {
  await testBillingPatientsEndpoint();
  await testAdminPatientsEndpoint();
  
  console.log('\n' + '='.repeat(50));
  console.log('🎯 SUMMARY');
  console.log('='.repeat(50));
  console.log('✅ Fixed billing controller mysqlConnection.query() usage');
  console.log('✅ Added proper error handling and logging');
  console.log('✅ Using JOIN with patients table for complete profiles');
  console.log('✅ Corrected column names (is_active vs status)');
  console.log('');
  console.log('🔧 Changes made:');
  console.log('1. Fixed billingController.getPatientNames()');
  console.log('2. Fixed adminController.getPatientNames()');
  console.log('3. Added patient codes and better data structure');
  console.log('4. Improved error responses for frontend');
  console.log('');
  console.log('🚀 Patients should now load properly in billing section!');
}

runTests();