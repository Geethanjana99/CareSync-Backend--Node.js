/**
 * Test Admin Health Prediction API Endpoints
 * 
 * This script tests the admin functionality for processing patient health data submissions
 * and generating AI predictions.
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:5000/api';

// Test admin credentials (replace with actual admin credentials)
const ADMIN_CREDENTIALS = {
  email: 'admin@test.com', // Update with real admin email
  password: 'admin123' // Update with real admin password
};

let adminToken = null;

async function loginAsAdmin() {
  try {
    console.log('🔐 Logging in as admin...');
    
    const response = await axios.post(`${BASE_URL}/auth/login`, ADMIN_CREDENTIALS);
    
    if (response.data.success) {
      adminToken = response.data.data.token;
      console.log('✅ Admin login successful');
      return true;
    } else {
      console.error('❌ Admin login failed:', response.data.message);
      return false;
    }
  } catch (error) {
    console.error('❌ Admin login error:', error.response?.data?.message || error.message);
    return false;
  }
}

async function testGetPatientSubmissions() {
  try {
    console.log('\n📋 Testing: Get Patient Submissions...');
    
    const response = await axios.get(`${BASE_URL}/admin/health-predictions?status=all&page=1&limit=5`, {
      headers: {
        'Authorization': `Bearer ${adminToken}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (response.data.success) {
      console.log('✅ Successfully retrieved patient submissions');
      console.log(`📊 Found ${response.data.data.submissions.length} submissions`);
      
      // Display sample submission
      if (response.data.data.submissions.length > 0) {
        const sample = response.data.data.submissions[0];
        console.log('📄 Sample submission:');
        console.log(`   - ID: ${sample.id}`);
        console.log(`   - Patient: ${sample.patientInfo.name}`);
        console.log(`   - Status: ${sample.status}`);
        console.log(`   - Created: ${new Date(sample.createdAt).toLocaleDateString()}`);
        
        return sample.id; // Return ID for further testing
      }
    } else {
      console.error('❌ Failed to get submissions:', response.data.message);
    }
  } catch (error) {
    console.error('❌ Error getting submissions:', error.response?.data?.message || error.message);
  }
  
  return null;
}

async function testGetAdminDashboard() {
  try {
    console.log('\n📊 Testing: Get Admin Dashboard...');
    
    const response = await axios.get(`${BASE_URL}/admin/health-predictions/dashboard`, {
      headers: {
        'Authorization': `Bearer ${adminToken}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (response.data.success) {
      console.log('✅ Successfully retrieved admin dashboard');
      const stats = response.data.data.statistics;
      console.log('📈 Dashboard Statistics:');
      console.log(`   - Total Submissions: ${stats.totalSubmissions}`);
      console.log(`   - Pending: ${stats.pendingSubmissions}`);
      console.log(`   - Processing: ${stats.processingSubmissions}`);
      console.log(`   - Processed: ${stats.processedSubmissions}`);
      console.log(`   - Failed: ${stats.failedSubmissions}`);
      console.log(`   - Average Probability: ${(stats.averageProbability * 100).toFixed(1)}%`);
    } else {
      console.error('❌ Failed to get dashboard:', response.data.message);
    }
  } catch (error) {
    console.error('❌ Error getting dashboard:', error.response?.data?.message || error.message);
  }
}

async function testProcessSubmission(submissionId) {
  if (!submissionId) {
    console.log('\n⚠️  No submission ID available for processing test');
    return;
  }
  
  try {
    console.log(`\n🤖 Testing: Process Submission ${submissionId}...`);
    
    const response = await axios.post(`${BASE_URL}/admin/health-predictions/${submissionId}/process`, {}, {
      headers: {
        'Authorization': `Bearer ${adminToken}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (response.data.success) {
      console.log('✅ Successfully processed submission with AI');
      const result = response.data.data;
      console.log('🎯 AI Prediction Results:');
      console.log(`   - Prediction: ${result.prediction === 1 ? 'Diabetes Detected' : 'No Diabetes'}`);
      console.log(`   - Probability: ${(result.probability * 100).toFixed(1)}%`);
      console.log(`   - Risk Level: ${result.riskLevel}`);
      console.log(`   - Status: ${result.status}`);
    } else {
      console.error('❌ Failed to process submission:', response.data.message);
      
      // Check if it's an AI service error
      if (response.data.error && response.data.error.includes('AI service')) {
        console.log('💡 Note: AI prediction service may not be running. This is expected in development.');
        console.log('   The admin interface will still work - it will just show "failed" status for AI processing.');
      }
    }
  } catch (error) {
    console.error('❌ Error processing submission:', error.response?.data?.message || error.message);
    
    // Check for specific AI service errors
    if (error.response?.data?.message?.includes('AI service')) {
      console.log('💡 Note: AI prediction service connectivity issue. This is normal if the ML service is not running.');
    }
  }
}

async function testGetSubmissionDetails(submissionId) {
  if (!submissionId) {
    console.log('\n⚠️  No submission ID available for details test');
    return;
  }
  
  try {
    console.log(`\n🔍 Testing: Get Submission Details ${submissionId}...`);
    
    const response = await axios.get(`${BASE_URL}/admin/health-predictions/${submissionId}`, {
      headers: {
        'Authorization': `Bearer ${adminToken}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (response.data.success) {
      console.log('✅ Successfully retrieved submission details');
      const submission = response.data.data;
      console.log('📋 Submission Details:');
      console.log(`   - Patient: ${submission.patientInfo.name} (${submission.patientInfo.email})`);
      console.log(`   - Health Data: Age ${submission.healthData.age}, BMI ${submission.healthData.bmi}, Glucose ${submission.healthData.glucose}`);
      console.log(`   - Status: ${submission.status}`);
      
      if (submission.certification) {
        console.log('   - Has Doctor Certification: Yes');
      } else {
        console.log('   - Has Doctor Certification: No');
      }
    } else {
      console.error('❌ Failed to get submission details:', response.data.message);
    }
  } catch (error) {
    console.error('❌ Error getting submission details:', error.response?.data?.message || error.message);
  }
}

async function runAdminHealthPredictionTests() {
  console.log('🧪 Starting Admin Health Prediction API Tests...\n');
  
  // Step 1: Login as admin
  const loginSuccess = await loginAsAdmin();
  if (!loginSuccess) {
    console.log('\n❌ Tests aborted - could not login as admin');
    console.log('💡 Make sure:');
    console.log('   1. Backend server is running');
    console.log('   2. Admin user exists in database');
    console.log('   3. Admin credentials are correct in this test file');
    return;
  }
  
  // Step 2: Test admin dashboard
  await testGetAdminDashboard();
  
  // Step 3: Test getting patient submissions
  const sampleSubmissionId = await testGetPatientSubmissions();
  
  // Step 4: Test getting submission details
  await testGetSubmissionDetails(sampleSubmissionId);
  
  // Step 5: Test processing submission (if we have one)
  await testProcessSubmission(sampleSubmissionId);
  
  console.log('\n✅ Admin Health Prediction API tests completed!');
  console.log('\n📝 Next steps:');
  console.log('1. Start the frontend: npm run dev (in Clinical-Appointment-Scheduling-System folder)');
  console.log('2. Login as admin user');
  console.log('3. Navigate to Admin Health Predictions page');
  console.log('4. View patient submissions and process them with AI');
  console.log('5. Optionally start the AI prediction service for full functionality');
}

// Run the tests
runAdminHealthPredictionTests().catch(console.error);