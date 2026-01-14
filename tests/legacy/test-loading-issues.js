const axios = require('axios');
const mysql = require('mysql2/promise');

async function testDoctorPatientLoading() {
  console.log('🔍 DIAGNOSING DOCTOR/PATIENT LOADING ISSUES');
  console.log('='.repeat(45));
  
  const BASE_URL = 'http://localhost:5000/api';
  
  // 1. Test if backend server is running
  console.log('\n1️⃣ Testing Backend Server Connection...');
  try {
    const response = await axios.get(`${BASE_URL}/health`);
    console.log('✅ Backend server is running');
    console.log(`   Status: ${response.status}`);
  } catch (error) {
    if (error.code === 'ECONNREFUSED') {
      console.log('❌ Backend server is NOT running!');
      console.log('💡 Start backend with: cd backend && npm start');
      return;
    }
    console.log('⚠️ Health endpoint not found, trying other endpoints...');
  }
  
  // 2. Test public doctor search endpoint
  console.log('\n2️⃣ Testing Public Doctor Search...');
  try {
    const response = await axios.get(`${BASE_URL}/doctors/search`);
    console.log('✅ Doctor search endpoint working');
    console.log(`   Found ${response.data.data?.length || 0} doctors`);
    if (response.data.data && response.data.data.length > 0) {
      console.log(`   Sample doctor: ${response.data.data[0].name}`);
    }
  } catch (error) {
    console.log('❌ Doctor search endpoint failed');
    if (error.response) {
      console.log(`   Status: ${error.response.status}`);
      console.log(`   Error: ${error.response.data?.message || error.response.statusText}`);
    }
  }
  
  // 3. Check database directly
  console.log('\n3️⃣ Checking Database Directly...');
  try {
    const connection = await mysql.createConnection({
      host: 'caresyncdb-caresync.e.aivencloud.com',
      port: 16006,
      user: 'avnadmin',
      password: 'AVNS_6xeaVpCVApextDTAKfU',
      database: 'caresync',
      ssl: { rejectUnauthorized: false }
    });
    
    // Count doctors and patients
    const [doctorCount] = await connection.execute('SELECT COUNT(*) as count FROM doctors');
    const [patientCount] = await connection.execute('SELECT COUNT(*) as count FROM patients');
    const [userCount] = await connection.execute('SELECT COUNT(*) as count FROM users');
    
    console.log('📊 Database Status:');
    console.log(`   Total users: ${userCount[0].count}`);
    console.log(`   Doctor profiles: ${doctorCount[0].count}`);
    console.log(`   Patient profiles: ${patientCount[0].count}`);
    
    // Get sample data
    const [doctors] = await connection.execute(`
      SELECT d.id, u.name, d.specialty, d.status 
      FROM doctors d 
      JOIN users u ON d.user_id = u.id 
      LIMIT 3
    `);
    
    const [patients] = await connection.execute(`
      SELECT p.id, u.name, p.patient_id, p.status 
      FROM patients p 
      JOIN users u ON p.user_id = u.id 
      LIMIT 3
    `);
    
    console.log('\n👨‍⚕️ Sample Doctors:');
    doctors.forEach((doc, index) => {
      console.log(`   ${index + 1}. ${doc.name} - ${doc.specialty} (${doc.status})`);
    });
    
    console.log('\n👥 Sample Patients:');
    patients.forEach((pat, index) => {
      console.log(`   ${index + 1}. ${pat.name} - ID: ${pat.patient_id} (${pat.status})`);
    });
    
    await connection.end();
    
  } catch (dbError) {
    console.log('❌ Database connection failed');
    console.log(`   Error: ${dbError.message}`);
  }
  
  // 4. Test mock endpoints
  console.log('\n4️⃣ Testing Mock Endpoints...');
  const mockEndpoints = [
    '/mock/doctors',
    '/mock/patients'
  ];
  
  for (const endpoint of mockEndpoints) {
    try {
      const response = await axios.get(`${BASE_URL}${endpoint}`);
      console.log(`✅ ${endpoint}: Working (${response.data.data?.length || 0} items)`);
    } catch (error) {
      console.log(`❌ ${endpoint}: Failed (${error.response?.status || 'No response'})`);
    }
  }
  
  // 5. Identify common issues
  console.log('\n5️⃣ COMMON LOADING ISSUES & SOLUTIONS:');
  console.log('=====================================');
  
  console.log('\n🔧 FRONTEND ISSUES:');
  console.log('   • API base URL incorrect (check services/api.ts)');
  console.log('   • Authentication token missing/expired');
  console.log('   • CORS issues between frontend and backend');
  console.log('   • Frontend making requests to wrong endpoints');
  console.log('   • Component not handling loading states properly');
  
  console.log('\n🔧 BACKEND ISSUES:');
  console.log('   • Routes not properly configured');
  console.log('   • Controllers missing or broken');
  console.log('   • Database queries failing silently');
  console.log('   • Authentication middleware blocking requests');
  console.log('   • Models not returning data correctly');
  
  console.log('\n🔧 DATABASE ISSUES:');
  console.log('   • Empty tables (no doctors/patients)');
  console.log('   • Broken foreign key relationships');
  console.log('   • User accounts without role profiles');
  console.log('   • Database connection problems');
  
  console.log('\n💡 QUICK FIXES TO TRY:');
  console.log('   1. Start backend: cd backend && npm start');
  console.log('   2. Check browser console for API errors');
  console.log('   3. Verify API URLs in frontend');
  console.log('   4. Test endpoints in Postman/curl');
  console.log('   5. Add test data to database');
  
}

testDoctorPatientLoading();