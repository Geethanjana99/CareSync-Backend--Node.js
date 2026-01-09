/**
 * Test script to verify the queue status API returns correct is_active boolean values
 */

const axios = require('axios');

const API_BASE = 'http://localhost:3000/api';

async function testQueueStatusAPI() {
  console.log('🚀 Testing Queue Status API Boolean Conversion');
  console.log('=' .repeat(60));
  
  try {
    // Test credentials - using a known test doctor
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
    
    // Test the queue status endpoint
    console.log('\n📊 Testing /doctors/queue/status endpoint...');
    const queueStatusResponse = await axios.get(`${API_BASE}/doctors/queue/status`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    if (queueStatusResponse.data.success) {
      const statusData = queueStatusResponse.data.data;
      console.log('✅ Queue status fetched successfully');
      console.log('\n🔍 Response Analysis:');
      console.log('=====================');
      console.log(`is_active value: ${statusData.is_active}`);
      console.log(`is_active type: ${typeof statusData.is_active}`);
      console.log(`Is boolean?: ${typeof statusData.is_active === 'boolean'}`);
      console.log(`Boolean evaluation: ${statusData.is_active ? 'ACTIVE' : 'INACTIVE'}`);
      
      // Check other important fields
      console.log('\n📋 Other Fields:');
      console.log('================');
      console.log(`Doctor ID: ${statusData.doctor_id}`);
      console.log(`Queue Date: ${statusData.queue_date}`);
      console.log(`Current Number: ${statusData.current_number}`);
      console.log(`Available: ${statusData.available_from} - ${statusData.available_to}`);
      
      if (statusData.doctor_name) {
        console.log(`Doctor Name: ${statusData.doctor_name}`);
        console.log(`Specialty: ${statusData.specialty}`);
      }
      
      // Test the boolean behavior
      console.log('\n🧪 Boolean Behavior Tests:');
      console.log('==========================');
      console.log(`statusData.is_active === true: ${statusData.is_active === true}`);
      console.log(`statusData.is_active === false: ${statusData.is_active === false}`);
      console.log(`!!statusData.is_active: ${!!statusData.is_active}`);
      console.log(`Boolean(statusData.is_active): ${Boolean(statusData.is_active)}`);
      
      // Check if frontend would handle this correctly
      const frontendEvaluation = statusData.is_active ? 'Queue is active' : 'Queue is stopped';
      console.log(`Frontend evaluation: "${frontendEvaluation}"`);
      
      console.log('\n🎯 RESULT SUMMARY:');
      console.log('==================');
      if (typeof statusData.is_active === 'boolean') {
        console.log('✅ SUCCESS: is_active is properly returned as boolean');
        console.log(`✅ Value: ${statusData.is_active}`);
        console.log('✅ Frontend will display queue status correctly');
      } else {
        console.log('❌ FAILURE: is_active is not a boolean');
        console.log(`❌ Type: ${typeof statusData.is_active}`);
        console.log(`❌ Value: ${statusData.is_active}`);
        console.log('❌ Frontend may not display queue status correctly');
      }
      
    } else {
      console.error('❌ Queue status fetch failed:', queueStatusResponse.data.message);
    }
    
  } catch (error) {
    if (error.response) {
      console.error('❌ API Error:', error.response.status, error.response.data);
    } else {
      console.error('❌ Request Error:', error.message);
    }
  }
}

// Also test direct database comparison
async function testDatabaseVsAPI() {
  console.log('\n\n🔍 Database vs API Comparison Test');
  console.log('=' .repeat(60));
  
  const mysql = require('mysql2/promise');
  
  // Database connection configuration
  const dbConfig = {
    host: process.env.MYSQL_HOST || 'caresyncdb-caresync.e.aivencloud.com',
    port: process.env.MYSQL_PORT || 16006,
    user: process.env.MYSQL_USER || 'avnadmin',
    password: process.env.MYSQL_PASSWORD || 'AVNS_6xeaVpCVApextDTAKfU',
    database: process.env.MYSQL_DATABASE || 'caresync',
    ssl: {
      rejectUnauthorized: false
    }
  };
  
  let connection;
  
  try {
    console.log('📊 Connecting to database...');
    connection = await mysql.createConnection(dbConfig);
    
    // Get a queue status from database
    const [dbResults] = await connection.execute(`
      SELECT is_active, doctor_id, queue_date
      FROM queue_status 
      ORDER BY created_at DESC 
      LIMIT 1
    `);
    
    if (dbResults.length > 0) {
      const dbRecord = dbResults[0];
      console.log('📋 Database Record:');
      console.log(`   is_active: ${dbRecord.is_active} (${typeof dbRecord.is_active})`);
      console.log(`   Boolean conversion: ${Boolean(dbRecord.is_active)}`);
      
      console.log('\n✅ This confirms database stores is_active as TINYINT (number)');
      console.log('✅ Backend should convert it to boolean for API response');
    }
    
  } catch (error) {
    console.error('❌ Database test failed:', error.message);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

// Run all tests
async function runAllTests() {
  await testQueueStatusAPI();
  await testDatabaseVsAPI();
  
  console.log('\n\n🏁 Test Complete!');
  console.log('If is_active is returned as boolean true/false, the fix is working!');
}

runAllTests().catch(console.error);