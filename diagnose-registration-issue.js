const mysql = require('mysql2/promise');
require('dotenv').config();

async function checkRegistrationProcess() {
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
    
    console.log('🔍 DIAGNOSING USER REGISTRATION ISSUE');
    console.log('=====================================\n');
    
    // 1. Check current data in users table
    console.log('1️⃣ Checking users table...');
    const [users] = await connection.execute(`
      SELECT id, name, email, role, created_at 
      FROM users 
      ORDER BY created_at DESC 
      LIMIT 10
    `);
    
    console.log(`Found ${users.length} users:`);
    users.forEach((user, index) => {
      console.log(`  ${index + 1}. ${user.name} (${user.email}) - Role: ${user.role} - ID: ${user.id}`);
    });
    
    // 2. Check patients table
    console.log('\n2️⃣ Checking patients table...');
    const [patients] = await connection.execute(`
      SELECT p.id, p.user_id, u.name, u.email, p.gender, p.date_of_birth
      FROM patients p
      LEFT JOIN users u ON p.user_id = u.id
      ORDER BY p.created_at DESC
      LIMIT 10
    `);
    
    console.log(`Found ${patients.length} patient profiles:`);
    patients.forEach((patient, index) => {
      console.log(`  ${index + 1}. ${patient.name} (${patient.email}) - Patient ID: ${patient.id} - User ID: ${patient.user_id}`);
    });
    
    // 3. Check doctors table
    console.log('\n3️⃣ Checking doctors table...');
    const [doctors] = await connection.execute(`
      SELECT d.id, d.user_id, u.name, u.email, d.specialty, d.license_number
      FROM doctors d
      LEFT JOIN users u ON d.user_id = u.id
      ORDER BY d.created_at DESC
      LIMIT 10
    `);
    
    console.log(`Found ${doctors.length} doctor profiles:`);
    doctors.forEach((doctor, index) => {
      console.log(`  ${index + 1}. ${doctor.name} (${doctor.email}) - Doctor ID: ${doctor.id} - Specialty: ${doctor.specialty}`);
    });
    
    // 4. Check for orphaned users (users without corresponding profiles)
    console.log('\n4️⃣ Checking for orphaned users...');
    
    // Users with patient role but no patient profile
    const [orphanedPatients] = await connection.execute(`
      SELECT u.id, u.name, u.email, u.role
      FROM users u
      LEFT JOIN patients p ON u.id = p.user_id
      WHERE u.role = 'patient' AND p.id IS NULL
    `);
    
    if (orphanedPatients.length > 0) {
      console.log(`❌ Found ${orphanedPatients.length} users with 'patient' role but NO patient profile:`);
      orphanedPatients.forEach((user, index) => {
        console.log(`  ${index + 1}. ${user.name} (${user.email}) - User ID: ${user.id}`);
      });
    } else {
      console.log('✅ All users with patient role have patient profiles');
    }
    
    // Users with doctor role but no doctor profile
    const [orphanedDoctors] = await connection.execute(`
      SELECT u.id, u.name, u.email, u.role
      FROM users u
      LEFT JOIN doctors d ON u.id = d.user_id
      WHERE u.role = 'doctor' AND d.id IS NULL
    `);
    
    if (orphanedDoctors.length > 0) {
      console.log(`\n❌ Found ${orphanedDoctors.length} users with 'doctor' role but NO doctor profile:`);
      orphanedDoctors.forEach((user, index) => {
        console.log(`  ${index + 1}. ${user.name} (${user.email}) - User ID: ${user.id}`);
      });
    } else {
      console.log('\n✅ All users with doctor role have doctor profiles');
    }
    
    // 5. Summary analysis
    console.log('\n' + '='.repeat(50));
    console.log('📊 REGISTRATION ANALYSIS SUMMARY');
    console.log('='.repeat(50));
    
    console.log(`📈 Total users: ${users.length}`);
    console.log(`👥 Patient profiles: ${patients.length}`);
    console.log(`👨‍⚕️ Doctor profiles: ${doctors.length}`);
    console.log(`⚠️  Orphaned patients: ${orphanedPatients.length}`);
    console.log(`⚠️  Orphaned doctors: ${orphanedDoctors.length}`);
    
    // 6. Identify the problem
    console.log('\n🔍 PROBLEM IDENTIFICATION:');
    
    if (orphanedPatients.length > 0 || orphanedDoctors.length > 0) {
      console.log('❌ ISSUE FOUND: Users registered without corresponding profiles!');
      console.log('\n💡 POSSIBLE CAUSES:');
      console.log('  1. Registration API not creating role-specific profiles');
      console.log('  2. Missing profileData in registration requests');
      console.log('  3. Database transaction failures during profile creation');
      console.log('  4. Frontend not sending required profile data');
      console.log('  5. Backend validation preventing profile creation');
      
      console.log('\n🔧 SOLUTIONS:');
      console.log('  1. Check auth controller profile creation logic');
      console.log('  2. Verify frontend sends profileData for doctors/patients');
      console.log('  3. Add better error logging in registration process');
      console.log('  4. Create missing profiles for existing orphaned users');
      console.log('  5. Test registration flow with proper debug logging');
      
    } else {
      console.log('✅ No issues found - all users have corresponding profiles!');
      console.log('💡 If you see users only in users table, they might be:');
      console.log('  • Admin users (no separate profile needed)');
      console.log('  • Recently registered users before profile creation');
      console.log('  • Users from a different registration path');
    }
    
    console.log('\n📋 NEXT STEPS:');
    console.log('1. Test registration with proper profileData');
    console.log('2. Check frontend registration form data');
    console.log('3. Add debug logging to auth controller');
    console.log('4. Fix orphaned users if any exist');
    
  } catch (error) {
    console.error('❌ Error during analysis:', error.message);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

checkRegistrationProcess();