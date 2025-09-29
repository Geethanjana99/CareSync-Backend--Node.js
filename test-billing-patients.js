const mysql = require('mysql2/promise');
require('dotenv').config();

async function testBillingPatientLoad() {
  let connection;
  
  try {
    connection = await mysql.createConnection({
      host: 'caresyncdb-caresync.e.aivencloud.com',
      port: 16006,
      user: 'avnadmin',
      password: 'AVNS_6xeaVpCVApextDTAKfU',
      database: 'caresync',
      ssl: { rejectUnauthorized: false }
    });
    
    console.log('🏥 TESTING BILLING PATIENT LOADING ISSUE');
    console.log('=======================================\n');
    
    // 1. Test the exact query used in billing controller
    console.log('1️⃣ Testing current billing controller query...');
    try {
      const [patients] = await connection.execute(`
        SELECT id, name, email
        FROM users 
        WHERE role = 'patient' AND is_active = 1
        ORDER BY name
      `);
      
      console.log(`✅ Found ${patients.length} active patients:`);
      patients.forEach((patient, index) => {
        console.log(`  ${index + 1}. ${patient.name} (${patient.email}) - ID: ${patient.id}`);
      });
      
    } catch (error) {
      console.log(`❌ Query failed: ${error.message}`);
    }
    
    // 2. Test alternative query with different active column name
    console.log('\n2️⃣ Testing with boolean active field...');
    try {
      const [patients2] = await connection.execute(`
        SELECT id, name, email
        FROM users 
        WHERE role = 'patient' AND is_active = true
        ORDER BY name
      `);
      
      console.log(`✅ Found ${patients2.length} active patients (boolean):`);
      patients2.forEach((patient, index) => {
        console.log(`  ${index + 1}. ${patient.name} (${patient.email}) - ID: ${patient.id}`);
      });
      
    } catch (error) {
      console.log(`❌ Boolean query failed: ${error.message}`);
    }
    
    // 3. Test without active filter to see all patients
    console.log('\n3️⃣ Testing all patients (no active filter)...');
    try {
      const [allPatients] = await connection.execute(`
        SELECT id, name, email, is_active
        FROM users 
        WHERE role = 'patient'
        ORDER BY name
      `);
      
      console.log(`📊 All patient users (${allPatients.length}):`);
      allPatients.forEach((patient, index) => {
        console.log(`  ${index + 1}. ${patient.name} (${patient.email}) - Active: ${patient.is_active}`);
      });
      
    } catch (error) {
      console.log(`❌ All patients query failed: ${error.message}`);
    }
    
    // 4. Check users table structure
    console.log('\n4️⃣ Checking users table structure...');
    try {
      const [columns] = await connection.execute(`DESCRIBE users`);
      
      console.log('Users table columns:');
      columns.forEach(col => {
        if (col.Field.includes('active') || col.Field === 'role' || col.Field === 'name' || col.Field === 'email') {
          console.log(`  ${col.Field}: ${col.Type} (Default: ${col.Default}, Null: ${col.Null})`);
        }
      });
      
    } catch (error) {
      console.log(`❌ Table structure query failed: ${error.message}`);
    }
    
    // 5. Test patients with profile data
    console.log('\n5️⃣ Testing patients with complete profiles...');
    try {
      const [patientsWithProfiles] = await connection.execute(`
        SELECT 
          u.id, 
          u.name, 
          u.email, 
          u.is_active,
          p.id as patient_id,
          p.patient_id as patient_code,
          p.gender,
          p.status as patient_status
        FROM users u
        LEFT JOIN patients p ON u.id = p.user_id
        WHERE u.role = 'patient'
        ORDER BY u.name
      `);
      
      console.log(`👥 Patients with profile data (${patientsWithProfiles.length}):`);
      patientsWithProfiles.forEach((patient, index) => {
        const hasProfile = patient.patient_id ? '✅' : '❌';
        console.log(`  ${index + 1}. ${hasProfile} ${patient.name} (${patient.email})`);
        console.log(`      User Active: ${patient.is_active} | Profile: ${patient.patient_code || 'None'} | Status: ${patient.patient_status || 'N/A'}`);
      });
      
    } catch (error) {
      console.log(`❌ Patients with profiles query failed: ${error.message}`);
    }
    
    // 6. Test the API endpoint format
    console.log('\n6️⃣ Testing API response format...');
    try {
      const [apiPatients] = await connection.execute(`
        SELECT u.id, u.name, u.email
        FROM users u
        INNER JOIN patients p ON u.id = p.user_id
        WHERE u.role = 'patient' AND u.is_active = true AND p.status = 'active'
        ORDER BY u.name
      `);
      
      const patientList = apiPatients.map(patient => ({
        id: patient.id,
        name: patient.name || patient.email,
        email: patient.email
      }));
      
      console.log(`🔧 API Format Response (${patientList.length} patients):`);
      console.log(JSON.stringify({
        success: true,
        data: patientList.slice(0, 3) // Show first 3 only
      }, null, 2));
      
    } catch (error) {
      console.log(`❌ API format query failed: ${error.message}`);
    }
    
    console.log('\n' + '='.repeat(50));
    console.log('🔍 DIAGNOSIS SUMMARY');
    console.log('='.repeat(50));
    console.log('💡 Common issues that cause patients not to load in billing:');
    console.log('1. Wrong column name (is_active vs active)');
    console.log('2. Wrong data type (boolean vs int)');
    console.log('3. Missing patient profiles');
    console.log('4. Incorrect mysqlConnection.query() usage');
    console.log('5. Database connection issues');
    console.log('6. Frontend API endpoint issues');
    
    console.log('\n🛠️ Recommended fixes:');
    console.log('1. Use connection.execute() instead of mysqlConnection.query()');
    console.log('2. Join with patients table for active profiles only');
    console.log('3. Use proper boolean values for is_active');
    console.log('4. Add error handling and logging');
    
  } catch (error) {
    console.error('❌ Connection error:', error.message);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

testBillingPatientLoad();