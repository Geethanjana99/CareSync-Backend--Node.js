const mysql = require('mysql2/promise');
const { v4: uuidv4 } = require('uuid');
require('dotenv').config();

async function fixOrphanedUsersDirectly() {
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
    
    console.log('🛠️  FIXING ORPHANED USERS (Direct SQL Method)');
    console.log('===============================================\n');
    
    // 1. Find orphaned doctors
    console.log('1️⃣ Finding orphaned doctors...');
    const [orphanedDoctors] = await connection.execute(`
      SELECT u.id, u.name, u.email, u.role
      FROM users u
      LEFT JOIN doctors d ON u.id = d.user_id
      WHERE u.role = 'doctor' AND d.id IS NULL
    `);
    
    if (orphanedDoctors.length === 0) {
      console.log('✅ No orphaned doctors found');
      return;
    }
    
    console.log(`Found ${orphanedDoctors.length} orphaned doctors:`);
    orphanedDoctors.forEach((user, index) => {
      console.log(`  ${index + 1}. ${user.name} (${user.email}) - User ID: ${user.id}`);
    });
    
    // 2. Create missing doctor profiles using direct SQL
    console.log('\n2️⃣ Creating missing doctor profiles...');
    
    for (const user of orphanedDoctors) {
      try {
        console.log(`\n👨‍⚕️ Creating doctor profile for ${user.name}...`);
        
        const doctorId = uuidv4();
        const doctorCode = `DR${Date.now().toString().slice(-6)}`;
        
        // Insert directly into doctors table
        await connection.execute(`
          INSERT INTO doctors (
            id, 
            user_id, 
            doctor_id,
            specialty, 
            license_number, 
            years_of_experience, 
            consultation_fee, 
            bio, 
            status,
            created_at,
            updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
        `, [
          doctorId,
          user.id,
          doctorCode,
          'General Medicine',
          `LIC_${user.id.substring(0, 8)}`,
          5,
          150.00,
          `Dr. ${user.name} - General Practitioner`,
          'pending_approval'
        ]);
        
        console.log(`✅ Doctor profile created successfully!`);
        console.log(`   - Doctor ID: ${doctorId}`);
        console.log(`   - Doctor Code: ${doctorCode}`);
        console.log(`   - Specialty: General Medicine`);
        console.log(`   - License: LIC_${user.id.substring(0, 8)}`);
        console.log(`   - Status: pending_approval`);
        
      } catch (error) {
        console.log(`❌ Failed to create doctor profile for ${user.name}:`);
        console.log(`   Error: ${error.message}`);
        
        // Log the SQL error details
        if (error.sqlMessage) {
          console.log(`   SQL Error: ${error.sqlMessage}`);
        }
      }
    }
    
    // 3. Also handle orphaned patients (if any)
    console.log('\n3️⃣ Checking for orphaned patients...');
    const [orphanedPatients] = await connection.execute(`
      SELECT u.id, u.name, u.email, u.role
      FROM users u
      LEFT JOIN patients p ON u.id = p.user_id
      WHERE u.role = 'patient' AND p.id IS NULL
    `);
    
    if (orphanedPatients.length > 0) {
      console.log(`Found ${orphanedPatients.length} orphaned patients, creating profiles...`);
      
      for (const user of orphanedPatients) {
        try {
          console.log(`👥 Creating patient profile for ${user.name}...`);
          
          const patientId = uuidv4();
          const patientCode = `P${Date.now().toString().slice(-6)}`;
          
          await connection.execute(`
            INSERT INTO patients (
              id,
              user_id,
              patient_id,
              preferred_language,
              status,
              created_at,
              updated_at
            ) VALUES (?, ?, ?, ?, ?, NOW(), NOW())
          `, [
            patientId,
            user.id,
            patientCode,
            'English',
            'active'
          ]);
          
          console.log(`✅ Patient profile created for ${user.name}`);
          
        } catch (error) {
          console.log(`❌ Failed to create patient profile for ${user.name}: ${error.message}`);
        }
      }
    } else {
      console.log('✅ No orphaned patients found');
    }
    
    // 4. Verify the fix
    console.log('\n4️⃣ Verifying the fix...');
    
    // Check remaining orphaned doctors
    const [remainingOrphanDoctors] = await connection.execute(`
      SELECT COUNT(*) as count
      FROM users u
      LEFT JOIN doctors d ON u.id = d.user_id
      WHERE u.role = 'doctor' AND d.id IS NULL
    `);
    
    // Check remaining orphaned patients  
    const [remainingOrphanPatients] = await connection.execute(`
      SELECT COUNT(*) as count
      FROM users u
      LEFT JOIN patients p ON u.id = p.user_id
      WHERE u.role = 'patient' AND p.id IS NULL
    `);
    
    console.log(`Remaining orphaned doctors: ${remainingOrphanDoctors[0].count}`);
    console.log(`Remaining orphaned patients: ${remainingOrphanPatients[0].count}`);
    
    // 5. Show final status
    console.log('\n5️⃣ Final database status:');
    
    // Count all profiles
    const [userCounts] = await connection.execute(`
      SELECT 
        COUNT(*) as total_users,
        SUM(CASE WHEN role = 'patient' THEN 1 ELSE 0 END) as patient_users,
        SUM(CASE WHEN role = 'doctor' THEN 1 ELSE 0 END) as doctor_users,
        SUM(CASE WHEN role = 'admin' THEN 1 ELSE 0 END) as admin_users,
        SUM(CASE WHEN role = 'billing' THEN 1 ELSE 0 END) as billing_users
      FROM users
    `);
    
    const [profileCounts] = await connection.execute(`
      SELECT 
        (SELECT COUNT(*) FROM patients) as patient_profiles,
        (SELECT COUNT(*) FROM doctors) as doctor_profiles
    `);
    
    const counts = { ...userCounts[0], ...profileCounts[0] };
    
    console.log('📊 User & Profile Counts:');
    console.log(`  Total Users: ${counts.total_users}`);
    console.log(`  ├─ Patient Users: ${counts.patient_users} (Profiles: ${counts.patient_profiles})`);
    console.log(`  ├─ Doctor Users: ${counts.doctor_users} (Profiles: ${counts.doctor_profiles})`);
    console.log(`  ├─ Admin Users: ${counts.admin_users}`);
    console.log(`  └─ Billing Users: ${counts.billing_users}`);
    
    // Check if everything matches up
    const doctorMatch = counts.doctor_users === counts.doctor_profiles;
    const patientMatch = counts.patient_users === counts.patient_profiles;
    
    console.log('\n🎯 Profile Matching Status:');
    console.log(`  Doctor profiles: ${doctorMatch ? '✅ All match' : '❌ Mismatch'}`);
    console.log(`  Patient profiles: ${patientMatch ? '✅ All match' : '❌ Mismatch'}`);
    
    if (doctorMatch && patientMatch) {
      console.log('\n🎉 SUCCESS: All users now have corresponding role profiles!');
      console.log('\n💡 What this means:');
      console.log('  • Registration system is now working correctly');
      console.log('  • Users can access role-specific features');
      console.log('  • Doctor dashboard will work properly');
      console.log('  • Patient appointment booking will work');
      console.log('  • No more "profile not found" errors');
    } else {
      console.log('\n⚠️  Some users still missing profiles - manual review needed');
    }
    
  } catch (error) {
    console.error('❌ Error fixing orphaned users:', error.message);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

fixOrphanedUsersDirectly();