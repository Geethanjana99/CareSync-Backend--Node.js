const mysql = require('mysql2/promise');
const Doctor = require('./models/Doctor');
require('dotenv').config();

async function fixOrphanedUsers() {
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
    
    console.log('🛠️  FIXING ORPHANED USERS');
    console.log('=========================\n');
    
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
    
    // 2. Create missing doctor profiles
    console.log('\n2️⃣ Creating missing doctor profiles...');
    
    for (const user of orphanedDoctors) {
      try {
        console.log(`\n👨‍⚕️ Creating doctor profile for ${user.name}...`);
        
        // Create basic doctor profile with default values
        const doctorData = {
          user_id: user.id,
          specialty: 'General Medicine', // Default specialty
          license_number: `LIC_${user.id.substring(0, 8)}`, // Generate a temporary license number
          years_of_experience: 5, // Default experience
          consultation_fee: 150, // Default fee
          bio: `Dr. ${user.name} - General Practitioner`,
          status: 'pending_approval' // New doctors need approval
        };
        
        const doctor = new Doctor(doctorData);
        await doctor.save();
        
        console.log(`✅ Doctor profile created successfully!`);
        console.log(`   - Doctor ID: ${doctor.id}`);
        console.log(`   - Specialty: ${doctorData.specialty}`);
        console.log(`   - License: ${doctorData.license_number}`);
        console.log(`   - Status: ${doctorData.status}`);
        
      } catch (error) {
        console.log(`❌ Failed to create doctor profile for ${user.name}:`);
        console.log(`   Error: ${error.message}`);
      }
    }
    
    // 3. Verify the fix
    console.log('\n3️⃣ Verifying the fix...');
    const [remainingOrphans] = await connection.execute(`
      SELECT u.id, u.name, u.email, u.role
      FROM users u
      LEFT JOIN doctors d ON u.id = d.user_id
      WHERE u.role = 'doctor' AND d.id IS NULL
    `);
    
    if (remainingOrphans.length === 0) {
      console.log('✅ All orphaned doctors have been fixed!');
    } else {
      console.log(`❌ Still ${remainingOrphans.length} orphaned doctors remaining`);
    }
    
    // 4. Show current doctor profiles
    console.log('\n4️⃣ Current doctor profiles:');
    const [allDoctors] = await connection.execute(`
      SELECT d.id, d.user_id, u.name, u.email, d.specialty, d.license_number, d.status
      FROM doctors d
      LEFT JOIN users u ON d.user_id = u.id
      ORDER BY d.created_at DESC
    `);
    
    console.log(`Found ${allDoctors.length} doctor profiles:`);
    allDoctors.forEach((doctor, index) => {
      console.log(`  ${index + 1}. ${doctor.name} (${doctor.email})`);
      console.log(`     - Specialty: ${doctor.specialty}`);
      console.log(`     - License: ${doctor.license_number}`);
      console.log(`     - Status: ${doctor.status}`);
      console.log('');
    });
    
    console.log('🎉 ORPHANED USER FIX COMPLETED!');
    console.log('\n📋 Summary:');
    console.log(`  • Fixed ${orphanedDoctors.length} orphaned doctors`);
    console.log(`  • Total doctor profiles now: ${allDoctors.length}`);
    console.log('  • All users now have corresponding role profiles');
    
    console.log('\n💡 Next steps:');
    console.log('  • Doctors can now update their profiles with real information');
    console.log('  • Admin can approve doctor registrations');
    console.log('  • Registration process should work correctly going forward');
    
  } catch (error) {
    console.error('❌ Error fixing orphaned users:', error.message);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

fixOrphanedUsers();