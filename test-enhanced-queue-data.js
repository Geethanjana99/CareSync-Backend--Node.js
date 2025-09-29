/**
 * Test script to verify enhanced queue data fetching includes proper queue status
 */

const axios = require('axios');

const API_BASE = 'http://localhost:3000/api';

async function testEnhancedQueueDataFetching() {
  console.log('🚀 Testing Enhanced Queue Data Fetching');
  console.log('=' .repeat(60));
  
  try {
    // Test credentials
    const loginData = {
      email: 'doctor@test.com',
      password: '123456'
    };
    
    console.log('🔐 Logging in as test doctor...');
    const loginResponse = await axios.post(`${API_BASE}/auth/login`, loginData);
    
    if (!loginResponse.data.success) {
      console.error('❌ Login failed:', loginResponse.data.message);
      return;
    }
    
    const token = loginResponse.data.data.token;
    console.log('✅ Login successful');
    
    // Test the enhanced queue endpoint
    console.log('\n📊 Testing /doctors/queue endpoint...');
    const queueResponse = await axios.get(`${API_BASE}/doctors/queue`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    if (queueResponse.data.success) {
      const queueData = queueResponse.data.data;
      console.log('✅ Queue data fetched successfully');
      
      console.log('\n🔍 Queue Data Structure Analysis:');
      console.log('================================');
      
      // Check if queueStatus is included
      if (queueData.queueStatus) {
        console.log('✅ queueStatus included in response');
        console.log('\n📋 Queue Status Fields:');
        console.log('=======================');
        
        const status = queueData.queueStatus;
        console.log(`ID: ${status.id}`);
        console.log(`Doctor ID: ${status.doctor_id}`);
        console.log(`is_active: ${status.is_active} (${typeof status.is_active})`);
        console.log(`current_number: ${status.current_number}`);
        console.log(`current_emergency_number: ${status.current_emergency_number}`);
        console.log(`regular_count: ${status.regular_count}`);
        console.log(`emergency_used: ${status.emergency_used}`);
        console.log(`max_emergency_slots: ${status.max_emergency_slots}`);
        console.log(`available_from: ${status.available_from}`);
        console.log(`available_to: ${status.available_to}`);
        console.log(`queue_date: ${status.queue_date}`);
        
        if (status.doctor_name) {
          console.log(`doctor_name: ${status.doctor_name}`);
          console.log(`specialty: ${status.specialty}`);
        }
        
        console.log('\n🧪 Boolean Conversion Test:');
        console.log('===========================');
        console.log(`is_active === true: ${status.is_active === true}`);
        console.log(`is_active === false: ${status.is_active === false}`);
        console.log(`Type check passed: ${typeof status.is_active === 'boolean' ? '✅' : '❌'}`);
        
      } else {
        console.log('❌ queueStatus NOT included in response');
      }
      
      // Check appointments data
      if (queueData.appointments) {
        console.log(`\n👥 Appointments: ${queueData.appointments.length} found`);
        if (queueData.appointments.length > 0) {
          const firstAppointment = queueData.appointments[0];
          console.log('Sample appointment fields:', Object.keys(firstAppointment));
        }
      }
      
      // Check statistics
      console.log('\n📈 Queue Statistics:');
      console.log('====================');
      console.log(`Total Patients: ${queueData.totalPatients || 'N/A'}`);
      console.log(`Displayed Patients: ${queueData.displayedPatients || 'N/A'}`);
      console.log(`Paid Appointments: ${queueData.paidAppointments || 'N/A'}`);
      console.log(`Unpaid Appointments: ${queueData.unpaidAppointments || 'N/A'}`);
      console.log(`Is Filtered: ${queueData.isFiltered}`);
      
      console.log('\n🎯 VERIFICATION RESULTS:');
      console.log('========================');
      
      const hasQueueStatus = !!queueData.queueStatus;
      const hasProperBoolean = queueData.queueStatus && typeof queueData.queueStatus.is_active === 'boolean';
      const hasCurrentNumber = queueData.queueStatus && queueData.queueStatus.current_number !== undefined;
      const hasAllFields = queueData.queueStatus && queueData.queueStatus.available_from && queueData.queueStatus.available_to;
      
      console.log(`✅ Queue Status Included: ${hasQueueStatus ? '✅ YES' : '❌ NO'}`);
      console.log(`✅ Boolean is_active: ${hasProperBoolean ? '✅ YES' : '❌ NO'}`);
      console.log(`✅ Current Number: ${hasCurrentNumber ? '✅ YES' : '❌ NO'}`);
      console.log(`✅ All Required Fields: ${hasAllFields ? '✅ YES' : '❌ NO'}`);
      
      const allTestsPassed = hasQueueStatus && hasProperBoolean && hasCurrentNumber && hasAllFields;
      
      console.log(`\n🏆 OVERALL RESULT: ${allTestsPassed ? '✅ ALL TESTS PASSED' : '❌ SOME TESTS FAILED'}`);
      
      if (allTestsPassed) {
        console.log('\n🎉 Enhanced queue data fetching is working correctly!');
        console.log('✨ Frontend will now receive complete queue status information');
        console.log('✨ ManageQueue interface will show proper queue status and current number');
      }
      
    } else {
      console.error('❌ Queue data fetch failed:', queueResponse.data.message);
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

// Run the test
testEnhancedQueueDataFetching().catch(console.error);