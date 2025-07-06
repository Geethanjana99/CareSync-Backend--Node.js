const axios = require('axios');
const jwt = require('jsonwebtoken');
const { mysqlConnection } = require('./config/mysql');

async function comprehensiveTest() {
  try {
    console.log('🔄 Running comprehensive system test...');
    
    // Initialize connection
    await mysqlConnection.connect();
    
    // Get test doctor
    const testUser = await mysqlConnection.query('SELECT * FROM users WHERE role = ? LIMIT 1', ['doctor']);
    if (testUser.length === 0) {
      console.log('❌ No doctor users found');
      return;
    }
    
    const doctorUser = testUser[0];
    console.log(`✅ Testing with doctor: ${doctorUser.name}`);
    
    // Create JWT token
    const token = jwt.sign(
      { 
        id: doctorUser.id, 
        email: doctorUser.email, 
        role: doctorUser.role 
      },
      process.env.JWT_SECRET || 'your_super_secret_jwt_key_here_make_it_very_long_and_secure_development_key_2025',
      { expiresIn: '1h' }
    );
    
    const config = {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    };
    
    const baseUrl = 'http://localhost:5000/api/doctor';
    const results = {};
    
    // Test 1: Get availability
    console.log('\n🔍 1. Testing doctor availability...');
    try {
      const response = await axios.get(`${baseUrl}/availability`, config);
      results.availability = '✅ PASS';
      console.log('   ✅ Doctor availability retrieved successfully');
      console.log('   📝 Working hours:', JSON.stringify(response.data.working_hours, null, 2));
      console.log('   📝 Status:', response.data.availability_status);
    } catch (error) {
      results.availability = '❌ FAIL';
      console.log('   ❌ Error:', error.response?.data?.message || error.message);
    }
    
    // Test 2: Update working hours
    console.log('\n🔍 2. Testing working hours update...');
    try {
      const workingHours = {
        monday: { start: '08:00', end: '16:00' },
        tuesday: { start: '08:00', end: '16:00' },
        wednesday: { start: '08:00', end: '16:00' },
        thursday: { start: '08:00', end: '16:00' },
        friday: { start: '08:00', end: '16:00' }
      };
      
      const response = await axios.put(`${baseUrl}/availability/working-hours`, 
        { working_hours: workingHours }, 
        config
      );
      results.workingHours = '✅ PASS';
      console.log('   ✅ Working hours updated successfully');
    } catch (error) {
      results.workingHours = '❌ FAIL';
      console.log('   ❌ Error:', error.response?.data?.message || error.message);
    }
    
    // Test 3: Update availability status
    console.log('\n🔍 3. Testing availability status update...');
    try {
      const response = await axios.put(`${baseUrl}/availability/status`, 
        { status: 'available' }, 
        config
      );
      results.availabilityStatus = '✅ PASS';
      console.log('   ✅ Availability status updated successfully');
    } catch (error) {
      results.availabilityStatus = '❌ FAIL';
      console.log('   ❌ Error:', error.response?.data?.message || error.message);
    }
    
    // Test 4: Get queue status
    console.log('\n🔍 4. Testing queue status...');
    try {
      const response = await axios.get(`${baseUrl}/queue/status`, config);
      results.queueStatus = '✅ PASS';
      console.log('   ✅ Queue status retrieved successfully');
      console.log('   📝 Current number:', response.data.current_number);
      console.log('   📝 Is active:', response.data.is_active ? 'YES' : 'NO');
    } catch (error) {
      results.queueStatus = '❌ FAIL';
      console.log('   ❌ Error:', error.response?.data?.message || error.message);
    }
    
    // Test 5: Toggle queue
    console.log('\n🔍 5. Testing queue toggle...');
    try {
      const response = await axios.put(`${baseUrl}/queue/toggle`, 
        { is_active: true }, 
        config
      );
      results.queueToggle = '✅ PASS';
      console.log('   ✅ Queue toggled successfully');
    } catch (error) {
      results.queueToggle = '❌ FAIL';
      console.log('   ❌ Error:', error.response?.data?.message || error.message);
    }
    
    // Test 6: Get today's appointments
    console.log('\n🔍 6. Testing today\'s appointments...');
    try {
      const response = await axios.get(`${baseUrl}/appointments/today`, config);
      results.todayAppointments = '✅ PASS';
      console.log(`   ✅ Found ${response.data.length} appointments for today`);
      if (response.data.length > 0) {
        console.log('   📝 First appointment:', response.data[0].reason_for_visit);
        console.log('   📝 Patient:', response.data[0].name);
        console.log('   📝 Queue number:', response.data[0].queue_number);
      }
    } catch (error) {
      results.todayAppointments = '❌ FAIL';
      console.log('   ❌ Error:', error.response?.data?.message || error.message);
    }
    
    // Test 7: Database connectivity
    console.log('\n🔍 7. Testing database connectivity...');
    try {
      const testQuery = await mysqlConnection.query('SELECT COUNT(*) as count FROM appointments WHERE queue_date = CURDATE()');
      results.databaseConnectivity = '✅ PASS';
      console.log('   ✅ Database connectivity test passed');
      console.log('   📝 Total appointments today:', testQuery[0].count);
    } catch (error) {
      results.databaseConnectivity = '❌ FAIL';
      console.log('   ❌ Error:', error.message);
    }
    
    // Summary
    console.log('\n' + '='.repeat(60));
    console.log('📊 COMPREHENSIVE TEST SUMMARY');
    console.log('='.repeat(60));
    console.log(`Doctor Availability:      ${results.availability}`);
    console.log(`Working Hours Update:     ${results.workingHours}`);
    console.log(`Availability Status:      ${results.availabilityStatus}`);
    console.log(`Queue Status:             ${results.queueStatus}`);
    console.log(`Queue Toggle:             ${results.queueToggle}`);
    console.log(`Today's Appointments:     ${results.todayAppointments}`);
    console.log(`Database Connectivity:    ${results.databaseConnectivity}`);
    
    const totalTests = Object.keys(results).length;
    const passedTests = Object.values(results).filter(r => r.includes('✅')).length;
    const failedTests = totalTests - passedTests;
    
    console.log('='.repeat(60));
    console.log(`📈 RESULTS: ${passedTests}/${totalTests} tests passed`);
    
    if (failedTests === 0) {
      console.log('🎉 ALL TESTS PASSED! The doctor queue system is fully functional.');
    } else {
      console.log(`⚠️  ${failedTests} test(s) failed. Please check the issues above.`);
    }
    
    console.log('='.repeat(60));
    console.log('🔗 Frontend URL: http://localhost:5173');
    console.log('🔗 Backend URL: http://localhost:5000');
    console.log('🔗 API Documentation: http://localhost:5000/api/docs');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Test error:', error);
    process.exit(1);
  }
}

comprehensiveTest();
