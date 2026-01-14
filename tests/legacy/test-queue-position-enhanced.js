/**
 * Test script to verify queue position API includes queue status data
 */

const axios = require('axios');

const API_BASE = 'http://localhost:3000/api';

async function testQueuePositionWithStatus() {
  console.log('🚀 Testing Queue Position API with Queue Status');
  console.log('=' .repeat(60));
  
  try {
    // Test credentials - patient login
    const patientLoginData = {
      email: 'patient@test.com',
      password: '123456'
    };
    
    console.log('🔐 Logging in as test patient...');
    const loginResponse = await axios.post(`${API_BASE}/auth/login`, patientLoginData);
    
    if (!loginResponse.data.success) {
      console.error('❌ Patient login failed:', loginResponse.data.message);
      return;
    }
    
    const token = loginResponse.data.data.token;
    console.log('✅ Patient login successful');
    
    // Test the queue position endpoint
    console.log('\n📊 Testing /patients/queue/position endpoint...');
    const queuePositionResponse = await axios.get(`${API_BASE}/patients/queue/position`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    if (queuePositionResponse.data.success) {
      const queueData = queuePositionResponse.data.data;
      console.log('✅ Queue position data fetched successfully');
      
      console.log('\n🔍 Response Structure Analysis:');
      console.log('==============================');
      
      if (Array.isArray(queueData)) {
        console.log(`📋 Found ${queueData.length} appointment(s)`);
        
        queueData.forEach((appointment, index) => {
          console.log(`\n${index + 1}. Appointment Details:`);
          console.log('   ========================');
          console.log(`   Queue Number: ${appointment.queueNumber}`);
          console.log(`   Is Emergency: ${appointment.isEmergency}`);
          console.log(`   Status: ${appointment.status}`);
          console.log(`   Payment Status: ${appointment.paymentStatus}`);
          console.log(`   Position: ${appointment.position}`);
          console.log(`   Doctor ID: ${appointment.doctorId}`);
          console.log(`   Doctor Name: ${appointment.doctorName}`);
          console.log(`   Specialty: ${appointment.specialty}`);
          console.log(`   Currently Serving: ${appointment.currentlyServing}`);
          
          // Check for queue status information
          if (appointment.queueStatus) {
            console.log(`\n   🎯 Queue Status Information:`);
            console.log(`   ============================`);
            console.log(`   is_active: ${appointment.queueStatus.is_active} (${typeof appointment.queueStatus.is_active})`);
            console.log(`   current_number: ${appointment.queueStatus.current_number}`);
            console.log(`   current_emergency_number: ${appointment.queueStatus.current_emergency_number}`);
            console.log(`   available_from: ${appointment.queueStatus.available_from}`);
            console.log(`   available_to: ${appointment.queueStatus.available_to}`);
            console.log(`   queue_date: ${appointment.queueStatus.queue_date}`);
          } else {
            console.log(`   ❌ Queue Status: NOT INCLUDED`);
          }
          
          // Check for direct queue fields
          if (appointment.currentNumber !== undefined) {
            console.log(`\n   📊 Direct Queue Fields:`);
            console.log(`   ======================`);
            console.log(`   queueActive: ${appointment.queueActive}`);
            console.log(`   currentNumber: ${appointment.currentNumber}`);
            console.log(`   currentEmergencyNumber: ${appointment.currentEmergencyNumber}`);
          }
        });
        
        console.log('\n🧪 Validation Tests:');
        console.log('====================');
        
        let allHaveQueueStatus = true;
        let allHaveBooleanActive = true;
        let allHaveCurrentNumber = true;
        
        queueData.forEach((appointment, index) => {
          if (!appointment.queueStatus) {
            console.log(`❌ Appointment ${index + 1}: Missing queueStatus`);
            allHaveQueueStatus = false;
          } else {
            if (typeof appointment.queueStatus.is_active !== 'boolean') {
              console.log(`❌ Appointment ${index + 1}: is_active not boolean (${typeof appointment.queueStatus.is_active})`);
              allHaveBooleanActive = false;
            }
            if (!appointment.queueStatus.current_number) {
              console.log(`❌ Appointment ${index + 1}: Missing current_number`);
              allHaveCurrentNumber = false;
            }
          }
        });
        
        console.log('\n🎯 VALIDATION RESULTS:');
        console.log('======================');
        console.log(`✅ All have queueStatus: ${allHaveQueueStatus ? '✅ YES' : '❌ NO'}`);
        console.log(`✅ All have boolean is_active: ${allHaveBooleanActive ? '✅ YES' : '❌ NO'}`);
        console.log(`✅ All have current_number: ${allHaveCurrentNumber ? '✅ YES' : '❌ NO'}`);
        
        const allTestsPassed = allHaveQueueStatus && allHaveBooleanActive && allHaveCurrentNumber;
        
        console.log(`\n🏆 OVERALL RESULT: ${allTestsPassed ? '✅ ALL TESTS PASSED' : '❌ SOME TESTS FAILED'}`);
        
        if (allTestsPassed) {
          console.log('\n🎉 Queue position API now includes complete queue status!');
          console.log('✨ Frontend will receive queue status data along with appointment info');
          console.log('✨ is_active is properly converted to boolean');
          console.log('✨ current_number is included from queue_status table');
        }
        
      } else {
        console.log('📋 Single appointment response');
        console.log('Appointment data:', JSON.stringify(queueData, null, 2));
      }
      
    } else {
      console.error('❌ Queue position fetch failed:', queuePositionResponse.data.message);
    }
    
  } catch (error) {
    if (error.response) {
      console.error('❌ API Error:', error.response.status, error.response.data);
    } else if (error.code === 'ECONNREFUSED') {
      console.error('❌ Connection Error: Backend server is not running');
      console.log('💡 Please start the backend server and try again');
    } else {
      console.error('❌ Request Error:', error.message);
    }
  }
}

// Test with a specific doctor as well
async function testSpecificDoctorQueuePosition() {
  console.log('\n\n🎯 Testing Queue Position with Specific Doctor');
  console.log('=' .repeat(60));
  
  try {
    // Login as patient
    const patientLoginData = {
      email: 'patient@test.com',
      password: '123456'
    };
    
    const loginResponse = await axios.post(`${API_BASE}/auth/login`, patientLoginData);
    const token = loginResponse.data.data.token;
    
    // Test with doctor ID parameter
    const doctorId = '11aedc76-46d6-4907-83ee-152d097196b8'; // From your example
    
    console.log(`📊 Testing with specific doctor ID: ${doctorId}`);
    const queuePositionResponse = await axios.get(`${API_BASE}/patients/queue/position?doctorId=${doctorId}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    if (queuePositionResponse.data.success) {
      const queueData = queuePositionResponse.data.data;
      console.log('✅ Specific doctor queue position fetched');
      console.log('Response structure:', JSON.stringify(queueData, null, 2));
      
      // Validate queue status inclusion
      if (queueData.queueStatus) {
        console.log('\n✅ Queue status included in specific doctor response');
        console.log(`is_active: ${queueData.queueStatus.is_active} (${typeof queueData.queueStatus.is_active})`);
        console.log(`current_number: ${queueData.queueStatus.current_number}`);
      } else {
        console.log('❌ Queue status NOT included in specific doctor response');
      }
    }
    
  } catch (error) {
    console.error('Error testing specific doctor:', error.response?.data || error.message);
  }
}

// Run all tests
async function runAllTests() {
  await testQueuePositionWithStatus();
  await testSpecificDoctorQueuePosition();
  
  console.log('\n\n🏁 Test Complete!');
  console.log('The queue position API should now include queue status information');
  console.log('including is_active (boolean) and current_number from queue_status table');
}

runAllTests().catch(console.error);