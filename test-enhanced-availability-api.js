const axios = require('axios');
require('dotenv').config();

const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:5000/api';
let authToken = null;

// Test doctor credentials (you'll need to update these)
const TEST_DOCTOR = {
  email: 'doctor@test.com',
  password: 'TestPassword123!'
};

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function loginAsDoctor() {
  try {
    console.log('🔑 Logging in as doctor...');
    const response = await axios.post(`${API_BASE_URL}/auth/login`, TEST_DOCTOR);
    
    if (response.data.success) {
      authToken = response.data.data.token;
      console.log('✅ Doctor login successful');
      return true;
    } else {
      console.error('❌ Doctor login failed:', response.data.message);
      return false;
    }
  } catch (error) {
    console.error('❌ Doctor login error:', error.response?.data?.message || error.message);
    return false;
  }
}

async function testGetAvailabilitySettings() {
  try {
    console.log('\n📊 Testing: Get Availability Settings');
    const response = await axios.get(`${API_BASE_URL}/doctors/availability/settings`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    
    console.log('✅ Response:', JSON.stringify(response.data, null, 2));
    return response.data.success;
  } catch (error) {
    console.error('❌ Error:', error.response?.data?.message || error.message);
    return false;
  }
}

async function testUpdateDefaultHours() {
  try {
    console.log('\n⏰ Testing: Update Default Hours');
    const response = await axios.put(`${API_BASE_URL}/doctors/availability/default-hours`, {
      startTime: '08:00',
      endTime: '18:00',
      duration: 30,
      breakDuration: 10,
      isActive: true
    }, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    
    console.log('✅ Response:', JSON.stringify(response.data, null, 2));
    return response.data.success;
  } catch (error) {
    console.error('❌ Error:', error.response?.data?.message || error.message);
    return false;
  }
}

async function testUpdateWeeklySchedule() {
  try {
    console.log('\n📅 Testing: Update Weekly Schedule');
    const timeSlots = [
      {
        day: 'Monday',
        startTime: '09:00',
        endTime: '17:00',
        duration: 30,
        breakDuration: 5,
        isActive: true,
        isDefault: true
      },
      {
        day: 'Tuesday',
        startTime: '10:00',
        endTime: '16:00',
        duration: 45,
        breakDuration: 10,
        isActive: true,
        isDefault: false
      },
      {
        day: 'Wednesday',
        startTime: '09:00',
        endTime: '17:00',
        duration: 30,
        breakDuration: 5,
        isActive: true,
        isDefault: true
      }
    ];
    
    const response = await axios.put(`${API_BASE_URL}/doctors/availability/weekly-schedule`, {
      timeSlots
    }, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    
    console.log('✅ Response:', JSON.stringify(response.data, null, 2));
    return response.data.success;
  } catch (error) {
    console.error('❌ Error:', error.response?.data?.message || error.message);
    return false;
  }
}

async function testAddDateOverride() {
  try {
    console.log('\n🚫 Testing: Add Date Override (Unavailable)');
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dateStr = tomorrow.toISOString().split('T')[0];
    
    const response = await axios.post(`${API_BASE_URL}/doctors/availability/date-override`, {
      date: dateStr,
      isUnavailable: true,
      reason: 'Medical conference'
    }, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    
    console.log('✅ Response:', JSON.stringify(response.data, null, 2));
    return response.data.success;
  } catch (error) {
    console.error('❌ Error:', error.response?.data?.message || error.message);
    return false;
  }
}

async function testAddCustomHoursOverride() {
  try {
    console.log('\n🔧 Testing: Add Date Override (Custom Hours)');
    const dayAfterTomorrow = new Date();
    dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 2);
    const dateStr = dayAfterTomorrow.toISOString().split('T')[0];
    
    const response = await axios.post(`${API_BASE_URL}/doctors/availability/date-override`, {
      date: dateStr,
      isUnavailable: false,
      customStartTime: '14:00',
      customEndTime: '20:00',
      customDuration: 60,
      reason: 'Evening clinic hours'
    }, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    
    console.log('✅ Response:', JSON.stringify(response.data, null, 2));
    return response.data.success;
  } catch (error) {
    console.error('❌ Error:', error.response?.data?.message || error.message);
    return false;
  }
}

async function testUpdateAvailabilityStatus() {
  try {
    console.log('\n🟢 Testing: Update Availability Status');
    const response = await axios.put(`${API_BASE_URL}/doctors/availability/status`, {
      availabilityStatus: 'available',
      autoAcceptAppointments: true,
      advanceBookingDays: 30,
      breakBetweenAppointments: 5
    }, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    
    console.log('✅ Response:', JSON.stringify(response.data, null, 2));
    return response.data.success;
  } catch (error) {
    console.error('❌ Error:', error.response?.data?.message || error.message);
    return false;
  }
}

async function testGetAvailableSlots() {
  try {
    console.log('\n🕐 Testing: Get Available Slots');
    const today = new Date().toISOString().split('T')[0];
    
    const response = await axios.get(`${API_BASE_URL}/doctors/availability/slots/${today}`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    
    console.log('✅ Response:', JSON.stringify(response.data, null, 2));
    return response.data.success;
  } catch (error) {
    console.error('❌ Error:', error.response?.data?.message || error.message);
    return false;
  }
}

async function testCheckAvailability() {
  try {
    console.log('\n✅ Testing: Check Availability');
    const today = new Date().toISOString().split('T')[0];
    
    const response = await axios.get(`${API_BASE_URL}/doctors/availability/check/${today}/10:00`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    
    console.log('✅ Response:', JSON.stringify(response.data, null, 2));
    return response.data.success;
  } catch (error) {
    console.error('❌ Error:', error.response?.data?.message || error.message);
    return false;
  }
}

async function testApplyDefaultHours() {
  try {
    console.log('\n🔄 Testing: Apply Default Hours');
    const response = await axios.post(`${API_BASE_URL}/doctors/availability/apply-defaults`, {}, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    
    console.log('✅ Response:', JSON.stringify(response.data, null, 2));
    return response.data.success;
  } catch (error) {
    console.error('❌ Error:', error.response?.data?.message || error.message);
    return false;
  }
}

async function testRemoveDateOverride() {
  try {
    console.log('\n🗑️ Testing: Remove Date Override');
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dateStr = tomorrow.toISOString().split('T')[0];
    
    const response = await axios.delete(`${API_BASE_URL}/doctors/availability/date-override/${dateStr}`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    
    console.log('✅ Response:', JSON.stringify(response.data, null, 2));
    return response.data.success;
  } catch (error) {
    console.error('❌ Error:', error.response?.data?.message || error.message);
    return false;
  }
}

async function runAllTests() {
  console.log('🚀 Starting Enhanced Availability System API Tests');
  console.log('================================================\n');
  
  // Login first
  const loginSuccess = await loginAsDoctor();
  if (!loginSuccess) {
    console.log('❌ Cannot proceed without authentication');
    return;
  }
  
  const tests = [
    { name: 'Get Availability Settings', fn: testGetAvailabilitySettings },
    { name: 'Update Default Hours', fn: testUpdateDefaultHours },
    { name: 'Update Weekly Schedule', fn: testUpdateWeeklySchedule },
    { name: 'Add Date Override (Unavailable)', fn: testAddDateOverride },
    { name: 'Add Date Override (Custom Hours)', fn: testAddCustomHoursOverride },
    { name: 'Update Availability Status', fn: testUpdateAvailabilityStatus },
    { name: 'Apply Default Hours', fn: testApplyDefaultHours },
    { name: 'Get Available Slots', fn: testGetAvailableSlots },
    { name: 'Check Availability', fn: testCheckAvailability },
    { name: 'Remove Date Override', fn: testRemoveDateOverride }
  ];
  
  let passed = 0;
  let failed = 0;
  
  for (const test of tests) {
    try {
      await sleep(1000); // Wait 1 second between tests
      const success = await test.fn();
      if (success) {
        passed++;
      } else {
        failed++;
      }
    } catch (error) {
      console.error(`❌ Test "${test.name}" threw an error:`, error.message);
      failed++;
    }
  }
  
  console.log('\n📊 Test Results Summary');
  console.log('========================');
  console.log(`✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`📈 Success Rate: ${Math.round((passed / (passed + failed)) * 100)}%`);
  
  if (failed === 0) {
    console.log('\n🎉 All tests passed! Enhanced Availability System is working correctly.');
  } else {
    console.log('\n⚠️ Some tests failed. Please check the error messages above.');
  }
}

// Run tests if this file is executed directly
if (require.main === module) {
  runAllTests().catch(console.error);
}

module.exports = { runAllTests };
